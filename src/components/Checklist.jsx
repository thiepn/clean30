import { useEffect, useMemo, useState } from "react";

function createPhaseStates(routine, completed) {
  return routine.phases.map((phase) => {
    const taskIds = phase.tasks.map((task) => task.id);
    const completedInPhase = taskIds.filter((id) => completed.has(id)).length;
    return {
      phase,
      taskIds,
      completedInPhase,
      complete: phase.tasks.length > 0 && completedInPhase === phase.tasks.length
    };
  });
}

function getDefaultOpenPhaseIds(phaseStates, focusFirstIncomplete) {
  if (!focusFirstIncomplete) {
    return phaseStates.filter((item) => !item.complete).map((item) => item.phase.id);
  }

  const firstIncomplete = phaseStates.find((item) => !item.complete) || phaseStates[0];
  return firstIncomplete ? [firstIncomplete.phase.id] : [];
}

function setsMatch(first, second) {
  if (first.size !== second.size) return false;
  for (const item of first) {
    if (!second.has(item)) return false;
  }
  return true;
}

export default function Checklist({
  routine,
  completedTaskIds,
  onToggleTask,
  onCompletePhase,
  readonly = false,
  collapsible = false,
  focusFirstIncomplete = false
}) {
  const completed = new Set(completedTaskIds || []);
  const phaseStates = useMemo(
    () => createPhaseStates(routine, completed),
    [routine, completedTaskIds]
  );
  const phaseSignature = phaseStates
    .map((item) => `${item.phase.id}:${item.completedInPhase}:${item.complete}`)
    .join("|");
  const firstIncompletePhaseId = phaseStates.find((item) => !item.complete)?.phase.id || null;
  const [openPhaseIds, setOpenPhaseIds] = useState(
    () => new Set(getDefaultOpenPhaseIds(phaseStates, focusFirstIncomplete))
  );

  useEffect(() => {
    setOpenPhaseIds(new Set(getDefaultOpenPhaseIds(phaseStates, focusFirstIncomplete)));
  }, [routine.id, collapsible, focusFirstIncomplete]);

  useEffect(() => {
    if (!collapsible) return;
    const completedPhaseIds = new Set(
      phaseStates.filter((item) => item.complete).map((item) => item.phase.id)
    );

    setOpenPhaseIds((current) => {
      const next = new Set([...current].filter((id) => !completedPhaseIds.has(id)));
      if (focusFirstIncomplete && next.size === 0 && firstIncompletePhaseId) {
        next.add(firstIncompletePhaseId);
      }
      return setsMatch(current, next) ? current : next;
    });
  }, [collapsible, focusFirstIncomplete, firstIncompletePhaseId, phaseSignature]);

  function handlePhaseToggle(phaseId, isOpen) {
    setOpenPhaseIds((current) => {
      const next = new Set(current);
      if (isOpen) next.add(phaseId);
      else next.delete(phaseId);
      return next;
    });
  }

  return (
    <div className="checklist">
      {phaseStates.map(({ phase, taskIds, completedInPhase, complete }) => {
        const Wrapper = collapsible ? "details" : "section";
        return (
          <Wrapper
            className={complete ? "phase complete" : "phase"}
            key={phase.id}
            open={collapsible ? openPhaseIds.has(phase.id) : undefined}
            onToggle={
              collapsible
                ? (event) => handlePhaseToggle(phase.id, event.currentTarget.open)
                : undefined
            }
          >
            {collapsible ? (
              <summary className="phase-summary">
                <span className="phase-summary-main">
                  <strong>{phase.title}</strong>
                  <span className="phase-summary-count">
                    {completedInPhase}/{phase.tasks.length}
                  </span>
                </span>
                <span className="phase-summary-status">
                  {complete ? <span className="phase-complete-mark">Done</span> : null}
                  <span className="phase-chevron" aria-hidden="true" />
                </span>
              </summary>
            ) : null}
            {!collapsible || (!readonly && onCompletePhase) ? (
              <div className={collapsible ? "phase-header visually-nested" : "phase-header"}>
                <div>
                  <p className="eyebrow">
                    {completedInPhase}/{phase.tasks.length} complete
                  </p>
                  <h3>{phase.title}</h3>
                </div>
                {!readonly && onCompletePhase ? (
                  <button
                    className="button small ghost"
                    type="button"
                    onClick={() => onCompletePhase(taskIds)}
                  >
                    Mark phase complete
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="task-list">
              {phase.tasks.map((item) => {
                const checked = completed.has(item.id);
                return (
                  <label className={checked ? "task-row checked" : "task-row"} key={item.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={readonly}
                      onChange={() => onToggleTask?.(item.id)}
                    />
                    <span className="task-copy">
                      <span className="task-title-line">
                        <strong>{item.title}</strong>
                        {item.duration ? <span className="duration">{item.duration}</span> : null}
                        {item.priority && item.priority !== "normal" ? (
                          <span className={`pill priority-${item.priority}`}>
                            {item.priority}
                          </span>
                        ) : null}
                      </span>
                      {item.detail ? <span className="task-detail">{item.detail}</span> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
