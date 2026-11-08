import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = "screenshots";
const PLAYBACK_TIMEOUT = 8000;

test.describe("バトルのチェック・リターン・みえーるみえーる", () => {
  test("みえーるみえーる → チェック → リターン", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("早速ですがあなたの忌み名を教えてください。").fill("ゲスト");
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await page.getByRole("button", { name: "クエスト", exact: true }).click();
    await page.getByRole("button", { name: "メインクエスト" }).click();
    await page.getByRole("button", { name: "A" }).click();
    await page.getByRole("button", { name: "戦う" }).click();
    await expect(page.getByText("せんとうをはじめてください")).toBeVisible();

    await page.getByRole("button", { name: "みえーるみえーる（あと1回）" }).click();
    await expect(page.getByRole("list", { name: "敵の行動" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/17-battle-reveal.png` });

    await page.getByRole("button", { name: "攻撃" }).click();
    await expect(page.getByText("2ターン目の攻撃を選択してください。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });
    await page.getByRole("button", { name: "チェック" }).click();
    await expect(page.getByText("チェックしました。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });
    await expect(page.getByText("2ターン目の攻撃を選択してください。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/18-battle-check.png` });

    await page.getByRole("button", { name: "防御" }).click();
    await expect(page.getByText("3ターン目の攻撃を選択してください。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });
    await page.getByRole("button", { name: "リターン" }).click();
    await expect(page.getByText("どこにリターンしますか。")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/19-battle-rewind.png` });
    await page.getByRole("group", { name: "リターンする先" }).getByRole("button", { name: "2ターン目" }).click();
    await expect(page.getByText("リターンしました。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });
    await expect(page.getByText("2ターン目の攻撃を選択してください。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });
  });
});
