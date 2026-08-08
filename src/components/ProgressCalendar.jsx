import { useMemo, useState } from "react";
import { formatCalendarDayLabel } from "../utils/accessibility.js";
import { getTodayKey } from "../utils/dates.js";

function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function displayMonth(date) {
  return new Intl.DateTimeFormat("en-DE", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function displayDay(dateKey) {
  return new Intl.DateTimeFormat("en-DE", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(dateFromKey(dateKey));
}

function displayMinutes(value) {
  const minutes = Math.round(Number(value) || 0);
  if (minutes <= 0) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildMonthCells(referenceDate) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const leading = (first.getDay() + 6) % 7;
  const occupied = leading + last.getDate();
  const cellCount = Math.ceil(occupied / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - leading + 1;
    if (day < 1 || day > last.getDate()) {
      return { id: `empty-${year}-${month}-${index}`, empty: true };
    }
    const date = new Date(year, month, day);
    return {
      id: getTodayKey(date),
      dateKey: getTodayKey(date),
      day
    };
  });
}

export default function ProgressCalendar({
  activityByDate,
  currentDateKey,
  selectedDate,
  onSelectDate
}) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const current = dateFromKey(currentDateKey);
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const cells = useMemo(() => buildMonthCells(monthCursor), [monthCursor]);
  const selectedActivity = activityByDate[selectedDate] || null;
  const selectedHasActivity = Boolean(
    selectedActivity &&
      (selectedActivity.todayCompleted > 0 || selectedActivity.sessions.length > 0)
  );

  function moveMonth(offset) {
    const next = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + offset,
      1
    );
    setMonthCursor(next);
    onSelectDate(getTodayKey(next));
  }

  function returnToCurrentMonth() {
    const current = dateFromKey(currentDateKey);
    setMonthCursor(new Date(current.getFullYear(), current.getMonth(), 1));
    onSelectDate(currentDateKey);
  }

  return (
    <div className="progress-calendar-feature">
      <div className="progress-calendar-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>{displayMonth(monthCursor)}</h2>
          <p>Choose a day to see what was completed.</p>
        </div>
        <div className="progress-calendar-controls" aria-label="Calendar month controls">
          <button
            aria-label="Previous month"
            className="button ghost small"
            onClick={() => moveMonth(-1)}
            type="button"
          >
            ←
          </button>
          <button className="button ghost small" onClick={returnToCurrentMonth} type="button">
            Today
          </button>
          <button
            aria-label="Next month"
            className="button ghost small"
            onClick={() => moveMonth(1)}
            type="button"
          >
            →
          </button>
        </div>
      </div>

      <div className="progress-calendar-layout">
        <div className="progress-calendar-grid" aria-label={`${displayMonth(monthCursor)} activity calendar`}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span className="progress-calendar-weekday" key={day}>
              {day}
            </span>
          ))}
          {cells.map((cell) => {
            if (cell.empty) {
              return <span className="progress-calendar-empty" key={cell.id} />;
            }
            const activity = activityByDate[cell.dateKey];
            const todayActivity = Boolean(activity?.todayCompleted);
            const routineActivity = Boolean(activity?.sessions?.length);
            const hasActivity = todayActivity || routineActivity;
            return (
              <button
                aria-label={formatCalendarDayLabel(
                  cell.dateKey,
                  activity,
                  currentDateKey
                )}
                className={[
                  "progress-calendar-day",
                  cell.dateKey === currentDateKey ? "today" : "",
                  cell.dateKey === selectedDate ? "selected" : "",
                  hasActivity ? "has-activity" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={cell.id}
                onClick={() => onSelectDate(cell.dateKey)}
                type="button"
              >
                <span className="progress-calendar-number">{cell.day}</span>
                {hasActivity ? (
                  <span className="progress-calendar-markers" aria-hidden="true">
                    {todayActivity ? <span className="progress-marker today-marker" /> : null}
                    {routineActivity ? <span className="progress-marker routine-marker" /> : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <aside className="progress-day-summary" aria-live="polite">
          <div className="progress-day-summary-heading">
            <span>Selected day</span>
            <strong>{displayDay(selectedDate)}</strong>
          </div>
          {selectedHasActivity ? (
            <>
              <div className="progress-day-facts">
                {selectedActivity.todayCompleted > 0 ? (
                  <span>{countLabel(selectedActivity.todayCompleted, "Today task")}</span>
                ) : null}
                {selectedActivity.sessions.length > 0 ? (
                  <span>{countLabel(selectedActivity.sessions.length, "routine")}</span>
                ) : null}
                {selectedActivity.routineElapsedMinutes > 0 ? (
                  <span>
                    {displayMinutes(selectedActivity.routineElapsedMinutes)} measured routine time
                  </span>
                ) : null}
                {selectedActivity.estimatedTodayMinutes > 0 ? (
                  <span>
                    {displayMinutes(selectedActivity.estimatedTodayMinutes)} estimated Today time
                  </span>
                ) : null}
              </div>
              {selectedActivity.sessions.length ? (
                <div className="progress-day-session-list">
                  {selectedActivity.sessions.map((entry) => (
                    <div key={entry.id}>
                      <strong>{entry.routineTitle || "Routine"}</strong>
                      <span>
                        {entry.completedTasks}/{entry.totalTasks} tasks
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="muted">No recorded cleaning activity on this day.</p>
          )}
        </aside>
      </div>

      <div className="progress-calendar-legend" aria-label="Calendar legend">
        <span><i className="progress-marker today-marker" aria-hidden="true" /> Today tasks</span>
        <span><i className="progress-marker routine-marker" aria-hidden="true" /> Routine session</span>
      </div>
    </div>
  );
}
