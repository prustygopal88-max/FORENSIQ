import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigatePage } from './pages/InvestigatePage';
import { TimelinePage } from './pages/TimelinePage';
import { EvidencePage } from './pages/EvidencePage';
import { UsbInvestigationPage } from './pages/UsbInvestigationPage';
import { CasesPage } from './pages/CasesPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<string | null>('Gopal');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'investigate':
        return <InvestigatePage currentUser={currentUser} />;
      case 'timeline':
        return <TimelinePage />;
      case 'evidence':
        return <EvidencePage />;
      case 'usb':
        return (
          <UsbInvestigationPage 
            currentUser={currentUser} 
            onNavigateToInvestigate={() => setActiveTab('investigate')} 
          />
        );
      case 'cases':
        return (
          <CasesPage 
            currentUser={currentUser} 
            onOpenCase={() => setActiveTab('investigate')} 
          />
        );
      case 'explainability':
        return <ExplainabilityPage />;
      case 'login':
        return (
          <LoginPage 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
            onNavigateToInvestigate={() => setActiveTab('investigate')} 
          />
        );
      default:
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#07090e] text-slate-100 font-sans">
      {/* Sleek Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          activeTab={activeTab}
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
          onSwitchToAuth={() => setActiveTab('login')}
        />

        <main className="flex-1 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
