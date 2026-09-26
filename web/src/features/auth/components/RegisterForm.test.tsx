import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { readAuthToken } from "@/api/core/authToken";
import { API_BASE_URL } from "@/api/core/config";
import { server } from "@/api/mocks/node";
import { renderWithQueryClient } from "@/test/render";

import RegisterForm from "./RegisterForm";

describe("RegisterForm", () => {
  it("名前を決めるとゲストを作り、onRegistered を呼ぶ", async () => {
    const onRegistered = vi.fn();
    renderWithQueryClient(<RegisterForm isAccountLost={false} onRegistered={onRegistered} />);

    await userEvent.type(screen.getByLabelText("なまえを教えて(6文字まで)"), "ゲスト");
    await userEvent.click(screen.getByRole("button", { name: "決定" }));

    await vi.waitFor(() => {
      expect(onRegistered).toHaveBeenCalledOnce();
    });
    expect(readAuthToken()).not.toBeNull();
  });

  it("7 文字は送らずにメッセージを出す", async () => {
    const onRegistered = vi.fn();
    renderWithQueryClient(<RegisterForm isAccountLost={false} onRegistered={onRegistered} />);

    await userEvent.type(screen.getByLabelText("なまえを教えて(6文字まで)"), "abcdefg");
    await userEvent.click(screen.getByRole("button", { name: "決定" }));

    expect(screen.getByRole("alert")).toHaveTextContent("なまえは6文字までです");
    expect(onRegistered).not.toHaveBeenCalled();
    expect(readAuthToken()).toBeNull();
  });

  it("空のときは送らずにメッセージを出す", async () => {
    renderWithQueryClient(<RegisterForm isAccountLost={false} onRegistered={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "決定" }));

    expect(screen.getByRole("alert")).toHaveTextContent("なまえを入れてください");
  });

  it("サーバが INVALID_NAME を返したらメッセージを出す", async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/guest`, () =>
        HttpResponse.json(
          { type: "about:blank", title: "Bad Request", status: 400, code: "INVALID_NAME" },
          { status: 400, headers: { "Content-Type": "application/problem+json" } }
        )
      )
    );
    const onRegistered = vi.fn();
    renderWithQueryClient(<RegisterForm isAccountLost={false} onRegistered={onRegistered} />);

    await userEvent.type(screen.getByLabelText("なまえを教えて(6文字まで)"), "ゲスト");
    await userEvent.click(screen.getByRole("button", { name: "決定" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("このなまえは使えません");
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it("通信に失敗したら通信エラーのメッセージを出す", async () => {
    server.use(http.post(`${API_BASE_URL}/auth/guest`, () => HttpResponse.error()));
    renderWithQueryClient(<RegisterForm isAccountLost={false} onRegistered={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("なまえを教えて(6文字まで)"), "ゲスト");
    await userEvent.click(screen.getByRole("button", { name: "決定" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("通信エラーが発生しました。");
  });

  it("アカウントが見つからなかったときはお知らせを出す", () => {
    renderWithQueryClient(<RegisterForm isAccountLost onRegistered={vi.fn()} />);

    expect(
      screen.getByText("データが見つかりませんでした。なまえを決めてはじめからあそんでください。")
    ).toBeInTheDocument();
  });
});
