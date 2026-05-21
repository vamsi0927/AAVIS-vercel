import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function Terms() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg ml-3 text-white">Terms & Conditions</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 relative z-10 text-sm leading-relaxed text-content-secondary">
        <p className="text-xs text-content-secondary font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full inline-block">
          Last updated: May 20, 2026
        </p>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">1. Acceptance of Terms</h3>
          <p>
            By downloading, installing, or using the Aavis application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">2. Medical & Health Disclaimer</h3>
          <div className="bg-brand-caution/5 border border-brand-caution/20 rounded-2xl p-4 text-xs text-brand-caution space-y-2">
            <p className="font-bold uppercase tracking-wide">⚠️ CRITICAL HEALTH DISCLAIMER</p>
            <p>
              Aavis is a tool designed to extract ingredients, display nutritional information, and compute a generalized health score using modern AI analyses. It is NOT medical advice.
            </p>
            <p>
              The content, analysis, and recommendations provided in this app are for informational purposes only. Do not rely on Aavis to diagnose, prevent, or treat any medical condition, allergy, or food intolerance. Always consult a qualified physician or certified healthcare provider before making major dietary changes.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">3. OCR Accuracy and Verification</h3>
          <p>
            While Aavis uses state-of-the-art Optical Character Recognition (OCR) and Gemini AI models, text extraction from camera images is dependent on lighting, print quality, and curvature.
          </p>
          <p>
            Users are required to review the extracted text using our in-app verification layer. Aavis is not liable for errors in AI analysis resulting from inaccurate OCR text or packaging variations.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">4. Data Storage & Privacy</h3>
          <p>
            Aavis prioritizes user privacy. All preferences, dietary options, condition selections, and scan history are stored locally on your device. Local data is subject to deletion if you clear app cache, wipe your browser history, or sign out when Supabase cloud sync is disabled.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">5. User Conduct</h3>
          <p>
            You agree to use Aavis only for lawful purposes. You agree not to upload malicious software, probe for vulnerabilities, or try to disrupt the backend services or API connections utilized by Aavis.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">6. Modifications to Service</h3>
          <p>
            We reserve the right to modify, suspend, or discontinue the application or any part of it at any time, without notice.
          </p>
        </section>

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-content-secondary">
            If you have questions about these terms, contact us at <span className="text-brand-primary font-bold">support@aavis.app</span>
          </p>
        </div>
      </div>
    </div>
  );
}
