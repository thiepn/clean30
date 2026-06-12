import { weekdayOptions } from "../../utils/dates.js";

export default function ScheduleSection({ schedule, canEdit, onEditTemplate }) {
  function updateSchedule(field, value) {
    onEditTemplate((draft) => {
      draft.schedule[field] = value;
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Schedule</p>
          <h2>Reset Timing</h2>
          <p>These settings drive cleaning due dates. Full data backups live in Settings.</p>
        </div>
      </div>

      <div className="form-grid customize-card">
        <label className="field-label" htmlFor="weekly-reset-day">
          Weekly reset day
          <span className="field-help">The preferred anchor day for the full weekly reset.</span>
          <select
            id="weekly-reset-day"
            value={schedule.weeklyResetDay}
            disabled={!canEdit}
            onChange={(event) => updateSchedule("weeklyResetDay", event.target.value)}
          >
            {weekdayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label" htmlFor="backup-reset-day">
          Fallback reset day
          <span className="field-help">
            Your backup cleaning slot if the weekly reset did not happen. This is not a data backup.
          </span>
          <select
            id="backup-reset-day"
            value={schedule.backupResetDay}
            disabled={!canEdit}
            onChange={(event) => updateSchedule("backupResetDay", event.target.value)}
          >
            {weekdayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label" htmlFor="monthly-interval">
          Monthly deep clean interval in days
          <span className="field-help">How many days before monthly maintenance becomes due.</span>
          <input
            id="monthly-interval"
            type="number"
            min="14"
            max="90"
            value={schedule.monthlyDeepCleanInterval}
            disabled={!canEdit}
            onChange={(event) =>
              updateSchedule("monthlyDeepCleanInterval", Number(event.target.value))
            }
          />
        </label>

        <label className="field-label" htmlFor="weekly-due-after">
          Weekly reset due after X days
          <span className="field-help">How many days can pass before the dashboard marks it due.</span>
          <input
            id="weekly-due-after"
            type="number"
            min="1"
            max="30"
            value={schedule.weeklyResetDueAfterDays}
            disabled={!canEdit}
            onChange={(event) => updateSchedule("weeklyResetDueAfterDays", Number(event.target.value))}
          />
        </label>

        <label className="field-label" htmlFor="minimal-fallback">
          Minimal reset fallback label
          <span className="field-help">The label used when a smaller reset is enough.</span>
          <input
            id="minimal-fallback"
            value={schedule.minimalResetFallbackLabel}
            disabled={!canEdit}
            onChange={(event) => updateSchedule("minimalResetFallbackLabel", event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
