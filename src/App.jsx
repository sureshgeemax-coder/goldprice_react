import { useEffect, useState } from 'react';
import { SHOPS } from '../server/domain.js';
import AboutPage from './components/AboutPage.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import ShopPage from './components/ShopPage.jsx';

function emptyDashboard() {
  return {
    shops: SHOPS.map((shop) => ({ ...shop, rates: { 916: null, 999: null }, movements: {}, status: 'Loading', updated: null })),
    comparisons: {},
    lastRefresh: null
  };
}

export default function App() {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const pathname = decodeURIComponent(window.location.pathname.replace(/\/$/, '') || '/');
  const shopKey = pathname.match(/^\/shop\/([^/]+)$/)?.[1]?.toLowerCase();

  useEffect(() => {
    if (pathname === '/about') return undefined;
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await fetch('/api/rates', { signal: controller.signal });
        if (!response.ok) throw new Error('Saved gold rates could not be loaded.');
        setDashboard(await response.json());
      } catch (error) {
        if (error.name !== 'AbortError') setRefreshError(error.message);
      }

      if (controller.signal.aborted) return;
      setRefreshing(true);
      try {
        const response = await fetch('/api/refresh', { method: 'POST', signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Live gold rates could not be refreshed.');
        setDashboard(result.data);
        setRefreshError('');
      } catch (error) {
        if (error.name !== 'AbortError') setRefreshError(error.message);
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [pathname]);

  async function refresh() {
    setRefreshing(true);
    setRefreshError('');
    try {
      const response = await fetch('/api/refresh', { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Live gold rates could not be refreshed.');
      setDashboard(result.data);
    } catch (error) {
      setRefreshError(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (pathname === '/about') return <AboutPage />;
  if (pathname.startsWith('/shop/')) {
    const shop = dashboard.shops.find((item) => item.key === shopKey);
    return shop ? <ShopPage shop={shop} /> : <main className="dashboard-shell"><a href="/">Return to dashboard</a><p>Shop not found.</p></main>;
  }

  return <DashboardPage dashboard={dashboard} refreshing={refreshing} refresh={refresh} refreshError={refreshError} />;
}