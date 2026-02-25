import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

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
  return {
    loadLogs: vi.fn().mockResolvedValue({}),
    persistLogs: vi.fn().mockResolvedValue(undefined),
    loadTrainingPlan: vi.fn().mockResolvedValue(TRAINING_PLAN),
    persistTrainingPlan: vi.fn().mockResolvedValue(undefined),
  };
});

import { loadLogs, persistLogs } from "../services/storageService";

/* Mock recharts ResponsiveContainer (it needs a real DOM size) */
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container" style={{ width: 400, height: 220 }}>
        {children}
      </div>
    ),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  loadLogs.mockResolvedValue({});
  // Prototype A (inline accordion) is the default
  localStorage.setItem("gymbuddy_proto", "A");
});

/* ================================================================
 * App rendering
 * ================================================================ */
describe("App", () => {
  it("shows loading screen then renders the plan view", async () => {
    render(<App />);

    // Loading initially
    expect(screen.getByText("GymBuddy AI")).toBeTruthy();

    // After load, plan view shows first day exercises
    expect(await screen.findByText("Sentadilla Hack (calentamiento)")).toBeTruthy();
    expect(screen.getByText("GymBuddy")).toBeTruthy();
  });

  it("renders only the Plan navigation tab", async () => {
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    expect(screen.getByText("Plan")).toBeTruthy();
    expect(screen.queryByText("Registrar")).toBeNull();
    expect(screen.queryByText("Progresión")).toBeNull();
  });

  it("renders the prototype switcher with A/B/C options", async () => {
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    expect(screen.getByText("PROTOTYPE")).toBeTruthy();
    expect(screen.getByText("Inline")).toBeTruthy();
    expect(screen.getByText("Sheet")).toBeTruthy();
    expect(screen.getByText("Detail")).toBeTruthy();
  });

  it("switches between day tabs", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    // Day 2 tab
    await user.click(screen.getByText("Día 2"));
    expect(screen.getByText("Face Pulls en Polea Alta")).toBeTruthy();

    // Day 3 tab
    await user.click(screen.getByText("Día 3"));
    expect(screen.getByText("Press Banco Plano con Barra")).toBeTruthy();
  });
});

/* ================================================================
 * Prototype A — Inline Accordion
 * ================================================================ */
describe("Prototype A (inline accordion)", () => {
  beforeEach(() => {
    localStorage.setItem("gymbuddy_proto", "A");
  });

  it("expands an exercise row on click and shows the log form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Sentadilla Hack (calentamiento)"));

    expect(screen.getByText("Guardar registro")).toBeTruthy();
  });

  it("saves a log entry via the inline form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Sentadilla Hack (calentamiento)"));

    // Fill weight and reps
    const [weightInput, repsInput] = screen.getAllByRole("spinbutton");
    await user.clear(weightInput);
    await user.type(weightInput, "80");
    await user.clear(repsInput);
    await user.type(repsInput, "10");

    await user.click(screen.getByText("Guardar registro"));

    expect(persistLogs).toHaveBeenCalledTimes(1);
    const persisted = persistLogs.mock.calls[0][0];
    expect(persisted["d1_hack_warmup"]).toBeDefined();
    expect(persisted["d1_hack_warmup"][0].weight).toBe("80");
    expect(persisted["d1_hack_warmup"][0].reps).toBe("10");
  });
});

/* ================================================================
 * Prototype C — Full-Screen Push
 * ================================================================ */
describe("Prototype C (full-screen detail)", () => {
  beforeEach(() => {
    localStorage.setItem("gymbuddy_proto", "C");
  });

  it("opens exercise detail on click and shows back button + Log tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Sentadilla Hack (calentamiento)"));

    expect(screen.getByText("← volver")).toBeTruthy();
    expect(screen.getByText("Guardar registro")).toBeTruthy();
  });

  it("back button returns to the plan list", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Sentadilla Hack (calentamiento)"));
    expect(screen.getByText("← volver")).toBeTruthy();

    await user.click(screen.getByText("← volver"));
    expect(screen.getByText("Sentadilla Hack (calentamiento)")).toBeTruthy();
  });
});
