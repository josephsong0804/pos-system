
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Merchant, Product, Order, OrderStatus, OrderItem } from './types';
import { INITIAL_MERCHANTS, INITIAL_PRODUCTS, SST_RATE } from './constants';
import PlatformAdminView from './components/PlatformAdminView';
import MerchantPortal from './components/MerchantPortal';
import CustomerView from './components/CustomerView';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('SUPER_ADMIN');
  const [currentMerchantId, setCurrentMerchantId] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);

  const syncChannel = useMemo(() => new BroadcastChannel('pos_sync'), []);

  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'NEW_ORDER') {
        setOrders(prev => [...prev, payload]);
      } else if (type === 'UPDATE_ORDER') {
        setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
      } else if (type === 'UPDATE_PRODUCTS') {
        setProducts(payload);
      } else if (type === 'ADD_MERCHANT') {
        setMerchants(prev => [...prev, payload]);
      }
    };
    syncChannel.onmessage = handleSync;
    return () => syncChannel.close();
  }, [syncChannel]);

  const handleAddMerchant = (newMerchant: Merchant) => {
    setMerchants(prev => [...prev, newMerchant]);
    syncChannel.postMessage({ type: 'ADD_MERCHANT', payload: newMerchant });
  };

  const placeOrder = (newOrder: Order) => {
    setOrders(prev => [...prev, newOrder]);
    syncChannel.postMessage({ type: 'NEW_ORDER', payload: newOrder });
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    syncChannel.postMessage({ type: 'UPDATE_ORDER', payload: updatedOrder });
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    const otherMerchantProducts = products.filter(p => p.merchantId !== currentMerchantId);
    const newTotalProducts = [...otherMerchantProducts, ...updatedProducts];
    setProducts(newTotalProducts);
    syncChannel.postMessage({ type: 'UPDATE_PRODUCTS', payload: newTotalProducts });
  };

  const currentMerchant = merchants.find(m => m.id === currentMerchantId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="fixed bottom-4 right-4 z-50 flex gap-2 bg-white p-2 rounded-full shadow-2xl border border-slate-200">
        <button 
          onClick={() => { setRole('SUPER_ADMIN'); setCurrentMerchantId(null); }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${role === 'SUPER_ADMIN' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
        >
          平台管理
        </button>
        <button 
          onClick={() => { setRole('MERCHANT'); setCurrentMerchantId('m1'); }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${role === 'MERCHANT' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
        >
          商家端
        </button>
        <button 
          onClick={() => { setRole('CUSTOMER'); setCurrentMerchantId('m1'); }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition ${role === 'CUSTOMER' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}
        >
          顾客端
        </button>
      </div>

      {role === 'SUPER_ADMIN' && (
        <PlatformAdminView 
          merchants={merchants} 
          orders={orders}
          onSelectMerchant={(id) => { setRole('MERCHANT'); setCurrentMerchantId(id); }}
          onAddMerchant={handleAddMerchant}
        />
      )}

      {role === 'MERCHANT' && currentMerchant && (
        <MerchantPortal 
          merchant={currentMerchant}
          products={products.filter(p => p.merchantId === currentMerchantId)}
          orders={orders.filter(o => o.merchantId === currentMerchantId)}
          onUpdateOrder={updateOrder}
          onUpdateProducts={handleUpdateProducts}
        />
      )}

      {role === 'CUSTOMER' && currentMerchant && (
        <CustomerView 
          merchant={currentMerchant}
          products={products.filter(p => p.merchantId === currentMerchantId && p.isAvailable)}
          onPlaceOrder={placeOrder}
        />
      )}
    </div>
  );
};

export default App;
