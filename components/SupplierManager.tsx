import React, { useState } from 'react';
import { Supplier } from '../types';
import { Plus, Edit2, Trash2, Truck, X, Save, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';

interface SupplierManagerProps {
  suppliers: Supplier[];
  onSave: (sup: Supplier) => void;
  onDelete: (id: string) => void;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({ suppliers, onSave, onDelete }) => {
  const [editingSup, setEditingSup] = useState<Partial<Supplier> | null>(null);
  const { t } = useLanguage();

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    // If it doesn't start with http:// or https://, prepend https://
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleOpenUrl = (url: string) => {
    if (!url) return;
    
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSup && editingSup.name) {
      onSave({
        id: editingSup.id || crypto.randomUUID(),
        name: editingSup.name,
        website: normalizeUrl(editingSup.website || '')
      });
      setEditingSup(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold dark:text-white text-slate-800">{t('supplierManager')}</h3>
        <button
          onClick={() => setEditingSup({ name: '', website: '' })}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> {t('addSupplier')}
        </button>
      </div>

      {editingSup && (
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('name')}</label>
              <input
                type="text"
                required
                value={editingSup.name}
                onChange={e => setEditingSup({ ...editingSup, name: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('exampleSupplier')}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('website')}</label>
              <input
                type="text"
                value={editingSup.website}
                onChange={e => setEditingSup({ ...editingSup, website: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('exampleWebsite')}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setEditingSup(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
              >
                <X size={18} />
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center gap-2"
              >
                <Save size={18} /> {t('save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(sup => (
          <div key={sup.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-start group">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Truck size={20} />
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{sup.name}</h4>
                {sup.website && (
                  <button 
                    onClick={() => handleOpenUrl(sup.website!)} 
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1 bg-transparent border-0 p-0"
                  >
                    {t('website')} <ExternalLink size={10} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingSup(sup)}
                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(sup.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400">
            {t('noSuppliers')}
          </div>
        )}
      </div>
    </div>
  );
};