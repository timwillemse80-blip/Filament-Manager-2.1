
import React, { useEffect, useState } from 'react';
import { Filament, PrintJob, OtherMaterial } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import { Layers, Weight, Euro, TrendingUp, AlertTriangle, Disc, BarChart2, Crown, CheckCircle2, XCircle, Snowflake, Lock, Box } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  filaments: Filament[];
  materials?: OtherMaterial[];
  onNavigate: (view: any) => void;
  isAdmin?: boolean;
  history?: PrintJob[]; // Add history prop
  isSnowEnabled?: boolean;
  onInspectItem?: (id: string) => void;
  onBecomePro?: () => void; // New prop
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

// Snow Generation Component
const SnowFall = () => {
  const [flakes, setFlakes] = useState<any[]>([]);

  useEffect(() => {
    // Generate flakes once on mount
    const count = 20; // Number of snowflakes
    const newFlakes = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + 'vw',
      animationDuration: (Math.random() * 5 + 5) + 's', // 5-10s
      animationDelay: (Math.random() * 5) + 's',
      opacity: Math.random() * 0.5 + 0.3,
      size: Math.random() * 10 + 10 + 'px'
    }));
    setFlakes(newFlakes);
  }, []);

  return (
    <>
      {flakes.map(flake => (
        <div 
          key={flake.id} 
          className="snowflake"
          style={{
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            opacity: flake.opacity,
            fontSize: flake.size
          }}
        >
          ❄
        </div>
      ))}
    </>
  );
};

// --- PRO Chart Overlay Component ---
const ProChartOverlay = ({ t, onClick }: { t: any, onClick?: () => void }) => (
   <div 
      onClick={onClick}
      className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] rounded-xl transition-all cursor-pointer hover:bg-white/40 dark:hover:bg-slate-900/40"
   >
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center transform transition-transform hover:scale-105">
         <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full text-amber-600 dark:text-amber-400 mb-2">
            <Lock size={24} />
         </div>
         <span className="font-bold text-sm text-slate-800 dark:text-white mb-1">{t('proFeatureLocked')}</span>
         <span className="text-xs text-slate-500 dark:text-slate-400">{t('upgradeToUnlock')}</span>
      </div>
   </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ filaments, materials = [], onNavigate, isAdmin, history = [], isSnowEnabled = true, onInspectItem, onBecomePro }) => {
  const { t } = useLanguage();

  // 1. Calculate Statistics
  const totalSpools = filaments.length;
  const totalWeight = filaments.reduce((acc, f) => acc + f.weightRemaining, 0);
  
  // Calculate value: (Price / TotalWeight) * RemainingWeight
  const filamentValue = filaments.reduce((acc, f) => {
    if (f.price && f.weightTotal > 0) {
      const pricePerGram = f.price / f.weightTotal;
      return acc + (pricePerGram * f.weightRemaining);
    }
    return acc;
  }, 0);

  // Calculate Material Value
  const materialValue = materials.reduce((acc, m) => {
     // Basic calculation: price * quantity (assumes price is per unit)
     return acc + ((m.price || 0) * m.quantity);
  }, 0);

  const totalCombinedValue = filamentValue + materialValue;

  // 2. Prepare Chart Data: Material Distribution
  const materialData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filaments.forEach(f => {
      // Normalize material names roughly
      const mat = f.material.toUpperCase().split(' ')[0]; // "PLA+" -> "PLA"
      counts[mat] = (counts[mat] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Biggest first
  }, [filaments]);

  // Helper: Count occurrences of identical filaments (Brand + Material + Color)
  const stockMap = React.useMemo(() => {
    const map = new Map<string, number>();
    filaments.forEach(f => {
      const key = `${f.brand}-${f.material}-${f.colorName}`.toLowerCase().trim();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [filaments]);

  // 3. Prepare Chart Data: Low Stock (Top 5 lowest %)
  const lowStockData = React.useMemo(() => {
    return [...filaments]
      .map(f => {
        const key = `${f.brand}-${f.material}-${f.colorName}`.toLowerCase().trim();
        const totalCount = stockMap.get(key) || 1;
        const extraStock = totalCount - 1; // Amount of *other* spools

        return {
          id: f.id, // Include ID for click handling
          name: `${f.brand} ${f.colorName}`,
          pct: Math.round((f.weightRemaining / f.weightTotal) * 100),
          color: f.colorHex,
          extraStock: extraStock,
          extraLabel: extraStock > 0 ? `+ ${extraStock}st` : '' // Label for the chart
        };
      })
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);
  }, [filaments, stockMap]);

  // 4. [PRO] Prepare Chart Data: Value per Brand
  const valueByBrandData = React.useMemo(() => {
     if (!isAdmin) {
        // Return dummy data for locked state visualization
        return [
           { name: 'Polymaker', value: 450 },
           { name: 'eSun', value: 320 },
           { name: 'Bambu Lab', value: 280 },
           { name: 'Prusament', value: 150 },
           { name: 'Sunlu', value: 90 },
        ];
     }
     const brandValues: Record<string, number> = {};
     filaments.forEach(f => {
        const val = f.price || 0; // Use full spool price as investment metric
        brandValues[f.brand] = (brandValues[f.brand] || 0) + val;
     });
     return Object.entries(brandValues)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 brands
  }, [filaments, isAdmin]);

  // 5. [PRO] Success vs Fail Chart
  const successData = React.useMemo(() => {
     if (!isAdmin) {
        // Return dummy data for locked state
        return [
           { name: t('success'), value: 85, color: '#10b981' },
           { name: t('failed'), value: 15, color: '#ef4444' }
        ];
     }
     if (history.length === 0) return [];
     const successCount = history.filter(j => j.status === 'success').length;
     const failCount = history.filter(j => j.status === 'fail').length;
     return [
        { name: t('success'), value: successCount, color: '#10b981' },
        { name: t('failed'), value: failCount, color: '#ef4444' }
     ];
  }, [history, isAdmin, t]);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCurrency = payload[0].dataKey === 'value' && typeof payload[0].value === 'number' && payload[0].value > 50; 
      
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
          <p className="text-white font-bold text-sm">{label || payload[0].name}</p>
          <p className="text-blue-400 text-sm">
            {isCurrency ? '€' : ''}{payload[0].value.toFixed(isCurrency ? 2 : 0)}{data.pct ? '%' : (isCurrency ? '' : '')}
          </p>
          {/* Show extra stock info if available */}
          {data.extraStock > 0 && (
             <p className="text-xs text-green-400 mt-1 font-medium">
                Extra: {data.extraStock} {t('items')}
             </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      {isSnowEnabled && <SnowFall />}
      
      <div className="flex justify-between items-center mb-2">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {t('dashboard')}
            {isSnowEnabled && (
               <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full flex items-center gap-1">
                  <Snowflake size={12} /> {t('winterEdition')}
               </span>
            )}
         </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spools */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] pt-8"
        >
           {isSnowEnabled && <div className="snow-drift"></div>}
           <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity mt-4">
              <Layers size={64} className="text-blue-500" />
           </div>
           <div className="relative z-10">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t('totalSpools')}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalSpools}</h3>
           </div>
        </div>

        {/* Total Weight */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group pt-8">
           {isSnowEnabled && <div className="snow-drift"></div>}
           <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity mt-4">
              <Weight size={64} className="text-emerald-500" />
           </div>
           <div className="relative z-10">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t('totalWeight')}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{(totalWeight / 1000).toFixed(1)} <span className="text-sm text-slate-400">kg</span></h3>
           </div>
        </div>

        {/* Total Value (SPLIT) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group pt-8 flex flex-col justify-between">
           {isSnowEnabled && <div className="snow-drift"></div>}
           <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity mt-4">
              <Euro size={64} className="text-amber-500" />
           </div>
           <div className="relative z-10">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t('totalValue')}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">€{totalCombinedValue.toFixed(0)}</h3>
              
              <div className="flex flex-col gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Disc size={10}/> {t('filament')}</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">€{filamentValue.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Box size={10}/> {t('materials')}</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">€{materialValue.toFixed(0)}</span>
                  </div>
              </div>
           </div>
        </div>

        {/* Low Stock Alert */}
        <div 
           onClick={() => onNavigate('shopping')}
           className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] pt-8"
        >
           {isSnowEnabled && <div className="snow-drift"></div>}
           <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity mt-4">
              <AlertTriangle size={64} className="text-red-500" />
           </div>
           <div className="relative z-10">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{t('lowStock')}</p>
              <h3 className="text-3xl font-bold text-red-500">{lowStockData.filter(x => x.pct < 20).length}</h3>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Material Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px] flex flex-col relative pt-8">
           {isSnowEnabled && <div className="snow-drift" style={{width: '30%', right: 'auto'}}></div>}
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Disc size={20} className="text-purple-500"/>
              {t('materialDistribution')}
           </h3>
           <div className="flex-1 min-h-0">
             {materialData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={materialData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={100}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {materialData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                   <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-slate-600 dark:text-slate-300 ml-1">{value}</span>}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <p>{t('noData')}</p>
                </div>
             )}
           </div>
        </div>

        {/* Low Stock Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px] flex flex-col relative pt-8">
           {isSnowEnabled && <div className="snow-drift" style={{width: '30%', right: 'auto'}}></div>}
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-500"/>
              {t('lowestStock')} (%)
           </h3>
           <div className="flex-1 min-h-0">
             {lowStockData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart
                   data={lowStockData}
                   layout="vertical"
                   margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                   <XAxis type="number" domain={[0, 100]} hide />
                   <YAxis 
                     dataKey="name" 
                     type="category" 
                     width={80} // Reduced from 100 to give more space to bars on mobile
                     tick={{fill: '#94a3b8', fontSize: 11}} 
                     tickLine={false}
                     axisLine={false}
                   />
                   <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.1}} />
                   <Bar 
                      dataKey="pct" 
                      radius={[0, 4, 4, 0]} 
                      barSize={24} // Increased bar size for better visibility
                      cursor="pointer"
                      onClick={(data) => {
                         if (onInspectItem && data && data.payload) {
                            onInspectItem(data.payload.id);
                         }
                      }}
                   >
                      {/* Added LabelList to show count behind the bar */}
                      <LabelList 
                        dataKey="extraLabel" 
                        position="right" 
                        style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      {lowStockData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.pct < 20 ? '#ef4444' : '#f59e0b'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <p>{t('noData')}</p>
                </div>
             )}
           </div>
        </div>

      </div>

      {/* --- PRO FEATURES: VALUE & SUCCESS CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
         
         {/* Value Chart - PRO STYLE */}
         <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200 dark:border-amber-900/30 shadow-md relative overflow-hidden group pt-8 transition-all">
            {isSnowEnabled && <div className="snow-drift" style={{width: '30%', right: 'auto'}}></div>}
            
            {/* Overlay for Non-Admins */}
            {!isAdmin && <ProChartOverlay t={t} onClick={onBecomePro} />}
            
            {/* PRO Badge */}
            <div className="absolute top-0 right-0 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-bl-xl text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1 z-10 border-b border-l border-amber-200 dark:border-amber-800">
               <Crown size={12} fill="currentColor" /> PRO
            </div>
            
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
               <BarChart2 size={20} className="text-amber-500" />
               {t('investmentBrand')}
            </h3>
            
            <div className={`h-[300px] ${!isAdmin ? 'blur-[4px] opacity-70' : ''}`}>
               {valueByBrandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={valueByBrandData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} />
                        <Tooltip 
                           content={<CustomTooltip />}
                           cursor={{fill: '#334155', opacity: 0.1}}
                        />
                        <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                     </BarChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                     <p>{t('noData')}</p>
                  </div>
               )}
            </div>
         </div>

         {/* Success/Fail Chart - PRO STYLE */}
         <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200 dark:border-amber-900/30 shadow-md relative overflow-hidden group pt-8 transition-all">
            {isSnowEnabled && <div className="snow-drift" style={{width: '30%', right: 'auto'}}></div>}
            
            {/* Overlay for Non-Admins */}
            {!isAdmin && <ProChartOverlay t={t} onClick={onBecomePro} />}
            
            {/* PRO Badge */}
            <div className="absolute top-0 right-0 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-bl-xl text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1 z-10 border-b border-l border-amber-200 dark:border-amber-800">
               <Crown size={12} fill="currentColor" /> PRO
            </div>
            
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
               {/* Default to Green Check (Optimistic), only show red if Fails > Success */}
               {successData.length > 0 && successData[1].value > successData[0].value ? <XCircle size={20} className="text-red-500" /> : <CheckCircle2 size={20} className="text-green-500" />}
               {t('successRate')}
            </h3>
            
            <div className={`h-[300px] ${!isAdmin ? 'blur-[4px] opacity-70' : ''}`}>
               {successData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={successData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={100}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                        >
                           {successData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                           verticalAlign="bottom" 
                           height={36} 
                           iconType="circle"
                           formatter={(value, entry: any) => (
                              <span className="text-slate-600 dark:text-slate-300 font-medium ml-1">
                                 {value}: <span className="font-bold">{entry.payload.value}</span>
                              </span>
                           )}
                        />
                     </PieChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                     <p>{t('noData')}</p>
                  </div>
               )}
            </div>
         </div>

      </div>

    </div>
  );
};
