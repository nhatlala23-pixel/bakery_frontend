import { Heart } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useNavigate } from 'react-router-dom';

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: number;
}

export const WishlistButton = ({ productId, className = '', size = 18 }: WishlistButtonProps) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.id) {
      navigate('/login');
      return;
    }

    await toggleWishlist(productId);
  };

  return (
    <button
      onClick={handleClick}
      title={inWishlist ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      className={`transition-all duration-300 ${className}`}
    >
      <Heart
        size={size}
        className={`transition-all duration-300 ${
          inWishlist
            ? 'fill-red-500 text-red-500 scale-110'
            : 'text-gray-400 hover:text-red-500 hover:scale-110'
        }`}
      />
    </button>
  );
};
