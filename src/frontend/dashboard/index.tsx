import React, { useState, useEffect } from 'react';
import ARQDashboard from './ARQDashboard';
import APITester from './APITester';
import TaskCreator from './TaskCreator';
import TaskMonitor from './TaskMonitor';

type Tab = 'dashboard' | 'api' | 'tasks';

const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch('https://arq-ai.ru/api/v1/arq/health');
        setServerStatus(response.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>ARQ Development Dashboard</h1>
        <div style={styles.statusBar}>
          <span
            style={{
              ...styles.status,
              color: serverStatus === 'online' ? '#10b981' : '#ef4444',
            }}
          >
            ● {serverStatus === 'online' ? 'Server Online' : 'Server Offline'}
          </span>
        </div>
      </header>

      <nav style={styles.nav}>
        {(['dashboard', 'api', 'tasks'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === tab ? '#3b82f6' : '#e5e7eb',
              color: activeTab === tab ? 'white' : '#1f2937',
            }}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'api' && '🔌 API Tester'}
            {tab === 'tasks' && '✅ Create Task'}
                    {tab === 'monitor' && <span>📊 Monitor</span>}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeTab === 'dashboard' && <ARQDashboard />}
        {activeTab === 'api' && <APITester />}
        {activeTab === 'tasks' && <TaskCreator onTaskCreated={() => setActiveTab('dashboard')} />}
                  {activeTab === 'monitor' && <TaskMonitor />}
      </main>

      <footer style={styles.footer}>
        <p>ARQ Development Platform • API v1 • Frontend Dashboard</p>
      </footer>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' as const },
  header: { backgroundColor: '#1f2937', color: 'white', padding: '20px', borderBottom: '2px solid #3b82f6' },
  title: { margin: '0 0 10px 0', fontSize: '28px' },
  statusBar: { display: 'flex', gap: '20px', fontSize: '14px' },
  status: { fontWeight: 'bold' },
  nav: { display: 'flex', gap: '10px', padding: '15px 20px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' },
  tabButton: { padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' },
  main: { flex: 1, padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%' },
  footer: { backgroundColor: '#f3f4f6', padding: '15px 20px', textAlign: 'center' as const, borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px' },
};

export default DashboardApp;
