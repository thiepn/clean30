import { useEffect, useMemo, useState } from "react";
import Customize from "./components/Customize.jsx";
import Dashboard from "./components/Dashboard.jsx";
import History from "./components/History.jsx";
import Layout from "./components/Layout.jsx";
import Routines from "./components/Routines.jsx";
import Settings from "./components/Settings.jsx";
import StartSession from "./components/StartSession.jsx";
import Systems from "./components/Systems.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import HelpGuide from "./components/HelpGuide.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { templateGallery } from "./data/templateGallery.js";
import {
  createDailyRulesHistoryEntry,
  createHistoryEntry,
  createSession,
  getRoutineById,
  hasDailyRulesHistoryEntry
} from "./utils/calculations.js";
import { daysBetween, getTodayKey } from "./utils/dates.js";
import {
  createFullBackup,
  loadAppState,
  resetToFreshState,
  saveAppState,
  validateFullBackupPayload
} from "./utils/storage.js";
import {
  createDefaultTemplate,
  createTemplateExport,
  duplicateTemplate,
  normalizeTemplate,
  validateTemplatePayload
} from "./utils/templateUtils.js";

function downloadJson(filename, payload) {
  let url = "";
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    console.warn("Clean30 could not start the JSON download.", error);
  }
}

export default function App() {
  const [appState, setAppState] = useState(() => loadAppState());
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedRoutineId, setSelectedRoutineId] = useState("weekly-reset");
  const [completionSummary, setCompletionSummary] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const activeTemplate = useMemo(() => {
    return (
      appState.templates.find((template) => template.id === appState.activeTemplateId) ||
      appState.templates[0]
    );
  }, [appState.activeTemplateId, appState.templates]);

  useEffect(() => saveAppState(appState), [appState]);

  useEffect(() => {
    if (!activeTemplate?.routines.some((routine) => routine.id === selectedRoutineId)) {
      setSelectedRoutineId(activeTemplate?.routines[0]?.id || "");
    }
  }, [activeTemplate, selectedRoutineId]);

  const hasCompletedDailyRules = Object.values(appState.dailyRuleCompletions).some(
    (ruleIds) => ruleIds.length > 0
  );
  const hasCustomTemplate = appState.templates.some(
    (template) => template.id !== "clean30-default" && !template.readOnly
  );
  const onboardingAge = daysBetween(appState.onboardingCompletedAt);
  const hasMeaningfulData =
    appState.history.length > 0 ||
    hasCompletedDailyRules ||
    hasCustomTemplate ||
    (onboardingAge !== null && onboardingAge > 30);
  const backupReferenceDate =
    appState.lastFullBackupExportedAt ||
    appState.firstMeaningfulUseAt ||
    appState.onboardingCompletedAt;
  const backupAge = daysBetween(backupReferenceDate);
  const backupReminderInterval = Number(appState.appSettings?.backupReminderIntervalDays ?? 30);
  const backupDue =
    backupReminderInterval > 0 &&
    hasMeaningfulData &&
    backupAge !== null &&
    backupAge >= backupReminderInterval;

  function markMeaningfulUse(state) {
    return state.firstMeaningfulUseAt
      ? state
      : { ...state, firstMeaningfulUseAt: new Date().toISOString() };
  }

  function clearTodayRecommendationDismissals(state) {
    const todayKey = getTodayKey();
    if (!state.dismissedRecommendations?.[todayKey]?.length) return state;
    const { [todayKey]: _today, ...remaining } = state.dismissedRecommendations;
    return { ...state, dismissedRecommendations: remaining };
  }

  function dismissRecommendation(recommendationKey) {
    if (!recommendationKey) return;
    const todayKey = getTodayKey();
    setAppState((current) => {
      const existing = new Set(current.dismissedRecommendations?.[todayKey] || []);
      existing.add(recommendationKey);
      return {
        ...current,
        dismissedRecommendations: {
          ...(current.dismissedRecommendations || {}),
          [todayKey]: [...existing]
        }
      };
    });
  }

  function requestConfirmation({ title, message, confirmLabel, onConfirm }) {
    setConfirmDialog({ title, message, confirmLabel, onConfirm });
  }

  function closeConfirmation() {
    setConfirmDialog(null);
  }

  function confirmCurrentAction() {
    confirmDialog?.onConfirm?.();
    closeConfirmation();
  }

  function updateActiveTemplate(updater) {
    setAppState((current) => {
      const template = current.templates.find((item) => item.id === current.activeTemplateId);
      if (!template || template.readOnly) return current;
      const updated = normalizeTemplate(updater(template), { readOnly: false });
      return markMeaningfulUse({
        ...current,
        templates: current.templates.map((item) => (item.id === updated.id ? updated : item))
      });
    });
  }

  function setActiveTemplateId(templateId) {
    setAppState((current) =>
      current.templates.some((template) => template.id === templateId)
        ? { ...current, activeTemplateId: templateId }
        : current
    );
  }

  function duplicateDefaultTemplate() {
    const defaultTemplate =
      appState.templates.find((template) => template.id === "clean30-default") ||
      createDefaultTemplate();
    const customTemplate = duplicateTemplate(defaultTemplate, "My Cleaning System");
    setAppState((current) => markMeaningfulUse({
      ...current,
      templates: [...current.templates, customTemplate],
      activeTemplateId: customTemplate.id
    }));
    setSelectedRoutineId("weekly-reset");
    setCurrentView("customize");
  }

  function useGalleryTemplate(galleryItem) {
    requestConfirmation({
      title: `Use ${galleryItem.name}?`,
      message:
        "This creates a new editable custom template from the protected gallery preset. Existing templates and history are kept.",
      confirmLabel: "Use template",
      onConfirm: () => {
        const customTemplate = duplicateTemplate(
          galleryItem.template,
          `${galleryItem.name} Copy`
        );
        setAppState((current) => markMeaningfulUse({
          ...current,
          templates: [...current.templates, customTemplate],
          activeTemplateId: customTemplate.id
        }));
        setSelectedRoutineId(customTemplate.routines[0]?.id || "weekly-reset");
      }
    });
  }

  function resetCurrentTemplateToDefault() {
    requestConfirmation({
      title: "Reset current template?",
      message:
        "This replaces the active custom template with the Clean30 default content. History is kept.",
      confirmLabel: "Reset template",
      onConfirm: () => {
        setAppState((current) => {
          const defaultTemplate =
            current.templates.find((template) => template.id === "clean30-default") ||
            createDefaultTemplate();
          const active = current.templates.find(
            (template) => template.id === current.activeTemplateId
          );
          if (!active || active.readOnly) return current;
          const resetTemplate = normalizeTemplate(
            {
              ...defaultTemplate,
              id: active.id,
              name: active.name,
              readOnly: false
            },
            { readOnly: false }
          );
          return {
            ...current,
            templates: current.templates.map((template) =>
              template.id === active.id ? resetTemplate : template
            )
          };
        });
      }
    });
  }

  function exportTemplate() {
    downloadJson(`clean30-template-${getTodayKey()}.json`, createTemplateExport(activeTemplate));
  }

  function importTemplate(payload) {
    const result = validateTemplatePayload(payload);
    if (!result.ok) return result;
    setAppState((current) => markMeaningfulUse({
      ...current,
      templates: [...current.templates, result.template],
      activeTemplateId: result.template.id
    }));
    setSelectedRoutineId(result.template.routines[0]?.id || "");
    return { ok: true, message: "Template imported as a new custom template." };
  }

  function exportFullBackup() {
    const exportedAt = new Date().toISOString();
    const nextState = { ...appState, lastFullBackupExportedAt: exportedAt };
    downloadJson(`clean30-full-backup-${getTodayKey()}.json`, createFullBackup(nextState));
    setAppState(nextState);
  }

  function importFullBackup(payload) {
    const result = validateFullBackupPayload(payload);
    if (!result.ok) return result;
    requestConfirmation({
      title: "Import full backup?",
      message:
        "This overwrites templates, active session, daily rule completions, and history with the backup data.",
      confirmLabel: "Import backup",
      onConfirm: () => {
        setAppState(result.data);
        setSelectedRoutineId(result.data.templates[0]?.routines[0]?.id || "weekly-reset");
        setCompletionSummary(null);
      }
    });
    return { ok: true, message: "Backup validated. Confirm import to overwrite local data." };
  }

  function startSession(routineId = selectedRoutineId) {
    const routine = getRoutineById(activeTemplate.routines, routineId);
    if (!routine) return;

    setSelectedRoutineId(routineId);

    if (appState.activeSession) {
      requestConfirmation({
        title: "Replace active session?",
        message: "This will discard the current active session and start the selected routine.",
        confirmLabel: "Replace",
        onConfirm: () => {
          setAppState((current) => clearTodayRecommendationDismissals({
            ...current,
            activeSession: createSession(routine, activeTemplate)
          }));
          setCompletionSummary(null);
          setCurrentView("start");
        }
      });
      return;
    }

    setAppState((current) => clearTodayRecommendationDismissals({
      ...current,
      activeSession: createSession(routine, activeTemplate)
    }));
    setCompletionSummary(null);
    setCurrentView("start");
  }

  function toggleTask(taskId) {
    setAppState((current) => {
      if (!current.activeSession) return current;
      const completed = new Set(current.activeSession.completedTaskIds || []);
      if (completed.has(taskId)) completed.delete(taskId);
      else completed.add(taskId);
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          completedTaskIds: [...completed]
        }
      };
    });
  }

  function completePhase(taskIds) {
    setAppState((current) => {
      if (!current.activeSession) return current;
      const completed = new Set(current.activeSession.completedTaskIds || []);
      taskIds.forEach((id) => completed.add(id));
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          completedTaskIds: [...completed]
        }
      };
    });
  }

  function updateSessionNotes(notes) {
    setAppState((current) =>
      current.activeSession
        ? { ...current, activeSession: { ...current.activeSession, notes } }
        : current
    );
  }

  function resetSession() {
    requestConfirmation({
      title: "Reset session?",
      message: "This clears completed tasks and notes for the active session.",
      confirmLabel: "Reset",
      onConfirm: () => {
        setAppState((current) =>
          current.activeSession
            ? {
                ...current,
                activeSession: {
                  ...current.activeSession,
                  completedTaskIds: [],
                  notes: ""
                }
              }
            : current
        );
      }
    });
  }

  function cancelSession() {
    requestConfirmation({
      title: "Cancel session?",
      message: "The active session will be removed without saving it to history.",
      confirmLabel: "Cancel session",
      onConfirm: () => setAppState((current) => ({ ...current, activeSession: null }))
    });
  }

  function finishSession() {
    const activeSession = appState.activeSession;
    if (!activeSession) return;
    const sessionTemplate =
      appState.templates.find((template) => template.id === activeSession.templateId) ||
      activeTemplate;

    if (activeSession.routineId === "daily-rules") {
      const todayKey = getTodayKey();
      const dailyRules = sessionTemplate.dailyRules || [];
      const validDailyRuleIds = new Set(dailyRules.map((rule) => rule.id));
      const completedRuleIds = [
        ...new Set((activeSession.completedTaskIds || []).filter((id) => validDailyRuleIds.has(id)))
      ];
      const completedSet = new Set(completedRuleIds);
      const allDailyRulesComplete =
        dailyRules.length > 0 && dailyRules.every((rule) => completedSet.has(rule.id));
      const dailyHistoryEntry =
        allDailyRulesComplete && !hasDailyRulesHistoryEntry(appState.history, todayKey)
          ? createDailyRulesHistoryEntry({
              dateKey: todayKey,
              dailyRules,
              template: sessionTemplate
            })
          : null;

      setAppState((current) =>
        markMeaningfulUse({
          ...current,
          history: dailyHistoryEntry ? [dailyHistoryEntry, ...current.history] : current.history,
          activeSession: null,
          dailyRuleCompletions: {
            ...current.dailyRuleCompletions,
            [todayKey]: completedRuleIds
          }
        })
      );
      setCompletionSummary(dailyHistoryEntry);
      return;
    }

    const entry = createHistoryEntry(activeSession, sessionTemplate);

    setAppState((current) => {
      const next = {
        ...current,
        history: [entry, ...current.history],
        activeSession: null
      };

      return markMeaningfulUse(next);
    });
    setCompletionSummary(entry);
  }

  function toggleDailyRule(ruleId) {
    const todayKey = getTodayKey();
    setAppState((current) => {
      const completed = new Set(current.dailyRuleCompletions[todayKey] || []);
      if (completed.has(ruleId)) completed.delete(ruleId);
      else completed.add(ruleId);
      const completedRuleIds = [...completed];
      const validDailyRuleIds = new Set(activeTemplate.dailyRules.map((rule) => rule.id));
      const allDailyRulesComplete =
        activeTemplate.dailyRules.length > 0 &&
        activeTemplate.dailyRules.every((rule) => completed.has(rule.id));
      const historyAlreadyLogged = hasDailyRulesHistoryEntry(current.history, todayKey);
      const dailyHistoryEntry =
        allDailyRulesComplete && !historyAlreadyLogged
          ? createDailyRulesHistoryEntry({
              dateKey: todayKey,
              dailyRules: activeTemplate.dailyRules,
              template: activeTemplate
            })
          : null;

      return markMeaningfulUse({
        ...current,
        history: dailyHistoryEntry ? [dailyHistoryEntry, ...current.history] : current.history,
        dailyRuleCompletions: {
          ...current.dailyRuleCompletions,
          [todayKey]: completedRuleIds.filter((id) => validDailyRuleIds.has(id))
        }
      });
    });
  }

  function resetEverything() {
    requestConfirmation({
      title: "Reset all Clean30 data?",
      message: "This clears templates, daily rules, active session, and all history.",
      confirmLabel: "Reset all",
      onConfirm: () => {
        setAppState(resetToFreshState());
        setSelectedRoutineId("weekly-reset");
        setCompletionSummary(null);
      }
    });
  }

  function restartOnboarding() {
    setAppState((current) => ({ ...current, onboardingCompleted: false }));
    setCurrentView("dashboard");
  }

  function updateBackupReminderInterval(value) {
    const interval = Number(value);
    if (![0, 14, 30, 60].includes(interval)) return;
    setAppState((current) => ({
      ...current,
      appSettings: {
        ...(current.appSettings || {}),
        backupReminderIntervalDays: interval
      }
    }));
  }

  function updateAppAppearance(field, value) {
    const allowedValues = {
      accentColor: ["forest", "teal", "navy", "slate", "plum", "brown", "charcoal"],
      backgroundColor: [
        "soft-blue",
        "warm-cream",
        "soft-mint",
        "pale-green",
        "lavender",
        "cool-gray"
      ]
    };
    if (!allowedValues[field]?.includes(value)) return;
    setAppState((current) => ({
      ...current,
      appSettings: {
        ...(current.appSettings || {}),
        [field]: value
      }
    }));
  }

  function resetHiddenRecommendations() {
    requestConfirmation({
      title: "Reset hidden recommendations?",
      message: "Dismissed Dashboard recommendations will be allowed to appear again.",
      confirmLabel: "Reset recommendations",
      onConfirm: () => {
        setAppState((current) => ({ ...current, dismissedRecommendations: {} }));
      }
    });
  }

  function completeOnboarding({ setupMode, profile, schedule }) {
    setAppState((current) => {
      const defaultTemplate =
        current.templates.find((template) => template.id === "clean30-default") ||
        createDefaultTemplate();
      const templates = current.templates.some((template) => template.id === defaultTemplate.id)
        ? current.templates
        : [defaultTemplate, ...current.templates];
      const profileChanged =
        profile.appDisplayName !== defaultTemplate.profile.appDisplayName ||
        profile.homeName !== defaultTemplate.profile.homeName ||
        schedule.weeklyResetDay !== defaultTemplate.schedule.weeklyResetDay ||
        schedule.backupResetDay !== defaultTemplate.schedule.backupResetDay;

      if (setupMode === "custom" || profileChanged) {
        const customTemplate = normalizeTemplate(
          {
            ...duplicateTemplate(defaultTemplate, profile.homeName || "My Cleaning System"),
            name: profile.homeName || "My Cleaning System",
            profile: {
              ...defaultTemplate.profile,
              ...profile
            },
            schedule: {
              ...defaultTemplate.schedule,
              ...schedule
            }
          },
          { readOnly: false }
        );

        return markMeaningfulUse({
          ...current,
          templates: [...templates, customTemplate],
          activeTemplateId: customTemplate.id,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString()
        });
      }

      return {
        ...current,
        templates,
        activeTemplateId: defaultTemplate.id,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      };
    });
    setSelectedRoutineId("weekly-reset");
    setCurrentView("dashboard");
  }

  function resetOnlyHistory() {
    requestConfirmation({
      title: "Reset history?",
      message: "This clears completed sessions but keeps templates and daily rules.",
      confirmLabel: "Reset history",
      onConfirm: () => {
        setAppState((current) => ({ ...current, history: [] }));
        setCompletionSummary(null);
      }
    });
  }

  function deleteHistoryEntry(entryId) {
    requestConfirmation({
      title: "Delete history entry?",
      message: "This removes the selected completed session from history.",
      confirmLabel: "Delete",
      onConfirm: () => {
        setAppState((current) => ({
          ...current,
          history: current.history.filter((entry) => entry.id !== entryId)
        }));
      }
    });
  }

  let content;
  if (currentView === "start") {
    content = (
      <StartSession
        routines={activeTemplate.routines}
        selectedRoutineId={selectedRoutineId}
        onSelectRoutine={setSelectedRoutineId}
        activeSession={appState.activeSession}
        completionSummary={completionSummary}
        onStartSession={startSession}
        onToggleTask={toggleTask}
        onCompletePhase={completePhase}
        onResetSession={resetSession}
        onFinishSession={finishSession}
        onCancelSession={cancelSession}
        onUpdateNotes={updateSessionNotes}
      />
    );
  } else if (currentView === "routines") {
    content = (
      <Routines
        routines={activeTemplate.routines}
        history={appState.history}
        template={activeTemplate}
        onStartRoutine={startSession}
      />
    );
  } else if (currentView === "systems") {
    content = <Systems template={activeTemplate} />;
  } else if (currentView === "customize") {
    content = (
      <Customize
        appState={appState}
        activeTemplate={activeTemplate}
        onSetActiveTemplate={setActiveTemplateId}
        onDuplicateDefault={duplicateDefaultTemplate}
        onResetTemplate={resetCurrentTemplateToDefault}
        onUpdateTemplate={updateActiveTemplate}
        onExportTemplate={exportTemplate}
        onImportTemplate={importTemplate}
        onExportFullBackup={exportFullBackup}
        onImportFullBackup={importFullBackup}
        templateGallery={templateGallery}
        onUseGalleryTemplate={useGalleryTemplate}
        onResetHistory={resetOnlyHistory}
        onResetAll={resetEverything}
        onRequestConfirmation={requestConfirmation}
        onUpdateAppAppearance={updateAppAppearance}
      />
    );
  } else if (currentView === "history") {
    content = (
      <History
        history={appState.history}
        routines={activeTemplate.routines}
        template={activeTemplate}
        onDeleteEntry={deleteHistoryEntry}
      />
    );
  } else if (currentView === "settings") {
    content = (
      <Settings
        template={activeTemplate}
        onExportFullBackup={exportFullBackup}
        onImportFullBackup={importFullBackup}
        lastFullBackupExportedAt={appState.lastFullBackupExportedAt}
        backupDue={backupDue}
        backupReminderIntervalDays={backupReminderInterval}
        appAppearance={appState.appSettings}
        onUpdateBackupReminderInterval={updateBackupReminderInterval}
        onUpdateAppAppearance={updateAppAppearance}
        onRestartOnboarding={restartOnboarding}
        onOpenHelp={() => setHelpOpen(true)}
        onManageCustomize={() => setCurrentView("customize")}
        onResetHiddenRecommendations={resetHiddenRecommendations}
        onResetAll={resetEverything}
        onResetHistory={resetOnlyHistory}
      />
    );
  } else {
    content = (
      <Dashboard
        template={activeTemplate}
        history={appState.history}
        dailyRuleCompletions={appState.dailyRuleCompletions}
        activeSession={appState.activeSession}
        backupDue={backupDue}
        lastFullBackupExportedAt={appState.lastFullBackupExportedAt}
        dismissedRecommendations={appState.dismissedRecommendations}
        onToggleDailyRule={toggleDailyRule}
        onStartRoutine={startSession}
        onDismissRecommendation={dismissRecommendation}
        onResumeSession={() => setCurrentView("start")}
        onFinishPartialSession={finishSession}
        onDiscardSession={cancelSession}
        onExportFullBackup={exportFullBackup}
      />
    );
  }

  return (
    <>
      <Layout
        currentView={currentView}
        onNavigate={setCurrentView}
        template={activeTemplate}
        onOpenHelp={() => setHelpOpen(true)}
        appAppearance={appState.appSettings}
      >
        {content}
      </Layout>
      <HelpGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
      {!appState.onboardingCompleted ? (
        <Onboarding template={activeTemplate} onComplete={completeOnboarding} />
      ) : null}
      <ConfirmDialog
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        onConfirm={confirmCurrentAction}
        onCancel={closeConfirmation}
      />
    </>
  );
}
