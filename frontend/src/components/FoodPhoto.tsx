import { useState } from 'react';
import type { FoodResponseDto } from '../types/food';
import catalog from '../utils/foodPhotoCatalog.json';
import { safeFoodImageUrl } from '../utils/foodImages';

type PhotoRecord = {
  file: string;
  source: string;
  author: string;
  license: string;
  licenseUrl: string;
  match: 'exact' | 'representative';
};

const photos = catalog as Record<string, PhotoRecord>;

function dishEmoji(food: FoodResponseDto) {
  const tags = food.tags.map((tag) => tag.toLocaleLowerCase('vi'));
  if (tags.includes('ngọt')) return '🍮';
  if (tags.includes('chay')) return '🥬';
  return food.category === 'Nuoc' ? '🍜' : '🍽️';
}

export default function FoodPhoto({ food, className, eager = false }: {
  food: FoodResponseDto;
  className: string;
  eager?: boolean;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const record = photos[food.name];
  const apiUrl = safeFoodImageUrl(food.imageUrl);
  const sources = record ? [`${import.meta.env.BASE_URL}food-images/${record.file}`] : apiUrl ? [apiUrl] : [];

  return (
    <div className={`${className} relative`}>
      <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden="true">
        {dishEmoji(food)}
      </span>
      {sourceIndex < sources.length && (
        <img
          src={sources[sourceIndex]}
          alt={record?.match === 'representative' ? `Ảnh minh họa món ${food.name}` : food.name}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={() => { setImageLoaded(false); setSourceIndex((index) => index + 1); }}
        />
      )}
      {imageLoaded && sourceIndex === 0 && record && (
        <a href={record.source} target="_blank" rel="noopener noreferrer"
          aria-label={`Nguồn ảnh ${food.name}: ${record.author}, ${record.license}`}
          title={`${record.author} · ${record.license}`}
          className="absolute bottom-1 right-1 z-10 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white no-underline">
          {record.match === 'representative' ? 'Ảnh minh họa · Nguồn' : 'Nguồn ảnh'}
        </a>
      )}
    </div>
  );
}
