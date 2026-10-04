import { useState } from 'react';
import { calculateGoldPrice, parsePercentage, validateWeight } from '../gold-calculator.js';

const weights = [0.25, 0.5, 0.75, 1, 1.2, 1.5, 2.25, 3.5, 5, 7.25, 10, 10.5, 25, 25.75, 50, 100, 250, 500, 1000];
const purities = [
  { value: 916, label: '22K / 916', minimum: 0.25 },
  { value: 999, label: '24K / 999', minimum: 1 }
];

function formatMoney(value) {
  return value == null ? 'Not available' : `S$${value.toFixed(2)}`;
}

export default function GoldPriceCalculator({ shop }) {
  const [weightValues, setWeightValues] = useState({ 916: '1', 999: '1' });
  const [makingChargeInput, setMakingChargeInput] = useState('0');
  const [gstInput, setGstInput] = useState('9');
  const makingChargePercent = parsePercentage(makingChargeInput);
  const gstPercent = parsePercentage(gstInput);

  return (
    <section className="content-section price-calculator" id="price-calculator">
      <div className="section-heading calculator-heading">
        <div>
          <p className="eyebrow">INDICATIVE ESTIMATE</p>
          <h2>Gold price calculator</h2>
          <p className="section-subtitle">Uses {shop.name}'s published rates. Enter the applicable making charge; it defaults to 0%.</p>
        </div>
        <div className="calculator-settings">
          <label>
            Making charge (%)
            <input aria-label="Making charge percentage" type="number" min="0" step="0.01" value={makingChargeInput} onChange={(event) => setMakingChargeInput(event.target.value)} />
          </label>
          <label>
            GST (%)
            <input aria-label="GST percentage" type="number" min="0" step="0.01" value={gstInput} onChange={(event) => setGstInput(event.target.value)} />
          </label>
        </div>
      </div>
      <div className="calculator-grid">
        {purities.map(({ value: purity, label, minimum }) => {
          const weight = validateWeight(weightValues[purity], minimum);
          const rate = shop.rates?.[purity];
          const percentageError = makingChargePercent == null || gstPercent == null
            ? 'Enter valid non-negative percentages for making charge and GST.'
            : '';
          const rateError = rate == null ? `Current ${label} rate is unavailable.` : '';
          const error = weight.error || percentageError || rateError;
          const breakdown = error ? null : calculateGoldPrice(rate, weight.value, makingChargePercent, gstPercent);
          const listId = `weight-options-${purity}`;

          return (
            <article className="calculator-panel" key={purity}>
              <div className="calculator-panel-heading">
                <h3>{label}</h3>
                <span>{formatMoney(rate)} / g</span>
              </div>
              <label className="weight-label" htmlFor={`weight-${purity}`}>Weight</label>
              <div className="weight-input-wrap">
                <input
                  aria-describedby={`weight-help-${purity}`}
                  aria-invalid={Boolean(weight.error)}
                  autoComplete="off"
                  id={`weight-${purity}`}
                  inputMode="decimal"
                  list={listId}
                  onChange={(event) => setWeightValues((current) => ({ ...current, [purity]: event.target.value }))}
                  type="text"
                  value={weightValues[purity]}
                />
                <span>g</span>
              </div>
              <datalist id={listId}>
                {weights.filter((preset) => preset >= minimum).map((preset) => <option value={preset} key={preset} />)}
              </datalist>
              <p className="weight-help" id={`weight-help-${purity}`}>Enter or select {minimum} to 1000 grams (g). Decimals are accepted.</p>
              {error && <p className="calculator-error" role="alert">{error}</p>}
              {breakdown && (
                <dl className="price-breakdown">
                  <div><dt>Gold value</dt><dd>{formatMoney(breakdown.goldValue)}</dd></div>
                  <div><dt>Making charge ({makingChargePercent}%)</dt><dd>{formatMoney(breakdown.makingCharge)}</dd></div>
                  <div><dt>Subtotal before GST</dt><dd>{formatMoney(breakdown.beforeGst)}</dd></div>
                  <div><dt>GST ({gstPercent}%)</dt><dd>{formatMoney(breakdown.gst)}</dd></div>
                  <div className="estimated-total"><dt>Estimated total</dt><dd>{formatMoney(breakdown.total)}</dd></div>
                </dl>
              )}
            </article>
          );
        })}
      </div>
      <p className="conversion-note">Estimate only. Actual making charges, taxes, and final prices may differ by product and shop.</p>
    </section>
  );
}