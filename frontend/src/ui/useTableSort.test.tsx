import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Table } from "./Table";
import { sortRows, useTableSort } from "./useTableSort";

vi.mock("./useMediaQuery", () => ({ NARROW_QUERY: "", useMediaQuery: () => false }));

it("orders Persian letters and Arabic variants, without mutating data", () => {
  const names = ["گلاب", "چکامه", "پریسا", "بهار", "احمد"];
  expect(sortRows(names, { column: 0, direction: "asc" }, [v => v])).toEqual(["احمد", "بهار", "پریسا", "چکامه", "گلاب"]);
  expect(names[0]).toBe("گلاب");
  expect(sortRows(["کیان", "كيان"], { column: 0, direction: "asc" }, [v => v])).toEqual(["کیان", "كيان"]);
});

it("sorts numbers numerically and keeps null values last", () => {
  expect(sortRows([2, null, 10], { column: 0, direction: "desc" }, [v => v])).toEqual([10, 2, null]);
});

it("uses ascending on first click, descending on second, and ascending for a new column", async () => {
  function Example() {
    const sorting = useTableSort();
    return <Table headers={["نام", "واحد"]} rows={[["احمد", "فروش"]]} sortableColumns={[0, 1]} {...sorting} />;
  }
  render(<Example />);
  const user = userEvent.setup();
  const nameHeader = screen.getByRole("columnheader", { name: /نام/ });
  await user.click(screen.getByRole("button", { name: /نام/ }));
  expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  await user.click(screen.getByRole("button", { name: /نام/ }));
  expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  await user.click(screen.getByRole("button", { name: /واحد/ }));
  expect(screen.getByRole("columnheader", { name: /واحد/ })).toHaveAttribute("aria-sort", "ascending");
  expect(nameHeader).toHaveAttribute("aria-sort", "none");
});
