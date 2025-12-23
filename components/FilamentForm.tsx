import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filament, FilamentMaterial, AiSuggestion, Location, Supplier } from '../types';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
// Added Plus and Zap to the imports from lucide-react to fix line 754 and 951 errors
import { Camera as CameraIcon, Loader2, Sparkles, X, Save, RefreshCw, Link as LinkIcon, Euro, Layers, Check, QrCode, Edit2, Download, Image as ImageIcon, FileText, Share2, ToggleLeft, ToggleRight, ScanLine, Eraser, AlertTriangle, Printer, Calculator, Scale, Mail, Send, ExternalLink, Plus, Zap } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { App as CapacitorApp } from '@capacitor/app';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { COMMON_BRANDS, BRAND_DOMAINS, COMMON_COLORS, ENGLISH_COLOR_MAP } from '../constants';

interface FilamentFormProps {
  initialData?: Filament;
  locations: Location[];
  suppliers: Supplier[];
  existingBrands?: string[]; // Prop from parent
  onSave: (filament: Filament | Filament[]) => void;
  onSaveLocation: (loc: Location) => void;
  onSaveSupplier: (sup: Supplier) => void;
  onCancel: () => void;
  initialShowLabel?: boolean;
  onSetHandlesBackButton?: (handles: boolean) => void;
}

// App Logo SVG for QR Code fallback
const APP_LOGO_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12 L21 3.5' stroke='%23F97316'/%3E%3Cpath d='M21 3.5 L15 3.5' stroke='%23F97316'/%3E%3Cpath d='M21 12a9 9 0 1 1-6.219-8.56' stroke='%233B82F6'/%3E%3Ccircle cx='12' cy='12' r='2.5' fill='%231E40AF' stroke='none'/%3E%3C/svg%3E";

export const FilamentForm: React.FC<FilamentFormProps> = ({ 
  initialData, locations, suppliers, existingBrands, onSave, onSaveLocation, onSaveSupplier, onCancel, initialShowLabel = false, onSetHandlesBackButton
}) => {
  const { t, tColor } = useLanguage();
  const [formData, setFormData] = useState<Partial<Filament>>(initialData || {
    brand: '',
    material: FilamentMaterial.PLA,
    colorName: 'Zwart',
    colorHex: '#000000',
    weightTotal: 1000,
    weightRemaining: 1000,
    tempNozzle: 200,
    tempBed: 60,
    notes: '',
    locationId: '',
    supplierId: '',
    shopUrl: '',
    price: undefined,
    shortId: undefined
  });

  const isEditMode = !!initialData;

  const [quantity, setQuantity] = useState(1);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);
  const [isCustomColor, setIsCustomColor] = useState(false);

  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  
  const [showLabel, setShowLabel] = useState(initialShowLabel);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [preferLogo, setPreferLogo] = useState(true);
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Weighing Calculator State
  const [showWeighHelper, setShowWeighHelper] = useState(false);
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [selectedSpoolType, setSelectedSpoolType] = useState<string>('Generic (Plastic Normaal)');
  const [tareWeight, setTareWeight] = useState<number>(230);
  
  // Spool Database State (Loaded from DB/JSON)
  const [spoolWeights, setSpoolWeights] = useState<Record<string, number>>({
    "Generic (Plastic Normaal)": 230,
    "Generic (Karton)": 140,
    "Generic (MasterSpool/Refill)": 0
  });

  // Dynamic Brands & Materials State (Loaded from DB)
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [dbMaterials, setDbMaterials] = useState<string[]>([]);

  // Contribute Spool State
  const [showContribute, setShowContribute] = useState(false);
  const [contributeForm, setContributeForm] = useState({ brand: '', type: '', weight: '' });

  const labelRef = useRef<HTMLDivElement>(null); 
  const formDataRef = useRef(formData);
  const showLabelRef = useRef(showLabel);
  const initialDataRef = useRef(initialData);
  const showUnsavedDialogRef = useRef(showUnsavedDialog);

  // Combine static common brands with dynamically added brands from the database (AND any existing ones passed via props)
  const availableBrands = useMemo(() => {
    const combined = new Set([...COMMON_BRANDS, ...dbBrands, ...(existingBrands || [])]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [dbBrands, existingBrands]);

  // Combine static materials with DB materials
  const availableMaterials = useMemo(() => {
     const combined = new Set([...Object.values(FilamentMaterial), ...dbMaterials]);
     return Array.from(combined).sort();
  }, [dbMaterials]);

  // Load Spool Weights, Brands & Materials from DB
  useEffect(() => {
     const loadData = async () => {
        try {
           // 1. Spool Weights
           const { data: weightsData } = await supabase.from('spool_weights').select('*');
           if (weightsData && weightsData.length > 0) {
              const weightsMap: Record<string, number> = {};
              weightsData.forEach((item: any) => {
                 weightsMap[item.name] = item.weight;
              });
              setSpoolWeights(prev => ({ ...prev, ...weightsMap }));
           } else {
              // Fallback
              fetch('/spool_weights.json')
                 .then(res => res.json())
                 .then(data => setSpoolWeights(prev => ({ ...prev, ...data })))
                 .catch(() => {});
           }

           // 2. Brands
           const { data: brandsData } = await supabase.from('brands').select('name');
           if (brandsData) {
              setDbBrands(brandsData.map(b => b.name));
           }

           // 3. Materials
           const { data: materialsData } = await supabase.from('materials').select('name');
           if (materialsData) {
              setDbMaterials(materialsData.map(m => m.name));
           }

        } catch (e) {
           console.error("Could not load dynamic data", e);
        }
     };
     loadData();
  }, []);

  // Effect to smart-select spool type based on brand
  useEffect(() => {
     if (formData.brand && showWeighHelper) {
        const brandLower = formData.brand.toLowerCase();
        
        // Find best match in SPOOL_WEIGHTS keys
        let bestMatch = '';
        if (brandLower.includes('bambu')) bestMatch = "Bambu Lab (Reusable)";
        else if (brandLower.includes('prusa')) bestMatch = "Prusament";
        else if (brandLower.includes('esun')) bestMatch = "eSun (Zwart Plastic)";
        else if (brandLower.includes('sunlu')) bestMatch = "Sunlu (Plastic)";
        else if (brandLower.includes('polymaker')) bestMatch = "Polymaker (Karton)";
        else if (brandLower.includes('anycubic')) bestMatch = "Anycubic";
        else if (brandLower.includes('creality')) bestMatch = "Creality";
        else if (brandLower.includes('elegoo')) bestMatch = "Elegoo (Karton)";
        else if (brandLower.includes('123')) bestMatch = "123-3D Jupiter";
        
        if (bestMatch && spoolWeights[bestMatch]) {
           setSelectedSpoolType(bestMatch);
           setTareWeight(spoolWeights[bestMatch]);
        }
     }
  }, [formData.brand, showWeighHelper, spoolWeights]);

  const handleApplyWeight = () => {
     if (grossWeight && typeof grossWeight === 'number') {
        const net = Math.max(0, grossWeight - tareWeight);
        setFormData(prev => ({ ...prev, weightRemaining: net }));
        setShowWeighHelper(false);
     }
  };

  const handleSendContribution = () => {
     if (!contributeForm.brand || !contributeForm.weight) return;
     
     const subject = encodeURIComponent(`Nieuwe Spoel Gewicht Suggestie`);
     const body = encodeURIComponent(
        `Ik heb een spoel gevonden die nog niet in de lijst staat!\n\n` +
        `Merk: ${contributeForm.brand}\n` +
        `Type Spoel: ${contributeForm.type || 'Onbekend'} (bv. plastic, kampioen)\n` +
        `Leeg Gewicht: ${contributeForm.weight} gram\n\n` +
        `Alvast bedankt!`
     );
     
     // Use window.open for mailto to work in Capacitor and Web
     if (Capacitor.isNativePlatform()) {
        window.open(`mailto:info@filamentmanager.nl?subject=${subject}&body=${body}`, '_system');
     } else {
        window.open(`mailto:info@filamentmanager.nl?subject=${subject}&body=${body}`);
     }
     
     setShowContribute(false);
     setContributeForm({ brand: '', type: '', weight: '' });
     alert("Bedankt! Je mail-app wordt geopend om de suggestie te versturen.");
  };

  const handleOpenShopUrl = () => {
    if (!formData.shopUrl) return;
    let url = formData.shopUrl;
    // Simple fix for missing protocol
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    
    if (Capacitor.isNativePlatform()) {
      window.open(url, '_system');
    } else {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    formDataRef.current = formData;
    showLabelRef.current = showLabel;
    initialDataRef.current = initialData;
    showUnsavedDialogRef.current = showUnsavedDialog;
  }, [formData, showLabel, initialData, showUnsavedDialog]);

  const triggerSubmit = () => {
    const baseFilament: Filament = {
      id: initialData?.id || crypto.randomUUID(),
      shortId: initialData?.shortId,
      purchaseDate: initialData?.purchaseDate || new Date().toISOString(),
      brand: formData.brand!,
      material: formData.material!,
      colorName: formData.colorName!,
      colorHex: formData.colorHex!,
      weightTotal: Number(formData.weightTotal),
      weightRemaining: Number(formData.weightRemaining),
      tempNozzle: Number(formData.tempNozzle),
      tempBed: Number(formData.tempBed),
      notes: formData.notes,
      locationId: formData.locationId || null,
      supplierId: formData.supplierId || null,
      shopUrl: formData.shopUrl,
      price: formData.price ? Number(formData.price) : undefined
    };

    if (initialData) {
      onSave(baseFilament);
    } else {
      if (quantity > 1) {
        const newFilaments: Filament[] = [];
        for (let i = 0; i < quantity; i++) {
          newFilaments.push({
            ...baseFilament,
            id: crypto.randomUUID(),
          });
        }
        onSave(newFilaments);
      } else {
        onSave({ ...baseFilament, id: crypto.randomUUID() });
      }
    }
  };

  const checkIsDirty = () => {
    const fd = formDataRef.current;
    const id = initialDataRef.current;

    if (!id) {
      return !!fd.brand || !!fd.notes || (fd.weightRemaining !== 1000);
    }
    return (
      fd.brand !== id.brand ||
      fd.material !== id.material ||
      fd.colorName !== id.colorName ||
      fd.colorHex !== id.colorHex ||
      fd.weightRemaining !== id.weightRemaining ||
      fd.weightTotal !== id.weightTotal ||
      fd.tempNozzle !== id.tempNozzle ||
      fd.tempBed !== id.tempBed ||
      fd.notes !== id.notes ||
      fd.locationId !== id.locationId ||
      fd.supplierId !== id.supplierId ||
      fd.shopUrl !== id.shopUrl ||
      fd.price !== id.price
    );
  };

  const attemptClose = () => {
    if (checkIsDirty()) {
      setShowUnsavedDialog(true);
    } else {
      onCancel();
    }
  };

  useEffect(() => {
    if (initialData) {
      if (initialData.brand && !availableBrands.includes(initialData.brand)) setIsCustomBrand(true);
      if (initialData.material && !availableMaterials.includes(initialData.material)) setIsCustomMaterial(true);
      if (initialData.colorName && !COMMON_COLORS.some(c => c.name === initialData.colorName)) setIsCustomColor(true);
    }
  }, [initialData, availableBrands, availableMaterials]);

  // Logo determination (Brand Logo)
  useEffect(() => {
    if (showLabel && formData.brand && preferLogo) {
       // Fixed typo BRAND_DOMDINS to BRAND_DOMAINS on line 310
       const brandKey = Object.keys(BRAND_DOMAINS || {}).find(k => k.toLowerCase() === formData.brand?.toLowerCase());
       const domain = brandKey ? BRAND_DOMAINS[brandKey] : null;

       if (domain) {
          const url = `https://logo.clearbit.com/${domain}?size=200`;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => setLogoUrl(url);
          img.onerror = () => setLogoUrl(null);
       } else {
          setLogoUrl(null);
       }
    } else if (!preferLogo) {
      setLogoUrl(null);
    }
  }, [showLabel, formData.brand, preferLogo]);

  // QR Code Generation with App Logo Embedding
  useEffect(() => {
    const generateQr = async () => {
      const shortId = initialData?.shortId || formData.shortId;
      if (!shortId) return;

      const url = `filament://${shortId}`;
      try {
        // 1. Generate Basic QR (High Error Correction)
        const qrDataUrl = await QRCode.toDataURL(url, { 
           errorCorrectionLevel: 'H', 
           margin: 1,
           width: 500,
           color: {
             dark: '#000000',
             light: '#FFFFFF'
           }
        });

        // 2. Embed App Logo
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');

        if (ctx) {
           const qrImg = new Image();
           qrImg.src = qrDataUrl;
           
           await new Promise((resolve, reject) => { 
             qrImg.onload = resolve; 
             qrImg.onerror = () => reject(new Error('QR Load error'));
           });
           
           ctx.drawImage(qrImg, 0, 0);

           const logoImg = new Image();
           logoImg.src = APP_LOGO_URI;
           
           try {
             await new Promise((resolve, reject) => { 
               logoImg.onload = resolve; 
               logoImg.onerror = reject;
             });

             // Center Logo (approx 20% of QR)
             const logoSize = 100; 
             const pos = (500 - logoSize) / 2;

             // White background for logo
             ctx.fillStyle = '#FFFFFF';
             ctx.beginPath();
             ctx.arc(250, 250, (logoSize / 2) + 5, 0, 2 * Math.PI);
             ctx.fill();

             // Draw Logo
             ctx.drawImage(logoImg, pos, pos, logoSize, logoSize);
             setQrCodeUrl(canvas.toDataURL());
           } catch (e) {
             // Fallback to QR without logo
             setQrCodeUrl(qrDataUrl);
           }
        } else {
           setQrCodeUrl(qrDataUrl);
        }
      } catch(e) {
        console.error("QR Generation failed", e);
      }
    };

    if (showLabel) {
      generateQr();
    }
  }, [initialData?.shortId, formData.shortId, showLabel]);

  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const preprocessImage = async (base64Str: string): Promise<string> => {
    return new Promise((resolve, reject) => {
       const img = new Image();
       img.onload = () => {
         const canvas = document.createElement('canvas');
         const MAX_DIM = 1024;
         let w = img.width;
         let h = img.height;

         if (w > h) {
           if (w > MAX_DIM) {
             h *= MAX_DIM / w;
             w = MAX_DIM;
           }
         } else {
           if (h > MAX_DIM) {
             w *= MAX_DIM / h;
             h = MAX_DIM;
           }
         }

         canvas.width = w;
         canvas.height = h;
         const ctx = canvas.getContext('2d');
         
         if (!ctx) {
           resolve(base64Str); 
           return;
         }

         ctx.drawImage(img, 0, 0, w, h);
         const newBase64 = canvas.toDataURL('image/jpeg', 0.85);
         resolve(newBase64);
       };
       img.onerror = (e) => reject(e);
       img.src = base64Str.startsWith('data:') ? base64Str : `data:image/jpeg;base64,${base64Str}`;
    });
  };

  const processImage = async (rawBase64: string) => {
    setIsScanning(true);
    setIsAnalyzing(true);
    setShowCamera(false); 

    try {
      const safeBase64 = await preprocessImage(rawBase64);
      const result: any = await analyzeSpoolImage(safeBase64);
      
      if (!result.brand && !result.material && !result.colorName && !result.notes) {
         alert(t('none'));
         return; 
      }

      let aiBrand = result.brand;
      if (aiBrand && /^(unknown|onbekend|none|geen merk)$/i.test(aiBrand)) aiBrand = '';
      if (!aiBrand) aiBrand = formData.brand;

      let matchedBrand = availableBrands.find(b => b.toLowerCase() === aiBrand?.toLowerCase());
      if (matchedBrand) aiBrand = matchedBrand;
      setIsCustomBrand(!matchedBrand && !!aiBrand);
      
      let aiMaterial = result.material || formData.material;
      let matchedMaterial = availableMaterials.find(m => m.toLowerCase() === aiMaterial?.toLowerCase());
      if (matchedMaterial) aiMaterial = matchedMaterial;
      setIsCustomMaterial(!matchedMaterial && !!aiMaterial);

      let aiColor = result.colorName || formData.colorName;
      let aiHex = result.colorHex;

      if (aiColor) {
         const lower = aiColor.toLowerCase().trim();
         if (ENGLISH_COLOR_MAP[lower]) {
            aiColor = ENGLISH_COLOR_MAP[lower].name;
            if (!aiHex || aiHex === '#000000') aiHex = ENGLISH_COLOR_MAP[lower].hex;
         } else {
             for (const [eng, dutchObj] of Object.entries(ENGLISH_COLOR_MAP)) {
                 if (lower.includes(eng)) {
                     if (!aiHex || aiHex === '#000000') aiHex = dutchObj.hex;
                     break; 
                 }
             }
         }
      }

      let matchedColor = COMMON_COLORS.find(c => c.name.toLowerCase() === aiColor?.toLowerCase());
      if (matchedColor) {
         aiColor = matchedColor.name;
         if (!aiHex || aiHex === '#000000') aiHex = matchedColor.hex;
      }
      
      setIsCustomColor(!matchedColor && !!aiColor);

      setFormData(prev => ({
        ...prev,
        brand: aiBrand,
        material: aiMaterial,
        colorName: aiColor,
        colorHex: aiHex || prev.colorHex,
        tempNozzle: result.tempNozzle || prev.tempNozzle,
        tempBed: result.tempBed || prev.tempBed,
        notes: prev.notes
      }));

    } catch (error: any) {
      console.error("Processing failed:", error);
      alert(`${t('failed')}:\n${error.message}`);
    } finally {
      setIsScanning(false);
      setIsAnalyzing(false);
    }
  };

  const startCamera = async () => {
    // Probeer eerst native camera plugin
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90, 
          allowEditing: false, 
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          width: 1500,
          correctOrientation: true
        });

        if (image.base64String) {
          await processImage(image.base64String);
        }
        return; // Succes met native camera
      } catch (error: any) {
        if (error?.message?.includes('User cancelled')) return;
        
        // Native plugin faalt of is niet geïmplementeerd. 
        // We loggen dit en vallen onmiddellijk terug op web-camera.
        console.warn("Native Camera plugin faalt, overschakelen op web-camera fallback.", error);
      }
    }

    // Web Implementation (Fallback voor browser of niet-werkende plugin)
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error accessing web camera:", err);
      alert(t('failed') + ": Camera niet toegankelijk. Controleer je rechten.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureWebImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
    const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.85);
    stopCamera();
    processImage(base64Image);
  };

  const handleAutoSettings = async () => {
    if (!formData.brand || !formData.material) {
      alert(t('failed'));
      return;
    }
    setIsAnalyzing(true);
    try {
      const suggestion = await suggestSettings(formData.brand, formData.material);
      if (suggestion.tempNozzle) setFormData(prev => ({ ...prev, tempNozzle: suggestion.tempNozzle }));
      if (suggestion.tempBed) setFormData(prev => ({ ...prev, tempBed: suggestion.tempBed }));
    } catch (e) {
      // ignore
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSubmit();
  };

  const handleColorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomColor(true);
      setFormData({ ...formData, colorName: '' });
    } else {
      setIsCustomColor(false);
      const selectedColor = COMMON_COLORS.find(c => c.name === val);
      setFormData({ 
        ...formData, 
        colorName: val,
        colorHex: selectedColor?.hex || formData.colorHex
      });
    }
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    const exactMatch = COMMON_COLORS.find(c => c.hex.toLowerCase() === newHex.toLowerCase());
    if (exactMatch) {
      setIsCustomColor(false);
      setFormData(prev => ({ ...prev, colorHex: newHex, colorName: exactMatch.name }));
    } else {
      setIsCustomColor(true);
      setFormData(prev => ({ ...prev, colorHex: newHex, colorName: '' }));
    }
  };

  const handleSaveNewLocation = () => {
    if (!newLocationName.trim()) {
      setIsAddingLocation(false);
      return;
    }
    const newId = crypto.randomUUID();
    onSaveLocation({ id: newId, name: newLocationName });
    setFormData({ ...formData, locationId: newId });
    setIsAddingLocation(false);
    setNewLocationName("");
  };

  const handleSaveNewSupplier = () => {
    if (!newSupplierName.trim()) {
      setIsAddingSupplier(false);
      return;
    }
    const newId = crypto.randomUUID();
    onSaveSupplier({ id: newId, name: newSupplierName });
    setFormData({ ...formData, supplierId: newId });
    setIsAddingSupplier(false);
    setNewSupplierName("");
  };

  const handlePrintLabel = async () => {
    if (!qrCodeUrl || !formData.brand) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [40, 20] 
    });

    doc.addImage(qrCodeUrl, 'PNG', 1.5, 2.5, 15, 15);
    const textX = 17.5;
    if (logoUrl) {
       try { doc.text(formData.brand.substring(0, 16), textX, 5); } catch(e) { doc.text(formData.brand.substring(0, 16), textX, 5); }
    } else {
       doc.setFontSize(7);
       doc.setFont("helvetica", "bold");
       doc.text(formData.brand.substring(0, 16), textX, 5);
    }
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const info = `${formData.material} ${tColor(formData.colorName || '')}`;
    doc.text(info.substring(0, 18), textX, 9);
    doc.setFontSize(5);
    doc.text(`N:${formData.tempNozzle} B:${formData.tempBed}`, textX, 12);
    doc.setFontSize(9);
    doc.setFont("courier", "bold");
    doc.text(formData.shortId || "", textX, 17);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  };

  const handleDownloadImage = async (forSharing: boolean = false) => {
    if (!labelRef.current) return;
    try {
      const canvas = await html2canvas(labelRef.current, { 
        scale: 3, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const image = canvas.toDataURL('image/png');
      const shortId = initialData?.shortId || formData.shortId;
      const fileName = `label-${shortId}.png`;

      if (Capacitor.isNativePlatform()) {
        const data = image.replace('data:image/png;base64,', '');
        if (forSharing) {
           try {
              const result = await Filesystem.writeFile({
                path: fileName,
                data: data,
                directory: Directory.Cache
              });
              await Share.share({ files: [result.uri] });
           } catch (e: any) {
              alert(t('failed') + ": " + e.message);
           }
        } else {
           try {
              try { await Filesystem.requestPermissions(); } catch (e) {}
              const path = `Pictures/FilamentManager/${fileName}`; 
              try {
                await Filesystem.mkdir({ path: 'Pictures/FilamentManager', directory: Directory.ExternalStorage, recursive: true });
              } catch(e) {}
              await Filesystem.writeFile({ path: path, data: data, directory: Directory.ExternalStorage });
              alert(t('success'));
           } catch (e: any) {
              alert(t('failed') + ": " + e.message);
           }
        }
      } else {
        const link = document.createElement('a');
        link.href = image;
        link.download = fileName;
        link.click();
      }
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
           <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 {/* Fixed: Added missing Plus import from lucide-react on line 754 */}
                 {isEditMode ? <Edit2 size={20} className="text-blue-500" /> : <Plus size={24} className="text-blue-500" />}
                 {isEditMode ? t('formEditTitle') : t('formNewTitle')}
              </h2>
              {isEditMode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {initialData.id}</p>}
           </div>
           <button onClick={attemptClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
              <X size={24} />
           </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
           
           {/* Smart AI Scanner Section */}
           {!isEditMode && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                    <Sparkles size={100} />
                 </div>
                 
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
                          <ScanLine size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-lg leading-tight">{t('scanTitle')}</h3>
                          <p className="text-xs text-blue-100 opacity-80">{t('scanDesc')}</p>
                       </div>
                    </div>
                    
                    <button 
                       type="button"
                       onClick={startCamera}
                       disabled={isAnalyzing}
                       className="w-full bg-white text-blue-700 font-black py-3.5 rounded-xl shadow-md hover:bg-blue-50 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] disabled:opacity-50"
                    >
                       {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <CameraIcon size={20} />}
                       {isAnalyzing ? t('analyzingFilament') : t('lookupMode')}
                    </button>
                 </div>
              </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-5 pb-4">
              
              {/* BRAND */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex justify-between items-center">
                    <span>{t('brand')}</span>
                    {isCustomBrand && (
                       <button 
                          type="button" 
                          onClick={() => setIsCustomBrand(false)} 
                          className="text-blue-500 text-[10px] hover:underline"
                       >
                          {t('selectBrand')}
                       </button>
                    )}
                 </label>
                 {isCustomBrand ? (
                    <input 
                       type="text" 
                       required
                       value={formData.brand} 
                       onChange={e => setFormData({...formData, brand: e.target.value})} 
                       className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 rounded-xl p-3 outline-none focus:border-blue-500 dark:text-white"
                       placeholder={t('otherBrand')}
                    />
                 ) : (
                    <select 
                       required
                       value={formData.brand} 
                       onChange={e => e.target.value === 'CUSTOM' ? setIsCustomBrand(true) : setFormData({...formData, brand: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                    >
                       <option value="">{t('selectBrand')}</option>
                       {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                       <option value="CUSTOM">{t('otherBrand')}</option>
                    </select>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* MATERIAL */}
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('material')}</label>
                    {isCustomMaterial ? (
                       <input 
                          type="text" 
                          required
                          value={formData.material} 
                          onChange={e => setFormData({...formData, material: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 rounded-xl p-3 outline-none focus:border-blue-500 dark:text-white"
                       />
                    ) : (
                       <select 
                          required
                          value={formData.material} 
                          onChange={e => e.target.value === 'CUSTOM' ? setIsCustomMaterial(true) : setFormData({...formData, material: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                       >
                          {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                          <option value="CUSTOM">{t('otherMaterial')}</option>
                       </select>
                    )}
                 </div>

                 {/* COLOR */}
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('color')}</label>
                    <div className="flex gap-2">
                       {isCustomColor ? (
                          <input 
                             type="text" 
                             required
                             value={formData.colorName} 
                             onChange={e => setFormData({...formData, colorName: e.target.value})} 
                             className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/30 rounded-xl p-3 outline-none focus:border-blue-500 dark:text-white"
                             placeholder={t('colorNamePlaceholder')}
                          />
                       ) : (
                          <select 
                             required
                             value={formData.colorName} 
                             onChange={handleColorSelect}
                             className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                          >
                             {COMMON_COLORS.map(c => <option key={c.name} value={c.name}>{tColor(c.name)}</option>)}
                             <option value="CUSTOM">{t('otherColor')}</option>
                          </select>
                       )}
                       <div className="relative group">
                          <input 
                             type="color" 
                             value={formData.colorHex} 
                             onChange={handleHexChange}
                             className="w-12 h-12 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1"
                             title="Hex kleur"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {/* WEIGHT SECTION */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('stock')}</h4>
                    <button 
                       type="button" 
                       onClick={() => setShowWeighHelper(true)}
                       className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                    >
                       <Scale size={14} /> {t('weighHelper')}
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">{t('weightTotalLabel')}</label>
                       <div className="relative">
                          <input 
                             type="number" 
                             required
                             value={formData.weightTotal} 
                             onChange={e => setFormData({...formData, weightTotal: parseFloat(e.target.value)})} 
                             className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-8 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          />
                          <span className="absolute left-3 top-3.5 text-slate-400 text-xs">g</span>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">{t('weightRemainingLabel')}</label>
                       <div className="relative">
                          <input 
                             type="number" 
                             required
                             value={formData.weightRemaining} 
                             onChange={e => setFormData({...formData, weightRemaining: parseFloat(e.target.value)})} 
                             className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-8 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          />
                          <span className="absolute left-3 top-3.5 text-slate-400 text-xs">g</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* TEMPERATURES */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                 <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Instellingen</h4>
                    <button 
                       type="button" 
                       onClick={handleAutoSettings}
                       disabled={!formData.brand || !formData.material || isAnalyzing}
                       className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800 flex items-center gap-1.5 hover:bg-amber-100 disabled:opacity-50 transition-all"
                    >
                       {/* Fixed: Added missing Zap import from lucide-react on line 951 */}
                       <Zap size={14} /> AI {t('suggestSettings')}
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">{t('tempNozzle')}</label>
                       <input 
                          type="number" 
                          value={formData.tempNozzle} 
                          onChange={e => setFormData({...formData, tempNozzle: parseInt(e.target.value)})} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">{t('tempBed')}</label>
                       <input 
                          type="number" 
                          value={formData.tempBed} 
                          onChange={e => setFormData({...formData, tempBed: parseInt(e.target.value)})} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                       />
                    </div>
                 </div>
              </div>

              {/* LOCATION & SUPPLIER */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('location')}</label>
                    <select 
                       value={formData.locationId || ''} 
                       onChange={e => e.target.value === 'NEW' ? setIsAddingLocation(true) : setFormData({...formData, locationId: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                    >
                       <option value="">{t('none')}</option>
                       {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                       <option value="NEW">{t('newLocationOption')}</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('supplier')}</label>
                    <select 
                       value={formData.supplierId || ''} 
                       onChange={e => e.target.value === 'NEW' ? setIsAddingSupplier(true) : setFormData({...formData, supplierId: e.target.value})}
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                    >
                       <option value="">{t('none')}</option>
                       {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       <option value="NEW">{t('newSupplierOption')}</option>
                    </select>
                 </div>
              </div>

              {/* PRICE & URL */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('price')}</label>
                    <div className="relative">
                       <input 
                          type="number" 
                          step="0.01"
                          value={formData.price || ''} 
                          onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pl-8 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          placeholder="0.00"
                       />
                       <Euro size={16} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('shopUrl')}</label>
                    <div className="relative group">
                       <input 
                          type="text" 
                          value={formData.shopUrl || ''} 
                          onChange={e => setFormData({...formData, shopUrl: e.target.value})} 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pl-8 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          placeholder="https://..."
                       />
                       <LinkIcon size={16} className="absolute left-3 top-3.5 text-slate-400" />
                       {formData.shopUrl && (
                          <button 
                             type="button" 
                             onClick={handleOpenShopUrl}
                             className="absolute right-2 top-2 p-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          >
                             <ExternalLink size={14} className="text-blue-500" />
                          </button>
                       )}
                    </div>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('notes')}</label>
                 <textarea 
                    value={formData.notes || ''} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24 resize-none"
                    placeholder={t('optional')}
                 />
              </div>

              {!isEditMode && (
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('addMultiple')}</label>
                    <div className="flex items-center gap-4">
                       <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={quantity} 
                          onChange={e => setQuantity(parseInt(e.target.value))} 
                          className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                       />
                       <span className="font-bold text-lg dark:text-white w-8 text-center">{quantity}</span>
                    </div>
                 </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3">
                 <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                    <Save size={20} />
                    {isEditMode ? t('saveChanges') : t('addToInventory')}
                 </button>
                 
                 {isEditMode && (
                    <button 
                       type="button" 
                       onClick={() => setShowLabel(!showLabel)}
                       className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${showLabel ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:border-amber-400'}`}
                    >
                       <QrCode size={20} />
                       {t('labels')}
                    </button>
                 )}
              </div>
           </form>
        </div>

        {/* Labels View Drawer */}
        {showLabel && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 p-6 animate-fade-in flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><QrCode size={18} className="text-amber-500" /> {t('labels')}</h3>
               <button onClick={() => setShowLabel(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            {/* Real Labels Preview Card */}
            <div 
               ref={labelRef}
               className="bg-white p-4 shadow-xl mb-8 flex gap-4 items-center border border-slate-200"
               style={{ width: '400px', height: '200px', borderRadius: '4px' }}
            >
              {/* QR Section */}
              <div className="w-[150px] h-[150px] flex-shrink-0">
                 {qrCodeUrl ? (
                    <img src={qrCodeUrl} className="w-full h-full object-contain" alt="QR Code" />
                 ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center border border-slate-100">
                       <Loader2 className="animate-spin text-slate-300" />
                    </div>
                 )}
              </div>

              {/* Info Section */}
              <div className="flex-1 flex flex-col justify-between h-full py-1 text-black font-sans">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       {logoUrl ? (
                          <img src={logoUrl} crossOrigin="anonymous" className="h-6 object-contain" alt="Brand Logo" />
                       ) : (
                          <span className="font-black text-lg tracking-tighter uppercase">{formData.brand}</span>
                       )}
                    </div>
                    <div className="text-sm font-bold text-slate-700 leading-none">
                       {formData.material} {tColor(formData.colorName || '')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       N:{formData.tempNozzle}° / B:{formData.tempBed}°
                    </div>
                 </div>
                 
                 <div className="mt-auto">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Stock Identity</div>
                    <div className="text-3xl font-black font-mono tracking-tighter leading-none">{formData.shortId || '----'}</div>
                 </div>
              </div>
            </div>

            {/* Label Controls */}
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
               <button 
                  onClick={handlePrintLabel}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-95"
               >
                  <Printer size={18} /> {t('print')}
               </button>
               <button 
                  onClick={() => handleDownloadImage(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-95"
               >
                  <Download size={18} /> PNG
               </button>
               <button 
                  onClick={() => handleDownloadImage(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-95"
               >
                  <Share2 size={18} /> {t('share')}
               </button>
               <button 
                  onClick={() => setPreferLogo(!preferLogo)}
                  className={`font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm border-2 transition-all active:scale-95 ${preferLogo ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}
               >
                  {preferLogo ? <ToggleRight size={20} className="text-indigo-600"/> : <ToggleLeft size={20} className="text-slate-400"/>}
                  Logos
               </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-4 text-center">Formaat geoptimaliseerd voor 40x20mm labelprinters (bv. NIIMBOT, Phomemo, Brother).</p>
          </div>
        )}

      </div>

      {/* --- ADD MODALS --- */}
      {isAddingLocation && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('addLocation')}</h3>
               <input 
                  autoFocus
                  type="text" 
                  value={newLocationName}
                  onChange={e => setNewLocationName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white mb-4"
                  placeholder={t('exampleLocation')}
                  onKeyDown={e => e.key === 'Enter' && handleSaveNewLocation()}
               />
               <div className="flex gap-2">
                  <button onClick={() => setIsAddingLocation(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl">{t('cancel')}</button>
                  <button onClick={handleSaveNewLocation} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">{t('save')}</button>
               </div>
            </div>
         </div>
      )}

      {isAddingSupplier && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('addSupplier')}</h3>
               <input 
                  autoFocus
                  type="text" 
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white mb-4"
                  placeholder={t('exampleSupplier')}
                  onKeyDown={e => e.key === 'Enter' && handleSaveNewSupplier()}
               />
               <div className="flex gap-2">
                  <button onClick={() => setIsAddingSupplier(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl">{t('cancel')}</button>
                  <button onClick={handleSaveNewSupplier} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">{t('save')}</button>
               </div>
            </div>
         </div>
      )}

      {/* --- UNSAVED DIALOG --- */}
      {showUnsavedDialog && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 text-center">
               <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} className="text-amber-500" />
               </div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Niet opgeslagen!</h2>
               <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Je hebt wijzigingen aangebracht. Wil je deze opslaan voordat je afsluit?</p>
               
               <div className="flex flex-col gap-3">
                  <button 
                     onClick={triggerSubmit}
                     className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                     <Save size={20} /> Opslaan en Sluiten
                  </button>
                  <button 
                     onClick={onCancel}
                     className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-red-600 font-bold rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                  >
                     Wijzigingen weggooien
                  </button>
                  <button 
                     onClick={() => setShowUnsavedDialog(false)}
                     className="text-slate-400 font-bold text-sm hover:underline py-2"
                  >
                     Nee, ga terug
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- CAMERA OVERLAY (Web Implementation) --- */}
      {showCamera && (
         <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
            <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="h-full w-full object-cover"
               />
               
               {/* Scanning Overlay Visual */}
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-72 h-72 border-2 border-white/50 rounded-[40px] relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scanner-scan" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30 font-black uppercase tracking-[0.3em] text-xs">
                     Center Label
                  </div>
               </div>
               
               <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                     <Sparkles size={18} className="text-blue-400" />
                     <span className="text-white text-xs font-bold uppercase tracking-widest">{t('scanTitle')}</span>
                  </div>
                  <button 
                    onClick={stopCamera}
                    className="bg-white/10 backdrop-blur-md text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all active:scale-90"
                  >
                    <X size={24} />
                  </button>
               </div>
               
               <div className="absolute bottom-16 left-0 right-0 px-8 flex justify-center items-center gap-8">
                  <button 
                     onClick={captureWebImage}
                     className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-2xl transition-transform active:scale-90 group"
                  >
                     <div className="w-16 h-16 rounded-full bg-white group-hover:bg-blue-50 transition-colors shadow-inner" />
                  </button>
               </div>
               
               <p className="absolute bottom-6 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                  {t('scanInstruction')}
               </p>
            </div>
            <canvas ref={canvasRef} className="hidden" />
         </div>
      )}

      {/* --- WEIGH HELPER MODAL --- */}
      {showWeighHelper && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                     <Scale size={24} className="text-blue-500" /> {t('weighHelper')}
                  </h3>
                  <button onClick={() => setShowWeighHelper(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                     <X size={24} />
                  </button>
               </div>
               
               <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                     <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest mb-2 block">{t('grossWeight')}</label>
                     <div className="flex items-center gap-4">
                        <input 
                           type="number" 
                           autoFocus
                           value={grossWeight} 
                           onChange={e => setGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                           className="flex-1 bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 text-2xl font-black outline-none focus:border-blue-500 dark:text-white"
                           placeholder="0.0"
                        />
                        <span className="text-xl font-bold text-slate-400">gram</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">{t('spoolType')}</label>
                     <select 
                        value={selectedSpoolType}
                        onChange={e => {
                           const key = e.target.value;
                           setSelectedSpoolType(key);
                           setTareWeight(spoolWeights[key] || 0);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none"
                     >
                        {Object.keys(spoolWeights).sort().map(k => <option key={k} value={k}>{k}</option>)}
                     </select>
                     
                     <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Eraser size={20} className="text-slate-400" />
                        <div className="flex-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('tareWeight')}</span>
                           <span className="font-bold dark:text-white">{tareWeight} gram</span>
                        </div>
                        <input 
                           type="number" 
                           value={tareWeight}
                           onChange={e => setTareWeight(parseFloat(e.target.value) || 0)}
                           className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-center text-sm font-bold dark:text-white"
                        />
                     </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-500 font-bold">{t('result')}</span>
                        <div className="text-right">
                           <span className="block text-3xl font-black text-blue-600 dark:text-blue-400">
                              {grossWeight === '' ? '0' : Math.max(0, Number(grossWeight) - tareWeight).toFixed(1)}g
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('weightRemainingLabel')}</span>
                        </div>
                     </div>
                     
                     <button 
                        onClick={handleApplyWeight}
                        disabled={grossWeight === ''}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                     >
                        {t('apply')}
                     </button>
                  </div>
                  
                  <div className="pt-2 text-center">
                     <button 
                        type="button" 
                        onClick={() => setShowContribute(true)}
                        className="text-[11px] font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
                     >
                        + {t('suggestSpool')}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* --- CONTRIBUTE SPOOL MODAL --- */}
      {showContribute && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8">
               <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Send size={32} className="text-emerald-600 dark:text-emerald-400" />
               </div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">Bijdragen</h2>
               <p className="text-slate-500 dark:text-slate-400 mb-8 text-center text-sm">Help anderen! Geef het gewicht van je lege spoel door voor onze database.</p>
               
               <div className="space-y-4">
                  <input 
                     type="text" 
                     placeholder="Merk (bv. Polymaker)"
                     value={contributeForm.brand}
                     onChange={e => setContributeForm({...contributeForm, brand: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white"
                  />
                  <input 
                     type="text" 
                     placeholder="Type Spoel (bv. Karton)"
                     value={contributeForm.type}
                     onChange={e => setContributeForm({...contributeForm, type: e.target.value})}
                     className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 outline-none dark:text-white"
                  />
                  <div className="relative">
                     <input 
                        type="number" 
                        placeholder="Leeg gewicht"
                        value={contributeForm.weight}
                        onChange={e => setContributeForm({...contributeForm, weight: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 pr-12 outline-none dark:text-white"
                     />
                     <span className="absolute right-3 top-3 text-slate-400 font-bold">g</span>
                  </div>
               </div>
               
               <div className="flex flex-col gap-3 mt-8">
                  <button 
                     onClick={handleSendContribution}
                     disabled={!contributeForm.brand || !contributeForm.weight}
                     className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                     Suggestie Versturen
                  </button>
                  <button 
                     onClick={() => setShowContribute(false)}
                     className="w-full py-3 text-slate-400 font-bold text-sm"
                  >
                     {t('cancel')}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};