import { loadExerciseCatalog } from "../data/exerciseCatalog";

describe("exercise catalog Spanish translations", () => {
  it("keeps representative exercise names in natural Spanish", async () => {
    const catalog = await loadExerciseCatalog();
    const byName = new Map(catalog.map((entry) => [entry.name, entry.nameEs]));

    expect(byName.get("barbell decline close grip to skull press")).toBe(
      "Press francés declinado con barra y agarre cerrado",
    );
    expect(byName.get("cable incline fly (on stability ball)")).toBe(
      "Aperturas inclinadas en polea sobre pelota de estabilidad",
    );
    expect(byName.get("kettlebell double alternating hang clean")).toBe(
      "Cargada colgante alterna doble con kettlebell",
    );
    expect(byName.get("dumbbell contralateral forward lunge")).toBe(
      "Zancada frontal contralateral con mancuerna",
    );
    expect(byName.get("balance board")).toBe("Tabla de equilibrio");
    expect(byName.get("spider crawl push up")).toBe(
      "Flexión de brazos con gateo de araña",
    );
    expect(byName.get("horizontal dumbbell standing alternate overhead press")).toBe(
      "Press sobre la cabeza alterno de pie con mancuerna en plano horizontal",
    );
  });

  it("does not leave the old broken translation fragments in Spanish exercise names", async () => {
    const catalog = await loadExerciseCatalog();
    const brokenFragments = [
      "centralateral",
      "finger s",
      "throw down",
      "variatien",
      "with ",
      " against ",
      " from ",
      " the ",
    ];

    for (const fragment of brokenFragments) {
      const offenders = catalog.filter((entry) =>
        (entry.nameEs || "").toLowerCase().includes(fragment),
      );

      expect(offenders, `Fragment still present: ${fragment}`).toHaveLength(0);
    }
  });

  it("translates Spanish coaching notes without English muscle names", async () => {
    const catalog = await loadExerciseCatalog();
    const englishMuscles = /\b(abs|delts|forearms|glutes|hamstrings|pectorals|quads|traps|triceps)\b/i;

    const offenders = catalog.filter((entry) => englishMuscles.test(entry.noteEs || ""));
    expect(offenders).toHaveLength(0);

    expect(
      catalog.find((entry) => entry.name === "band shrug")?.noteEs,
    ).toContain("trapecios");
    expect(
      catalog.find((entry) => entry.name === "cable incline fly (on stability ball)")?.noteEs,
    ).toContain("pectorales");
  });
});
