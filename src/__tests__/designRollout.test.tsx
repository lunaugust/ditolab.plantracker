import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { I18nProvider } from "../i18n";
import { PlanGeneratorWizard } from "../components/views/PlanGeneratorWizard";
import { FeedbackModal, WhatsNewModal } from "../components/layout";

function renderWithI18n(node: ReactNode) {
  return render(<I18nProvider>{node}</I18nProvider>);
}

describe("Editorial Performance rollout", () => {
  beforeEach(() => {
    window.localStorage.setItem("gymbuddy_lang", "es");
  });

  it("shows the generator hero subtitle and keeps the active option accent styling", () => {
    renderWithI18n(<PlanGeneratorWizard onApply={() => {}} onClose={() => {}} />);

    expect(screen.getByText("Definí objetivo, tiempo y límites para generar una rutina clara y editable.")).toBeTruthy();

    const activeOption = screen.getByRole("button", { name: "Intermedio" });
    expect(activeOption.style.color).toBe("rgb(232, 100, 58)");
  });

  it("keeps the active feedback category chip highlighted with the accent color", () => {
    renderWithI18n(<FeedbackModal scope="guest" currentView="plan" onClose={() => {}} />);

    const activeChip = screen.getByRole("button", { name: "General" });
    expect(activeChip.style.color).toBe("rgb(232, 100, 58)");
    expect(activeChip.style.background).toBe("rgba(232, 100, 58, 0.094)");
  });

  it("shows exactly the latest and previous changelog entries in What's New", () => {
    renderWithI18n(<WhatsNewModal onDismiss={() => {}} />);

    expect(screen.getAllByText("Versión 1.9.0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Versión 1.8.0").length).toBe(1);
    expect(screen.queryByText("Versión 1.7.0")).toBeNull();
    expect(screen.getByText("Nuevo rediseño Editorial Performance en toda la app con jerarquía más clara, métricas destacadas y superficies más legibles en móvil.")).toBeTruthy();
    expect(screen.getByText("Nueva galeria de rediseno con cuatro conceptos mobile-first para comparar estilos y jerarquias completas de la app.")).toBeTruthy();
  });
});