import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CeoHomePage } from "./CeoHomePage";

const mocks = vi.hoisted(() => ({ list: vi.fn(), post: vi.fn(), navigate: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("../../api/queries", () => ({ usePersonnelList: mocks.list }));
vi.mock("../../api/client", () => ({ apiClient: { post: mocks.post }, extractConflictEvaluationId: () => null, extractErrorMessage: () => "خطا" }));
vi.mock("../../components/EvaluationList", () => ({ EvaluationList: () => <div>صندوق تأیید</div> }));
vi.mock("../../components/RoleOverviewCards", () => ({ RoleOverviewCards: () => null }));

const names = ["سمن فلاح سلطانی", "آرمین رهنما راد", "پریسا خدابنده", "سید محمدعلی آقا سیدعلی دربندی"];
beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockReturnValue({ data: { total: 4, items: names.map((full_name, id) => ({ id, full_name, job_title: "کارشناس", org_unit: "مدیریت", is_manager: id % 2 === 0, open_evaluation_id: null })) } });
  mocks.post.mockResolvedValue({ data: { id: 901 } });
});
function setup() {
  render(<QueryClientProvider client={new QueryClient()}><CeoHomePage /></QueryClientProvider>);
  return userEvent.setup();
}
it("shows all direct reports irrespective of the personnel manager flag", () => {
  setup();
  for (const name of names) expect(screen.getByText(name)).toBeInTheDocument();
  expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ direct_reports_only: true, accessible_to_me: true, status: "active" }));
  expect(screen.getAllByRole("button", { name: "شروع ارزیابی" })).toHaveLength(4);
  expect(mocks.post).not.toHaveBeenCalled();
});
it("starts an evaluation only on request", async () => {
  const user = setup();
  await user.click(screen.getAllByRole("button", { name: "شروع ارزیابی" })[0]!);
  await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/evaluations", { subject_personnel_id: 0 }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/evaluations/901"));
});
it("opens existing evaluations without creating duplicates", async () => {
  mocks.list.mockReturnValue({ data: { total: 1, items: [{ id: 39, full_name: names[1], open_evaluation_id: 902 }] } });
  const user = setup();
  await user.click(screen.getByRole("button", { name: "مشاهدهٔ ارزیابی جاری" }));
  expect(mocks.navigate).toHaveBeenCalledWith("/evaluations/902");
  expect(mocks.post).not.toHaveBeenCalled();
});
