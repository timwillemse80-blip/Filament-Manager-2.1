import React, { useState } from 'react';
import { Location } from '../types';
import { Plus, Edit2, Trash2, MapPin, X, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LocationManagerProps {
  locations: Location[];
  onSave: (loc: Location) => void;
  onDelete: (id: string) => void;
}

export const LocationManager: React.FC<LocationManagerProps> = ({ locations, onSave, onDelete }) => {
  const [editingLoc, setEditingLoc] = useState<Partial<Location> | null>(null);
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLoc && editingLoc.name) {
      onSave({
        id: editingLoc.id || crypto.randomUUID(),
        name: editingLoc.name,
        description: editingLoc.description || ''
      });
      setEditingLoc(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold dark:text-white text-slate-800">{t('locationManager')}</h3>
        <button
          onClick={() => setEditingLoc({ name: '', description: '' })}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> {t('addLocation')}
        </button>
      </div>

      {editingLoc && (
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('name')}</label>
              <input
                type="text"
                required
                value={editingLoc.name}
                onChange={e => setEditingLoc({ ...editingLoc, name: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('exampleLocation')}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('description')}</label>
              <input
                type="text"
                value={editingLoc.description}
                onChange={e => setEditingLoc({ ...editingLoc, description: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('optional')}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setEditingLoc(null)}
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
        {locations.map(loc => (
          <div key={loc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-start group">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{loc.name}</h4>
                {loc.description && <p className="text-sm text-slate-500">{loc.description}</p>}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditingLoc(loc)}
                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(loc.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400">
            {t('noLocations')}
          </div>
        )}
      </div>
    </div>
  );
};