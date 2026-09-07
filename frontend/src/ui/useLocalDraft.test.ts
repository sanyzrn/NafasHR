import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useLocalDraft, type FormDraft } from "./useLocalDraft";

const draft: FormDraft = { scores: { 1: 4 }, notes: { 1: "evidence" }, overallNote: "note" };
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

it("restores partial answers after reopening the form", () => {
  const first = renderHook(() => useLocalDraft("person:46"));
  act(() => first.result.current[1](draft));
  first.unmount();
  const second = renderHook(() => useLocalDraft("person:46"));
  expect(second.result.current[0]).toEqual(draft);
  expect(second.result.current[2]).toBe(false);
});

it("loads the correct draft when the person or contract changes", () => {
  localStorage.setItem("second", JSON.stringify(draft));
  const { result, rerender } = renderHook(({ storageKey }) => useLocalDraft(storageKey), { initialProps: { storageKey: "first" } });
  rerender({ storageKey: "second" });
  expect(result.current[0]).toEqual(draft);
  rerender({ storageKey: "third" });
  expect(result.current[0].scores).toEqual({});
  expect(localStorage.getItem("third")).toBeNull();
});

it("reports failed persistence without losing the in-memory answers and recovers on retry", () => {
  const { result } = renderHook(() => useLocalDraft("person:46"));
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota exceeded"); });
  act(() => result.current[1](draft));
  expect(result.current[0]).toEqual(draft);
  expect(result.current[2]).toBe(true);
  write.mockRestore();
  act(() => result.current[1](draft));
  expect(result.current[2]).toBe(false);
  expect(JSON.parse(localStorage.getItem("person:46")!)).toEqual(draft);
});
