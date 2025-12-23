import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Filament, FilamentMaterial, AiSuggestion, Location, Supplier } from '../types';
import { analyzeSpoolImage, suggestSettings } from '../services/geminiService';
import { Camera as CameraIcon, Loader2, Sparkles, X, Save, RefreshCw, Link as LinkIcon, Euro, Layers, Check, QrCode, Edit2, Download, Image as ImageIcon, FileText, Share2, ToggleLeft, ToggleRight, ScanLine, Eraser, AlertTriangle, Printer, Calculator, Scale, Mail, Send, ExternalLink } from 'lucide-react';
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
        `Type Spoel: ${contributeForm.type || 'Onbekend'} (bv. plastic, karton)\n` +
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
    if (onSetHandlesBackButton) onSetHandlesBackButton(true);

    const handleBack = async () => {
      const listener = await CapacitorApp.addListener('backButton', () => {
        if (showLabelRef.current) {
          if (initialShowLabel) {
            onCancel(); // Close entire modal if opened directly as label
          } else {
            setShowLabel(false); // Go back to form if opened from form
          }
          return;
        }
        if (showUnsavedDialogRef.current) {
           setShowUnsavedDialog(false);
           return;
        }
        if (checkIsDirty()) {
           setShowUnsavedDialog(true);
        } else {
           onCancel();
        }
      });
      return listener;
    };

    const cleanupPromise = handleBack();

    return () => {
      if (onSetHandlesBackButton) onSetHandlesBackButton(false);
      cleanupPromise.then(l => l.remove());
    };
  }, []); 

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
       const brandKey = Object.keys(BRAND_DOMAINS).find(k => k.toLowerCase() === formData.brand?.toLowerCase());
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
      if (!initialData?.shortId) return;

      const url = `filament://${initialData.shortId}`;
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
           await new Promise((resolve) => { qrImg.onload = resolve; });
           
           // Draw QR
           ctx.drawImage(qrImg, 0, 0);

           const logoImg = new Image();
           logoImg.src = APP_LOGO_URI;
           await new Promise((resolve) => { logoImg.onload = resolve; });

           // Center Logo (approx 20% of QR)
           const logoSize = 100; 
           const pos = (500 - logoSize) / 2;

           // White background for logo
           ctx.fillStyle = '#FFFFFF';
           ctx.beginPath();
           // Circle background
           ctx.arc(250, 250, (logoSize / 2) + 5, 0, 2 * Math.PI);
           ctx.fill();

           // Draw Logo
           ctx.drawImage(logoImg, pos, pos, logoSize, logoSize);

           setQrCodeUrl(canvas.toDataURL());
        } else {
           setQrCodeUrl(qrDataUrl);
        }

      } catch(e) {
        console.error(e);
      }
    };

    if (showLabel) {
      generateQr();
    }
  }, [initialData?.shortId, showLabel]);

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
      } catch (error: any) {
        if (error?.message?.includes('User cancelled')) return;
        console.error("Camera error:", error);
        alert(`${t('failed')}:\n${error?.message || JSON.stringify(error)}`);
      }
      return;
    }

    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(t('failed'));
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
    const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);
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
      const fileName = `label-${formData.shortId}.png`;

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
    } catch (e) {
      console.error("Image generation failed", e);
      alert(t('failed'));
    }
  };

  if (showLabel) {
    return (
       <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          {/* Hidden Container for generation */}
          <div 
             ref={labelRef} 
             style={{ 
               position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -100, 
               width: '400px', height: '200px', 
               backgroundColor: 'white', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '10px',
               fontFamily: 'Arial, sans-serif', color: 'black', boxSizing: 'border-box'
             }}
          >
             <div style={{ width: '160px', height: '160px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {qrCodeUrl && ( <img src={qrCodeUrl} alt="QR" style={{ width: '100%', height: '100%' }} /> )}
             </div>
             <div style={{ flex: 1, height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '15px', boxSizing: 'border-box', overflow: 'hidden' }}>
                <div style={{ width: '100%' }}>
                   {logoUrl ? (
                      <img src={logoUrl} alt="Logo" crossOrigin="anonymous" style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain', objectPosition: 'left top', marginBottom: '5px' }} />
                   ) : (
                      <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1', color: 'black', whiteSpace: 'nowrap', overflow: 'hidden' }}>{formData.brand}</div>
                   )}
                   <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>{formData.material}</div>
                   <div style={{ fontSize: '18px', fontWeight: 'normal', color: '#555' }}>{tColor(formData.colorName || '')}</div>
                </div>
                <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'monospace', lineHeight: '1', letterSpacing: '-1px', color: 'black' }}>
                  {formData.shortId}
                </div>
             </div>
          </div>

          <div className="relative bg-slate-900 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl border border-slate-700">
             <button onClick={() => { if (initialShowLabel) onCancel(); else setShowLabel(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
             <div className="flex flex-col items-center">
                <h3 className="text-slate-300 font-medium text-lg mb-1">{formData.brand}</h3>
                <h2 className="text-white font-bold text-xl mb-6">{tColor(formData.colorName || '')} {formData.material}</h2>
                <div className="bg-white rounded-lg p-3 mb-6 shadow-lg shadow-black/20 overflow-hidden transform border-4 border-slate-800 flex items-center justify-center gap-3" style={{ width: '100%', aspectRatio: '2/1' }}>
                     <div className="h-full aspect-square flex-shrink-0 flex items-center justify-center">
                        {qrCodeUrl ? <img src={qrCodeUrl} className="w-full h-full" /> : <Loader2 className="animate-spin text-slate-400" />}
                     </div>
                     <div className="flex flex-col items-start justify-between h-full flex-1 min-w-0 text-left py-2">
                        {logoUrl ? <img src={logoUrl} className="h-8 object-contain object-left mb-1" /> : <span className="font-bold text-2xl text-black leading-none truncate w-full">{formData.brand}</span>}
                        <div>
                            <span className="font-bold text-sm text-gray-800 block leading-tight">{formData.material}</span>
                            <span className="text-xs text-gray-600 block leading-tight">{tColor(formData.colorName || '')}</span>
                        </div>
                        <span className="font-mono font-black text-4xl text-black leading-none mt-auto">{formData.shortId}</span>
                     </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center w-full">
                   <button onClick={handlePrintLabel} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg shadow-lg">
                     <Printer size={20} /> Print
                   </button>
                   <button onClick={() => handleDownloadImage(false)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"><Download size={18} /> {t('save')}</button>
                   {Capacitor.isNativePlatform() && (
                      <button onClick={() => handleDownloadImage(true)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"><Share2 size={18} /> {t('send')}</button>
                   )}
                </div>
             </div>
          </div>
       </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {!initialData && (
          <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-800 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 relative text-center">
            {showCamera ? (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20 overflow-hidden rounded-t-2xl md:rounded-l-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
                    <div className="flex-1 bg-black/60 w-full"></div>
                    <div className="flex w-full h-64 shrink-0">
                        <div className="flex-1 bg-black/60"></div>
                        <div className="w-64 h-64 border-2 border-blue-400 relative bg-transparent flex items-center justify-center">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                            <ScanLine className="text-blue-400/50 w-full animate-pulse" />
                        </div>
                        <div className="flex-1 bg-black/60"></div>
                    </div>
                    <div className="flex-1 bg-black/60 w-full flex items-start justify-center pt-6">
                        <p className="text-white font-medium text-sm drop-shadow-md bg-black/40 px-3 py-1 rounded-full">{t('scanInstruction')}</p>
                    </div>
                </div>
                <button onClick={captureWebImage} className="absolute bottom-8 w-16 h-16 bg-white rounded-full border-4 border-slate-300 shadow-lg z-30 transition-transform active:scale-95"/>
                <button onClick={stopCamera} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full z-30 hover:bg-black/70"><X size={24} /></button>
              </div>
            ) : (
              <>
                <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 relative group">
                  {isScanning ? <Loader2 size={48} className="text-blue-600 dark:text-blue-400 animate-spin" /> : <CameraIcon size={48} className="text-blue-600 dark:text-blue-400" />}
                  {!isScanning && <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-ping" />}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('scanTitle')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">{t('scanDesc')}</p>
                <button onClick={startCamera} disabled={isScanning} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                  {isScanning ? t('processing') : <><CameraIcon size={20} /> {t('startScan')}</>}
                </button>
                <div className="mt-4">
                  <button onClick={handleAutoSettings} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1" title={t('autoSettingsDesc')}><Sparkles size={12} /> {t('autoSettings')}</button>
                </div>
              </>
            )}
          </div>
        )}

        <div className={`p-6 md:p-8 overflow-y-auto ${initialData ? 'w-full' : 'flex-1'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{initialData ? t('formEditTitle') : t('formNewTitle')}</h2>
            <button onClick={attemptClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('brand')}</label>
                {isCustomBrand ? (
                   <div className="flex gap-2">
                      <input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder={t('name')}/>
                      <button type="button" onClick={() => setIsCustomBrand(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><RefreshCw size={18}/></button>
                   </div>
                ) : (
                  <select value={formData.brand} onChange={(e) => { if(e.target.value === 'CUSTOM') setIsCustomBrand(true); else setFormData({...formData, brand: e.target.value}); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                    <option value="">{t('selectBrand')}</option>
                    {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="CUSTOM">{t('otherBrand')}</option>
                  </select>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('material')}</label>
                {isCustomMaterial ? (
                   <div className="flex gap-2">
                      <input type="text" required value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder={t('material')}/>
                      <button type="button" onClick={() => setIsCustomMaterial(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><RefreshCw size={18}/></button>
                   </div>
                ) : (
                  <select value={formData.material} onChange={(e) => { if(e.target.value === 'CUSTOM') setIsCustomMaterial(true); else setFormData({...formData, material: e.target.value}); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                     <option value="">{t('selectMaterial')}</option>
                     {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                     <option value="CUSTOM">{t('otherMaterial')}</option>
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('color')}</label>
              <div className="flex gap-3 items-center">
                 <div className="relative flex-1">
                    {isCustomColor ? (
                       <input type="text" value={formData.colorName} onChange={e => setFormData({...formData, colorName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder={t('colorNamePlaceholder')}/>
                    ) : (
                        <select value={formData.colorName} onChange={handleColorSelect} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                          <option value="">{t('selectColor')}</option>
                          {COMMON_COLORS.map(c => <option key={c.name} value={c.name}>{tColor(c.name)}</option>)}
                          <option value="CUSTOM">{t('otherColor')}</option>
                        </select>
                    )}
                    <div className="absolute left-3 top-2.5 w-5 h-5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: formData.colorHex }}/>
                 </div>
                 <input type="color" value={formData.colorHex} onChange={handleHexChange} className="h-11 w-14 bg-transparent cursor-pointer rounded-lg border-0 p-0"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('weightTotalLabel')}</label>
                <input type="number" value={formData.weightTotal} onChange={e => setFormData({...formData, weightTotal: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('weightRemainingLabel')}</label>
                <div className="flex gap-2">
                   <input type="number" value={formData.weightRemaining} onChange={e => setFormData({...formData, weightRemaining: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"/>
                   <button type="button" onClick={() => setShowWeighHelper(true)} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 rounded-lg flex items-center justify-center transition-colors">
                      <Scale size={20} />
                   </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('tempNozzle')}</label>
                <input type="number" value={formData.tempNozzle} onChange={e => setFormData({...formData, tempNozzle: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('tempBed')}</label>
                <input type="number" value={formData.tempBed} onChange={e => setFormData({...formData, tempBed: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">{t('location')}</label>
                 {isAddingLocation ? (
                    <div className="flex gap-2">
                       <input type="text" value={newLocationName} onChange={e => setNewLocationName(e.target.value)} placeholder={t('newLocationPlaceholder')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white text-xs" autoFocus/>
                       <button type="button" onClick={handleSaveNewLocation} className="text-green-500"><Check size={18}/></button>
                       <button type="button" onClick={() => setIsAddingLocation(false)} className="text-red-500"><X size={18}/></button>
                    </div>
                 ) : (
                    <select value={formData.locationId || ''} onChange={e => { if (e.target.value === 'NEW') setIsAddingLocation(true); else setFormData({ ...formData, locationId: e.target.value }); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                      <option value="">{t('none')}</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      <option value="NEW">{t('newLocationOption')}</option>
                    </select>
                 )}
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">{t('supplier')}</label>
                 {isAddingSupplier ? (
                    <div className="flex gap-2">
                       <input type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder={t('newSupplierPlaceholder')} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 dark:text-white text-xs" autoFocus/>
                       <button type="button" onClick={handleSaveNewSupplier} className="text-green-500"><Check size={18}/></button>
                       <button type="button" onClick={() => setIsAddingSupplier(false)} className="text-red-500"><X size={18}/></button>
                    </div>
                 ) : (
                    <select value={formData.supplierId || ''} onChange={e => { if (e.target.value === 'NEW') setIsAddingSupplier(true); else setFormData({ ...formData, supplierId: e.target.value }); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white appearance-none">
                      <option value="">{t('none')}</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      <option value="NEW">{t('newSupplierOption')}</option>
                    </select>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('price')} (€)</label>
                <div className="relative">
                  <input type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"/>
                  <div className="absolute left-3 top-3 text-slate-400"><Euro size={14} /></div>
                </div>
              </div>
               <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('shopUrl')}</label>
                <div className="relative">
                  <input type="url" value={formData.shopUrl || ''} onChange={e => setFormData({...formData, shopUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" placeholder="https://..."/>
                  <div className="absolute left-3 top-3 text-slate-400"><LinkIcon size={14} /></div>
                  {formData.shopUrl && (
                      <button type="button" onClick={handleOpenShopUrl} className="absolute right-2 top-2 p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-slate-700 rounded transition-colors"><ExternalLink size={16} /></button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-slate-500 uppercase">{t('notes')}</label>
                 {formData.notes && <button type="button" onClick={() => setFormData({...formData, notes: ''})} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"><Eraser size={12} /> {t('clear')}</button>}
              </div>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white h-24 resize-none"/>
            </div>
            
            {!initialData && (
              <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Layers size={14} /> {t('addMultiple')}</label>
                <div className="flex items-center gap-4">
                   <input type="range" min="1" max="10" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="flex-1 accent-blue-600"/>
                   <span className="font-bold text-lg w-8 text-center dark:text-white">{quantity}</span>
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4">
              <Save size={20} /> {initialData ? t('saveChanges') : t('addToInventory')}
            </button>
          </form>
        </div>
      </div>
      
      {showWeighHelper && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 relative">
               <button onClick={() => setShowWeighHelper(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20} /></button>
               <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Calculator size={20} className="text-blue-500" /> {t('weighHelper')}</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('grossWeight')}</label>
                     <div className="relative">
                        <input type="number" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-lg font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" autoFocus/>
                        <span className="absolute right-4 top-4 text-slate-400 text-sm font-medium">gram</span>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('spoolType')}</label>
                     <select value={selectedSpoolType} onChange={(e) => { setSelectedSpoolType(e.target.value); setTareWeight(spoolWeights[e.target.value]); }} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm dark:text-white appearance-none">
                        {Object.keys(spoolWeights).sort().map(key => ( <option key={key} value={key}>{key} (~{spoolWeights[key]}g)</option> ))}
                     </select>
                     <button onClick={() => setShowContribute(true)} className="text-xs text-blue-500 hover:text-blue-600 hover:underline mt-1.5 flex items-center gap-1"><Mail size={12} /> {t('suggestSpool')}</button>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('tareWeight')}</label>
                     <input type="number" value={tareWeight} onChange={(e) => setTareWeight(parseFloat(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white outline-none"/>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex justify-between items-center mt-2">
                     <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{t('result')}:</span>
                     <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{Math.max(0, (typeof grossWeight === 'number' ? grossWeight : 0) - tareWeight)} g</span>
                  </div>
                  <button onClick={handleApplyWeight} disabled={grossWeight === '' || grossWeight <= 0} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50">{t('apply')}</button>
               </div>
            </div>
         </div>
      )}

      {showUnsavedDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={24} /></div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('unsavedTitle')}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('unsavedMsg')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={triggerSubmit} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold">{t('saveAndClose')}</button>
              <button onClick={onCancel} className="w-full py-3.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold">{t('discard')}</button>
              <button onClick={() => setShowUnsavedDialog(false)} className="w-full py-3 text-slate-500 dark:text-slate-400 font-medium">{t('keepEditing')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};