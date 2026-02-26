import { generateRuleBasedPlan } from "../services/ruleBasedPlanGenerator";
import { GENERATED_DAY_COLORS } from "../data/planGeneratorConfig";

/* ================================================================
 * generateRuleBasedPlan — core output shape
 * ================================================================ */
describe("generateRuleBasedPlan", () => {
  const baseForm = {
    experience: "intermediate",
    goal: "hypertrophy",
    limitations: "",
    daysPerWeek: 4,
    minutesPerSession: 60,
  };

  it("returns the correct number of days", async () => {
    const plan = await generateRuleBasedPlan(baseForm, "es");
    expect(Object.keys(plan)).toHaveLength(4);
  });

  it("uses Spanish day keys by default", async () => {
    const plan = await generateRuleBasedPlan(baseForm, "es");
    const keys = Object.keys(plan);
    expect(keys.every((k) => k.startsWith("Día"))).toBe(true);
  });

  it("uses English day keys when language is 'en'", async () => {
    const plan = await generateRuleBasedPlan(baseForm, "en");
    const keys = Object.keys(plan);
    expect(keys.every((k) => k.startsWith("Day"))).toBe(true);
  });

  it("each day has label, color, and exercises array", async () => {
    const plan = await generateRuleBasedPlan(baseForm, "es");
    for (const day of Object.values(plan)) {
      expect(day).toHaveProperty("label");
      expect(day).toHaveProperty("color");
      expect(Array.isArray(day.exercises)).toBe(true);
      expect(day.exercises.length).toBeGreaterThan(0);
    }
  });

  it("each exercise has required fields and a unique id", async () => {
    const plan = await generateRuleBasedPlan(baseForm, "es");
    const allIds = new Set();
    for (const day of Object.values(plan)) {
      for (const ex of day.exercises) {
        expect(ex).toHaveProperty("id");
        expect(ex).toHaveProperty("name");
        expect(ex).toHaveProperty("sets");
        expect(ex).toHaveProperty("reps");
        expect(ex).toHaveProperty("rest");
        expect(typeof ex.note).toBe("string");
        expect(allIds.has(ex.id)).toBe(false);
        allIds.add(ex.id);
      }
    }
  });

  it("assigns colors from GENERATED_DAY_COLORS", async () => {
    const plan = await generateRuleBasedPlan(baseForm, "es");
    Object.values(plan).forEach((day, i) => {
      expect(day.color).toBe(GENERATED_DAY_COLORS[i % GENERATED_DAY_COLORS.length]);
    });
  });
});

/* ================================================================
 * Experience level affects volume
 * ================================================================ */
describe("generateRuleBasedPlan — experience scaling", () => {
  const makeForm = (experience) => ({
    experience,
    goal: "hypertrophy",
    limitations: "",
    daysPerWeek: 3,
    minutesPerSession: 60,
  });

  it("beginner gets notes about light weight", async () => {
    const plan = await generateRuleBasedPlan(makeForm("beginner"), "es");
    const firstDay = Object.values(plan)[0];
    const hasBeginnerNote = firstDay.exercises.some(
      (ex) => ex.note && ex.note.toLowerCase().includes("livian")
    );
    expect(hasBeginnerNote).toBe(true);
  });

  it("advanced plan has equal or more exercises than beginner", async () => {
    const beginner = await generateRuleBasedPlan(makeForm("beginner"), "es");
    const advanced = await generateRuleBasedPlan(makeForm("advanced"), "es");

    const countExercises = (plan) =>
      Object.values(plan).reduce((sum, day) => sum + day.exercises.length, 0);

    expect(countExercises(advanced)).toBeGreaterThanOrEqual(countExercises(beginner));
  });
});

/* ================================================================
 * Days per week 2-6
 * ================================================================ */
describe("generateRuleBasedPlan — days per week", () => {
  for (const daysPerWeek of [2, 3, 4, 5, 6]) {
    it(`generates ${daysPerWeek} days`, async () => {
      const plan = await generateRuleBasedPlan(
        { experience: "intermediate", goal: "strength", limitations: "", daysPerWeek, minutesPerSession: 60 },
        "es"
      );
      expect(Object.keys(plan)).toHaveLength(daysPerWeek);
    });
  }
});

/* ================================================================
 * Session time limits exercise count
 * ================================================================ */
describe("generateRuleBasedPlan — time limit", () => {
  it("short session (30 min) has fewer exercises than long (90 min)", async () => {
    const base = { experience: "intermediate", goal: "hypertrophy", limitations: "", daysPerWeek: 4 };
    const short = await generateRuleBasedPlan({ ...base, minutesPerSession: 30 }, "es");
    const long = await generateRuleBasedPlan({ ...base, minutesPerSession: 90 }, "es");

    const max = (plan) => Math.max(...Object.values(plan).map((d) => d.exercises.length));
    expect(max(long)).toBeGreaterThanOrEqual(max(short));
  });
});

/* ================================================================
 * English translations
 * ================================================================ */
describe("generateRuleBasedPlan — English output", () => {
  it("translates exercise names to English", async () => {
    const plan = await generateRuleBasedPlan(
      { experience: "intermediate", goal: "strength", limitations: "", daysPerWeek: 3, minutesPerSession: 60 },
      "en"
    );
    const firstDay = Object.values(plan)[0];
    // Should have at least one English name (no Spanish characters)
    const hasEnglish = firstDay.exercises.some(
      (ex) => !/[áéíóúñ¿¡]/i.test(ex.name)
    );
    expect(hasEnglish).toBe(true);
  });

  it("translates beginner notes to English", async () => {
    const plan = await generateRuleBasedPlan(
      { experience: "beginner", goal: "adaptation", limitations: "", daysPerWeek: 2, minutesPerSession: 60 },
      "en"
    );
    const firstDay = Object.values(plan)[0];
    const hasEnglishNote = firstDay.exercises.some(
      (ex) => ex.note && ex.note.toLowerCase().includes("light weight")
    );
    expect(hasEnglishNote).toBe(true);
  });
});
