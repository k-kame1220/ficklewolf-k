import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = "screenshots";

test.describe("ゲスト登録", () => {
  test("タイトル → 名前登録 → ホーム。読み直すとモックのアカウントが消え、名前登録に戻る", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "K" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-title.png` });

    await page.getByRole("link", { name: "Tap to Start..." }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByLabel("なまえを教えて(6文字まで)")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-register.png` });

    await page.getByLabel("なまえを教えて(6文字まで)").fill("abcdefg");
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page.getByRole("alert")).toHaveText("なまえは6文字までです");
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-register-error.png` });

    await page.getByLabel("なまえを教えて(6文字まで)").fill("ゲスト");
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("heading", { name: "ゲスト" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-home.png` });

    await page.reload();
    await expect(page).toHaveURL(/\/register\?reason=lost$/);
    await expect(page.getByText("データが見つかりませんでした。")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-account-lost.png` });
  });
});
