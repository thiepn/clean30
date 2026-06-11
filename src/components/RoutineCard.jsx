import { getRoutineTotalTasks } from "../utils/calculations.js";

export default function RoutineCard({ routine, onSelect, onStart, compact = false }) {
  return (
    <article className={compact ? "routine-card compact" : "routine-card"}>
      <div className="card-heading">
        <div>
          <p className="eyebrow">{routine.estimatedTime}</p>
          <h3>{routine.title}</h3>
        </div>
        <span className="task-count">{getRoutineTotalTasks(routine)} tasks</span>
      </div>
      <p>{routine.purpose}</p>
      {routine.whenToUse ? <p className="muted">{routine.whenToUse}</p> : null}
      {routine.message ? <p className="callout small">{routine.message}</p> : null}
      <div className="card-actions">
        {onSelect ? (
          <button className="button ghost" type="button" onClick={() => onSelect(routine.id)}>
            View
          </button>
        ) : null}
        {onStart ? (
          <button className="button primary" type="button" onClick={() => onStart(routine.id)}>
            Start
          </button>
        ) : null}
      </div>
    </article>
  );
}
