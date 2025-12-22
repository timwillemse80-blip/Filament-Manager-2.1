
import React, { useState, useRef } from 'react';
import { OtherMaterial, Location, Supplier } from '../types';
import { Save, X, Trash2, Box, Tag, MapPin, Truck, Link as LinkIcon, Euro, ExternalLink, Camera, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

interface MaterialFormProps {
  initialData?: OtherMaterial;
  locations: Location[];
  suppliers: Supplier[];
  onSave: (material: OtherMaterial) => void;
  onCancel: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({ initialData, locations, suppliers, onSave, onCancel }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<OtherMaterial>>(initialData || {
    name: '',
    category: '',
    quantity: 1,
    unit: 'stuks',
    minStock: 0,
    price: 0,
    notes: '',
    shopUrl: '',
    image: ''
  });

  const categories = ["Electronica", "Bevestiging (Bouten/Moeren)", "Lijm & Tape", "Gereedschap", "Onderdelen", "Verpakking", "Anders"];
  const units = ["stuks", "meter", "liter", "gram", "set", "rol", "doos"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || crypto.randomUUID(),
      name: formData.name!,
      category: formData.category || 'Anders',
      quantity: Number(formData.quantity),
      unit: formData.unit as any || 'stuks',
      minStock: Number(formData.minStock),
      price: Number(formData.price),
      locationId: formData.locationId,
      supplierId: formData.supplierId,
      shopUrl: formData.shopUrl,
      notes: formData.notes,
      purchaseDate: initialData?.purchaseDate || new Date().toISOString(),
      image: formData.image
    });
  };

  const handleOpenUrl = () => {
    if (formData.shopUrl) {
       const url = formData.shopUrl.startsWith('http') ? formData.shopUrl : `https://${formData.shopUrl}`;
       if (Capacitor.isNativePlatform()) window.open(url, '_system');
       else window.open(url, '_blank');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Ask user: Camera or Photos
        width: 800
      });

      if (image.base64String) {
        setFormData(prev => ({ ...prev, image: image.base64String }));
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix if present for consistency, though standard img src handles both
        const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
        setFormData(prev => ({ ...prev, image: base64Data }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getImageUrl = (base64?: string) => {
    if (!base64) return null;
    return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
           <h2 className="text-xl font-bold dark:text-white text-slate-800">{initialData ? 'Materiaal Bewerken' : 'Nieuw Materiaal'}</h2>
           <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
           <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Image Section */}
              <div className="flex justify-center mb-4">
                 <div className="relative group">
                    <div 
                       onClick={() => Capacitor.isNativePlatform() ? handleTakePhoto() : fileInputRef.current?.click()}
                       className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer overflow-hidden relative"
                    >
                       {formData.image ? (
                          <img src={getImageUrl(formData.image)!} className="w-full h-full object-cover" alt="Preview" />
                       ) : (
                          <Camera size={32} className="text-slate-400" />
                       )}
                       
                       {/* Hover Overlay */}
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="text-white" size={24} />
                       </div>
                    </div>
                    {formData.image && (
                       <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setFormData({...formData, image: undefined}); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                       >
                          <X size={14} />
                       </button>
                    )}
                    <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       accept="image/*" 
                       onChange={handleFileSelect} 
                    />
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('name')}</label>
                 <div className="relative">
                    <input 
                       type="text" 
                       required 
                       value={formData.name} 
                       onChange={e => setFormData({...formData, name: e.target.value})} 
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                       placeholder="bv. M3x10 Boutjes"
                    />
                    <Box size={18} className="absolute left-3 top-3.5 text-slate-400"/>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categorie</label>
                    <div className="relative">
                       <select 
                          value={formData.category} 
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                       >
                          <option value="">Kies...</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                       <Tag size={18} className="absolute left-3 top-3.5 text-slate-400"/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Eenheid</label>
                    <select 
                       value={formData.unit} 
                       onChange={e => setFormData({...formData, unit: e.target.value as any})}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                    >
                       {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Aantal</label>
                    <input 
                       type="number" 
                       step="0.01"
                       required
                       value={formData.quantity} 
                       onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} 
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Min. Voorraad</label>
                    <input 
                       type="number" 
                       value={formData.minStock} 
                       onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)})} 
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('location')}</label>
                    <div className="relative">
                       <select 
                          value={formData.locationId || ''} 
                          onChange={e => setFormData({...formData, locationId: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                       >
                          <option value="">{t('none')}</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                       </select>
                       <MapPin size={18} className="absolute left-3 top-3.5 text-slate-400"/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('supplier')}</label>
                    <div className="relative">
                       <select 
                          value={formData.supplierId || ''} 
                          onChange={e => setFormData({...formData, supplierId: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                       >
                          <option value="">{t('none')}</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                       <Truck size={18} className="absolute left-3 top-3.5 text-slate-400"/>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('price')} (p/st)</label>
                    <div className="relative">
                       <input 
                          type="number" 
                          step="0.01"
                          value={formData.price || ''} 
                          onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                       />
                       <Euro size={18} className="absolute left-3 top-3.5 text-slate-400"/>
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('shopUrl')}</label>
                    <div className="relative">
                       <input 
                          type="text" 
                          value={formData.shopUrl || ''} 
                          onChange={e => setFormData({...formData, shopUrl: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          placeholder="https://..."
                       />
                       <LinkIcon size={18} className="absolute left-3 top-3.5 text-slate-400"/>
                       {formData.shopUrl && (
                          <button type="button" onClick={handleOpenUrl} className="absolute right-2 top-2 p-1 bg-slate-200 dark:bg-slate-600 rounded">
                             <ExternalLink size={14}/>
                          </button>
                       )}
                    </div>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('notes')}</label>
                 <textarea 
                    value={formData.notes || ''} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white h-20 resize-none"
                 />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-2">
                 <Save size={20}/> {t('saveChanges')}
              </button>

           </form>
        </div>
      </div>
    </div>
  );
};
