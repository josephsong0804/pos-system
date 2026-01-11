
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Merchant, Product, Order } from './types';
import { INITIAL_MERCHANTS, INITIAL_PRODUCTS } from './constants';
import PlatformAdminView from './components/PlatformAdminView';
import MerchantPortal from './components/MerchantPortal';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentMerchantId, setCurrentMerchantId] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');

  // 优化：增加 BroadcastChannel 兼容性检查
  const syncChannel = useMemo(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      return new BroadcastChannel('pos_sync');
    }
    return null;
  }, []);

  useEffect(() => {
    if (!syncChannel) return;

    const handleSync = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'NEW_ORDER') setOrders(prev => [...prev, payload]);
      else if (type === 'UPDATE_ORDER') setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
      else if (type === 'UPDATE_PRODUCTS') setProducts(payload);
      else if (type === 'ADD_MERCHANT') setMerchants(prev => [...prev, payload]);
      else if (type === 'UPDATE_MERCHANT') setMerchants(prev => prev.map(m => m.id === payload.id ? payload : m));
    };
    
    syncChannel.onmessage = handleSync;
    return () => syncChannel.close();
  }, [syncChannel]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = loginCode.replace(/\s/g, '');
    
    if (cleanCode === '000000000000') {
      setRole('SUPER_ADMIN');
      setLoginError('');
      return;
    }

    const merchant = merchants.find(m => m.accessCode === cleanCode);
    if (merchant) {
      setRole('MERCHANT');
      setCurrentMerchantId(merchant.id);
      setLoginError('');
    } else {
      setLoginError('无效的 12 位识别码');
    }
  };

  const handleBack = () => {
    if (role === 'SUPER_ADMIN' && currentMerchantId) {
      setCurrentMerchantId(null);
    } else {
      setRole(null);
      setCurrentMerchantId(null);
      setLoginCode('');
    }
  };

  const currentMerchant = merchants.find(m => m.id === currentMerchantId);

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-10 animate-in zoom-in duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl shadow-indigo-200">N</div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">NovaPOS Malaysia</h1>
            <p className="text-slate-400 text-sm mt-1">云端多端商户管理系统</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Access Code / 识别码</label>
              <input 
                type="text"
                value={loginCode}
                onChange={e => setLoginCode(e.target.value.replace(/[^0-9]/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                placeholder="0000 0000 0000"
                maxLength={14}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-center text-xl font-mono font-bold tracking-[0.2em] focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
              />
            </div>
            {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{loginError}</p>}
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95">
              验证并进入
            </button>
          </form>
          <p className="mt-8 text-center text-[10px] text-slate-300 uppercase tracking-widest font-bold">Powered by Nova Network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <button 
        onClick={handleBack}
        className="fixed top-4 left-4 z-[100] bg-white/90 backdrop-blur-md border border-slate-200 pl-3 pr-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white shadow-lg flex items-center gap-2 transition-all active:scale-95 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        {role === 'SUPER_ADMIN' && currentMerchantId ? '返回商户列表' : '退出登录'}
      </button>

      {role === 'SUPER_ADMIN' && !currentMerchantId && (
        <PlatformAdminView 
          merchants={merchants} 
          orders={orders}
          onSelectMerchant={(id) => setCurrentMerchantId(id)}
          onAddMerchant={(m) => {
            setMerchants(prev => [...prev, m]);
            syncChannel?.postMessage({ type: 'ADD_MERCHANT', payload: m });
          }}
          onUpdateMerchant={(m) => {
            setMerchants(prev => prev.map(old => old.id === m.id ? m : old));
            syncChannel?.postMessage({ type: 'UPDATE_MERCHANT', payload: m });
          }}
        />
      )}

      {(role === 'MERCHANT' || (role === 'SUPER_ADMIN' && currentMerchantId)) && currentMerchant && (
        <MerchantPortal 
          merchant={currentMerchant}
          products={products.filter(p => p.merchantId === currentMerchantId)}
          orders={orders.filter(o => o.merchantId === currentMerchantId)}
          onUpdateOrder={(o) => {
            setOrders(prev => prev.map(old => old.id === o.id ? o : old));
            syncChannel?.postMessage({ type: 'UPDATE_ORDER', payload: o });
          }}
          onUpdateProducts={(newP) => {
            const others = products.filter(p => p.merchantId !== currentMerchantId);
            const total = [...others, ...newP];
            setProducts(total);
            syncChannel?.postMessage({ type: 'UPDATE_PRODUCTS', payload: total });
          }}
          onNewOrder={(o) => {
             setOrders(prev => [...prev, o]);
             syncChannel?.postMessage({ type: 'NEW_ORDER', payload: o });
          }}
        />
      )}
    </div>
  );
};

export default App;
