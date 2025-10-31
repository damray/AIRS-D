import { ShoppingBag } from 'lucide-react';

export const PRODUCTS = [
  {
    id: 101,
    name: 'Minimal Hoodie',
    price: 49.99,
    sizes: ['S', 'M', 'L'],
    desc: 'Lightweight cotton hoodie',
    fullDesc: 'Premium lightweight cotton blend hoodie perfect for everyday wear. Features a relaxed fit, kangaroo pocket, and ribbed cuffs. Available in black, gray, and navy.',
    image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 102,
    name: 'Everyday Sneakers',
    price: 79.99,
    sizes: [40, 41, 42, 43],
    desc: 'Comfort first',
    fullDesc: 'Versatile sneakers designed for all-day comfort. Breathable mesh upper, cushioned insole, and durable rubber sole. Perfect for walking, running errands, or casual wear.',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 103,
    name: 'Slim Jeans',
    price: 59.99,
    sizes: [30, 32, 34],
    desc: 'Stretch denim',
    fullDesc: 'Modern slim-fit jeans with stretch denim fabric for comfort and mobility. Classic five-pocket design with a mid-rise waist. Available in dark wash and light wash.',
    image: 'https://images.pexels.com/photos/1082526/pexels-photo-1082526.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 104,
    name: 'Casual Shirt',
    price: 39.99,
    sizes: ['S', 'M', 'L'],
    desc: 'Breathable cotton',
    fullDesc: '100% cotton casual button-down shirt with breathable fabric. Features a relaxed collar, button-front closure, and chest pocket. Ideal for work or weekend wear.',
    image: 'https://images.pexels.com/photos/769749/pexels-photo-769749.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 105,
    name: 'Eco Tote',
    price: 19.99,
    desc: 'Recycled fabric',
    fullDesc: 'Sustainable tote bag made from 100% recycled fabric. Spacious interior with interior pocket, reinforced handles, and water-resistant lining. Perfect for shopping or daily use.',
    image: 'https://images.pexels.com/photos/1202726/pexels-photo-1202726.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 106,
    name: 'AIRS',
    price: 1,
    desc: 'Palo Alto AIRS Services',
    fullDesc: 'Sustainable tote bag made from 100% recycled fabric. Spacious interior with interior pocket, reinforced handles, and water-resistant lining. Perfect for shopping or daily use.',
    image: 'https://images.pexels.com/photos/5952738/pexels-photo-5952738.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 107,
    name: 'Beanie',
    price: 14.99,
    desc: 'Warm and compact',
    fullDesc: 'Cozy knit beanie made from soft acrylic blend. One size fits all with a comfortable stretch fit. Available in multiple colors including black, gray, and burgundy.',
    image: 'https://images.pexels.com/photos/1261895/pexels-photo-1261895.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

export default function CatalogPage({ onNavigate }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light text-black">Shop</h1>
        <p className="text-gray-600 mt-2">Browse our collection of minimal essentials</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            onClick={() => onNavigate('product', product)}
            className="text-left space-y-4 group hover:opacity-75 transition-opacity"
          >
            <div className="bg-gray-100 aspect-square flex items-center justify-center rounded overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black group-hover:text-cyan-400 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600">{product.desc}</p>
              <p className="text-lg font-semibold text-black mt-2">${product.price}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
