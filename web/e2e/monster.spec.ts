import { expect, test } from "@playwright/test";

const SCREENSHOT_DIR = "screenshots";

test.describe("モンスター", () => {
  test("ホーム → モンスターの一覧 → 長押し（右クリック）で詳細", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("早速ですがあなたの忌み名を教えてください。").fill("ゲスト");
    await page.getByRole("button", { name: "決定" }).click();
    await expect(page).toHaveURL(/\/home$/);

    await page.getByRole("button", { name: "モンスター" }).click();
    await expect(page).toHaveURL(/\/monsters$/);
    await expect(page.getByRole("button", { name: "ZERO" })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-monster-list.png`, fullPage: true });

    await page.getByRole("button", { name: "アイテム表示" }).click();
    await expect(page).toHaveURL(/\/items$/);
    await expect(page.getByText("HPの酒")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-item-list.png`, fullPage: true });
    await page.getByRole("button", { name: "とじる" }).click();
    await expect(page).toHaveURL(/\/monsters$/);

    await page.getByRole("button", { name: "ZERO" }).click({ button: "right" });
    await expect(page).toHaveURL(/\/monsters\/zero$/);
    await expect(page.getByText("1000(+0)")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-monster-detail.png`, fullPage: true });

    await page.getByRole("button", { name: "HPの酒をふやす" }).click();
    await page.getByRole("button", { name: "HPの酒をふやす" }).click();
    await page.getByRole("button", { name: "使う" }).first().click();
    await expect(page.getByText("1084(+84)")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-monster-enhanced.png`, fullPage: true });
  });
});
