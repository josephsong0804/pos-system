
import React, { useState } from 'react';
import { Merchant, Order } from '../types';

interface Props {
  merchants: Merchant[];
  orders: Order[];
  onSelectMerchant: (id: string) => void;
  onAddMerchant: (merchant: Merchant) => void;
  onUpdateMerchant: (merchant: Merchant) => void;
  onLogout: () => void;
}

const PlatformAdminView: React.FC<Props> = ({ merchants, onSelectMerchant, onAddMerchant, onUpdateMerchant, onLogout }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'F&B', logo: '🏪', accessCode: '' });

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingMerchant(null);
    setFormData({ name: '', category: 'F&B', logo: '🏪', accessCode: Math.floor(100000000000 + Math.random() * 900000000000).toString() });
    setShowModal(true);
  };

  const handleOpenEdit = (m: Merchant) => {
    setEditingMerchant(m);
    setFormData({ name: m.name, category: m.category, logo: m.logo, accessCode: m.accessCode });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.accessCode.replace(/\s/g, '').length !== 12) {
      alert("请填写完整的商户名称和 12 位识别码");
      return;
    }
    
    const cleanAccessCode = formData.accessCode.replace(/\s/g, '');

    if (editingMerchant) {
      onUpdateMerchant({ ...editingMerchant, ...formData, accessCode: cleanAccessCode });
    } else {
      onAddMerchant({
        id: 'm' + Date.now(),
        name: formData.name,
        category: formData.category,
        logo: formData.logo,
        accessCode: cleanAccessCode,
        sstEnabled: true,
        serviceCharge: 10,
        joinedDate: Date.now(),
      });
    }
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between sticky top-0 z-30 gap-4">
        <div className="flex items-center gap-5">
           <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100">N</div>
           <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Nova Admin Portal</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">NovaPOS 全局业务管理中心</p>
           </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="搜索商家或分类..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold" 
              />
              <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           <button onClick={onLogout} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">退出</button>
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMerchants.map(m => (
          <div key={m.id} className="bg-white p-7 rounded-[35px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group relative animate-in zoom-in duration-300">
            <button 
              onClick={() => handleOpenEdit(m)}
              className="absolute top-5 right-5 p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
              title="编辑商户资料"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>

            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-inner">{m.logo}</div>
            <h3 className="text-lg font-black text-slate-800 leading-none">{m.name}</h3>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-2.5 mb-6">{m.category}</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
               <div className="flex justify-between items-center mb-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">商户识别码 (Access Code)</p>
                  <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
               </div>
               <p className="font-mono text-base font-black text-slate-800 tracking-widest">
                  {m.accessCode.replace(/(\d{4})(?=\d)/g, '$1 ')}
               </p>
            </div>
            
            <button onClick={() => onSelectMerchant(m.id)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100">
               进入管理后台
            </button>
          </div>
        ))}
        
        <button onClick={handleOpenAdd} className="border-2 border-dashed border-slate-200 rounded-[35px] p-8 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-400 hover:text-indigo-400 hover:bg-indigo-50/20 transition-all min-h-[320px]">
           <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
           </div>
           <span className="font-black uppercase tracking-widest text-xs">录入新商户</span>
        </button>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[45px] shadow-2xl p-10 animate-in zoom-in duration-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
              <h2 className="text-2xl font-black text-slate-900 mb-8">{editingMerchant ? '编辑商户信息' : '录入商户'}</h2>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">商户名称</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="例如：Nova Cafe" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold transition-all" 
                    />
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">业务类别</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                    >
                       <option value="F&B">餐饮 (F&B)</option>
                       <option value="Retail">零售 (Retail)</option>
                       <option value="Beverages">饮品 (Beverages)</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">商户识别码 (12位数字)</label>
                    <input 
                      type="text" 
                      maxLength={14}
                      value={formData.accessCode.replace(/[^0-9]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')} 
                      onChange={e => setFormData({...formData, accessCode: e.target.value.replace(/[^0-9]/g, '')})} 
                      placeholder="0000 0000 0000" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-center tracking-[0.2em] font-black text-indigo-600 text-lg shadow-inner focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
                    />
                    <p className="text-[9px] text-slate-400 mt-2 italic">该代码将作为商户登录后台的唯一凭证</p>
                 </div>
              </div>

              <div className="mt-10 flex gap-4">
                 <button onClick={() => setShowModal(false)} className="flex-1 font-black text-slate-400 text-[10px] uppercase tracking-widest">取消</button>
                 <button onClick={handleSave} className="flex-[2] py-4.5 bg-indigo-600 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all">
                    {editingMerchant ? '保存修改' : '确认录入'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAdminView;
