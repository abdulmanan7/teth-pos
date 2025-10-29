import { X, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: "Premium Coffee Beans", price: 12.99, stock: 45 },
  { id: 2, name: "Organic Tea", price: 8.99, stock: 62 },
  { id: 3, name: "Fresh Croissant", price: 4.99, stock: 28 },
  { id: 4, name: "Chocolate Cake", price: 24.99, stock: 12 },
  { id: 5, name: "Cheese Sandwich", price: 7.99, stock: 35 },
  { id: 6, name: "Turkey Club", price: 10.99, stock: 18 },
  { id: 7, name: "Bottled Water", price: 2.99, stock: 150 },
  { id: 8, name: "Fruit Juice", price: 4.49, stock: 87 },
];

const CUSTOMERS = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Smith" },
  { id: 3, name: "Carol Davis" },
  { id: 4, name: "David Wilson" },
  { id: 5, name: "Emma Martinez" },
  { id: 6, name: "Frank Brown" },
];

export default function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductList, setShowProductList] = useState(false);

  const filteredProducts = PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cartItems.find((item) => item.productId === product.id);
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
    setSearchTerm("");
    setShowProductList(false);
  };

  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCreateOrder = () => {
    if (!selectedCustomer || cartItems.length === 0) {
      alert("Please select a customer and add items to cart");
      return;
    }
    alert("Order created successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Create Order</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Order Details */}
            <div className="space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  Select Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Choose a customer...</option>
                  {CUSTOMERS.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Search and Add */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  Add Products
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowProductList(true);
                    }}
                    onFocus={() => setShowProductList(true)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>

                {/* Product Dropdown */}
                {showProductList && searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-0 text-slate-300"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-blue-400 font-bold">
                            Rs {product.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {product.stock} in stock
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-white font-semibold mb-3">
                  Order Notes
                </label>
                <textarea
                  placeholder="Add any special instructions..."
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Right: Cart */}
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-white mb-4">Order Items</h3>

              {/* Cart Items */}
              <div className="flex-1 space-y-3 mb-6">
                {cartItems.length === 0 ? (
                  <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg text-slate-400 text-center py-8">
                    No items added yet
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 bg-slate-700/30 border border-slate-600 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 font-bold">
                          Rs {item.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.productId,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-12 text-center bg-slate-600 text-white rounded px-2 py-1"
                            min="1"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-right text-slate-300 mt-2 text-sm">
                        Subtotal: $
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t border-slate-600 pt-4 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>Rs {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax (10%):</span>
                  <span>Rs {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white border-t border-slate-600 pt-3">
                  <span>Total:</span>
                  <span className="text-green-400">Rs {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrder}
            disabled={!selectedCustomer || cartItems.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Button>
        </div>
      </div>
    </div>
  );
}
