
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Printer, Filament } from '../types';
import { Plus, Edit2, Trash2, Printer as PrinterIcon, X, Save, CircleDashed, ChevronRight, Search, Zap, RefreshCw, Box, Disc, Coins, Hourglass, Crown, Wifi, Activity, Thermometer, Clock, AlertTriangle, WifiOff, HelpCircle, Copy, Check, Key, Smartphone, Wind, Gauge, ArrowUpFromLine, Timer, ExternalLink, BookOpen, Network, Camera, Maximize, Minimize, Video } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

interface PrinterManagerProps {
  printers: Printer[];
  filaments: Filament[];
  onSave: (printer: Printer) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
  onLimitReached?: () => void;
}

// --- Printer Database ---
const PRINTER_PRESETS: Record<string, string[]> = {
  "Bambu Lab": ["X1 Carbon", "X1E", "P1S", "P1P", "A1", "A1 Mini"],
  "Creality": [
    "K1 Max", "K1C", "K1", "K1 SE", 
    "Ender 3 V3", "Ender 3 V3 Plus", "Ender 3 V3 KE", "Ender 3 V3 SE", 
    "Ender 3 S1 Pro", "Ender 3 S1 Plus",
    "CR-10 SE", "CR-M4", "CR-10 Smart Pro", 
    "Halot-Mage Pro", "Halot-Mage S", "Sermoon D3"
  ],
  "Prusa Research": ["MK4S", "MK4", "MK3S+", "XL (5 Toolhead)", "XL (2 Toolhead)", "XL (1 Toolhead)", "Mini+", "SL1S Speed"],
  "Anycubic": [
    "Kobra 3 Combo", "Kobra 2 Pro", "Kobra 2 Max", "Kobra 2 Plus", "Kobra 2 Neo", 
    "Photon Mono M5s", "Photon Mono M5s Pro", "Photon Mono X 6Ks", "Vyper"
  ],
  "Elegoo": [
    "Neptune 4 Max", "Neptune 4 Plus", "Neptune 4 Pro", "Neptune 4", 
    "Neptune 3 Pro", "Neptune 3 Plus", "Neptune 3 Max",
    "Saturn 4 Ultra", "Saturn 3 Ultra", "Mars 5 Ultra", "Mars 4 Max"
  ],
  "Flashforge": ["Adventurer 5M Pro", "Adventurer 5M", "Guider 3", "Guider 3 Ultra", "Creator 4", "Finder 3"],
  "Qidi Tech": ["Q1 Pro", "X-Max 3", "X-Plus 3", "X-Smart 3"],
  "Sovol": ["SV08", "SV07 Plus", "SV07", "SV06 Plus", "SV06", "SV04 (IDEX)"],
  "Voron": ["Voron 2.4", "Voron Trident", "Voron 0.2", "Switchwire"],
  "Klipper (Generic)": ["Custom Build", "Converted Printer"],
  "Formlabs": ["Form 4", "Form 4B", "Form 3+", "Form 3L"],
  "UltiMaker": ["S7", "S5", "S3", "2+ Connect", "Method XL", "Method X"],
  "Phrozen": ["Sonic Mega 8K S", "Sonic Mighty 8K", "Sonic Mini 8K S"],
  "RatRig": ["V-Core 4", "V-Core 3.1", "V-Minion"],
  "Snapmaker": ["J1s", "Artisan", "2.0 A350T"]
};

// --- GUIDES & LINKS ---
const GUIDE_LINKS = [
  { name: "Algemene Klipper/Moonraker Docs", url: "https://moonraker.readthedocs.io/en/latest/configuration/" },
  { name: "Creality Helper Script (Root Guide)", url: "https://guilouz.github.io/Creality-Helper-Script-Wiki/" },
  { name: "Mainsail / Voron Docs", url: "https://docs.mainsail.xyz/" },
  { name: "Qidi Tech Wiki", url: "https://wiki.qidi3d.com/" },
  { name: "Elegoo Neptune (OpenNeptune)", url: "https://github.com/OpenNeptune3D/OpenNept4une" }
];

// --- CONNECTION HELP MODAL ---
const ConnectionHelpModal = ({ onClose }: { onClose: () => void }) => {
    const openLink = (url: string) => {
        if (Capacitor.isNativePlatform()) window.open(url, '_system');
        else window.open(url, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-500"/> Hulp bij verbinden
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Intro */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                            <Activity size={16} className="text-green-500" /> Wat is "Live" verbinden?
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Door je printer te koppelen kan de app live de status (temperatuur, voortgang, tijd) uitlezen. Dit werkt via <strong>Moonraker</strong>, de API die standaard op de meeste Klipper-printers draait.
                        </p>
                    </div>

                    {/* Requirements */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-3">
                        <h4 className="font-bold text-blue-700 dark:text-blue-400 text-xs uppercase flex items-center gap-2">
                            <Check size={14} /> Wat heb je nodig?
                        </h4>
                        <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-disc pl-4">
                            <li>Een printer die op <strong>Klipper</strong> draait (b.v. Voron, Creality K1, Ender 3 V3 KE, Elegoo Neptune 4).</li>
                            <li>Het <strong>IP-adres</strong> van je printer in je thuisnetwerk.</li>
                            <li>Je telefoon/PC moet op <strong>hetzelfde WiFi-netwerk</strong> zitten.</li>
                        </ul>
                    </div>

                    {/* Common Issue: Port */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                            <Network size={16} className="text-orange-500" /> Poort Problemen
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            De API draait vaak op een specifieke poort. Probeer deze achter je IP te zetten als de standaard niet werkt:
                        </p>
                        <ul className="text-xs text-slate-700 dark:text-slate-300 list-disc pl-4 space-y-1">
                            <li><strong>:7125</strong> (Standaard Moonraker / Creality)</li>
                            <li><strong>:4408</strong> (Fluidd installaties)</li>
                        </ul>
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-center mt-2">
                            <code className="text-xs font-mono text-slate-600 dark:text-slate-300">192.168.1.50 <span className="text-green-500 font-bold">:7125</span></code>
                        </div>
                    </div>

                    {/* API Key Helper */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                            <Key size={16} className="text-purple-500" /> Waar vind ik de API Key? (Fluidd)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Gebruik je Fluidd? Dan vind je de sleutel via dit menu:
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-wrap gap-1 items-center">
                                <span>Instellingen (Tandwiel)</span>
                                <ChevronRight size={12} className="text-slate-400" /> 
                                <span>Authentificatie</span>
                                <ChevronRight size={12} className="text-slate-400" /> 
                                <span>API Sleutel</span>
                            </p>
                        </div>
                    </div>

                    {/* Guides Links */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Handleidingen per Merk</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {GUIDE_LINKS.map((guide, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => openLink(guide.url)}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 transition-colors group text-left"
                                >
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{guide.name}</span>
                                    <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500" />
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- MONITOR MODAL (Klipper / Moonraker) ---
const PrinterMonitorModal = ({ printer, onClose }: { printer: Printer, onClose: () => void }) => {
    const [status, setStatus] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [copied, setCopied] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeWebcamUrl, setActiveWebcamUrl] = useState(printer.webcamUrl || '');
    
    const webcamContainerRef = useRef<HTMLDivElement>(null);

    // Detect Mixed Content Issue (HTTPS site trying to access HTTP IP)
    const isWebMixedContent = !Capacitor.isNativePlatform() && 
                              window.location.protocol === 'https:' && 
                              printer.ipAddress?.toLowerCase().startsWith('http:') &&
                              activeWebcamUrl?.toLowerCase().startsWith('http:');

    // Setup fetch URL
    const getBaseUrl = () => {
        let baseUrl = printer.ipAddress || '';
        if (!baseUrl.startsWith('http')) {
           baseUrl = `http://${baseUrl}`;
        }
        return baseUrl.replace(/\/$/, '');
    };

    const fetchWebcams = async () => {
        // Only try to fetch webcam if we don't have one manually set or if current one failed
        if (printer.webcamUrl && !videoError) return;

        const baseUrl = getBaseUrl();
        const url = `${baseUrl}/server/webcams/list`;
        
        try {
            const headers = { 'Content-Type': 'application/json', ...(printer.apiKey ? { 'X-Api-Key': printer.apiKey } : {}) };
            
            let camsData;
            if (Capacitor.isNativePlatform()) {
                const response = await CapacitorHttp.get({ url, headers });
                camsData = response.data;
            } else {
                const response = await fetch(url, { headers });
                camsData = await response.json();
            }

            if (camsData?.result?.webcams?.length > 0) {
                // Determine absolute URL for stream
                let streamPath = camsData.result.webcams[0].stream_url;
                if (streamPath.startsWith('/')) {
                    // It's relative, prepend printer IP
                    setActiveWebcamUrl(`${baseUrl}${streamPath}`);
                } else {
                    setActiveWebcamUrl(streamPath);
                }
                setVideoError(false); // Reset error if we found a new URL
            } else {
                // No webcams found in API, use fallback
                throw new Error("Empty list");
            }
        } catch (e) {
            console.log("Could not auto-fetch webcams, using fallback", e);
            // Fallback: Standard MJPEG stream on port 8080
            const ip = printer.ipAddress?.split(':')[0].replace(/https?:\/\//, '') || '';
            const fallbackUrl = `http://${ip}:8080/?action=stream`;
            if (activeWebcamUrl !== fallbackUrl) {
                setActiveWebcamUrl(fallbackUrl);
                setVideoError(false);
            }
        }
    };

    const fetchData = async () => {
        if (!printer.ipAddress) return;
        
        const baseUrl = getBaseUrl();
        // Extended Query: fan, toolhead (Z pos), gcode_move (speed factor)
        const url = `${baseUrl}/printer/objects/query?heater_bed&extruder&print_stats&display_status&toolhead&fan&gcode_move`;

        // Prepare Headers
        const headers = {
            'Content-Type': 'application/json',
            ...(printer.apiKey ? { 'X-Api-Key': printer.apiKey } : {})
        };

        try {
            let resultData: any;

            if (Capacitor.isNativePlatform()) {
                // Use Native HTTP to bypass CORS/Mixed Content on Android/iOS
                const response = await CapacitorHttp.get({
                    url: url,
                    headers: headers,
                    connectTimeout: 5000,
                    readTimeout: 5000
                });
                
                if (response.status === 401) throw new Error("API Key vereist of onjuist");
                
                // Specific handling for 404 (Not Found) - Common with Creality/Older setups on port 80
                if (response.status === 404 || response.status === 405) {
                    throw new Error(`API niet gevonden op deze poort (${response.status}). Probeer :7125 of :4408 toe te voegen.`);
                }

                if (response.status !== 200) throw new Error(`Printer antwoordde met status ${response.status}`);
                resultData = response.data;
            } else {
                // Standard Web Fetch
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); 
                const response = await fetch(url, { 
                    signal: controller.signal,
                    headers: headers
                });
                clearTimeout(timeoutId);
                
                if (response.status === 401) throw new Error("API Key vereist of onjuist");
                if (response.status === 404) throw new Error("API niet gevonden. Probeer :7125 of :4408 toe te voegen.");
                if (!response.ok) throw new Error("Kan printer niet bereiken");
                resultData = await response.json();
            }

            if (!resultData || !resultData.result || !resultData.result.status) {
                throw new Error("Ongeldig antwoord van Moonraker");
            }

            setStatus(resultData.result.status);
            setError(null);
        } catch (e: any) {
            console.error("Monitor error", e);
            let msg = e.message || "Verbindingsfout";
            
            // Helpful web errors
            if (!Capacitor.isNativePlatform()) {
                if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
                   msg = "Netwerk of CORS Fout (Zie Hulp)";
                } else if (msg.includes('Mixed Content')) {
                   msg = "HTTPS Blokkade (Zie Hulp)";
                }
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchWebcams(); // Try to fetch webcam info on mount
        const interval = setInterval(fetchData, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [printer.ipAddress]);

    // Fullscreen Logic
    const toggleFullscreen = () => {
        if (!webcamContainerRef.current) return;

        if (!document.fullscreenElement) {
            webcamContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const retryWebcam = () => {
        setVideoError(false);
        // Force refresh by clearing and resetting
        const current = activeWebcamUrl;
        setActiveWebcamUrl('');
        setTimeout(() => setActiveWebcamUrl(current), 100);
    };

    useEffect(() => {
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    // Helper to copy CORS config
    const copyCorsConfig = () => {
       const domain = window.location.origin;
       const configText = `[authorization]\ncors_domains:\n    ${domain}\n    *://${window.location.hostname}`;
       navigator.clipboard.writeText(configText);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
    };

    // Derived values
    const extruderTemp = status?.extruder?.temperature || 0;
    const extruderTarget = status?.extruder?.target || 0;
    const bedTemp = status?.heater_bed?.temperature || 0;
    const bedTarget = status?.heater_bed?.target || 0;
    const printState = status?.print_stats?.state || "offline"; // printing, paused, complete, error, standby
    const printProgress = (status?.display_status?.progress || 0) * 100;
    const filename = status?.print_stats?.filename || "";
    
    // New Stats
    const fanSpeed = Math.round((status?.fan?.speed || 0) * 100);
    const zHeight = status?.toolhead?.position?.[2]?.toFixed(2) || "0.00";
    const speedFactor = Math.round((status?.gcode_move?.speed_factor || 1) * 100);
    const printDuration = status?.print_stats?.print_duration || 0;

    // Calculate Time Left
    const formatTime = (sec: number) => {
        if (!sec || !isFinite(sec)) return "--:--";
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return h > 0 ? `${h}u ${m}m` : `${m}m`;
    };
    
    let timeLeftStr = "--:--";
    if (printState === 'printing' && printProgress > 0 && printDuration > 0) {
        // Estimate total time based on current progress
        const totalEst = printDuration / (printProgress / 100);
        const left = totalEst - printDuration;
        timeLeftStr = formatTime(left);
    }

    const getStateColor = (s: string) => {
        if (s === "printing") return "text-green-500";
        if (s === "paused") return "text-orange-500";
        if (s === "error") return "text-red-500";
        return "text-slate-500";
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity size={18} className="text-blue-500"/>
                        {printer.name}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="overflow-y-auto p-6">
                    {/* WEBCAM FEED (If URL Provided or Discovered) */}
                    {(activeWebcamUrl || error) && (
                        <div 
                            ref={webcamContainerRef}
                            className={`mb-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black relative flex items-center justify-center group ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-none' : 'aspect-video'}`}
                        >
                            {!videoError && activeWebcamUrl ? (
                                <img 
                                    src={activeWebcamUrl} 
                                    alt="Printer Feed" 
                                    className={`w-full h-full ${isFullscreen ? 'object-contain' : 'object-cover'}`}
                                    onError={() => setVideoError(true)}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 p-4 text-center">
                                    <WifiOff size={24} className="mb-2 opacity-50" />
                                    <p className="text-xs font-bold mb-1">Geen beeld</p>
                                    
                                    {isWebMixedContent ? (
                                        <p className="text-[10px] text-red-500 mb-2">
                                            Browser blokkeert lokaal HTTP beeld op HTTPS site. Gebruik de App.
                                        </p>
                                    ) : (
                                        <p className="text-[10px] mb-2 opacity-70 break-all px-2">
                                            {activeWebcamUrl || "Geen URL ingesteld"}
                                        </p>
                                    )}
                                    
                                    <button 
                                        onClick={retryWebcam}
                                        className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    >
                                        <RefreshCw size={10} /> Opnieuw
                                    </button>
                                </div>
                            )}
                            
                            {/* Fullscreen Toggle (Only show if no error) */}
                            {!videoError && activeWebcamUrl && (
                                <button 
                                    onClick={toggleFullscreen}
                                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                >
                                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                                </button>
                            )}

                            {/* Live Badge */}
                            {!isFullscreen && !videoError && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse pointer-events-none">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
                                </div>
                            )}
                        </div>
                    )}

                    {isLoading && !status && !error ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-2"></div>
                            <span className="text-sm text-slate-500">Verbinden met {printer.ipAddress}...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-4">
                            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full inline-flex mb-3">
                                <AlertTriangle size={24} className="text-red-500"/>
                            </div>
                            <p className="text-red-600 dark:text-red-400 font-bold mb-1">Verbinding Mislukt</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-4 leading-relaxed">
                                {error}
                            </p>
                            
                            {/* NEW: Smart Hint for 404 Errors */}
                            {error.includes('7125') && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4 text-left">
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1 mb-1">
                                        <Wifi size={14}/> Tip: Gebruik Poort 7125
                                    </p>
                                    <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-tight">
                                        De printer reageert wel, maar de software (Moonraker) zit niet op de standaard poort.
                                        <br/><br/>
                                        Verander je IP in de instellingen naar:<br/>
                                        <strong>{printer.ipAddress?.split(':')[0]}:7125</strong>
                                    </p>
                                </div>
                            )}
                            
                            {isWebMixedContent && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4 text-left">
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1 mb-1">
                                        <Smartphone size={14}/> Beste Oplossing: Gebruik de App
                                    </p>
                                    <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-tight">
                                        De website (HTTPS) mag geen verbinding maken met je lokale printer (HTTP). De Android App kan dit wel.
                                    </p>
                                </div>
                            )}
                            
                            {showHelp ? (
                               <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-left mb-4">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Stap 1: Zoek het juiste bestand</p>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 space-y-1">
                                     <p>1. Ga naar het tabblad <strong>Machine</strong> of <strong>Configuration</strong> in je printer menu.</p>
                                     <p>2. Zoek het bestand <strong>moonraker.conf</strong>.</p>
                                     <p className="italic text-slate-400">(Staat het er niet? Check of 'Verborgen bestanden' aan staat of gebruik de Android App).</p>
                                  </div>

                                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Stap 2: Voeg dit toe (onderaan)</p>
                                  <div className="flex gap-2 mb-3">
                                     <code className="text-[10px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 flex-1 font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre">
                                        [authorization]{'\n'}cors_domains:{'\n'}    {window.location.origin}
                                     </code>
                                     <button onClick={copyCorsConfig} className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center h-full">
                                        {copied ? <Check size={14}/> : <Copy size={14}/>}
                                     </button>
                                  </div>
                                  
                                  <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30 text-[10px] text-red-600 dark:text-red-400 font-bold">
                                     ⚠️ NIET in de Console/Terminal plakken!<br/>
                                     <span className="font-normal text-red-500">Dit is een instelling, geen commando.</span>
                                  </div>
                               </div>
                            ) : (
                               <div className="flex gap-2 justify-center">
                                  <button onClick={() => { setIsLoading(true); fetchData(); }} className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-medium dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Probeer opnieuw</button>
                                  <button onClick={() => setShowHelp(true)} className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-1">
                                     <HelpCircle size={14} /> Hulp
                                  </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Status Header */}
                            <div className="text-center">
                                <span className={`text-sm font-bold uppercase tracking-wider ${getStateColor(printState)}`}>
                                    {printState}
                                </span>
                                {filename && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{filename}</p>}
                            </div>

                            {/* Progress Circle */}
                            {printState === 'printing' && (
                                <div className="flex justify-center">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="60" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-800" />
                                            <circle cx="64" cy="64" r="60" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray="377" strokeDashoffset={377 - (377 * printProgress) / 100} className="transition-all duration-500 ease-out" strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute text-2xl font-bold text-slate-800 dark:text-white">{Math.round(printProgress)}%</span>
                                    </div>
                                </div>
                            )}

                            {/* Temps */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                    <div className="flex justify-center mb-1 text-orange-500"><Thermometer size={20}/></div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">Nozzle</span>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                        {Math.round(extruderTemp)}° <span className="text-xs text-slate-400 font-normal">/ {Math.round(extruderTarget)}°</span>
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                                    <div className="flex justify-center mb-1 text-red-500"><Box size={20}/></div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">Bed</span>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                        {Math.round(bedTemp)}° <span className="text-xs text-slate-400 font-normal">/ {Math.round(bedTarget)}°</span>
                                    </p>
                                </div>
                            </div>

                            {/* Extended Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="text-slate-400"><Wind size={16}/></div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Fan</p>
                                        <p className="text-sm font-bold dark:text-white">{fanSpeed}%</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="text-slate-400"><Gauge size={16}/></div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Speed</p>
                                        <p className="text-sm font-bold dark:text-white">{speedFactor}%</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="text-slate-400"><ArrowUpFromLine size={16}/></div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Z-Hoogte</p>
                                        <p className="text-sm font-bold dark:text-white">{zHeight} mm</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="text-slate-400"><Timer size={16}/></div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Resterend</p>
                                        <p className="text-sm font-bold dark:text-white">{timeLeftStr}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const PrinterManager: React.FC<PrinterManagerProps> = ({ printers, filaments, onSave, onDelete, isAdmin, onLimitReached }) => {
  const { t } = useLanguage();
  const [editingPrinter, setEditingPrinter] = useState<Partial<Printer> | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<{ printerId: string, slotIndex: number } | null>(null);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [monitoringPrinter, setMonitoringPrinter] = useState<Printer | null>(null);
  const [showConnectionHelp, setShowConnectionHelp] = useState(false); // NEW STATE
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPrinter) {
      // Logic for Slots initialization/resizing
      let slots = editingPrinter.amsSlots || [];
      const amsCount = editingPrinter.amsCount || 1;
      
      // Determine required slots: 
      // If AMS -> 4 * amsCount. 
      // If NO AMS -> 1 (The external spool holder)
      const requiredSlots = editingPrinter.hasAMS ? (amsCount * 4) : 1;

      if (slots.length !== requiredSlots) {
          // Resize array: Keep existing, add new empty ones if needed, or slice if reducing
          const newSlots = Array(requiredSlots).fill(null).map((_, i) => {
              if (i < slots.length) return slots[i];
              return { slotNumber: i + 1, filamentId: null };
          });
          slots = newSlots;
      }

      const brand = editingPrinter.brand || 'Onbekend';
      const model = editingPrinter.model || '';
      // If name is empty, auto-generate from Brand + Model
      const finalName = editingPrinter.name?.trim() || `${brand} ${model}`;

      onSave({
        id: editingPrinter.id || crypto.randomUUID(),
        name: finalName,
        brand: brand,
        model: model,
        hasAMS: !!editingPrinter.hasAMS,
        amsCount: amsCount,
        amsSlots: slots,
        powerWatts: editingPrinter.powerWatts,
        purchasePrice: editingPrinter.purchasePrice,
        lifespanHours: editingPrinter.lifespanHours,
        ipAddress: editingPrinter.ipAddress,
        apiKey: editingPrinter.apiKey,
        webcamUrl: editingPrinter.webcamUrl // Save Webcam URL
      });
      setEditingPrinter(null);
      setIsCustomBrand(false);
      setIsCustomModel(false);
    }
  };

  const handleFilamentSelect = (filamentId: string) => {
    if (!selectingSlot) return;
    
    const printer = printers.find(p => p.id === selectingSlot.printerId);
    if (!printer) return;

    // Safety check: ensure slots array is large enough (legacy data fix)
    let newSlots = [...(printer.amsSlots || [])];
    if (selectingSlot.slotIndex >= newSlots.length) {
       // If index out of bounds, expand array
       const requiredLength = selectingSlot.slotIndex + 1;
       const expansion = Array(requiredLength - newSlots.length).fill(null).map((_, i) => ({ 
           slotNumber: newSlots.length + i + 1, 
           filamentId: null 
       }));
       newSlots = [...newSlots, ...expansion];
    }

    newSlots[selectingSlot.slotIndex] = {
       ...newSlots[selectingSlot.slotIndex],
       filamentId: filamentId
    };

    onSave({ ...printer, amsSlots: newSlots });
    setSelectingSlot(null);
  };

  const clearSlot = (printerId: string, slotIndex: number) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    const newSlots = [...(printer.amsSlots || [])];
    if (newSlots[slotIndex]) {
        newSlots[slotIndex] = { ...newSlots[slotIndex], filamentId: null };
        onSave({ ...printer, amsSlots: newSlots });
    }
  };

  const handleAddClick = () => {
     // Check Limit
     if (!isAdmin && printers.length >= 2) {
        if (onLimitReached) onLimitReached();
        return;
     }

     setEditingPrinter({ name: '', brand: '', model: '', hasAMS: true, amsCount: 1, amsSlots: [], powerWatts: 300, purchasePrice: 0, lifespanHours: 20000 });
     setIsCustomBrand(false);
     setIsCustomModel(false);
  };

  // SMART AUTO FILL: Queries Klipper/Moonraker API to find webcams
  const autoFillWebcam = async () => {
      if (!editingPrinter?.ipAddress) {
          alert("Vul eerst een IP adres in.");
          return;
      }
      
      setIsAutoDetecting(true);
      let baseUrl = editingPrinter.ipAddress;
      if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
      baseUrl = baseUrl.replace(/\/$/, '');

      try {
          const url = `${baseUrl}/server/webcams/list`;
          const headers = { 'Content-Type': 'application/json', ...(editingPrinter.apiKey ? { 'X-Api-Key': editingPrinter.apiKey } : {}) };
          
          let resultData;
          if (Capacitor.isNativePlatform()) {
              const response = await CapacitorHttp.get({ url, headers, connectTimeout: 3000 });
              resultData = response.data;
          } else {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);
              const response = await fetch(url, { headers, signal: controller.signal });
              clearTimeout(timeoutId);
              resultData = await response.json();
          }

          if (resultData && resultData.result && resultData.result.webcams && resultData.result.webcams.length > 0) {
              const cam = resultData.result.webcams[0];
              let streamUrl = cam.stream_url;
              
              // Handle relative URLs
              if (streamUrl.startsWith('/')) {
                  streamUrl = `${baseUrl}${streamUrl}`;
              }
              
              setEditingPrinter({...editingPrinter, webcamUrl: streamUrl});
              alert("Webcam gevonden en ingevuld!");
          } else {
              throw new Error("Geen webcams gevonden in API.");
          }

      } catch (e: any) {
          console.error("Auto-detect failed", e);
          
          // Fallback to simple guessing if API fails (old method)
          const ip = editingPrinter.ipAddress.split(':')[0].replace(/https?:\/\//, '');
          let suggestedUrl = `http://${ip}:8080/?action=stream`; 
          if (editingPrinter.ipAddress.includes('4408')) {
              suggestedUrl = `http://${ip}:4408/webcam/?action=stream`;
          }
          
          // Just do it, don't ask, but notify
          setEditingPrinter({...editingPrinter, webcamUrl: suggestedUrl});
          alert("Kon camera niet via API vinden (waarschijnlijk beveiliging). Standaard URL is ingevuld.");
      } finally {
          setIsAutoDetecting(false);
      }
  };

  // Reuse the FilamentPicker logic but simplified for Modal context
  const FilamentSelector = ({ filaments, onSelect, onClose }: { filaments: Filament[], onSelect: (id: string) => void, onClose: () => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { tColor, t } = useLanguage();

    const filtered = useMemo(() => {
      if (!searchTerm) return filaments;
      const lower = searchTerm.toLowerCase();
      return filaments.filter(f => 
        (f.shortId && f.shortId.toLowerCase().includes(lower)) ||
        f.brand.toLowerCase().includes(lower) ||
        f.colorName.toLowerCase().includes(lower) ||
        f.material.toLowerCase().includes(lower)
      );
    }, [filaments, searchTerm]);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
         <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
               <Search className="text-slate-400" size={20} />
               <input 
                 autoFocus
                 type="text" 
                 className="flex-1 bg-transparent outline-none dark:text-white"
                 placeholder={t('searchPlaceholder')}
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
               <button onClick={onClose}><X className="text-slate-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
               {filtered.map(f => (
                  <div 
                     key={f.id} 
                     onClick={() => onSelect(f.id)}
                     className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                     <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm flex-shrink-0" style={{ backgroundColor: f.colorHex }} />
                     <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white truncate">
                           {f.brand} {tColor(f.colorName)}
                        </div>
                        <div className="text-xs text-slate-500">
                           {f.material} • {f.weightRemaining}g
                           {f.shortId && <span className="ml-1 font-mono text-blue-500">#{f.shortId}</span>}
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-slate-300" />
                  </div>
               ))}
               {filtered.length === 0 && <div className="text-center p-4 text-slate-400">{t('none')}</div>}
            </div>
         </div>
      </div>
    );
  };

  const renderSlot = (printer: Printer, slotIndex: number, label?: string) => {
      // Robust accessor: Use existing slot or create temporary visual object if array is too short
      const slots = printer.amsSlots || [];
      const slot = slots[slotIndex] || { slotNumber: slotIndex + 1, filamentId: null };
      
      const loadedFilament = slot.filamentId ? filaments.find(f => f.id === slot.filamentId) : null;

      return (
        <div key={slotIndex} className="flex flex-col gap-1 relative w-full">
           {label && <span className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1 block">{label}</span>}
           <div 
             onClick={() => setSelectingSlot({ printerId: printer.id, slotIndex: slotIndex })}
             className={`
               aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center p-1 cursor-pointer transition-all relative overflow-hidden group shadow-sm w-full
               ${loadedFilament ? 'border-transparent' : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800'}
             `}
             style={loadedFilament ? { backgroundColor: loadedFilament.colorHex } : undefined}
           >
              {loadedFilament ? (
                 <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Actions Overlay */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => { e.stopPropagation(); clearSlot(printer.id, slotIndex); }}>
                       <div className="bg-black/40 hover:bg-red-500 text-white rounded-full p-1 backdrop-blur-sm transition-colors"><X size={10}/></div>
                    </div>

                    <div className="mt-auto relative z-10 text-center w-full pb-1">
                       <span className="text-[10px] font-bold text-white block truncate px-1 shadow-black drop-shadow-md">{loadedFilament.brand}</span>
                       <span className="text-[9px] text-white/90 block shadow-black drop-shadow-md">{loadedFilament.material}</span>
                    </div>
                 </>
              ) : (
                 <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400">
                    <Plus size={20} />
                 </div>
              )}
           </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
         <h3 className="text-xl font-bold dark:text-white text-slate-800 flex items-center gap-2">
            <PrinterIcon size={24} /> {t('printers')}
         </h3>
         <button 
            onClick={handleAddClick} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform active:scale-95"
         >
            <Plus size={20} /> {t('addPrinter')}
         </button>
      </div>

      {/* PRINTER LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {printers.map(printer => (
            <div key={printer.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
               {/* Printer Header */}
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                     <div className="bg-white dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-600">
                        <PrinterIcon size={24} />
                     </div>
                     <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{printer.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{printer.brand} {printer.model}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-1">
                     {/* ADMIN ONLY: Monitor Button */}
                     {isAdmin && (
                        printer.ipAddress ? (
                           <button 
                              onClick={() => setMonitoringPrinter(printer)} 
                              className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                              title="Monitor (Klipper)"
                           >
                              <Activity size={20} />
                           </button>
                        ) : (
                           <button 
                              onClick={() => { setEditingPrinter(printer); setIsCustomBrand(false); setIsCustomModel(false); }}
                              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" 
                              title="Klipper Configureren"
                           >
                              <WifiOff size={20} />
                           </button>
                        )
                     )}
                     <button onClick={() => { setEditingPrinter(printer); setIsCustomBrand(false); setIsCustomModel(false); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><Edit2 size={18}/></button>
                     <button onClick={() => onDelete(printer.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </div>
               </div>

               {/* AMS / Slots Area */}
               <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex-1">
                  {printer.hasAMS ? (
                     <div className="space-y-4">
                        {Array.from({ length: printer.amsCount || 1 }).map((_, unitIndex) => (
                           <div key={unitIndex}>
                              <div className="flex items-center gap-2 mb-2">
                                 <CircleDashed size={14} className="text-slate-400" />
                                 <span className="text-xs font-bold text-slate-500 uppercase">AMS Unit {unitIndex + 1}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                 {[0, 1, 2, 3].map(offset => renderSlot(printer, (unitIndex * 4) + offset, `Slot ${offset + 1}`))}
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <Disc size={14} className="text-slate-400" />
                           <span className="text-xs font-bold text-slate-500 uppercase">{t('activeFilament')}</span>
                        </div>
                        <div className="max-w-[100px]">
                           {renderSlot(printer, 0)}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         ))}
      </div>

      {printers.length === 0 && (
         <div className="text-center py-20 text-slate-400">
            <p>{t('noPrinters')}</p>
            <button onClick={handleAddClick} className="text-blue-500 font-bold mt-2 hover:underline">{t('addFirstPrinter')}</button>
         </div>
      )}

      {/* EDIT MODAL */}
      {editingPrinter && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold dark:text-white text-slate-800">{editingPrinter.id ? 'Printer Bewerken' : t('addPrinter')}</h2>
                  <button onClick={() => setEditingPrinter(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-4">
                  <form id="printerForm" onSubmit={handleSubmit} className="space-y-4">
                     {/* Basic Info */}
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('printerName')}</label>
                        <input 
                           type="text" 
                           value={editingPrinter.name} 
                           onChange={e => setEditingPrinter({...editingPrinter, name: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Mijn Printer"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('brand')}</label>
                           {isCustomBrand ? (
                              <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    value={editingPrinter.brand} 
                                    onChange={e => setEditingPrinter({...editingPrinter, brand: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white text-sm"
                                    placeholder="Merk"
                                 />
                                 <button type="button" onClick={() => setIsCustomBrand(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><RefreshCw size={18}/></button>
                              </div>
                           ) : (
                              <select 
                                 value={editingPrinter.brand || ''} 
                                 onChange={e => { 
                                    if(e.target.value === 'CUSTOM') setIsCustomBrand(true); 
                                    else setEditingPrinter({...editingPrinter, brand: e.target.value, model: ''}); 
                                 }} 
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                              >
                                 <option value="">Kies...</option>
                                 {Object.keys(PRINTER_PRESETS).sort().map(b => <option key={b} value={b}>{b}</option>)}
                                 <option value="CUSTOM">+ Ander merk</option>
                              </select>
                           )}
                        </div>
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('printerModel')}</label>
                           {isCustomModel || isCustomBrand ? (
                              <div className="flex gap-2">
                                 <input 
                                    type="text" 
                                    value={editingPrinter.model} 
                                    onChange={e => setEditingPrinter({...editingPrinter, model: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white text-sm"
                                    placeholder="Model"
                                 />
                                 {!isCustomBrand && <button type="button" onClick={() => setIsCustomModel(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><RefreshCw size={18}/></button>}
                              </div>
                           ) : (
                              <select 
                                 value={editingPrinter.model || ''} 
                                 onChange={e => { if(e.target.value === 'CUSTOM') setIsCustomModel(true); else setEditingPrinter({...editingPrinter, model: e.target.value}); }} 
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                                 disabled={!editingPrinter.brand}
                              >
                                 <option value="">Kies...</option>
                                 {editingPrinter.brand && PRINTER_PRESETS[editingPrinter.brand]?.map(m => <option key={m} value={m}>{m}</option>)}
                                 <option value="CUSTOM">+ Ander model</option>
                              </select>
                           )}
                        </div>
                     </div>

                     {/* PRO COSTS SECTION */}
                     <div className={`bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 relative overflow-hidden ${!isAdmin ? 'opacity-70 grayscale' : ''}`}>
                        {/* Overlay for non-admins */}
                        {!isAdmin && (
                           <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px]">
                              <div className="bg-amber-100 dark:bg-amber-900/50 px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-sm">
                                 <Crown size={12} fill="currentColor"/> PRO Feature
                              </div>
                           </div>
                        )}
                        
                        <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-3 flex items-center gap-1">
                           <Coins size={14} /> {t('printerSpecs')}
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-3">
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block" title={t('printerPower')}>{t('printerPower')}</label>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    disabled={!isAdmin}
                                    value={editingPrinter.powerWatts || ''} 
                                    onChange={e => setEditingPrinter({...editingPrinter, powerWatts: Number(e.target.value)})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-6"
                                    placeholder="300"
                                 />
                                 <Zap size={12} className="absolute left-2 top-2.5 text-slate-400" />
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block" title={t('printerCost')}>{t('printerCost')}</label>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    disabled={!isAdmin}
                                    value={editingPrinter.purchasePrice || ''} 
                                    onChange={e => setEditingPrinter({...editingPrinter, purchasePrice: Number(e.target.value)})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-6"
                                    placeholder="800"
                                 />
                                 <span className="absolute left-2 top-2.5 text-slate-400 text-xs">€</span>
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block" title={t('printerLifespan')}>{t('printerLifespan')}</label>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    disabled={!isAdmin}
                                    value={editingPrinter.lifespanHours || ''} 
                                    onChange={e => setEditingPrinter({...editingPrinter, lifespanHours: Number(e.target.value)})}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-6"
                                    placeholder="20000"
                                 />
                                 <Hourglass size={12} className="absolute left-2 top-2.5 text-slate-400" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* ADMIN ONLY: Klipper IP */}
                     {isAdmin && (
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                           <div className="flex justify-between items-center mb-3">
                               <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                                  <Activity size={14} /> Monitor (Klipper/Moonraker)
                               </h4>
                               <button 
                                  type="button"
                                  onClick={() => setShowConnectionHelp(true)}
                                  className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                               >
                                  <HelpCircle size={12} /> Hulp bij verbinden
                               </button>
                           </div>
                           
                           <div className="space-y-3">
                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Printer URL / IP</label>
                                 <div className="relative">
                                    <input 
                                       type="text" 
                                       value={editingPrinter.ipAddress || ''} 
                                       onChange={e => setEditingPrinter({...editingPrinter, ipAddress: e.target.value})}
                                       className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-8"
                                       placeholder="192.168.1.50 of https://..."
                                    />
                                    <Wifi size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">API Key (Optioneel)</label>
                                 <div className="relative">
                                    <input 
                                       type="password" 
                                       value={editingPrinter.apiKey || ''} 
                                       onChange={e => setEditingPrinter({...editingPrinter, apiKey: e.target.value})}
                                       className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-8"
                                       placeholder="Moonraker API Key"
                                    />
                                    <Key size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                 </div>
                                 <p className="text-[10px] text-slate-400 mt-1">
                                    Alleen nodig als Moonraker is ingesteld om een wachtwoord te eisen (trusted clients uit).
                                 </p>
                              </div>
                              
                              {/* NEW: Webcam Input */}
                              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex justify-between">
                                    <span>Webcam Stream URL (MJPEG)</span>
                                    <button 
                                       type="button" 
                                       onClick={autoFillWebcam} 
                                       className="text-blue-500 hover:text-blue-600 text-[10px] flex items-center gap-1"
                                       disabled={isAutoDetecting}
                                    >
                                       {isAutoDetecting ? <RefreshCw size={10} className="animate-spin"/> : <Search size={10}/>}
                                       Auto-Invullen
                                    </button>
                                 </label>
                                 <div className="relative">
                                    <input 
                                       type="text" 
                                       value={editingPrinter.webcamUrl || ''} 
                                       onChange={e => setEditingPrinter({...editingPrinter, webcamUrl: e.target.value})}
                                       className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm dark:text-white pl-8"
                                       placeholder="http://192.168.1.50:8080/?action=stream"
                                    />
                                    <Camera size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* AMS Config */}
                     <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                           <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('hasAMS')}</label>
                           <input 
                              type="checkbox" 
                              checked={editingPrinter.hasAMS} 
                              onChange={e => setEditingPrinter({...editingPrinter, hasAMS: e.target.checked})} 
                              className="w-6 h-6 accent-blue-600 rounded cursor-pointer"
                           />
                        </div>

                        {editingPrinter.hasAMS && (
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{t('amsUnits')}</label>
                              <div className="flex items-center gap-4">
                                 <input 
                                    type="range" 
                                    min="1" 
                                    max="4" 
                                    value={editingPrinter.amsCount || 1} 
                                    onChange={e => setEditingPrinter({...editingPrinter, amsCount: parseInt(e.target.value)})}
                                    className="flex-1 accent-blue-600"
                                 />
                                 <span className="font-bold text-lg w-8 text-center dark:text-white">{editingPrinter.amsCount || 1}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{(editingPrinter.amsCount || 1) * 4} {t('slots')}</p>
                           </div>
                        )}
                     </div>

                     <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2">
                        <Save size={20}/> {t('saveChanges')}
                     </button>
                  </form>
               </div>
            </div>
         </div>
      )}

      {/* FILAMENT SELECTOR MODAL */}
      {selectingSlot && (
         <FilamentSelector 
            filaments={filaments} 
            onSelect={handleFilamentSelect} 
            onClose={() => setSelectingSlot(null)} 
         />
      )}

      {/* MONITOR MODAL */}
      {monitoringPrinter && (
         <PrinterMonitorModal 
            printer={monitoringPrinter}
            onClose={() => setMonitoringPrinter(null)}
         />
      )}

      {/* CONNECTION HELP MODAL */}
      {showConnectionHelp && (
         <ConnectionHelpModal onClose={() => setShowConnectionHelp(false)} />
      )}

    </div>
  );
};
