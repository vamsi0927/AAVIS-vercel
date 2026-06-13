import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export function Privacy() {
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
        <h1 className="font-display font-black text-lg ml-3 text-white">Privacy Policy</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 relative z-10 text-sm leading-relaxed text-content-secondary pb-12">
        <p className="text-xs text-content-secondary font-bold uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full inline-block">
          Last updated: June 2026
        </p>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">1. Introduction</h3>
          <p>
            AAVIS values your privacy and is committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, and how it is protected.
          </p>
          <p>
            By using AAVIS, you agree to the practices described in this Privacy Policy.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-white font-display font-black text-base">2. Information We Collect</h3>
          <p>Depending on how you use AAVIS, we may collect:</p>
          
          <h4 className="text-white font-bold text-sm mt-2">Account Information</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Profile preferences</li>
          </ul>

          <h4 className="text-white font-bold text-sm mt-4">User Preferences</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dietary preferences</li>
            <li>Allergies</li>
            <li>Health conditions</li>
            <li>Language settings</li>
          </ul>

          <h4 className="text-white font-bold text-sm mt-4">Scan Data</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Product names</li>
            <li>Ingredient lists</li>
            <li>Nutritional information</li>
            <li>AI analysis results</li>
            <li>Scan history</li>
            <li>Saved products</li>
          </ul>

          <h4 className="text-white font-bold text-sm mt-4">Images</h4>
          <p>
            Images uploaded for OCR analysis may be processed to extract product information and generate nutritional insights.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">3. How We Use Your Information</h3>
          <p>Your information is used to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide ingredient and nutritional analysis.</li>
            <li>Personalize recommendations and health scores.</li>
            <li>Maintain scan history and saved products.</li>
            <li>Synchronize data across devices.</li>
            <li>Improve the quality and reliability of AAVIS.</li>
            <li>Respond to support requests.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">4. Artificial Intelligence Processing</h3>
          <p>
            AAVIS uses artificial intelligence services to analyze ingredients and generate nutritional insights.
          </p>
          <p>
            AI-generated analyses are intended for informational purposes only and may not always be complete or perfectly accurate.
          </p>
          <p>
            Users should independently verify information and consult healthcare professionals when necessary.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">5. Third-Party Services</h3>
          <p>AAVIS relies on trusted third-party providers, including:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supabase (authentication and database services)</li>
            <li>Google Gemini AI (AI analysis)</li>
            <li>Resend (email delivery)</li>
            <li>Vercel (hosting and serverless functions)</li>
          </ul>
          <p>These providers may process limited information necessary to deliver their services.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">6. Data Security</h3>
          <p>AAVIS employs reasonable technical and organizational measures to help protect user information. These measures include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Secure authentication</li>
            <li>Encrypted communication (HTTPS)</li>
            <li>Row Level Security (RLS)</li>
            <li>Restricted API access</li>
          </ul>
          <p>However, no method of electronic transmission or storage can guarantee absolute security.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">7. User Rights</h3>
          <p>Users may:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Update their profile information.</li>
            <li>Delete individual scan records.</li>
            <li>Delete scan history.</li>
            <li>Contact us regarding account-related concerns.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">8. Children's Privacy</h3>
          <p>AAVIS is not intended for children under the age of 13.</p>
          <p>We do not knowingly collect personal information from children under 13 years of age.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">9. Data Retention</h3>
          <p>Information is retained only for as long as necessary to provide the functionality of AAVIS or comply with applicable legal obligations.</p>
          <p>Users may remove certain data through features provided within the application.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">10. Cookies and Local Storage</h3>
          <p>AAVIS may use browser storage or similar technologies to maintain sessions and improve user experience.</p>
          <p>These technologies are used solely to support the application's functionality.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">11. Changes to This Privacy Policy</h3>
          <p>This Privacy Policy may be updated periodically as AAVIS evolves.</p>
          <p>We will make reasonable efforts to communicate significant changes whenever possible.</p>
          <p>Continued use of AAVIS following such updates constitutes acceptance of the revised policy.</p>
        </section>

        <div className="mt-8 p-5 glass-card border border-white/5 rounded-3xl text-center space-y-1">
          <h3 className="text-white font-display font-black text-base">12. Contact Information</h3>
          <p>For questions or concerns regarding this Privacy Policy, please contact:</p>
          <p className="pt-2">
            <a href="mailto:aavis.support@gmail.com" className="text-brand-primary font-bold hover:underline text-base">📧 aavis.support@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}