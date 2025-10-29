import { Product } from './models/Product';
import { Customer } from './models/Customer';
import { Order } from './models/Order';

export async function seedDatabase() {
  try {
    // Check if data already exists
    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      console.log('Database already seeded');
      return;
    }

    // Seed Products
    const products = await Product.insertMany([
      { name: "Premium Coffee Beans", sku: "COF-001", price: 12.99, stock: 45, category: "Beverages", description: "High-quality arabica coffee beans" },
      { name: "Organic Tea", sku: "TEA-001", price: 8.99, stock: 62, category: "Beverages", description: "Premium organic tea selection" },
      { name: "Fresh Croissant", sku: "BAK-001", price: 4.99, stock: 28, category: "Bakery", description: "Freshly baked croissants" },
      { name: "Chocolate Cake", sku: "BAK-002", price: 24.99, stock: 12, category: "Bakery", description: "Rich chocolate cake" },
      { name: "Cheese Sandwich", sku: "SAN-001", price: 7.99, stock: 35, category: "Sandwiches", description: "Delicious cheese sandwich" },
      { name: "Turkey Club", sku: "SAN-002", price: 10.99, stock: 18, category: "Sandwiches", description: "Classic turkey club sandwich" },
      { name: "Bottled Water", sku: "BEV-001", price: 2.99, stock: 150, category: "Beverages", description: "Pure bottled water" },
      { name: "Fruit Juice", sku: "BEV-002", price: 4.49, stock: 87, category: "Beverages", description: "Fresh fruit juice" },
      { name: "Salad Bowl", sku: "SAL-001", price: 9.99, stock: 40, category: "Salads", description: "Mixed salad bowl" },
      { name: "Caesar Salad", sku: "SAL-002", price: 11.99, stock: 35, category: "Salads", description: "Classic Caesar salad" },
      { name: "Greek Salad", sku: "SAL-003", price: 12.99, stock: 25, category: "Salads", description: "Fresh Greek salad" },
      { name: "Espresso Shot", sku: "COF-002", price: 3.99, stock: 100, category: "Beverages", description: "Single espresso shot" },
    ]);
    console.log(`✅ Seeded ${products.length} products`);

    // Seed Customers
    const customers = await Customer.insertMany([
      { name: "Alice Johnson", email: "alice@example.com", phone: "+1 (555) 123-4567", city: "New York", totalOrders: 15, totalSpent: 487.50, joinDate: new Date("2023-01-15") },
      { name: "Bob Smith", email: "bob@example.com", phone: "+1 (555) 234-5678", city: "Los Angeles", totalOrders: 8, totalSpent: 256.75, joinDate: new Date("2023-03-20") },
      { name: "Carol Davis", email: "carol@example.com", phone: "+1 (555) 345-6789", city: "Chicago", totalOrders: 22, totalSpent: 892.30, joinDate: new Date("2022-11-05") },
      { name: "David Wilson", email: "david@example.com", phone: "+1 (555) 456-7890", city: "Houston", totalOrders: 5, totalSpent: 145.20, joinDate: new Date("2024-01-10") },
      { name: "Emma Martinez", email: "emma@example.com", phone: "+1 (555) 567-8901", city: "Phoenix", totalOrders: 18, totalSpent: 634.60, joinDate: new Date("2023-06-12") },
      { name: "Frank Brown", email: "frank@example.com", phone: "+1 (555) 678-9012", city: "Philadelphia", totalOrders: 11, totalSpent: 378.45, joinDate: new Date("2023-08-22") },
    ]);
    console.log(`✅ Seeded ${customers.length} customers`);

    // Seed Orders
    const orders = await Order.insertMany([
      { orderNumber: "ORD-1045", customer: "Alice Johnson", items: [{ productId: products[0]._id.toString(), name: "Premium Coffee Beans", price: 12.99, quantity: 2 }], status: "completed", total: 156.75 },
      { orderNumber: "ORD-1044", customer: "Bob Smith", items: [{ productId: products[1]._id.toString(), name: "Organic Tea", price: 8.99, quantity: 3 }], status: "processing", total: 89.50 },
      { orderNumber: "ORD-1043", customer: "Carol Davis", items: [{ productId: products[2]._id.toString(), name: "Fresh Croissant", price: 4.99, quantity: 8 }], status: "pending", total: 234.25 },
      { orderNumber: "ORD-1042", customer: "David Wilson", items: [{ productId: products[3]._id.toString(), name: "Chocolate Cake", price: 24.99, quantity: 2 }], status: "completed", total: 67.99 },
      { orderNumber: "ORD-1041", customer: "Emma Martinez", items: [{ productId: products[4]._id.toString(), name: "Cheese Sandwich", price: 7.99, quantity: 6 }], status: "processing", total: 189.60 },
      { orderNumber: "ORD-1040", customer: "Frank Brown", items: [{ productId: products[5]._id.toString(), name: "Turkey Club", price: 10.99, quantity: 4 }], status: "pending", total: 123.45 },
    ]);
    console.log(`✅ Seeded ${orders.length} orders`);

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
