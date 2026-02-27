import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import type { Mock } from "vitest";
import type { ReactNode } from "react";

vi.mock("../services/authService", () => ({
  isAuthEnabled: vi.fn(() => false),
  subscribeToAuthState: vi.fn(() => () => {}),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(),
}));

/* ================================================================
 * Mock storageService — always resolve with empty logs by default
 * ================================================================ */
vi.mock("../services/storageService", async () => {
  const { TRAINING_PLAN } = await vi.importActual("../data/trainingPlan");
  const mockPlan = {
    metadata: {
      id: "plan_test",
      name: "Test Plan",
      ownerId: "guest",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isShared: false,
      sharedWith: [],
      source: "manual" as const,
    },
    plan: TRAINING_PLAN,
  };
  return {
    loadLogs: vi.fn().mockResolvedValue({}),
    persistLogs: vi.fn().mockResolvedValue(undefined),
    loadTrainingPlan: vi.fn().mockResolvedValue(TRAINING_PLAN),
    persistTrainingPlan: vi.fn().mockResolvedValue(undefined),
    // Multi-plan functions
    getActivePlanId: vi.fn().mockResolvedValue("plan_test"),
    setActivePlanId: vi.fn().mockResolvedValue(undefined),
    listPlans: vi.fn().mockResolvedValue([mockPlan.metadata]),
    loadPlanById: vi.fn().mockResolvedValue(mockPlan),
    savePlan: vi.fn().mockResolvedValue(undefined),
    deletePlan: vi.fn().mockResolvedValue(undefined),
    sharePlan: vi.fn().mockResolvedValue(undefined),
    copyPlan: vi.fn().mockResolvedValue("plan_copy"),
  };
});

import { loadLogs, persistLogs } from "../services/storageService";

const mockLoadLogs = loadLogs as unknown as Mock;
const mockPersistLogs = persistLogs as unknown as Mock;

/* Mock recharts ResponsiveContainer (it needs a real DOM size) */
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 400, height: 220 }}>
        {children}
      </div>
    ),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadLogs.mockResolvedValue({});
});

/** Wait for the plan to load by looking for exercise metadata (sets/reps are never localized). */
async function waitForPlanLoad() {
  // First exercise is "sled hack squat", sets: "2", reps: "15-20", rest: "60s"
  await screen.findByText(/15-20 reps/, {}, { timeout: 3000 });
}

/**
 * Click the first exercise row.
 * ExerciseRow's onClick is on the outermost div. We find the exercise metadata
 * text, then walk up to the clickable row wrapper.
 */
async function clickFirstExercise(user: ReturnType<typeof userEvent.setup>) {
  const metaEl = await screen.findByText(/15-20 reps/, {}, { timeout: 3000 });
  // Walk up from the meta <div> to the ExerciseRow root <div> with onClick
  let el = metaEl.parentElement;
  while (el && !el.onclick) {
    el = el.parentElement;
  }
  await user.click(el || metaEl);
}

/* ================================================================
 * App rendering
 * ================================================================ */
describe("App", () => {
  it("shows loading screen then renders the plan view", async () => {
    render(<App />);

    // Loading initially
    expect(screen.getByText("GymBuddy AI")).toBeTruthy();

    // After load, plan view shows day tabs
    await waitForPlanLoad();
    expect(screen.getByText("GymBuddy")).toBeTruthy();
  });

  it("shows day tabs for each training day", async () => {
    render(<App />);
    await waitForPlanLoad();

    expect(screen.getAllByText("Día 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Día 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Día 3").length).toBeGreaterThan(0);
  });

  it("switches between day tabs", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForPlanLoad();

    // Day 2 tab
    await user.click(screen.getByText("Día 2"));
    // Day 2 has "cable pulldown" / "Jalón en polea" as an exercise
    await screen.findByText(
      (text) => text.includes("cable pulldown") || text.includes("Jal\u00f3n en polea"),
      {},
      { timeout: 3000 },
    );
  });
});

/* ================================================================
 * Exercise Detail — full-screen navigation on exercise click
 * ================================================================ */
describe("Exercise Detail", () => {
  it("clicks an exercise and shows the detail view with log form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForPlanLoad();

    // Click the first exercise
    await clickFirstExercise(user);

    // ExerciseDetailView should show tabs and the form
    expect(screen.getByText("Registrar")).toBeTruthy();
    expect(screen.getByText("Progresión")).toBeTruthy();
    expect(screen.getByText("Guardar registro")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ej: técnica mejorada, RPE 8...")).toBeTruthy();
  });

  it("saves a log entry when submitting the form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForPlanLoad();

    await clickFirstExercise(user);

    // Fill form
    const [weightInput, repsInput] = screen.getAllByRole("spinbutton");
    await user.type(weightInput, "100");
    await user.type(repsInput, "8");
    await user.type(
      screen.getByPlaceholderText("Ej: técnica mejorada, RPE 8..."),
      "Felt great",
    );

    // Submit
    await user.click(screen.getByText("Guardar registro"));

    // Verify persistLogs was called
    expect(persistLogs).toHaveBeenCalledTimes(1);
    const persisted = mockPersistLogs.mock.calls[0][0];
    expect(persisted["d1_hack_warmup"]).toBeDefined();
    expect(persisted["d1_hack_warmup"][0].weight).toBe("100");
    expect(persisted["d1_hack_warmup"][0].reps).toBe("8");
  });

  it("back button returns to plan view", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForPlanLoad();

    await clickFirstExercise(user);
    expect(screen.getByText("Guardar registro")).toBeTruthy();

    // Click back button
    await user.click(screen.getByText("← volver"));

    // Should be back on the plan view with day tabs
    expect(screen.getAllByText("Día 1").length).toBeGreaterThan(0);
  });

  it("weight adjustment buttons change weight by ±2.5", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitForPlanLoad();

    await clickFirstExercise(user);

    // Click +2.5 button
    await user.click(screen.getByText("+2.5"));
    const [weightInput] = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(weightInput.value).toBe("2.5");

    // Click +2.5 again
    await user.click(screen.getByText("+2.5"));
    expect((screen.getAllByRole("spinbutton")[0] as HTMLInputElement).value).toBe("5");

    // Click -2.5
    await user.click(screen.getByText("-2.5"));
    expect((screen.getAllByRole("spinbutton")[0] as HTMLInputElement).value).toBe("2.5");
  });
});
