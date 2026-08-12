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
        <button data-testid='btn-privacy-1'
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
        <p>Welcome to Aavis! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (the "Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">1. Information We Collect</h3>
          <p>We collect information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products, or otherwise contact us.</p>
          <h4 className="text-white font-bold text-sm mt-4">A. Personal Information</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Data:</strong> When you create an account, we collect your email address and authentication credentials managed via our database provider (Supabase).</li>
            <li><strong>Health and Dietary Profile:</strong> To provide personalized nutrition advice, you may voluntarily provide your name, dietary preferences (e.g., Vegetarian, Vegan), specific allergies, and health conditions (e.g., Diabetes, Gout).</li>
          </ul>
          <h4 className="text-white font-bold text-sm mt-4">B. Usage and Application Data</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Scanned Products:</strong> We collect data regarding the food products you scan, including barcodes, product names, and nutritional information, to build your scan history and health insights.</li>
            <li><strong>Images:</strong> Images used for food label scanning may be temporarily processed and stored in cloud storage to support OCR, analysis, and scan history features. Users may remove scan history and associated images through the application.</li>
            <li><strong>Chat History:</strong> Conversations you have with the "Aavis AI" nutritionist feature are collected to provide contextual responses.</li>
          </ul>
          <h4 className="text-white font-bold text-sm mt-4">C. Device Data</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>We may collect device information such as your mobile device ID, model, manufacturer, and operating system version (via Capacitor) to ensure the app functions correctly across platforms.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">2. How We Use Your Information</h3>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account.</li>
            <li>Analyze food labels against your specific dietary restrictions and medical conditions to generate personalized health verdicts (Safe, Caution, Hazardous).</li>
            <li>Compile your scanning history, calculate health streaks, and generate weekly dietary reports.</li>
            <li>Communicate with you regarding updates, security alerts, and support messages.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">3. Third-Party Data Processing</h3>
          <p>To provide our core features, we share necessary data with trusted third-party service providers in accordance with their respective privacy policies and standard data processing agreements:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase:</strong> We use Supabase for secure backend infrastructure, database management, user authentication, and image storage. Your profile data and scan history are stored here.</li>
            <li><strong>Google (Gemini API):</strong> We utilize the Gemini AI model to analyze complex ingredient lists, extract text from your photos via OCR, and power the AI Nutritionist. When you scan a product or chat, the text/images are transmitted to Google's API solely for processing the analysis.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">4. Data Security</h3>
          <p>We implement reasonable administrative and technical safeguards designed to protect your information. Data in transit and at rest is protected using industry-standard encryption protocols provided by our infrastructure partners. Local data on your mobile device is stored using native platform preferences provided by the underlying platform. However, please be aware that no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">5. Data Retention</h3>
          <p>We retain your information for as long as your account remains active or as necessary to provide the Service and comply with applicable legal obligations.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Scan Images:</strong> Uploaded images of labels may be retained in cloud storage to support scan history and related features.</li>
            <li>You can delete specific items from your scan history directly within the app, which removes them from our servers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">6. International Data Transfers</h3>
          <p>Your information may be processed and stored using cloud infrastructure operated by third-party providers located in different jurisdictions. By using the Service, you acknowledge that such processing may occur in accordance with applicable laws and the privacy practices of those providers.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">7. Your Privacy Rights</h3>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request the correction of inaccurate personal data.</li>
            <li>Request the deletion of your personal data (Right to be Forgotten).</li>
            <li>Opt-out of certain data processing.</li>
          </ul>
          <p>You may request the deletion of your account and associated personal data at any time by using the account deletion feature available within the application or by contacting our support team. Subject to legal and technical limitations, we will take reasonable steps to remove the requested information from our systems.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">8. Third-Party Links</h3>
          <p>The Service may contain links to third-party websites, products, or services. We are not responsible for the privacy practices or content of third-party services and encourage users to review their respective privacy policies.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">9. Medical Disclaimer</h3>
          <p>Aavis is intended for informational and educational purposes only. Health scores, AI-generated nutritional insights, allergen warnings, and recommendations provided by the Service do not constitute professional medical advice, diagnosis, or treatment. Users should consult qualified healthcare professionals regarding dietary restrictions, allergies, or medical conditions.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">10. AI and OCR Limitations</h3>
          <p>Aavis uses artificial intelligence and optical character recognition (OCR) technologies to analyze food labels and provide nutritional insights. These technologies may occasionally generate inaccurate, incomplete, or incorrect results. Users should exercise independent judgment and should not rely solely on AI-generated outputs when making health-related decisions. Users should independently verify ingredient lists and allergen information, especially when dealing with severe allergies or medical conditions.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">11. Accuracy of Information</h3>
          <p>While we strive to provide accurate nutritional analysis and educational insights, Aavis does not guarantee the completeness, reliability, or accuracy of AI-generated responses, OCR results, health scores, or recommendations.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">12. Children's Privacy</h3>
          <p>The Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13 years of age. If we become aware that such information has been collected, we will take reasonable steps to delete it.</p>
        </section>

        <section className="space-y-2">
          <h3 className="text-white font-display font-black text-base">13. Changes to This Privacy Policy</h3>
          <p>We may update this Privacy Policy from time to time. Changes will be reflected by updating the "Last Updated" date above. Continued use of the Service after such changes become effective constitutes acceptance of the revised Privacy Policy.</p>
        </section>

        <div className="mt-8 p-5 glass-card border border-white/5 rounded-3xl text-center space-y-1">
          <h3 className="text-white font-display font-black text-base">14. Contact Information</h3>
          <p>For questions or concerns regarding this Privacy Policy, please contact:</p>
          <p className="pt-2">
            <a href="mailto:aavis.support@gmail.com" className="text-brand-primary font-bold hover:underline text-base">📧 aavis.support@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}