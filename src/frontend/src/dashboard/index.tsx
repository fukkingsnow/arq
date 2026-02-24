import React, { useState } from 'react';
import TaskCreator from './TaskCreator';
import TaskMonitor from './TaskMonitor';
import AssistantChat from '../components/AssistantChat';

const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f0f2f5' }}>
      <nav style={{ width: '200px', background: '#1a1a2e', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{color: '#4ecca3'}}>ARQ Panel</h3>
        <button onClick={() => setActiveTab('tasks')} style={btnStyle(activeTab === 'tasks')}>✏️ Tasks</button>
        <button onClick={() => setActiveTab('monitor')} style={btnStyle(activeTab === 'monitor')}>👁️ Monitor</button>
        <button onClick={() => setActiveTab('assistant')} style={btnStyle(activeTab === 'assistant')}>🤖 AI Chat</button>
      </nav>
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {activeTab === 'tasks' && <TaskCreator onTaskCreated={() => setActiveTab('monitor')} />}
        {activeTab === 'monitor' && <TaskMonitor />}
        {activeTab === 'assistant' && <AssistantChat />}
      </main>
    </div>
  );
};

const btnStyle = (active: boolean) => ({
  padding: '10px',
  background: active ? '#4ecca3' : 'transparent',
  color: active ? '#1a1a2e' : 'white',
  border: '1px solid #4ecca3',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'left' as const
});

export default DashboardApp;
