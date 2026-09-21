export const getFullImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  // Lấy image base URL từ biến môi trường VITE_IMAGE_BASE_URL.
  // Nếu không có, tự động bóc tách từ VITE_API_URL (bằng cách xóa phần '/api').
  // Cuối cùng fallback về http://localhost:8080.
  const apiBase = import.meta.env.VITE_API_URL;
  const computedBase = apiBase ? apiBase.replace(/\/api\/?$/, '') : 'http://localhost:8080';
  const imageBase = import.meta.env.VITE_IMAGE_BASE_URL || computedBase;
  
  return `${imageBase}${url.startsWith('/') ? '' : '/'}${url}`;
};
