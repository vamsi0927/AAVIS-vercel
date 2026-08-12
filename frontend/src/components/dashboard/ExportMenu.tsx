import React, { useState, useRef } from 'react';
import { Download, Image, FileText, Printer, ChevronDown } from 'lucide-react';
import { ChartDataPoint } from '../../hooks/useChartData';

interface Props {
  chartRef: React.RefObject<HTMLDivElement>;
  chartData: ChartDataPoint[];
  dateRangeText: string;
  timeRange: 'week' | 'month';
}

export function ExportMenu({ chartRef, chartData, dateRangeText, timeRange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = () => {
    setIsExporting(true);
    const headers = ['Date', 'Day', 'Average Score', 'Total Scans'];
    const rows = chartData.map(d => [
      d.rawDate.toLocaleDateString(),
      d.day,
      d.score,
      d.scans
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aavis-health-${timeRange}-${dateRangeText.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
    setIsOpen(false);
  };

  const exportPNG = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `aavis-health-${timeRange}-${dateRangeText.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('PNG export failed:', e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>AAVIS Health Report – ${dateRangeText}</title></head>
            <body style="margin:0;background:#0d1117;">
              <img src="${imgData}" style="width:100%;height:auto;" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    setIsExporting(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-content-secondary hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
        aria-label="Export chart"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-navy-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[160px]">
            <button onClick={exportPNG} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors">
              <Image className="w-4 h-4 text-brand-primary" /> Export PNG
            </button>
            <button onClick={exportCSV} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors border-t border-white/5">
              <FileText className="w-4 h-4 text-green-400" /> Export CSV
            </button>
            <button onClick={exportPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors border-t border-white/5">
              <Printer className="w-4 h-4 text-yellow-400" /> Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
