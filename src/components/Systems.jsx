import { useEffect, useMemo, useState } from "react";

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

const zoneGuidance = {
  trash: {
    frequency: "Check daily; remove before smell appears.",
    watch: "Overflowing bins, food packaging, bathroom trash, and recycling piles.",
    tips: "Keep one obvious exit path for trash and recycling. Do not sort everything perfectly before taking obvious trash out.",
    supplies: "trash bags, recycling bag, gloves if needed",
    goodEnough: "Bins are not overflowing and food trash is out of the room."
  },
  dishes: {
    frequency: "Check daily; reset before cooking or sleeping.",
    watch: "Sink blockage, cups around the room, food smell, and no clean prep space.",
    tips: "Collect dishes first, then wash or stage them. A clear sink matters more than a perfect kitchen.",
    supplies: "dish soap, sponge, drying space",
    goodEnough: "Sink and counters can be used again."
  },
  laundry: {
    frequency: "Contain daily; run a cycle when the basket is realistically full.",
    watch: "Clothes on floor, damp towels, chair piles, and blocked walkways.",
    tips: "Contain first, sort second. Getting fabric off the floor changes the whole room quickly.",
    supplies: "laundry basket, detergent, hangers",
    goodEnough: "Dirty clothes are contained and clean clothes have a landing place."
  },
  bathroom: {
    frequency: "Light reset weekly; smell check more often.",
    watch: "Toilet smell, sink film, wet towels, trash, and floor hair.",
    tips: "Do toilet and sink before detail cleaning. Bathroom smell has high impact.",
    supplies: "bathroom cleaner, toilet brush, cloth, trash bag",
    goodEnough: "Toilet, sink, trash, and towel situation are guest-safe."
  },
  kitchen: {
    frequency: "Light reset daily; deeper reset weekly.",
    watch: "Dishes, sticky counters, food trash, floor crumbs, and blocked prep space.",
    tips: "Start with trash and dishes. Wiping counters before those are handled wastes energy.",
    supplies: "dish soap, cloth, surface cleaner, trash bag",
    goodEnough: "You can prepare food without moving clutter first."
  },
  bedroom: {
    frequency: "Reset weekly or when laundry spreads.",
    watch: "Bed clutter, laundry piles, cups, trash, and blocked floor space.",
    tips: "Make the bed or clear it enough to use as a sorting surface, then remove laundry and trash.",
    supplies: "laundry basket, trash bag, fresh bedding if needed",
    goodEnough: "Bed and floor are usable, and laundry is contained."
  },
  living: {
    frequency: "Reset before guests or weekly.",
    watch: "Table clutter, cups, dishes, blankets, visible trash, and seating blocked.",
    tips: "Clear sightlines first: tables, seating, and floor paths.",
    supplies: "basket, trash bag, cloth",
    goodEnough: "Someone can sit down without you apologizing for the room."
  },
  entrance: {
    frequency: "Check weekly and before guests.",
    watch: "Shoes, bags, mail, and hallway clutter that migrates inward.",
    tips: "The entrance is a boundary. Keep it easy to pass through.",
    supplies: "shoe spot, small tray, bag hook",
    goodEnough: "You can enter and leave without stepping around things."
  },
  floors: {
    frequency: "After surfaces and clutter; spot clean as needed.",
    watch: "Crumbs, hair, dust paths, sticky spots, and blocked vacuum access.",
    tips: "Floors are a final pass. Clear trash, dishes, and laundry first.",
    supplies: "vacuum, broom, mop or cloth",
    goodEnough: "Main walking paths are clear and visibly decent."
  },
  windows: {
    frequency: "Monthly or when visible marks bother you.",
    watch: "Fingerprints, dust on sills, condensation, and mold-prone edges.",
    tips: "Windows are maintenance, not emergency cleaning. Do them after core bottlenecks.",
    supplies: "glass cloth, mild cleaner",
    goodEnough: "Main marks are gone and moisture-prone edges are checked."
  }
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

function getZoneGuidance(zoneName) {
  const keywords = zoneKeywords(zoneName);
  const match = keywords.find((keyword) => zoneGuidance[keyword]);
  return (
    zoneGuidance[match] || {
      frequency: "Fold into the weekly reset or inspect when it starts bothering you.",
      watch: "Visible clutter, blocked access, smell, dirt, or anything that spreads into other zones.",
      tips: "Use this zone as a focus lens. Remove obvious trash and blockers before detail work.",
      supplies: "cloth, basket, trash bag",
      goodEnough: "The zone is usable and no longer pulling attention."
    }
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
  return matches;
}

export default function Systems({ template }) {
  const { systems, zones } = template;
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id || "");
  const [showAllRelatedTasks, setShowAllRelatedTasks] = useState(false);
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) || zones[0] || null;
  const zoneFocus = useMemo(() => {
    if (!selectedZone) return null;
    const keywords = zoneKeywords(selectedZone.name);
    const relatedTasks = findRelatedTasks(template.routines, keywords);
    return {
      description: describeZone(selectedZone.name),
      guidance: getZoneGuidance(selectedZone.name),
      relatedSystems: findRelatedSystems(systems, keywords),
      relatedTasks
    };
  }, [selectedZone, systems, template.routines]);
  const visibleRelatedTasks = zoneFocus?.relatedTasks
    ? showAllRelatedTasks
      ? zoneFocus.relatedTasks
      : zoneFocus.relatedTasks.slice(0, 3)
    : [];

  useEffect(() => {
    setShowAllRelatedTasks(false);
  }, [selectedZoneId]);

  return (
    <div className="screen-stack">
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
              aria-pressed={selectedZone?.id === zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
            >
              {zone.name}
            </button>
          ))}
        </div>
        {selectedZone && zoneFocus ? (
          <div className="zone-focus-panel">
            <div className="section-heading zone-focus-heading">
              <div>
                <p className="eyebrow">Zone focus</p>
                <h3>{selectedZone.name}</h3>
                <p>{zoneFocus.description}</p>
              </div>
              <span className="pill">
                {zoneFocus.relatedTasks.length
                  ? `${zoneFocus.relatedTasks.length} related tasks`
                  : "General zone"}
              </span>
            </div>
            <div className="zone-guidance-rows">
              <div>
                <span>Frequency</span>
                <strong>{zoneFocus.guidance.frequency}</strong>
              </div>
              <div>
                <span>Watch for</span>
                <strong>{zoneFocus.guidance.watch}</strong>
              </div>
              <div>
                <span>Supplies</span>
                <strong>{zoneFocus.guidance.supplies}</strong>
              </div>
              <div>
                <span>Good enough</span>
                <strong>{zoneFocus.guidance.goodEnough}</strong>
              </div>
            </div>
            <p className="callout small">{zoneFocus.guidance.tips}</p>
            <div className="zone-focus-grid">
              <div>
                <h3>Related systems</h3>
                {zoneFocus.relatedSystems.length ? (
                  <ul className="reference-chip-list">
                    {zoneFocus.relatedSystems.map((section) => (
                      <li key={section.id}>{section.title}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No specific system matched. Use the priority order below.</p>
                )}
              </div>
              <div>
                <div className="related-task-heading">
                  <h3>Related routine tasks</h3>
                  {zoneFocus.relatedTasks.length ? (
                    <span>{zoneFocus.relatedTasks.length} total</span>
                  ) : null}
                </div>
                {zoneFocus.relatedTasks.length ? (
                  <>
                    <p className="muted">Reference only. These tasks show where the zone appears in routines.</p>
                    <ul className="system-list compact related-task-list">
                      {visibleRelatedTasks.map((task) => (
                        <li key={`${task.routineId}-${task.phaseTitle}-${task.taskTitle}`}>
                          <strong>{task.routineTitle}:</strong> {task.taskTitle}
                        </li>
                      ))}
                    </ul>
                    {zoneFocus.relatedTasks.length > 3 ? (
                      <button
                        className="button small ghost related-toggle"
                        type="button"
                        onClick={() => setShowAllRelatedTasks((current) => !current)}
                      >
                        {showAllRelatedTasks ? "Show less" : "Show all"}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p className="muted">
                    No checklist task matched this zone. Use the guidance above and the priority
                    order below.
                  </p>
                )}
              </div>
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
          <details className="panel system-info-detail" key={section.id}>
            <summary className="system-info-summary compact">
              <span>
                <span className="eyebrow">System</span>
                <strong>{section.title}</strong>
                <small>
                  {(section.items?.length || 0) + (section.secondaryItems?.length || 0)} notes
                </small>
              </span>
            </summary>
            {section.problem ? (
              <div className="system-content-block">
                <p className="eyebrow">Problem chain</p>
                <p className="muted">{section.problem}</p>
              </div>
            ) : null}
            <div className="system-content-block">
              <p className="eyebrow">Rules</p>
              <ul className="system-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {section.secondaryItems?.length ? (
              <div className="secondary-system system-content-block">
                <p className="eyebrow">{section.secondaryTitle || "Practical tip"}</p>
                <ul className="system-list">
                  {section.secondaryItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </details>
        ))}
      </div>
    </div>
  );
}
