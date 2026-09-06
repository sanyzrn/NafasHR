import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { ConfirmProvider } from "../../components/ConfirmDialog";
import { ToastProvider } from "../../components/Toast";
import { PersonnelPage } from "./PersonnelPage";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: 100, role: "hr" }, loading: false }),
}));

vi.mock("../../api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/client")>();
  return {
    ...actual,
    apiClient: { ...actual.apiClient, get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn() },
  };
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>
          <ConfirmProvider>
            <PersonnelPage />
          </ConfirmProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const SAMPLE_PERSONNEL = {
  id: 1,
  personnel_code: "P-1",
  full_name: "کارمند تست",
  job_title: "کارشناس",
  is_manager: false,
  org_unit: "واحد فروش",
  contract_start_date: "2025-01-01",
  contract_end_date: "2026-01-01",
  status: "active" as const,
  created_at: "",
  updated_at: "",
};

describe("PersonnelPage edit modal", () => {
  it("opens the edit modal and submits an updated job title + status", async () => {
    const getMock = vi.mocked(apiClient.get);
    const patchMock = vi.mocked(apiClient.patch);
    const putMock = vi.mocked(apiClient.put);
    getMock.mockImplementation(async (url: string) => {
      if (url === "/personnel") {
        return { data: { total: 1, items: [SAMPLE_PERSONNEL] } };
      }
      if (url === "/users") {
        return { data: { total: 3, items: [
          { id: 1, username: "1740841409", display_name: "علی رضایی", role: "unit_supervisor" },
          { id: 2, username: "0070094829", display_name: "زهرا احمدی", role: "deputy" },
          { id: 3, username: "0011600632", display_name: "حسن کریمی", role: "ceo" },
        ] } };
      }
      // دسترسی موجود پرسنل که مودال ویرایش هنگام باز شدن بارگذاری می‌کند
      if (url === "/personnel/1/access") {
        return {
          data: { unit_supervisor_user_id: null, deputy_user_id: 2, ceo_user_id: 3 },
        };
      }
      throw new Error(`unexpected GET ${url}`);
    });
    patchMock.mockResolvedValue({ data: {} });
    putMock.mockResolvedValue({ data: {} });

    renderPage();

    await screen.findByText("کارمند تست");
    await userEvent.click(screen.getByRole("button", { name: "ویرایش و دسترسی" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ویرایش پرسنل: کارمند تست")).toBeInTheDocument();
    await waitFor(() => {
      expect(within(dialog).getByRole("option", { name: "علی رضایی" })).toHaveValue("1");
      expect(within(dialog).getByRole("option", { name: "زهرا احمدی" })).toHaveValue("2");
      expect(within(dialog).getByRole("option", { name: "حسن کریمی" })).toHaveValue("3");
    });
    expect(within(dialog).queryByRole("option", { name: "0070094829" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: "معاونت" })).toHaveValue("2");
    expect(within(dialog).getByRole("combobox", { name: "مدیرعامل" })).toHaveValue("3");

    const jobTitleInput = within(dialog).getByLabelText("عنوان شغلی");
    await userEvent.clear(jobTitleInput);
    await userEvent.type(jobTitleInput, "کارشناس ارشد");
    await userEvent.selectOptions(within(dialog).getByLabelText("وضعیت"), "inactive");
    await userEvent.click(within(dialog).getByRole("button", { name: "ذخیره" }));

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith(
        "/personnel/1",
        expect.objectContaining({ job_title: "کارشناس ارشد", status: "inactive" })
      )
    );
  });
});
