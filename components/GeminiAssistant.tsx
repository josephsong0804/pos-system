
import React, { useState, useEffect } from 'react';
import { Sale, Product, AIInsight } from '../types';
import { getSalesInsights } from '../services/geminiService';

interface GeminiAssistantProps {
  sales: Sale[];
  products: Product[];
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ sales, products }) => {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const data = await getSalesInsights(sales, products);
      setInsight(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sales.length > 0) {
      generateInsights();
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 pt-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 animate-pulse">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">Nova AI Business Assistant</h2>
            <p className="text-slate-500 mt-2">Get intelligent insights based on your store's data.</p>
          </div>
          <button
            onClick={generateInsights}
            disabled={loading}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing Data...</span>
              </>
            ) : (
              <span>Refresh AI Analysis</span>
            )}
          </button>
        </div>

        {insight ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-100 col-span-1 md:col-span-2">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Executive Summary</h3>
              <p className="text-xl text-slate-800 leading-relaxed font-medium">{insight.summary}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Actionable Recommendations</h3>
              <ul className="space-y-4">
                {insight.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">{i + 1}</div>
                    <span className="text-slate-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Trend Analysis</h3>
              <p className="text-slate-700 leading-relaxed italic">
                "{insight.trendAnalysis}"
              </p>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400">Analysis confidence</span>
                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[92%]" />
                </div>
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">No data analyzed yet. Click the button above to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiAssistant;
