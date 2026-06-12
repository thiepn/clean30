import { useMemo, useState } from "react";

const zoneDescriptions = {
  trash: "Trash control keeps smell, visual clutter, and pests from becoming the main problem.",
  dishes: "Dishes affect smell, counters, and whether the kitchen feels usable.",
  laundry: "Laundry controls floor clutter and makes resets feel possible.",
  clothes: "Clothes on floors and chairs quickly make a clean room feel messy again.",
  bathroom: "Bathroom attention controls smell, guest readiness, and daily comfort.",
  toilet: "Toilet and sink maintenance are high-impact guest-readiness tasks.",
  kitchen: "The kitchen is usually the fastest place to regain function and reduce smell.",
  bedroom: "Bedroom resets reduce visual load and make laundry easier to contain.",
  living: "Living areas decide whether the apartment feels guest-ready.",
  entrance: "The entrance affects first impressions and whether clutter spreads inward.",
  corridor: "Corridors and paths matter because blocked floors make cleaning harder.",
  floors: "Floors are a final-pass zone after trash, dishes, laundry, and surfaces.",
  windows: "Windows and glass are maintenance zones, not first-response cleaning.",
  glass: "Glass is useful for polish once the main bottlenecks are controlled.",
  desk: "The desk affects focus and tends to collect dishes, trash, and paper clutter.",
  bed: "The bed anchors a small room and makes the space feel reset quickly.",
  recycling: "Trash and recycling need a clear exit path so they do not become storage.",
  kids: "Shared or kids areas work best with broad reset categories, not perfection."
};

function normalizeWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2);
}

function zoneKeywords(zoneName) {
  const words = normalizeWords(zoneName);
  const extras = [];
  if (words.includes("trash")) extras.push("bin", "recycling", "waste");
  if (words.includes("laundry") || words.includes("clothes")) extras.push("clothing", "wash");
  if (words.includes("bathroom")) extras.push("toilet", "sink", "smell");
  if (words.includes("kitchen")) extras.push("dishes", "counter", "sink");
  if (words.includes("entrance")) extras.push("shoes", "bags", "corridor");
  if (words.includes("living")) extras.push("sofa", "table", "shared");
  return [...new Set([...words, ...extras])];
}

function textIncludesKeyword(text, keywords) {
  const normalized = ` ${normalizeWords(text).join(" ")} `;
  return keywords.some((keyword) => normalized.includes(` ${keyword} `));
}

function describeZone(zoneName) {
  const keywords = zoneKeywords(zoneName);
  const match = keywords.find((keyword) => zoneDescriptions[keyword]);
  return (
    zoneDescriptions[match] ||
    "This zone matters because it is part of the apartment reset map. Use it to focus the next small cleaning action."
  );
}

function findRelatedSystems(systems, keywords) {
  return (systems.systemSections || [])
    .filter((section) =>
      textIncludesKeyword(
        `${section.title} ${section.problem} ${(section.items || []).join(" ")} ${(
          section.secondaryItems || []
        ).join(" ")}`,
        keywords
      )
    )
    .slice(0, 3);
}

function findRelatedTasks(routines, keywords) {
  const matches = [];
  routines.forEach((routine) => {
    routine.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (textIncludesKeyword(`${task.title} ${task.detail} ${phase.title}`, keywords)) {
          matches.push({
            routineId: routine.id,
            routineTitle: routine.title,
            phaseTitle: phase.title,
            taskTitle: task.title
          });
        }
      });
    });
  });
  return matches.slice(0, 6);
}

export default function Systems({ template, onStartRoutine }) {
  const { systems, zones } = template;
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || "");
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) || zones[0] || null;
  const zoneFocus = useMemo(() => {
    if (!selectedZone) return null;
    const keywords = zoneKeywords(selectedZone.name);
    const relatedTasks = findRelatedTasks(template.routines, keywords);
    return {
      description: describeZone(selectedZone.name),
      relatedSystems: findRelatedSystems(systems, keywords),
      relatedTasks,
      nextActionRoutineId: relatedTasks.some((task) => task.routineId === "minimal-reset")
        ? "minimal-reset"
        : "weekly-reset"
    };
  }, [selectedZone, systems, template.routines]);

  return (
    <div className="screen-stack">
      <section className="panel">
        <p className="eyebrow">Permanent system</p>
        <h2>Bottlenecks</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Consequence</th>
              </tr>
            </thead>
            <tbody>
              {systems.bottlenecks.map((item) => (
                <tr key={`${item.problem}-${item.consequence}`}>
                  <td>{item.problem}</td>
                  <td>{item.consequence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Apartment map</p>
        <h2>Zones</h2>
        <div className="zone-chip-list">
          {zones.map((zone) => (
            <button
              className={
                selectedZone?.id === zone.id ? "date-chip zone-chip active" : "date-chip zone-chip"
              }
              key={zone.id}
              type="button"
              onClick={() => setSelectedZoneId(zone.id)}
            >
              {zone.name}
            </button>
          ))}
        </div>
        {selectedZone && zoneFocus ? (
          <div className="zone-focus-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Zone focus</p>
                <h3>{selectedZone.name}</h3>
              </div>
              <span className="pill">
                {zoneFocus.relatedTasks.length
                  ? `${zoneFocus.relatedTasks.length} related tasks`
                  : "General zone"}
              </span>
            </div>
            <p>{zoneFocus.description}</p>
            <div className="zone-focus-grid">
              <div>
                <h3>Related systems</h3>
                {zoneFocus.relatedSystems.length ? (
                  <ul className="system-list compact">
                    {zoneFocus.relatedSystems.map((section) => (
                      <li key={section.id}>{section.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No specific system matched. Use the priority order below.</p>
                )}
              </div>
              <div>
                <h3>Related routine tasks</h3>
                {zoneFocus.relatedTasks.length ? (
                  <ul className="system-list compact">
                    {zoneFocus.relatedTasks.map((task) => (
                      <li key={`${task.routineId}-${task.phaseTitle}-${task.taskTitle}`}>
                        <strong>{task.routineTitle}:</strong> {task.taskTitle}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    No checklist task matched this zone. Start with trash, dishes, laundry, or the
                    most visible surface.
                  </p>
                )}
              </div>
            </div>
            <div className="zone-focus-action">
              <p className="callout small">
                Useful next action:{" "}
                {zoneFocus.nextActionRoutineId === "minimal-reset"
                  ? "Start Minimal Reset"
                  : "Start Weekly Reset"}
              </p>
              <button
                className="button primary"
                type="button"
                onClick={() => onStartRoutine(zoneFocus.nextActionRoutineId)}
              >
                {zoneFocus.nextActionRoutineId === "minimal-reset"
                  ? "Start Minimal Reset"
                  : "Start Weekly Reset"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <p className="eyebrow">Do first</p>
        <h2>Priority Order</h2>
        <ol className="priority-list">
          {systems.priorityOrder.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </li>
          ))}
        </ol>
        <p className="warning-box">
          Do not start with shelves, rearranging, or organizing. First remove trash, clothes,
          dishes, and dirt.
        </p>
      </section>

      <div className="system-grid">
        {systems.systemSections.map((section) => (
          <section className="panel" key={section.id}>
            <p className="eyebrow">System</p>
            <h2>{section.title}</h2>
            <p className="muted">{section.problem}</p>
            <ul className="system-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {section.secondaryItems?.length ? (
              <div className="secondary-system">
                <h3>{section.secondaryTitle}</h3>
                <ul className="system-list">
                  {section.secondaryItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
