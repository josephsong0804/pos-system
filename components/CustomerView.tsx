
import React, { useState } from 'react';
import { Merchant, Product, Order, OrderItem } from '../types';
import { SST_RATE } from '../constants';

interface Props {
  merchant: Merchant;
  products: Product[];
  onPlaceOrder: (order: Order) => void;
}

const CustomerView: React.FC<Props> = ({ merchant, products, onPlaceOrder }) => {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [tableNumber, setTableNumber] = useState('08');
  const [paymentStep, setPaymentStep] = useState<'IDLE' | 'QR' | 'SUCCESS'>('IDLE');

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const removeFromCart = (pid: string) => {
    setCart(prev => prev.filter(item => item.id !== pid));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const sstAmount = merchant.sstEnabled ? subtotal * SST_RATE : 0;
  const serviceChargeAmount = subtotal * (merchant.serviceCharge / 100);
  const total = subtotal + sstAmount + serviceChargeAmount;

  const handlePayment = () => {
    setPaymentStep('QR');
    setTimeout(() => {
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        merchantId: merchant.id,
        items: cart,
        subtotal,
        sst: sstAmount,
        serviceChargeAmount,
        total,
        status: 'PAID',
        paymentMethod: 'DUITNOW',
        timestamp: Date.now(),
        tableNumber
      };
      onPlaceOrder(newOrder);
      setPaymentStep('SUCCESS');
      setCart([]);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative">
      {/* Header */}
      <div className="p-6 bg-indigo-600 text-white">
        <div className="flex justify-between items-center mb-4">
          <span className="text-3xl">{merchant.logo}</span>
          <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Table {tableNumber}</span>
        </div>
        <h1 className="text-2xl font-black">{merchant.name}</h1>
        <p className="text-indigo-100 text-sm opacity-80">{merchant.category} • 马来西亚本地风味</p>
      </div>

      {/* Categories Horizontal */}
      <div className="flex gap-2 overflow-x-auto p-4 no-scrollbar bg-white sticky top-0 border-b border-slate-50 z-10">
        {['All', 'Main', 'Drinks', 'Sides'].map(c => (
          <button key={c} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-500 whitespace-nowrap active:bg-indigo-600 active:text-white transition">
            {c === 'All' ? '全部' : c}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="flex-1 p-4 space-y-4">
        {products.map(p => (
          <div key={p.id} className="flex gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 group transition active:scale-[0.98]">
            <img src={p.image} className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800">{p.name}</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">{p.description}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-black text-indigo-600">RM {p.price.toFixed(2)}</span>
                <button 
                  onClick={() => addToCart(p)}
                  className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-indigo-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Cart Button */}
      {cart.length > 0 && (
        <div className="sticky bottom-0 p-4 bg-white border-t border-slate-100">
          <button 
            onClick={() => setShowCheckout(true)}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black flex justify-between items-center shadow-2xl"
          >
            <span className="flex items-center gap-2">
              <span className="bg-indigo-600 w-6 h-6 rounded-md flex items-center justify-center text-xs">{cart.length}</span>
              查看订单
            </span>
            <span>RM {total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="absolute inset-0 z-50 bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-black">确认结算</h2>
            <button onClick={() => { setShowCheckout(false); setPaymentStep('IDLE'); }} className="text-slate-400">关闭</button>
          </div>
          
          <div className="flex-1 p-6 space-y-4 overflow-auto">
            {paymentStep === 'IDLE' ? (
              <>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400">RM {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-sm font-bold text-slate-600">{item.quantity}x</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>RM {subtotal.toFixed(2)}</span>
                  </div>
                  {merchant.sstEnabled && (
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>SST (6%)</span>
                      <span>RM {sstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {merchant.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Service Charge ({merchant.serviceCharge}%)</span>
                      <span>RM {serviceChargeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xl text-slate-900 pt-2">
                    <span>Total Amount</span>
                    <span>RM {total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">选择支付方式</p>
                  <button 
                    onClick={handlePayment}
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-600 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-500 rounded-lg text-white flex items-center justify-center font-bold text-[10px]">D</div>
                      <span className="font-bold">DuitNow QR / E-Wallet</span>
                    </div>
                    <div className="w-5 h-5 rounded-full border border-slate-200" />
                  </button>
                  <button className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-lg text-white flex items-center justify-center font-bold text-[10px]">💵</div>
                      <span className="font-bold">柜台现金支付 (Cash)</span>
                    </div>
                  </button>
                </div>
              </>
            ) : paymentStep === 'QR' ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-6">
                <div className="w-64 h-64 bg-slate-50 border-8 border-pink-500 p-4 rounded-3xl flex items-center justify-center relative">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=duitnow_sample" className="w-full opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
                <p className="text-center font-bold text-slate-800">正在等待支付完成...<br/><span className="text-sm font-medium text-slate-400">请使用 Touch 'n Go 或银行 APP 扫描</span></p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in zoom-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black">支付成功!</h3>
                  <p className="text-slate-500">订单已发送至厨房，请稍坐片刻。</p>
                </div>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold"
                >
                  回首页
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;
