import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function SuggestProduct() {
  const navigate = useNavigate();
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !brandName) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success('Product submitted for review! Thank you.');
    navigate('/home');
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">Suggest Product</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
        <p className="text-content-secondary mb-8">
          Couldn't find what you're looking for? Add it to our database!
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-content-secondary ml-1">Product Name *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Tomato Ketchup"
              className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-content-secondary ml-1">Brand Name *</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Heinz"
              className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-content-secondary ml-1">Upload Photos (Optional)</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" className="flex flex-col items-center justify-center gap-2 h-32 bg-navy-800 border border-navy-700 border-dashed rounded-xl hover:bg-navy-700 transition-colors text-content-secondary hover:text-white">
                <Camera className="w-8 h-8" />
                <span className="text-sm font-medium">Front Label</span>
              </button>
              <button type="button" className="flex flex-col items-center justify-center gap-2 h-32 bg-navy-800 border border-navy-700 border-dashed rounded-xl hover:bg-navy-700 transition-colors text-content-secondary hover:text-white">
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Ingredients List</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl py-4 font-bold text-lg shadow-lg transition-colors mt-8"
          >
            Submit for Review
          </button>
        </form>
      </div>
    </div>
  );
}
