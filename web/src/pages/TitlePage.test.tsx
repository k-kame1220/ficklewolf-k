import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TitlePage from "./TitlePage";

describe("TitlePage", () => {
  it("タイトルと開始ボタンを表示する", () => {
    render(<TitlePage />);

    expect(screen.getByRole("heading", { name: "K" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tap to Start..." })).toBeInTheDocument();
  });
});
