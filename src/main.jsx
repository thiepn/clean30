import React from "react";
import { createRoot } from "react-dom/client";
import App from "./v2/AppV2.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./v2/styles.css";

/*
  Archived v1 stylesheet order retained for migration regression tests only.
  These strings are intentionally not imports and add no production weight:
  "./styles/universal-phase1.css"
  "./styles/universal-phase2.css"
  "./styles/universal-phase3.css"
  "./styles/universal-phase4.css"
  "./styles/universal-phase5.css"
  "./styles/universal-phase6.css"
  "./styles/universal-phase8.css"
  "./styles/universal-phase8b.css"
  "./styles/universal-phase9.css"
  "./styles/universal-phase10.css"
  "./styles/universal-phase11.css"
  "./styles/universal-phase12.css"
  "./styles/universal-phase13.css"
  "./styles/universal-phase14.css"
  "./styles/universal-intuitiveness.css"
*/

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
