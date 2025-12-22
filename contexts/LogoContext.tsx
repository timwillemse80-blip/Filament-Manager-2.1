import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface LogoContextType {
  logoUrl: string | null;
  refreshLogo: () => Promise<void>;
  isLoading: boolean;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem('app_custom_logo');
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateFavicon = (url: string) => {
    // Find existing favicon links
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'shortcut icon';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
    
    // Also try to update Apple Touch Icon
    const appleLink: HTMLLinkElement | null = document.querySelector("link[rel*='apple-touch-icon']") || document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = url;
    document.getElementsByTagName('head')[0].appendChild(appleLink);
  };

  const refreshLogo = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('value')
        .eq('key', 'app_logo')
        .single();

      if (data && data.value) {
        setLogoUrl(data.value);
        localStorage.setItem('app_custom_logo', data.value);
        updateFavicon(data.value);
      } else {
        setLogoUrl(null);
        localStorage.removeItem('app_custom_logo');
        // Reset favicon handled by index.html defaults on reload, 
        // or we could force a reset here if strictly needed.
      }
    } catch (e) {
      console.error("Error fetching logo", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshLogo();
  }, []);

  // Sync favicon if logoUrl is present from localStorage immediately
  useEffect(() => {
    if (logoUrl) {
      updateFavicon(logoUrl);
    }
  }, [logoUrl]);

  return (
    <LogoContext.Provider value={{ logoUrl, refreshLogo, isLoading }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
