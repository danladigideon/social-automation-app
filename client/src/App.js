import { useEffect, useMemo, useState } from 'react';
import './App.css';
import NewPost from './NewPost';
import ScheduledPosts from './ScheduledPosts';
import supabase from './supabaseClient';

function parsePlatforms(platforms) {
  if (typeof platforms === 'string') {
    return platforms
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (Array.isArray(platforms)) return platforms.map(String);
  return [];
}

function computeDashboardStats(posts) {
  const total = posts.length;
  const scheduled = posts.filter((p) => p.status === 'scheduled').length;
  const posted = posts.filter((p) => p.status === 'posted').length;

  const counts = new Map();
  for (const p of posts) {
    for (const plat of parsePlatforms(p.platforms)) {
      counts.set(plat, (counts.get(plat) || 0) + 1);
    }
  }

  const ranked = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
  const topEntry = ranked[0];
  const topPlatform = topEntry?.[0] ?? null;
  const topPlatformCount = topEntry?.[1] ?? 0;

  return { total, scheduled, posted, topPlatform, topPlatformCount };
}

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardPosts, setDashboardPosts] = useState(null);

  const views = {
    dashboard: 'Dashboard',
    newPost: 'New Post',
    scheduled: 'Scheduled Posts',
    settings: 'Settings',
  };

  useEffect(() => {
    if (activeView !== 'dashboard') return undefined;

    let cancelled = false;

    async function loadPosts() {
      setDashboardPosts(null);
      const { data, error } = await supabase
        .from('posts')
        .select('status, platforms');

      if (cancelled) return;

      if (error) {
        setDashboardPosts([]);
        return;
      }

      setDashboardPosts(data ?? []);
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [activeView]);

  const dashboardStats = useMemo(() => {
    if (dashboardPosts === null) return null;
    return computeDashboardStats(dashboardPosts);
  }, [dashboardPosts]);

  const renderMainContent = () => {
    if (activeView === 'newPost') {
      return <NewPost />;
    }

    if (activeView === 'scheduled') {
      return <ScheduledPosts />;
    }

    if (activeView === 'dashboard') {
      return (
      <div className="dashboard-home">
        <div className="dashboard-stats" aria-label="Post statistics">
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon" aria-hidden="true">
              📊
            </div>
            <div className="dashboard-stat-value">
              {dashboardStats === null ? '…' : dashboardStats.total}
            </div>
            <div className="dashboard-stat-label">Total posts</div>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon" aria-hidden="true">
              📅
            </div>
            <div className="dashboard-stat-value">
              {dashboardStats === null ? '…' : dashboardStats.scheduled}
            </div>
            <div className="dashboard-stat-label">Scheduled</div>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon" aria-hidden="true">
              ✅
            </div>
            <div className="dashboard-stat-value">
              {dashboardStats === null ? '…' : dashboardStats.posted}
            </div>
            <div className="dashboard-stat-label">Posted</div>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon" aria-hidden="true">
              🏆
            </div>
            <div className="dashboard-stat-value">
              {dashboardStats === null
                ? '…'
                : dashboardStats.topPlatform != null
                  ? dashboardStats.topPlatformCount
                  : '—'}
            </div>
            <div className="dashboard-stat-label">
              {dashboardStats === null || !dashboardStats.topPlatform
                ? 'Top platform'
                : `Top: ${dashboardStats.topPlatform}`}
            </div>
          </article>
        </div>
        <div className="welcome-card">
          <h2 className="welcome-heading">Welcome back</h2>
          <p className="welcome-text">
            Your social media automation workspace is ready. Use the sidebar to
            create posts, manage your schedule, or adjust settings.
          </p>
        </div>
      </div>
      );
    }

    return (
      <div className="welcome-card">
        <h2 className="welcome-heading">Welcome back</h2>
        <p className="welcome-text">
          Your social media automation workspace is ready. Use the sidebar to
          create posts, manage your schedule, or adjust settings.
        </p>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <svg
            className="sidebar-logo-icon"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.15" />
            <path
              d="M9 16.5c0-1.5 1-2.5 2.5-2.5h1.5v-2c0-2.2 1.8-4 4-4s4 1.8 4 4v2H23c1.5 0 2.5 1 2.5 2.5v6c0 1.5-1 2.5-2.5 2.5H11.5C10 25 9 24 9 22.5v-6Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <path
              d="M14 12.5V11c0-1.1.9-2 2-2s2 .9 2 2v1.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          <span className="sidebar-brand-text">Social Auto</span>
        </div>
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${activeView === 'dashboard' ? 'sidebar-link--active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === 'newPost' ? 'sidebar-link--active' : ''}`}
            onClick={() => setActiveView('newPost')}
          >
            New Post
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === 'scheduled' ? 'sidebar-link--active' : ''}`}
            onClick={() => setActiveView('scheduled')}
          >
            Scheduled Posts
          </button>
          <button
            type="button"
            className={`sidebar-link ${activeView === 'settings' ? 'sidebar-link--active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            Settings
          </button>
        </nav>
      </aside>
      <main className="main">
        <header className="main-header">
          <h1 className="main-title">{views[activeView]}</h1>
          <button
            type="button"
            className="main-header-action"
            onClick={() => setActiveView('newPost')}
          >
            New Post
          </button>
        </header>
        <section className="main-content">
          {renderMainContent()}
        </section>
      </main>
    </div>
  );
}

export default App;
