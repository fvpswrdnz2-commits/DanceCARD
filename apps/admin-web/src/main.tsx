import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { adminEnvironment } from './config/runtime-environment.ts';

document.documentElement.dataset.environment = adminEnvironment.name;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
