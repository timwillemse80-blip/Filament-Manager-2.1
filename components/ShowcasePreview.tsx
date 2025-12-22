
import React, { useState, useMemo } from 'react';
import { Filament } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, ExternalLink, Box, LogIn, Layers, Filter, Check, Lock, ArrowLeft } from 'lucide-react';

interface ShowcasePreviewProps {
  filaments: Filament[];
  onClose: () => void;
  publicName?: string;
  initialFilters?: string[]; // The allowed materials whitelist
  isAdminPreview?: boolean;
}

export const ShowcasePreview: React.FC<ShowcasePreviewProps> = ({ filaments, onClose, publicName, initialFilters, isAdminPreview = false }) => {
  const { t, tColor } = useLanguage();
  
  // 1. STRICT LOCK: Filter the source filaments immediately based on the shared link constraints.
  // This ensures items not in the 'initialFilters' list effectively don't exist in this view.
  const allowedFilaments = useMemo(() => {
    if (!initialFilters || initialFilters.length === 0) return filaments;
    
    // Normalization for case-insensitive comparison
    const allowedLower = initialFilters.map(f => f.toLowerCase());
    return filaments.filter(f => allowedLower.includes(f.material.toLowerCase()));
  }, [filaments, initialFilters]);

  // 2. Extract materials available within the ALLOWED subset for the UI buttons
  const availableMaterials = useMemo(() => {
    const materials = new Set(allowedFilaments.map(f => f.material).filter(Boolean));
    return Array.from(materials).sort();
  }, [allowedFilaments]);

  // 3. User local filtering (toggling buttons WITHIN the allowed view)
  const [activeMaterials, setActiveMaterials] = useState<string[]>([]); // Empty means "Show all allowed"

  // 4. Final filter for display logic (User Selection + Hard Constraint)
  const displayFilaments = useMemo(() => {
    if (activeMaterials.length === 0) return allowedFilaments;
    
    return allowedFilaments.filter(f => 
       activeMaterials.some(active => active.toLowerCase() === f.material.toLowerCase())
    );
  }, [allowedFilaments, activeMaterials]);

  // 5. Group the FINAL filaments (Brand -> Material)
  const grouped = useMemo(() => {
    const groups: Record<string, Filament[]> = {};
    displayFilaments.forEach(f => {
       const key = `${f.brand}-${f.material}`;
       if (!groups[key]) groups[key] = [];
       groups[key].push(f);
    });
    return groups;
  }, [displayFilaments]);

  const toggleMaterial = (mat: string) => {
     setActiveMaterials(prev => {
        if (prev.includes(mat)) {
           return prev.filter(m => m !== mat);
        } else {
           return [...prev, mat];
        }
     });
  };

  const isRestrictedView = initialFilters && initialFilters.length > 0;
  // Hide filter bar if there is only 1 (or 0) material option available.
  const showFilterBar = availableMaterials.length > 1;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-50 dark:bg-slate-900 overflow-y-auto animate-fade-in flex flex-col">
       {/* Public Header */}
       <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm flex-shrink-0">
          <div className="px-6 py-4 flex justify-between items-center">
             <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   {publicName || t('publicStock')}
                   {isRestrictedView && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-amber-200 dark:border-amber-800">
                         <Lock size={10} /> Gefilterd
                      </span>
                   )}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('availableItems')}</p>
             </div>
             <button 
                onClick={onClose} 
                className={`bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${isAdminPreview ? 'border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10' : ''}`}
             >
                {isAdminPreview ? <X size={20} /> : <LogIn size={18} />}
                {isAdminPreview ? "Sluiten" : t('loginClose')}
             </button>
          </div>

          {/* Filter Bar (Shows only allowed materials, and only if > 1 choice) */}
          {showFilterBar && (
             <div className="px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                <button 
                   onClick={() => setActiveMaterials([])}
                   className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${activeMaterials.length === 0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
                >
                   {t('all')}
                </button>
                {availableMaterials.map(mat => {
                   const isActive = activeMaterials.includes(mat);
                   return (
                      <button 
                         key={mat}
                         onClick={() => toggleMaterial(mat)}
                         className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border flex items-center gap-2 ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
                      >
                         {isActive && <Check size={14} strokeWidth={3} />}
                         {mat}
                      </button>
                   );
                })}
             </div>
          )}
       </div>

       {/* Content */}
       <div className="max-w-5xl mx-auto p-6 w-full flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {Object.entries(grouped).map(([key, items]: [string, Filament[]]) => {
                const first = items[0];
                
                // Logic to merge identical colors
                const uniqueColorMap = new Map<string, { item: Filament, count: number }>();

                items.forEach(item => {
                    const colorKey = (item.colorName || 'unknown').toLowerCase().trim();
                    if (uniqueColorMap.has(colorKey)) {
                        uniqueColorMap.get(colorKey)!.count += 1;
                    } else {
                        uniqueColorMap.set(colorKey, { item, count: 1 });
                    }
                });

                const uniqueItems = Array.from(uniqueColorMap.values()).sort((a, b) => 
                    (a.item.colorName || '').localeCompare(b.item.colorName || '')
                );

                return (
                   <div key={key} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/30">
                         <h3 className="font-bold text-lg text-slate-800 dark:text-white">{first.brand}</h3>
                         <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mt-1">
                            {first.material}
                         </span>
                      </div>
                      <div className="p-4 space-y-3">
                         {uniqueItems.map(({ item, count }) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors group">
                               <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm flex-shrink-0" style={{ backgroundColor: item.colorHex }} />
                               <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate">{tColor(item.colorName)}</p>
                               </div>
                               {count > 1 && (
                                  <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md flex items-center gap-1">
                                     <Layers size={12} /> {count}x
                                  </span>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                );
             })}
          </div>
          
          {displayFilaments.length === 0 && (
             <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                <Box size={48} className="mb-4 opacity-50" />
                <p>{filaments.length > 0 ? t('noFilaments') : t('noData')}</p>
             </div>
          )}
       </div>
    </div>
  );
};
