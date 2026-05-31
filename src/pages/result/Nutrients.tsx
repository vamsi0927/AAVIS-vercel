import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SAMPLE_PRODUCTS } from '../../data/sampleProducts';
import { NutrientBar } from '../../components/NutrientBar';
import { isBeverage } from '../../lib/scoring';
const RDA = {
  calories: 2000,
  sugar: 50,
  sodium: 2300,
  fat: 78,
  satFat: 20,
  protein: 50,
  fiber: 28,
  carbs: 275
};
export function ResultNutrients() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { scans } = useAppContext();
  const scan = scans.find((s) => s.id === id);
  const product = scan?.product || (scan ? SAMPLE_PRODUCTS.find((p) => p.id === scan.productId) : null);
  if (!product) return null;
  const n = {
    calories: product.nutrients.calories ?? 0,
    sugar: product.nutrients.sugar ?? 0,
    sodium: product.nutrients.sodium ?? 0,
    fat: product.nutrients.fat ?? 0,
    satFat: product.nutrients.satFat ?? 0,
    carbs: product.nutrients.carbs ?? 0,
    protein: product.nutrients.protein ?? 0,
    fiber: product.nutrients.fiber ?? 0,
  };
  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white">
          
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="ml-2">
          <h1 className="font-display font-bold text-lg">Nutrient Breakdown</h1>
          <p className="text-xs text-content-secondary">{product.name}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        <span className="text-xs font-medium text-navy-400 bg-white px-3 py-1 rounded-full border border-navy-100">
          Per {product.nutrients.unit || (isBeverage(product) ? '100ml' : '100g')}
        </span>

        <div className="space-y-1">
          <NutrientBar
            label="Calories"
            value={n.calories}
            unit="kcal"
            max={800}
            highThreshold={500}
            medThreshold={250} />
          
          <NutrientBar
            label="Sugar"
            value={n.sugar}
            unit="g"
            max={50}
            highThreshold={22.5}
            medThreshold={5} />
          
          <NutrientBar
            label="Sodium"
            value={n.sodium}
            unit="mg"
            max={2000}
            highThreshold={600}
            medThreshold={120} />
          
          <NutrientBar
            label="Total Fat"
            value={n.fat}
            unit="g"
            max={50}
            highThreshold={17.5}
            medThreshold={3} />
          
          <NutrientBar
            label="Saturated Fat"
            value={n.satFat}
            unit="g"
            max={20}
            highThreshold={5}
            medThreshold={1.5} />
          
          <NutrientBar
            label="Carbohydrates"
            value={n.carbs}
            unit="g"
            max={100}
            highThreshold={60}
            medThreshold={20} />
          
          <NutrientBar
            label="Protein"
            value={n.protein}
            unit="g"
            max={30}
            highThreshold={10}
            medThreshold={5}
            inverse />
          
          <NutrientBar
            label="Fiber"
            value={n.fiber}
            unit="g"
            max={20}
            highThreshold={5}
            medThreshold={2}
            inverse />
          
        </div>

        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4">
          <h3 className="font-semibold mb-3 text-content-primary">
            % of Daily Value
          </h3>
          <div className="space-y-2 text-sm">
            {[
            {
              label: 'Calories',
              val: n.calories,
              rda: RDA.calories
            },
            {
              label: 'Sugar',
              val: n.sugar,
              rda: RDA.sugar
            },
            {
              label: 'Sodium',
              val: n.sodium,
              rda: RDA.sodium
            },
            {
              label: 'Saturated Fat',
              val: n.satFat,
              rda: RDA.satFat
            },
            {
              label: 'Protein',
              val: n.protein,
              rda: RDA.protein
            },
            {
              label: 'Fiber',
              val: n.fiber,
              rda: RDA.fiber
            }].
            map((item) =>
            <div key={item.label} className="flex justify-between">
                <span className="text-content-secondary">{item.label}</span>
                <span className="font-medium text-content-primary">
                  {Math.round(item.val / item.rda * 100)}%
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-content-secondary mt-3 pt-3 border-t border-navy-700">
            Based on a 2,000 kcal/day reference diet.
          </p>
        </div>
      </div>
    </div>);

}