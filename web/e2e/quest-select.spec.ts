import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = "screenshots";

test.describe("クエストを選ぶ", () => {
  test("ホーム → クエスト → メイン / イベントの一覧 → 出撃確認", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("早速ですがあなたの忌み名を教えてください。").fill("ゲスト");
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole("button", { name: "クエスト", exact: true }).click();
    await expect(page).toHaveURL(/\/quests$/);
    await expect(page.getByRole("button", { name: "メインクエスト" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-quest-menu.png` });

    await page.getByRole("button", { name: "イベントクエスト" }).click();
    await expect(page.getByRole("button", { name: /素材クエスト：音/u })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-quest-event.png` });

    await page.getByRole("button", { name: "クエスト", exact: true }).click();
    await page.getByRole("button", { name: "メインクエスト" }).click();
    await expect(page.getByRole("button", { name: "A" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-quest-main.png` });

    await page.getByRole("button", { name: "A" }).click();
    await expect(page).toHaveURL(/\/quests\/main-a$/);
    await expect(page.getByRole("button", { name: "戦う" })).toBeDisabled();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-sortie-confirm.png` });
  });
});
