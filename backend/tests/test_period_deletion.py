"""Isolated endpoint tests: no PostgreSQL connection or migrations required.

Run directly with python tests/test_period_deletion.py.
"""
import sys
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.api.routers.periods import router
from app.db.session import get_db
from app.models.enums import PeriodStatus, UserRole
from app.models.evaluation_period import EvaluationPeriod
from app.schemas.auth import CurrentUser


class PeriodDeletionTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
        EvaluationPeriod.__table__.create(self.engine)
        with self.engine.begin() as connection:
            connection.execute(text("CREATE TABLE evaluation_records (id INTEGER PRIMARY KEY, period_id INTEGER)"))
        self.db = Session(self.engine)
        self.db.add(EvaluationPeriod(id=14, name="Test period", starts_on=date(2026, 8, 29),
                                    ends_on=date(2026, 9, 6), status=PeriodStatus.closed))
        self.db.commit()
        self.identity = CurrentUser(id=78, username="hr", display_name="HR", role=UserRole.hr,
                                    personnel_id=None, must_change_password=False)
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: self.identity
        self.client = TestClient(app)
        self.audit = patch("app.api.routers.periods.log_event").start()

    def tearDown(self):
        patch.stopall()
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def test_hr_deletes_empty_period_and_audits(self):
        response = self.client.delete("/api/periods/14")
        self.assertEqual(response.status_code, 204, response.text)
        self.assertIsNone(self.db.get(EvaluationPeriod, 14))
        self.assertEqual(self.audit.call_args.kwargs["event_type"], "period_deleted")
        self.assertEqual(self.audit.call_args.kwargs["actor_user_id"], 78)

    def test_linked_evaluations_are_preserved(self):
        self.db.execute(text("INSERT INTO evaluation_records VALUES (1, 14)"))
        self.db.commit()
        self.assertEqual(self.client.delete("/api/periods/14").status_code, 409)
        self.assertIsNotNone(self.db.get(EvaluationPeriod, 14))
        self.assertEqual(self.db.scalar(text("SELECT count(*) FROM evaluation_records")), 1)
        self.audit.assert_not_called()

    def test_non_hr_forbidden(self):
        for role in (UserRole.employee, UserRole.unit_supervisor, UserRole.deputy, UserRole.ceo, UserRole.support):
            self.identity = self.identity.model_copy(update={"role": role})
            self.assertEqual(self.client.delete("/api/periods/14").status_code, 403)
        self.assertIsNotNone(self.db.get(EvaluationPeriod, 14))

    def test_missing_period(self):
        self.assertEqual(self.client.delete("/api/periods/999").status_code, 404)


if __name__ == "__main__":
    unittest.main()
