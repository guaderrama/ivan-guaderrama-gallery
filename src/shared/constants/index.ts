import type { ProductCategory } from '@/features/artwork-management/types';

export const CATEGORY_COLORS: Record<ProductCategory, string> = {
  'GLASS SCULPTURE': 'bg-blue-500 text-white',
  'ORIGINAL': 'bg-red-500 text-white',
  'METAL SCULPTURE': 'bg-yellow-400 text-gray-900',
  'WALL SCULPTURE': 'bg-indigo-500 text-white',
  'LIMITED EDITION': 'bg-gray-800 text-white',
  'MINI ORIGINAL': 'bg-teal-500 text-white',
  'MINI ORIGINAL SPECIAL': 'bg-purple-500 text-white',
};

// Placeholder SVG image as a Base64 data URL
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjY2FkMWQ4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UHJvZHVjdCBJbWFnZTwvdGV4dD48L3N2Zz4=';
