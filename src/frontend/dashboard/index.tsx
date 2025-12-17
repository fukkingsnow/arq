import React, { useState, useCallback } from 'react';
import ARQDashboard from './ARQDashboard';
import APITester from './APITester';
import TaskCreator from './TaskCreator';
import TaskMonitor from './TaskMonitor';

type Tab = 'dashboard' | 'api' | 'tasks' | 'monitor';

const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');

  const checkServerHealth = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('https://arq-ai.ru/api/v1/arq/health');
      setServerStatus(response.ok ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
    }
  }, []);

  React.useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  }, [checkServerHealth]);

  const handleTaskCreated = useCallback((task: any): void => {
    console.log('Task created:', task);
    setActiveTab('monitor');
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>ARQ Development Dashboard</h1>
        <div style={styles.statusBar}>
          <span style={{...styles.status, color: serverStatus === 'online' ? '#10b981' : '#ef4444'}}>
            {serverStatus === 'online' ? '🟢 Server Online' : '🔴 Server Offline'}
          </span>
        </div>
      </header>

      <nav style={styles.nav}>
        {(['dashboard', 'api', 'tasks', 'monitor'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{...styles.navButton, backgroundColor: activeTab === tab ? '#3b82f6' : '#e5e7eb', color: activeTab === tab ? 'white' : '#111827'}}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeTab === 'dashboard' && <ARQDashboard />}
        {activeTab === 'api' && <APITester />}
        {activeTab === 'tasks' && <TaskCreator onTaskCreated={handleTaskCreated} />}
        {activeTab === 'monitor' && <TaskMonitor />}
      </main>

      <footer style={styles.footer}>
        <p>© 2025 ARQ AI Assistant Backend</p>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' },
  header: { backgroundColor: '#1f2937', color: 'white', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' },
  statusBar: { display: 'flex', gap: '10px', alignItems: 'center' },
  status: { fontSize: '14px', fontWeight: '600' },
  nav: { backgroundColor: 'white', padding: '15px 20px', display: 'flex', gap: '10px', borderBottom: '1px solid #e5e7eb' },
  navButton: { padding: '10px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  main: { flex: 1, padding: '20px', overflowY: 'auto' },
  footer: { backgroundColor: '#111827', color: '#9ca3af', padding: '15px 20px', textAlign: 'center', fontSize: '12px' },
};

export default DashboardApp;
