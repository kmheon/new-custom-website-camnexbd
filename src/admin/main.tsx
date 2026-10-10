import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminDashboard } from '../pages/AdminDashboard';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AdminDashboard onNavigate={(route, param) => {
        if (route === 'home') window.location.href = '/';
        else if (param) window.location.href = `/${route}/${param}`;
        else window.location.href = `/${route}`;
      }} />
    </React.StrictMode>
  );
}

