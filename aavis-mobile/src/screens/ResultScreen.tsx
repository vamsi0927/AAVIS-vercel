import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert, Share } from 'react-native';
import React, { useState } from 'react';
import { Svg, Circle } from 'react-native-svg';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Bookmark, Share2, Sparkles, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react-native';
import { classifyIngredient, getRiskDotColor } from '../lib/ingredientRisk';
import { ADDITIVES_DB } from '../data/additives';
import { getThemeColors } from '../lib/theme';
import { normalizeProduct } from '../lib/scoring';

export default function ResultScreen({ route, navigation }: any) {
  const { data } = route.params || {};
  const { bookmarkedProductIds, toggleBookmark, theme } = useAppContext();
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);

  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle color="#ef4444" size={48} />
        <Text style={styles.errorTitle}>Report Not Found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Normalize data for both new scans and history items
  const scan = data.product ? data : {
    score: data.health_score ?? 50,
    verdict: data.verdict ?? (data.health_score < 40 ? 'hazardous' : data.health_score < 70 ? 'caution' : 'safe'),
    product: {
      id: data.id ?? `prod_${Date.now()}`,
      name: data.product_name ?? 'Scanned Product',
      brand: data.brand ?? 'Unknown Brand',
      imageEmoji: '🤖',
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : (data.ingredients_text ? data.ingredients_text.split(',').map((i: string) => i.trim()) : (typeof data.ingredients === 'string' ? data.ingredients.split(',').map((i: string) => i.trim()) : [])),
      nutrients: data.nutrients ?? {},
      additives: Array.isArray(data.additives) ? data.additives : (data.additives_text ? data.additives_text.split(',').map((i: string) => i.trim()) : []),
      allergens: Array.isArray(data.allergens_detected) ? data.allergens_detected : (Array.isArray(data.allergens) ? data.allergens : []),
    },
    aiSummary: data.ai_summary ?? '',
    dietAdvice: data.diet_advice ?? '',
    mainConcerns: data.main_concerns ?? [],
    majorBenefits: data.major_benefits ?? [],
    aiDimensions: data.aiDimensions ?? data.product?.nutrients?._aiDimensions ?? data.nutrients?._aiDimensions ?? {},
  };

  const product = scan.product;
  const isBookmarked = bookmarkedProductIds.includes(product.id);
  const score = scan.score;

  // Normalize product nutrients dynamically
  const warnings: string[] = [];
  const normalizedData = normalizeProduct(product as any, warnings);
  const normalizedProduct = normalizedData.normalized;

  const isNutritionSkipped = !!(product.nutrients?._skipped || product.rawNutrients?._skipped || (product.nutrients as any)?._nutritionSkipped || (product.rawNutrients as any)?._nutritionSkipped);
  const showNutritionTable = !isNutritionSkipped && (product.nutrients && Object.keys(product.nutrients).filter(k => k !== 'unit' && !k.startsWith('_')).length > 0);

  // Score Ring Config
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const ringColor = scan.verdict === 'hazardous' ? '#ef4444' : scan.verdict === 'caution' ? '#f59e0b' : '#10b981';

  const getVerdictLabel = () => {
    if (scan.verdict === 'hazardous') return '🚫 Avoid';
    if (scan.verdict === 'caution') return '⚡ Caution';
    return '✅ Safe Choice';
  };

  const handleShare = async () => {
    try {
      const message = `I analyzed ${product.name} using Aavis AI and it got a Health Score of ${score}/100. Download Aavis to scan your foods!`;
      await Share.share({ message });
    } catch (e: any) {
      console.log('Share failed', e);
    }
  };

  const getIngredientLevel = (ingr: string) => {
    const nameLower = ingr.toLowerCase().trim();
    if (product.dynamicIngredients?.[ingr]) {
      return product.dynamicIngredients[ingr].hazard;
    }
    return classifyIngredient(ingr).level;
  };

  const getIngredientExplanation = (ingr: string) => {
    if (product.dynamicIngredients?.[ingr]) {
      return product.dynamicIngredients[ingr].explanation;
    }
    return classifyIngredient(ingr).explanation;
  };

  const getVerdictChipColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'hazardous':
      case 'avoid':
      case 'harmful':
        return '#ef4444';
      case 'caution':
      case 'moderate':
      case 'mild':
        return '#f59e0b';
      case 'safe':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* Glow top */}
      {theme === 'dark' && <View style={[styles.glowTop, { backgroundColor: ringColor }]} />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Report</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.actionButton, isBookmarked && styles.bookmarkedActive]} 
            onPress={() => toggleBookmark(product.id)}
          >
            <Bookmark color={isBookmarked ? '#14b8a6' : colors.textSecondary} size={20} fill={isBookmarked ? '#14b8a6' : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Identity Card */}
      <View style={styles.identityCard}>
        <View style={styles.imageBadge}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productThumbnailImage} />
          ) : (
            <Text style={styles.emojiText}>{product.imageEmoji || '🤖'}</Text>
          )}
        </View>
        <View style={styles.identityText}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <View style={[styles.verdictTag, { backgroundColor: `${ringColor}1A`, borderColor: `${ringColor}33` }]}>
            <Text style={[styles.verdictTagText, { color: ringColor }]}>{getVerdictLabel()}</Text>
          </View>
        </View>
      </View>

      {/* Score Ring Section */}
      <View style={styles.scoreCard}>
        <View style={styles.ringContainer}>
          <Svg width="128" height="128" viewBox="0 0 128 128">
            {/* Background track */}
            <Circle 
              cx="64" 
              cy="64" 
              r={radius} 
              fill="none" 
              stroke={colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'} 
              strokeWidth="10" 
            />
            {/* Active progress */}
            <Circle 
              cx="64" 
              cy="64" 
              r={radius} 
              fill="none" 
              stroke={ringColor} 
              strokeWidth="10" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
            />
          </Svg>
          <View style={styles.ringLabelWrapper}>
            <Text style={[styles.ringScoreText, { color: ringColor }]}>{score}</Text>
            <Text style={styles.ringTotalText}>/ 100</Text>
          </View>
        </View>
        
        <Text style={styles.adviceTitle}>Aavis AI Verdict</Text>
        <Text style={styles.adviceText}>{scan.dietAdvice || 'Check nutrition components below.'}</Text>
        {scan.aiSummary ? (
          <View style={styles.roastBox}>
            <Text style={styles.roastText}>🔥 {scan.aiSummary}</Text>
          </View>
        ) : null}

        {/* AI Dimensions Breakdown */}
        {scan.aiDimensions && Object.keys(scan.aiDimensions).length > 0 ? (
          <View style={styles.dimensionsContainer}>
            <Text style={styles.dimensionsHeader}>HEALTH DIMENSIONS BREAKDOWN</Text>
            {Object.entries(scan.aiDimensions).map(([dim, val]: [string, any], idx) => {
              const dimLabels: Record<string, string> = {
                ingredientSafety: 'Ingredient Safety',
                nutritionalQuality: 'Nutritional Quality',
                processingLevel: 'Processing Level',
                nutrientDensity: 'Nutrient Density',
                energyDensity: 'Energy Density',
                wholeFoodContent: 'Whole Food Content',
                functionalHealthImpact: 'Functional Health Impact'
              };
              const label = dimLabels[dim] || dim;
              const dimScore = val.score;
              const dimColor = dimScore < 40 ? '#ef4444' : dimScore < 70 ? '#f59e0b' : '#10b981';

              return (
                <View key={idx} style={styles.dimensionRow}>
                  <View style={styles.dimensionHeaderRow}>
                    <Text style={styles.dimensionLabel}>{label}</Text>
                    <Text style={[styles.dimensionScore, { color: dimColor }]}>{dimScore}/100</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${dimScore}%`, backgroundColor: dimColor }]} />
                  </View>
                  <Text style={styles.dimensionJustification}>{val.justification}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Consumption Impact */}
      {scan.consumptionImpact ? (
        <View style={[
          styles.impactBox,
          scan.consumptionImpact === 'High' ? styles.impactHigh : scan.consumptionImpact === 'Moderate' ? styles.impactMod : styles.impactSafe
        ]}>
          <View style={styles.sectionHeaderRow}>
            <Sparkles color={scan.consumptionImpact === 'High' ? '#ef4444' : scan.consumptionImpact === 'Moderate' ? '#f59e0b' : '#10b981'} size={16} />
            <Text style={[
              styles.impactTitle,
              { color: scan.consumptionImpact === 'High' ? '#ef4444' : scan.consumptionImpact === 'Moderate' ? '#f59e0b' : '#10b981' }
            ]}>
              Consumption Impact: {scan.consumptionImpact}
            </Text>
          </View>
          <Text style={styles.impactText}>
            Based on the real-world serving size ({product.servingSize || 'Unknown'}), eating this product has a <Text style={{ fontWeight: 'bold' }}>{scan.consumptionImpact.toLowerCase()} impact</Text> on your daily nutritional limits.
          </Text>
          {scan.servingWarning ? (
            <Text style={styles.servingWarningText}>{scan.servingWarning}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Personalized Warnings */}
      {scan.personalizedWarnings && scan.personalizedWarnings.length > 0 ? (
        <View style={styles.personalizedBox}>
          <View style={styles.sectionHeaderRow}>
            <Sparkles color="#8b5cf6" size={16} />
            <Text style={styles.personalizedTitle}>Personalized for You</Text>
          </View>
          {scan.personalizedWarnings.map((warning: string, idx: number) => (
            <View key={idx} style={styles.personalizedItem}>
              <Text style={styles.personalizedText}>{warning}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Health concerns */}
      {showNutritionTable && scan.mainConcerns && scan.mainConcerns.length > 0 ? (
        <View style={styles.concernsBox}>
          <View style={styles.sectionHeaderRow}>
            <AlertTriangle color="#ef4444" size={16} />
            <Text style={styles.concernsTitle}>Key Health Concerns</Text>
          </View>
          {scan.mainConcerns.map((concern: string, idx: number) => (
            <View key={idx} style={styles.concernItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.concernText}>{concern}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Benefits */}
      {scan.majorBenefits && scan.majorBenefits.length > 0 && scan.majorBenefits[0] !== 'None' ? (
        <View style={styles.benefitsBox}>
          <View style={styles.sectionHeaderRow}>
            <Sparkles color="#10b981" size={16} />
            <Text style={styles.benefitsTitle}>Notable Health Benefits</Text>
          </View>
          {scan.majorBenefits.map((benefit: string, idx: number) => (
            <View key={idx} style={styles.benefitItem}>
              <Text style={styles.bulletPointCheck}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Nutritional Facts or Key Health Concerns (if skipped) ── */}
      {showNutritionTable ? (
        (() => {
          const rawServing = (product.servingSize || '').trim().toLowerCase();
          const isUnknown = !rawServing || rawServing === 'unknown' || rawServing === 'n/a' || rawServing === 'none';
          const servingMatch = rawServing.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
          const servingNumeric = servingMatch ? parseFloat(servingMatch[1]) : null;
          const hasServing = !isUnknown && servingNumeric !== null && Math.round(servingNumeric) !== 100;

          let baseUnit = 'g';
          if (servingMatch && servingMatch[2].toLowerCase() === 'ml') {
            baseUnit = 'ml';
          } else if (normalizedProduct.normalizedNutrients?.unit === '100ml' || normalizedProduct.normalizedNutrients?.unit === 'ml') {
            baseUnit = 'ml';
          } else if (product.category && ['drink', 'milk', 'juice', 'beverage', 'soda', 'cola'].some((kw: string) => product.category!.toLowerCase().includes(kw))) {
            baseUnit = 'ml';
          }
          const servingStr = hasServing ? `${servingNumeric} ${baseUnit}` : '';

          const FDA_DV: Record<string, number> = {
            protein: 50,
            fiber: 28,
            fat: 78,
            satFat: 20,
            carbs: 275,
            sodium: 2300,
            sugar: 50
          };

          const formatValue = (val: number, unit: string) => {
            if (unit === 'mg' || unit === 'kcal') return Math.round(val).toString();
            if (val > 0 && val < 0.1) return '<0.1';
            return Number(val).toFixed(1).replace(/\.0$/, '');
          };

          const getBadge = (key: string, val100: number) => {
            if ((key === 'sugar' && val100 > 10) || (key === 'sodium' && val100 > 400) || (key === 'satFat' && val100 > 5) || (key === 'fat' && val100 > 20) || (key === 'calories' && val100 > 400)) {
              return { label: 'High', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' };
            }
            if ((key === 'protein' && val100 > 10) || (key === 'fiber' && val100 > 5)) {
              return { label: 'Good', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' };
            }
            if (key === 'carbs' || key === 'sodium' || key === 'sugar') {
              return { label: 'Mod', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' };
            }
            return null;
          };

          const NUTRIENT_META: Record<string, {label: string, icon: string, defaultUnit: string}> = {
            calories: { label: 'Calories', icon: '🔥', defaultUnit: 'kcal' },
            sugar: { label: 'Sugars', icon: '🍬', defaultUnit: 'g' },
            addedSugars: { label: 'Added Sugars', icon: '🍯', defaultUnit: 'g' },
            sodium: { label: 'Sodium', icon: '🧂', defaultUnit: 'mg' },
            fat: { label: 'Total Fat', icon: '🥑', defaultUnit: 'g' },
            satFat: { label: 'Sat Fat', icon: '🧈', defaultUnit: 'g' },
            protein: { label: 'Protein', icon: '💪', defaultUnit: 'g' },
            fiber: { label: 'Fiber', icon: '🌿', defaultUnit: 'g' },
            carbs: { label: 'Carbs', icon: '🌾', defaultUnit: 'g' },
          };

          const allKeys = Array.from(new Set([
            ...Object.keys(normalizedProduct.nutrients || {}),
            ...Object.keys(normalizedProduct.rawNutrients || {})
          ])).filter(k => k !== 'unit' && !k.startsWith('_') && NUTRIENT_META[k]);

          if (allKeys.length === 0) return null;

          return (
            <View style={styles.cardSection}>
              <Text style={styles.cardHeader}>Nutritional Facts</Text>
              
              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { flex: 1.5 }]}>NUTRIENT</Text>
                <Text style={[styles.columnHeader, styles.alignRight, { flex: 1 }]}>PER 100 {baseUnit.toUpperCase()}</Text>
                {hasServing && (
                  <>
                    <Text style={[styles.columnHeader, styles.alignRight, { flex: 1, lineHeight: 12 }]}>PER SERVING{"\n"}({servingStr.toUpperCase()})</Text>
                    <Text style={[styles.columnHeader, styles.alignRight, { flex: 0.8 }]}>% DV</Text>
                  </>
                )}
              </View>

              {allKeys.map((key) => {
                let normVal = (normalizedProduct.normalizedNutrients || normalizedProduct.nutrients)[key];
                if (normVal === null || normVal === undefined || isNaN(normVal)) return null;

                // Conversions
                if (key === 'sodium' && (normalizedProduct.normalizedNutrients?.unit === 'g' || normalizedProduct.nutrients?.unit === 'g') && normVal < 10) {
                  normVal = normVal * 1000;
                } else if (key === 'calories' && (normalizedProduct.normalizedNutrients?.unit === 'kJ' || normalizedProduct.nutrients?.unit === 'kJ')) {
                  normVal = normVal / 4.184;
                }

                let perServingVal = null;
                if (hasServing && servingNumeric) {
                  perServingVal = normVal * (servingNumeric / 100);
                }

                const meta = NUTRIENT_META[key];
                const badge = getBadge(key, normVal);

                let dvPercent = null;
                if (hasServing && perServingVal !== null) {
                  let dvKey = key;
                  if (key === 'sugar' && allKeys.includes('addedSugars')) {
                    dvKey = 'skip';
                  }
                  if (key === 'addedSugars') dvKey = 'sugar';
                  if (dvKey !== 'skip' && FDA_DV[dvKey]) {
                    dvPercent = Math.round((perServingVal / FDA_DV[dvKey]) * 100);
                  }
                }

                return (
                  <View key={key} style={styles.tableRow}>
                    <View style={[styles.nutrientCell, { flex: 1.5 }]}>
                      <Text style={styles.nutrientEmoji}>{meta.icon}</Text>
                      <Text style={styles.nutrientLabel}>{meta.label}</Text>
                      {badge && (
                        <View style={[styles.nutrientBadge, { backgroundColor: badge.bgColor, borderColor: badge.borderColor }]}>
                          <Text style={[styles.nutrientBadgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[styles.valueText, styles.alignRight, { flex: 1 }]}>
                      {formatValue(normVal, meta.defaultUnit)} <Text style={styles.unitText}>{meta.defaultUnit}</Text>
                    </Text>

                    {hasServing && (
                      <Text style={[styles.valueText, styles.alignRight, { flex: 1, opacity: 0.8 }]}>
                        {perServingVal !== null ? `${formatValue(perServingVal, meta.defaultUnit)} ` : '- '}
                        {perServingVal !== null && <Text style={styles.unitText}>{meta.defaultUnit}</Text>}
                      </Text>
                    )}

                    {hasServing && (
                      <Text style={[styles.dvText, styles.alignRight, { flex: 0.8 }]}>
                        {dvPercent !== null ? `${dvPercent}%` : '-'}
                      </Text>
                    )}
                  </View>
                );
              })}

              <Text style={styles.disclaimerText}>
                Values are normalized per 100 g or 100 ml for fair comparison. Serving values are automatically adjusted using the detected serving size.
              </Text>
            </View>
          );
        })()
      ) : (
        scan.mainConcerns && scan.mainConcerns.length > 0 ? (
          <View style={styles.cardSection}>
            <Text style={styles.cardHeader}>Key Health Concerns</Text>
            {scan.mainConcerns.map((concern: string, idx: number) => (
              <View key={idx} style={styles.concernItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.concernText}>{concern}</Text>
              </View>
            ))}
          </View>
        ) : null
      )}

      {/* Ingredients List */}
      <View style={styles.cardSection}>
        <Text style={styles.cardHeader}>Ingredients Breakdown</Text>
        {product.ingredients.length === 0 ? (
          <Text style={styles.emptyText}>No ingredients detected.</Text>
        ) : (
          <View style={styles.ingredientsGrid}>
            {product.ingredients.map((ingr: string, idx: number) => {
              const level = getIngredientLevel(ingr);
              const explanation = getIngredientExplanation(ingr);
              const isExpanded = expandedIngredient === ingr;
              const levelColor = getVerdictChipColor(level);

              return (
                <View key={idx} style={styles.ingredientWrapper}>
                  <TouchableOpacity 
                    style={[styles.ingredientChip, { borderColor: `${levelColor}40`, backgroundColor: `${levelColor}10` }]}
                    onPress={() => explanation && setExpandedIngredient(isExpanded ? null : ingr)}
                  >
                    <View style={[styles.dot, { backgroundColor: levelColor }]} />
                    <Text style={[styles.ingredientChipText, { color: levelColor }]}>{ingr}</Text>
                    {explanation ? (
                      isExpanded ? <ChevronUp color={colors.textSecondary} size={12} /> : <ChevronDown color={colors.textSecondary} size={12} />
                    ) : null}
                  </TouchableOpacity>
                  {isExpanded && explanation ? (
                    <View style={[styles.ingredientExplanation, { borderLeftColor: levelColor, backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }]}>
                      <Text style={styles.explanationText}>{explanation}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Additives Section */}
      {(product.additives && product.additives.length > 0) ? (
        <View style={styles.cardSection}>
          <Text style={styles.cardHeader}>Additives & E-Codes</Text>
          {product.additives.map((code: string, idx: number) => {
            const localDbAdditive = ADDITIVES_DB[code];
            const name = localDbAdditive?.name || code;
            const hazard = localDbAdditive?.hazard || 'caution';
            const healthExplanation = localDbAdditive?.healthExplanation || 'Industrial food additive.';
            const functionName = localDbAdditive?.function || 'Food Additive';
            const hazardColor = getVerdictChipColor(hazard);

            return (
              <View key={idx} style={[styles.additiveCard, { borderLeftColor: hazardColor }]}>
                <View style={styles.additiveHeader}>
                  <Text style={styles.additiveCode}>{code}</Text>
                  <View style={[styles.hazardBadge, { backgroundColor: `${hazardColor}1F` }]}>
                    <Text style={[styles.hazardBadgeText, { color: hazardColor }]}>{hazard}</Text>
                  </View>
                </View>
                <Text style={styles.additiveName}>{name}</Text>
                <Text style={styles.additiveFunction}>{functionName}</Text>
                <Text style={styles.additiveExplanation}>{healthExplanation}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <TouchableOpacity style={styles.dashboardButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: '25%',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.05,
    transform: [{ scale: 1.8 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 10,
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 10,
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  bookmarkedActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#14b8a6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  identityCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.isDark ? '#080914' : '#f5f6fa',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emojiText: {
    fontSize: 32,
  },
  identityText: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  productBrand: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  verdictTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  verdictTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  scoreCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  ringContainer: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  ringLabelWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScoreText: {
    fontSize: 36,
    fontWeight: '900',
  },
  ringTotalText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  roastBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    width: '100%',
  },
  roastText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  concernsBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  concernsTitle: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  concernItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPoint: {
    color: '#ef4444',
    marginRight: 8,
    fontWeight: 'bold',
  },
  concernText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  benefitsBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  benefitsTitle: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPointCheck: {
    color: '#10b981',
    marginRight: 8,
    fontWeight: 'bold',
  },
  benefitText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  cardSection: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientWrapper: {
    width: '100%',
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  ingredientChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    marginRight: 8,
  },
  ingredientExplanation: {
    borderLeftWidth: 3,
    padding: 12,
    marginTop: 4,
    borderRadius: 8,
  },
  explanationText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  additiveCard: {
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  additiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  additiveCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  hazardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hazardBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  additiveName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  additiveFunction: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#14b8a6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  additiveExplanation: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  dashboardButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  dashboardButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  columnHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
    paddingVertical: 10,
  },
  nutrientCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  nutrientLabel: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  nutrientBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 6,
  },
  nutrientBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  unitText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  dvText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  alignRight: {
    textAlign: 'right',
  },
  disclaimerText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 14,
    opacity: 0.6,
  },
  dimensionsContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
  },
  dimensionsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  dimensionRow: {
    marginBottom: 16,
  },
  dimensionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dimensionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  dimensionScore: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  dimensionJustification: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
  personalizedBox: {
    backgroundColor: colors.isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)',
    borderColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  personalizedTitle: {
    color: '#8b5cf6',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  personalizedItem: {
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  personalizedText: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 16,
  },
  impactBox: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  impactHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  impactMod: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  impactSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  impactTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  impactText: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
  servingWarningText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  productThumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
});
