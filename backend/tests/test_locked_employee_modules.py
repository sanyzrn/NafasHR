"""Run directly: python tests/test_locked_employee_modules.py (no database writes)."""
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.api.routers.administration import list_modules, toggle_module
from app.api.routers.me import router as me_router
from app.db.session import get_db
from app.models.enums import DeliveryChannel, DeliveryStatus, UserRole
from app.schemas.administration import ModuleToggle
from app.schemas.auth import CurrentUser
from app.services.authorization import is_module_enabled, module_states
from app.services.delivery import enqueue_for, run_delivery_sweep
from app.services.notifications import notify, notify_for_workflow_action

LOCKED = {"objections", "employee_overview_cards", "employee_evaluation_visibility", "employee_result_acknowledgement"}


class LockedModulesTests(unittest.TestCase):
    def test_personal_result_endpoints_cannot_bypass_disabled_ui(self):
        app = FastAPI()
        app.include_router(me_router)
        app.dependency_overrides[get_db] = lambda: MagicMock()
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id=9, username="employee", role=UserRole.employee, personnel_id=9
        )
        with TestClient(app) as client:
            for path in ("/api/me/evaluations", "/api/me/evaluations/open"):
                self.assertEqual(client.get(path).status_code, 403)
            for path in ("/api/me/evaluations/1/object", "/api/me/evaluations/1/acknowledge"):
                self.assertEqual(client.post(path, json={"reason": "Test objection"}).status_code, 403)

    def test_stored_enabled_values_cannot_override_lock(self):
        db = MagicMock()
        db.scalars.return_value = [SimpleNamespace(key=key, enabled=True) for key in LOCKED]
        states = module_states(db)
        for key in LOCKED:
            self.assertFalse(states[key])
            self.assertFalse(is_module_enabled(db, key))
        self.assertTrue(states["self_assessment"])
        returned = list_modules(db=db, current_user=SimpleNamespace(id=1))
        self.assertEqual({m.key for m in returned if m.locked}, LOCKED)

    def test_even_admin_cannot_enable_locked_modules(self):
        for key in LOCKED:
            db = MagicMock()
            with self.assertRaises(HTTPException) as caught:
                toggle_module(key, ModuleToggle(enabled=True), db=db, current_user=SimpleNamespace(id=1))
            self.assertEqual(caught.exception.status_code, 403)
            db.commit.assert_not_called()

    def test_both_finalization_paths_keep_workflow_notifications_only(self):
        record = SimpleNamespace(id=4, evaluation_code="EV-4", subject=SimpleNamespace(full_name="Employee"),
                                 subject_personnel_id=9, unit_supervisor_user_id=2, deputy_user_id=3, ceo_user_id=5)
        for action in ("ceo_finalize", "hr_finalize_direct_ceo"):
            db = MagicMock()
            with patch("app.services.notifications.notify") as send:
                notify_for_workflow_action(db, record, action)
                send.assert_called_once()
                self.assertEqual(send.call_args.kwargs["type_"], f"workflow_{action}")
                db.scalars.assert_not_called()

    def test_no_in_app_or_outbound_notification_created(self):
        db = MagicMock()
        notify(db, [9], "evaluation_finalized_self", "Result ready")
        db.add.assert_not_called()
        self.assertEqual(enqueue_for(db, SimpleNamespace(type="evaluation_finalized_self")), 0)
        db.add.assert_not_called()

    def test_already_queued_result_notifications_are_not_sent(self):
        db = MagicMock()
        row = SimpleNamespace(id=1, notification_id=7, status=DeliveryStatus.pending,
                              channel=DeliveryChannel.email, last_attempt_at=None, attempts=0)
        db.scalars.return_value.all.return_value = [row]
        db.get.return_value = SimpleNamespace(type="evaluation_finalized_self")
        channel = MagicMock()
        with (
            patch("app.services.delivery.channels.available", return_value=[channel]),
            patch("app.services.delivery.channels.channel_for", return_value=channel),
        ):
            result = run_delivery_sweep(db)
        self.assertEqual(result["abandoned"], 1)
        channel.send.assert_not_called()
        self.assertEqual(row.status, DeliveryStatus.abandoned)


if __name__ == "__main__":
    unittest.main()
