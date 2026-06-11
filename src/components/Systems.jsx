export default function Systems({ template }) {
  const { systems, zones } = template;

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
            <span className="date-chip" key={zone.id}>
              {zone.name}
            </span>
          ))}
        </div>
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
