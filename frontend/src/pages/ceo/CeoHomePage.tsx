import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient, extractConflictEvaluationId, extractErrorMessage } from "../../api/client";
import { usePersonnelList } from "../../api/queries";
import { EvaluationList } from "../../components/EvaluationList";
import { RoleOverviewCards } from "../../components/RoleOverviewCards";
import { PaginationControls } from "../../components/PaginationControls";
import { PageHeader } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Table } from "../../ui/Table";
import { useTableSort } from "../../ui/useTableSort";
import type { Personnel } from "../../types";

export function CeoHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sorting = useTableSort();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, error: loadError, isPending } = usePersonnelList({
    accessible_to_me: true,
    direct_reports_only: true,
    status: "active",
    limit: pageSize,
    offset: page * pageSize,
    sort_by: sorting.sort ? ["full_name", "job_title", "org_unit"][sorting.sort.column] : "full_name",
    sort_dir: sorting.sort?.direction ?? "asc",
  });

  async function startEvaluation(person: Personnel) {
    if (startingId !== null) return;
    setStartingId(person.id);
    setError(null);
    try {
      const { data: created } = await apiClient.post("/evaluations", { subject_personnel_id: person.id });
      await queryClient.invalidateQueries({ queryKey: ["personnel"] });
      navigate(`/evaluations/${created.id}`);
    } catch (err) {
      const existingId = extractConflictEvaluationId(err);
      if (existingId !== null) navigate(`/evaluations/${existingId}`);
      else setError(extractErrorMessage(err));
    } finally {
      setStartingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="ارزیابی و تأیید مدیرعامل" subtitle="ارزیابی افراد مستقیم و بررسی پرونده‌های منتظر تأیید نهایی" />
      <RoleOverviewCards />
      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-bold text-gray-900">افراد تحت ارزیابی مستقیم شما</h2>
        <p className="text-xs leading-6 text-gray-500">ارزیابی این افراد را شما آغاز و امتیازدهی می‌کنید؛ تأیید نهایی با منابع انسانی است.</p>
        {(error || loadError) && <p role="alert" className="text-sm text-red-600">{error || extractErrorMessage(loadError)}</p>}
        {isPending ? <p className="text-sm text-gray-500">در حال بارگذاری…</p> : <>
          <Table
            bordered={false}
            headers={["نام", "عنوان شغلی", "واحد", ""]}
            sort={sorting.sort}
            sortableColumns={[0, 1, 2]}
            onSort={(column) => { sorting.onSort(column); setPage(0); }}
            rowKeys={(data?.items ?? []).map(p => p.id)}
            emptyMessage="فردی برای ارزیابی مستقیم به شما اختصاص داده نشده است."
            rows={(data?.items ?? []).map(p => [
              p.full_name, p.job_title, p.org_unit,
              p.open_evaluation_id ? (
                <Button key="action" variant="secondary" onClick={() => navigate(`/evaluations/${p.open_evaluation_id}`)}>مشاهدهٔ ارزیابی جاری</Button>
              ) : (
                <Button key="action" variant="secondary" loading={startingId === p.id} disabled={startingId !== null} onClick={() => startEvaluation(p)}>شروع ارزیابی</Button>
              ),
            ])}
          />
          <PaginationControls page={page} pageSize={pageSize} totalCount={data?.total ?? 0}
            totalPages={Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))} onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(0); }} />
        </>}
      </section>
      <EvaluationList
        title="پرونده‌های ارزیابی"
        tabs={[
          { key: "pending", label: "در انتظار تأیید نهایی", status: "deputy_approved" },
          { key: "finalized", label: "نهایی‌شده", status: "finalized" },
          { key: "all", label: "همهٔ پرونده‌های من" },
        ]}
      />
    </div>
  );
}
