
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  
  const sessionId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const [activeSessions, setActiveSessions] = useState<Set<string>>(new Set([sessionId]));

  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const syncChannelRef = useRef<BroadcastChannel | null>(null);

  // 全局广播工具
  const broadcast = (type: string, payload: any) => {
    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage({ type, payload, senderId: sessionId });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('novapos_sync_final');
      syncChannelRef.current = channel;

      const handleSync = (event: MessageEvent) => {
        const { type, payload, senderId } = event.data;
        if (senderId === sessionId) return;
        
        switch (type) {
          case 'SYNC_REQUEST':
            // 现有设备收到请求，回传当前全量数据
            channel.postMessage({ 
              type: 'SYNC_FULL_STATE', 
              payload: { merchants, products, orders }, 
              senderId: sessionId 
            });
            break;
          case 'SYNC_FULL_STATE':
            // 新进入设备接收全量数据
            setMerchants(payload.merchants);
            setProducts(payload.products);
            setOrders(payload.orders);
            break;
          case 'NEW_ORDER':
            setOrders(prev => [...prev, payload]);
            break;
          case 'UPDATE_ORDER':
            setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
            break;
          case 'UPDATE_PRODUCTS':
            setProducts(payload);
            break;
          case 'UPDATE_MERCHANT':
            setMerchants(prev => prev.map(m => m.id === payload.id ? payload : m));
            break;
          case 'PRESENCE_PING':
            setActiveSessions(prev => new Set(prev).add(senderId));
            channel.postMessage({ type: 'PRESENCE_PONG', senderId: sessionId });
            break;
          case 'PRESENCE_PONG':
            setActiveSessions(prev => new Set(prev).add(senderId));
            break;
          case 'PRESENCE_EXIT':
            setActiveSessions(prev => {
              const next = new Set(prev);
              next.delete(senderId);
              return next;
            });
            break;
        }
      };
      
      channel.onmessage = handleSync;
      
      // 进入系统：先请求同步现有数据
      channel.postMessage({ type: 'SYNC_REQUEST', senderId: sessionId });
      channel.postMessage({ type: 'PRESENCE_PING', senderId: sessionId });

      return () => {
        channel.postMessage({ type: 'PRESENCE_EXIT', senderId: sessionId });
        channel.close();
      };
    }
  }, [sessionId, merchants, products, orders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = loginCode.replace(/\s/g, '');
    
    if (cleanCode === '000000000000') {
      setRole('SUPER_ADMIN');
      setLoginError('');
      broadcast('SYNC_REQUEST', null);
      return;
    }
    
    const merchant = merchants.find(m => m.accessCode === cleanCode);
    if (merchant) {
      setRole('MERCHANT');
      setCurrentMerchantId(merchant.id);
      setLoginError('');
      // 登录即触发同步请求
      broadcast('SYNC_REQUEST', null);
    } else {
      setLoginError('识别码无效');
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

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {!role ? (
        <div className="h-full bg-slate-900 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-black mb-6">N</div>
            <h1 className="text-2xl font-black text-slate-900">NovaPOS 系统登录</h1>
            <p className="text-slate-400 text-sm mt-2 mb-8">输入 12 位商户识别码以激活设备同步</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <input 
                type="text"
                value={loginCode}
                onChange={e => setLoginCode(e.target.value.replace(/[^0-9]/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                placeholder="0000 0000 0000"
                maxLength={14}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-center text-xl font-mono font-black tracking-widest focus:ring-4 focus:ring-indigo-50 outline-none"
              />
              {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
              <button type="submit" className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                进入并同步数据
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex flex-col">
          {role === 'SUPER_ADMIN' && !currentMerchantId && (
            <PlatformAdminView 
              merchants={merchants} 
              orders={orders}
              onSelectMerchant={(id) => setCurrentMerchantId(id)}
              onAddMerchant={(m) => { setMerchants(prev => [...prev, m]); broadcast('ADD_MERCHANT', m); }}
              onUpdateMerchant={(m) => { setMerchants(prev => prev.map(old => old.id === m.id ? m : old)); broadcast('UPDATE_MERCHANT', m); }}
              onLogout={handleBack}
            />
          )}

          {currentMerchant && (
            <MerchantPortal 
              merchant={currentMerchant}
              products={products.filter(p => p.merchantId === currentMerchantId)}
              orders={orders.filter(o => o.merchantId === currentMerchantId)}
              activeDevicesCount={activeSessions.size}
              onBack={handleBack}
              backLabel={role === 'SUPER_ADMIN' ? '返回商家列表' : '退出系统'}
              onUpdateOrder={(o) => { setOrders(prev => prev.map(old => old.id === o.id ? o : old)); broadcast('UPDATE_ORDER', o); }}
              onUpdateProducts={(newP) => {
                const others = products.filter(p => p.merchantId !== currentMerchantId);
                const updated = [...others, ...newP];
                setProducts(updated);
                broadcast('UPDATE_PRODUCTS', updated);
              }}
              onNewOrder={(o) => { setOrders(prev => [...prev, o]); broadcast('NEW_ORDER', o); }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
