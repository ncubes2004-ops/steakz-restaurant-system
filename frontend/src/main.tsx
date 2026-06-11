import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// DEV helper: set a pre-generated token into localStorage when running locally.
// Usage: create a .env file in the frontend folder with VITE_DEV_CHEF_TOKEN="<token>"
if (import.meta.env.DEV && (import.meta.env as any).VITE_DEV_CHEF_TOKEN) {
  try {
    localStorage.setItem('steakz_token', (import.meta.env as any).VITE_DEV_CHEF_TOKEN as string);
    // eslint-disable-next-line no-console
    console.log('Dev token injected into localStorage');
  } catch (e) {
    // ignore
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
