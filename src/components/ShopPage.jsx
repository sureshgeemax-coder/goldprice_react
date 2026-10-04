import CurrencyConverter from './CurrencyConverter.jsx';
import HistoryCharts from './HistoryCharts.jsx';
import Navigation from './Navigation.jsx';

function formatRate(value) {
  return value != null ? `S$${Number(value).toFixed(2)}` : 'Not available';
}

function formatTimestamp(value) {
  return value ? new Date(value).toLocaleString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Unavailable';
}

export default function ShopPage({ shop }) {
  const statusClass = shop.status === 'Available' ? 'is-available' : shop.status === 'Last available rate' ? 'is-stale' : 'is-unavailable';

  return (
    <div className="dashboard-shell">
      <Navigation currentPath={`/shop/${shop.key}`} />
      <main>
        <header className="page-heading">
          <div>
            <a className="back-link" href="/">← Back to shop comparison</a>
            <p className="eyebrow page-eyebrow">SINGAPORE | SGD PER GRAM | INDICATIVE PRICE</p>
            <h1>{shop.name} Gold Rates</h1>
          </div>
          <span className={`source-status ${statusClass}`}>{shop.status}</span>
        </header>
        {shop.errorMessage && <p className="inline-warning detail-warning">{shop.errorMessage}</p>}
        <section className="detail-rate-grid" aria-label="Current indicative prices">
          {[916, 999].map((purity) => (
            <article className="detail-rate-panel" key={purity}>
              <div>
                <span className="purity-label">{purity === 916 ? '22K / 916' : '24K / 999'}</span>
                <p className="detail-rate">{formatRate(shop.rates?.[purity])}</p>
                <span className="rate-label">Indicative price per gram | SGD</span>
              </div>
              {shop.movements?.[purity] && <p className="movement-indicator">{shop.movements[purity]}</p>}
            </article>
          ))}
        </section>
        <section className="detail-meta">
          <div><span className="meta-label">{shop.key === 'grt' ? 'Fetched; source does not publish an update time' : 'Last updated by source'}</span><strong>{formatTimestamp(shop.updated)}</strong></div>
          <div><span className="meta-label">Rate source</span><a href={shop.url} target="_blank" rel="noopener noreferrer">Visit {shop.name} source ↗</a></div>
          <div><span className="meta-label">GST treatment</span><span>As published by the shop; not independently verified</span></div>
        </section>
        <HistoryCharts shop={shop} />
        <CurrencyConverter shops={[shop]} />
        <aside className="price-disclaimer">
          <strong>Indicative prices only</strong>
          <p>Gold prices shown are extracted/referenced from the respective jewellery shop websites and are for information and comparison purposes only. Prices may change frequently and may vary from the actual in-store price due to market movements, timing of updates, product/design differences, workmanship and other applicable charges. Please confirm the final price directly with the respective jewellery shop before making a purchase.</p>
        </aside>
      </main>
    </div>
  );
}