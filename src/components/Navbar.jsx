import React from 'react';
import { getTranslation } from '../utils/translations';

export default function Navbar({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  language = 'en', 
  setLanguage,
  notificationCount = 0,
  onOpenNotifications
}) {
  const t = (key) => getTranslation(language, key);

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'home': return t('home');
      case 'report': return t('report');
      case 'tasks': return t('tasks');
      case 'admin': return t('admin');
      case 'support': return t('support');
      default: return t('portal_title');
    }
  };

  const isStaff = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Sarpanch');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/40 shadow-sm pt-safe transition-all">
      <div className="max-w-7xl mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Brand / Logo & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          >
            <img 
              alt="Village Logo" 
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI2oc_Spp8I6sgWaFMdsSaFj6HCk6B0FcQPjuW5ESxOxg1qEkS2UujcZNWktzJc8s5jwVXxfZcpXC-_nT7qoyZfCico0MZXOysuOfdYGH_BObereTalqbra5mCuW0jZ4k0JiWCqJUizNUxZ0eoHab6alVwGgUk4JVZXPKdivAOY5RPtWQVl8LjrPw0-RknTkFttseIwCfgur0EmzMkWGVWB07KHOChoA5J8VhKNoq1A7a7uu-LpA0X4w" 
            />
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base sm:text-lg text-primary leading-tight tracking-tight">
                {t('portal_title')}
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium hidden sm:inline leading-none">
                {t('portal_subtitle')}
              </span>
            </div>
          </button>

          {/* Desktop Navigation with 0ms instantaneous state switches */}
          <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-outline-variant/50 pl-4 font-headline text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'home' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              {t('home')}
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'report' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">report_problem</span>
              {t('report')}
            </button>

            {isStaff && (
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'tasks' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                {t('tasks')}
              </button>
            )}

            {isStaff && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'admin' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                {t('admin')}
              </button>
            )}

            <button
              onClick={() => setActiveTab('support')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'support' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              {t('support')}
            </button>

            {/* Admin or Sarpanch can access Presentation from Admin Panel if needed */}
          </nav>
        </div>

        {/* Right Section: Language, User Profile & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Notification Bell with Badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 sm:p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary transition-all active:scale-95 flex items-center justify-center cursor-pointer border border-outline-variant/40"
            title="सूचना केंद्र (Notifications)"
          >
            <span className="material-symbols-outlined text-[19px] sm:text-[21px]">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white font-headline font-black text-[9px] sm:text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-surface animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-surface-container-low text-on-surface font-headline font-semibold text-[11px] sm:text-xs rounded-lg border border-outline-variant/60 px-1.5 sm:px-2 py-1 sm:py-1.5 focus:outline-none focus:border-primary cursor-pointer transition-colors"
          >
            <option value="en">EN</option>
            <option value="mr">MR</option>
            <option value="hi">HI</option>
          </select>

          {/* User Badge */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-outline-variant/60">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface leading-none capitalize truncate max-w-[130px]">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
              <div 
                className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-white"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                {(currentUser.name || currentUser.email)[0]}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button 
            onClick={onLogout} 
            className="p-1.5 text-error hover:bg-error/10 active:scale-95 rounded-lg transition-all flex items-center justify-center" 
            title={t('logout')}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
