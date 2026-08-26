import React from "react";

function exportEmergencyBackup() {
  try {
    const storage = window.localStorage;
    const payload = {
      app: "Clean30",
      type: "emergency-localStorage-backup",
      exportedAt: new Date().toISOString(),
      clean30_v2_state: storage.getItem("clean30_v2_state"),
      clean30_appState: storage.getItem("clean30_appState"),
      clean30_settings: storage.getItem("clean30_settings"),
      clean30_dailyRules: storage.getItem("clean30_dailyRules"),
      clean30_activeSession: storage.getItem("clean30_activeSession"),
      clean30_history: storage.getItem("clean30_history")
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `clean30-emergency-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // The crash fallback must never crash while trying to help.
  }
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
    this.handleGlobalError = this.handleGlobalError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Clean30 render error", error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener("error", this.handleGlobalError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleGlobalError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  handleGlobalError(event) {
    this.setState({
      error: event.error || new Error(event.message || "Unknown runtime error"),
      errorInfo: null
    });
  }

  handleUnhandledRejection(event) {
    const reason = event.reason;
    this.setState({
      error: reason instanceof Error ? reason : new Error(String(reason || "Unhandled promise rejection")),
      errorInfo: null
    });
  }

  render() {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="crash-shell" role="alert">
        <section className="crash-card">
          <p className="eyebrow">Clean30</p>
          <h1>Something went wrong</h1>
          <p>
            Clean30 hit an unexpected error. Your data is stored locally in this browser, so try
            exporting a backup before reloading if you need to preserve the current device state.
          </p>
          <div className="crash-actions">
            <button className="button primary" type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
            <button className="button ghost" type="button" onClick={exportEmergencyBackup}>
              Export backup
            </button>
          </div>
          <details className="crash-details">
            <summary>Technical details</summary>
            <pre>{`${error?.message || error}\n${errorInfo?.componentStack || ""}`}</pre>
          </details>
        </section>
      </main>
    );
  }
}
