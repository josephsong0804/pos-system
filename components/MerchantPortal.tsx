
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
    
    if (editingProduct.id) {
      onUpdateProducts(products.map(p => p.id === editingProduct.id ? editingProduct as Product : p));
    } else {
      const newP: Product = {
        ...editingProduct as Product,
        id: 'p' + (Math.random() * 1000).toFixed(0),
        merchantId: merchant.id,
        isAvailable: true,
        image: editingProduct.image || 'https://picsum.photos/seed/new/400/300',
        stock: editingProduct.stock || 0,
        description: editingProduct.description || ''
      };
      onUpdateProducts([...products, newP]);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-2 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 py-2">
          <div className="text-3xl">{merchant.logo}</div>
          <div>
            <h1 className="font-black text-slate-800">{merchant.name}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">门店管理后台</p>
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
            菜单商品
          </button>
        </nav>
      </header>

      <main className="flex-1 p-6 md:p-8">
        {activeTab === 'PERFORMANCE' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">累计销售额 (RM)</p>
                <p className="text-4xl font-black text-indigo-600 mt-2">RM {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已完成订单</p>
                <p className="text-4xl font-black text-slate-800 mt-2">{completedOrders.length}</p>
              </div>
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">官方网站 (URL)</p>
                <p className="text-sm font-bold text-slate-800 mt-2 break-all">{merchant.websiteUrl || '未设置'}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-8">七日营业趋势</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="rev" radius={[12, 12, 12, 12]} barSize={40}>
                      {salesData.map((entry, index) => (
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
              <div key={order.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-in zoom-in duration-300">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Table {order.tableNumber || 'N/A'}</p>
                    <p className="font-mono text-[10px] font-bold text-slate-400">#{order.id.slice(0, 8)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    order.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="p-5 flex-1 space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-bold"><span className="text-indigo-600">{item.quantity}x</span> {item.name}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-50 flex justify-between font-black text-slate-800">
                    <span className="text-xs uppercase text-slate-400">Total</span>
                    <span>RM {order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 flex flex-col gap-2">
                  <button 
                    onClick={() => onUpdateOrder({...order, status: 'COMPLETED'})}
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest"
                  >
                    结单
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'MENU' && (
          <div className="max-w-5xl mx-auto bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">商品资料库</h2>
              <button 
                onClick={() => { setEditingProduct({ name: '', price: 0, category: 'Main', stock: 100, description: '', image: '' }); setShowProductModal(true); }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
              >
                + 新增单品
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">商品信息 (图片/名称)</th>
                    <th className="px-8 py-5">单价 (RM)</th>
                    <th className="px-8 py-5">库存</th>
                    <th className="px-8 py-5">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map(p => (
                    <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <img src={p.image || 'https://picsum.photos/seed/placeholder/100'} className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-slate-100" alt={p.name} />
                          <div>
                            <span className="font-bold text-slate-700 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-mono font-bold text-slate-600">RM {p.price.toFixed(2)}</td>
                      <td className="px-8 py-5 font-bold text-slate-500">{p.stock}</td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition"
                        >
                          编辑资料
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
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6">{editingProduct.id ? '编辑商品资料' : '新增单品资料'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">图片 URL</label>
                <input 
                  type="text" 
                  value={editingProduct.image}
                  onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://images.com/product.jpg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">商品名称</label>
                <input 
                  type="text" 
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="请输入商品名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">单价 (RM)</label>
                  <input 
                    type="number" 
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">库存数量</label>
                  <input 
                    type="number" 
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">描述 (可选)</label>
                <textarea 
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  placeholder="商品简短描述..."
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-50 rounded-xl transition">取消</button>
              <button onClick={handleSaveProduct} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100">保存更改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantPortal;
