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

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 relative z-10 text-sm leading-relaxed text-content-secondary pb-safe">
        <p className="text-xs text-content-secondary font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full inline-block">
          Last Updated: June 2026
        </p>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">1. Acceptance of Terms</h3>
          <p>By accessing or using AAVIS, you agree to these Terms and Conditions. If you do not agree with any part of these terms, please discontinue use of the application.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">2. Purpose of AAVIS</h3>
          <p>AAVIS is an AI-powered food label analysis platform designed to help users understand ingredients, nutritional values, additives, allergens, and general health information.</p>
          <p>AAVIS is intended for informational and educational purposes only.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">3. Medical Disclaimer</h3>
          <div className="bg-brand-hazardous/5 border border-brand-hazardous/20 rounded-2xl p-4 text-xs text-brand-hazardous space-y-2">
            <p className="font-bold uppercase tracking-wide">⚠️ Important Health Disclaimer</p>
            <p>AAVIS does not provide medical advice, diagnosis, or treatment.</p>
            <p>Health scores, AI analyses, dietary recommendations, and ingredient interpretations are generated using artificial intelligence and should not be considered a substitute for professional medical advice.</p>
            <p>Always consult a qualified physician, dietitian, or healthcare professional before making significant dietary decisions or if you have allergies, medical conditions, or food sensitivities.</p>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">4. OCR Accuracy</h3>
          <p>AAVIS uses Optical Character Recognition (OCR) and artificial intelligence to extract and analyze information from product labels.</p>
          <p>Results may vary depending on:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Image quality</li>
            <li>Lighting conditions</li>
            <li>Packaging curvature</li>
            <li>Label language</li>
            <li>Manufacturer variations</li>
          </ul>
          <p>Users are responsible for reviewing extracted information before relying on the analysis.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">5. AI Analysis Limitations</h3>
          <p>AI-generated health scores, ingredient assessments, and recommendations are estimates based on available information and may not always be complete or perfectly accurate.</p>
          <p>AAVIS does not guarantee:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Accuracy of OCR extraction</li>
            <li>Accuracy of AI analysis</li>
            <li>Completeness of nutritional information</li>
            <li>Availability of every ingredient or additive</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">6. User Accounts</h3>
          <p>Users are responsible for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Maintaining the confidentiality of their accounts.</li>
            <li>Providing accurate information.</li>
            <li>Protecting their passwords and login credentials.</li>
          </ul>
          <p>Users are responsible for all activity performed through their accounts.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">7. Cloud Storage and Synchronization</h3>
          <p>When cloud synchronization is enabled, certain information may be stored securely using third-party infrastructure.</p>
          <p>This may include:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Profile information</li>
            <li>Scan history</li>
            <li>Saved products</li>
            <li>Preferences</li>
          </ul>
          <p>AAVIS takes reasonable measures to protect user data but cannot guarantee uninterrupted service or absolute security.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">8. User Conduct</h3>
          <p>Users agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Upload malicious content.</li>
            <li>Abuse APIs or backend services.</li>
            <li>Attempt unauthorized access.</li>
            <li>Circumvent security mechanisms.</li>
            <li>Reverse engineer or disrupt the platform.</li>
            <li>Use AAVIS for unlawful purposes.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">9. Intellectual Property</h3>
          <p>The AAVIS name, logo, design, and software are the property of AAVIS and may not be copied, reproduced, or redistributed without permission.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">10. Third-Party Services</h3>
          <p>AAVIS relies on external services including:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Google Gemini AI</li>
            <li>Supabase</li>
            <li>Resend</li>
            <li>Vercel</li>
          </ul>
          <p>Availability and performance may depend on these services. AAVIS is not responsible for interruptions caused by third-party providers.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">11. Limitation of Liability</h3>
          <p>To the maximum extent permitted by law, AAVIS and its developers shall not be liable for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Health-related decisions made using the application.</li>
            <li>Allergic reactions or dietary consequences.</li>
            <li>OCR inaccuracies.</li>
            <li>AI-generated errors.</li>
            <li>Data loss.</li>
            <li>Service interruptions.</li>
          </ul>
          <p>Users assume responsibility for how they interpret and use information provided by AAVIS.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">12. Availability of Service</h3>
          <p>AAVIS reserves the right to modify, update, suspend, or discontinue certain features or services as the application evolves. We will make reasonable efforts to inform users of significant changes whenever possible.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">13. Privacy</h3>
          <p>AAVIS values user privacy and strives to protect user information.</p>
          <p>By using the application, you agree to the collection and processing of data necessary for providing the application's functionality.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">14. Changes to These Terms</h3>
          <p>These Terms and Conditions may be updated periodically.</p>
          <p>Continued use of AAVIS after changes are published constitutes acceptance of the revised terms.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">15. Contact Information</h3>
          <p>For questions or support regarding these Terms and Conditions, please contact: <a href="mailto:aavis.support@gmail.com" className="text-brand-primary font-bold hover:underline">aavis.support@gmail.com</a></p>
        </section>

      </div>
    </div>
  );
}
