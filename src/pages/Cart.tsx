import { Trash2 } from 'lucide-react';

export default function CartPage({ cartItems, onRemoveItem, onNavigate }) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="text-4xl font-light text-black">Shopping Cart</h1>
        <div className="py-20 space-y-4">
          <p className="text-lg text-gray-600">Your cart is empty</p>
          <button
            onClick={() => onNavigate('catalog')}
            className="inline-block px-6 py-3 bg-cyan-400 text-white font-medium hover:bg-cyan-500 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-light text-black">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, index) => (
            <div key={index} className="flex gap-4 pb-4 border-b border-gray-200">
              <div className="bg-gray-100 w-24 h-24 flex-shrink-0 rounded"></div>
              <div className="flex-grow">
                <h3 className="text-lg font-medium text-black">{item.name}</h3>
                <p className="text-sm text-gray-600">Size: {item.size}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                <p className="text-lg font-semibold text-black mt-2">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => onRemoveItem(index)}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 h-fit space-y-4">
          <h2 className="text-lg font-medium text-black">Order Summary</h2>
          <div className="space-y-3 border-b border-gray-200 pb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${(total * 0.08).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between text-xl font-semibold text-black">
            <span>Total</span>
            <span>${(total * 1.08).toFixed(2)}</span>
          </div>
          <button className="w-full py-3 bg-cyan-400 text-white font-medium hover:bg-cyan-500 transition-colors">
            Checkout
          </button>
          <button
            onClick={() => onNavigate('catalog')}
            className="w-full py-3 border border-gray-300 text-gray-700 font-medium hover:border-cyan-400 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
