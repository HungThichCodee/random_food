import type { FoodResponseDto } from '../types/food';

// The previous random page used these public food photos as suggestions.
// A dish-specific ImageUrl from the API always takes precedence.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=75`;
const allowedImageOrigins = new Set([
  'https://images.unsplash.com',
  'https://upload.wikimedia.org',
  ...(import.meta.env.VITE_FOOD_IMAGE_ORIGINS || '').split(',')
    .map((origin: string) => origin.trim().replace(/\/$/, '')).filter(Boolean),
]);

export function safeFoodImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password &&
      allowedImageOrigins.has(url.origin) ? url.href : null;
  } catch {
    return null;
  }
}

export function suggestedFoodImage(food: FoodResponseDto): string {
  const name = food.name.toLocaleLowerCase('vi');
  const vegetarian = food.tags.some((tag) => tag.toLocaleLowerCase('vi') === 'chay');

  if (name.includes('chè')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Banana%2C_tapioca%2C_coconut_creme_Vietnamese_pudding_%28che_chuoi%29_-_28356997961.jpg';
  if (name.includes('sinh tố')) return unsplash('photo-1638176066666-ffb2f5d306b3');
  if (name.includes('nước mía')) return unsplash('photo-1546173159-315724a31696');
  if (name.includes('cà phê')) return unsplash('photo-1509042239860-f550ce710b93');
  if (name.includes('salad')) return unsplash('photo-1540420773420-3366772f4999');
  if (vegetarian && (name.includes('phở') || name.includes('hủ tiếu') || name.includes('miến')))
    return unsplash('photo-1569718212165-3a8278d5f624');
  if (vegetarian) return unsplash('photo-1512621776951-a57141f2eefd');
  if (name.includes('bún bò')) return 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bun-Bo-Hue-from-Huong-Giang-2011.jpg';
  if (name.includes('bún riêu')) return 'https://upload.wikimedia.org/wikipedia/commons/d/df/Bun_Rieu.jpg';
  if (name.includes('bún đậu')) return 'https://upload.wikimedia.org/wikipedia/commons/1/11/B%C3%BAn_%C4%91%E1%BA%ADu_m%E1%BA%AFm_t%C3%B4m_%282019%29.jpg';
  if (name.includes('phở')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Pho_bo.jpg';
  if (name.includes('bún cá') || name.includes('chả cá')) return unsplash('photo-1582878826629-29b7ad1cdc43');
  if (name.includes('gỏi cuốn')) return 'https://upload.wikimedia.org/wikipedia/commons/6/61/G%E1%BB%8Fi_cu%E1%BB%91n.jpg';
  if (name.includes('bánh mì')) return 'https://upload.wikimedia.org/wikipedia/commons/6/6c/B%C3%A1nh_m%C3%AC_th%E1%BB%8Bt_ngu%E1%BB%99i.jpg';
  if (name.includes('cơm tấm') || name.includes('sườn')) return 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Com-Tam-2008.jpg';
  if (name.includes('bánh xèo')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a5/B%C3%A1nh_x%C3%A8o_with_n%C6%B0%E1%BB%9Bc_m%E1%BA%AFm.jpg';
  if (name.includes('bánh tráng')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Mixed_rice_paper.jpg';
  if (name.includes('bò')) return 'https://upload.wikimedia.org/wikipedia/commons/7/78/Product_Shots_of_Food-Bo_Luc_Lac.jpg';
  if (name.includes('gà')) return unsplash('photo-1598515214211-89d3c73ae83b');
  if (name.includes('lẩu')) return unsplash('photo-1547928576-a4a33237cbc3');
  if (name.includes('bánh canh') || name.includes('miến') || name.includes('hủ tiếu'))
    return unsplash('photo-1612927601601-6638404737ce');
  return unsplash('photo-1546069901-ba9599a7e63c');
}
