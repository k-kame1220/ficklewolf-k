import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = "screenshots";
const PLAYBACK_TIMEOUT = 8000;

test.describe("バトル", () => {
  test("出撃確認 → バトル（攻撃・バフ）→ メニュー（ログ）→ リタイア → LOSE", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("早速ですがあなたの忌み名を教えてください。").fill("ゲスト");
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole("button", { name: "クエスト", exact: true }).click();
    await page.getByRole("button", { name: "メインクエスト" }).click();
    await page.getByRole("button", { name: "A" }).click();
    await page.getByRole("button", { name: "戦う" }).click();
    await expect(page).toHaveURL(/\/battle$/);
    await expect(page.getByText("せんとうをはじめてください")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-battle-start.png` });

    await page.getByRole("button", { name: "攻撃" }).click();
    await expect(page.getByText(/ZEROの攻撃。/u)).toBeVisible({ timeout: PLAYBACK_TIMEOUT });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-battle-attack.png` });
    await expect(page.getByText("2ターン目の攻撃を選択してください。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });

    await page.getByRole("button", { name: "バフ" }).click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-battle-buff.png` });
    await page.getByRole("button", { name: "攻撃バフ" }).click();
    await expect(page.getByText("3ターン目の攻撃を選択してください。")).toBeVisible({ timeout: PLAYBACK_TIMEOUT });

    await page.getByRole("button", { name: "menu" }).click();
    await page.getByRole("button", { name: "ログ" }).click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/15-battle-log.png` });
    await page.getByRole("button", { name: "もどる" }).click();
    await page.getByRole("button", { name: "リタイア" }).click();
    await page.getByRole("button", { name: "リタイアする" }).click();
    await expect(page.getByText("LOSE")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/16-battle-lose.png` });

    await page.getByRole("button", { name: /LOSE/u }).click();
    await expect(page).toHaveURL(/\/quests$/);
  });
});
