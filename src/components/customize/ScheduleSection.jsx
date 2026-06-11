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
        </div>
      </div>

      <div className="form-grid">
        <label className="field-label" htmlFor="weekly-reset-day">
          Weekly reset day
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
          Backup reset day
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
