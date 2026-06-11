import { useEffect, useState } from "react";
import Checklist from "./Checklist.jsx";
import EmptyState from "./EmptyState.jsx";
import RoutineCard from "./RoutineCard.jsx";

export default function Routines({ routines, onStartRoutine }) {
  const [selectedRoutineId, setSelectedRoutineId] = useState(routines[0]?.id || "");
  const selectedRoutine =
    routines.find((routine) => routine.id === selectedRoutineId) || routines[0] || null;

  useEffect(() => {
    if (!selectedRoutine && routines[0]) setSelectedRoutineId(routines[0].id);
  }, [routines, selectedRoutine]);

  if (!selectedRoutine) {
    return <EmptyState title="No routines" message="Add a routine in Customize to use this page." />;
  }

  return (
    <div className="screen-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reference library</p>
            <h2>Routines</h2>
          </div>
        </div>
        <div className="tab-row" role="tablist" aria-label="Routine tabs">
          {routines.map((routine) => (
            <button
              className={selectedRoutine.id === routine.id ? "tab active" : "tab"}
              key={routine.id}
              type="button"
              onClick={() => setSelectedRoutineId(routine.id)}
            >
              {routine.title}
            </button>
          ))}
        </div>
      </section>

      <RoutineCard routine={selectedRoutine} onStart={onStartRoutine} />

      <section className="panel">
        <p className="eyebrow">Checklist reference</p>
        <h2>{selectedRoutine.title}</h2>
        <p>{selectedRoutine.purpose}</p>
        {selectedRoutine.whenToUse ? <p className="muted">{selectedRoutine.whenToUse}</p> : null}
        {selectedRoutine.message ? <p className="callout">{selectedRoutine.message}</p> : null}
        <Checklist routine={selectedRoutine} completedTaskIds={[]} readonly />
      </section>
    </div>
  );
}
