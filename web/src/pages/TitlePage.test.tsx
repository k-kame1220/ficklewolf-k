import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import TitlePage from "./TitlePage";

const renderTitle = () => {
  const rootRoute = createRootRoute();
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "/", component: TitlePage }),
      createRoute({ getParentRoute: () => rootRoute, path: "/home", component: () => <p>home</p> })
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] })
  });
  render(<RouterProvider router={router} />);
  return router;
};

describe("TitlePage", () => {
  it("タイトルと開始ボタンを表示する", async () => {
    renderTitle();

    expect(await screen.findByRole("heading", { name: "K" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tap to Start..." })).toBeInTheDocument();
  });

  it("開始するとホームへ進む（トークンが無ければホームのルートが名前登録へ回す）", async () => {
    const router = renderTitle();

    await userEvent.click(await screen.findByRole("link", { name: "Tap to Start..." }));

    expect(await screen.findByText("home")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/home");
  });
});
