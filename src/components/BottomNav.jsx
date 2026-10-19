import React from 'react';

export default function BottomNav({ currentUser, activeTab, setActiveTab }) {
  const isStaff = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Sarpanch');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {/* Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'home' 
              ? 'text-primary font-bold scale-105' 
              : 'text-on-surface-variant hover:text-primary opacity-80'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'home' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-[22px]">home</span>
          </div>
          <span className="text-[11px] font-headline tracking-tight">Home</span>
        </button>

        {/* Report Tab */}
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'report' 
              ? 'text-primary font-bold scale-105' 
              : 'text-on-surface-variant hover:text-primary opacity-80'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'report' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-[22px]">report_problem</span>
          </div>
          <span className="text-[11px] font-headline tracking-tight">Report</span>
        </button>

        {/* Tasks Tab (Sarpanch & Admin) */}
        {isStaff && (
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'tasks' 
                ? 'text-primary font-bold scale-105' 
                : 'text-on-surface-variant hover:text-primary opacity-80'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'tasks' ? 'bg-primary/10' : ''}`}>
              <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
            </div>
            <span className="text-[11px] font-headline tracking-tight">Tasks</span>
          </button>
        )}

        {/* Admin Tab (Sarpanch & Admin) */}
        {isStaff && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'admin' 
                ? 'text-primary font-bold scale-105' 
                : 'text-on-surface-variant hover:text-primary opacity-80'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeTab === 'admin' ? 'bg-primary/10' : ''}`}>
              <span className="material-symbols-outlined text-[22px]">monitoring</span>
            </div>
            <span className="text-[11px] font-headline tracking-tight">Admin</span>
          </button>
        )}

        {/* Support Tab */}
        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'support' 
              ? 'text-primary font-bold scale-105' 
              : 'text-on-surface-variant hover:text-primary opacity-80'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'support' ? 'bg-primary/10' : ''}`}>
            <span className="material-symbols-outlined text-[22px]">support_agent</span>
          </div>
          <span className="text-[11px] font-headline tracking-tight">Support</span>
        </button>
      </div>
    </nav>
  );
}
