import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Loader2, Upload, FileImage, Sparkles, AlertTriangle, Video, VideoOff, CheckCircle2, RotateCcw, Check, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';
import { computeHealthScore } from '../lib/scoring';
import { analyzeMultiStepScan, performOCR, getGeminiErrorMessage } from '../lib/geminiAnalysis';
import { intelligentOcrCorrection } from '../lib/ocrCorrection';
import { isSupabaseConfigured } from '../lib/supabase';
import { getMemeCondition, fetchMemeFromDB, saveScan } from '../lib/supabaseService';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg } from '../lib/cropImage';

type ScanStep = 'ingredients' | 'nutrition_prompt' | 'nutrition_scan' | 'processing';
type PreviewMode = 'none' | 'ingredients' | 'nutrition';

export function Scan() {
  const navigate = useNavigate();
  const { profile, addScan } = useAppContext();
  
  const [scanStep, setScanStep] = useState<ScanStep>('ingredients');
  const [isScanning, setIsScanning] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [ocrPercent, setOcrPercent] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // OCR review/edit state
  const [reviewingText, setReviewingText] = useState<{ type: 'ingredients' | 'nutrition'; text: string } | null>(null);
  
  // Image preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('none');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [imageQualityWarning, setImageQualityWarning] = useState<string | null>(null);

  // Independent scan state storage
  const [ingredientsText, setIngredientsText] = useState<string | null>(null);
  const [nutritionText, setNutritionText] = useState<string | null>(null);
  const [ingredientsImage, setIngredientsImage] = useState<string | null>(null);

  // Cropper state
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);

  const cameraBg = 'bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900';

  // ── Show preview before processing ──
  const showPreview = (file: File, mode: PreviewMode) => {
    const url = URL.createObjectURL(file);
    setPreviewImageUrl(url);
    setPreviewFile(file);
    setPreviewMode(mode);
  };

  // ── Confirm preview and process ──
  const handleCropAndContinue = async () => {
    if (!previewFile || !previewImageUrl || !completedCrop || previewMode === 'none' || !imgRef.current) return;
    setIsScanning(true);
    setOcrProgress('Applying structure & correction...');
    
    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      const scaledCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedFile = await getCroppedImg(previewImageUrl, scaledCrop, 0, previewFile.name);
      const mode = previewMode;
      clearPreview();
      handleOcrStep(croppedFile, mode === 'nutrition' ? 'nutrition_scan' : 'ingredients');
    } catch (e) {
      console.error(e);
      setScanError('Failed to crop. Please try again.');
      setIsScanning(false);
      clearPreview();
    }
  };

  // ── Cancel preview and retake ──
  const cancelPreview = () => {
    clearPreview();
  };

  const clearPreview = () => {
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    setPreviewImageUrl(null);
    setPreviewFile(null);
    setPreviewMode('none');
  };

  // ── Compress image to a tiny base64 thumbnail for history ──
  const generateThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 150; // max width/height
        const ratio = img.width / img.height;
        if (ratio > 1) {
          canvas.width = size;
          canvas.height = size / ratio;
        } else {
          canvas.height = size;
          canvas.width = size * ratio;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.5)); // 50% quality
        } else {
          resolve('');
        }
      };
    });
  };

  // ── Handle OCR for current step ──
  const handleOcrStep = async (file: File, step: ScanStep) => {
    setIsScanning(true);
    setScanError(null);
    setOcrPercent(0);

    try {
      setOcrProgress(step === 'ingredients' ? 'Reading Ingredients...' : 'Reading Nutrition Facts...');
      
      let text = await performOCR(file, (p) => {
        setOcrPercent(Math.round(p * 0.4));
      });

      text = await intelligentOcrCorrection(text, (msg) => {
        setOcrProgress(msg);
        setOcrPercent(prev => Math.min(90, prev + 15));
      });

      if (step === 'ingredients') {
        const thumbnail = await generateThumbnail(file);
        setIngredientsImage(thumbnail);
        setOcrPercent(100);
        setTimeout(() => {
          setIsScanning(false);
          setReviewingText({ type: 'ingredients', text });
        }, 500);
      } else {
        setOcrPercent(100);
        setTimeout(() => {
          setIsScanning(false);
          setReviewingText({ type: 'nutrition', text });
        }, 500);
      }
    } catch (error: any) {
      setScanError('Failed to read text. Please try a clearer photo.');
      setIsScanning(false);
    }
  };

  // ── Final Analysis ──
  const runFinalAnalysis = async (ingText: string, nutText: string | null) => {
    setScanStep('processing');
    setIsScanning(true);
    setOcrPercent(0);
    setOcrProgress('Generating Health Report...');

    try {
      const result = await analyzeMultiStepScan(ingText, nutText, profile, (msg, p) => {
        setOcrProgress(msg);
        setOcrPercent(p);
      });

      const scoreResult = computeHealthScore(result.product, profile);
      
      const memeCondition = getMemeCondition(
        result.product.nutrients,
        result.product.additives,
        scoreResult.score,
        result.product.ingredients
      );

      let memeText: string | null = null;
      if (isSupabaseConfigured()) {
        memeText = await fetchMemeFromDB(memeCondition);
      }

      // Add imageUrl to product if we have an ingredientsImage
      if (ingredientsImage) {
        result.product.imageUrl = ingredientsImage;
      }

      const scanRecord: any = {
        id: `scan_${Date.now()}`,
        date: new Date().toISOString(),
        productId: result.product.id,
        score: scoreResult.score,
        verdict: scoreResult.verdict,
        warnings: scoreResult.warnings,
        product: result.product,
        aiSummary: result.aiSummary,
        memeText: memeText,
        memeCondition: memeCondition,
        dietAdvice: scoreResult.dietAdvice || result.dietAdvice,
        scoreReasons: scoreResult.scoreReasons,
        mainConcerns: scoreResult.mainConcerns || result.mainConcerns,
        personalizedWarnings: scoreResult.personalizedWarnings,
      };

      if (isSupabaseConfigured()) {
        const userId = localStorage.getItem('aavis_user_id');
        if (userId) {
          saveScan(userId, {
            product_name: result.product.name,
            brand: result.product.brand,
            ingredients: result.product.ingredients,
            nutrients: result.product.nutrients,
            additives: result.product.additives,
            allergens_detected: result.product.allergens,
            health_score: scoreResult.score,
            verdict: scoreResult.verdict,
            meme_shown: memeText || undefined,
            diet_advice: scanRecord.dietAdvice,
            ai_summary: result.aiSummary,
            image_url: ingredientsImage || undefined,
          }).catch(console.error);
        }
      }

      setOcrPercent(100);
      addScan(scanRecord);
      setTimeout(() => {
        navigate(`/result/${scanRecord.id}`, { replace: true });
      }, 500);

    } catch (error: any) {
      setScanError(getGeminiErrorMessage(error.message || 'UNKNOWN'));
      setIsScanning(false);
      setScanStep('ingredients');
    }
  };

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const byteString = atob(imageSrc.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const file = new File([ab], 'capture.jpg', { type: 'image/jpeg' });
    
    // Show preview instead of directly processing
    const mode: PreviewMode = scanStep === 'nutrition_scan' ? 'nutrition' : 'ingredients';
    showPreview(file, mode);
  }, [scanStep]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const mode: PreviewMode = (scanStep === 'nutrition_scan' || scanStep === 'nutrition_prompt') ? 'nutrition' : 'ingredients';
      showPreview(file, mode);
    }
    e.target.value = '';
  };

  const skipNutrition = () => {
    if (ingredientsText) runFinalAnalysis(ingredientsText, null);
  };

  const isShowingViewfinder = showCamera && !isScanning && previewMode === 'none';
  const isNutritionScanActive = scanStep === 'nutrition_scan';

  return (
    <div className={`flex flex-col h-full relative overflow-hidden ${cameraBg}`}>
      {/* 1. Header & Progress */}
      <div className="absolute top-safe pt-4 left-0 right-0 px-4 flex flex-col gap-4 z-30">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-black/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xl px-4 py-2 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${scanStep === 'ingredients' ? 'bg-brand-primary animate-pulse' : 'bg-brand-safe'}`} />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider ml-1">
              Step {scanStep === 'ingredients' ? '1: Ingredients' : '2: Nutrition'}
            </span>
          </div>
          
          <div className="w-10 h-10" />
        </div>

        {/* Multi-step indicator dots */}
        <div className="flex justify-center gap-2">
          <div className={`h-1 rounded-full transition-all duration-500 ${scanStep === 'ingredients' ? 'w-8 bg-brand-primary' : 'w-4 bg-brand-safe opacity-50'}`} />
          <div className={`h-1 rounded-full transition-all duration-500 ${scanStep.includes('nutrition') || scanStep === 'processing' ? 'w-8 bg-brand-primary' : 'w-4 bg-white/20'}`} />
        </div>
      </div>

      {/* 2. Scan Area / Viewfinder */}
      <div className="flex-1 relative flex items-center justify-center px-6">
        <div className="relative w-full aspect-square max-w-[320px]">
          
          {/* Futuristic Brackets */}
          <div className={`scanner-corner scanner-corner-tl ${isNutritionScanActive ? 'scanner-corner-active' : ''}`} />
          <div className={`scanner-corner scanner-corner-tr ${isNutritionScanActive ? 'scanner-corner-active' : ''}`} />
          <div className={`scanner-corner scanner-corner-bl ${isNutritionScanActive ? 'scanner-corner-active' : ''}`} />
          <div className={`scanner-corner scanner-corner-br ${isNutritionScanActive ? 'scanner-corner-active' : ''}`} />

          {/* Camera Feed */}
          {showCamera && !isScanning && previewMode === 'none' && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden scanner-overlay">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: { ideal: 'environment' } }}
                onUserMedia={() => setCameraReady(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy-900/40">
                  <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                </div>
              )}
              
              {/* Scan Guidance - Enhanced for nutrition */}
              <div className="absolute bottom-4 left-0 right-0 text-center px-4 z-20">
                {isNutritionScanActive ? (
                  <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-3 mx-4">
                    <p className="text-[11px] font-bold text-brand-primary uppercase tracking-[0.15em] mb-1">
                      📊 Capture Nutrition Facts Table
                    </p>
                    <p className="text-[10px] text-white/60">
                      Align the full nutrition table within the frame
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] font-bold text-white/90 uppercase tracking-[0.2em] animate-pulse-soft">
                    Focus on Ingredients Label
                  </p>
                )}
              </div>

              {/* Nutrition scan framing guide overlay */}
              {isNutritionScanActive && cameraReady && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute inset-[15%] border-2 border-dashed border-brand-primary/30 rounded-xl" />
                  <div className="absolute top-3 left-0 right-0 text-center">
                    <span className="text-[9px] bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                      Nutrition Facts
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scanning Line */}
          {isShowingViewfinder && cameraReady && <div className={`scanner-line ${isNutritionScanActive ? 'scanner-line-nutrition' : ''}`} />}

          {/* Processing Overlay */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-navy-900/80 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl z-40 p-6 text-center"
              >
                <div className="relative mb-6">
                  <Loader2 className="w-14 h-14 animate-spin text-brand-primary" />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                    {ocrPercent}%
                  </div>
                </div>
                <p className="text-white font-bold text-base mb-1">{ocrProgress}</p>
                <p className="text-content-secondary text-[11px]">
                  {scanStep === 'processing' ? 'Processing with Aavis AI...' : 'Extracting text via OCR...'}
                </p>
                
                <div className="w-full h-1 bg-navy-700 rounded-full mt-6 overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-primary"
                    initial={{ width: '0%' }} animate={{ width: `${ocrPercent}%` }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>



          {/* Error Message */}
          <AnimatePresence>
            {scanError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-navy-900/90 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl z-50 p-6 text-center"
              >
                <AlertTriangle className="w-12 h-12 text-brand-hazardous mb-3" />
                <p className="text-white text-sm font-medium mb-4">{scanError}</p>
                <button 
                  onClick={() => { setScanError(null); setScanStep('ingredients'); }}
                  className="bg-brand-primary text-white px-6 py-2 rounded-xl text-xs font-bold"
                >
                  Restart Scan
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* IMAGE PREVIEW OVERLAY */}
      <AnimatePresence>
        {previewMode !== 'none' && previewImageUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-navy-900 flex flex-col"
          >
            {/* Preview Header */}
            <div className="pt-safe pt-4 px-4 pb-3 flex items-center justify-between">
              <button onClick={cancelPreview} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {previewMode === 'ingredients' ? '📋 Ingredients Preview' : '📊 Nutrition Preview'}
                </span>
              </div>
              <div className="w-10 h-10" />
            </div>

            {/* Preview Image / Cropper */}
            <div className="flex-1 relative w-full h-full flex flex-col items-center justify-center bg-black mt-2 mb-4 px-4">
              <div className="w-full max-h-[65vh] flex items-center justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  className="max-w-full max-h-[65vh]"
                >
                  <img 
                    ref={imgRef}
                    src={previewImageUrl} 
                    className="max-w-full max-h-[65vh] object-contain" 
                    alt="Crop Preview" 
                  />
                </ReactCrop>
              </div>
              <p className="text-center text-white/70 text-xs mt-4">
                Drag the corners to adjust the crop area.
              </p>
            </div>

            {/* Preview Actions */}
            <div className="pb-safe pb-8 px-6 flex gap-3">
              <button
                onClick={cancelPreview}
                className="flex-1 bg-navy-800 text-white py-4 rounded-2xl font-bold text-sm border border-navy-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={handleCropAndContinue}
                className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4" /> Crop & Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEXT REVIEW OVERLAY */}
      <AnimatePresence>
        {reviewingText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[70] bg-navy-900 flex flex-col p-6 justify-center"
          >
            <div className="max-w-sm mx-auto w-full flex flex-col h-full justify-between py-8">
              <div className="text-center mt-6">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-primary/20">
                  <Sparkles className="w-6 h-6 text-brand-primary animate-pulse" />
                </div>
                <h2 className="text-2xl font-display font-black text-white mb-2">
                  Verify Scanned Text
                </h2>
                <p className="text-xs text-content-secondary leading-relaxed px-4">
                  {reviewingText.type === 'ingredients'
                    ? "Verify extracted ingredients. Edit any misread words to make the health report 100% accurate."
                    : "Verify extracted nutrition values. Ensure numbers match the product label."}
                </p>
              </div>

              <div className="flex-1 my-6 glass-card rounded-2xl p-4 border border-white/5 shadow-inner relative flex flex-col">
                <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider mb-2 block">
                  {reviewingText.type === 'ingredients' ? '📋 Extracted Ingredients' : '📊 Extracted Nutrition'}
                </span>
                <textarea
                  value={reviewingText.text}
                  onChange={(e) => setReviewingText({ ...reviewingText, text: e.target.value })}
                  className="flex-1 w-full bg-transparent text-sm text-white placeholder:text-content-secondary focus:outline-none resize-none leading-relaxed"
                  placeholder="Extracted text will appear here..."
                />
              </div>

              <div className="flex gap-3 text-center">
                <button
                  onClick={() => setReviewingText(null)}
                  className="flex-1 py-3.5 bg-white/5 border border-white/5 text-content-secondary hover:text-white rounded-2xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const confirmedText = reviewingText.text;
                    const type = reviewingText.type;
                    setReviewingText(null);
                    if (type === 'ingredients') {
                      setIngredientsText(confirmedText);
                      setScanStep('nutrition_prompt');
                      toast.success('Ingredients verified!', { icon: '📋' });
                    } else {
                      setNutritionText(confirmedText);
                      runFinalAnalysis(ingredientsText!, confirmedText);
                    }
                  }}
                  className="flex-1 py-3.5 bg-gradient-brand text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-primary/25 transition-all"
                >
                  Confirm & Next
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating success banner for nutrition_prompt */}
      <AnimatePresence>
        {scanStep === 'nutrition_prompt' && !isScanning && previewMode === 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-[110px] left-4 right-4 z-40"
          >
            <div className="bg-brand-safe/15 backdrop-blur-xl border border-brand-safe/30 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-safe/20 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-brand-safe" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Ingredients Captured ✅</p>
                <p className="text-[10px] text-white/60">Now scan the nutrition label for better accuracy</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Bottom Controls — Camera-app style */}
      <div className="pb-safe pb-6 px-6 flex flex-col items-center gap-4 z-30">
        
        {/* Nutrition Prompt Buttons — below scanner */}
        {scanStep === 'nutrition_prompt' && !isScanning && previewMode === 'none' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2.5 w-full"
          >
            <button 
              onClick={() => setScanStep('nutrition_scan')}
              className="w-full bg-brand-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              <Camera className="w-4 h-4" /> Scan Nutrition Label
            </button>
            <div className="flex gap-2.5">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-navy-800 text-white/90 py-3 rounded-2xl font-bold text-sm border border-navy-700 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              >
                <Upload className="w-4 h-4 text-brand-primary" /> Upload
              </button>
              <button 
                onClick={skipNutrition}
                className="flex-1 bg-white/5 text-white/50 py-3 rounded-2xl font-bold text-sm border border-white/5 active:scale-[0.97] transition-transform"
              >
                Skip & Analyze
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Shutter Button — large, bottom-center, thumb-friendly */}
        {isShowingViewfinder && cameraReady && scanStep !== 'nutrition_prompt' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center w-full"
          >
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleCapture}
              className="shutter-button w-[72px] h-[72px] rounded-full border-[4px] border-white/30 p-[3px] relative"
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.25)]">
                <Camera className="w-7 h-7 text-navy-900" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-[-6px] rounded-full border-2 border-white/10 animate-ping" style={{ animationDuration: '2s' }} />
            </motion.button>
          </motion.div>
        )}

        {/* Secondary Actions Row */}
        {!isScanning && scanStep !== 'nutrition_prompt' && previewMode === 'none' && (
          <div className="flex items-center justify-center gap-6 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-navy-800/60 border border-navy-700/50 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-content-secondary" />
              </div>
              <span className="text-[9px] font-bold text-content-secondary uppercase tracking-wider">Upload</span>
            </button>

            <button
              onClick={() => setShowCamera(!showCamera)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${showCamera ? 'bg-brand-primary/10 border-brand-primary/30' : 'bg-navy-800/60 border-navy-700/50'}`}>
                {showCamera ? <Video className="w-5 h-5 text-brand-primary" /> : <VideoOff className="w-5 h-5 text-content-secondary" />}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${showCamera ? 'text-brand-primary' : 'text-content-secondary'}`}>Camera</span>
            </button>

            <button
              onClick={() => navigate('/scan/manual')}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-navy-800/60 border border-navy-700/50 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-primary" />
              </div>
              <span className="text-[9px] font-bold text-content-secondary uppercase tracking-wider">Type</span>
            </button>
          </div>
        )}

        {/* Demo Products */}
        {!isScanning && scanStep === 'ingredients' && previewMode === 'none' && (
          <button 
            onClick={() => setShowSamples(!showSamples)}
            className="flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase tracking-widest hover:text-white/60 transition-colors"
          >
            <FileImage className="w-4 h-4" />
            {showSamples ? 'Hide Demos' : 'Try Demo Products'}
          </button>
        )}

        <AnimatePresence>
          {showSamples && !isScanning && scanStep === 'ingredients' && previewMode === 'none' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex gap-3 overflow-x-auto no-scrollbar w-full px-2"
            >
              {SAMPLE_PRODUCTS.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setIngredientsText(p.ingredients.join(', '));
                    runFinalAnalysis(p.ingredients.join(', '), null);
                  }}
                  className="flex-shrink-0 bg-navy-800 border border-navy-700 rounded-xl p-3 flex flex-col items-center gap-2 w-20"
                >
                  <span className="text-xl">{p.imageEmoji}</span>
                  <span className="text-[9px] text-center font-bold text-white/60 line-clamp-1">{p.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
    </div>
  );
}