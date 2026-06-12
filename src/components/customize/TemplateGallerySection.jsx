import { getRoutineTotalTasks } from "../../utils/calculations.js";

export default function TemplateGallerySection({ gallery, onUseTemplate }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Template Gallery</p>
          <h2>Built-In Presets</h2>
          <p>
            Gallery templates are protected presets. Use one to create a new editable custom copy.
          </p>
        </div>
      </div>

      <div className="gallery-grid">
        {gallery.map((item) => {
          const routineCount = item.template.routines.length;
          const taskCount = item.template.routines.reduce(
            (sum, routine) => sum + getRoutineTotalTasks(routine),
            0
          );

          return (
            <article className="gallery-card" key={item.id}>
              <div>
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">{item.complexity}</p>
                    <h3>{item.name}</h3>
                  </div>
                  <span className="pill">{routineCount} routines</span>
                </div>
                <p>{item.description}</p>
                <dl className="gallery-meta">
                  <div>
                    <dt>Best for</dt>
                    <dd>{item.bestFor}</dd>
                  </div>
                  <div>
                    <dt>Tasks</dt>
                    <dd>{taskCount}</dd>
                  </div>
                </dl>
              </div>
              <button className="button primary wide" type="button" onClick={() => onUseTemplate(item)}>
                Use this template
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
