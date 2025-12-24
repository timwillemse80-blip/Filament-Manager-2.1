
import React from 'react';
import { Filament, OtherMaterial } from '../types';
import { ShoppingCart, ExternalLink, Search, Box, Tag, Sparkles, ArrowRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';

interface ShoppingListProps {
  filaments: Filament[];
  materials?: OtherMaterial[];
  threshold: number;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ filaments, materials = [], threshold }) => {
  const { t, tColor } = useLanguage();
  
  // Filter Filaments
  const lowStockFilaments = filaments.filter(f => {
    const pct = (f.weightRemaining / f.weightTotal) * 100;
    return pct <= threshold;
  });

  // Filter Materials (Quantity <= MinStock AND MinStock is set)
  const lowStockMaterials = materials.filter(m => {
     return m.minStock !== undefined && m.minStock > 0 && m.quantity <= m.minStock;
  });

  const totalItems = lowStockFilaments.length + lowStockMaterials.length;

  const handleOpenUrl = (url: string) => {
    if (!url) return;
    
    // Fix protocol if missing
    let target = url;
    if (!/^https?:\/\//i.test(target)) {
        target = 'https://' + target;
    }

    if (Capacitor.isNativePlatform()) {
      window.open(target, '_system');
    } else {
      window.open(target, '_blank');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold dark:text-white text-slate-800">{t('shopping')}</h3>
        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-bold">
          {totalItems} {t('items')}
        </span>
      </div>

      {totalItems === 0 && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
            <ShoppingCart size={32} />
          </div>
          <h4 className="text-lg font-bold dark:text-white text-slate-800 mb-2">{t('allStocked')}</h4>
          <p className="text-slate-500">{t('allStockedDesc')}</p>
        </div>
      )}

      {/* FILAMENTS TABLE */}
      {lowStockFilaments.length > 0 && (
        <div className="space-y-3">
           <h4 className="font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider ml-1">{t('filaments')}</h4>
           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">{t('filament')}</th>
                  <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">{t('color')}</th>
                  <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">{t('weightRemaining')}</th>
                  <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400 text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {lowStockFilaments.map(f => {
                  const pct = Math.round((f.weightRemaining / f.weightTotal) * 100);
                  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`kopen ${f.brand} ${f.material} ${f.colorName} filament`)}`;
                  const targetUrl = f.shopUrl || googleSearchUrl;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold dark:text-white text-slate-800">{f.brand}</div>
                        <div className="text-sm text-slate-500">{f.material}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: f.colorHex }} />
                          <span className="dark:text-slate-300 text-slate-700 hidden sm:inline">{tColor(f.colorName)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-orange-500 font-bold">{pct}%</div>
                        <div className="text-xs text-slate-500">{f.weightRemaining}g</div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleOpenUrl(targetUrl)}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${f.shopUrl ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'}`}
                        >
                          {f.shopUrl ? <ShoppingCart size={16} /> : <Search size={16} />}
                          <span className="hidden sm:inline">{f.shopUrl ? t('order') : t('searchGoogle')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MATERIALS TABLE */}
      {lowStockMaterials.length > 0 && (
         <div className="space-y-3">
            <h4 className="font-bold text-slate-600 dark:text-slate-300 uppercase text-xs tracking-wider ml-1">{t('materials')}</h4>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                     <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">{t('name')}</th>
                     <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">{t('category')}</th>
                     <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">{t('stock')}</th>
                     <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400 text-right">{t('action')}</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {lowStockMaterials.map(m => {
                     const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`kopen ${m.name} ${m.category}`)}`;
                     const targetUrl = m.shopUrl || googleSearchUrl;

                     return (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                           <td className="p-4">
                              <div className="font-bold dark:text-white text-slate-800 flex items-center gap-2">
                                 <Box size={16} className="text-slate-400" />
                                 {m.name}
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                 <Tag size={14} className="text-slate-400" />
                                 {m.category}
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex flex-col">
                                 <span className="text-red-500 font-bold">{m.quantity} / {m.minStock}</span>
                                 <span className="text-xs text-slate-500 uppercase">{m.unit}</span>
                              </div>
                           </td>
                           <td className="p-4 text-right">
                              <button 
                                 onClick={() => handleOpenUrl(targetUrl)}
                                 className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${m.shopUrl ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'}`}
                              >
                                 {m.shopUrl ? <ShoppingCart size={16} /> : <Search size={16} />}
                                 <span className="hidden sm:inline">{m.shopUrl ? t('order') : t('searchGoogle')}</span>
                              </button>
                           </td>
                        </tr>
                     );
                  })}
                  </tbody>
               </table>
            </div>
         </div>
      )}
    </div>
  );
};
