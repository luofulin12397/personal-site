import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/shell.css';
import './styles/home.css';
import './styles/case.css';
import Case from './pages/Case';

createRoot(document.getElementById('root')!).render(
  <StrictMode><Case /></StrictMode>,
);
