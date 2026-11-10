import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/common.css';
import './styles/shared.css';
import './styles/home.css';
import './styles/trips.css';
import './styles/budget.css';
import './styles/members.css';
import './styles/schedule.css';
import './styles/places.css';
import './styles/placebrowse.css';
import './styles/forms.css';
import './styles/journals.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
