import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFoodStore } from '../stores/useFoodStore';
import { useUserStore } from '../stores/useUserStore';
import logoImg from '../assert/logo.png';
import { v4 as uuidv4 } from 'uuid';

interface WheelItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  angle: number; // 0, 45, 90, 135, 180, 225, 270, 315
  desc: string;
  price: string;
  mealTime: string;
  rating: number;
  imageUrl: string;
  tags: string[];
  nearbyCount: number;
}

const WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'pho-bo',
    name: '🍜 Phở Bò Tái Lăn',
    shortName: '🍜 Phở Bò',
    category: 'nuoc',
    angle: 0,
    desc: 'Hà Nội Xưa - Thơm mùi tỏi phi & gừng cháy cạnh',
    price: '45.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozgiPOAkNyDO6x1RBZXTQBQ_ammku9BlABeo5X2RO8ZVriEZpk_XizbZ6Sj0YgE-ofQDeuuMZZ48UIfAvXaliK8PcUN6DdoZ7aVpdnz1URDcDLpj-OlwVQaVHlutbZOy5m9ONL5GhFK7eOk1Qr8IZhahtWU59-fRqughogBEY2BsrlHn0VfyWKK8N7UPO2WTveaNaNHVSZ1rxpOm7aGCnEmsmES5MEiW_4exZaHAZi12ICLKeM-_NTg',
    tags: ['#ĐậmĐà', '#BòMềm', '#QuẩyGiòn'],
    nearbyCount: 14,
  },
  {
    id: 'banh-mi',
    name: '🥖 Bánh Mì Đặc Biệt',
    shortName: '🥖 Bánh Mì',
    category: 'kho',
    angle: 45,
    desc: 'Pate béo ngậy, thịt xá xíu, chả lụa & dưa leo giòn rụm',
    price: '25.000đ - 40.000đ',
    mealTime: 'Sáng & Chiều',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['#NhanhGọn', '#GiònTan', '#PateThơm'],
    nearbyCount: 22,
  },
  {
    id: 'com-tam',
    name: '🍖 Cơm Tấm Sườn Bì',
    shortName: '🍖 Cơm Tấm',
    category: 'kho',
    angle: 90,
    desc: 'Sườn nướng than hoa thơm lừng, mỡ hành óng ánh',
    price: '40.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['#SườnMềm', '#MỡHành', '#ĐậmVị'],
    nearbyCount: 18,
  },
  {
    id: 'bun-bo',
    name: '🍲 Bún Bò Huế Cố Đô',
    shortName: '🍲 Bún Bò',
    category: 'nuoc',
    angle: 135,
    desc: 'Nước dùng cay nồng sả ớt, chả cua & bắp bò giòn sần sật',
    price: '50.000đ - 70.000đ',
    mealTime: 'Sáng & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['#CayNồng', '#ChảCua', '#NướcDùngĐậm'],
    nearbyCount: 11,
  },
  {
    id: 'lau-thai',
    name: '🥘 Lẩu Thái Chua Cay',
    shortName: '🥘 Lẩu Thái',
    category: 'nuoc',
    angle: 180,
    desc: 'Hải sản tươi rói, lá chanh chúc thơm ngát kích thích vị giác',
    price: '150.000đ - 220.000đ',
    mealTime: 'Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['#ChuaCay', '#HảiSản', '#ĂnNhóm'],
    nearbyCount: 8,
  },
  {
    id: 'goi-cuon',
    name: '🥗 Gỏi Cuốn Tôm Thịt',
    shortName: '🥗 Gỏi Cuốn',
    category: 'healthy',
    angle: 225,
    desc: 'Tươi mát, chấm tương đậu phộng béo bùi chuẩn bài',
    price: '30.000đ - 50.000đ',
    mealTime: 'Xế chiều',
    rating: 4.7,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['#ThanhMát', '#ÍtCalo', '#TươngBùi'],
    nearbyCount: 15,
  },
  {
    id: 'ga-nuong',
    name: '🍗 Gà Nướng Cơm Lam',
    shortName: '🍗 Gà Nướng',
    category: 'kho',
    angle: 270,
    desc: 'Gà tre nướng da giòn sốt ớt hiểm kèm cơm lam dẻo thơm',
    price: '120.000đ - 180.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['#DaGiòn', '#ỚtHiểm', '#ĐặcSản'],
    nearbyCount: 7,
  },
  {
    id: 'bun-dau',
    name: '🍱 Bún Đậu Mắm Tôm',
    shortName: '🍱 Bún Đậu',
    category: 'an_vat',
    angle: 315,
    desc: 'Đậu hũ rán vàng phồng, nem chua rán & mắm tôm đánh bọt',
    price: '55.000đ - 85.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['#MắmTôm', '#ĐậuGiòn', '#ChảCốm'],
    nearbyCount: 19,
  },
];

const KHO_WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'banh-mi',
    name: '🥖 Bánh Mì Đặc Biệt',
    shortName: '🥖 Bánh Mì',
    category: 'kho',
    angle: 0,
    desc: 'Pate béo ngậy, thịt xá xíu, chả lụa & dưa leo giòn rụm',
    price: '25.000đ - 40.000đ',
    mealTime: 'Sáng & Chiều',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Khô', 'Bánh Mì', 'Nhanh'],
    nearbyCount: 22,
  },
  {
    id: 'com-tam',
    name: '🍖 Cơm Tấm Sườn Bì',
    shortName: '🍖 Cơm Tấm',
    category: 'kho',
    angle: 45,
    desc: 'Sườn nướng than hoa thơm lừng, mỡ hành óng ánh',
    price: '40.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Khô', 'Sườn Nướng', 'Cơm'],
    nearbyCount: 18,
  },
  {
    id: 'bun-thit-nuong',
    name: '🥗 Bún Thịt Nướng Chả Giò',
    shortName: '🥗 Bún Thịt Nướng',
    category: 'kho',
    angle: 90,
    desc: 'Thịt xiên nướng than vàng ươm, chả giò giòn rụm & nước mắm chua ngọt',
    price: '40.000đ - 60.000đ',
    mealTime: 'Trưa & Chiều',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Khô', 'Thịt Nướng', 'Bún'],
    nearbyCount: 14,
  },
  {
    id: 'com-ga',
    name: '🍗 Cơm Gà Hội An',
    shortName: '🍗 Cơm Gà',
    category: 'kho',
    angle: 135,
    desc: 'Gà ta xé bóp gỏi hành tây rau răm, cơm nấu nước luộc gà vàng ươm',
    price: '45.000đ - 70.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Khô', 'Gà Ta', 'Cơm'],
    nearbyCount: 12,
  },
  {
    id: 'banh-xeo',
    name: '🥞 Bánh Xèo Miền Tây',
    shortName: '🥞 Bánh Xèo',
    category: 'kho',
    angle: 180,
    desc: 'Vỏ bánh giòn rụm màu nghệ, nhân tôm thịt giá đỗ cuốn rau rừng',
    price: '50.000đ - 80.000đ',
    mealTime: 'Chiều & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Khô', 'Giòn Rụm', 'Rau Rừng'],
    nearbyCount: 9,
  },
  {
    id: 'ga-nuong-kho',
    name: '🍗 Gà Nướng Cơm Lam',
    shortName: '🍗 Gà Cơm Lam',
    category: 'kho',
    angle: 225,
    desc: 'Gà nướng mọi da giòn sốt ớt xanh kèm cơm lam dẻo thơm',
    price: '120.000đ - 180.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Khô', 'Đặc Sản', 'Nướng'],
    nearbyCount: 7,
  },
  {
    id: 'nem-nuong',
    name: '🍢 Nem Nướng Nha Trang',
    shortName: '🍢 Nem Nướng',
    category: 'kho',
    angle: 270,
    desc: 'Nem nướng thơm lừng kèm ram bắp giòn rụm & nước chấm tương thịt ấm nóng',
    price: '45.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Khô', 'Nem Nướng', 'Ngon'],
    nearbyCount: 15,
  },
  {
    id: 'bo-luc-lac',
    name: '🥩 Bò Lúc Lắc Khoai Tây',
    shortName: '🥩 Bò Lúc Lắc',
    category: 'kho',
    angle: 315,
    desc: 'Bò mềm xào sốt tiêu đen, ớt chuông & khoai tây chiên giòn',
    price: '70.000đ - 110.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Khô', 'Bò', 'Xào'],
    nearbyCount: 11,
  },
];

const NUOC_WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'pho-bo-nuoc',
    name: '🍜 Phở Bò Tái Lăn',
    shortName: '🍜 Phở Bò',
    category: 'nuoc',
    angle: 0,
    desc: 'Hà Nội Xưa - Thơm mùi tỏi phi & gừng cháy cạnh',
    price: '45.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozgiPOAkNyDO6x1RBZXTQBQ_ammku9BlABeo5X2RO8ZVriEZpk_XizbZ6Sj0YgE-ofQDeuuMZZ48UIfAvXaliK8PcUN6DdoZ7aVpdnz1URDcDLpj-OlwVQaVHlutbZOy5m9ONL5GhFK7eOk1Qr8IZhahtWU59-fRqughogBEY2BsrlHn0VfyWKK8N7UPO2WTveaNaNHVSZ1rxpOm7aGCnEmsmES5MEiW_4exZaHAZi12ICLKeM-_NTg',
    tags: ['Nước', 'Phở', 'Bò'],
    nearbyCount: 16,
  },
  {
    id: 'bun-bo-hue-nuoc',
    name: '🍲 Bún Bò Huế Cố Đô',
    shortName: '🍲 Bún Bò Huế',
    category: 'nuoc',
    angle: 45,
    desc: 'Nước dùng cay nồng sả ớt, chả cua & bắp bò giòn sần sật',
    price: '50.000đ - 70.000đ',
    mealTime: 'Sáng & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['Nước', 'Cay Nồng', 'Bún Bò'],
    nearbyCount: 14,
  },
  {
    id: 'lau-thai-nuoc',
    name: '🥘 Lẩu Thái Chua Cay',
    shortName: '🥘 Lẩu Thái',
    category: 'nuoc',
    angle: 90,
    desc: 'Hải sản tươi rói, lá chanh chúc thơm ngát kích thích vị giác',
    price: '150.000đ - 220.000đ',
    mealTime: 'Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Nước', 'Chua Cay', 'Hải Sản'],
    nearbyCount: 8,
  },
  {
    id: 'bun-rieu-nuoc',
    name: '🍲 Bún Riêu Cua Đồng',
    shortName: '🍲 Bún Riêu Cua',
    category: 'nuoc',
    angle: 135,
    desc: 'Riêu cua đồng béo ngậy, đậu rán phồng & cà chua giấm bỗng chua dịu',
    price: '40.000đ - 55.000đ',
    mealTime: 'Sáng & Trưa',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['Nước', 'Cua Đồng', 'Bún Riêu'],
    nearbyCount: 13,
  },
  {
    id: 'hu-tieu-nuoc',
    name: '🍜 Hủ Tiếu Nam Vang',
    shortName: '🍜 Hủ Tiếu',
    category: 'nuoc',
    angle: 180,
    desc: 'Nước lèo hầm xương ngọt thanh, tôm sú tươi, thịt bằm & trứng cút',
    price: '45.000đ - 65.000đ',
    mealTime: 'Sáng & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozgiPOAkNyDO6x1RBZXTQBQ_ammku9BlABeo5X2RO8ZVriEZpk_XizbZ6Sj0YgE-ofQDeuuMZZ48UIfAvXaliK8PcUN6DdoZ7aVpdnz1URDcDLpj-OlwVQaVHlutbZOy5m9ONL5GhFK7eOk1Qr8IZhahtWU59-fRqughogBEY2BsrlHn0VfyWKK8N7UPO2WTveaNaNHVSZ1rxpOm7aGCnEmsmES5MEiW_4exZaHAZi12ICLKeM-_NTg',
    tags: ['Nước', 'Hủ Tiếu', 'Tôm Thịt'],
    nearbyCount: 15,
  },
  {
    id: 'banh-canh-nuoc',
    name: '🍲 Bánh Canh Cua Biển',
    shortName: '🍲 Bánh Canh Cua',
    category: 'nuoc',
    angle: 225,
    desc: 'Sợi bánh canh dai mềm, nước sốt sền sệt ngọt đậm đà thịt cua biển',
    price: '55.000đ - 85.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['Nước', 'Cua Biển', 'Bánh Canh'],
    nearbyCount: 9,
  },
  {
    id: 'bun-ca-nuoc',
    name: '🍜 Bún Cá Quy Nhơn',
    shortName: '🍜 Bún Cá',
    category: 'nuoc',
    angle: 270,
    desc: 'Chả cá thu dai ngọt, nước dùng nấu thơm cà chua thanh mát chuẩn vị biển',
    price: '40.000đ - 55.000đ',
    mealTime: 'Sáng & Trưa',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozgiPOAkNyDO6x1RBZXTQBQ_ammku9BlABeo5X2RO8ZVriEZpk_XizbZ6Sj0YgE-ofQDeuuMZZ48UIfAvXaliK8PcUN6DdoZ7aVpdnz1URDcDLpj-OlwVQaVHlutbZOy5m9ONL5GhFK7eOk1Qr8IZhahtWU59-fRqughogBEY2BsrlHn0VfyWKK8N7UPO2WTveaNaNHVSZ1rxpOm7aGCnEmsmES5MEiW_4exZaHAZi12ICLKeM-_NTg',
    tags: ['Nước', 'Hải Sản', 'Bún Cá'],
    nearbyCount: 14,
  },
  {
    id: 'mien-luon-nuoc',
    name: '🍲 Miến Lươn Xứ Nghệ',
    shortName: '🍲 Miến Lươn',
    category: 'nuoc',
    angle: 315,
    desc: 'Lươn đồng xào săn cay nồng hoặc chiên giòn, nước dùng xương lươn ngọt lịm',
    price: '50.000đ - 70.000đ',
    mealTime: 'Sáng & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['Nước', 'Lươn Đồng', 'Miến'],
    nearbyCount: 8,
  },
];

const AN_VAT_WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'bun-dau-an-vat',
    name: '🍱 Bún Đậu Mắm Tôm',
    shortName: '🍱 Bún Đậu',
    category: 'an_vat',
    angle: 0,
    desc: 'Đậu hũ rán giòn phồng, nem chua rán, chả cốm & mắm tôm đánh bọt tắc',
    price: '55.000đ - 85.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Ăn Vặt', 'Mắm Tôm', 'Hot'],
    nearbyCount: 19,
  },
  {
    id: 'banh-trang-tron',
    name: '🍢 Bánh Tráng Trộn Sài Gòn',
    shortName: '🍢 Bánh Tráng Trộn',
    category: 'an_vat',
    angle: 45,
    desc: 'Bánh tráng dẻo, bò khô cay xé, trứng cút, xoài xanh & sốt me tắc',
    price: '20.000đ - 35.000đ',
    mealTime: 'Xế chiều',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Ăn Vặt', 'Chua Cay', 'Học Sinh'],
    nearbyCount: 25,
  },
  {
    id: 'banh-trang-nuong',
    name: '🍕 Bánh Tráng Nướng Đà Lạt',
    shortName: '🍕 Bánh Tráng Nướng',
    category: 'an_vat',
    angle: 90,
    desc: 'Pizza Việt Nam nướng than hồng, trứng gà, tép khô, phô mai & hành phi',
    price: '25.000đ - 40.000đ',
    mealTime: 'Chiều & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Ăn Vặt', 'Nóng Hổi', 'Nướng'],
    nearbyCount: 16,
  },
  {
    id: 'nem-chua-ran',
    name: '🍢 Nem Chua Rán Giòn Rụm',
    shortName: '🍢 Nem Chua Rán',
    category: 'an_vat',
    angle: 135,
    desc: 'Nem chua tẩm bột chiên vàng ươm, chấm tương ớt cay nồng chuẩn vị Hà Nội',
    price: '30.000đ - 50.000đ',
    mealTime: 'Chiều & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Ăn Vặt', 'Chiên Giòn', 'Cay'],
    nearbyCount: 20,
  },
  {
    id: 'bot-chien',
    name: '🍳 Bột Chiên Trứng Giòn',
    shortName: '🍳 Bột Chiên',
    category: 'an_vat',
    angle: 180,
    desc: 'Từng miếng bột chiên giòn rụm bên ngoài mềm dẻo bên trong, kèm đu đủ bào sợi',
    price: '30.000đ - 45.000đ',
    mealTime: 'Chiều & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Ăn Vặt', 'Trứng', 'Đặc Sản'],
    nearbyCount: 12,
  },
  {
    id: 'cha-gio',
    name: '🥟 Chả Giò Rế Giòn Rụm',
    shortName: '🥟 Chả Giò Rế',
    category: 'an_vat',
    angle: 225,
    desc: 'Vỏ bánh tráng rế chiên vàng rộm giòn tan, nhân tôm thịt mộc nhĩ đậm đà',
    price: '35.000đ - 60.000đ',
    mealTime: 'Trưa & Chiều',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Ăn Vặt', 'Chiên Giòn', 'Tôm Thịt'],
    nearbyCount: 17,
  },
  {
    id: 'che-khuc-bach',
    name: '🍨 Chè Khúc Bạch Hạnh Nhân',
    shortName: '🍨 Chè Khúc Bạch',
    category: 'an_vat',
    angle: 270,
    desc: 'Viên khúc bạch phô mai sữa béo mịn, vải thiều ngọt lịm & lát hạnh nhân rang',
    price: '30.000đ - 45.000đ',
    mealTime: 'Xế chiều & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Ăn Vặt', 'Tráng Miệng', 'Ngọt Mát'],
    nearbyCount: 15,
  },
  {
    id: 'sinh-to-bo',
    name: '🥑 Sinh Tố Bơ Đắk Lắk',
    shortName: '🥑 Sinh Tố Bơ',
    category: 'an_vat',
    angle: 315,
    desc: 'Bơ sáp béo ngậy xay cùng sữa đặc và đá bào mát lạnh thơm phức',
    price: '30.000đ - 45.000đ',
    mealTime: 'Cả ngày',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Ăn Vặt', 'Đồ Uống', 'Bổ Dưỡng'],
    nearbyCount: 21,
  },
];

const CHAY_WHEEL_ITEMS: WheelItem[] = [
  {
    id: 'com-chay',
    name: '🍱 Cơm Chay Thập Cẩm',
    shortName: '🍱 Cơm Chay',
    category: 'healthy',
    angle: 0,
    desc: 'Đậu hũ kho nấm, chả lụa chay & rau củ xào tươi ngon',
    price: '30.000đ - 45.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Chay', 'Healthy', 'Rau'],
    nearbyCount: 12,
  },
  {
    id: 'pho-chay',
    name: '🍜 Phở Chay Nấm Hương',
    shortName: '🍜 Phở Chay',
    category: 'healthy',
    angle: 45,
    desc: 'Nước dùng rau củ ngọt thanh, nấm đùi gà & tàu hũ ky giòn rụm',
    price: '40.000đ - 55.000đ',
    mealTime: 'Sáng & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDozgiPOAkNyDO6x1RBZXTQBQ_ammku9BlABeo5X2RO8ZVriEZpk_XizbZ6Sj0YgE-ofQDeuuMZZ48UIfAvXaliK8PcUN6DdoZ7aVpdnz1URDcDLpj-OlwVQaVHlutbZOy5m9ONL5GhFK7eOk1Qr8IZhahtWU59-fRqughogBEY2BsrlHn0VfyWKK8N7UPO2WTveaNaNHVSZ1rxpOm7aGCnEmsmES5MEiW_4exZaHAZi12ICLKeM-_NTg',
    tags: ['Chay', 'Healthy', 'Rau'],
    nearbyCount: 8,
  },
  {
    id: 'bun-rieu-chay',
    name: '🍲 Bún Riêu Chay Đậu Hũ',
    shortName: '🍲 Bún Riêu Chay',
    category: 'healthy',
    angle: 90,
    desc: 'Riêu đậu hũ nấm thơm béo, cà chua đỏ mọng & chả huế chay',
    price: '35.000đ - 50.000đ',
    mealTime: 'Sáng & Trưa',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['Chay', 'Healthy', 'Rau'],
    nearbyCount: 9,
  },
  {
    id: 'goi-cuon-chay',
    name: '🥗 Gỏi Cuốn Chay Nấm',
    shortName: '🥗 Cuốn Chay',
    category: 'healthy',
    angle: 135,
    desc: 'Đậu hũ áp chảo, nấm xào, rau thơm cuốn bánh tráng chấm tương bơ đậu phộng',
    price: '25.000đ - 40.000đ',
    mealTime: 'Trưa & Xế chiều',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Chay', 'Healthy', 'Rau'],
    nearbyCount: 15,
  },
  {
    id: 'bun-bo-hue-chay',
    name: '🍜 Bún Bò Huế Chay',
    shortName: '🍜 Bún Huế Chay',
    category: 'healthy',
    angle: 180,
    desc: 'Sả ớt cay nồng, nấm đông cô, chả huế chay & đậu hũ chiên',
    price: '40.000đ - 55.000đ',
    mealTime: 'Sáng & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyg_NvlB7FtipKr7EPnizzsKtYVFpBjs5bcH4jKR5_sxStv1Kac_roblp4WjvbxyNh_L9sCDEl3zh6fWnG4lwSZJ4IpFb9rPgMbjJPUHU4hEn6t8PvYCrkKMa185WNC2osu5l26a1czZws1L4YKJvb7c5IRsoTvhlAkfKrn-cE3SSF3rVTiBANDPoxggEkvmXR81hpN3DgCcZPjzut4whC3A4r5jeS8GhhbdPwd6ikfbHGbEHyDVwaw',
    tags: ['Chay', 'Healthy', 'Rau'],
    nearbyCount: 7,
  },
  {
    id: 'banh-mi-chay',
    name: '🥖 Bánh Mì Chay Pâté Nấm',
    shortName: '🥖 Bánh Mì Chay',
    category: 'healthy',
    angle: 225,
    desc: 'Pâté nấm hạt sen béo bùi, chả lụa chay, dưa chua & ngò rí',
    price: '20.000đ - 30.000đ',
    mealTime: 'Sáng & Chiều',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlma7ayNO_3K8LoIHn9FqcYNOYObGTyOWfIFrP38FckCZnFeVygVw5GoGoI5Yj91XxEc7uFvMuqFOjKePFxID052I0UK86WZ7KHS6W4GLKngLv22CeQA77VQi5VeEb4chNZEvD67Cve790o-JuAhyCMKZ7NWf3vDH90Xe8kmYZLuiPkjh5A_fZzAmaGmGIHW35DE1Otlc_Dn1FYx4tzhAOU5DUu6GHQPeq1W9MtO4I1-iVjdwXquEQjw',
    tags: ['Chay', 'Healthy'],
    nearbyCount: 16,
  },
  {
    id: 'salad-bo',
    name: '🥑 Salad Bơ Trái Cây Sốt Mè',
    shortName: '🥑 Salad Bơ',
    category: 'healthy',
    angle: 270,
    desc: 'Bơ sáp dẻo, xà lách tươi, cà chua bi & sốt mè rang thanh béo',
    price: '45.000đ - 65.000đ',
    mealTime: 'Trưa & Tối',
    rating: 4.9,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Chay', 'Healthy', 'Rau'],
    nearbyCount: 11,
  },
  {
    id: 'che-sen',
    name: '🪷 Chè Hạt Sen Long Nhãn',
    shortName: '🪷 Chè Hạt Sen',
    category: 'healthy',
    angle: 315,
    desc: 'Hạt sen Huế bùi mềm, long nhãn giòn ngọt, nước đường phèn thanh mát',
    price: '25.000đ - 35.000đ',
    mealTime: 'Xế chiều & Tối',
    rating: 4.8,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWOFN7wjJ3XvKWNPFYAcxrikRvOiBHU9ymbHOx_Tt3oJEV-c6c8TvGwqSmk6DkK8wbtL0rqgW9Q3A-gA3pMdPJEogc2W9MaXu2u9YYnAzW0BdH6wRrVor8DJwzjiohngCMgfBEn0E4dAkcknBaUYpZxH4IuPV2qNbFgbfiKOfRQFy-IGkJVjBrbiocOVIDD-JpJRpDIB5n9b1-L3kbAX60I6s87oAPNv_--bWsa13qIHNAURxYCGfkPg',
    tags: ['Chay', 'Ngọt'],
    nearbyCount: 14,
  },
];

const isStrictlyVegetarian = (food: { name: string; tags?: string[] }) => {
  const n = food.name.toLowerCase();
  const t = (food.tags || []).map(x => x.toLowerCase());
  
  // Meat, poultry, seafood, savory animal keywords
  const meatKeywords = [
    'thịt', 'bò', 'gà', 'heo', 'lợn', 'cá', 'lươn', 'cua', 'ốc', 'tôm', 'mực',
    'sườn', 'mắm', 'lòng', 'mặn', 'chả cá', 'chả lụa', 'chả cua', 'chả cốm',
    'nem chua', 'tái lăn', 'xá xíu', 'hải sản'
  ];

  const isExplicitChay = n.includes('chay');

  if (!isExplicitChay) {
    if (meatKeywords.some(k => n.includes(k))) return false;
    if (t.some(tag => tag.includes('mặn') || tag.includes('thịt') || tag.includes('hải sản') || tag.includes('cá') || tag.includes('bò') || tag.includes('gà'))) return false;
  }

  return isExplicitChay || n.includes('nấm') || n.includes('salad') || n.includes('đậu hũ') || n.includes('chè') ||
         t.some(tag => tag.includes('chay') || tag.includes('healthy') || tag.includes('rau') || tag.includes('ngọt'));
};

export function getFoodVisual(rawName: string, category?: string): { imageUrl: string; emoji: string; formattedName: string } {
  const n = rawName.toLowerCase();
  const cleanName = rawName
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|\uD83E[\uDE00-\uDEFF])/g, '')
    .replace(/^[^a-zA-Z0-9À-ỹ]+/u, '')
    .trim();

  // 1. Nước Mía (Sugarcane Juice)
  if (n.includes('mía')) {
    return {
      emoji: '🥤',
      formattedName: `🥤 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 2. Sinh Tố Bơ (Avocado Smoothie)
  if (n.includes('sinh tố bơ') || n.includes('bơ sáp') || (n.includes('sinh tố') && n.includes('bơ'))) {
    return {
      emoji: '🥑',
      formattedName: `🥑 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1638176066666-ffb2f5d306b3?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 3. Cà Phê / Nước ngọt / Đồ uống
  if (n.includes('cà phê') || n.includes('cafe') || n.includes('coffee')) {
    return {
      emoji: '☕',
      formattedName: `☕ ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 4. Bún Cá / Chả Cá
  if (n.includes('bún cá') || n.includes('chả cá')) {
    return {
      emoji: '🍜',
      formattedName: `🍜 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 5. Cơm Chay / Cơm Chiên Chay
  if (n.includes('cơm chay') || n.includes('cơm chiên chay')) {
    return {
      emoji: '🍱',
      formattedName: `🍱 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 6. Phở Chay / Hủ Tiếu Chay
  if (n.includes('phở chay') || n.includes('hủ tiếu chay') || n.includes('miến xào chay')) {
    return {
      emoji: '🍜',
      formattedName: `🍜 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 7. Phở Bò / Phở Gà
  if (n.includes('phở')) {
    return {
      emoji: '🍜',
      formattedName: `🍜 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Pho_bo.jpg'
    };
  }

  // 8. Bún Bò Huế
  if (n.includes('bún bò')) {
    return {
      emoji: '🍲',
      formattedName: `🍲 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bun-Bo-Hue-from-Huong-Giang-2011.jpg'
    };
  }

  // 9. Bún Riêu
  if (n.includes('bún riêu')) {
    return {
      emoji: '🍲',
      formattedName: `🍲 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Bun_Rieu.jpg'
    };
  }

  // 10. Gỏi Cuốn / Cuốn Chay
  if (n.includes('cuốn')) {
    return {
      emoji: '🥗',
      formattedName: `🥗 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/61/G%E1%BB%8Fi_cu%E1%BB%91n.jpg'
    };
  }

  // 11. Bánh Mì (Chay hoặc Mặn)
  if (n.includes('bánh mì')) {
    return {
      emoji: '🥖',
      formattedName: `🥖 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/B%C3%A1nh_m%C3%AC_th%E1%BB%8Bt_ngu%E1%BB%9i.jpg'
    };
  }

  // 12. Cơm Tấm / Sườn
  if (n.includes('cơm tấm') || n.includes('sườn')) {
    return {
      emoji: '🍖',
      formattedName: `🍖 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Com-Tam-2008.jpg'
    };
  }

  // 13. Gà Nướng / Cơm Gà
  if (n.includes('gà')) {
    return {
      emoji: '🍗',
      formattedName: `🍗 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 14. Bún Đậu Mắm Tôm
  if (n.includes('bún đậu')) {
    return {
      emoji: '🍱',
      formattedName: `🍱 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/B%C3%BAn_%C4%91%E1%BA%ADu_m%E1%BA%AFm_t%C3%B4m_%282019%29.jpg'
    };
  }

  // 15. Chè (Chè Sen, Đậu Đen, Khúc Bạch)
  if (n.includes('chè')) {
    return {
      emoji: '🪷',
      formattedName: `🪷 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Banana%2C_tapioca%2C_coconut_creme_Vietnamese_pudding_%28che_chuoi%29_-_28356997961.jpg'
    };
  }

  // 16. Salad Bơ / Salad Rau
  if (n.includes('salad')) {
    return {
      emoji: '🥑',
      formattedName: `🥑 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 17. Lẩu Thái / Lẩu
  if (n.includes('lẩu')) {
    return {
      emoji: '🥘',
      formattedName: `🥘 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=400&q=80'
    };
  }

  // 18. Bánh Xèo
  if (n.includes('bánh xèo')) {
    return {
      emoji: '🥞',
      formattedName: `🥞 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/B%C3%A1nh_x%C3%A8o_with_n%C6%B0%E1%BB%9Bc_m%E1%BA%AFm.jpg'
    };
  }

  // 19. Bánh Tráng Nướng / Trộn
  if (n.includes('bánh tráng') || n.includes('bột chiên') || n.includes('nem chua')) {
    return {
      emoji: '🍢',
      formattedName: `🍢 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Mixed_rice_paper.jpg'
    };
  }

  // 20. Bò (Bò né, Bò lúc lắc, Bò kho)
  if (n.includes('bò')) {
    return {
      emoji: '🥩',
      formattedName: `🥩 ${cleanName}`,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Product_Shots_of_Food-Bo_Luc_Lac.jpg'
    };
  }

  // 21. Bánh Canh / Miến / Hủ Tiếu
  if (n.includes('bánh canh') || n.includes('miến') || n.includes('hủ tiếu')) {
    return {
      emoji: '🍜',
      formattedName: `🍜 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80'
    };
  }

  // Default fallback
  if (category === 'healthy') {
    return {
      emoji: '🥗',
      formattedName: `🥗 ${cleanName}`,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80'
    };
  }

  return {
    emoji: '🍲',
    formattedName: `🍲 ${cleanName}`,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
  };
}

const FILTER_CATEGORIES = [
  { key: 'all', icon: 'stars' },
  { key: 'kho', icon: '🥢' },
  { key: 'nuoc', icon: '🍲' },
  { key: 'an_vat', icon: '🍢' },
  { key: 'healthy', icon: '🥑' },
];

export default function RandomFoodPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile } = useUserStore();
  const { fetchRandomFood, wheelFoods, fetchWheelFoods, isLoading } = useFoodStore();

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFood, setSelectedFood] = useState<WheelItem>(WHEEL_ITEMS[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);

  const wheelRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    fetchWheelFoods(activeFilter === 'all' ? undefined : activeFilter, 8).catch(() => {});
    setCurrentRotation(13600); // Start at a high offset so items are visible on the left
    setHasSpun(false);
  }, [activeFilter, fetchWheelFoods]);

  const wheelItems = useMemo<WheelItem[]>(() => {
    if (activeFilter === 'healthy') {
      // 1. Filter backend foods that are strictly vegetarian
      const validDbFoods = (wheelFoods || []).filter(isStrictlyVegetarian);
      
      const dbItems: WheelItem[] = validDbFoods.map((f, idx) => {
        const visual = getFoodVisual(f.name, 'healthy');
        return {
          id: `db-chay-${f.id}`,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          category: 'healthy',
          angle: 0,
          desc: f.tags && f.tags.length > 0 ? f.tags.join(', ') : 'Món chay thanh tịnh mỗi ngày',
          price: f.avgPriceRange || '35.000đ - 55.000đ',
          mealTime: f.mealTime || 'Trưa & Tối',
          rating: 4.8,
          imageUrl: visual.imageUrl,
          tags: (f.tags && f.tags.length > 0) ? f.tags.filter(t => !['mặn', 'thịt', 'hải sản'].includes(t.toLowerCase())) : ['Chay', 'Healthy'],
          nearbyCount: Math.floor(Math.random() * 15) + 5
        };
      });

      const combined: WheelItem[] = [...dbItems];
      for (const fallback of CHAY_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        if (!combined.some(c => c.name.toLowerCase().includes(fallback.shortName.toLowerCase()) || fallback.name.toLowerCase().includes(c.shortName.toLowerCase()))) {
          combined.push(fallback);
        }
      }
      for (const fallback of CHAY_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        combined.push(fallback);
      }

      return combined.slice(0, 8).map((item, idx) => {
        const visual = getFoodVisual(item.name, 'healthy');
        return {
          ...item,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          imageUrl: visual.imageUrl,
          angle: idx * 45
        };
      });
    }

    if (activeFilter === 'kho') {
      const dbItems: WheelItem[] = (wheelFoods || []).filter(f => f.category === 'Kho').map((f, idx) => {
        const visual = getFoodVisual(f.name, 'kho');
        return {
          id: `db-kho-${f.id}`,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          category: 'kho',
          angle: 0,
          desc: f.tags && f.tags.length > 0 ? f.tags.join(', ') : 'Món khô đậm đà',
          price: f.avgPriceRange || 'Vừa',
          mealTime: f.mealTime || 'Cả ngày',
          rating: 4.8,
          imageUrl: visual.imageUrl,
          tags: f.tags || ['Khô'],
          nearbyCount: Math.floor(Math.random() * 20) + 5
        };
      });
      const combined = [...dbItems];
      for (const fb of KHO_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        if (!combined.some(c => c.name.toLowerCase().includes(fb.shortName.toLowerCase()))) combined.push(fb);
      }
      for (const fb of KHO_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        combined.push(fb);
      }
      return combined.slice(0, 8).map((item, idx) => {
        const visual = getFoodVisual(item.name, 'kho');
        return {
          ...item,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          imageUrl: visual.imageUrl,
          angle: idx * 45
        };
      });
    }

    if (activeFilter === 'nuoc') {
      const dbItems: WheelItem[] = (wheelFoods || []).filter(f => f.category === 'Nuoc').map((f, idx) => {
        const visual = getFoodVisual(f.name, 'nuoc');
        return {
          id: `db-nuoc-${f.id}`,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          category: 'nuoc',
          angle: 0,
          desc: f.tags && f.tags.length > 0 ? f.tags.join(', ') : 'Món nước nóng hổi',
          price: f.avgPriceRange || 'Vừa',
          mealTime: f.mealTime || 'Cả ngày',
          rating: 4.8,
          imageUrl: visual.imageUrl,
          tags: f.tags || ['Nước'],
          nearbyCount: Math.floor(Math.random() * 20) + 5
        };
      });
      const combined = [...dbItems];
      for (const fb of NUOC_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        if (!combined.some(c => c.name.toLowerCase().includes(fb.shortName.toLowerCase()))) combined.push(fb);
      }
      for (const fb of NUOC_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        combined.push(fb);
      }
      return combined.slice(0, 8).map((item, idx) => {
        const visual = getFoodVisual(item.name, 'nuoc');
        return {
          ...item,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          imageUrl: visual.imageUrl,
          angle: idx * 45
        };
      });
    }

    if (activeFilter === 'an_vat') {
      const dbItems: WheelItem[] = (wheelFoods || []).map((f, idx) => {
        const visual = getFoodVisual(f.name, 'an_vat');
        return {
          id: `db-anvat-${f.id}`,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          category: 'an_vat',
          angle: 0,
          desc: f.tags && f.tags.length > 0 ? f.tags.join(', ') : 'Món ăn vặt thơm ngon',
          price: f.avgPriceRange || 'Rẻ',
          mealTime: f.mealTime || 'Xế chiều',
          rating: 4.8,
          imageUrl: visual.imageUrl,
          tags: f.tags || ['Ăn Vặt'],
          nearbyCount: Math.floor(Math.random() * 20) + 5
        };
      });
      const combined = [...dbItems];
      for (const fb of AN_VAT_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        if (!combined.some(c => c.name.toLowerCase().includes(fb.shortName.toLowerCase()))) combined.push(fb);
      }
      for (const fb of AN_VAT_WHEEL_ITEMS) {
        if (combined.length >= 8) break;
        combined.push(fb);
      }
      return combined.slice(0, 8).map((item, idx) => {
        const visual = getFoodVisual(item.name, 'an_vat');
        return {
          ...item,
          name: visual.formattedName,
          shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
          imageUrl: visual.imageUrl,
          angle: idx * 45
        };
      });
    }

    // Default: 'all'
    const dbItems: WheelItem[] = (wheelFoods || []).map((f, idx) => {
      const visual = getFoodVisual(f.name, f.category);
      return {
        id: `db-all-${f.id}`,
        name: visual.formattedName,
        shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
        category: f.category,
        angle: 0,
        desc: f.tags && f.tags.length > 0 ? f.tags.join(', ') : t('randomPage.filterTitle', 'Món ngon mỗi ngày'),
        price: f.avgPriceRange ? t(`food.price.${f.avgPriceRange.toLowerCase()}`, f.avgPriceRange) : t('food.price.vua', 'Vừa (30-80k)'),
        mealTime: f.mealTime ? t(`food.mealTime.${f.mealTime.toLowerCase()}`, f.mealTime) : t('food.mealTime.ca_ngay', 'Cả ngày'),
        rating: 4.8,
        imageUrl: visual.imageUrl,
        tags: f.tags || [],
        nearbyCount: Math.floor(Math.random() * 20) + 5
      };
    });
    const combined = [...dbItems];
    for (const fb of WHEEL_ITEMS) {
      if (combined.length >= 8) break;
      if (!combined.some(c => c.name.toLowerCase().includes(fb.shortName.toLowerCase()))) combined.push(fb);
    }
    for (const fb of WHEEL_ITEMS) {
      if (combined.length >= 8) break;
      combined.push(fb);
    }
    return combined.slice(0, 8).map((item, idx) => {
      const visual = getFoodVisual(item.name, item.category);
      return {
        ...item,
        name: visual.formattedName,
        shortName: visual.formattedName.length > 15 ? visual.formattedName.substring(0, 15) + '...' : visual.formattedName,
        imageUrl: visual.imageUrl,
        angle: idx * 45
      };
    });
  }, [wheelFoods, activeFilter]);

  useEffect(() => {
    if (wheelItems.length > 0 && !hasSpun) {
      setSelectedFood(wheelItems[0]);
    }
  }, [wheelItems, hasSpun]);

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const ITEM_WIDTH = 170; // 154px item + 16px gap

  const triggerSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    // Pick random target from current filtered pool
    const pool = wheelItems;
    const targetIdx = Math.floor(Math.random() * pool.length);
    const chosen = pool[targetIdx];

    // Calculate infinite scroll offset
    const currentIndex = Math.round(currentRotation / ITEM_WIDTH);
    const sets = 6 + Math.floor(Math.random() * 2); // 6 or 7 sets
    const nextIndex = currentIndex + (sets * pool.length) - (currentIndex % pool.length) + targetIdx;

    setCurrentRotation(nextIndex * ITEM_WIDTH);
    if (!hasSpun) setHasSpun(true);

    // Also trigger backend call in background to log and sync
    let sessionId = localStorage.getItem('foodMatch_sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('foodMatch_sessionId', sessionId);
    }
    fetchRandomFood({ category: activeFilter === 'all' ? undefined : activeFilter, sessionId }).catch(() => {});

    setTimeout(() => {
      setSelectedFood(chosen);
      setIsSpinning(false);
      // Instantly reset the rotation to a safe middle index to allow infinite consecutive spins without running out of DOM elements
      setCurrentRotation((80 + targetIdx) * ITEM_WIDTH);
    }, 4500);
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-white">
      {/* Dynamic Atmospheric Glow Background elements */}
      <div className="fixed -top-24 -left-24 w-80 h-80 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-1/3 -right-24 w-72 h-72 rounded-full bg-secondary-container/10 blur-[90px] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="h-16 px-margin flex items-center justify-between">
          <div 
            className="flex items-center gap-space-sm cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              alt="Food Match Brand Icon" 
              className="h-8 w-auto object-contain" 
              src={logoImg} 
            />
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md leading-tight text-on-surface tracking-tight font-extrabold">
                Food<span className="text-primary-container">Match</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-space-xs">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse"></span>
                {t('nav.random')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            {/* Language Switcher */}
            <button
              onClick={changeLanguage}
              className="px-2.5 h-8 flex items-center justify-center rounded-full bg-surface-container/60 text-primary-container hover:bg-surface-container transition-colors font-bold text-label-sm uppercase border border-primary-container/20 mr-1 active:scale-95"
              title="Đổi ngôn ngữ (VN / EN)"
            >
              {i18n.language === 'en' ? 'EN' : 'VN'}
            </button>
            <button 
              className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container/60 text-on-surface-variant hover:text-on-surface transition-colors relative"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#ff6b35]"></span>
            </button>
            <button 
              onClick={() => navigate('/profile')} 
              className="w-11 h-11 flex items-center justify-center rounded-full"
              aria-label="Cá nhân"
            >
              {profile?.displayName ? (
                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container ring-2 ring-primary-container/40 flex items-center justify-center font-bold text-sm">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <img 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary-container/40" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA92w28fcnzXyfesyI7ypUuEyvf1p5UPHUIovJr0yN3HicG5VCbxRdTRqP8aAwKlfnlhMLCncSiYqORv_MxWipkJB1b9n_O8sG9etzaq9kZOts8_xz3QTUL_JfdrZZbp1UV_uTJhwITx1N4bFcWMVrDw_di98xQ1cB-L3b3B0NlJwYBkMHPRk4EaGQn6Q8wDMKrfj0WCGLW-TAedGPY6d01D6SDUbgOf27W9rMwxnDGvs8VhVmGf2c7RA" 
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface z-10">
        <div className="flex flex-col w-full relative px-margin pb-6 select-none overflow-hidden">
          
          {/* Subheader / Filter count */}
          <div className="flex items-center justify-between mt-2 mb-3">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary-container text-[20px]">tune</span>
              <span className="font-label-lg text-label-lg text-on-surface">{t('randomPage.filterTitle')}</span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary px-2.5 py-1 rounded-full bg-secondary-container/15">
              {t('randomPage.itemsAvailable', { count: wheelItems.length })}
            </span>
          </div>

          {/* Filter Pills Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-margin px-margin pb-2 pt-1">
            {FILTER_CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className={`shrink-0 px-4 py-2 rounded-full font-label-md text-label-md flex items-center gap-1.5 transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-primary-container shadow-[0_0_18px_rgba(255,107,53,0.45)]'
                      : 'text-on-surface-variant bg-surface-container-high/80 hover:bg-surface-container-highest'
                  }`}
                >
                  {cat.key === 'all' && <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>}
                  {cat.key !== 'all' && <span>{cat.icon}</span>}
                  <span>{t(`food.category.${cat.key}`)}</span>
                </button>
              );
            })}
          </div>

          {/* Infinite Horizontal Slot Machine Section */}
          <div className="relative w-full flex flex-col items-center justify-center my-4 py-2">
            <div className="absolute w-full h-40 bg-primary-container/5 blur-[30px] pointer-events-none"></div>

            <div className="relative w-full overflow-hidden h-44 flex items-center">
              {/* Target indicator box */}
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[164px] h-[150px] border-2 border-primary shadow-[0_0_24px_rgba(255,107,53,0.3)_inset] rounded-2xl z-20 pointer-events-none bg-primary/5 transition-opacity duration-300 ${
                  hasSpun && !isSpinning ? 'opacity-100' : 'opacity-0'
                }`}
              ></div>
              
              {/* Spinning Track */}
              <div 
                className="flex items-center gap-[16px] transition-transform ease-[cubic-bezier(0.15,0.9,0.2,1)] w-max"
                style={{
                  transform: `translateX(-${currentRotation}px)`,
                  paddingLeft: `calc(50% - 77px)`,
                  transitionDuration: isSpinning ? '4500ms' : '0s'
                }}
              >
                {/* Render enough items for infinite illusion */}
                {Array.from({ length: 150 }).map((_, i) => {
                  if (wheelItems.length === 0) return null;
                  const item = wheelItems[i % wheelItems.length];
                  return (
                    <div 
                      key={i} 
                      className="shrink-0 w-[154px] h-[140px] bg-surface-container-high rounded-xl overflow-hidden shadow-lg flex flex-col items-center justify-center relative border border-white/10"
                    >
                      <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                      <span className="relative text-white font-bold text-center px-2 z-10 text-body-lg drop-shadow-md pb-1 mt-auto w-full">
                        {item.shortName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center Spin Trigger Button below track */}
            <div className="relative flex items-center justify-center mt-6 z-30">
              <div className={`absolute w-24 h-24 rounded-full bg-primary-container/20 ${isSpinning ? 'animate-ping' : ''}`}></div>
              <div className="absolute w-20 h-20 rounded-full bg-primary-container/40"></div>
              <button 
                disabled={isSpinning || isLoading}
                onClick={triggerSpin}
                className={`pointer-events-auto w-20 h-20 rounded-full bg-gradient-to-tr from-primary-container to-surface-tint text-white shadow-[0_6px_28px_rgba(255,107,53,0.65)] active:scale-95 hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center z-40 disabled:opacity-80 disabled:cursor-not-allowed ${isLoading ? 'cursor-wait opacity-50' : ''}`}
                id="spinBtn"
              >
                <span className="material-symbols-outlined text-[24px] text-white">casino</span>
                <span className="font-label-sm text-label-sm tracking-wider uppercase font-black text-white leading-none mt-0.5">
                  {isSpinning ? t('randomPage.spinning') : t('randomPage.spin')}
                </span>
              </button>
            </div>
          </div>

          {/* Selected Food Result Card (Stitch Specification) */}
          <div 
            className="w-full rounded-2xl bg-surface-container/90 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.65)] p-4 transition-all duration-300 relative mt-1 border border-white/5" 
            id="resultCard"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary-container shadow-[0_0_8px_#ff6b35]"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                  {t('randomPage.selectedToday')}
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">near_me</span>
                450m
              </span>
            </div>

            <div className="flex items-center gap-space-md mb-3">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-md">
                <img 
                  alt={selectedFood.name} 
                  className="w-full h-full object-cover" 
                  src={selectedFood.imageUrl} 
                />
                <span className="absolute bottom-1 right-1 bg-surface-container-lowest/80 backdrop-blur-md text-primary font-label-sm text-label-sm px-1.5 py-0.5 rounded-full font-bold">
                  ★ {selectedFood.rating}
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="font-headline-md text-headline-md text-white font-extrabold truncate" id="foodTitle">
                  {i18n.language === 'en' && t(`foodNames.${selectedFood.name}`, { defaultValue: selectedFood.name }) !== selectedFood.name 
                    ? t(`foodNames.${selectedFood.name}`) 
                    : selectedFood.name}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
                  {selectedFood.desc}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-label-md text-label-md text-tertiary-fixed font-bold">
                    {t(`price.${selectedFood.price.toLowerCase()}`, { defaultValue: selectedFood.price })}
                  </span>
                  <span className="text-outline text-[11px]">•</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {t(`mealTime.${selectedFood.mealTime.toLowerCase()}`, { defaultValue: selectedFood.mealTime })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedFood.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-[11px] font-medium">
                  {t(`tags.${tag.toLowerCase()}`, { defaultValue: tag })}
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary text-[11px] font-semibold">
                {t('randomPage.nearbyCount', { count: selectedFood.nearbyCount })}
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              <button 
                disabled={isSpinning}
                onClick={triggerSpin}
                className="col-span-2 h-12 rounded-full bg-secondary-container/15 hover:bg-secondary-container/25 active:scale-95 text-secondary flex items-center justify-center gap-1 font-label-md text-label-md transition-all duration-200 disabled:opacity-50" 
                id="reSpinBtn"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>{t('randomPage.respin')}</span>
              </button>
              <button 
                onClick={() => {
                  const cleanName = selectedFood.name.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
                  navigate(`/map?search=${encodeURIComponent(cleanName)}`);
                }}
                className="col-span-3 h-12 rounded-full bg-gradient-to-r from-primary-container to-surface-tint text-white shadow-[0_4px_22px_rgba(255,107,53,0.45)] hover:shadow-[0_6px_28px_rgba(255,107,53,0.6)] active:scale-95 flex items-center justify-center gap-1.5 font-label-lg text-label-lg transition-all duration-200"
              >
                <span>{t('randomPage.confirm')}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
