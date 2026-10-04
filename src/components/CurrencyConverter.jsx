import { useEffect, useState } from 'react';

const currencies = [
  ['SGD', 'Singapore Dollar'], ['INR', 'Indian Rupee'], ['USD', 'US Dollar'], ['MYR', 'Malaysian Ringgit'],
  ['AED', 'UAE Dirham'], ['GBP', 'British Pound'], ['EUR', 'Euro']
];

function formatEquivalent(value, currency, rate) {
  if (value == null || rate == null) return '-';
  const prefix = currency === 'SGD' ? 'S$' : `${currency} `;
  return `${prefix}${(Number(value) * rate).toFixed(2)} / g`;
}

export default function CurrencyConverter({ shops }) {
  const [currency, setCurrency] = useState('SGD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [exchangeDate, setExchangeDate] = useState('');
  const [status, setStatus] = useState('Primary display currency.');

  useEffect(() => {
    if (currency === 'SGD') {
      setExchangeRate(1);
      setExchangeDate('');
      setStatus('Primary display currency.');
      return undefined;
    }

    const controller = new AbortController();
    setExchangeRate(null);
    setStatus('Fetching reference exchange rate...');
    fetch(`https://api.frankfurter.dev/v1/latest?base=SGD&symbols=${currency}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Exchange rate unavailable.');
        return response.json();
      })
      .then((data) => {
        const value = Number(data.rates?.[currency]);
        if (!Number.isFinite(value)) throw new Error('Exchange rate unavailable.');
        setExchangeRate(value);
        setExchangeDate(data.date || '');
        setStatus(`Reference exchange rate dated ${data.date}.`);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setExchangeRate(null);
          setExchangeDate('');
          setStatus('Reference exchange rate unavailable.');
        }
      });

    return () => controller.abort();
  }, [currency]);

  return (
    <section className="content-section converter-section" id="currency-converter">
      <div className="section-heading converter-heading">
        <div>
          <p className="eyebrow">REFERENCE CONVERSION</p>
          <h2>Currency converter</h2>
          <p className="section-subtitle">Rates remain displayed in SGD first; equivalents are estimates.</p>
        </div>
        <div className="converter-bar">
          <label htmlFor="currencySelect">{shops.length === 1 ? 'Display equivalent in' : 'Convert to'}</label>
          <select id="currencySelect" value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {currencies.map(([code, name]) => <option value={code} key={code}>{code} | {name}</option>)}
          </select>
        </div>
      </div>
      <p className="conversion-note">Converted values are reference conversions using external exchange rates, not shop quotations. {status} {exchangeDate && <span>Exchange-rate date: {exchangeDate}.</span>}</p>
      {shops.length === 1 ? (
        <div className="converted-detail">
          {[916, 999].map((purity) => <span key={purity}>{purity === 916 ? '22K / 916' : '24K / 999'}<strong>{formatEquivalent(shops[0].rates?.[purity], currency, exchangeRate)}</strong></span>)}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="comparison-table conversion-table">
            <thead><tr><th>Shop</th><th>22K / 916 per gram</th><th>24K / 999 per gram</th></tr></thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.key}>
                  <th scope="row">{shop.name}</th>
                  <td>{formatEquivalent(shop.rates?.[916], currency, exchangeRate)}</td>
                  <td>{formatEquivalent(shop.rates?.[999], currency, exchangeRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}