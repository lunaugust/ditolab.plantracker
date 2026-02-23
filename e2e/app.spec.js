import { test, expect } from "@playwright/test";

test.describe("GymBuddy AI — E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any leftover localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for the app to load
    await expect(page.getByText("Augusto")).toBeVisible();
  });

  /* ================================================================
   * Navigation
   * ================================================================ */
  test("renders the plan view by default with Day 1 exercises", async ({ page }) => {
    await expect(page.getByText("Sentadilla Hack (calentamiento)")).toBeVisible();
    await expect(page.getByText("Cuádriceps · Femoral · Glúteos · Pantorrillas")).toBeVisible();
  });

  test("switches between day tabs", async ({ page }) => {
    await page.getByText("Día 2").click();
    await expect(page.getByText("Face Pulls en Polea Alta")).toBeVisible();

    await page.getByText("Día 3").click();
    await expect(page.getByText("Press Banco Plano con Barra")).toBeVisible();

    await page.getByText("Día 1").click();
    await expect(page.getByText("Sentadilla Hack", { exact: true })).toBeVisible();
  });

  test("navigates to Log view and back to Plan", async ({ page }) => {
    await page.getByText("Registrar").click();
    await expect(page.getByText("SELECCIONÁ UN EJERCICIO")).toBeVisible();

    await page.getByRole("button", { name: "Plan" }).click();
    await expect(page.getByText("Cuádriceps · Femoral · Glúteos · Pantorrillas")).toBeVisible();
  });

  test("navigates to Progresión view", async ({ page }) => {
    await page.getByText("Progresión").click();
    await expect(page.getByText("PROGRESIÓN DE PESO")).toBeVisible();
  });

  /* ================================================================
   * Log flow — record, verify, delete
   * ================================================================ */
  test("full log workflow: record → appears in history → persists on reload", async ({ page }) => {
    // Go to log view
    await page.getByText("Registrar").click();
    await expect(page.getByText("SELECCIONÁ UN EJERCICIO")).toBeVisible();

    // Select first exercise
    await page.getByText("Sentadilla Hack (calentamiento)").click();
    await expect(page.getByText("Guardar registro")).toBeVisible();

    // Fill in weight and reps
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill("80");
    await inputs.nth(1).fill("15");
    await page.getByPlaceholder("Ej: técnica mejorada, RPE 8...").fill("Buen calentamiento");

    // Submit
    await page.getByText("Guardar registro").click();

    // Verify it appears in history
    await expect(page.getByText("80 kg")).toBeVisible();
    await expect(page.getByText("× 15 reps")).toBeVisible();
    await expect(page.getByText("Buen calentamiento")).toBeVisible();

    // Verify save confirmation
    await expect(page.getByText("✓ Guardado")).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await page.getByText("Registrar").click();
    await page.getByText("Sentadilla Hack (calentamiento)").click();

    await expect(page.getByText("80 kg")).toBeVisible();
    await expect(page.getByText("× 15 reps")).toBeVisible();
  });

  test("delete button removes a log entry", async ({ page }) => {
    // First, add a log
    await page.getByText("Registrar").click();
    await page.getByText("Sentadilla Hack (calentamiento)").click();

    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill("50");
    await inputs.nth(1).fill("20");
    await page.getByText("Guardar registro").click();

    await expect(page.getByText("50 kg")).toBeVisible();

    // Hover to reveal delete button and click it
    const logEntry = page.locator("text=50 kg").locator("..");
    await logEntry.hover();
    await page.locator("button:has-text('×')").click();

    // Verify entry is gone
    await expect(page.getByText("Sin registros aún")).toBeVisible();
  });

  /* ================================================================
   * Progress view
   * ================================================================ */
  test("progress view shows 'sin datos' for exercises without logs", async ({ page }) => {
    await page.getByText("Progresión").click();
    await expect(page.getByText("sin datos").first()).toBeVisible();
  });

  test("progress view shows chart after 2+ weight entries", async ({ page }) => {
    // Seed two log entries via localStorage
    await page.evaluate(() => {
      const logs = {
        d1_hack: [
          { date: "2026-01-01T10:00:00Z", weight: "60", reps: "12", notes: "" },
          { date: "2026-02-01T10:00:00Z", weight: "70", reps: "10", notes: "" },
        ],
      };
      localStorage.setItem("augusto_logs", JSON.stringify(logs));
    });

    await page.reload();
    await page.getByText("Progresión").click();

    // The exercise with data should show
    await expect(page.getByText("70 kg")).toBeVisible();
    await expect(page.getByText("+10.0 kg")).toBeVisible();

    // Click into detail
    await page.getByText("Sentadilla Hack", { exact: true }).click();

    // Stats should appear
    await expect(page.getByText("Actual")).toBeVisible();
    await expect(page.getByText("Máximo")).toBeVisible();
    await expect(page.getByText("Mínimo")).toBeVisible();
  });

  /* ================================================================
   * Back button
   * ================================================================ */
  test("back button returns to exercise list in log view", async ({ page }) => {
    await page.getByText("Registrar").click();
    await page.getByText("Sentadilla Hack (calentamiento)").click();
    await expect(page.getByText("Guardar registro")).toBeVisible();

    await page.getByText("← volver").click();
    await expect(page.getByText("SELECCIONÁ UN EJERCICIO")).toBeVisible();
  });
});
