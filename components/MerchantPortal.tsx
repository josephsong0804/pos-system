
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Merchant, Product, Order, OrderItem } from '../types';
import { SST_RATE } from '../constants';

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
  
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [isAnalyticsUnlocked, setIsAnalyticsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  
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
        staffName: '柜台终端'
      };
      
      onNewOrder(newOrder);
      setStaffCart([]);
      setStaffTable(prev => (parseInt(prev) + 1).toString().padStart(2, '0'));
      
      // 下单后切入厨房列表
      setTimeout(() => {
        setActiveTab('ORDERS');
        setIsOrdering(false);
      }, 400);
    } catch (e) {
      setIsOrdering(false);
    }
  };

  const importSampleDishes = () => {
    const samples: Product[] = [
      { id: 's1-' + Date.now(), merchantId: merchant.id, name: '招牌椰浆饭', description: 'Nasi Lemak Ayam', price: 12.90, category: 'Main', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=400', isAvailable: true, stock: 100 },
      { id: 's2-' + Date.now(), merchantId: merchant.id, name: '南洋黑咖啡', description: 'Kopi O Kaw', price: 3.50, category: 'Drinks', image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=400', isAvailable: true, stock: 500 },
    ];
    onUpdateProducts(samples);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl text-white font-black shadow-lg">{merchant.logo}</div>
            <div>
              <h1 className="text-lg font-black text-slate-800 leading-none">{merchant.name}</h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{activeDevicesCount} 设备同步中</p>
            </div>
          </div>
        </div>
        
        <nav className="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {['POS', 'ORDERS', 'PERFORMANCE', 'MENU'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {t === 'POS' ? '柜台点单' : t === 'ORDERS' ? `厨房订单 (${pendingOrders.length})` : t === 'PERFORMANCE' ? '营收统计' : '菜单管理'}
            </button>
          ))}
        </nav>
      </header>

      {/* 主工作区 - 修复布局塌陷问题 */}
      <main className="flex-1 flex flex-col p-6 min-h-0 relative overflow-hidden">
        {activeTab === 'POS' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full min-h-0 overflow-hidden">
            {/* 左侧：选餐面板 */}
            <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm overflow-hidden min-h-0">
               <div className="flex justify-between items-center mb-6 flex-shrink-0">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">选餐面板</h2>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 pl-2">台号:</span>
                    <input type="text" value={staffTable} onChange={e => setStaffTable(e.target.value)} className="w-12 text-center bg-white border border-slate-200 rounded-lg font-black text-indigo-600 text-lg outline-none" />
                  </div>
               </div>

               <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar flex-shrink-0">
                 {categories.map(cat => (
                   <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                     {cat}
                   </button>
                 ))}
               </div>

               {/* 核心修复：添加 flex-1 和 min-h-0 确保 Grid 区域可滚动 */}
               <div className="flex-1 overflow-y-auto pr-2 no-scrollbar grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 content-start min-h-0 pb-10">
                 {filteredProducts.map(p => (
                   <div key={p.id} onClick={() => addToStaffCart(p)} className="bg-white p-4 rounded-[32px] border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer group active:scale-95 select-none">
                     <div className="relative mb-3 aspect-square overflow-hidden rounded-[24px] bg-slate-50">
                        <img src={p.image} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                     </div>
                     <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{p.name}</h4>
                     <p className="text-indigo-600 font-black text-base font-mono">RM {p.price.toFixed(2)}</p>
                   </div>
                 ))}
                 
                 {products.length === 0 && (
                   <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
                      <p className="font-black text-sm uppercase tracking-widest mb-4">当前暂无菜品</p>
                      <button onClick={importSampleDishes} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">导入样板菜品数据</button>
                   </div>
                 )}
               </div>
            </div>

            {/* 右侧：预览 */}
            <div className="w-full lg:w-[400px] bg-white rounded-[40px] border border-slate-100 p-8 flex flex-col shadow-2xl flex-shrink-0 min-h-0">
              <h3 className="text-lg font-black text-slate-900 mb-8">点单清单</h3>
              <div className="flex-1 overflow-y-auto space-y-4 mb-8 pr-2 no-scrollbar min-h-0">
                {staffCart.map((item, i) => (
                  <div key={item.id + i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                      <p className="text-[10px] text-indigo-600 font-black mt-1">RM {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                       <button onClick={() => setStaffCart(prev => prev.map(p => p.id === item.id ? {...p, quantity: Math.max(0, p.quantity-1)} : p).filter(p => p.quantity > 0))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black text-slate-400 hover:text-indigo-600">-</button>
                       <span className="text-xs font-black text-slate-700 w-4 text-center">{item.quantity}</span>
                       <button onClick={() => addToStaffCart(item)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-black text-slate-400 hover:text-indigo-600">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-5 flex-shrink-0">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">应收金额</span>
                  <span className="text-3xl font-black text-indigo-600 font-mono tracking-tighter">RM {staffCart.reduce((a, b) => a + (b.price * b.quantity), 0).toFixed(2)}</span>
                </div>
                <button onClick={handleStaffPlaceOrder} disabled={staffCart.length === 0 || isOrdering} className="w-full py-6 bg-indigo-600 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-20">
                  {isOrdering ? '正在处理...' : '发送至厨房'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 厨房列表 */}
        {activeTab === 'ORDERS' && (
          <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pendingOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[40px] border-2 border-slate-100 p-8 flex flex-col hover:border-indigo-100 transition-all shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-black">{order.tableNumber}</span>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">桌号 {order.tableNumber}</span>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {order.items.map((item, i) => (
                      <div key={i} onClick={() => {
                        const newItems = [...order.items];
                        newItems[i] = { ...newItems[i], isServed: !newItems[i].isServed };
                        onUpdateOrder({ ...order, items: newItems });
                      }} className={`flex justify-between items-center p-3.5 rounded-xl border cursor-pointer transition-all ${item.isServed ? 'opacity-30 bg-slate-50 border-transparent' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                        <span className={`text-xs font-bold ${item.isServed ? 'line-through text-slate-400' : 'text-slate-700'}`}><span className="text-indigo-600 mr-2">x{item.quantity}</span> {item.name}</span>
                        {item.isServed && <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">待结账</span>
                    <span className="text-2xl font-black text-indigo-600 font-mono">RM {order.total.toFixed(2)}</span>
                  </div>
                  <button onClick={() => setSettlingOrder(order)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">办理结算 / CHECKOUT</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 结算弹窗 */}
      {settlingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[50px] shadow-2xl p-12 text-center animate-in zoom-in duration-200">
              <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">办理收款结账</h2>
              <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 mb-8 flex flex-col items-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">桌号 {settlingOrder.tableNumber} - 应收总计</p>
                 <p className="text-5xl font-black text-indigo-600 font-mono">RM {settlingOrder.total.toFixed(2)}</p>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={() => { onUpdateOrder({ ...settlingOrder, status: 'PAID', paymentMethod: 'CASH' }); setSettlingOrder(null); }} className="py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase hover:bg-slate-900 transition-all">现金收款 / CASH</button>
                 <button onClick={() => { onUpdateOrder({ ...settlingOrder, status: 'PAID', paymentMethod: 'Digital' }); setSettlingOrder(null); }} className="py-5 bg-slate-100 text-slate-800 rounded-[24px] font-black text-xs uppercase hover:bg-slate-200 transition-all">数字钱包 / DIGITAL</button>
              </div>
              <button onClick={() => setSettlingOrder(null)} className="mt-8 text-slate-300 font-black text-[10px] uppercase hover:text-red-500 transition-colors">取消</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MerchantPortal;
