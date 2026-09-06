import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PeriodsPage } from "./PeriodsPage";

const mocks = vi.hoisted(() => ({ confirm: vi.fn(), remove: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("../../api/client", () => ({ apiClient: { delete: mocks.remove }, extractErrorMessage: () => "دوره دارای پرونده است" }));
vi.mock("../../components/ConfirmDialog", () => ({ useConfirm: () => mocks.confirm }));
vi.mock("../../components/Toast", () => ({ useToast: () => ({ showSuccess: mocks.success, showError: mocks.error }) }));
vi.mock("../../api/queries", () => ({
  usePeriods: () => ({ data: [{ id: 14, name: "تابستان", starts_on: "2026-08-29", ends_on: "2026-09-06", status: "closed" }] }),
  usePeriodProgress: () => ({ data: undefined }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.confirm.mockResolvedValue(true);
  mocks.remove.mockResolvedValue({});
});

function setup() {
  render(<QueryClientProvider client={new QueryClient()}><PeriodsPage /></QueryClientProvider>);
  return userEvent.setup();
}

it("deletes the selected period after confirmation", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "حذف دوره" }));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("/periods/14"));
  expect(mocks.confirm).toHaveBeenCalledWith(expect.objectContaining({ danger: true, title: "حذف دوره «تابستان»؟" }));
  await waitFor(() => expect(mocks.success).toHaveBeenCalled());
});

it("does not delete when confirmation is cancelled", async () => {
  mocks.confirm.mockResolvedValue(false);
  const user = setup();
  await user.click(screen.getByRole("button", { name: "حذف دوره" }));
  expect(mocks.remove).not.toHaveBeenCalled();
});

it("reports a linked-record conflict without showing success", async () => {
  mocks.remove.mockRejectedValue(new Error("conflict"));
  const user = setup();
  await user.click(screen.getByRole("button", { name: "حذف دوره" }));
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("دوره دارای پرونده است"));
  expect(mocks.success).not.toHaveBeenCalled();
});
