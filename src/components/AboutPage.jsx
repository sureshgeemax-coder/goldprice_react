import Navigation from './Navigation.jsx';

export default function AboutPage() {
  return (
    <div className="dashboard-shell">
      <Navigation currentPath="/about" />
      <main className="content-section about-content">
        <p className="eyebrow">ABOUT THIS PROJECT</p>
        <h1>Singapore Gold Rates</h1>
        <p className="about-lead">A simple place to review and compare published Singapore gold rates from jewellery shops.</p>
        <div className="about-credit">
          <span className="meta-label">Designed and maintained by</span>
          <p className="about-name">G Sureshkumar</p>
          <p className="muted">Singapore</p>
        </div>
        <a className="return-button" href="/">Return to dashboard</a>
      </main>
    </div>
  );
}