
import React, { useState, useEffect, useRef } from 'react';
import { dataService } from './services/dataService';
import { AnyData, CurrentUser, SystemSettings, User, Assessment, Room } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AssessmentForm from './components/AssessmentForm';
import Reports from './components/Reports';
import Goals from './components/Goals';
import Users from './components/Users';
import Settings from './components/Settings';
import Criteria from './components/Criteria';
import Rooms from './components/Rooms';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationPanel from './components/NotificationPanel';
import Certificates from './components/Certificates';
import InAppBrowserWarning from './components/InAppBrowserWarning';
import { LanguageProvider, useLanguage } from './services/i18n';

function AppContent() {
  // Initialize currentUser as null to require real login
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  const [activePage, setActivePage] = useState('dashboard');
  const [allData, setAllData] = useState<AnyData[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { t, setLanguage } = useLanguage();

  // States for Loading and Toast
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(t('loading'));
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    // 1. Restore Session from LocalStorage OR SessionStorage
    const localUser = localStorage.getItem('currentUser');
    const sessionUser = sessionStorage.getItem('currentUser');
    const savedUser = localUser || sessionUser;

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Failed to restore session", e);
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
      }
    }

    // 2. Restore Dark Mode
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Subscribe to Data Service
    const unsubscribe = dataService.subscribe((data) => {
      setAllData(data);
      const settings = data.find(d => d.type === 'settings') as SystemSettings;
      if (settings) {
        document.body.classList.remove('theme-indigo', 'theme-blue', 'theme-emerald', 'theme-rose');
        if (settings.themeColor && settings.themeColor !== 'indigo') {
           document.body.classList.add(`theme-${settings.themeColor}`);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update loading text when language changes
  useEffect(() => {
    if (isLoading && loadingText === 'Loading...') setLoadingText(t('loading'));
  }, [t, isLoading, loadingText]);

  const showLoading = (text: string) => {
    setLoadingText(text);
    setIsLoading(true);
  };
  const hideLoading = () => setIsLoading(false);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = (user: CurrentUser, remember: boolean) => {
    showLoading(t('loading'));
    setTimeout(() => {
      setCurrentUser(user);
      if (remember) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.removeItem('currentUser');
      } else {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.removeItem('currentUser');
      }
      setActivePage('dashboard');
      hideLoading();
      showToast(t('welcome'), 'success');
    }, 800);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    setCurrentUser(null);
    showToast(t('logout_success'));
  };

  const renderPage = () => {
    const commonProps = { 
      currentUser: currentUser!, 
      allData,
      showLoading,
      hideLoading,
      showToast
    };

    switch (activePage) {
      case 'dashboard':
        return <Dashboard allData={allData} setActivePage={setActivePage} />;
      case 'assessment-area':
        return <AssessmentForm type="area" {...commonProps} />;
      case 'assessment-classroom':
        return <AssessmentForm type="classroom" {...commonProps} />;
      case 'assessment-restroom':
        return <AssessmentForm type="restroom" {...commonProps} />;
      case 'report':
        return <Reports allData={allData} showLoading={showLoading} hideLoading={hideLoading} showToast={showToast} currentUser={currentUser} />;
      case 'goals':
        return <Goals allData={allData} />;
      case 'users':
        return <Users allData={allData} />;
      case 'settings':
        return <Settings />;
      case 'criteria':
        return <Criteria allData={allData} />;
      case 'rooms':
        return <Rooms allData={allData} />;
      case 'certificates':
        return <Certificates allData={allData} settings={allData.find(d => d.type === 'settings') as SystemSettings} />;
      default:
        return <Dashboard allData={allData} setActivePage={setActivePage} />;
    }
  };

  if (!currentUser) {
    const settings = allData.find(d => d.type === 'settings') as SystemSettings | undefined;
    return (
      <>
        {isLoading && <LoadingOverlay text={loadingText} />}
        {toast && <Toast message={toast.message} type={toast.type} />}
        <Login onLogin={handleLogin} settings={settings} allData={allData} />
      </>
    );
  }

  return (
    <>
      {isLoading && <LoadingOverlay text={loadingText} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        toggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
        allData={allData}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <div className="flex h-full pt-16">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          isOpen={mobileMenuOpen}
          closeMobileMenu={() => setMobileMenuOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
        />
        <main className="flex-1 lg:ml-64 p-4 lg:p-6 overflow-auto bg-slate-50 dark:bg-slate-950 h-[calc(100vh-64px)] transition-colors duration-200 flex flex-col">
          <div className="flex-1">
            {renderPage()}
          </div>
          <footer className="mt-8 pt-6 pb-4 text-center border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('app_name')} (3-in-1 Cleanliness Assessment)</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              {t('developer')} Copyright © 2026
            </p>
          </footer>
        </main>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} allData={allData} />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <InAppBrowserWarning />
      <AppContent />
    </LanguageProvider>
  );
}

// Internal Loading Component
function LoadingOverlay({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-900 dark:text-white font-bold text-lg leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// Internal Toast Component
function Toast({ message, type }: { message: string, type: 'success' | 'error' | 'info' }) {
  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-indigo-600'
  };
  
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none">
        <div className={`pointer-events-auto px-8 py-6 rounded-3xl shadow-2xl text-white font-bold text-lg animate-fadeIn flex flex-col items-center gap-3 min-w-[300px] text-center backdrop-blur-md transform transition-all hover:scale-105 ${colors[type]}`}>
            {type === 'success' && (
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-1">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
            )}
            {type === 'error' && (
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-1">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                </div>
            )}
            {type === 'info' && (
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-1">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
            )}
            <span>{message}</span>
        </div>
    </div>
  );
}
