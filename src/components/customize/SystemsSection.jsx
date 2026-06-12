import { moveItem } from "../../utils/routineUtils.js";
import { createId } from "../../utils/templateUtils.js";

function listToLines(items) {
  return (items || []).join("\n");
}

function linesToList(value) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SystemsSection({ systems, canEdit, onEditTemplate, onConfirmEdit }) {
  const apartmentLaws = systems.apartmentLaws || [];
  const bottlenecks = systems.bottlenecks || [];
  const priorityOrder = systems.priorityOrder || [];
  const systemSections = systems.systemSections || [];

  function editSystems(mutator) {
    onEditTemplate((draft) => {
      mutator(draft.systems);
    });
  }

  function addLaw() {
    editSystems((draftSystems) => {
      draftSystems.apartmentLaws.push("New apartment law");
    });
  }

  function updateLaw(index, value) {
    editSystems((draftSystems) => {
      draftSystems.apartmentLaws[index] = value;
    });
  }

  function moveLaw(index, direction) {
    editSystems((draftSystems) => {
      draftSystems.apartmentLaws = moveItem(draftSystems.apartmentLaws, index, direction);
    });
  }

  function deleteLaw(index) {
    onConfirmEdit({
      title: "Delete apartment law?",
      message: "This principle will be removed from the dashboard and systems page.",
      confirmLabel: "Delete law",
      edit: (draft) => {
        draft.systems.apartmentLaws.splice(index, 1);
      }
    });
  }

  function addBottleneck() {
    editSystems((draftSystems) => {
      draftSystems.bottlenecks.push({
        problem: "New bottleneck",
        consequence: "What happens if this is ignored"
      });
    });
  }

  function updateBottleneck(index, field, value) {
    editSystems((draftSystems) => {
      draftSystems.bottlenecks[index][field] = value;
    });
  }

  function deleteBottleneck(index) {
    onConfirmEdit({
      title: "Delete bottleneck?",
      message: "This row will be removed from the systems page.",
      confirmLabel: "Delete bottleneck",
      edit: (draft) => {
        draft.systems.bottlenecks.splice(index, 1);
      }
    });
  }

  function addPriority() {
    editSystems((draftSystems) => {
      draftSystems.priorityOrder.push({ title: "New priority", detail: "What to do first" });
    });
  }

  function updatePriority(index, field, value) {
    editSystems((draftSystems) => {
      draftSystems.priorityOrder[index][field] = value;
    });
  }

  function movePriority(index, direction) {
    editSystems((draftSystems) => {
      draftSystems.priorityOrder = moveItem(draftSystems.priorityOrder, index, direction);
    });
  }

  function deletePriority(index) {
    onConfirmEdit({
      title: "Delete priority?",
      message: "This priority step will be removed from the systems page.",
      confirmLabel: "Delete priority",
      edit: (draft) => {
        draft.systems.priorityOrder.splice(index, 1);
      }
    });
  }

  function addSystemSection() {
    editSystems((draftSystems) => {
      draftSystems.systemSections.push({
        id: createId("system"),
        title: "New system",
        problem: "",
        items: [],
        secondaryTitle: "",
        secondaryItems: []
      });
    });
  }

  function updateSystemSection(index, field, value) {
    editSystems((draftSystems) => {
      draftSystems.systemSections[index][field] =
        field === "items" || field === "secondaryItems" ? linesToList(value) : value;
    });
  }

  function moveSystemSection(index, direction) {
    editSystems((draftSystems) => {
      draftSystems.systemSections = moveItem(draftSystems.systemSections, index, direction);
    });
  }

  function deleteSystemSection(section, index) {
    onConfirmEdit({
      title: "Delete system section?",
      message: `"${section.title}" will be removed from the systems page.`,
      confirmLabel: "Delete section",
      edit: (draft) => {
        draft.systems.systemSections.splice(index, 1);
      }
    });
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Systems</p>
            <h2>Apartment Laws</h2>
            <p>High-level rules that appear on the dashboard and Systems page.</p>
          </div>
          <button className="button primary" type="button" disabled={!canEdit} onClick={addLaw}>
            Add law
          </button>
        </div>

        <div className="editor-list">
          {apartmentLaws.map((law, index) => (
            <div className="editor-row" key={`${law}-${index}`}>
              <label className="field-label" htmlFor={`law-${index}`}>
                Law
                <input
                  id={`law-${index}`}
                  value={law}
                  disabled={!canEdit}
                  onChange={(event) => updateLaw(index, event.target.value)}
                />
              </label>
              <div className="row-actions">
                <button
                  className="button small ghost"
                  type="button"
                  disabled={!canEdit || index === 0}
                  onClick={() => moveLaw(index, -1)}
                >
                  Move up
                </button>
                <button
                  className="button small ghost"
                  type="button"
                  disabled={!canEdit || index === apartmentLaws.length - 1}
                  onClick={() => moveLaw(index, 1)}
                >
                  Move down
                </button>
                <button
                  className="button small danger-ghost"
                  type="button"
                  disabled={!canEdit}
                  onClick={() => deleteLaw(index)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Systems</p>
            <h2>Bottlenecks</h2>
            <p>Name the failure points that make the apartment feel messy fastest.</p>
          </div>
          <button
            className="button primary"
            type="button"
            disabled={!canEdit}
            onClick={addBottleneck}
          >
            Add bottleneck
          </button>
        </div>

        <div className="editor-list">
          {bottlenecks.map((item, index) => (
            <details className="editor-card compact-disclosure" key={`${item.problem}-${index}`}>
              <summary className="disclosure-summary">
                <div>
                  <h3>{item.problem || `Bottleneck ${index + 1}`}</h3>
                  {item.consequence ? <p>{item.consequence}</p> : null}
                </div>
              </summary>
              <div className="form-grid">
                <label className="field-label" htmlFor={`bottleneck-problem-${index}`}>
                  Problem
                  <input
                    id={`bottleneck-problem-${index}`}
                    value={item.problem}
                    disabled={!canEdit}
                    onChange={(event) => updateBottleneck(index, "problem", event.target.value)}
                  />
                </label>
                <label className="field-label" htmlFor={`bottleneck-consequence-${index}`}>
                  Consequence
                  <input
                    id={`bottleneck-consequence-${index}`}
                    value={item.consequence}
                    disabled={!canEdit}
                    onChange={(event) => updateBottleneck(index, "consequence", event.target.value)}
                  />
                </label>
              </div>
              <div className="row-actions">
                <button
                  className="button small danger-ghost"
                  type="button"
                  disabled={!canEdit}
                  onClick={() => deleteBottleneck(index)}
                >
                  Delete
                </button>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Systems</p>
            <h2>Priority Order</h2>
            <p>Control the order shown in the Systems priority list.</p>
          </div>
          <button className="button primary" type="button" disabled={!canEdit} onClick={addPriority}>
            Add priority
          </button>
        </div>

        <div className="editor-list">
          {priorityOrder.map((item, index) => (
            <details className="editor-card compact-disclosure" key={`${item.title}-${index}`}>
              <summary className="disclosure-summary">
                <div>
                  <h3>{item.title || `Priority ${index + 1}`}</h3>
                  {item.detail ? <p>{item.detail}</p> : null}
                </div>
              </summary>
              <div className="form-grid">
                <label className="field-label" htmlFor={`priority-title-${index}`}>
                  Title
                  <input
                    id={`priority-title-${index}`}
                    value={item.title}
                    disabled={!canEdit}
                    onChange={(event) => updatePriority(index, "title", event.target.value)}
                  />
                </label>
                <label className="field-label" htmlFor={`priority-detail-${index}`}>
                  Detail
                  <input
                    id={`priority-detail-${index}`}
                    value={item.detail}
                    disabled={!canEdit}
                    onChange={(event) => updatePriority(index, "detail", event.target.value)}
                  />
                </label>
              </div>
              <div className="row-actions">
                <button
                  className="button small ghost"
                  type="button"
                  disabled={!canEdit || index === 0}
                  onClick={() => movePriority(index, -1)}
                >
                  Move up
                </button>
                <button
                  className="button small ghost"
                  type="button"
                  disabled={!canEdit || index === priorityOrder.length - 1}
                  onClick={() => movePriority(index, 1)}
                >
                  Move down
                </button>
                <button
                  className="button small danger-ghost"
                  type="button"
                  disabled={!canEdit}
                  onClick={() => deletePriority(index)}
                >
                  Delete
                </button>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Systems</p>
            <h2>System Sections</h2>
            <p>Expandable maintenance notes for supplies, prevention, and recurring problems.</p>
          </div>
          <button
            className="button primary"
            type="button"
            disabled={!canEdit}
            onClick={addSystemSection}
          >
            Add section
          </button>
        </div>

        <div className="editor-list">
          {systemSections.map((section, index) => (
            <details className="editor-card system-section-editor compact-disclosure" key={section.id}>
              <summary className="disclosure-summary">
                <div>
                  <h3>{section.title || "System section"}</h3>
                  {section.problem ? <p>{section.problem}</p> : null}
                  <p>{(section.items?.length || 0) + (section.secondaryItems?.length || 0)} notes</p>
                </div>
              </summary>
              <div className="editor-card-header">
                <div className="row-actions">
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={!canEdit || index === 0}
                    onClick={() => moveSystemSection(index, -1)}
                  >
                    Move up
                  </button>
                  <button
                    className="button small ghost"
                    type="button"
                    disabled={!canEdit || index === systemSections.length - 1}
                    onClick={() => moveSystemSection(index, 1)}
                  >
                    Move down
                  </button>
                  <button
                    className="button small danger-ghost"
                    type="button"
                    disabled={!canEdit}
                    onClick={() => deleteSystemSection(section, index)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <label className="field-label" htmlFor={`system-title-${section.id}`}>
                  Title
                  <input
                    id={`system-title-${section.id}`}
                    value={section.title}
                    disabled={!canEdit}
                    onChange={(event) => updateSystemSection(index, "title", event.target.value)}
                  />
                </label>
                <label className="field-label" htmlFor={`system-problem-${section.id}`}>
                  Problem / purpose
                  <input
                    id={`system-problem-${section.id}`}
                    value={section.problem}
                    disabled={!canEdit}
                    onChange={(event) => updateSystemSection(index, "problem", event.target.value)}
                  />
                </label>
                <label className="field-label field-span" htmlFor={`system-items-${section.id}`}>
                  Items, one per line
                  <textarea
                    id={`system-items-${section.id}`}
                    className="textarea-small"
                    value={listToLines(section.items)}
                    disabled={!canEdit}
                    onChange={(event) => updateSystemSection(index, "items", event.target.value)}
                  />
                </label>
                <label className="field-label" htmlFor={`system-secondary-title-${section.id}`}>
                  Secondary title
                  <input
                    id={`system-secondary-title-${section.id}`}
                    value={section.secondaryTitle}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateSystemSection(index, "secondaryTitle", event.target.value)
                    }
                  />
                </label>
                <label
                  className="field-label field-span"
                  htmlFor={`system-secondary-items-${section.id}`}
                >
                  Secondary items, one per line
                  <textarea
                    id={`system-secondary-items-${section.id}`}
                    className="textarea-small"
                    value={listToLines(section.secondaryItems)}
                    disabled={!canEdit}
                    onChange={(event) =>
                      updateSystemSection(index, "secondaryItems", event.target.value)
                    }
                  />
                </label>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
