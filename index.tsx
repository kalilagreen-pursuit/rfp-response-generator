import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import InvitationAcceptPage from './components/InvitationAcceptPage';
import LeadCaptureForm from './components/LeadCaptureForm';

// Wrapper component to handle auth state
const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showInvitationPage, setShowInvitationPage] = useState(false);
  const [leadCaptureCode, setLeadCaptureCode] = useState<string | null>(null);

  // Check for invitation token or lead capture in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;

    // Check for lead capture page (base64url can contain a-zA-Z0-9_-)
    const leadCaptureMatch = path.match(/^\/lead-capture\/([a-zA-Z0-9_-]+)$/);
    if (leadCaptureMatch && leadCaptureMatch[1]) {
      setLeadCaptureCode(leadCaptureMatch[1]);
      return;
    }

    // Show invitation page if we're on /invitations/accept with a token
    if (path.includes('/invitations/accept') && token) {
      setShowInvitationPage(true);
    } else {
      setShowInvitationPage(false);
    }
  }, []);

  // Show lead capture page if on /lead-capture/:code (no auth required)
  if (leadCaptureCode) {
    return <LeadCaptureForm uniqueCode={leadCaptureCode} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show invitation accept page if token is in URL
  if (showInvitationPage) {
    return (
      <AppProvider>
        <InvitationAcceptPage 
          onNavigate={(view) => {
            // Clear URL
            window.history.replaceState({}, '', '/');
            setShowInvitationPage(false);
            // Reload to show main app - the view will be handled by App component
            // We could enhance this later to pass view state
            window.location.href = '/';
          }}
        />
      </AppProvider>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  </React.StrictMode>
);
