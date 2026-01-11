
import React from 'react';
import { Sale, OrderStatus } from '../types';

interface OrdersViewProps {
  sales: Sale[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  isHost: boolean;
}

const OrdersView: React.FC<OrdersViewProps> = ({ sales, onUpdateStatus, isHost }) => {
  // Fixed case sensitivity for status checks
  const activeOrders = sales.filter(s => s.status !== 'COMPLETED').reverse();
  const completedOrders = sales.filter(s => s.status === 'COMPLETED').reverse();

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'PREPARING': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'READY': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50 no-scrollbar">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Order Queue</h2>
            <p className="text-slate-500 font-medium">Fulfillment & Kitchen Management</p>
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>

        {/* Active Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order ID</h4>
                  <p className="font-mono font-bold text-slate-800">#{order.id.substr(0, 8)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="flex-1 p-5 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold">{item.quantity}</span>
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-white border-t border-slate-50">
                <div className="flex justify-between text-xs mb-4">
                  <span className="text-slate-400 font-bold uppercase tracking-tighter">Terminal</span>
                  <span className="text-slate-600 font-bold">{order.staffName || 'Guest'}</span>
                </div>
                {isHost && (
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'PENDING' && (
                      <button onClick={() => onUpdateStatus(order.id, 'PREPARING')} className="col-span-2 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Start Prep</button>
                    )}
                    {order.status === 'PREPARING' && (
                      <button onClick={() => onUpdateStatus(order.id, 'READY')} className="col-span-2 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100">Order Ready</button>
                    )}
                    {order.status === 'READY' && (
                      <button onClick={() => onUpdateStatus(order.id, 'COMPLETED')} className="col-span-2 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest">Hand Over</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {activeOrders.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-slate-200 rounded-3xl">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-lg font-bold">No active orders</p>
              <p className="text-sm font-medium">Ready for new customers</p>
            </div>
          )}
        </div>

        {/* Recently Completed */}
        {completedOrders.length > 0 && (
          <div className="pt-10">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Handed Over Recently</h3>
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {completedOrders.slice(0, 5).map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">#{order.id.substr(0, 8)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{order.items.length} Items</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.timestamp).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">FULFILLED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersView;
