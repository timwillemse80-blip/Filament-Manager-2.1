import React, { useState } from 'react';
import { Logo } from './Logo';
import { Package, ScanLine, FileCode, QrCode, Sparkles, ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface WelcomeScreenProps {
  onComplete: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Package size={48} className="text-blue-500" />,
      title: "Welcome to Filament Manager",
      desc: "The all-in-one solution to keep your 3D printer inventory and projects organized."
    },
    {
      icon: <ScanLine size={48} className="text-purple-500" />,
      title: "AI & Scanner",
      desc: "Scan labels with your camera. Our AI automatically identifies the brand, material, and colors for you."
    },
    {
      icon: <FileCode size={48} className="text-emerald-500" />,
      title: "G-code Analysis",
      desc: "Upload your G-code files to automatically log consumption and calculate print costs."
    },
    {
      icon: <QrCode size={48} className="text-orange-500" />,
      title: "Smart Labels",
      desc: "Generate and print QR codes for your spools. Scan them later to update inventory instantly."
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        
        {/* Header/Logo */}
        <div className="mb-12">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200 dark:border-slate-800">
            <Logo className="w-12 h-12" />
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
        </div>

        {/* Feature Display */}
        <div key={step} className="animate-fade-in space-y-6 min-h-[280px] flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner">
            {currentStep.icon}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
              {currentStep.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {currentStep.desc}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="w-full mt-12 space-y-4">
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 transition-all rounded-full ${i === step ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
              />
            ))}
          </div>

          <button 
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            {step < steps.length - 1 ? (
              <>Next <ChevronRight size={20} /></>
            ) : (
              <>Get Started <Check size={20} /></>
            )}
          </button>

          {step < steps.length - 1 && (
            <button 
              onClick={onComplete}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
            >
              Skip
            </button>
          )}
        </div>

        {/* Floating Sparkles Decor */}
        <div className="absolute top-1/4 left-10 text-yellow-400/20 animate-pulse">
          <Sparkles size={40} />
        </div>
        <div className="absolute bottom-1/4 right-10 text-blue-400/20 animate-pulse" style={{ animationDelay: '1s' }}>
          <Sparkles size={30} />
        </div>
      </div>
    </div>
  );
};