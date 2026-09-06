import { useState } from "react";

export type TableSort = { column: number; direction: "asc" | "desc" } | null;
export type SortValue = string | number | boolean | null | undefined;
const persian = new Intl.Collator("fa", { sensitivity: "base", numeric: true });
const normalize = (value: string) => value.trim().replace(/ي/g, "ی").replace(/ك/g, "ک");

export function sortRows<T>(rows: readonly T[], sort: TableSort, values: ((row: T) => SortValue)[]): T[] {
  if (!sort) return [...rows];
  const value = values[sort.column];
  if (!value) return [...rows];
  return [...rows].sort((a, b) => {
    const left = value(a), right = value(b);
    if (left == null) return right == null ? 0 : 1;
    if (right == null) return -1;
    const result = typeof left === "number" && typeof right === "number"
      ? left - right
      : persian.compare(normalize(String(left)), normalize(String(right)));
    return sort.direction === "asc" ? result : -result;
  });
}

export function useTableSort() {
  const [sort, setSort] = useState<TableSort>(null);
  function onSort(column: number) {
    setSort((previous) => ({ column, direction: previous?.column === column && previous.direction === "asc" ? "desc" : "asc" }));
  }
  return { sort, onSort };
}
