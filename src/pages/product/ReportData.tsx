import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { toast } from 'sonner';

export function ReportData() {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = SAMPLE_PRODUCTS.find((p) => p.id === id) || SAMPLE_PRODUCTS[0];

  const [issueType, setIssueType] = useState('ingredients');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please provide a description of the issue');
      return;
    }
    toast.success('Thank you! Your report has been submitted.');
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">Report Incorrect Data</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
        <div className="bg-navy-800 p-4 rounded-xl border border-navy-700 flex items-start gap-4 mb-8">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Help us improve</h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              If you notice any incorrect nutritional info or missing ingredients for <strong>{product.name}</strong>, please let us know.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-content-secondary ml-1">Type of Issue</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="ingredients" className="bg-navy-900 text-white">Incorrect Ingredients</option>
              <option value="nutrition" className="bg-navy-900 text-white">Wrong Nutritional Values</option>
              <option value="allergens" className="bg-navy-900 text-white">Missing Allergens</option>
              <option value="other" className="bg-navy-900 text-white">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-content-secondary ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what is incorrect..."
              className="w-full h-32 bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl py-4 font-bold text-lg shadow-lg transition-colors mt-8"
          >
            Submit Report
          </button>
        </form>
      </div>
    </div>
  );
}
