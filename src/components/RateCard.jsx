function formatRate(value) {
  return value != null && Number.isFinite(Number(value)) ? `S$${Number(value).toFixed(2)}` : '---';
}

function movementClass(value) {
  if (value?.startsWith('▲')) return 'movement-up';
  if (value?.startsWith('▼')) return 'movement-down';
  return 'movement-flat';
}

export default function RateCard({ shop }) {
  const timestampLabel = shop.key === 'grt' ? 'Fetched' : 'Last Updated';
  const updated = shop.updated
    ? new Date(shop.updated).toLocaleString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <article className={`source-card ${shop.key}-card`}>
      <header className="source-card-header">
        <h2><a className="shop-title-link" href={`/shop/${shop.key}`}>{shop.title}</a></h2>
        <span className={`source-status ${shop.status === 'Available' ? 'is-available' : shop.status === 'Last available rate' ? 'is-stale' : 'is-unavailable'}`}>
          {shop.status || 'Unavailable'}
        </span>
      </header>
      <div className="source-card-body">
        <div className="purity-grid">
          {[916, 999].map((purity) => (
            <div className="rate-card" key={purity}>
              <h3>{purity === 916 ? '22K / 916' : '24K / 999'}</h3>
              <p className="rate-value">{formatRate(shop.rates?.[purity])}</p>
              <p className="rate-label">Indicative | {purity} SGD/g</p>
              {shop.movements?.[purity] && <p className={`movement-indicator ${movementClass(shop.movements[purity])}`}>{shop.movements[purity]}</p>}
            </div>
          ))}
        </div>
        {shop.errorMessage && <p className="inline-warning">{shop.errorMessage}</p>}
        <p className="source-updated">{timestampLabel}: {updated}</p>
        <a className="source-link" href={shop.url} target="_blank" rel="noopener noreferrer">Source website <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  );
}