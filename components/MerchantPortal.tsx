
import React, { useState, useEffect, useRef } from 'react';
import { Merchant, Product, Order, OrderItem } from '../types';
import { SST_RATE } from '../constants';

interface Props {
  merchant: Merchant;
  products: Product[];
  orders: Order[];
  onUpdateOrder: (order: Order) => void;
  onUpdateProducts: (products: Product[]) => void;
  onNewOrder: (order: Order) => void;
}

const PRESET_IMAGES = [
  { name: 'Nasi Lemak', url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=400&h=300&auto=format&fit=crop' },
  { name: 'Kopi', url: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=400&h=300&auto=format&fit=crop' },
  { name: 'Bubble Tea', url: 'https://images.unsplash.com/photo-1596152062570-36940be64303?q=80&w=400&h=300&auto=format&fit=crop' },
  { name: 'Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=400&h=300&auto=format&fit=crop' },
  { name: 'Satay', url: 'https://images.unsplash.com/photo-1610450949065-9f2806282054?q=80&w=400&h=300&auto=format&fit=crop' },
  { name: 'Dim Sum', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=400&h=300&auto=format&fit=crop' },
];

const MerchantPortal: React.FC<Props> = ({ merchant, products, orders, onUpdateOrder, onUpdateProducts, onNewOrder }) => {
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'ORDERS' | 'POS' | 'MENU'>('POS');
  const [staffCart, setStaffCart] = useState<OrderItem[]>([]);
  const [staffTable, setStaffTable] = useState('01');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [isAnalyticsUnlocked, setIsAnalyticsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // 动态密码逻辑：从 localStorage 读取，如果没有则第一次输入时设定
  const [storedPin, setStoredPin] = useState<string | null>(() => {
    return localStorage.getItem(`merchant_pin_${merchant.id}`);
  });

  const [now, setNow] = useState(Date.now());
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersCount = useRef(orders.length);

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.load();
    audioRef.current = audio;
  }, []);

  useEffect(() => {
    if (orders.length > prevOrdersCount.current && isAudioUnlocked) {
      audioRef.current?.play().catch(e => console.warn('Audio play failed', e));
    }
    prevOrdersCount.current = orders.length;
  }, [orders.length, isAudioUnlocked]);

  const unlockAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
        setIsAudioUnlocked(true);
      }).catch(e => console.error('Audio unlock failed', e));
    }
  };

  const merchantOrders = orders.filter(o => o.merchantId === merchant.id);
  const pendingOrders = merchantOrders.filter(o => o.status !== 'PAID' && o.status !== 'CANCELLED');
  const completedOrders = merchantOrders.filter(o => o.status === 'PAID');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);

  const formatDuration = (timestamp: number) => {
    const diff = Math.floor((now - timestamp) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(prev => prev ? { ...prev, image: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const addToStaffCart = (p: Product) => {
    setStaffCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...p, quantity: 1, isServed: false }];
    });
  };

  const handleStaffPlaceOrder = () => {
    if (staffCart.length === 0) return;
    const subtotal = staffCart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const sst = merchant.sstEnabled ? subtotal * SST_RATE : 0;
    const service = subtotal * (merchant.serviceCharge / 100);
    const total = subtotal + sst + service;

    const newOrder: Order = {
      id: 'S-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      merchantId: merchant.id,
      items: staffCart.map(item => ({ ...item, isServed: false })),
      subtotal,
      sst,
      serviceChargeAmount: service,
      total,
      status: 'PENDING',
      timestamp: Date.now(),
      tableNumber: staffTable,
      staffName: 'Waiter'
    };
    onNewOrder(newOrder);
    setStaffCart([]);
    setStaffTable((parseInt(staffTable) + 1).toString().padStart(2, '0'));
    setActiveTab('ORDERS');
  };

  const toggleItemServed = (order: Order, itemIndex: number) => {
    const newItems = [...order.items];
    newItems[itemIndex] = { ...newItems[itemIndex], isServed: !newItems[itemIndex].isServed };
    onUpdateOrder({ ...order, items: newItems });
  };

  const handleFinalSettlement = (method: 'CASH' | 'Card') => {
    if (!settlingOrder) return;
    onUpdateOrder({ ...settlingOrder, status: 'PAID', paymentMethod: method });
    setSettlingOrder(null);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.length !== 4) return;

    if (!storedPin) {
      // 第一次进入，设置密码
      localStorage.setItem(`merchant_pin_${merchant.id}`, enteredPin);
      setStoredPin(enteredPin);
      setIsAnalyticsUnlocked(true);
      setPinError(false);
      setEnteredPin('');
    } else {
      // 验证密码
      if (enteredPin === storedPin) {
        setIsAnalyticsUnlocked(true);
        setPinError(false);
        setEnteredPin('');
      } else {
        setPinError(true);
        setEnteredPin('');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-4 ml-24 md:ml-32">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100">
            {merchant.logo}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{merchant.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Cloud Sync Ready
              </p>
              {!isAudioUnlocked && (
                <button 
                  onClick={unlockAudio}
                  className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" /></svg>
                  激活订单铃声
                </button>
              )}
              {isAudioUnlocked && (
                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">🔔 已就绪</span>
              )}
            </div>
          </div>
        </div>
        <nav className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'POS', label: '柜台点单' },
            { id: 'ORDERS', label: `桌位/订单 (${pendingOrders.length})` },
            { id: 'PERFORMANCE', label: '营收统计' },
            { id: 'MENU', label: '菜单设置' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== 'PERFORMANCE') {
                  setIsAnalyticsUnlocked(false);
                  setEnteredPin('');
                  setPinError(false);
                }
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-4 md:p-8">
        {activeTab === 'POS' && (
          <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-in slide-in-from-right duration-300">
            <div className="flex-1 bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-black text-slate-800">服务员下单</h2>
                 <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">设置桌号:</span>
                    <input 
                      type="text" 
                      value={staffTable} 
                      onChange={e => setStaffTable(e.target.value)}
                      className="w-20 text-center border-b-2 border-indigo-500 font-black text-indigo-600 focus:outline-none text-xl"
                    />
                 </div>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 no-scrollbar">
                 {products.map(p => (
                   <button 
                     key={p.id}
                     onClick={() => addToStaffCart(p)}
                     className="bg-slate-50 p-3 rounded-[24px] border border-transparent hover:border-indigo-200 transition-all text-left flex flex-col group"
                   >
                     <img src={p.image} className="w-full aspect-square object-cover rounded-[18px] mb-3 shadow-sm group-hover:scale-105 transition-transform" />
                     <p className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</p>
                     <p className="text-indigo-600 font-black mt-1">RM {p.price.toFixed(2)}</p>
                   </button>
                 ))}
               </div>
            </div>

            <div className="w-full lg:w-96 bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col shadow-lg">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 pb-4 border-b">点餐篮 (桌号: {staffTable})</h3>
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 no-scrollbar">
                {staffCart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400">RM {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                       <button onClick={() => setStaffCart(prev => prev.map(p => p.id === item.id ? {...p, quantity: Math.max(0, p.quantity-1)} : p).filter(p => p.quantity > 0))} className="w-6 h-6 flex items-center justify-center font-black">-</button>
                       <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                       <button onClick={() => addToStaffCart(item)} className="w-6 h-6 flex items-center justify-center font-black">+</button>
                    </div>
                  </div>
                ))}
                {staffCart.length === 0 && <p className="text-center py-20 text-slate-300 font-bold text-xs">空空如也</p>}
              </div>
              <button 
                onClick={handleStaffPlaceOrder} 
                disabled={staffCart.length === 0}
                className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-20"
              >
                送入厨房 / Send to Kitchen
              </button>
            </div>
          </div>
        )}

        {activeTab === 'ORDERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in zoom-in duration-300">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-[32px] border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-indigo-100 transition-all">
                <div className="p-5 bg-indigo-600 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-black">{order.tableNumber}</div>
                       <div>
                         <span className="font-black text-sm uppercase tracking-widest block leading-none">Table {order.tableNumber}</span>
                         <span className="text-[10px] font-bold opacity-60">下单已：{formatDuration(order.timestamp)}</span>
                       </div>
                    </div>
                    <span className="text-[10px] font-bold opacity-60">#{order.id.slice(0, 6)}</span>
                </div>
                <div className="p-5 flex-1 space-y-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">点击菜品划掉(上菜)</p>
                  {order.items.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => toggleItemServed(order, i)}
                      className={`w-full flex justify-between items-center text-sm font-bold p-2 rounded-xl transition-all ${
                        item.isServed ? 'opacity-30 bg-slate-50' : 'text-slate-700 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className={item.isServed ? 'line-through' : ''}>
                        <span className="text-indigo-600 mr-2">{item.quantity}x</span>
                        {item.name}
                      </span>
                      {item.isServed && <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </button>
                  ))}
                  <div className="pt-4 border-t border-slate-50 mt-2 flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-400 uppercase">当前挂账金额</p>
                    <p className="text-lg font-black text-indigo-600 font-mono">RM {order.total.toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 gap-2 bg-slate-50">
                   <button 
                    onClick={() => setSettlingOrder(order)}
                    className="py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg"
                   >
                     立即结账 / CHECKOUT
                   </button>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                <p className="text-slate-300 font-black text-sm">当前没有正在用餐的桌位</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'PERFORMANCE' && (
           <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
             {!isAnalyticsUnlocked ? (
               <div className="max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 mb-2">{storedPin ? '营收统计锁定' : '设置管理密码'}</h2>
                 <p className="text-slate-400 text-sm mb-8 font-medium">
                   {storedPin ? '请输入 4 位管理密码以查看敏感财务数据' : '请设置 4 位管理密码（第一次输入即为密码）'}
                 </p>
                 <form onSubmit={handlePinSubmit} className="space-y-6">
                   <input 
                    type="password" 
                    maxLength={4} 
                    autoFocus
                    value={enteredPin}
                    onChange={e => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full bg-slate-50 border-2 ${pinError ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-center text-3xl font-bold tracking-[1em] focus:outline-none transition-all`}
                    placeholder="****"
                   />
                   {pinError && <p className="text-red-500 text-[10px] font-black uppercase">密码错误，请重试</p>}
                   <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all">
                      {storedPin ? '验证密码' : '设置并进入'}
                   </button>
                 </form>
               </div>
             ) : (
               <div className="animate-in zoom-in duration-300">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800">今日经营报告</h2>
                    <button onClick={() => setIsAnalyticsUnlocked(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">退出数据视野</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">今日实收额 (已结账)</p>
                       <p className="text-4xl font-black text-indigo-600">RM {totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">已结单数</p>
                       <p className="text-4xl font-black text-slate-800">{completedOrders.length}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">未结桌位</p>
                       <p className="text-4xl font-black text-amber-500">{pendingOrders.length}</p>
                    </div>
                 </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'MENU' && (
           <div className="max-w-5xl mx-auto bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-800">菜单商品库</h2>
                <button onClick={() => { setEditingProduct({ name: '', price: 0, category: 'Main', image: '' }); setShowProductModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black">+ 添加商品</button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr><th className="px-8 py-5">图片</th><th className="px-8 py-5">名称</th><th className="px-8 py-5">单价</th><th className="px-8 py-5 text-right">操作</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4"><img src={p.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" /></td>
                        <td className="px-8 py-4 font-bold">{p.name}</td>
                        <td className="px-8 py-4 font-mono font-bold text-indigo-600">RM {p.price.toFixed(2)}</td>
                        <td className="px-8 py-4 text-right">
                           <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-bold">编辑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
        )}
      </main>

      {settlingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-200">
              <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto text-3xl font-black mb-4">{settlingOrder.tableNumber}</div>
                 <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Table {settlingOrder.tableNumber} 结算</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">请核对账单并选择支付方式</p>
              </div>

              <div className="space-y-3 bg-slate-50 p-6 rounded-[28px] border mb-8 font-bold text-sm text-slate-600">
                 {settlingOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                       <span className={item.isServed ? 'line-through opacity-50' : ''}>{item.quantity}x {item.name}</span>
                       <span className="font-mono">RM {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                 ))}
                 <div className="pt-3 border-t border-slate-200 flex justify-between text-2xl font-black text-slate-900">
                    <span>TOTAL</span>
                    <span className="text-indigo-600">RM {settlingOrder.total.toFixed(2)}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handleFinalSettlement('CASH')} className="py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">现金结算</button>
                 <button onClick={() => handleFinalSettlement('Card')} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition">刷卡 / 扫码</button>
              </div>
              <button onClick={() => setSettlingOrder(null)} className="w-full mt-4 py-2 text-slate-400 font-bold text-xs uppercase">取消</button>
           </div>
        </div>
      )}

      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-200">
            {/* Left: Image Management */}
            <div className="w-full md:w-1/2 bg-slate-50 p-8 flex flex-col items-center">
               <div className="w-full aspect-square rounded-[32px] bg-white border border-slate-200 overflow-hidden shadow-inner mb-6 flex items-center justify-center relative">
                  {editingProduct.image ? (
                    <img src={editingProduct.image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-300 font-bold">无预览图片</div>
                  )}
               </div>

               <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      从相册导入商品照片
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  </div>

                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">快速选择预设素材</p>
                     <div className="grid grid-cols-3 gap-2">
                        {PRESET_IMAGES.map(img => (
                          <button 
                            key={img.url}
                            onClick={() => setEditingProduct({...editingProduct, image: img.url})}
                            className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${editingProduct.image === img.url ? 'border-indigo-600 scale-95 shadow-lg' : 'border-transparent grayscale hover:grayscale-0'}`}
                          >
                             <img src={img.url} className="w-full h-full object-cover" title={img.name} />
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: Details Form */}
            <div className="w-full md:w-1/2 p-10 bg-white space-y-6 flex flex-col justify-center">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">{editingProduct.id ? '编辑商品' : '录入新品'}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">填写商品详细信息</p>
              </div>
              
              <div className="space-y-5">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">商品名称</label>
                    <input 
                      type="text" 
                      value={editingProduct.name} 
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                      placeholder="例如：Nasi Lemak Special"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold" 
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">售价 (RM)</label>
                    <input 
                      type="number" 
                      value={editingProduct.price} 
                      onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-mono font-bold" 
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">自定义图片链接 (URL)</label>
                    <input 
                      type="text" 
                      value={editingProduct.image} 
                      onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-xs text-slate-500 font-mono" 
                      placeholder="https://..."
                    />
                 </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button onClick={() => setShowProductModal(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition">取消</button>
                <button 
                  onClick={() => {
                    if (!editingProduct.name || editingProduct.price === undefined) return;
                    const updated = editingProduct.id 
                      ? products.map(p => p.id === editingProduct.id ? {...p, ...editingProduct} as Product : p)
                      : [...products, { ...editingProduct, id: 'p-' + Date.now(), merchantId: merchant.id, isAvailable: true, stock: 999 } as Product];
                    onUpdateProducts(updated);
                    setShowProductModal(false);
                  }} 
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all"
                >
                  确认保存商品
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantPortal;
