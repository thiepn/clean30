export default function Checklist({
  routine,
  completedTaskIds,
  onToggleTask,
  onCompletePhase,
  readonly = false
}) {
  const completed = new Set(completedTaskIds || []);

  return (
    <div className="checklist">
      {routine.phases.map((phase) => {
        const phaseTaskIds = phase.tasks.map((task) => task.id);
        const completedInPhase = phaseTaskIds.filter((id) => completed.has(id)).length;
        return (
          <section className="phase" key={phase.id}>
            <div className="phase-header">
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
                  onClick={() => onCompletePhase(phaseTaskIds)}
                >
                  Mark phase complete
                </button>
              ) : null}
            </div>
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
          </section>
        );
      })}
    </div>
  );
}
