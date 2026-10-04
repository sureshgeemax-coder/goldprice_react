function formatRate(value) {
  return value != null ? `S$${Number(value).toFixed(2)}` : 'S$---';
}

function formatPercentage(value) {
  return value != null ? `${Number(value).toFixed(2)}%` : '---';
}

export default function ComparisonTable({ shops, comparisons }) {
  return (
    <section className="comparison-section" id="comparison">
      <div className="section-heading">
        <div><p className="eyebrow">SHOP-WISE SGD PER GRAM</p><h2>Published price comparison</h2></div>
      </div>
      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Gold purity</th>
              {shops.map((shop) => <th className="align-right" scope="col" key={shop.key}>{shop.name} (SGD/gram)</th>)}
              <th className="align-right" scope="col">Rate spread</th>
              <th scope="col">Highest published</th>
              <th scope="col">Lowest published</th>
              <th className="align-right" scope="col">Spread vs. low</th>
            </tr>
          </thead>
          <tbody>
            {[916, 999].map((purity) => {
              const comparison = comparisons?.[purity] || {};
              return (
                <tr key={purity}>
                  <th scope="row">{purity === 916 ? '22K / 916' : '24K / 999'}</th>
                  {shops.map((shop) => <td className="align-right" key={shop.key}>{formatRate(shop.rates?.[purity])}</td>)}
                  <td className="align-right spread-value">{comparison.difference == null ? 'S$---' : `S$${Math.abs(comparison.difference).toFixed(2)}`}</td>
                  <td>{comparison.higherRate || '---'}</td>
                  <td>{comparison.lowerRate || '---'}</td>
                  <td className="align-right">{formatPercentage(comparison.percentageDifference)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}