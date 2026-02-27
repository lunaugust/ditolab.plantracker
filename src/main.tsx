import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/global.css";
import App from "./App";
import { I18nProvider } from "./i18n";

registerSW({
  immediate: true,
  onRegisteredSW(_, registration) {
    registration?.update();
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
