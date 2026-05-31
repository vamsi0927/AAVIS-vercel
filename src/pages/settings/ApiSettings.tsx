import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Eye, EyeOff, CheckCircle2, Sparkles, Shield, ExternalLink, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  isAavisAIConfigured,
  getEmailJSConfig,
  setEmailJSConfig,
  removeEmailJSConfig,
  isEmailJSConfigured,
} from '../../lib/apiConfig';

type ActiveSection = 'emailjs' | null;

export function ApiSettings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  // Aavis AI (read-only)
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
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
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
              <p className="text-sm font-medium text-white mb-1">Security first</p>
              <p className="text-xs text-content-secondary leading-relaxed">
                The AI scanning key is built into the app securely and cannot be viewed or modified.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Aavis AI — Locked & Read-only ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-navy-800 border border-navy-700 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">Aavis AI Models</p>
            <p className="text-xs text-content-secondary mt-0.5 flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Built-in &amp; secured — no changes needed
            </p>
          </div>
          {aiConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-brand-safe flex-shrink-0" />
          ) : (
            <span className="text-xs text-red-400 font-medium bg-red-500/20 px-2 py-0.5 rounded-full flex-shrink-0">Missing .env</span>
          )}
        </motion.div>

        {/* ─── EmailJS Config ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => setActiveSection(activeSection === 'emailjs' ? null : 'emailjs')}
            className="w-full bg-navy-800 border border-navy-700 rounded-2xl p-4 flex items-center gap-4 hover:bg-navy-700/50 transition-colors"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">EmailJS (OTP)</p>
              <p className="text-xs text-content-secondary mt-0.5">
                Sends real OTP emails for login
              </p>
            </div>
            {emailConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-brand-safe flex-shrink-0" />
            ) : (
              <div className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                OPTIONAL
              </div>
            )}
          </button>

          <AnimatePresence>
            {activeSection === 'emailjs' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-3">
                  <p className="text-xs text-content-secondary leading-relaxed">
                    Without EmailJS, OTP works in <span className="text-amber-400 font-medium">demo mode</span> — the code is shown on screen instead of emailed.
                  </p>

                  <input
                    type="text"
                    value={emailServiceId}
                    onChange={(e) => setEmailServiceId(e.target.value)}
                    placeholder="Service ID (e.g., service_xxx)"
                    className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 text-sm text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors"
                  />
                  <input
                    type="text"
                    value={emailTemplateId}
                    onChange={(e) => setEmailTemplateId(e.target.value)}
                    placeholder="Template ID (e.g., template_xxx)"
                    className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 text-sm text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors"
                  />
                  <input
                    type="text"
                    value={emailPublicKey}
                    onChange={(e) => setEmailPublicKey(e.target.value)}
                    placeholder="Public Key (e.g., user_xxx)"
                    className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 text-sm text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEmailJS}
                      className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Save Config
                    </button>
                    {emailConfigured && (
                      <button
                        onClick={handleRemoveEmailJS}
                        className="px-4 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <a
                    href="https://www.emailjs.com/docs/tutorial/overview/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-brand-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    EmailJS setup guide
                  </a>
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
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${aiConfigured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {aiConfigured ? 'Active & Secured' : 'Not configured'}
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
      </div>
    </div>
  );
}
