
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Merchant, Product, Order, OrderItem } from '../types';
import { SST_RATE, CATEGORIES as GLOBAL_CATEGORIES } from '../constants';

interface Props {
  merchant: Merchant;
  products: Product[];
  orders: Order[];
  activeDevicesCount: number;
  onBack?: () => void;
  backLabel?: string;
  onUpdateOrder: (order: Order) => void;
  onUpdateProducts: (products: Product[]) => void;
  onNewOrder: (order: Order) => void;
}

const MerchantPortal: React.FC<Props> = ({ merchant, products, orders, activeDevicesCount, onBack, backLabel, onUpdateOrder, onUpdateProducts, onNewOrder }) => {
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'ORDERS' | 'POS' | 'MENU'>('POS');
  const [staffCart, setStaffCart] = useState<OrderItem[]>([]);
  const [staffTable, setStaffTable] = useState('01');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isOrdering, setIsOrdering] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [isAnalyticsUnlocked, setIsAnalyticsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  
  const [storedPin] = useState<string | null>(() => localStorage.getItem(`merchant_pin_${merchant.id}`));

  const [now, setNow] = useState(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevOrdersCount = useRef(orders.length);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.load();
    audioRef.current = audio;
    const warmUp = () => {
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
      window.removeEventListener('click', warmUp);
    };
    window.addEventListener('click', warmUp);
    return () => window.removeEventListener('click', warmUp);
  }, []);

  useEffect(() => {
    if (orders.length > prevOrdersCount.current) {
      audioRef.current?.play().catch(() => {});
    }
    prevOrdersCount.current = orders.length;
  }, [orders.length]);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map(p => p.category)));
    return ['All', ...uniqueCats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const pendingOrders = orders.filter(o => o.merchantId === merchant.id && o.status !== 'PAID' && o.status !== 'CANCELLED');
  const completedOrders = orders.filter(o => o.merchantId === merchant.id && o.status === 'PAID');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);

  const formatDuration = (timestamp: number) => {
    const diff = Math.floor((now - timestamp) / 1000);
    return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  };

  const addToStaffCart = (p: Product) => {
    setStaffCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...p, quantity: 1, isServed: false }];
    });
  };

  const handleStaffPlaceOrder = async () => {
    if (staffCart.length === 0 || isOrdering) return;
    setIsOrdering(true);
    
    try {
      const subtotal = staffCart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const sst = merchant.sstEnabled ? subtotal * SST_RATE : 0;
      const service = subtotal * (merchant.serviceCharge / 100);
      const total = subtotal + sst + service;

      const newOrder: Order = {
        id: 'O-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        merchantId: merchant.id,
        items: [...staffCart],
        subtotal, sst, serviceChargeAmount: service, total,
        status: 'PENDING',
        timestamp: Date.now(),
        tableNumber: staffTable,
        staffName: 'Cashier Terminal'
      };
      
      onNewOrder(newOrder);
      setStaffCart([]);
      setStaffTable(prev => (parseInt(prev) + 1).toString().padStart(2, '0'));
      
      // 核心跳转：下单后自动跳转到厨房列表，确保员工能够确认订单已同步
      setTimeout(() => {
        setActiveTab('ORDERS');
        setIsOrdering(false);
      }, 400);
    } catch (e) {
      console.error(e);
      setIsOrdering(false);
    }
  };

  const handleFinalSettlement = (method: 'CASH' | 'Card') => {
    if (!settlingOrder) return;
    onUpdateOrder({ ...settlingOrder, status: 'PAID', paymentMethod: method });
    setSettlingOrder(null);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
            >
              <svg className="w-5 h-5 text-indigo-600 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs font-black text-slate-600 uppercase tracking-widest hidden sm:inline">{backLabel || '退出'}</span>
            </button>
          )}

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl text-white font-black shadow-lg shadow-indigo-100">
              {merchant.logo}
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-none">{merchant.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{activeDevicesCount} 设备在线同步</p>
              </div>
            </div>
          </div>
        </div>
        
        <nav className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {[
            { id: 'POS', label: '柜台点单' },
            { id: 'ORDERS', label: `厨房列表 (${pendingOrders.length})` },
            { id: 'PERFORMANCE', label: '营收统计' },
            { id: 'MENU', label: '菜单管理' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* 内容区域：修复页面显示一半的问题 */}
      <main className="flex-1 overflow-hidden p-6 relative flex flex-col">
        {activeTab === 'POS' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 animate-in slide-in-from-bottom duration-500 overflow-hidden">
            {/* 左侧：选餐面板 (Typo Fixed) */}
            <div className="flex-[7] bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col shadow-sm overflow-hidden">
               <div className="flex justify-between items-center mb-6 flex-shrink-0">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">选餐面板</h2>
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">桌号/台号:</span>
                    <input 
                      type="text" 
                      value={staffTable} 
                      onChange={e => setStaffTable(e.target.value)}
                      className="w-16 text-center bg-white border border-slate-200 rounded-lg font-black text-indigo-600 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
               </div>

               <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar flex-shrink-0">
                 {categories.map(cat => (
                   <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>

               <div className="flex-1 overflow-y-auto pr-2 no-scrollbar grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 content-start">
                 {filteredProducts.map(p => (
                   <div 
                     key={p.id}
                     onClick={() => addToStaffCart(p)}
                     className="bg-white p-4 rounded-[32px] border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer group active:scale-95 select-none"
                   >
                     <div className="relative mb-3 aspect-square overflow-hidden rounded-[24px] bg-slate-50">
                        <img src={p.image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                     </div>
                     <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{p.name}</h4>
                     <p className="text-indigo-600 font-black text-base font-mono">RM {p.price.toFixed(2)}</p>
                   </div>
                 ))}
               </div>
            </div>

            {/* 右侧：下单预览区 */}
            <div className="w-full lg:w-[420px] bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col shadow-2xl relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-lg font-black text-slate-900">下单清单</h3>
                <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black">
                  {staffCart.reduce((a, b) => a + b.quantity, 0)} 项
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-8 pr-2 no-scrollbar relative z-10">
                {staffCart.map((item, i) => (
                  <div key={item.id + i} className="flex justify-between items-center bg-slate-50/80 p-4 rounded-2xl border border-slate-100 animate-in slide-in-from-right duration-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-indigo-600 font-black mt-1">RM {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                       <button onClick={() => setStaffCart(prev => prev.map(p => p.id === item.id ? {...p, quantity: Math.max(0, p.quantity-1)} : p).filter(p => p.quantity > 0))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black text-slate-400 hover:text-indigo-600 transition-colors">-</button>
                       <span className="text-xs font-black text-slate-700 w-4 text-center">{item.quantity}</span>
                       <button onClick={() => addToStaffCart(item)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black text-slate-400 hover:text-indigo-600 transition-colors">+</button>
                    </div>
                  </div>
                ))}
                {staffCart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <p className="font-black text-[10px] uppercase tracking-[0.2em]">请点餐</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-5 relative z-10 flex-shrink-0">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">应收金额</span>
                  <span className="text-3xl font-black text-indigo-600 font-mono">RM {staffCart.reduce((a, b) => a + (b.price * b.quantity), 0).toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleStaffPlaceOrder} 
                  disabled={staffCart.length === 0 || isOrdering}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  {isOrdering ? '正在同步厨房...' : '确认发送至厨房 (KDS)'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'ORDERS' && (
          <div className="flex-1 overflow-y-auto no-scrollbar animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {pendingOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[40px] border-2 border-slate-100 p-8 flex flex-col hover:border-indigo-100 transition-all shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-black">{order.tableNumber}</div>
                        <span className="font-black text-slate-800 text-sm">桌号 {order.tableNumber}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{formatDuration(order.timestamp)}</span>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {order.items.map((item, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          const newItems = [...order.items];
                          newItems[i] = { ...newItems[i], isServed: !newItems[i].isServed };
                          onUpdateOrder({ ...order, items: newItems });
                        }}
                        className={`flex justify-between items-center p-3.5 rounded-xl border cursor-pointer transition-all ${item.isServed ? 'opacity-30 bg-slate-50 border-transparent' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                      >
                        <span className={`text-xs font-bold ${item.isServed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          <span className="text-indigo-600 mr-2 font-black">x{item.quantity}</span> {item.name}
                        </span>
                        {item.isServed && <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-end mb-6">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">待支付</span>
                    <span className="text-2xl font-black text-indigo-600 font-mono">RM {order.total.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setSettlingOrder(order)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100"
                  >
                    办理结算 / CHECKOUT
                  </button>
                </div>
              ))}
              {pendingOrders.length === 0 && (
                <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-200 rounded-[50px] flex flex-col items-center justify-center opacity-20">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xl font-black uppercase tracking-widest">厨房暂无新订单</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 性能报表 */}
        {activeTab === 'PERFORMANCE' && (
           <div className="flex-1 overflow-y-auto no-scrollbar py-10">
             {!isAnalyticsUnlocked ? (
                <div className="max-w-md mx-auto bg-white p-12 rounded-[50px] shadow-2xl text-center border border-slate-100">
                  <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">财务管理锁</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">输入 4 位 PIN 码解锁</p>
                  <input 
                   type="password" 
                   maxLength={4} 
                   value={enteredPin}
                   onChange={e => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-center text-3xl font-black tracking-[1em] focus:ring-4 focus:ring-indigo-50 outline-none mb-8 font-mono"
                   placeholder="****"
                  />
                  <button onClick={() => {
                    if (enteredPin === (storedPin || '0000')) setIsAnalyticsUnlocked(true);
                    else { alert('密码错误'); setEnteredPin(''); }
                  }} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">解锁报表中心</button>
                </div>
             ) : (
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 animate-in zoom-in duration-300">
                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">今日总营收</p>
                    <p className="text-4xl font-black text-indigo-600 font-mono">RM {totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">已结账单</p>
                    <p className="text-4xl font-black text-slate-800 font-mono">{completedOrders.length}</p>
                  </div>
                  <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">客单价 (AOV)</p>
                    <p className="text-4xl font-black text-emerald-600 font-mono">RM {completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(2) : '0.00'}</p>
                  </div>
                </div>
             )}
           </div>
        )}

        {activeTab === 'MENU' && (
           <div className="flex-1 bg-white rounded-[40px] border border-slate-100 overflow-hidden flex flex-col shadow-sm">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">商品库存管理</h2>
                 <button onClick={() => { setEditingProduct({ name: '', price: 0, category: 'Main', image: '' }); setShowProductModal(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all">+ 录入新品</button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead className="bg-white sticky top-0 z-10 border-b border-slate-100">
                     <tr>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">预览</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">商品名称</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">分类</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">定价</th>
                        <th className="px-10 py-5 text-right">操作</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {products.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-10 py-5"><img src={p.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-100" /></td>
                         <td className="px-10 py-5 font-bold text-slate-800 text-sm">{p.name}</td>
                         <td className="px-10 py-5"><span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-lg">{p.category}</span></td>
                         <td className="px-10 py-5 font-mono font-black text-lg">RM {p.price.toFixed(2)}</td>
                         <td className="px-10 py-5 text-right">
                            <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all">编辑</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
              </div>
           </div>
        )}
      </main>

      {/* 结算弹窗 */}
      {settlingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] shadow-2xl p-12 text-center animate-in zoom-in duration-200 relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
              <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">办理收款结账</h2>
              <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 mb-8 flex flex-col items-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">桌号 {settlingOrder.tableNumber} - 应收总计</p>
                 <p className="text-5xl font-black text-indigo-600 font-mono tracking-tighter">RM {settlingOrder.total.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={() => handleFinalSettlement('CASH')} className="py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">现金收款 / CASH</button>
                 <button onClick={() => handleFinalSettlement('Card')} className="py-5 bg-slate-100 text-slate-800 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">数字钱包 / DIGITAL</button>
              </div>
              <button onClick={() => setSettlingOrder(null)} className="mt-8 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">取消结账，返回列表</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MerchantPortal;
