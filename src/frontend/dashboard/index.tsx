import React, { useState, useCallback } from 'react';
import ARQDashboard from './ARQDashboard';
import APITester from './APITester';
import TaskCreator from './TaskCreator';
import TaskMonitor from './TaskMonitor';
import History from '../components/History';
import Analytics from '../components/Analytics';
import AssistantChat from '../components/AssistantChat';

type Tab = 'dashboard' | 'api' | 'tasks' | 'monitor' | 'history' | 'analytics' | 'assistant';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ backgroundColor: '#f8f9fa', padding: '20px', borderBottom: '2px solid #e9ecef' }}>
        <h1 style={{ margin: 0, fontSize: '24px', marginBottom: '10px' }}>ARQ Development Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px' }}>
          <span>Server Status: <strong style={{ color: serverStatus === 'online' ? '#28a745' : '#dc3545' }}>{serverStatus === 'online' ? '🟢 Server Online' : '🔴 Server Offline'}</strong></span>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '5px', padding: '15px', backgroundColor: '#ffffff', borderBottom: '1px solid #dee2e6', flexWrap: 'wrap' }}>
        {([
          { id: 'dashboard', label: 'Dashboard', icon: '📈' },
          { id: 'api', label: 'API Tester', icon: '🔧' },
          { id: 'tasks', label: 'Create Tasks', icon: '✏️' },
          { id: 'monitor', label: 'Monitor', icon: '👁️' },
          { id: 'history', label: 'History', icon: '📜' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
          { id: 'assistant', label: 'AI Assistant', icon: '🤖' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: activeTab === tab.id ? '#007bff' : '#e9ecef',
              color: activeTab === tab.id ? 'white' : 'black',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8f9fa' }}>
        {activeTab === 'dashboard' && <ARQDashboard />}
        {activeTab === 'api' && <APITester />}
        {activeTab === 'tasks' && <TaskCreator onTaskCreated={handleTaskCreated} />}
        {activeTab === 'monitor' && <TaskMonitor />}
        {activeTab === 'history' && <History />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'assistant' && <AssistantChat />}
      </main>
    </div>
  );
};

export default DashboardApp;
