import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
export function Contact() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      toast.success("Message sent. We'll get back to you within 24 hours.");
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again.');
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
            <h3 className="text-sm text-content-secondary uppercase tracking-wider font-bold mb-1">Email Us</h3>
            <a href="mailto:aavis.support@gmail.com" className="font-medium hover:text-brand-primary transition-colors hover:underline">aavis.support@gmail.com</a>
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
    </div>);
}