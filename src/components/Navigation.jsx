import { useState } from 'react';

const links = [
  { label: 'Dashboard', href: '/', page: true },
  { label: 'Gold Rates', href: '/#gold-rates' },
  { label: 'Malabar', href: '/shop/malabar', page: true },
  { label: 'Mustafa', href: '/shop/mustafa', page: true },
  { label: 'GRT', href: '/shop/grt', page: true },
  { label: 'Joyalukkas', href: '/shop/joyalukkas', page: true },
  { label: 'Compare Prices', href: '/#comparison' },
  { label: 'Gold Price History', href: '/#history' },
  { label: 'Currency Converter', href: '/#currency-converter' },
  { label: 'About Us', href: '/about', page: true }
];

export default function Navigation({ currentPath }) {
  const [expanded, setExpanded] = useState(false);
  const [exitMessage, setExitMessage] = useState('');

  function closeCurrentTab() {
    setExitMessage('');
    window.close();
    if (!window.closed) setExitMessage('Your browser blocked this page from closing. Close this tab to exit.');
  }

  function exitApplication() {
    if (window.confirm('Exit the Gold Price Rate Dashboard?')) closeCurrentTab();
  }

  return (
    <>
      <nav className="dashboard-nav" aria-label="Main navigation">
        <a className="navbar-brand" href="/">SG Gold Rates</a>
        <button
          className="nav-toggle"
          type="button"
          aria-label={expanded ? 'Close navigation' : 'Open navigation'}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`navbar-links${expanded ? ' is-expanded' : ''}`}>
          {links.map((link) => {
            const active = link.page && (link.href === currentPath || (link.href === '/' && currentPath === '/'));
            return (
              <a
                className={`nav-link${active ? ' active' : ''}`}
                href={link.href}
                key={link.label}
                onClick={() => setExpanded(false)}
              >
                {link.label}
              </a>
            );
          })}
        </div>
        <div className="nav-window-actions">
          <button className="nav-action-button" type="button" onClick={closeCurrentTab}>Close</button>
          <button className="nav-action-button nav-action-exit" type="button" onClick={exitApplication}>Exit</button>
        </div>
      </nav>
      {exitMessage && <p className="nav-exit-notice" role="status">{exitMessage}</p>}
    </>
  );
}