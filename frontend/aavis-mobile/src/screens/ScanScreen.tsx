import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Alert, 
  Dimensions,
  Animated
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Sparkles, 
  RotateCcw, 
  Check, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';
import { getApiUrl } from '../lib/apiConfig';
import { analyzeMultiStepScan, isValidFoodLabelText } from '../lib/aiAnalysis';

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_SIZE = 280;

// Note: All AI prompting is handled server-side in the hybrid pipeline.
// ScanScreen sends only raw OCR label text to /api/analyze.


export default function ScanScreen({ navigation }: any) {
  const { theme, profile, addScan } = useAppContext();
  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  const [scanStep, setScanStep] = useState<'ingredients' | 'nutrition_scan' | 'processing'>('ingredients');
  const [previewMode, setPreviewMode] = useState<'none' | 'ingredients' | 'nutrition'>('none');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Crop layout states (pixel coords relative to image container)
  const [cropBox, setCropBox] = useState({ left: 30, top: 50, width: 220, height: 260 });
  const [imageLayout, setImageLayout] = useState({ width: 1, height: 1 });
  const [originalImageDims, setOriginalImageDims] = useState({ width: 1, height: 1 });
  const [isDragging, setIsDragging] = useState<'none' | 'tl' | 'tr' | 'bl' | 'br' | 'center'>('none');
  const dragStart = useRef({ x: 0, y: 0 });
  const cropStart = useRef({ left: 0, top: 0, width: 0, height: 0 });

  // OCR state
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [ocrPercent, setOcrPercent] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  // Extracted texts
  const [reviewingText, setReviewingText] = useState<{ type: 'ingredients' | 'nutrition'; text: string } | null>(null);
  const [ingredientsText, setIngredientsText] = useState<string | null>(null);
  const [nutritionText, setNutritionText] = useState<string | null>(null);

  // Viewfinder camera states
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  // Scan line animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Fit image helper inside container
  const fitImage = (origW: number, origH: number, maxW: number, maxH: number) => {
    const ratio = Math.min(maxW / origW, maxH / origH);
    return {
      width: origW * ratio,
      height: origH * ratio,
    };
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
      setScanStep('ingredients');
      setPreviewMode('none');
      setPreviewImageUrl(null);
      setReviewingText(null);
      setIngredientsText(null);
      setNutritionText(null);
      setLoading(false);
    });
    return unsubscribe;
  }, [navigation]);

  const setPreviewImageDetails = (uri: string, origW: number, origH: number, mode: 'ingredients' | 'nutrition') => {
    setOriginalImageDims({ width: origW, height: origH });
    const maxW = SCREEN_WIDTH - 40;
    const maxH = SCREEN_HEIGHT * 0.55;
    const fit = fitImage(origW, origH, maxW, maxH);
    setImageLayout(fit);
    // Default crop box to 80% of container size
    setCropBox({
      left: fit.width * 0.1,
      top: fit.height * 0.1,
      width: fit.width * 0.8,
      height: fit.height * 0.8,
    });
    setPreviewImageUrl(uri);
    setPreviewMode(mode);
  };

  useEffect(() => {
    if (scanStep === 'nutrition_scan' && !loading && previewMode === 'none' && !reviewingText) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [scanStep, loading, previewMode, reviewingText]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity 
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }



  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', `AAVIS needs gallery access to scan photos.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0].uri) return;

      const mode = scanStep === 'nutrition_scan' ? 'nutrition' : 'ingredients';
      const asset = result.assets[0];
      setPreviewImageDetails(asset.uri, asset.width, asset.height, mode);
    } catch (e) {
      Alert.alert('Error', 'Failed to acquire image');
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });
      if (photo && photo.uri) {
        const mode = scanStep === 'nutrition_scan' ? 'nutrition' : 'ingredients';
        setPreviewImageDetails(photo.uri, photo.width, photo.height, mode);
      }
    } catch (e: any) {
      Alert.alert('Capture Failed', e.message || 'Could not capture photo.');
    }
  };

  const runOCR = async (base64Image: string, mode: 'ingredients' | 'nutrition'): Promise<string> => {
    try {
      const response = await fetch(getApiUrl('/api/ocr'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mode })
      });

      if (response && response.ok) {
        const data = await response.json();
        if (data.text) return data.text.trim();
      }
      throw new Error('Response not okay from OCR backend');
    } catch (e) {
      console.warn('[OCR] Network OCR fetch failed:', e);
      throw new Error('Aavis AI Server is offline or OCR failed.');
    }
  };

  const handleCropAndContinue = async () => {
    if (!previewImageUrl || previewMode === 'none') return;
    
    setLoading(true);
    setOcrPercent(0);
    setOcrProgress(previewMode === 'ingredients' ? 'Reading Ingredients...' : 'Reading Nutrition Facts...');
    
    const progressInterval = setInterval(() => {
      setOcrPercent((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 300);

    try {
      const scaleX = originalImageDims.width / imageLayout.width;
      const scaleY = originalImageDims.height / imageLayout.height;

      const originX = Math.max(0, Math.round(cropBox.left * scaleX));
      const originY = Math.max(0, Math.round(cropBox.top * scaleY));
      const width = Math.min(originalImageDims.width - originX, Math.round(cropBox.width * scaleX));
      const height = Math.min(originalImageDims.height - originY, Math.round(cropBox.height * scaleY));

      const cropResult = await manipulateAsync(
        previewImageUrl,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.85, format: SaveFormat.JPEG, base64: true }
      );

      clearInterval(progressInterval);
      setOcrPercent(90);

      if (!cropResult.base64) {
        throw new Error('Failed to generate base64 data for OCR.');
      }

      const extractedText = await runOCR(cropResult.base64, previewMode);
      
      const validation = isValidFoodLabelText(
        extractedText, 
        previewMode === 'general' ? 'general' : (previewMode === 'nutrition' ? 'nutrition' : 'ingredients')
      );
      if (!validation.valid) {
        throw new Error(validation.reason);
      }
      
      setOcrPercent(100);
      setTimeout(() => {
        setLoading(false);
        setPreviewImageUrl(null);
        setPreviewMode('none');
        setReviewingText({ type: previewMode, text: extractedText });
      }, 300);

    } catch (e: any) {
      console.warn('[ScanScreen] OCR failed, opening manual text entry window:', e);
      clearInterval(progressInterval);
      setLoading(false);
      setPreviewImageUrl(null);
      setPreviewMode('none');
      setReviewingText({ type: previewMode, text: '' });
    }
  };

  const runAnalysisBackend = async (promptText: string, defaultName: string, ingText: string, nutText: string | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let analysisJson: any = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout limit

        const analysisRes = await fetch(getApiUrl('/api/analyze'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: promptText }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (analysisRes.ok) {
          analysisJson = await analysisRes.json();
        }
      } catch (err) {
        console.log('[ScanScreen] Backend fetch failed or timed out, falling back to local analysis engine');
      }

      if (!analysisJson) {
        const aiResult = await analyzeMultiStepScan(ingText || promptText, nutText, profile);
        analysisJson = {
          productName: aiResult.product.name,
          brand: aiResult.product.brand,
          productType: aiResult.product.productType,
          servingSize: aiResult.product.servingSize,
          ingredients: aiResult.product.ingredients,
          nutrients: aiResult.product.nutrients,
          additives: aiResult.product.additives,
          additiveDetails: aiResult.product.dynamicAdditives,
          ingredientDetails: aiResult.product.dynamicIngredients,
          dimensions: aiResult.aiDimensions,
          finalScore: aiResult.finalScore,
          overallAssessment: aiResult.overallAssessment,
          allergens: aiResult.product.allergens,
          mainConcerns: aiResult.mainConcerns,
          majorBenefits: aiResult.majorBenefits,
          dietAdvice: aiResult.dietAdvice,
          aiSummary: aiResult.aiSummary,
          product: aiResult.product,
          score: aiResult.finalScore,
          verdict: aiResult.finalScore !== undefined ? (aiResult.finalScore < 40 ? 'hazardous' : aiResult.finalScore < 70 ? 'caution' : 'safe') : 'caution',
        };
      }

      const skippedNutrition = promptText.includes('Nutrition scan not performed') || promptText.includes('Nutrition scan was skipped') || promptText.includes('(Nutrition scan not performed)');
      if (skippedNutrition) {
        if (!analysisJson.nutrients) analysisJson.nutrients = {};
        analysisJson.nutrients._skipped = true;
        if (analysisJson.product?.nutrients) {
          analysisJson.product.nutrients._skipped = true;
        }
      }

      let finalScanId = `scan_${Date.now()}`;
      let created_at = new Date().toISOString();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data: savedRow, error } = await supabase.from('scans').insert({
            user_id: user.id,
            product_name: analysisJson.productName || analysisJson.product_name || defaultName,
            brand: analysisJson.brand || '',
            ingredients: analysisJson.ingredients || [],
            nutrients: analysisJson.nutrients || {},
            additives: analysisJson.additives || [],
            allergens_detected: analysisJson.allergens || [],
            health_score: analysisJson.finalScore !== undefined ? analysisJson.finalScore : (analysisJson.health_score || 50),
            verdict: analysisJson.verdict || 'caution',
            diet_advice: analysisJson.dietAdvice || '',
            ai_summary: analysisJson.aiSummary || '',
            analysis_results: analysisJson,
            gemini_analysis: analysisJson
          }).select().single();

          if (!error && savedRow) {
            finalScanId = savedRow.id;
            created_at = savedRow.created_at;
          }
        } catch (err) {
          console.log('Supabase scan insert error:', err);
        }
      }

      const scanRecord = {
        id: finalScanId,
        productId: finalScanId,
        date: created_at,
        score: analysisJson.finalScore !== undefined ? analysisJson.finalScore : 50,
        verdict: analysisJson.verdict || 'caution',
        warnings: analysisJson.warnings || [],
        product: {
          id: finalScanId,
          name: analysisJson.productName || defaultName,
          brand: analysisJson.brand || '',
          imageEmoji: '🤖',
          ingredients: analysisJson.ingredients || [],
          productType: analysisJson.productType,
          servingSize: analysisJson.servingSize,
          rawNutrients: analysisJson.rawNutrients || analysisJson.nutrients || {},
          nutrients: analysisJson.nutrients || {},
          additives: analysisJson.additives || [],
          dynamicAdditives: analysisJson.additiveDetails || {},
          dynamicIngredients: analysisJson.ingredientDetails || {},
          allergens: analysisJson.allergens || [],
        },
        aiSummary: analysisJson.aiSummary || '',
        dietAdvice: analysisJson.dietAdvice || '',
        scoreReasons: analysisJson.scoreReasons || [],
        mainConcerns: analysisJson.mainConcerns || [],
        personalizedWarnings: analysisJson.personalizedWarnings || [],
        aiDimensions: analysisJson.dimensions || {},
        overallAssessment: analysisJson.overallAssessment || '',
        majorBenefits: analysisJson.majorBenefits || []
      };

      addScan(scanRecord);
      setLoading(false);
      navigation.navigate('Result', { data: scanRecord });
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Analysis Error', e.message || 'Failed to run analysis. Check your connection.');
    }
  };

  const startFinalAnalysis = async (ingText: string, nutText: string | null) => {
    setLoading(true);
    setOcrProgress('Generating Health Report...');
    setOcrPercent(25);
    
    const progressInterval = setInterval(() => {
      setOcrPercent((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 400);

    try {
      // Send raw OCR text to the new hybrid server pipeline.
      // The server handles all prompting, extraction, validation, and scoring.
      const profileCtx = `User Profile: Age: ${profile?.age || '--'}, Diet: ${profile?.diet || 'None'}, Allergies: ${(profile?.allergens || []).join(', ')}, Conditions: ${(profile?.conditions || []).join(', ')}`;
      const combinedText = `${profileCtx}\n\nINGREDIENTS SCAN TEXT:\n${ingText}\n\n` + (nutText ? `NUTRITION FACTS SCAN TEXT:\n${nutText}\n\n` : '(Nutrition scan not performed)\n');
      
      clearInterval(progressInterval);
      setOcrPercent(95);
      
      await runAnalysisBackend(combinedText, 'Scanned Product', ingText, nutText);
    } catch (e: any) {
      clearInterval(progressInterval);
      setLoading(false);
      Alert.alert('Analysis Error', e.message);
    }
  };

  const onTouchStart = (dir: 'tl' | 'tr' | 'bl' | 'br' | 'center', e: any) => {
    setIsDragging(dir);
    dragStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    cropStart.current = { ...cropBox };
  };

  const onTouchMove = (e: any) => {
    if (isDragging === 'none') return;
    const dx = e.nativeEvent.pageX - dragStart.current.x;
    const dy = e.nativeEvent.pageY - dragStart.current.y;
    
    const minSize = 60;
    const containerW = imageLayout.width;
    const containerH = imageLayout.height;
    const c = cropStart.current;

    let left = c.left;
    let top = c.top;
    let width = c.width;
    let height = c.height;

    if (isDragging === 'center') {
      left = Math.max(0, Math.min(containerW - c.width, c.left + dx));
      top = Math.max(0, Math.min(containerH - c.height, c.top + dy));
    } else if (isDragging === 'tl') {
      left = Math.max(0, Math.min(c.left + c.width - minSize, c.left + dx));
      top = Math.max(0, Math.min(c.top + c.height - minSize, c.top + dy));
      width = c.width - (left - c.left);
      height = c.height - (top - c.top);
    } else if (isDragging === 'tr') {
      top = Math.max(0, Math.min(c.top + c.height - minSize, c.top + dy));
      width = Math.max(minSize, Math.min(containerW - c.left, c.width + dx));
      height = c.height - (top - c.top);
    } else if (isDragging === 'bl') {
      left = Math.max(0, Math.min(c.left + c.width - minSize, c.left + dx));
      width = c.width - (left - c.left);
      height = Math.max(minSize, Math.min(containerH - c.top, c.height + dy));
    } else if (isDragging === 'br') {
      width = Math.max(minSize, Math.min(containerW - c.left, c.width + dx));
      height = Math.max(minSize, Math.min(containerH - c.top, c.height + dy));
    }

    setCropBox({ left, top, width, height });
  };

  const onTouchEnd = () => {
    setIsDragging('none');
  };

  // Render OCR loader / progress overlay
  if (loading) {
    const radius = 45;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * ocrPercent) / 100;
    
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingTopSection}>
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBackButtonDisabled}>
              <ArrowLeft color={colors.textSecondary} size={24} />
            </TouchableOpacity>
            
            <View style={styles.stepBadge}>
              <View style={[styles.stepBadgeDot, { backgroundColor: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary }]} />
              <Text style={[styles.stepBadgeText, { color: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary }]}>
                {scanStep === 'nutrition_scan' ? 'STEP 2: NUTRITION' : 'STEP 1: INGREDIENTS'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.stepProgressContainer}>
            <View style={[styles.stepProgressLine, { backgroundColor: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary, width: 32 }]} />
            <View style={[styles.stepProgressLine, { backgroundColor: scanStep === 'nutrition_scan' ? colors.brandPrimary : colors.borderActive, width: scanStep === 'nutrition_scan' ? 32 : 16, opacity: scanStep === 'nutrition_scan' ? 1 : 0.4 }]} />
          </View>
        </View>

        {/* Viewfinder card centered in screen */}
        <View style={styles.loadingCardWrapper}>
          <View style={styles.loadingWrapper}>
            <View style={styles.loadingCardContainer}>
              <View style={styles.circularLoaderWrapper}>
                <Svg width={110} height={110} viewBox="0 0 110 110">
                  <Circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <Circle
                    cx="55"
                    cy="55"
                    r={radius}
                    stroke={scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 55 55)"
                  />
                  <SvgText
                    x="55"
                    y="61"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="bold"
                    fill={colors.textPrimary}
                  >
                    {`${ocrPercent}%`}
                  </SvgText>
                </Svg>

                <Text style={styles.ocrProgressTitle}>{ocrProgress}</Text>

                {/* Horizontal progress bar */}
                <View style={styles.progressBarTrack}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${ocrPercent}%`, 
                        backgroundColor: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Corner brackets placed outside the rounded card to prevent clipping */}
            <View style={[styles.scannerCorner, styles.cornerTL, { borderColor: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary }]} />
            <View style={[styles.scannerCorner, styles.cornerTR, { borderColor: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary }]} />
            <View style={[styles.scannerCorner, styles.cornerBL, { borderColor: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary }]} />
            <View style={[styles.scannerCorner, styles.cornerBR, { borderColor: scanStep === 'nutrition_scan' ? colors.brandSafe : colors.brandPrimary }]} />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    );
  }

  // Render crop preview overlay
  if (previewMode !== 'none' && previewImageUrl) {
    return (
      <View style={styles.cropOverlay}>
        <View style={styles.cropHeader}>
          <TouchableOpacity 
            onPress={() => {
              setPreviewImageUrl(null);
              setPreviewMode('none');
            }} 
            style={styles.cropCloseBtn}
          >
            <X color={colors.textPrimary} size={22} />
          </TouchableOpacity>
          
          <View style={styles.cropBadge}>
            <Text style={styles.cropBadgeText}>
              {previewMode === 'ingredients' ? '📋 INGREDIENTS PREVIEW' : '📊 NUTRITION PREVIEW'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.cropContainer}>
          <View 
            style={[styles.cropImageFrame, { width: imageLayout.width, height: imageLayout.height }]}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <Image 
              source={{ uri: previewImageUrl }} 
              style={[styles.cropImage, { width: imageLayout.width, height: imageLayout.height }]} 
              resizeMode="contain"
            />

            {/* Crop Boundary Bounding Box */}
            <View 
              style={[
                styles.cropBoxBorder, 
                { 
                  left: cropBox.left, 
                  top: cropBox.top, 
                  width: cropBox.width, 
                  height: cropBox.height 
                }
              ]}
              onTouchStart={(e) => onTouchStart('center', e)}
            />

            {/* Handles */}
            <View 
              style={[styles.cropCornerHandle, { left: cropBox.left - 10, top: cropBox.top - 10 }]}
              onTouchStart={(e) => onTouchStart('tl', e)}
            >
              <View style={styles.cropHandleDot} />
            </View>

            <View 
              style={[styles.cropCornerHandle, { left: cropBox.left + cropBox.width - 10, top: cropBox.top - 10 }]}
              onTouchStart={(e) => onTouchStart('tr', e)}
            >
              <View style={styles.cropHandleDot} />
            </View>

            <View 
              style={[styles.cropCornerHandle, { left: cropBox.left - 10, top: cropBox.top + cropBox.height - 10 }]}
              onTouchStart={(e) => onTouchStart('bl', e)}
            >
              <View style={styles.cropHandleDot} />
            </View>

            <View 
              style={[styles.cropCornerHandle, { left: cropBox.left + cropBox.width - 10, top: cropBox.top + cropBox.height - 10 }]}
              onTouchStart={(e) => onTouchStart('br', e)}
            >
              <View style={styles.cropHandleDot} />
            </View>
          </View>
          <Text style={styles.cropInstruction}>Drag handles to adjust crop area</Text>
        </View>

        <View style={styles.cropButtonsRow}>
          <TouchableOpacity 
            onPress={() => {
              setPreviewImageUrl(null);
              setPreviewMode('none');
            }} 
            style={styles.cropRetakeBtn}
          >
            <RotateCcw color={colors.textPrimary} size={18} style={{ marginRight: 8 }} />
            <Text style={styles.cropRetakeBtnText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleCropAndContinue} 
            style={[styles.cropContinueBtn, { backgroundColor: colors.brandPrimary }]}
          >
            <Check color="#ffffff" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.cropContinueBtnText}>Crop & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render text editing / verification overlay
  if (reviewingText) {
    return (
      <View style={styles.reviewOverlay}>
        <View style={styles.reviewHeader}>
          <View style={styles.sparkleCircle}>
            <Sparkles color={colors.brandPrimary} size={28} />
          </View>
          <Text style={styles.reviewTitle}>Verify Scanned Text</Text>
          <Text style={styles.reviewSubtitle}>
            {reviewingText.type === 'ingredients'
              ? "Verify extracted ingredients. Edit any misread words to make the health report 100% accurate."
              : "Verify extracted nutrition values. Ensure numbers match the product label."}
          </Text>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewCardHeader}>
            <Text style={styles.reviewCardHeaderLabel}>
              {reviewingText.type === 'ingredients' ? '📋 EXTRACTED INGREDIENTS' : '📊 EXTRACTED NUTRITION'}
            </Text>
          </View>
          <TextInput
            multiline
            value={reviewingText.text}
            onChangeText={(txt) => setReviewingText({ ...reviewingText, text: txt })}
            style={styles.reviewTextInput}
            textAlignVertical="top"
            placeholder="Extracted label content will appear here..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.reviewButtonsRow}>
          <TouchableOpacity 
            onPress={() => {
              setReviewingText(null);
              setPreviewImageUrl(null);
              setPreviewMode('none');
            }} 
            style={styles.reviewCancelBtn}
          >
            <Text style={styles.reviewCancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              const confirmedText = reviewingText.text;
              const type = reviewingText.type;
              setReviewingText(null);
              if (type === 'ingredients') {
                setIngredientsText(confirmedText);
                setScanStep('nutrition_scan');
              } else {
                setNutritionText(confirmedText);
                startFinalAnalysis(ingredientsText!, confirmedText);
              }
            }} 
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={[colors.brandPrimary, colors.brandSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.reviewConfirmBtnGradient}
            >
              <Text style={styles.reviewConfirmBtnText}>Confirm & Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Viewfinder camera scanner interface
  const isNutritionStep = scanStep === 'nutrition_scan';
  const activeColor = isNutritionStep ? colors.brandSafe : colors.brandPrimary;
  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, VIEWFINDER_SIZE - 4],
  });

  return (
    <View style={styles.container}>
      {/* 1. Header Navigation & Badge */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <ArrowLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.stepBadge}>
          <View style={[styles.stepBadgeDot, { backgroundColor: activeColor }]} />
          <Text style={[styles.stepBadgeText, { color: activeColor }]}>
            {isNutritionStep ? 'STEP 2: NUTRITION' : 'STEP 1: INGREDIENTS'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepProgressContainer}>
        <View style={[styles.stepProgressLine, { backgroundColor: activeColor, width: 32 }]} />
        <View style={[styles.stepProgressLine, { backgroundColor: isNutritionStep ? colors.brandPrimary : colors.borderActive, width: isNutritionStep ? 32 : 16, opacity: isNutritionStep ? 1 : 0.4 }]} />
      </View>

      {/* Floating ingredients success banner for nutrition step */}
      {isNutritionStep && (
        <View style={styles.successBanner}>
          <View style={styles.successBannerIconCircle}>
            <CheckCircle2 color={colors.brandSafe} size={18} />
          </View>
          <View style={styles.successBannerTextContent}>
            <Text style={styles.successBannerTitle}>Ingredients Captured ✅</Text>
            <Text style={styles.successBannerSubtitle}>Now scan the nutrition label for better accuracy</Text>
          </View>
        </View>
      )}

      {/* 2. Camera Viewfinder Frame */}
      <View style={styles.cameraFrameWrapper}>
        <View style={styles.viewfinderWrapper}>
          <View style={styles.viewfinderContainer}>
            <CameraView 
              style={StyleSheet.absoluteFillObject}
              facing="back"
              ref={cameraRef}
              onCameraReady={() => setCameraReady(true)}
            />
          </View>
          
          {/* Brackets moved outside the overflow:hidden viewfinderContainer */}
          <View style={[styles.scannerCorner, styles.cornerTL, { borderColor: activeColor }]} />
          <View style={[styles.scannerCorner, styles.cornerTR, { borderColor: activeColor }]} />
          <View style={[styles.scannerCorner, styles.cornerBL, { borderColor: activeColor }]} />
          <View style={[styles.scannerCorner, styles.cornerBR, { borderColor: activeColor }]} />

          {/* Animating Laser Scan Line */}
          {isNutritionStep && cameraReady && (
            <Animated.View style={[styles.scanLine, { transform: [{ translateY }], backgroundColor: colors.brandSafe }]} />
          )}

          {/* Guide Overlay Text */}
          {!isNutritionStep && (
            <View style={styles.guideTextWrapper}>
              <Text style={styles.guideText}>FOCUS ON INGREDIENTS LABEL</Text>
            </View>
          )}
        </View>
      </View>

      {/* Step Guidance Card under Viewfinder (Nutrition Fact guide) */}
      {isNutritionStep && (
        <View style={styles.guidanceCard}>
          <View style={styles.guidanceCardHeader}>
            <Text style={styles.guidanceCardEmoji}>📊</Text>
            <Text style={styles.guidanceCardTitle}>CAPTURE NUTRITION FACTS TABLE</Text>
          </View>
          <Text style={styles.guidanceCardSubtitle}>Align the full nutrition table within the frame</Text>
        </View>
      )}

      {/* 3. Demo Products scrolling Tray */}
      {showSamples && !isNutritionStep && (
        <View style={styles.demoTrayContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.demoScroll}
          >
            {SAMPLE_PRODUCTS.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setIngredientsText(p.ingredients.join(', '));
                  startFinalAnalysis(p.ingredients.join(', '), null);
                }}
                style={styles.demoCard}
              >
                <Text style={styles.demoEmoji}>{p.imageEmoji}</Text>
                <Text numberOfLines={1} style={styles.demoName}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 4. Bottom Controls */}
      <View style={styles.bottomControlsContainer}>
        {/* Shutter capture button */}
        <TouchableOpacity onPress={handleCapture} style={styles.shutterBtn}>
          <View style={styles.shutterInnerCircle}>
            <Camera color="#000000" size={30} />
          </View>
        </TouchableOpacity>

        {/* Row of Upload, Camera Active state, and Type/Skip options */}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={pickImage} style={styles.actionBtn}>
            <View style={styles.actionIconCircle}>
              <Upload color={colors.textSecondary} size={18} />
            </View>
            <Text style={styles.actionLabel}>UPLOAD</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnActive}>
            <View style={[styles.actionIconCircleActive, { borderColor: activeColor }]}>
              <Camera color={activeColor} size={18} />
            </View>
            <Text style={[styles.actionLabelActive, { color: activeColor }]}>CAMERA</Text>
          </TouchableOpacity>

          {!isNutritionStep ? (
            <TouchableOpacity onPress={() => navigation.navigate('Manual')} style={styles.actionBtn}>
              <View style={styles.actionIconCircle}>
                <Sparkles color={colors.textSecondary} size={18} />
              </View>
              <Text style={styles.actionLabel}>TYPE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => startFinalAnalysis(ingredientsText!, null)} style={styles.actionBtn}>
              <View style={styles.actionIconCircle}>
                <Check color={colors.textSecondary} size={18} />
              </View>
              <Text style={styles.actionLabel}>SKIP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Try Demo Products toggle */}
        {!isNutritionStep && (
          <TouchableOpacity 
            onPress={() => setShowSamples(!showSamples)} 
            style={styles.demoToggleBtn}
          >
            <ImageIcon color={colors.textSecondary} size={12} style={{ marginRight: 6 }} />
            <Text style={styles.demoToggleText}>TRY DEMO PRODUCTS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionText: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 6,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButtonDisabled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  stepProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  stepProgressLine: {
    height: 3,
    borderRadius: 1.5,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: colors.isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successBannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  successBannerTextContent: {
    flex: 1,
  },
  successBannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.isDark ? '#34d399' : '#047857',
  },
  successBannerSubtitle: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cameraFrameWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewfinderWrapper: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'relative',
  },
  viewfinderContainer: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scannerCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderStyle: 'solid',
    zIndex: 10,
  },
  cornerTL: {
    top: -3,
    left: -3,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 24,
  },
  cornerTR: {
    top: -3,
    right: -3,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 24,
  },
  cornerBL: {
    bottom: -3,
    left: -3,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 24,
  },
  cornerBR: {
    bottom: -3,
    right: -3,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 24,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 2.5,
    zIndex: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  guideTextWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  guidanceCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 32,
    marginTop: -8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  guidanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guidanceCardEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  guidanceCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  guidanceCardSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  demoTrayContainer: {
    width: '100%',
    paddingVertical: 6,
  },
  demoScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  demoCard: {
    width: 76,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  demoEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  demoName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  bottomControlsContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  shutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  shutterInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  actionBtnActive: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconCircleActive: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabelActive: {
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  demoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    opacity: 0.6,
  },
  demoToggleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },

  // Loader styles
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  loadingTopSection: {
    width: '100%',
    alignItems: 'center',
  },
  loadingCardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingWrapper: {
    width: 290,
    height: 310,
    position: 'relative',
  },
  loadingCardContainer: {
    width: 290,
    height: 310,
    borderRadius: 24,
    backgroundColor: colors.isDark ? '#0c0d1b' : '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  circularLoaderWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ocrProgressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 18,
    marginBottom: 4,
  },
  ocrProgressSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  progressBarTrack: {
    width: 140,
    height: 4,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Crop screen styles
  cropOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
  },
  cropCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cropBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cropImageFrame: {
    position: 'relative',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cropImage: {
    borderRadius: 8,
  },
  cropBoxBorder: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cropCornerHandle: {
    position: 'absolute',
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  cropHandleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
  },
  cropInstruction: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 16,
  },
  cropButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cropRetakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
  },
  cropRetakeBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cropContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  cropContinueBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Review screen styles
  reviewOverlay: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  reviewHeader: {
    alignItems: 'center',
    paddingTop: 68,
  },
  sparkleCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandPrimary + '15',
    borderWidth: 1,
    borderColor: colors.brandPrimary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  reviewSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  reviewCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginVertical: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  reviewCardHeader: {
    marginBottom: 8,
  },
  reviewCardHeaderLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.brandPrimary,
    letterSpacing: 0.5,
  },
  reviewTextInput: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  reviewButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewCancelBtn: {
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCancelBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  reviewConfirmBtnGradient: {
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewConfirmBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
