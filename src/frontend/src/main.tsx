import React from 'react';
import ReactDOM from 'react-dom/client';
import ARQDashboard from './dashboard/ARQDashboard';
import './index.css'; // если есть

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ARQDashboard />
  </React.StrictMode>
);
