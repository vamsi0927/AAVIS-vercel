import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Keyboard, ScanLine } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { computeHealthScore } from '../../lib/scoring';
export function ScanBarcode() {
  const navigate = useNavigate();
  const { profile, addScan } = useAppContext();
  const [isScanning, setIsScanning] = useState(false);
  const handleCapture = () => {
    setIsScanning(true);
    setTimeout(() => {
      const product =
      SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
      const result = computeHealthScore(product, profile);
      const scan = {
        id: `scan_${Date.now()}`,
        date: new Date().toISOString(),
        ...result
      };
      addScan(scan);
      navigate(`/result/${scan.id}`, {
        replace: true
      });
    }, 1500);
  };
  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      <div className="absolute top-safe pt-4 left-0 right-0 px-4 flex justify-between items-center z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          
          <X className="w-6 h-6" />
        </button>
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-white">Barcode Scan</span>
        </div>
        <button
          onClick={() => navigate('/scan/manual')}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          
          <Keyboard className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-72 h-32">
          <div className="absolute inset-0 border-2 border-brand-primary rounded-2xl" />
          <motion.div
            className="absolute left-4 right-4 h-0.5 bg-brand-primary shadow-[0_0_15px_rgba(99,102,241,1)]"
            animate={{
              top: ['10%', '90%', '10%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }} />
          
          {isScanning &&
          <div className="absolute inset-0 bg-navy-900/80 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-medium animate-pulse">
                Reading barcode...
              </span>
            </div>
          }
        </div>
      </div>

      <p className="text-center text-content-secondary text-sm pb-4 px-6">
        Align the barcode within the frame
      </p>

      <div className="pb-safe pb-8 px-6 flex justify-center">
        <button
          onClick={handleCapture}
          disabled={isScanning}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-2xl font-semibold flex items-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50">
          
          <ScanLine className="w-5 h-5" />
          Simulate Scan
        </button>
      </div>
    </div>);

}