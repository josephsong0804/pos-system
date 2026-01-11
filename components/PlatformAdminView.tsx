
import React, { useState } from 'react';
import { Merchant, Order } from '../types';

interface Props {
  merchants: Merchant[];
  orders: Order[];
  onSelectMerchant: (id: string) => void;
  onAddMerchant: (merchant: Merchant) => void;
  onUpdateMerchant: (merchant: Merchant) => void;
}

const PlatformAdminView: React.FC<Props> = ({ merchants, onSelectMerchant, onAddMerchant, onUpdateMerchant }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'F&B', logo: '🏪', accessCode: '' });

  const generateAccessCode = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingMerchant(null);
    setFormData({ name: '', category: 'F&B', logo: '🏪', accessCode: generateAccessCode() });
    setShowModal(true);
  };

  const handleOpenEdit = (m: Merchant) => {
    setEditingMerchant(m);
    setFormData({ name: m.name, category: m.category, logo: m.logo, accessCode: m.accessCode });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.accessCode.length !== 12) return;
    
    if (editingMerchant) {
      const updated: Merchant = {
        ...editingMerchant,
        ...formData
      };
      onUpdateMerchant(updated);
    } else {
      const m: Merchant = {
        id: 'm' + (merchants.length + 1),
        name: formData.name,
        category: formData.category,
        logo: formData.logo,
        accessCode: formData.accessCode,
        sstEnabled: true,
        serviceCharge: 10,
        joinedDate: Date.now(),
      };
      onAddMerchant(m);
    }
    setShowModal(false);
  };

  const formatCode = (code: string) => code.replace(/(\d{4})(?=\d)/g, '$1 ');

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Nova 管理中心</h1>
          <p className="text-slate-500 mt-2 font-medium">平台管理员视野 • 识别码发放与商户管理</p>
        </div>
        <div className="relative w-full md:w-72">
          <input 
            type="text"
            placeholder="搜索商家..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <svg className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMerchants.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
            <button 
              onClick={() => handleOpenEdit(m)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              title="编辑商户信息"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl mb-4">{m.logo}</div>
              <h3 className="text-xl font-bold text-slate-800">{m.name}</h3>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase mt-2 mb-6">
                {m.category}
              </span>
              
              <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">专属 12 位识别码</p>
                <p className="font-mono text-lg font-black text-indigo-600 tracking-wider">
                  {formatCode(m.accessCode)}
                </p>
              </div>
              
              <button 
                onClick={() => onSelectMerchant(m.id)}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-colors"
              >
                直接进入后台
              </button>
            </div>
          </div>
        ))}
        
        <button 
          onClick={handleOpenAdd}
          className="border-2 border-dashed border-slate-200 rounded-[32px] p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-all min-h-[300px]"
        >
          <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <span className="font-bold text-sm">录入新商户</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6">{editingMerchant ? '编辑商户信息' : '录入新商户'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">商户名称</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="请输入名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">分类</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="F&B">餐饮 (F&B)</option>
                    <option value="Retail">零售 (Retail)</option>
                    <option value="Beverages">饮品 (Beverages)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">图标 (Emoji)</label>
                  <input 
                    type="text" 
                    value={formData.logo}
                    onChange={e => setFormData({...formData, logo: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">商户识别码 (12位数字)</label>
                <input 
                  type="text" 
                  value={formData.accessCode}
                  maxLength={12}
                  onChange={e => setFormData({...formData, accessCode: e.target.value.replace(/\D/g, '')})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-lg font-bold tracking-widest outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="123456789012"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">这是商家登录后台的唯一身份识别码</p>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-400 font-bold rounded-xl transition">取消</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100">
                {editingMerchant ? '保存修改' : '生成商户识别码'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminView;
