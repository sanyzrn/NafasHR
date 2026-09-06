import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import { expect, it, vi } from "vitest";
import App from "./App";
import { navItemsFor } from "./components/nav";

const auth = vi.hoisted(() => ({ role: "support" }));
vi.mock("./auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, role: auth.role, personnel_id: 12 }, loading: false }),
}));
vi.mock("./auth/PermissionsContext", () => ({
  usePermissions: () => ({ can: () => true, moduleEnabled: () => true, loading: false }),
}));
vi.mock("./components/Layout", () => ({ Layout: () => <Outlet /> }));
vi.mock("./pages/hr/AdministrationPage", () => ({
  AdministrationPage: () => <p>Administration landing</p>,
}));
vi.mock("./pages/employee/MyEvaluationsPage", () => ({
  MyEvaluationsPage: () => <p>Personal assessment</p>,
}));

it("excludes admin from personal navigation and redirects a direct /me visit", async () => {
  auth.role = "support";
  expect(navItemsFor("support", () => true, () => true).some(item => item.to === "/me")).toBe(false);
  render(<MemoryRouter initialEntries={["/me"]}><App /></MemoryRouter>);
  expect(await screen.findByText("Administration landing")).toBeInTheDocument();
  expect(screen.queryByText("Personal assessment")).not.toBeInTheDocument();
});

it.each(["hr", "unit_supervisor", "employee"])("keeps personal access for %s", async role => {
  auth.role = role;
  expect(navItemsFor(role, () => true, () => true).some(item => item.to === "/me")).toBe(true);
  render(<MemoryRouter initialEntries={["/me"]}><App /></MemoryRouter>);
  expect(await screen.findByText("Personal assessment")).toBeInTheDocument();
});
