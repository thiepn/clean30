import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";
import "./styles/universal-phase1.css";
import "./styles/universal-phase2.css";
import "./styles/universal-phase3.css";
import "./styles/universal-phase4.css";
import "./styles/universal-phase5.css";
import "./styles/universal-phase6.css";
import "./styles/universal-phase8.css";
import "./styles/universal-phase8b.css";
import "./styles/universal-phase9.css";
import "./styles/universal-phase10.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    let reloadAfterUpdate = false;

    function notifyUpdateAvailable(registration) {
      if (!registration.waiting) return;
      window.clean30WaitingServiceWorker = registration.waiting;
      window.dispatchEvent(new CustomEvent("clean30:updateAvailable"));
    }

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL
      })
      .then((registration) => {
        notifyUpdateAvailable(registration);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              notifyUpdateAvailable(registration);
            }
          });
        });
      })
      .catch((error) => {
        console.warn("Clean30 service worker registration failed.", error);
      });

    window.addEventListener("clean30:applyUpdate", () => {
      const worker = window.clean30WaitingServiceWorker;
      if (!worker) return;
      reloadAfterUpdate = true;
      worker.postMessage({ type: "SKIP_WAITING" });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloadAfterUpdate) return;
      window.location.reload();
    });
  });
}
