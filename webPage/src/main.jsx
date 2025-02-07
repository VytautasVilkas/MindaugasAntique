import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ResponsiveWrapper from './ResponsiveWrapper.jsx';
import { UserProvider } from './contexts/UserContext';
import { LoggerProvider } from "./contexts/LoggerContext";
import { GoogleOAuthProvider } from "@react-oauth/google";


createRoot(document.getElementById('root')).render(
  <StrictMode>
  <GoogleOAuthProvider clientId="444479800234-bh4tliqcqf8sc8ldtr7r12lleug8ml8k.apps.googleusercontent.com">
  <UserProvider >
  <LoggerProvider>

  <ResponsiveWrapper>
      <App />
  </ResponsiveWrapper>

  </LoggerProvider>
  </UserProvider>
  </GoogleOAuthProvider>
  </StrictMode>
)
