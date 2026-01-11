
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Merchant, Product, Order } from './types';
import { INITIAL_MERCHANTS, INITIAL_PRODUCTS } from './constants';
import PlatformAdminView from './components/PlatformAdminView';
import MerchantPortal from './components/MerchantPortal';
import CustomerView from './components/CustomerView';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentMerchantId, setCurrentMerchantId] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const syncChannel = useMemo(() => new BroadcastChannel('pos_sync'), []);

  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'NEW_ORDER') setOrders(prev => [...prev, payload]);
      else if (type === 'UPDATE_ORDER') setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
      else if (type === 'UPDATE_PRODUCTS') setProducts(payload);
      else if (type === 'ADD_MERCHANT') setMerchants(prev => [...prev, payload]);
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
            <h1 className="text-2xl font-black text-slate-900">NovaPOS Malaysia</h1>
            <p className="text-slate-400 text-sm mt-1">输入 12 位识别码</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="text"
              value={loginCode}
              onChange={e => setLoginCode(e.target.value.replace(/[^0-9]/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
              placeholder="0000 0000 0000"
              maxLength={14}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-center text-xl font-mono font-bold tracking-[0.2em] focus:ring-4 focus:ring-indigo-50 outline-none"
            />
            {loginError && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{loginError}</p>}
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all">
              登入系统
            </button>
          </form>
          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
             <button onClick={() => { setRole('CUSTOMER'); setCurrentMerchantId('m1'); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600">点单端 Demo</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 返回按钮移到左侧 */}
      <button 
        onClick={handleBack}
        className="fixed top-4 left-4 z-50 bg-white border border-slate-200 pl-3 pr-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-md flex items-center gap-2 transition-all active:scale-95 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        {role === 'SUPER_ADMIN' && currentMerchantId ? '返回列表' : '退出'}
      </button>

      {role === 'SUPER_ADMIN' && !currentMerchantId && (
        <PlatformAdminView 
          merchants={merchants} 
          orders={orders}
          onSelectMerchant={(id) => setCurrentMerchantId(id)}
          onAddMerchant={(m) => {
            setMerchants(prev => [...prev, m]);
            syncChannel.postMessage({ type: 'ADD_MERCHANT', payload: m });
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
            syncChannel.postMessage({ type: 'UPDATE_ORDER', payload: o });
          }}
          onUpdateProducts={(newMerchantProducts) => {
            // 保留其他商家的商品，更新当前商家的商品
            const otherProducts = products.filter(p => p.merchantId !== currentMerchantId);
            const updatedAllProducts = [...otherProducts, ...newMerchantProducts];
            setProducts(updatedAllProducts);
            syncChannel.postMessage({ type: 'UPDATE_PRODUCTS', payload: updatedAllProducts });
          }}
        />
      )}

      {role === 'CUSTOMER' && currentMerchant && (
        <CustomerView 
          merchant={currentMerchant}
          products={products.filter(p => p.merchantId === currentMerchantId && p.isAvailable)}
          onPlaceOrder={(o) => {
            setOrders(prev => [...prev, o]);
            syncChannel.postMessage({ type: 'NEW_ORDER', payload: o });
          }}
        />
      )}
    </div>
  );
};

export default App;
