import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Copy, Download } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
export function ResultShare() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const scan = scans.find((s) => s.id === id);
  const product = scan ?
  SAMPLE_PRODUCTS.find((p) => p.id === scan.productId) :
  null;
  const cardRef = useRef<HTMLDivElement>(null);
  if (!scan || !product) return null;
  const verdictLabel =
  scan.verdict === 'safe' ?
  'Safe to Consume' :
  scan.verdict === 'caution' ?
  'Consume with Caution' :
  'Hazardous';

  const handleShare = async () => {
    const text = `I scanned ${product.name} with Aavis. Verdict: ${verdictLabel}.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aavis Scan Result',
          text
        });
      } catch (e) {
        // user aborted share
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Result copied to clipboard');
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      toast.loading('Generating image...', { id: 'download-toast' });
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#13131e', // match dark theme
        useCORS: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `aavis-scan-${product.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Card downloaded successfully!', { id: 'download-toast' });
    } catch (error) {
      console.error('Failed to download card:', error);
      toast.error('Failed to download card', { id: 'download-toast' });
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
        <h1 className="font-display font-bold text-lg ml-2">Share Result</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col items-center">
        {/* Shareable Card Preview */}
        <motion.div
          ref={cardRef}
          initial={{
            scale: 0.9,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          className="w-full max-w-[320px] aspect-[9/16] bg-gradient-to-br from-navy-800 via-navy-900 to-navy-800 rounded-3xl p-6 border border-navy-600 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />

          <div className="relative h-full flex flex-col">
            <div className="text-center mb-4">
              <p className="text-xs text-content-secondary uppercase tracking-widest font-medium mb-1">
                Aavis Health Scanner
              </p>
              <h2 className="text-xl font-display font-bold">{product.name}</h2>
              <p className="text-xs text-content-secondary">{product.brand}</p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              {scan.verdict === 'safe' && (
                <div className="w-28 h-28 bg-brand-safe/20 rounded-full flex items-center justify-center border border-brand-safe/30 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                  <CheckCircle className="w-14 h-14 text-brand-safe" />
                </div>
              )}
              {scan.verdict === 'caution' && (
                <div className="w-28 h-28 bg-brand-caution/20 rounded-full flex items-center justify-center border border-brand-caution/30 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                  <AlertTriangle className="w-14 h-14 text-brand-caution" />
                </div>
              )}
              {scan.verdict === 'hazardous' && (
                <div className="w-28 h-28 bg-brand-hazardous/20 rounded-full flex items-center justify-center border border-brand-hazardous/30 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                  <XCircle className="w-14 h-14 text-brand-hazardous" />
                </div>
              )}
            </div>

            <div className="text-center">
              <div
                className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-3 ${scan.verdict === 'safe' ? 'bg-brand-safe/20 text-brand-safe' : scan.verdict === 'caution' ? 'bg-brand-caution/20 text-brand-caution' : 'bg-brand-hazardous/20 text-brand-hazardous'}`}>
                
                {verdictLabel}
              </div>
              <div className="text-7xl mb-2">{product.imageEmoji}</div>
              <p className="text-xs text-content-secondary">
                Scanned with Aavis · know your food
              </p>
            </div>
          </div>
        </motion.div>

        <div className="w-full mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2">
              
              <Share2 className="w-5 h-5" />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="w-full bg-navy-800 border border-navy-700 hover:bg-navy-700 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2">
              
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${product.name} — ${verdictLabel} — Aavis`
              );
              toast.success('Copied to clipboard');
            }}
            className="w-full bg-navy-800 border border-navy-700 hover:bg-navy-700 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2">
            
            <Copy className="w-5 h-5" />
            Copy Text
          </button>
        </div>
      </div>
    </div>);

}