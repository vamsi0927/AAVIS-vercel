import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';
const LANGUAGES = [
{
  code: 'en' as const,
  name: 'English',
  native: 'English'
},
{
  code: 'hi' as const,
  name: 'Hindi',
  native: 'हिन्दी'
}];

export function LanguageSettings() {
  const navigate = useNavigate();
  const { language, setLanguage } = useAppContext();
  const handleSelect = (code: 'en' | 'hi') => {
    setLanguage(code);
    toast.success(
      `Language set to ${LANGUAGES.find((l) => l.code === code)?.name}`
    );
  };
  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white">
          
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">Language</h1>
      </header>

      <div className="flex-1 p-6 space-y-3">
        <p className="text-sm text-content-secondary mb-2">
          Choose your preferred language
        </p>
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isSelected ? 'bg-brand-primary/10 border-brand-primary' : 'bg-navy-800 border-navy-700 hover:bg-navy-700'}`}>
              
              <div className="text-left">
                <div className="font-semibold">{lang.name}</div>
                <div className="text-sm text-content-secondary">
                  {lang.native}
                </div>
              </div>
              {isSelected &&
              <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              }
            </button>);

        })}
      </div>
    </div>);

}