
import React, { useState } from 'react';
import { UserSession, UserRole } from '../types';

interface SessionModalProps {
  onSessionStarted: (session: UserSession) => void;
}

const SessionModal: React.FC<SessionModalProps> = ({ onSessionStarted }) => {
  const [role, setRole] = useState<UserRole>('Host');
  const [userName, setUserName] = useState('');
  const [storeId, setStoreId] = useState(Math.random().toString(36).substr(2, 6).toUpperCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !storeId) return;
    onSessionStarted({ storeId, role, userName });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h2 className="text-2xl font-black">NovaPOS Network</h2>
          <p className="text-indigo-100 mt-1 opacity-80">Connect your retail terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('Host')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'Host' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Start as Host
            </button>
            <button
              type="button"
              onClick={() => setRole('Staff')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${role === 'Staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Join as Staff
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Terminal Display Name</label>
              <input
                required
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="e.g. Register 1 or Sarah C."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Store ID</label>
              <input
                required
                type="text"
                value={storeId}
                onChange={e => setStoreId(e.target.value.toUpperCase())}
                placeholder="6-character code"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center tracking-[0.2em] focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase"
                readOnly={role === 'Host'}
              />
              {role === 'Host' && <p className="text-[10px] text-slate-400 mt-2 italic text-center">Share this ID with staff members to join your store.</p>}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            {role === 'Host' ? 'Initialize Store' : 'Connect Terminal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;
