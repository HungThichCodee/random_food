import { Link } from 'react-router-dom';
import catalog from '../utils/foodPhotoCatalog.json';

export default function FoodImageCreditsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-safe-top text-on-surface">
      <header className="py-6">
        <Link to="/random" className="inline-flex min-h-11 items-center gap-2 text-primary">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          Về vòng quay
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Nguồn ảnh món ăn</h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Mỗi ảnh có giấy phép riêng của tác giả. Nhãn “ảnh minh họa” cho biết ảnh thể hiện một biến thể gần với món được gợi ý.
        </p>
      </header>
      <ul className="space-y-3">
        {Object.entries(catalog).map(([name, photo]) => (
          <li key={name} id={photo.file.replace(/\.[^.]+$/, '')}
            className="scroll-mt-4 rounded-2xl border border-white/10 bg-surface-container p-4">
            <h2 className="font-bold">{name}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {photo.match === 'representative' ? 'Ảnh minh họa biến thể · ' : ''}Tác giả: {photo.author}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a href={photo.source} target="_blank" rel="noopener noreferrer" className="text-primary underline">Trang ảnh gốc</a>
              <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{photo.license}</a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
