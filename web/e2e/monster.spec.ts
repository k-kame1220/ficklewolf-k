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
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-monster-list.png` });

    await page.getByRole("button", { name: "ZERO" }).click({ button: "right" });
    await expect(page).toHaveURL(/\/monsters\/zero$/);
    await expect(page.getByText("属性：月")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-monster-detail.png` });
  });
});
