import { useEffect, useRef, useState } from 'react';
import { Chart, Legend, LinearScale, LineElement, PointElement, ScatterController, Tooltip } from 'chart.js';
import { PURITIES, SHOPS } from '../../server/domain.js';

Chart.register(ScatterController, LinearScale, PointElement, LineElement, Tooltip, Legend);

const periods = [
  { value: '7', label: '7 days' },
  { value: '30', label: '1 month' },
  { value: '90', label: '3 months' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' }
];

function observationTime(row) {
  if (row.Date && row.Time) return new Date(`${row.Date}T${row.Time}+08:00`).getTime();
  return new Date(row.LastUpdated).getTime();
}

function createDatasets(rows, purity, shop) {
  if (shop) {
    return PURITIES.map((item) => ({
      label: item === 916 ? '22K / 916 (SGD/g)' : '24K / 999 (SGD/g)',
      data: rows
        .filter((row) => Number(row.Purity) === item)
        .map((row) => ({ x: observationTime(row), y: Number(row.RatePerGram) }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
      showLine: true,
      spanGaps: false,
      borderColor: item === 916 ? '#b58b35' : '#176b66',
      backgroundColor: item === 916 ? '#b58b35' : '#176b66',
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2,
      tension: 0.15
    }));
  }

  return SHOPS.map((source) => ({
    label: source.name,
    data: rows
      .filter((row) => row.Source === source.source && Number(row.Purity) === purity)
      .map((row) => ({ x: observationTime(row), y: Number(row.RatePerGram) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
    showLine: true,
    spanGaps: false,
    borderColor: source.color,
    backgroundColor: source.color,
    pointRadius: 2,
    pointHoverRadius: 5,
    borderWidth: 2,
    tension: 0.15
  }));
}

function chartOptions(values) {
  const minimum = values.length ? Math.min(...values) : undefined;
  const maximum = values.length ? Math.max(...values) : undefined;
  const padding = values.length ? Math.max((maximum - minimum) * 0.06, maximum * 0.002) : undefined;

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          title: (items) => items.length ? new Date(items[0].parsed.x).toLocaleString('en-SG') : '',
          label: (item) => `${item.dataset.label}: S$${item.parsed.y.toFixed(2)} / g`
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        ticks: { maxTicksLimit: 8, callback: (value) => new Date(Number(value)).toLocaleDateString('en-SG', { day: '2-digit', month: 'short' }) },
        title: { display: true, text: 'Recorded date and time' }
      },
      y: {
        min: values.length ? Math.max(0, minimum - padding) : undefined,
        max: values.length ? maximum + padding : undefined,
        title: { display: true, text: 'SGD per gram' }
      }
    }
  };
}

export default function HistoryCharts({ shop = null }) {
  const [period, setPeriod] = useState('7');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const canvas916 = useRef(null);
  const canvas999 = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ filter: period });
    if (shop) query.set('source', shop.source);

    setLoading(true);
    setError('');
    fetch(`/api/history?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('History is temporarily unavailable.');
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('History is temporarily unavailable.');
        setRows(data.filter((row) => row.Status === 'Success' && PURITIES.includes(Number(row.Purity))));
      })
      .catch((reason) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [period, shop]);

  useEffect(() => {
    const charts = [];
    const createChart = (canvas, purity) => {
      if (!canvas) return;
      const datasets = createDatasets(rows, purity, shop);
      const values = datasets.flatMap((dataset) => dataset.data.map((point) => point.y));
      charts.push(new Chart(canvas, { type: 'scatter', data: { datasets }, options: chartOptions(values) }));
    };

    if (shop) createChart(canvas916.current, 916);
    else {
      createChart(canvas916.current, 916);
      createChart(canvas999.current, 999);
    }

    return () => charts.forEach((chart) => chart.destroy());
  }, [rows, shop]);

  const heading = shop ? 'Price history' : 'Gold price history';
  const filteredRows = shop ? rows.filter((row) => row.Source === shop.source) : rows;

  return (
    <section className="content-section history-section" id="history">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{shop ? 'EXCEL-BACKED OBSERVATIONS' : 'RECORDED SHOP OBSERVATIONS'}</p>
          <h2>{heading}</h2>
          <p className="section-subtitle">{shop ? 'Only rates actually recorded for this shop are plotted.' : 'Each point comes from an actual saved rate; gaps mean no observation was recorded.'}</p>
        </div>
        <div className="period-control" role="group" aria-label="History period">
          {periods.map((item) => (
            <button
              className={`period-button${period === item.value ? ' active' : ''}`}
              type="button"
              aria-pressed={period === item.value}
              key={item.value}
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {shop ? (
        <div className="chart-frame single-chart"><canvas ref={canvas916} aria-label={`${shop.name} historical 22K and 24K prices`} /></div>
      ) : (
        <div className="history-chart-grid">
          <div><h3 className="chart-title">22K / 916</h3><div className="chart-frame"><canvas ref={canvas916} aria-label="Historical 22K gold prices" /></div></div>
          <div><h3 className="chart-title">24K / 999</h3><div className="chart-frame"><canvas ref={canvas999} aria-label="Historical 24K gold prices" /></div></div>
        </div>
      )}
      {!loading && error && <p className="empty-state" role="status">{error}</p>}
      {!loading && !error && filteredRows.length === 0 && <p className="empty-state">No recorded rates in this period. Nothing has been estimated or filled in.</p>}
    </section>
  );
}