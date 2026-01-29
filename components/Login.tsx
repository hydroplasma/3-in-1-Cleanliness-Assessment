
import React, { useState } from 'react';
import { CurrentUser, SystemSettings, User, AnyData } from '../types';
import { useLanguage } from '../services/i18n';

interface LoginProps {
  onLogin: (user: CurrentUser) => void;
  settings?: SystemSettings;
  allData: AnyData[];
}

export default function Login({ onLogin, settings, allData }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { t, setLanguage, language } = useLanguage();

  const users = allData.filter((d): d is User => d.type === 'user');

  const handleDemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    
    setEmail(val);
    setPassword('demo123'); 
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const foundUser = users.find(u => u.user_email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      setError(t('account_not_found'));
      return;
    }

    const validPassword = foundUser.password || 'demo123'; 

    if (password !== validPassword) {
      setError(t('invalid_password'));
      return;
    }

    if (foundUser.user_status !== 'active') {
      setError(t('account_suspended'));
      return;
    }

    onLogin({
      email: foundUser.user_email,
      role: foundUser.user_role,
      userName: foundUser.user_name,
      initials: foundUser.user_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      assigned_locations: foundUser.assigned_locations,
      user_class: foundUser.user_class
    });
  };

  const schoolName = settings?.school_name || 'โรงเรียนน้ำคำวิทยา';
  const logoUrl = settings?.logo_url || 'https://i.postimg.cc/RZ0PCqVy/NKW-LOGO.png';
  const showQuickLogin = settings?.showQuickLogin !== false; // Default to true if undefined

  const features = [
    {
      title: t('feat_3in1'),
      desc: t('feat_3in1_desc'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
      color: "blue"
    },
    {
      title: t('feat_security'),
      desc: t('feat_security_desc'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />,
      color: "emerald"
    },
    {
      title: t('feat_attendance'),
      desc: t('feat_attendance_desc'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      color: "indigo"
    },
    {
      title: t('feat_report'),
      desc: t('feat_report_desc'),
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      color: "purple"
    }
  ];

  return (
    <div id="login-page" className="min-h-full py-12 px-4 flex flex-col items-center justify-start overflow-auto" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #FAF5FF 100%)' }}>
      
      <div className="w-full max-w-md mb-12 relative">
        <div className="absolute top-0 right-0 -mt-10 flex gap-2">
            <button onClick={() => setLanguage('th')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'th' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>TH</button>
            <button onClick={() => setLanguage('is')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'is' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>IS</button>
            <button onClick={() => setLanguage('en')} className={`text-xs font-bold px-2 py-1 rounded ${language === 'en' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>EN</button>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 fade-in border border-indigo-100 dark:bg-slate-900 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-header flex items-center justify-center shadow-xl overflow-hidden">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{t('login_title')}</h1>
            <p className="text-slate-500 font-semibold text-sm">{schoolName}</p>
          </div>

          {showQuickLogin && (
            <>
              <div className="mb-6 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('quick_login')}</label>
                <select 
                  className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" 
                  onChange={handleDemoSelect}
                >
                  <option value="">{t('select_user_role')}</option>
                  <option value="admin01@school.demo">👑 Admin (admin01)</option>
                  <option value="teacher01@school.demo">👨‍🏫 Teacher (teacher01)</option>
                  <option value="sapa601@school.demo">🎖️ Student Council (M.6)</option>
                  <option value="nkw01477@school.demo">🎓 Student (M.1)</option>
                </select>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100 dark:border-slate-800"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 dark:bg-slate-900">{t('or_use_account')}</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('email')}</label>
              <div className="relative">
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  placeholder=""
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 11-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('password')}</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white" 
                  placeholder=""
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.146 5.147m13.71 13.71L14.117 14.117M19.071 4.929l-4.242 4.242" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex flex-col gap-1 animate-pulse border border-red-100">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              </div>
            )}

            <button type="submit" className="w-full btn-primary text-white py-3.5 rounded-xl font-bold shadow-lg text-base transition-all"> 
              {t('login_btn')}
            </button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-5xl fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl card-hover dark:bg-slate-900/50 dark:border-slate-800">
              <div className={`w-14 h-14 rounded-2xl bg-${f.color}-500 flex items-center justify-center text-white shadow-lg mb-5`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">{f.icon}</svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center text-slate-400 font-medium text-xs">
          <p>© 2026 {t('app_name')} (3-in-1 Cleanliness Assessment System)</p>
        </div>
      </div>
    </div>
  );
}
