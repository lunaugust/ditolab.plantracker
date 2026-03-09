import { test, expect } from "@playwright/test";
import { APP_VERSION, WHATS_NEW_STORAGE_KEY } from "../src/data/changelog";

test.describe("GymBuddy AI — E2E", () => {
  const dayOneExerciseName = "Sentadilla hack en prensa";

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(({ seenVersion, seenKey }) => {
      localStorage.clear();
      localStorage.setItem("gymbuddy_lang", "es");
      localStorage.setItem(seenKey, seenVersion);
    }, { seenVersion: APP_VERSION, seenKey: WHATS_NEW_STORAGE_KEY });
    await page.reload();

    // Wait for the app to load — header shows "GymBuddy"
    await expect(page.getByText("GymBuddy")).toBeVisible();
  });

  /* ================================================================
   * Plan view — default state
   * ================================================================ */
  test("renders the plan view by default with Day 1 exercises", async ({ page }) => {
    // Day 1 label and first exercise from the default training plan
    await expect(page.getByText("Cuádriceps · Femoral · Glúteos · Pantorrillas")).toBeVisible();
    await expect(page.getByText(dayOneExerciseName).first()).toBeVisible();
  });

  test("switches between day tabs", async ({ page }) => {
    // Day 2
    await page.getByText("Día 2").click();
    await expect(page.getByText("Espalda · Hombros Post. · Trapecio · Bíceps · Tríceps")).toBeVisible();

    // Day 3
    await page.getByText("Día 3").click();
    await expect(page.getByText("Pecho · Hombros · Femoral · Pantorrillas")).toBeVisible();

    // Back to Day 1
    await page.getByText("Día 1").click();
    await expect(page.getByText("Cuádriceps · Femoral · Glúteos · Pantorrillas")).toBeVisible();
  });

  /* ================================================================
   * Exercise detail — full-screen navigation
   * ================================================================ */
  test("clicking an exercise opens the full-screen detail view", async ({ page }) => {
    // Click the first exercise row in Day 1
    await page.getByText(dayOneExerciseName).first().click();

    // The detail view shows the exercise name and Log tab content
    await expect(page.getByText("Guardar registro")).toBeVisible();
    // Log and Progress tabs are visible
    await expect(page.getByText("Registrar")).toBeVisible();
    await expect(page.getByText("Progresión")).toBeVisible();
  });

  test("back button returns to plan view from exercise detail", async ({ page }) => {
    await page.getByText(dayOneExerciseName).first().click();
    await expect(page.getByText("Guardar registro")).toBeVisible();

    // Back button text comes from t("common.back") = "← volver"
    await page.getByText("← volver").click();
    await expect(page.getByText("Cuádriceps · Femoral · Glúteos · Pantorrillas")).toBeVisible();
  });

  /* ================================================================
   * Log flow — record, verify, persist
   * ================================================================ */
  test("full log workflow: record → appears in history → persists on reload", async ({ page }) => {
    // Navigate to exercise detail
    await page.getByText(dayOneExerciseName).first().click();
    await expect(page.getByText("Guardar registro")).toBeVisible();

    // Fill in weight and reps
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill("80");
    await inputs.nth(1).fill("12");

    // Submit
    await page.getByText("Guardar registro").click();

    // Verify entry appears in history
    await expect(page.getByText("80 kg")).toBeVisible();
    await expect(page.getByText("× 12 reps")).toBeVisible();

    // Verify save confirmation
    await expect(page.getByText("✓ Guardado")).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByText("GymBuddy")).toBeVisible();
    await page.getByText(dayOneExerciseName).first().click();

    await expect(page.getByText("80 kg")).toBeVisible();
    await expect(page.getByText("× 12 reps")).toBeVisible();
  });

  test("delete button removes a log entry", async ({ page }) => {
    // Add a log first
    await page.getByText(dayOneExerciseName).first().click();

    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill("50");
    await inputs.nth(1).fill("20");
    await page.getByText("Guardar registro").click();

    await expect(page.getByText("50 kg")).toBeVisible();

    // Click the delete (×) button on the log entry
    await page.locator("button[aria-label='Eliminar registro']").first().click();

    // Verify entry is gone
    await expect(page.getByText("Sin registros aún")).toBeVisible();
  });

  /* ================================================================
   * Progress tab
   * ================================================================ */
  test("progress tab shows 'sin datos' when there are no weight logs", async ({ page }) => {
    await page.getByText(dayOneExerciseName).first().click();

    // Switch to Progress tab
    await page.getByText("Progresión").click();
    await expect(page.getByText("Necesitás al menos 2 registros con peso para ver la progresión")).toBeVisible();
  });

  test("progress tab shows stats after 2+ weight entries", async ({ page }) => {
    // Seed two log entries via localStorage using the exercise id from Day 1
    await page.evaluate(() => {
      const logs = {
        d1_hack: [
          { date: "2026-01-01T10:00:00Z", weight: "60", reps: "12", notes: "" },
          { date: "2026-02-01T10:00:00Z", weight: "70", reps: "10", notes: "" },
        ],
      };
      localStorage.setItem("gymbuddy_logs", JSON.stringify(logs));
    });

    await page.reload();
    await expect(page.getByText("GymBuddy")).toBeVisible();

    // Open the d1_hack exercise (second warmup/main row pair)
    await page.getByText(dayOneExerciseName).nth(1).click();

    // Switch to Progress tab
    await page.getByText("Progresión").click();

    // Stats should appear
    await expect(page.getByText("Actual")).toBeVisible();
    await expect(page.getByText("Máximo")).toBeVisible();
    await expect(page.getByText("Mínimo")).toBeVisible();
  });
});
