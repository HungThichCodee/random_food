import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { foodApi } from '../api/foodApi';
import FoodPhoto from '../components/FoodPhoto';
import type { FoodResponseDto, SuggestResponseDto } from '../types/food';

const categories = [
  { value: '', label: 'Tất cả' },
  { value: 'kho', label: 'Món khô' },
  { value: 'nuoc', label: 'Món nước' },
  { value: 'an_vat', label: 'Ăn vặt' },
  { value: 'healthy', label: 'Chay / healthy' },
];
const prices = [
  { value: '', label: 'Bất kỳ' },
  { value: 'Re', label: 'Rẻ' },
  { value: 'Vua', label: 'Vừa' },
  { value: 'Cao', label: 'Cao' },
];
const meals = [
  { value: '', label: 'Bất kỳ' },
  { value: 'Sang', label: 'Sáng' },
  { value: 'Trua', label: 'Trưa' },
  { value: 'Toi', label: 'Tối' },
  { value: 'Khuya', label: 'Khuya' },
];

function sessionId() {
  let id = localStorage.getItem('foodMatch_sessionId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('foodMatch_sessionId', id);
  }
  return id;
}

export default function SuggestFoodPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [meal, setMeal] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SuggestResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const criteria = useMemo(() => ({
    sessionId: sessionId(),
    category: category || undefined,
    priceRange: price || undefined,
    mealTimes: meal ? [meal] : undefined,
  }), [category, price, meal]);

  useEffect(() => {
    let active = true;
    foodApi.getTagCounts(criteria)
      .then((counts) => { if (active) setTagCounts(counts); })
      .catch(() => { if (active) setTagCounts({}); });
    return () => { active = false; };
  }, [criteria]);

  const toggleTag = (tag: string) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  const search = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await foodApi.suggestFoods({ ...criteria, includedTags: tags });
      setResult(response);
    } catch {
      setError('Không tải được gợi ý. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface pb-28 px-4">
      <div className="max-w-xl mx-auto pt-safe-top">
        <header className="flex items-center justify-between py-5">
          <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center" aria-label="Quay lại">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold">Gợi ý món ăn</h1>
          <span className="w-11" />
        </header>

        <div className="rounded-2xl bg-surface-container p-5 space-y-5">
          <label className="block font-semibold">Loại món
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full p-3 rounded-xl bg-surface-container-high text-on-surface">
              {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block font-semibold">Ngân sách
            <select value={price} onChange={(event) => setPrice(event.target.value)} className="mt-2 w-full p-3 rounded-xl bg-surface-container-high text-on-surface">
              {prices.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="block font-semibold">Buổi ăn
            <select value={meal} onChange={(event) => setMeal(event.target.value)} className="mt-2 w-full p-3 rounded-xl bg-surface-container-high text-on-surface">
              {meals.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="font-semibold mb-2">Khẩu vị</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tagCounts).filter(([, count]) => count > 0).map(([tag, count]) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={tags.includes(tag)}
                  className={`rounded-full px-3 py-2 text-sm border ${tags.includes(tag) ? 'border-primary-container bg-primary-container/20' : 'border-white/10 bg-surface-container-high'}`}>
                  {tag} ({count})
                </button>
              ))}
              {Object.keys(tagCounts).length === 0 && <span className="text-on-surface-variant text-sm">Chưa có khẩu vị phù hợp.</span>}
            </div>
          </fieldset>
          <button type="button" onClick={search} disabled={loading}
            className="w-full h-12 rounded-full bg-primary-container text-white font-bold disabled:opacity-50">
            {loading ? 'Đang tìm...' : 'Tìm món'}
          </button>
        </div>

        {error && <p className="mt-5 p-4 rounded-xl bg-error/10 text-error" role="alert">{error}</p>}
        {result && (
          <section className="mt-7 space-y-3" aria-live="polite">
            <h2 className="text-xl font-bold">{result.items.length} món phù hợp</h2>
            <Link to="/image-credits" className="inline-block text-sm text-primary underline">Nguồn ảnh món ăn</Link>
            {result.message && <p className="text-on-surface-variant">{result.message}</p>}
            {result.items.length === 0 && <p className="rounded-xl bg-surface-container p-4">Không tìm thấy món phù hợp. Hãy thử đổi tiêu chí.</p>}
            {result.items.map((food: FoodResponseDto) => (
              <article key={food.id} className="rounded-2xl bg-surface-container p-5 border border-white/10">
                <FoodPhoto food={food} className="mb-4 h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container/20 to-secondary/10" />
                <h3 className="font-bold text-lg">{food.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2 text-sm text-on-surface-variant">
                  {food.avgPriceRange && <span>Giá: {food.avgPriceRange}</span>}
                  {food.mealTime && <span>Buổi: {food.mealTime}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {food.tags.map((tag) => <span key={tag} className="rounded-full px-3 py-1 bg-surface-container-high text-sm">{tag}</span>)}
                </div>
                <button type="button" onClick={() => navigate(`/map?search=${encodeURIComponent(food.name)}`)}
                  className="mt-4 px-4 py-2 rounded-full bg-primary-container text-white">Tìm quán gần tôi</button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
