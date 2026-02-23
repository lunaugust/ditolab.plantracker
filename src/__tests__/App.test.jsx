import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

/* ================================================================
 * Mock storageService — always resolve with empty logs by default
 * ================================================================ */
vi.mock("../services/storageService", () => ({
  loadLogs: vi.fn().mockResolvedValue({}),
  persistLogs: vi.fn().mockResolvedValue(undefined),
}));

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
    expect(screen.getByText("Augusto")).toBeTruthy();
  });

  it("renders all three navigation tabs", async () => {
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    expect(screen.getByText("Plan")).toBeTruthy();
    expect(screen.getByText("Registrar")).toBeTruthy();
    expect(screen.getByText("Progresión")).toBeTruthy();
  });

  it("switches to log view when clicking Registrar", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Registrar"));

    expect(screen.getByText("SELECCIONÁ UN EJERCICIO")).toBeTruthy();
  });

  it("switches to progress view when clicking Progresión", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Progresión"));

    expect(screen.getByText("PROGRESIÓN DE PESO")).toBeTruthy();
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
 * Log View — exercise selection and form
 * ================================================================ */
describe("Log View", () => {
  it("opens exercise detail and shows the form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    // Go to log view
    await user.click(screen.getByText("Registrar"));
    await screen.findByText("SELECCIONÁ UN EJERCICIO");

    // Click on the first exercise
    await user.click(screen.getByText("Sentadilla Hack (calentamiento)"));

    // Form should appear
    expect(screen.getByText("REGISTRAR")).toBeTruthy();
    expect(screen.getByText("Guardar registro")).toBeTruthy();
    expect(screen.getByPlaceholderText("Ej: técnica mejorada, RPE 8...")).toBeTruthy();
  });

  it("saves a log entry when submitting the form", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Registrar"));
    await screen.findByText("SELECCIONÁ UN EJERCICIO");
    await user.click(screen.getByText("Sentadilla Hack (calentamiento)"));

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
    const persisted = persistLogs.mock.calls[0][0];
    expect(persisted["d1_hack_warmup"]).toBeDefined();
    expect(persisted["d1_hack_warmup"][0].weight).toBe("100");
    expect(persisted["d1_hack_warmup"][0].reps).toBe("8");
  });

  it("back button returns to exercise list", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Sentadilla Hack (calentamiento)");

    await user.click(screen.getByText("Registrar"));
    await screen.findByText("SELECCIONÁ UN EJERCICIO");
    await user.click(screen.getByText("Sentadilla Hack (calentamiento)"));

    expect(screen.getByText("REGISTRAR")).toBeTruthy();

    await user.click(screen.getByText("← volver"));
    expect(screen.getByText("SELECCIONÁ UN EJERCICIO")).toBeTruthy();
  });
});
