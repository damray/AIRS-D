import { useState } from 'react';
import { ShoppingBag, ChevronLeft } from 'lucide-react';

type SizeOption = string | number;

interface Product {
  id?: number;
  name: string;
  price: number;
  image?: string;
  desc?: string;
  fullDesc?: string;
  sizes?: SizeOption[];
}

interface ProductPageProps {
  product: Product;
  onAddToCart: (product: Product, size: SizeOption, quantity: number) => void;
  onNavigate: (route: string) => void;
}

export default function ProductPage({ product, onAddToCart, onNavigate }: ProductPageProps) {
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    onAddToCart(product, selectedSize, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const sizes = product.sizes || [];
  const isNumericSize = sizes.length > 0 && typeof sizes[0] === 'number';

  return (
    <div className="space-y-8">
      <button
        onClick={() => onNavigate('catalog')}
        className="flex items-center gap-2 text-gray-600 hover:text-cyan-400 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to catalog
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="bg-gray-100 aspect-square flex items-center justify-center rounded overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="w-32 h-32 text-gray-300" />
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-light text-black">{product.name}</h1>
            <p className="text-gray-600 mt-2">{product.fullDesc || product.desc}</p>
            <p className="text-3xl font-semibold text-black mt-4">${product.price}</p>
          </div>

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-black">
                {isNumericSize ? 'Size (EU)' : 'Size'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border transition-colors ${
                      selectedSize === size
                        ? 'border-cyan-400 bg-cyan-400 text-white'
                        : 'border-gray-300 text-gray-700 hover:border-cyan-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-black">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 border border-gray-300 text-gray-700 hover:border-cyan-400"
              >
                −
              </button>
              <span className="text-lg font-medium w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 border border-gray-300 text-gray-700 hover:border-cyan-400"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={`w-full py-4 font-medium transition-all ${
              addedToCart
                ? 'bg-green-400 text-white'
                : 'bg-cyan-400 text-white hover:bg-cyan-500'
            }`}
          >
            {addedToCart ? '✓ Added to cart' : 'Add to cart'}
          </button>

          {/* Info */}
          <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
            <p>✓ Free shipping on orders over $50</p>
            <p>✓ 30-day return policy</p>
            <p>✓ Secure checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
