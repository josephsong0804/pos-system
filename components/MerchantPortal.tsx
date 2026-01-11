
import React, { useState } from 'react';
import { Merchant, Product, Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  merchant: Merchant;
  products: Product[];
  orders: Order[];
  onUpdateOrder: (order: Order) => void;
  onUpdateProducts: (products: Product[]) => void;
}

const MerchantPortal: React.FC<Props> = ({ merchant, products, orders, onUpdateOrder, onUpdateProducts }) => {
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'ORDERS' | 'MENU'>('PERFORMANCE');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  const merchantOrders = orders.filter(o => o.merchantId === merchant.id);
  const pendingOrders = merchantOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  
  const completedOrders = merchantOrders.filter(o => o.status === 'COMPLETED' || o.status === 'PAID');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.total, 0);
  
  const salesData = [
    { day: 'Mon', rev: totalRevenue * 0.1 },
    { day: 'Tue', rev: totalRevenue * 0.15 },
    { day: 'Wed', rev: totalRevenue * 0.12 },
    { day: 'Thu', rev: totalRevenue * 0.18 },
    { day: 'Fri', rev: totalRevenue * 0.25 },
    { day: 'Sat', rev: totalRevenue * 0.1 },
    { day: 'Sun', rev: totalRevenue * 0.1 },
  ];

  const handleSaveProduct = () => {
    if (!editingProduct?.name || !editingProduct?.price) return;
    
    let updatedProducts: Product[];
    if (editingProduct.id) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? { ...p, ...editingProduct } as Product : p);
    } else {
      const newP: Product = {
        id: 'p' + Math.random().toString(36).substr(2, 9),
        merchantId: merchant.id,
        name: editingProduct.name!,
        description: editingProduct.description || '',
        price: editingProduct.price!,
        category: editingProduct.category || 'Main',
        image: editingProduct.image || 'https://picsum.photos/seed/food/400/300',
        isAvailable: true,
        stock: 9999 // 内部逻辑默认给一个大数值，前端不展示
      };
      updatedProducts = [...products, newP];
    }
    
    onUpdateProducts(updatedProducts);
    setShowProductModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-2 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 py-2 ml-16 md:ml-20">
          <div className="text-3xl">{merchant.logo}</div>
          <div>
            <h1 className="font-black text-slate-800">{merchant.name}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">门店后台 • 管理端</p>
          </div>
        </div>
        <nav className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('PERFORMANCE')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'PERFORMANCE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            业绩概况
          </button>
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'ORDERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            订单 ({pendingOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('MENU')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'MENU' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            菜单管理
          </button>
        </nav>
      </header>

      <main className="flex-1 p-6 md:p-8">
        {activeTab === 'PERFORMANCE' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">累计销售额 (RM)</p>
                <p className="text-4xl font-black text-indigo-600 mt-2">RM {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已完成订单</p>
                <p className="text-4xl font-black text-slate-800 mt-2">{completedOrders.length}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">官网 (URL)</p>
                <p className="text-sm font-bold text-slate-800 mt-2 truncate">{merchant.websiteUrl || '未设置'}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-8">七日营业趋势</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                    <Bar dataKey="rev" radius={[12, 12, 12, 12]} barSize={40}>
                      {salesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 4 ? '#4f46e5' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ORDERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter font-mono">#{order.id.slice(0, 8)}</p>
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase">{order.status}</span>
                </div>
                <div className="p-5 flex-1 space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-700">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-50 flex justify-between font-black text-slate-800">
                    <span className="text-xs uppercase text-slate-400 tracking-widest">Total</span>
                    <span>RM {order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-5 bg-slate-50">
                  <button onClick={() => onUpdateOrder({...order, status: 'COMPLETED'})} className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase">完成结单</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'MENU' && (
          <div className="max-w-5xl mx-auto bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">菜单管理</h2>
              <button 
                onClick={() => { setEditingProduct({ name: '', price: 0, category: 'Main', image: '' }); setShowProductModal(true); }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
              >
                + 新增商品
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">商品名称</th>
                    <th className="px-8 py-5">价格 (RM)</th>
                    <th className="px-8 py-5">分类</th>
                    <th className="px-8 py-5 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.image} className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-slate-100" />
                          <span className="font-bold text-slate-700">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono font-bold text-slate-600">RM {p.price.toFixed(2)}</td>
                      <td className="px-8 py-5"><span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-400 uppercase">{p.category}</span></td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition"
                        >
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6">{editingProduct.id ? '修改商品' : '新增商品'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">图片 URL</label>
                <input type="text" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">名称</label>
                <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" placeholder="例如: 椰子浆饭" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">价格 (RM)</label>
                  <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">分类</label>
                  <select value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl">
                    <option value="Main">主食</option>
                    <option value="Drinks">饮品</option>
                    <option value="Sides">小吃</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowProductModal(false)} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-xl transition">取消</button>
              <button onClick={handleSaveProduct} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100">保存商品</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantPortal;
