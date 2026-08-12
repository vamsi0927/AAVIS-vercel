import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sparkles, Shield, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  isAavisAIConfigured,
  getEmailJSConfig,
  setEmailJSConfig,
  removeEmailJSConfig,
} from '../../lib/apiConfig';

type ActiveSection = 'emailjs' | 'ai' | null;

export function ApiSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [aiConfigured] = useState(isAavisAIConfigured());

  // EmailJS
  const [emailServiceId, setEmailServiceId] = useState('');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailPublicKey, setEmailPublicKey] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(false);

  useEffect(() => {
    const existingEmail = getEmailJSConfig();
    if (existingEmail) {
      setEmailServiceId(existingEmail.serviceId);
      setEmailTemplateId(existingEmail.templateId);
      setEmailPublicKey(existingEmail.publicKey);
      setEmailConfigured(true);
    }
  }, []);

  const handleSaveEmailJS = () => {
    if (!emailServiceId.trim() || !emailTemplateId.trim() || !emailPublicKey.trim()) {
      toast.error('Please fill in all EmailJS fields');
      return;
    }
    setEmailJSConfig({
      serviceId: emailServiceId,
      templateId: emailTemplateId,
      publicKey: emailPublicKey,
    });
    setEmailConfigured(true);
    toast.success('EmailJS configuration saved!');
    setActiveSection(null);
  };

  const handleRemoveEmailJS = () => {
    removeEmailJSConfig();
    setEmailServiceId('');
    setEmailTemplateId('');
    setEmailPublicKey('');
    setEmailConfigured(false);
    toast.success('EmailJS configuration removed');
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4">
        <button data-testid='btn-apisettings-1' onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">API Keys</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2 pb-8 space-y-6 no-scrollbar">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brand-primary/20 to-purple-600/20 border border-brand-primary/30 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-brand-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white mb-1">Local AI — Privacy First</p>
              <p className="text-xs text-content-secondary leading-relaxed">
                All AI processing runs locally via Ollama (llama3.2). Your food data never leaves your device.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── AI Engine Status ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <button data-testid='btn-apisettings-ai'
            onClick={() => setActiveSection(activeSection === 'ai' ? null : 'ai')}
            className="w-full bg-navy-800 border border-navy-700 rounded-2xl p-4 flex items-center gap-4 hover:bg-navy-700/50 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">AI Engine</p>
              <p className="text-xs text-content-secondary mt-0.5">Local Ollama (llama3.2)</p>
            </div>
            {aiConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-brand-safe flex-shrink-0" />
            ) : (
              <span className="text-xs text-amber-400 font-medium bg-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">Needs Ollama</span>
            )}
          </button>

          <AnimatePresence>
            {activeSection === 'ai' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  <p className="text-xs text-content-secondary leading-relaxed">
                    Aavis uses a local Ollama server for all AI analysis. No cloud API keys required.
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <p className="text-xs text-amber-400 font-semibold mb-1">Local Setup Required</p>
                    <p className="text-[10px] text-amber-200/70">Make sure Ollama is running on your machine with the <span className="font-mono font-bold">llama3.2</span> model pulled. Run: <span className="font-mono font-bold">ollama pull llama3.2</span></p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Status Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-navy-800/50 rounded-2xl p-4 border border-navy-700/50"
        >
          <h3 className="text-sm font-semibold text-content-secondary mb-3 uppercase tracking-wider">Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-primary flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-content-secondary" /> AI Scanning
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${aiConfigured ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {aiConfigured ? 'Local AI Active' : 'Start Ollama'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-primary">Email OTP</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${emailConfigured ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {emailConfigured ? 'Active' : 'Demo mode'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Hidden EmailJS section for future use */}
        <div className="hidden">
          {emailServiceId && emailTemplateId && emailPublicKey && (
            <button onClick={handleSaveEmailJS} />
          )}
          <button onClick={handleRemoveEmailJS} />
          <input onChange={e => setEmailServiceId(e.target.value)} />
          <input onChange={e => setEmailTemplateId(e.target.value)} />
          <input onChange={e => setEmailPublicKey(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
