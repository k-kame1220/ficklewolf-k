import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API_BASE_URL } from "@/api/core/config";
import { createMockHandlers } from "@/api/mocks/handlers";
import { server } from "@/api/mocks/node";

import { createAppQueryClient } from "./queryClient";
import { createAppRouter } from "./router";

const renderApp = (path: string) => {
  const queryClient = createAppQueryClient(() => undefined);
  const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [path] }));
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  return { router, queryClient };
};

describe("起動の流れ", () => {
  it("アプリが古くなければ画面を出す（マスタはまとめて読まない）", async () => {
    const { queryClient } = renderApp("/");

    expect(await screen.findByRole("link", { name: "Tap to Start..." })).toBeInTheDocument();
    expect(queryClient.getQueryData(["app", "version"])).toBe("0.1.0");
  });

  it("アプリが最低バージョンより古ければ、アップデートを促す", async () => {
    server.use(http.get(`${API_BASE_URL}/app/version`, () => HttpResponse.json({ minAppVersion: "99.0.0" })));

    const { router } = renderApp("/");

    expect(await screen.findByText("最新のアップデートがあります。アップデートしてください。")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/update");
  });

  it("版の確認の通信に失敗し続けたらリトライの画面を出し、リトライで読み直す", { timeout: 10_000 }, async () => {
    server.use(http.get(`${API_BASE_URL}/app/version`, () => HttpResponse.error()));

    renderApp("/");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent("通信エラーが発生しました。");
    server.resetHandlers(...createMockHandlers());
    await userEvent.click(screen.getByRole("button", { name: "リトライ" }));
    expect(await screen.findByRole("link", { name: "Tap to Start..." })).toBeInTheDocument();
  });
});
