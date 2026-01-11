
import React, { useState } from 'react';
import { Product, CartItem, Sale } from '../types';

interface POSViewProps {
  products: Product[];
  cart: CartItem[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSearch: (query: string) => void;
  onAddToCart: (p: Product) => void;
  onRemoveFromCart: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: (method: Sale['paymentMethod']) => void;
}

const POSView: React.FC<POSViewProps> = ({
  products, cart, categories, selectedCategory, onSelectCategory,
  onSearch, onAddToCart, onRemoveFromCart, onUpdateQuantity, onCheckout
}) => {
  const [paymentMode, setPaymentMode] = useState<Sale['paymentMethod'] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleProcessPayment = () => {
    setIsProcessing(true);
    // Simulate network delay
    setTimeout(() => {
      setIsProcessing(false);
      setShowReceipt(true);
    }, 1500);
  };

  const handleFinish = () => {
    if (paymentMode) onCheckout(paymentMode);
    setPaymentMode(null);
    setShowReceipt(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row relative">
      {/* Payment Overlay */}
      {paymentMode && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            {!showReceipt ? (
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">Complete Payment</h2>
                    <p className="text-slate-400 font-medium">Method: {paymentMode}</p>
                  </div>
                  <button onClick={() => setPaymentMode(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-800">Total Due</span>
                    <span className="text-3xl font-black text-indigo-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  disabled={isProcessing}
                  onClick={handleProcessPayment}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center justify-center space-x-3"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Pay Now</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-800">Payment Successful</h2>
                <div className="text-slate-500 bg-slate-50 p-4 rounded-xl font-mono text-sm">
                  <p>Order Sent to Kitchen</p>
                  <p className="mt-2 font-bold text-slate-900 tracking-widest">#{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                </div>
                <button
                  onClick={handleFinish}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-100 hover:bg-slate-800 transition-all"
                >
                  Next Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
        <div className="p-4 bg-white border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                placeholder="Search items..."
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <div className="flex overflow-x-auto no-scrollbar pb-1 sm:pb-0 space-x-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                disabled={product.stock <= 0}
                className={`group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 flex flex-col ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] text-indigo-500 font-bold mb-1 uppercase tracking-widest">{product.category}</span>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-3">{product.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-90">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart Summary */}
      <div className="w-full md:w-96 flex flex-col bg-white shadow-2xl z-10 border-l border-slate-100">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Current Order</h2>
          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-widest">{cart.length} ITEMS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <p className="font-bold text-slate-500">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center space-x-3 group animate-in slide-in-from-right duration-300">
                <img src={item.image} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt="" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{item.name}</h4>
                  <p className="text-xs text-slate-400 font-medium">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                  </button>
                  <span className="w-6 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-600">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-black text-slate-800 text-sm">TOTAL AMOUNT</span>
              <span className="font-black text-indigo-600 text-2xl">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMode('Card')}
              disabled={cart.length === 0}
              className="flex flex-col items-center justify-center py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              <span className="text-[10px] tracking-widest uppercase">Card</span>
            </button>
            <button
              onClick={() => setPaymentMode('Cash')}
              disabled={cart.length === 0}
              className="flex flex-col items-center justify-center py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg shadow-slate-100 transition-all hover:bg-slate-900 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-[10px] tracking-widest uppercase">Cash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSView;
