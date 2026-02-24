import React, { useState, useEffect } from 'react';

const ARQDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('Checking...');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const API_BASE = '/api/v1';

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/arq/health`);
      if (res.ok) setStatus('System Online');
      else setStatus('API Error');
    } catch (e) { setStatus('Offline'); }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/arq/tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) { console.error('Tasks fetch failed'); }
  };

  const createTask = async () => {
    if (!title) return alert('Введите название задачи');
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, status: 'pending' })
      });
      if (res.ok) {
        setTitle(''); setDesc('');
        fetchTasks();
        alert('Задача добавлена в очередь метаплатформы');
      }
    } catch (e) { alert('Ошибка при создании'); }
  };

  useEffect(() => { 
    checkHealth(); 
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); // Автообновление каждые 5 сек
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>ARQ <span style={{ color: '#38bdf8' }}>META</span></h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Единое окно управления ИИ-агентами</p>
        </div>
        <div style={{ backgroundColor: status === 'System Online' ? '#064e3b' : '#7f1d1d', color: status === 'System Online' ? '#34d399' : '#fca5a5', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid currentColor' }}>
          ● {status}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        <section style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#38bdf8' }}>Конструктор задачи</h2>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Название (например: Анализ рынка)" style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }} />
          <textarea value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Инструкции для Gemma2:2b..." style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', minHeight: '120px', resize: 'none' }} />
          <button onClick={createTask} style={{ width: '100%', padding: '14px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}>
            ЗАПУСТИТЬ АГЕНТА
          </button>
        </section>

        <section style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Активные процессы</h2>
          {tasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #334155', borderRadius: '12px', color: '#64748b' }}>
              Очередь пуста. Система готова к масштабированию.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map((t: any) => (
                <div key={t.id} style={{ padding: '15px', backgroundColor: '#0f172a', borderRadius: '10px', borderLeft: '4px solid #38bdf8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.title}</span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ARQDashboard;
