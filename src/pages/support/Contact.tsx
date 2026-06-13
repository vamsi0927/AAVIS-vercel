import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

export function Contact() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'General Inquiry',
    'Account Issues',
    'Email Verification',
    'Password Reset',
    'Bug Report',
    'Feature Request',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error('All fields are required.');
      return;
    }

    if (message.trim().length > 2000) {
      toast.error('Message cannot exceed 2000 characters.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, category, message }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message. Please try again later.');
      }
      
      toast.success("Message sent successfully. We'll get back to you within 24 hours.");
      setName('');
      setEmail('');
      setSubject('');
      setCategory('General Inquiry');
      setMessage('');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to send message. Please try again later.';
      toast.error(errorMsg);
      
      // Fallback: If backend fails (e.g. Resend free tier restrictions), open local mail client
      setTimeout(() => {
        window.location.href = `mailto:aavis.support@gmail.com?subject=${encodeURIComponent(`[AAVIS Support] ${category} - ${subject}`)}&body=${encodeURIComponent("Category: " + category + "\nName: " + name + "\nEmail: " + email + "\n\nMessage:\n" + message)}`;
      }, 1500);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">Contact Us</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm text-content-secondary uppercase tracking-wider font-bold mb-1">Need Help?</h3>
            <a href="mailto:aavis.support@gmail.com" className="font-medium hover:text-brand-primary transition-colors hover:underline">📧 aavis.support@gmail.com</a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary" />
          
          <input
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary" />
          
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 pr-12 text-white focus:outline-none focus:border-brand-primary appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-navy-800 text-white">
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-content-secondary pointer-events-none" />
          </div>

          <input
            type="text"
            required
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary" />
          
          <textarea
            required
            rows={6}
            maxLength={2000}
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary resize-none" />
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 transition-all">
            
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}