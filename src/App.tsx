import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { AuthCallback } from './components/Auth/AuthCallback';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { APIList } from './components/APIs/APIList';
import { IntegrationWorkspace } from './components/Integrations/IntegrationWorkspace';
import { HealthMonitor } from './components/Monitoring/HealthMonitor';
import { WebhookSetup } from './components/Webhooks/WebhookSetup';
import { SystemSettings } from './components/Settings/SystemSettings';
import Documentation from './components/Documentation/Documentation';

function AppContent() {
  const { user, externalUser, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('code') && params.get('state')) {
      setIsCallback(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isCallback) {
    return <AuthCallback />;
  }

  if (!user && !externalUser) {
    return <LoginForm />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'apis':
        return <APIList />;
      case 'integrations':
        return <IntegrationWorkspace />;
      case 'webhooks':
        return <WebhookSetup />;
      case 'monitoring':
        return <HealthMonitor />;
      case 'documentation':
        return <Documentation />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
