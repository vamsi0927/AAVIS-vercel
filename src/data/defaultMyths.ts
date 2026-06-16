import { FoodMythData } from '../lib/geminiAnalysis';

export const DEFAULT_MYTHS: FoodMythData[] = [
  {
    myth: "Eating carrots will significantly improve your eyesight in the dark.",
    fact: "Carrots are rich in Vitamin A, which is good for eye health, but they won't give you night vision.",
    explanation: "This myth originated from World War II British propaganda to hide the invention of radar from the enemy. While severe Vitamin A deficiency can cause night blindness, eating extra carrots won't improve normal vision.",
    category: "Nutrition",
    sources: [{ name: "Scientific American", url: "https://www.scientificamerican.com/article/fact-or-fiction-carrots-improve-your-vision/" }]
  },
  {
    myth: "MSG (Monosodium Glutamate) causes severe headaches and is bad for your health.",
    fact: "MSG is generally recognized as safe and does not cause headaches in the vast majority of people.",
    explanation: "Decades of scientific research have failed to find a consistent link between MSG and the symptoms of 'Chinese Restaurant Syndrome'. MSG is just a sodium salt of glutamic acid, an amino acid naturally found in tomatoes and cheese.",
    category: "Additives",
    sources: [{ name: "FDA", url: "https://www.fda.gov/food/food-additives-petitions/questions-and-answers-monosodium-glutamate-msg" }]
  },
  {
    myth: "Brown eggs are more nutritious than white eggs.",
    fact: "The color of an egg's shell has no impact on its nutritional value or quality.",
    explanation: "Eggshell color is determined purely by the breed of the hen. White hens typically lay white eggs, and brown hens lay brown eggs. Their nutritional content is dictated entirely by the hen's diet.",
    category: "Nutrition",
    sources: [{ name: "USDA", url: "https://ask.usda.gov/s/article/Are-brown-eggs-more-nutritious-than-white-eggs" }]
  },
  {
    myth: "Microwaving food destroys its nutrients.",
    fact: "Microwaving actually preserves nutrients better than many other cooking methods like boiling.",
    explanation: "Because microwave cooking is fast and uses very little water, it minimizes the breakdown of heat-sensitive vitamins (like Vitamin C) and prevents nutrients from leaching into cooking water.",
    category: "Processing",
    sources: [{ name: "Harvard Health", url: "https://www.health.harvard.edu/staying-healthy/microwave-cooking-and-nutrition" }]
  },
  {
    myth: "Drinking 8 glasses of water a day is mandatory for everyone.",
    fact: "There is no scientific backing for the '8x8' rule; hydration needs vary wildly.",
    explanation: "Your water needs depend on your body size, activity level, and climate. Furthermore, you get a significant amount of your daily hydration from foods like fruits, vegetables, and beverages like tea and coffee.",
    category: "General Health",
    sources: [{ name: "Mayo Clinic", url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256" }]
  },
  {
    myth: "Eating food after 8 PM will automatically turn into fat.",
    fact: "Calories do not tell time. Weight gain is determined by total daily calorie intake, not the clock.",
    explanation: "Your body digests and uses calories the same way regardless of the time of day. Late-night eating is only linked to weight gain because it often involves mindless snacking on calorie-dense foods.",
    category: "Nutrition",
    sources: [{ name: "WebMD", url: "https://www.webmd.com/diet/features/diet-truth-myth-eating-night-causes-weight-gain" }]
  },
  {
    myth: "Organic food is significantly more nutritious than conventionally grown food.",
    fact: "Studies show no significant difference in the nutritional content of organic versus conventional foods.",
    explanation: "While organic farming practices limit synthetic pesticides, the actual vitamin and mineral content of the crops is virtually identical. The primary benefits of organic food are environmental, not nutritional.",
    category: "Organic Claims",
    sources: [{ name: "Stanford Medicine", url: "https://med.stanford.edu/news/all-news/2012/09/little-evidence-of-health-benefits-from-organic-foods-study-finds.html" }]
  },
  {
    myth: "You must eat protein immediately after a workout to build muscle.",
    fact: "The 'anabolic window' lasts much longer than 30 minutes, often up to 24 hours.",
    explanation: "While post-workout protein is beneficial, your total daily protein intake is far more critical for muscle synthesis than the exact timing of consumption.",
    category: "Protein",
    sources: [{ name: "Journal of the International Society of Sports Nutrition", url: "https://jissn.biomedcentral.com/articles/10.1186/1550-2783-10-5" }]
  },
  {
    myth: "Sugar causes hyperactivity in children.",
    fact: "Numerous double-blind studies have found no link between sugar consumption and hyperactive behavior.",
    explanation: "The perceived hyperactivity is usually the result of the exciting environment where sugar is typically consumed (like birthday parties), combined with confirmation bias from the parents.",
    category: "Sugar",
    sources: [{ name: "Yale Scientific", url: "https://www.yalescientific.org/2010/09/mythbusters-does-sugar-really-make-children-hyper/" }]
  },
  {
    myth: "All fats are bad for your heart.",
    fact: "Monounsaturated and polyunsaturated fats actually protect your heart.",
    explanation: "While trans fats are harmful, healthy fats found in avocados, nuts, seeds, and olive oil can lower bad cholesterol levels and are essential for brain health and hormone production.",
    category: "Food Safety",
    sources: [{ name: "AHA", url: "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/dietary-fats" }]
  },
  {
    myth: "Sea salt has significantly less sodium than table salt.",
    fact: "By weight, sea salt and table salt contain exactly the same amount of sodium.",
    explanation: "Sea salt has larger crystals, so a teaspoon may contain less mass (and therefore less sodium) than a teaspoon of table salt, but their chemical composition is identical.",
    category: "General Health",
    sources: [{ name: "Mayo Clinic", url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/expert-answers/sea-salt/faq-20058512" }]
  },
  {
    myth: "Gluten-free diets are healthier for everyone.",
    fact: "Unless you have Celiac disease or gluten sensitivity, a gluten-free diet offers no health benefits.",
    explanation: "Gluten-free replacement products are often highly processed, lower in fiber, and higher in sugar and fat to make up for the lack of gluten's structural properties.",
    category: "Nutrition",
    sources: [{ name: "Harvard Health", url: "https://www.health.harvard.edu/blog/going-gluten-free-just-because-heres-what-you-need-to-know-201302205916" }]
  },
  {
    myth: "Fresh vegetables are always healthier than frozen ones.",
    fact: "Frozen vegetables are often just as nutritious, if not more so, than fresh ones.",
    explanation: "Frozen vegetables are flash-frozen at their peak ripeness, locking in nutrients. Fresh vegetables often lose nutrients during transport and while sitting on grocery store shelves.",
    category: "Processing",
    sources: [{ name: "Cleveland Clinic", url: "https://health.clevelandclinic.org/which-is-better-fresh-or-frozen-produce/" }]
  },
  {
    myth: "Artificial sweeteners will make you gain weight.",
    fact: "Artificial sweeteners themselves contain zero calories and do not directly cause weight gain.",
    explanation: "While some studies suggest they may increase cravings for sweet foods in some individuals, the sweeteners themselves cannot be converted into fat due to a lack of caloric energy.",
    category: "Artificial Sweeteners",
    sources: [{ name: "Mayo Clinic", url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/artificial-sweeteners/art-20046936" }]
  },
  {
    myth: "Eating eggs raises your bad cholesterol significantly.",
    fact: "Dietary cholesterol found in eggs has very little effect on blood cholesterol levels in most people.",
    explanation: "The liver produces the vast majority of cholesterol in your blood. Saturated and trans fats have a much greater impact on raising blood cholesterol than dietary cholesterol does.",
    category: "Cholesterol",
    sources: [{ name: "Harvard Nutrition Source", url: "https://www.hsph.harvard.edu/nutritionsource/what-should-you-eat/fats-and-cholesterol/cholesterol/" }]
  },
  {
    myth: "You shouldn't eat the yolk of an egg because it's unhealthy.",
    fact: "The yolk contains almost all the essential vitamins and minerals of the egg.",
    explanation: "While the egg white contains pure protein, the yolk houses Vitamin D, Vitamin B12, choline, and antioxidants like lutein, which are crucial for brain and eye health.",
    category: "Nutrition",
    sources: [{ name: "Healthline", url: "https://www.healthline.com/nutrition/egg-yolks" }]
  },
  {
    myth: "Vitamin C prevents you from catching a cold.",
    fact: "Taking Vitamin C won't prevent a cold, though it might slightly shorten its duration.",
    explanation: "Extensive clinical trials show that taking Vitamin C regularly does not decrease the likelihood of catching the common cold for the average person, except in extreme physical stress scenarios.",
    category: "Vitamins",
    sources: [{ name: "NIH", url: "https://ods.od.nih.gov/factsheets/VitaminC-Consumer/" }]
  },
  {
    myth: "A detox juice cleanse clears your body of toxins.",
    fact: "Your liver and kidneys are completely responsible for detoxifying your body, not juice.",
    explanation: "There is no scientific evidence that juice cleanses remove toxins. In fact, relying solely on juice starves your body of essential proteins and fiber, often causing muscle loss.",
    category: "Dieting",
    sources: [{ name: "National Center for Complementary and Integrative Health", url: "https://www.nccih.nih.gov/health/detoxes-and-cleanses-what-you-need-to-know" }]
  },
  {
    myth: "Drinking milk increases mucus production.",
    fact: "Milk does not cause your body to produce more phlegm or mucus.",
    explanation: "The texture of milk can make saliva feel thicker temporarily, which mimics the feeling of mucus, but clinical studies show it does not increase actual mucus production in the respiratory tract.",
    category: "General Health",
    sources: [{ name: "Mayo Clinic", url: "https://www.mayoclinic.org/diseases-conditions/common-cold/expert-answers/phlegm/faq-20058015" }]
  },
  {
    myth: "Spicy food causes stomach ulcers.",
    fact: "Ulcers are caused by the H. pylori bacteria or NSAID pain relievers, not spicy food.",
    explanation: "While spicy food can aggravate an existing ulcer or trigger acid reflux, it does not physically create the ulcerations in the stomach lining.",
    category: "Food Safety",
    sources: [{ name: "American College of Gastroenterology", url: "https://gi.org/topics/peptic-ulcer-disease/" }]
  }
];
