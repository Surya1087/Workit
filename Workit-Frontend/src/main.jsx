import { StrictMode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { env } from './config/env.js';
import { store } from './store/index.js';

// Create root
const root = createRoot(document.getElementById('root'));

// Add z-index fix BEFORE rendering
const style = document.createElement('style');
style.textContent = `
  body {
    overflow-y: scroll;
  }
  [role="dialog"] {
    z-index: 9999 !important;
  }
  .cl-modal {
    z-index: 9999 !important;
  }
  .cl-modal-backdrop {
    z-index: 9998 !important;
  }
  .cl-sign-in {
    z-index: 9999 !important;
  }
  .cl-sign-up {
    z-index: 9999 !important;
  }
`;
document.head.appendChild(style);

root.render(
  <StrictMode>
    <ClerkProvider publishableKey={env.clerkPublishableKey} afterSignOutUrl="/">
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </ClerkProvider>
  </StrictMode>,
);