"""Integration coverage of deployed locks; deliberately no feature-unlock fixture."""
import pytest
from sqlalchemy import select

from app.models.enums import Capability, EvaluationStatus
from app.models.evaluation import EvaluationRecord
from app.models.module import ModuleSetting
from app.models.notification import Notification
from tests.helpers import auth_header, make_access, make_personnel, make_user
from tests.test_employee_self_view import _finalize_evaluation, _make_chain

LOCKED = (
    "objections", "employee_overview_cards", "employee_evaluation_visibility",
    "employee_result_acknowledgement",
)


@pytest.mark.parametrize("role", ["employee", "hr", "unit_supervisor"])
def test_locked_results_stay_private_after_real_finalization(client, db_session, role):
    hr, sup, dep, ceo = _make_chain(db_session)
    person = make_personnel(db_session)
    make_access(db_session, person, sup, dep, ceo)
    subject = make_user(db_session, role, personnel_id=person.id)
    # Even stale "enabled" rows must not override deployment-level locks.
    for key in LOCKED:
        db_session.merge(ModuleSetting(key=key, enabled=True))
    db_session.commit()
    record_id = _finalize_evaluation(client, db_session, hr, sup, dep, ceo, person)
    record = db_session.get(EvaluationRecord, record_id)
    assert record.status == EvaluationStatus.finalized

    headers = auth_header(subject)
    for path in ("/api/me/evaluations", "/api/me/evaluations/open"):
        assert client.get(path, headers=headers).status_code == 403
    for action in ("object", "acknowledge"):
        response = client.post(
            f"/api/me/evaluations/{record_id}/{action}",
            json={"reason": "Cannot bypass the lock"}, headers=headers,
        )
        assert response.status_code == 403
    if role == "employee":
        for path in ("/api/evaluations", "/api/dashboard/role-overview"):
            assert client.get(path, headers=headers).status_code == 403
    # Independent self-assessment is still available, even with result modules locked.
    assert client.get("/api/me/self-assessment/current", headers=headers).status_code == 200
    db_session.refresh(record)
    assert record.acknowledged_at is None
    assert record.objection_at is None
    notifications = list(db_session.scalars(
        select(Notification).where(Notification.evaluation_record_id == record_id)
    ))
    assert not any(note.type == "evaluation_finalized_self" for note in notifications)
    assert any(note.type == "workflow_ceo_finalize" for note in notifications)


def test_admin_cannot_unlock_modules_through_api(client, db_session):
    admin = make_user(db_session, "support", capabilities=[Capability.manage_modules])
    db_session.commit()
    headers = auth_header(admin)
    for key in LOCKED:
        response = client.put(
            f"/api/administration/modules/{key}", json={"enabled": True}, headers=headers,
        )
        assert response.status_code == 403
    response = client.get("/api/administration/modules", headers=headers)
    assert response.status_code == 200
    states = {row["key"]: row for row in response.json()}
    for key in LOCKED:
        assert states[key]["locked"] is True
        assert states[key]["enabled"] is False
