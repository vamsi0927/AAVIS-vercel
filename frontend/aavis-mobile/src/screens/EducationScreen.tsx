import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Search,
  Box,
  Droplet,
  ShieldCheck,
  AlertTriangle,
  PieChart,
  Zap,
  CheckCircle2,
  Info,
  XCircle,
  Scale,
  Beaker,
  Baby,
  AlertOctagon,
  PackageCheck,
  ListTree,
  LayoutPanelLeft,
  ExternalLink,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';
import { ADDITIVES_DB } from '../data/additives';
import FloatingAIBubble from '../components/FloatingAIBubble';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Static content mapping original Aavis guides ─────────────────────────────
const SUGAR_ALIASES = [
  { name: 'Sucrose', category: 'Basic Sugars', description: 'Table sugar. Half glucose, half fructose.' },
  { name: 'High Fructose Corn Syrup (HFCS)', category: 'Syrups', description: 'Cheaper than sugar, heavily processed from corn. Strongly linked to fatty liver disease.' },
  { name: 'Maltodextrin', category: 'Processed Starches', description: 'Technically a complex carb but acts like sugar in the body. Has a higher glycemic index than table sugar.' },
  { name: 'Dextrose', category: 'Basic Sugars', description: 'Chemically identical to glucose. Often used in baking and processed foods.' },
  { name: 'Fructose', category: 'Basic Sugars', description: 'Fruit sugar. When extracted and added to foods without fiber, it overworks the liver.' },
  { name: 'Agave Nectar', category: 'Syrups', description: 'Often marketed as healthy, but contains up to 90% fructose, which is worse for metabolic health than regular sugar.' },
  { name: 'Brown Rice Syrup', category: 'Syrups', description: 'Contains no fructose, only glucose. Still pure sugar, but breaks down slightly slower.' },
  { name: 'Invert Sugar', category: 'Syrups', description: 'Liquid sugar used by bakers to keep baked goods moist.' },
  { name: 'Cane Juice Crystals', category: 'Basic Sugars', description: 'A fancy, "natural" sounding name for plain old sugar.' },
  { name: 'Barley Malt', category: 'Syrups', description: 'A sweet syrup made from sprouted barley.' },
  { name: 'Glucose Syrup', category: 'Syrups', description: 'A thick, sweet syrup used heavily in commercial candy and snack production.' },
  { name: 'Corn Syrup', category: 'Syrups', description: 'A liquid sweetener made from corn starch.' },
  { name: 'Caramel', category: 'Other', description: 'Often used for coloring, but it is made by heating sugar.' },
  { name: 'Fruit Juice Concentrate', category: 'Other', description: 'Juice with all water and fiber removed. It is essentially pure sugar.' },
  { name: 'Maltose', category: 'Basic Sugars', description: 'Malt sugar. Less sweet than table sugar but spikes blood sugar rapidly.' },
  { name: 'Coconut Sugar', category: 'Basic Sugars', description: 'Retains trace minerals, but still contains the same amount of calories and fructose as regular sugar.' },
  { name: 'Treacle', category: 'Syrups', description: 'Uncrystallized syrup made during the refining of sugar.' },
  { name: 'Turbinado Sugar', category: 'Basic Sugars', description: 'Partially refined cane sugar. Not a health food.' },
  { name: 'Sorghum Syrup', category: 'Syrups', description: 'Sweet syrup extracted from the sorghum plant.' },
  { name: 'Galactose', category: 'Basic Sugars', description: 'A simple sugar usually found combining with glucose to form lactose.' },
];

const CLAIMS = [
  {
    claim: 'Sugar Free',
    reality: 'Often packed with artificial sweeteners (like Aspartame or Sucralose) which can disrupt gut microbiome and maintain sugar cravings.',
    dangerLevel: 'high'
  },
  {
    claim: 'No Added Sugar',
    reality: 'The product naturally contains high amounts of sugar (like fruit juice concentrate). It still spikes blood sugar identically to added sugar.',
    dangerLevel: 'medium'
  },
  {
    claim: 'Multigrain',
    reality: 'Just means multiple types of grains are used. Often they are all highly refined white grains stripped of fiber. Look for "Whole Grain" instead.',
    dangerLevel: 'high'
  },
  {
    claim: 'Made with Whole Grains',
    reality: 'It might contain 1% whole grain and 99% refined flour. Check the ingredients list to see if whole grain is the first ingredient.',
    dangerLevel: 'medium'
  },
  {
    claim: 'All Natural',
    reality: 'An unregulated marketing term. High Fructose Corn Syrup comes from corn, making it "natural", but it is terrible for metabolic health.',
    dangerLevel: 'high'
  },
  {
    claim: 'Fat Free',
    reality: 'When manufacturers remove fat, the food tastes like cardboard. They almost always compensate by adding massive amounts of sugar.',
    dangerLevel: 'high'
  },
  {
    claim: 'High Protein',
    reality: 'Often used to health-wash candy bars. A "high protein" bar might have 10g of protein but 25g of sugar and processed seed oils.',
    dangerLevel: 'medium'
  },
  {
    claim: 'Organic',
    reality: 'Organic sugar is still sugar. Organic junk food is still junk food. It just means the ingredients were grown without synthetic pesticides.',
    dangerLevel: 'low'
  }
];

const SUGAR_BOARD = [
  { name: 'Standard Cola (500ml)', sugarGrams: 54, cubes: 13.5, daily: 216, color: '#ef4444' },
  { name: 'Fruit Juice Box (200ml)', sugarGrams: 24, cubes: 6, daily: 96, color: '#f97316' },
  { name: 'Kids Drink Powder (Per serve)', sugarGrams: 15, cubes: 3.75, daily: 60, color: '#fbbf24' },
  { name: 'Chocolate Spread (2 Tbsp)', sugarGrams: 21, cubes: 5.25, daily: 84, color: '#ef4444' },
];

const SALT_BOARD = [
  { name: 'Instant Noodles (1 Pack)', sodium: 1200, percent: 80, color: '#ef4444', description: 'Almost your entire recommended daily limit of sodium in a single snack.' },
  { name: 'Potato Chips (Large bag)', sodium: 450, percent: 30, color: '#fbbf24', description: 'Heavily salted. Easy to overconsume.' },
  { name: 'Tomato Ketchup (1 Tbsp)', sodium: 180, percent: 12, color: '#fbbf24', description: 'Deceptively high in sodium and sugar.' },
];

const FAT_BOARD = [
  { name: 'French Fries (Large)', fatGrams: 20, transFat: 0.5, seedOil: 'Palm Oil', description: 'Deep fried in refined oil at high temperatures. Contains inflammatory oxidized fats.' },
  { name: 'Microwave Popcorn', fatGrams: 15, transFat: 2.0, seedOil: 'Hydrogenated Soybean Oil', description: 'High in industrial trans fats which lower HDL (good cholesterol) and raise LDL.' }
];

type Section =
  | null
  | 'label'
  | 'packaging'
  | 'sugars'
  | 'claims'
  | 'additives'
  | 'portions'
  | 'boards';

export function EducationScreen() {
  return (
    <View style={{ flex: 1 }}>
      <EducationScreenContent />
      <FloatingAIBubble />
    </View>
  );
}

function EducationScreenContent() {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [activeSection, setActiveSection] = useState<Section>(null);
  const [sugarSearch, setSugarSearch] = useState('');
  const [additivesSearch, setAdditivesSearch] = useState('');
  const [additivesFilter, setAdditivesFilter] = useState<'all' | 'safe' | 'mild' | 'moderate' | 'caution' | 'hazardous'>('all');

  const filteredSugars = SUGAR_ALIASES.filter(
    (s) =>
      s.name.toLowerCase().includes(sugarSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(sugarSearch.toLowerCase()),
  );

  const additivesArray = Object.values(ADDITIVES_DB);
  const filteredAdditives = additivesArray.filter((a) => {
    const matchesSearch =
      a.code.toLowerCase().includes(additivesSearch.toLowerCase()) ||
      a.name.toLowerCase().includes(additivesSearch.toLowerCase());
    const matchesFilter = additivesFilter === 'all' || a.hazard === additivesFilter;
    return matchesSearch && matchesFilter;
  });

  const renderVisualCubes = (count: number, color: string) => {
    const cubes = Math.floor(count);
    const half = count % 1 !== 0;
    return (
      <View style={styles.cubesRow}>
        {Array.from({ length: cubes }).map((_, i) => (
          <View key={i} style={[styles.cubeBox, { backgroundColor: color }]} />
        ))}
        {half && <View style={[styles.cubeBox, { backgroundColor: color, width: 8 }]} />}
      </View>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={[styles.detailHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? '#080914' : '#ffffff' }]}>
      <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setActiveSection(null)}>
        <ArrowLeft color={colors.textPrimary} size={18} />
      </TouchableOpacity>
      <Text style={[styles.detailHeaderTitle, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DETAILED SECTIONS
  // ─────────────────────────────────────────────────────────────────────────

  if (activeSection === 'label') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SectionHeader title="Label Literacy" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            A definitive guide to reading ingredients, spotting hidden tricks, and understanding the nutrition facts panel.
          </Text>

          {/* Golden Rule of Labels */}
          <View style={[styles.infoBox, { borderColor: colors.brandPrimary + '30', backgroundColor: colors.brandPrimary + '0d' }]}>
            <Info color={colors.brandPrimary} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBoxTitle, { color: colors.brandPrimary }]}>Golden Rule of Labels</Text>
              <Text style={[styles.infoBoxText, { color: colors.textPrimary }]}>
                <Text style={{ fontWeight: 'bold' }}>Ingredients</Text> tell you <Text style={{ textDecorationLine: 'underline', fontWeight: 'bold' }}>WHAT</Text> you're eating.{'\n'}
                <Text style={{ fontWeight: 'bold' }}>Nutrition Facts</Text> tell you <Text style={{ textDecorationLine: 'underline', fontWeight: 'bold' }}>HOW MUCH</Text> you're eating.
              </Text>
            </View>
          </View>

          {/* Section 1: The Ingredients List */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><Scale color={colors.brandPrimary} size={16} /> The Ingredients List</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardSection}>
              <View style={[styles.numberBadge, { backgroundColor: colors.brandPrimary + '15' }]}><Text style={{ color: colors.brandPrimary, fontWeight: 'bold' }}>1</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardSubTitle, { color: colors.textPrimary }]}>Listed by Weight</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>Ingredients are listed in descending order by weight. The first 3 ingredients make up the vast majority. If sugar is in the top 3, it's essentially dessert.</Text>
              </View>
            </View>
            <View style={styles.cardSection}>
              <View style={[styles.numberBadge, { backgroundColor: colors.brandSecondary + '15' }]}><Text style={{ color: colors.brandSecondary, fontWeight: 'bold' }}>2</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardSubTitle, { color: colors.textPrimary }]}>Shorter is Better</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>A list with 5 recognizable ingredients is generally healthier than 25 unpronounceable chemicals. If it sounds like a science experiment, it probably is.</Text>
              </View>
            </View>
            <View style={styles.cardSection}>
              <View style={[styles.numberBadge, { backgroundColor: colors.brandHazardous + '15' }]}><Text style={{ color: colors.brandHazardous, fontWeight: 'bold' }}>3</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardSubTitle, { color: colors.textPrimary }]}>Hidden Sugars</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]}>Manufacturers split sugar into different names (Maltodextrin, Dextrose, Fructose, Corn Syrup) so they fall lower on the list. Combine them and sugar is often #1.</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Nutrition Facts */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><PieChart color={colors.brandSecondary} size={16} /> Nutrition Facts Panel</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardSubTitle, { color: colors.textPrimary }]}>Serving Size Deception</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>Brands make serving sizes unrealistically small to make calories look low. Always check "Per 100g" to fairly compare.</Text>
            <View style={[styles.miniTable, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderColor: colors.border }]}>
              <View style={styles.miniTableRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Per Serving (10g)</Text>
                <Text style={{ color: colors.brandSafe, fontWeight: 'bold', fontSize: 12 }}>5g Sugar</Text>
              </View>
              <View style={styles.miniTableRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Per 100g (Reality)</Text>
                <Text style={{ color: colors.brandHazardous, fontWeight: 'bold', fontSize: 12 }}>50g Sugar</Text>
              </View>
            </View>

            <Text style={[styles.cardSubTitle, { color: colors.textPrimary, marginTop: 15 }]}>Fiber-to-Carb Ratio</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>Look for a carbohydrate-to-fiber ratio of 10:1 or better. This indicates intact whole grains that won't spike blood sugar.</Text>
            <View style={[styles.feedbackBadge, { backgroundColor: colors.brandSafe + '15', borderColor: colors.brandSafe + '30' }]}>
              <CheckCircle2 color={colors.brandSafe} size={14} />
              <Text style={{ color: colors.brandSafe, fontSize: 12, fontWeight: 'bold', marginLeft: 6 }}>Good: 20g Carbs / 3g Fiber</Text>
            </View>
          </View>

          {/* Section 3: Buzzwords Decoded */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><Zap color={colors.brandPrimary} size={16} /> Marketing Buzzwords Decoded</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { claim: "No Added Sugar", truth: "May contain concentrated fruit juices (pure sugar), maltodextrin, or sweeteners that disrupt gut health.", badge: "Sugar Trick" },
              { claim: "Made with Whole Grains", truth: "Usually contains 90% refined flour and 10% whole grain. Check which grain is listed first.", badge: "Fiber Trap" },
              { claim: "100% Natural", truth: "The term 'natural' has loose definitions. Poison ivy is natural but not edible. Doesn't mean organic.", badge: "Greenwashing" },
              { claim: "Fat Free / Low Fat", truth: "When fat is removed, manufacturers usually add massive amounts of sugar and starch to compensate.", badge: "Taste Filler" }
            ].map((trick, index) => (
              <View key={index} style={[styles.trickRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }]}>
                <View style={styles.trickHeader}>
                  <Text style={[styles.trickBadge, { backgroundColor: colors.brandHazardous + '15', color: colors.brandHazardous }]}>{trick.badge}</Text>
                  <Text style={[styles.trickClaim, { color: colors.textPrimary }]}>"{trick.claim}"</Text>
                </View>
                <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 4 }]}>{trick.truth}</Text>
              </View>
            ))}
          </View>

          {/* Traffic Lights */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><Info color={colors.brandCaution} size={16} /> Traffic Light System</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
            <View style={[styles.trafficRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.trafficDot, { backgroundColor: colors.brandSafe }]} />
              <View>
                <Text style={[styles.trafficTitle, { color: colors.textPrimary }]}>Green (Low)</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 2 }]}>Safe to consume regularly.</Text>
              </View>
            </View>
            <View style={[styles.trafficRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.trafficDot, { backgroundColor: colors.brandCaution }]} />
              <View>
                <Text style={[styles.trafficTitle, { color: colors.textPrimary }]}>Yellow (Medium)</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 2 }]}>Consume in moderation.</Text>
              </View>
            </View>
            <View style={styles.trafficRow}>
              <View style={[styles.trafficDot, { backgroundColor: colors.brandHazardous }]} />
              <View>
                <Text style={[styles.trafficTitle, { color: colors.textPrimary }]}>Red (High)</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 2 }]}>Occasional treat only. High risk.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'packaging') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SectionHeader title="Honest Packaging" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            A guide for brands and creators on how to design transparent, honest labels without resorting to misleading marketing.
          </Text>

          {/* Front of Pack */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><LayoutPanelLeft color={colors.brandSecondary} size={16} /> Front of Pack (FOP)</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { title: "True Product Name", desc: "If it's mostly sugar and cocoa substitute, call it a 'Chocolate Flavored Sugar Beverage,' not just 'Chocolate Drink.'" },
              { title: "Honest Imagery", desc: "Don't show giant fresh strawberries on the front if the product only contains 0.1% strawberry extract." },
              { title: "Net Quantity", desc: "Must be clearly visible in metric units (grams, milliliters) on the principal display panel." }
            ].map((item, idx) => (
              <View key={idx} style={[styles.cardSection, idx > 0 && { marginTop: 12 }]}>
                <View style={[styles.numberBadge, { backgroundColor: colors.brandSecondary + '15' }]}><Text style={{ color: colors.brandSecondary, fontWeight: 'bold' }}>{idx + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardSubTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.cardText, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Back of Pack */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><ListTree color={colors.brandPrimary} size={16} /> Back of Pack (BOP)</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardSubTitle, { color: colors.textPrimary }]}>Mandatory Elements</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>• Full Ingredients List (by weight descending){'\n'}• Nutrition Facts Table (per 100g){'\n'}• Allergen Declaration{'\n'}• Manufacturing Date & Expiry</Text>

            <Text style={[styles.cardSubTitle, { color: colors.textPrimary, marginTop: 15 }]}>Transparency Tips</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>• Use a legible font size (min 1.5mm height).{'\n'}• Group multi-part ingredients in brackets.{'\n'}• Don't hide sugar behind 5 different chemical names.</Text>
          </View>

          {/* Good vs Bad */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><AlertOctagon color={colors.brandCaution} size={16} /> Good vs. Misleading</Text>
          <View style={styles.goodBadGrid}>
            <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.brandHazardous + '30', flex: 1 }]}>
              <AlertTriangle color={colors.brandHazardous} size={20} />
              <Text style={[styles.cardSubTitle, { color: colors.brandHazardous, marginTop: 8 }]}>Misleading</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>A front label screaming "100% NATURAL" while the back reveals it contains Maltodextrin and Sucralose. Destroys trust.</Text>
            </View>
            <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.brandSafe + '30', flex: 1 }]}>
              <PackageCheck color={colors.brandSafe} size={20} />
              <Text style={[styles.cardSubTitle, { color: colors.brandSafe, marginTop: 8 }]}>Honest</Text>
              <Text style={[styles.cardText, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>Stating exactly what it is. A short, clean ingredient list. If it has sugar, the brand owns it and displays exactly how much.</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'sugars') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SectionHeader title="Hidden Sugars" />
        <View style={[styles.searchContainer, { borderBottomColor: colors.border, backgroundColor: isDark ? '#080914' : '#ffffff' }]}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
            <Search color={colors.textSecondary} size={18} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search for sugar aliases..."
              placeholderTextColor={colors.textSecondary}
              value={sugarSearch}
              onChangeText={setSugarSearch}
            />
          </View>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredSugars.length === 0 ? (
            <View style={styles.emptyContainer}>
              <XCircle color={colors.textSecondary} size={36} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sugar aliases found matching "{sugarSearch}"</Text>
            </View>
          ) : (
            filteredSugars.map((sugar, idx) => (
              <View key={idx} style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
                <View style={styles.trickHeader}>
                  <Text style={[styles.trickBadge, { backgroundColor: colors.brandSecondary + '15', color: colors.brandSecondary }]}>{sugar.category}</Text>
                  <Text style={[styles.trickClaim, { color: colors.textPrimary }]}>{sugar.name}</Text>
                </View>
                <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 6 }]}>{sugar.description}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'claims') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SectionHeader title="Food Claims Decoder" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.paragraph, { color: colors.textSecondary, marginBottom: 20 }]}>
            The front of the package is a billboard designed to sell. Here is what those bold marketing claims actually mean.
          </Text>
          {CLAIMS.map((item, idx) => (
            <View key={idx} style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
              <View style={[styles.trickHeader, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 10 }]}>
                <Text style={[styles.trickClaim, { color: colors.textPrimary, fontSize: 16 }]}>"{item.claim}"</Text>
              </View>
              <Text style={[styles.cardSubTitle, { color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Reality</Text>
              <Text style={[styles.cardText, { color: colors.textPrimary, marginTop: 4 }]}>{item.reality}</Text>
              <View style={[styles.feedbackBadge, {
                marginTop: 12,
                backgroundColor: item.dangerLevel === 'high' ? colors.brandHazardous + '15' : item.dangerLevel === 'medium' ? colors.brandCaution + '15' : colors.brandSafe + '15',
                borderColor: item.dangerLevel === 'high' ? colors.brandHazardous + '30' : item.dangerLevel === 'medium' ? colors.brandCaution + '30' : colors.brandSafe + '30'
              }]}>
                <AlertTriangle color={item.dangerLevel === 'high' ? colors.brandHazardous : item.dangerLevel === 'medium' ? colors.brandCaution : colors.brandSafe} size={14} />
                <Text style={{
                  color: item.dangerLevel === 'high' ? colors.brandHazardous : item.dangerLevel === 'medium' ? colors.brandCaution : colors.brandSafe,
                  fontSize: 12,
                  fontWeight: 'bold',
                  marginLeft: 6
                }}>
                  {item.dangerLevel === 'high' ? 'Highly Misleading' : item.dangerLevel === 'medium' ? 'Often Misleading' : 'True, but irrelevant'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'additives') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SectionHeader title="Additives Database" />
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: isDark ? '#080914' : '#ffffff' }}>
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
              <Search color={colors.textSecondary} size={18} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search by code or name..."
                placeholderTextColor={colors.textSecondary}
                value={additivesSearch}
                onChangeText={setAdditivesSearch}
              />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
            {(['all', 'safe', 'mild', 'moderate', 'caution', 'hazardous'] as const).map((filterOpt) => (
              <TouchableOpacity
                key={filterOpt}
                onPress={() => setAdditivesFilter(filterOpt)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: additivesFilter === filterOpt ? colors.brandPrimary : isDark ? '#111324' : '#e2e8f0',
                    borderColor: colors.border,
                  }
                ]}
              >
                <Text style={[styles.filterPillText, { color: additivesFilter === filterOpt ? '#ffffff' : colors.textSecondary }]}>
                  {filterOpt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredAdditives.length === 0 ? (
            <View style={styles.emptyContainer}>
              <XCircle color={colors.textSecondary} size={36} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No additives found</Text>
            </View>
          ) : (
            filteredAdditives.map((item) => (
              <View key={item.code} style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
                <View style={styles.trickHeader}>
                  <Text style={[styles.trickBadge, {
                    backgroundColor: item.hazard === 'hazardous' ? colors.brandHazardous + '15' : item.hazard === 'caution' ? colors.brandCaution + '15' : colors.brandSafe + '15',
                    color: item.hazard === 'hazardous' ? colors.brandHazardous : item.hazard === 'caution' ? colors.brandCaution : colors.brandSafe
                  }]}>{item.code}</Text>
                  <Text style={[styles.trickClaim, { color: colors.textPrimary }]}>{item.name}</Text>
                </View>
                <Text style={[styles.cardSubTitle, { color: colors.textSecondary, fontSize: 10, marginTop: 8, textTransform: 'uppercase' }]}>{item.category || 'Food Additive'}</Text>
                <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 4 }]}>{item.description}</Text>
                {(item as any).info && <Text style={[styles.cardText, { color: colors.brandPrimary, fontSize: 12, marginTop: 6, fontWeight: '600' }]}>{(item as any).info}</Text>}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'portions') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SectionHeader title="Portion Sizes" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            Understanding the difference between "Per Serving" and "Per 100g" is the single most important skill for reading nutrition labels.
          </Text>

          {/* Serving Size Trap */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><PieChart color={colors.brandSecondary} size={16} /> The Serving Size Trap</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardText, { color: colors.textSecondary, marginBottom: 12 }]}>
              Brands set their own serving sizes, often making them ridiculously small so calories and sugars look low on the front.
            </Text>
            <View style={[styles.alertBox, { borderColor: colors.brandHazardous + '30', backgroundColor: colors.brandHazardous + '0a' }]}>
              <Text style={[styles.alertTitle, { color: colors.brandHazardous }]}>Example: A 50g Chocolate Bar</Text>
              <Text style={[styles.cardText, { color: colors.textPrimary, marginTop: 4 }]}>
                • Stated Serving Size: 10g (1/5th of the bar){'\n'}
                • Sugar declared on front: 5g per serving (sounds healthy!){'\n'}
                • <Text style={{ fontWeight: 'bold', color: colors.brandHazardous }}>Reality:</Text> Nobody eats 1/5th of a bar. Eat the whole bar, and you consume <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>25g of sugar</Text>.
              </Text>
            </View>
          </View>

          {/* Always look per 100g */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><Scale color={colors.brandSafe} size={16} /> Always Check "Per 100g"</Text>
          <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardText, { color: colors.textSecondary, marginBottom: 12 }]}>
              Comparing products by their stated serving sizes is misleading. Per 100g is the great equalizer.
            </Text>
            <View style={[styles.miniTable, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderColor: colors.border, marginBottom: 12 }]}>
              <View style={styles.miniTableRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cereal A (30g serving)</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>10g sugar / serving</Text>
              </View>
              <View style={styles.miniTableRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Cereal B (50g serving)</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>12g sugar / serving</Text>
              </View>
            </View>
            <Text style={[styles.cardText, { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 12 }]}>Which is healthier? Look at Per 100g:</Text>
            <View style={styles.goodBadGrid}>
              <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.brandHazardous + '30', flex: 1, padding: 12 }]}>
                <Text style={{ color: colors.brandHazardous, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Cereal A</Text>
                <Text style={{ color: colors.brandHazardous, fontSize: 18, fontWeight: '800', marginTop: 4 }}>33g Sugar</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>per 100g</Text>
              </View>
              <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.brandSafe + '30', flex: 1, padding: 12 }]}>
                <Text style={{ color: colors.brandSafe, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Cereal B</Text>
                <Text style={{ color: colors.brandSafe, fontSize: 18, fontWeight: '800', marginTop: 4 }}>24g Sugar</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>per 100g</Text>
              </View>
            </View>
            <Text style={[styles.cardText, { color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 12 }]}>
              Cereal B has less sugar per gram, making it the healthier choice.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (activeSection === 'boards') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <SectionHeader title="Physical Equivalents" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.paragraph, { color: colors.textSecondary, marginBottom: 20 }]}>
            The physical reality of junk food. We translate abstract numbers on a label into shocking, undeniable visual equivalents.
          </Text>

          {/* Sugar Board */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary }]}><Droplet color={colors.brandHazardous} size={16} /> Sugar Board Equivalents</Text>
          {SUGAR_BOARD.map((item, idx) => (
            <View key={idx} style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
              <Text style={[styles.boardName, { color: colors.textPrimary }]}>{item.name}</Text>
              <View style={styles.boardStatsRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Total Sugar: <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{item.sugarGrams}g</Text></Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Teaspoons: <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{item.cubes} tsp</Text></Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>RDA limit: <Text style={{ color: item.color, fontWeight: 'bold' }}>{item.daily}%</Text></Text>
              </View>
              <Text style={[styles.cardText, { color: colors.textSecondary, fontSize: 11, marginBottom: 6, fontWeight: 'bold', marginTop: 10 }]}>Equivalent Sugar Cubes:</Text>
              {renderVisualCubes(item.cubes, item.color)}
            </View>
          ))}

          {/* Salt Board */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary, marginTop: 15 }]}><Scale color={colors.brandCaution} size={16} /> Sodium Board Equivalents</Text>
          {SALT_BOARD.map((item, idx) => (
            <View key={idx} style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
              <Text style={[styles.boardName, { color: colors.textPrimary }]}>{item.name}</Text>
              <View style={styles.boardStatsRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Sodium: <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{item.sodium}mg</Text></Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>RDA %: <Text style={{ color: item.color, fontWeight: 'bold' }}>{item.percent}%</Text></Text>
              </View>
              <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 8 }]}>{item.description}</Text>
            </View>
          ))}

          {/* Fat Board */}
          <Text style={[styles.subHeadingTitle, { color: colors.textPrimary, marginTop: 15 }]}><AlertTriangle color="#fb923c" size={16} /> Fats & Seed Oil Board</Text>
          {FAT_BOARD.map((item, idx) => (
            <View key={idx} style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
              <Text style={[styles.boardName, { color: colors.textPrimary }]}>{item.name}</Text>
              <View style={styles.boardStatsRow}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Total Fat: <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{item.fatGrams}g</Text></Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Trans Fat: <Text style={{ color: colors.brandHazardous, fontWeight: 'bold' }}>{item.transFat}g</Text></Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Oil Used: <Text style={{ color: '#fb923c', fontWeight: 'bold' }}>{item.seedOil}</Text></Text>
              </View>
              <Text style={[styles.cardText, { color: colors.textSecondary, marginTop: 8 }]}>{item.description}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN HUD SCREEN
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Glow */}
        {isDark && <View style={styles.glowBlob} />}

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>Learning Center</Text>
        </View>
        <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
          Master the art of reading food labels and become immune to misleading packaging.
        </Text>

        {/* Core Guides Section */}
        <View style={styles.sectionLabelRow}>
          <Sparkles color={colors.brandPrimary} size={14} />
          <Text style={[styles.sectionLabel, { color: colors.brandPrimary }]}>Core Masterclasses</Text>
        </View>
        <View style={styles.twoColRow}>
          <TouchableOpacity
            style={[styles.masterCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => setActiveSection('label')}
          >
            <View style={[styles.masterIconBg, { backgroundColor: colors.brandPrimary + '15' }]}>
              <Search color={colors.brandPrimary} size={22} />
            </View>
            <Text style={[styles.masterTitle, { color: colors.textPrimary }]}>Label Literacy</Text>
            <Text style={[styles.masterDesc, { color: colors.textSecondary }]}>Decode ingredients & nutrition tables.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.masterCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => setActiveSection('packaging')}
          >
            <View style={[styles.masterIconBg, { backgroundColor: colors.brandSecondary + '15' }]}>
              <Box color={colors.brandSecondary} size={22} />
            </View>
            <Text style={[styles.masterTitle, { color: colors.textPrimary }]}>Honest Packaging</Text>
            <Text style={[styles.masterDesc, { color: colors.textSecondary }]}>Transparency criteria for clean branding.</Text>
          </TouchableOpacity>
        </View>

        {/* Deep Dives */}
        <View style={styles.sectionLabelRow}>
          <BookOpen color={colors.brandSecondary} size={14} />
          <Text style={[styles.sectionLabel, { color: colors.brandSecondary }]}>Deep Dives</Text>
        </View>
        <View style={styles.gridContainer}>
          {[
            { id: 'sugars', title: 'Hidden Sugars', icon: Droplet, color: colors.brandHazardous, bg: colors.brandHazardous + '12' },
            { id: 'claims', title: 'Food Claims', icon: ShieldCheck, color: colors.brandPrimary, bg: colors.brandPrimary + '12' },
            { id: 'additives', title: 'Additives & E-Nos', icon: AlertTriangle, color: colors.brandCaution, bg: colors.brandCaution + '12' },
            { id: 'portions', title: 'Portion Sizes', icon: PieChart, color: colors.brandSecondary, bg: colors.brandSecondary + '12' }
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.82}
                onPress={() => setActiveSection(item.id as Section)}
              >
                <View style={[styles.gridIconCircle, { backgroundColor: item.bg }]}>
                  <IconComponent color={item.color} size={20} />
                </View>
                <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Nutrition Boards */}
        <View style={styles.sectionLabelRow}>
          <Scale color={colors.brandSafe} size={14} />
          <Text style={[styles.sectionLabel, { color: colors.brandSafe }]}>Nutrition Boards</Text>
        </View>
        <TouchableOpacity
          style={[styles.boardsWideCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.82}
          onPress={() => setActiveSection('boards')}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.boardsWideTitle, { color: colors.textPrimary }]}>Physical Equivalents</Text>
            <Text style={[styles.boardsWideDesc, { color: colors.textSecondary }]}>
              See the shocking real-life equivalents of sugar, salt, and fat in foods.
            </Text>
            <View style={[styles.tag, { alignSelf: 'flex-start', marginTop: 10, backgroundColor: colors.brandSecondary + '15', borderColor: colors.brandSecondary + '30' }]}>
              <Text style={[styles.tagText, { color: colors.brandSecondary, fontSize: 8 }]}>Inspired by FoodPharmer</Text>
            </View>
          </View>
          <View style={[styles.boardsIconBox, { backgroundColor: colors.brandHazardous + '15' }]}>
            <AlertTriangle color={colors.brandHazardous} size={22} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  glowBlob: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99,102,241,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
  },
  mainSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  masterCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  masterIconBg: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  masterDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 5,
    elevation: 1,
  },
  gridIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  boardsWideCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  boardsWideTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  boardsWideDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  boardsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 18,
  },
  subHeadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },
  cardSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
  },
  miniTable: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  miniTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  feedbackBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  trickRow: {
    marginBottom: 12,
  },
  trickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trickBadge: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trickClaim: {
    fontSize: 14,
    fontWeight: '800',
  },
  trafficRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  trafficDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  trafficTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  goodBadGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  filterPillsRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  boardName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  boardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cubesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  cubeBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sourcesContainer: {
    marginTop: 12,
  },
  sourcesLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
