
import React, { useState, useEffect, useRef } from 'react';
import { dataService } from './services/dataService';
import { AnyData, CurrentUser, SystemSettings, User, Assessment } from './types';
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
import { LanguageProvider, useLanguage } from './services/i18n';

function AppContent() {
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

  // Background interval reference
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const unsubscribe = dataService.subscribe((data) => {
      setAllData(data);
      const settings = data.find(d => d.type === 'settings') as SystemSettings;
      if (settings) {
        document.body.classList.remove('theme-indigo', 'theme-blue', 'theme-emerald', 'theme-rose');
        if (settings.themeColor && settings.themeColor !== 'indigo') {
           document.body.classList.add(`theme-${settings.themeColor}`);
        }
        // Sync language from cloud if available and not set locally (optional strategy)
        // For now, we prefer local setting for language
      }
    });

    // Start background check for reminders
    checkIntervalRef.current = setInterval(checkReminders, 60000); // Check every minute

    return () => {
      unsubscribe();
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  // Update loading text when language changes
  useEffect(() => {
    if (isLoading) setLoadingText(t('loading'));
  }, [t, isLoading]);

  const checkReminders = async () => {
    const data = dataService.getAll();
    const settings = data.find(d => d.type === 'settings') as SystemSettings;
    
    // Safety check
    if (!settings || !settings.notify_reminders || !settings.telegram_token || !settings.telegram_chat_id) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday...
    const scheduledTime = settings.reminder_daily?.[dayOfWeek];
    
    // If no time is set for today, do nothing
    if (!scheduledTime) return;

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    // Check if we already sent a reminder today
    if (settings.last_reminder_sent_date === today) return;

    // Check if time matches or has passed the scheduled time
    if (currentTime >= scheduledTime) {
      // Check if any assessment was done today
      const assessments = data.filter((d): d is Assessment => d.type === 'assessment');
      const hasAssessmentToday = assessments.some(a => a.date === today);

      if (!hasAssessmentToday) {
        // Send Telegram Notification
        try {
          const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
          const message = `🔔 แจ้งเตือน: วัน${days[dayOfWeek]} ขณะนี้เวลา ${currentTime} น. ถึงเวลาที่กำหนด (${scheduledTime} น.) แต่ยังไม่มีการบันทึกการประเมินความสะอาดใดๆ สำหรับวันนี้ (${new Date().toLocaleDateString('th-TH')}) กรุณาดำเนินการตรวจสอบตามที่ได้รับมอบหมายด้วยค่ะ/ครับ`;
          const url = `https://api.telegram.org/bot${settings.telegram_token}/sendMessage?chat_id=${settings.telegram_chat_id}&text=${encodeURIComponent(message)}`;
          
          await fetch(url);
          
          // Update last sent date in settings to prevent double sending
          await dataService.update({
            ...settings,
            last_reminder_sent_date: today
          });
          
          console.log('Daily Reminder sent successfully');
        } catch (error) {
          console.error('Failed to send Telegram reminder:', error);
        }
      }
    }
  };

  const showLoading = (text: string) => {
    setLoadingText(text);
    setIsLoading(true);
  };
  const hideLoading = () => setIsLoading(false);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  const handleLogin = (user: CurrentUser) => {
    showLoading(t('loading'));
    setTimeout(() => {
      setCurrentUser(user);
      setActivePage('dashboard');
      hideLoading();
      showToast(t('welcome'), 'success');
    }, 800);
  };

  const handleLogout = () => {
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
        return <Reports allData={allData} showLoading={showLoading} hideLoading={hideLoading} showToast={showToast} />;
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
      <AppContent />
    </LanguageProvider>
  );
}

// Internal Loading Component
function LoadingOverlay({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-900 dark:text-white font-bold">{text}</p>
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
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[1001] px-6 py-3 rounded-2xl shadow-2xl text-white font-bold text-sm animate-fadeIn ${colors[type]}`}>
      <div className="flex items-center gap-2">
        {type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>}
        {message}
      </div>
    </div>
  );
}
