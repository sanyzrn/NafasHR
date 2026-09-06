"""Personal-access policy tests; runnable with unittest without a database."""
import unittest

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, require_own_personnel
from app.models.enums import UserRole
from app.schemas.auth import CurrentUser
from app.services.self_assessment import may_self_assess


class PersonalAccessPolicyTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()

        @self.app.get("/personal")
        def personal(user: CurrentUser = Depends(require_own_personnel)):
            return {"personnel_id": user.personnel_id}

        self.client = TestClient(self.app)
        self.addCleanup(self.client.close)

    def request_as(self, role, personnel_id):
        self.app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            id=1, username="policy-test", role=role, personnel_id=personnel_id
        )
        return self.client.get("/personal")

    def test_admin_is_excluded_even_when_linked_to_personnel(self):
        for personnel_id in (None, 12):
            with self.subTest(personnel_id=personnel_id):
                self.assertEqual(self.request_as(UserRole.support, personnel_id).status_code, 403)
        self.assertFalse(may_self_assess(UserRole.support))

    def test_hr_supervisor_and_employee_keep_personal_access(self):
        for role in (UserRole.hr, UserRole.unit_supervisor, UserRole.employee):
            with self.subTest(role=role):
                response = self.request_as(role, 12)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json(), {"personnel_id": 12})
                self.assertTrue(may_self_assess(role))

    def test_missing_personnel_link_still_denies_access(self):
        self.assertEqual(self.request_as(UserRole.hr, None).status_code, 403)
