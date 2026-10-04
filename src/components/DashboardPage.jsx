import { useEffect, useState } from 'react';
import ComparisonTable from './ComparisonTable.jsx';
import CurrencyConverter from './CurrencyConverter.jsx';
import HistoryCharts from './HistoryCharts.jsx';
import Navigation from './Navigation.jsx';
import RateCard from './RateCard.jsx';

function formatTimestamp(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function DashboardPage({ dashboard, refreshing, refresh, refreshError }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-shell">
      <Navigation currentPath="/" />
      <main>
        <header className="dashboard-heading">
          <div>
            <p className="eyebrow">SINGAPORE | INDICATIVE PRICES</p>
            <h1><span className="heading-mark" aria-hidden="true">◆</span> Today's Gold Prices</h1>
            <p className="muted">Compare published 22K and 24K rates | SGD per gram</p>
          </div>
          <div className="heading-actions">
            <time className="current-time" dateTime={now.toISOString()}>{now.toLocaleString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
            <span className="refresh-badge">Last Refresh: {formatTimestamp(dashboard.lastRefresh)}</span>
            <button className="refresh-button" type="button" onClick={refresh} disabled={refreshing}>
              <span aria-hidden="true">↻</span> {refreshing ? 'Refreshing…' : 'Refresh Now'}
            </button>
          </div>
        </header>

        {refreshError && <p className="global-warning" role="status">{refreshError}</p>}
        <section className="source-grid" id="gold-rates" aria-label="Published shop rates">
          {dashboard.shops.map((shop) => <RateCard shop={shop} key={shop.key} />)}
        </section>
        <ComparisonTable shops={dashboard.shops} comparisons={dashboard.comparisons} />
        <HistoryCharts />
        <CurrencyConverter shops={dashboard.shops} />
        <aside className="price-disclaimer">
          <p className="eyebrow">INFORMATION AND COMPARISON ONLY</p>
          <p>Gold prices shown are extracted/referenced from the respective jewellery shop websites and are for information and comparison purposes only. Prices may change frequently and may vary from the actual in-store price due to market movements, timing of updates, product/design differences, workmanship and other applicable charges. Please confirm the final price directly with the respective jewellery shop before making a purchase.</p>
          <p>Rates are presented as published by each source; GST treatment has not been independently verified or adjusted. The dashboard is not an official quotation. Check the source website and confirm applicable taxes and the final price with the shop.</p>
        </aside>
      </main>
      {refreshing && <div className="loading-overlay" role="status" aria-label="Refreshing published gold rates"><span className="loading-spinner" /></div>}
    </div>
  );
}