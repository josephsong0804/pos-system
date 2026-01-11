
import React from 'react';
import { View, UserSession } from '../types';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  session: UserSession;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, session }) => {
  const navItems: { label: string; view: View; icon: string; restricted?: boolean }[] = [
    { label: 'POS Terminal', view: 'POS', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Live Orders', view: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Inventory', view: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', restricted: true },
    { label: 'Analytics', view: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', restricted: true },
    { label: 'Nova AI', view: 'AI', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', restricted: true },
  ];

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
            N
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tight text-slate-800">NovaPOS</h1>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Store ID: {session.storeId}</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex space-x-1">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              activeView === item.view 
                ? 'bg-indigo-50 text-indigo-700 font-black shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            } ${item.restricted && session.role === 'Staff' ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="hidden md:inline text-xs uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-black text-slate-700">{session.userName}</p>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${session.role === 'Host' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {session.role}
          </span>
        </div>
        <img 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.userName}`} 
          alt="Avatar" 
          className="w-10 h-10 rounded-xl border-2 border-slate-100 bg-slate-50 object-cover" 
        />
      </div>
    </header>
  );
};

export default Header;
