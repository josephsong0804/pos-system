
import { Merchant, Product } from './types';

export const INITIAL_MERCHANTS: Merchant[] = [
  { id: 'm1', name: 'Jom Makan Cafe', category: 'F&B', logo: '☕', sstEnabled: true, serviceCharge: 10, joinedDate: Date.now() },
  { id: 'm2', name: 'Restoran Nasi Kandar', category: 'F&B', logo: '🍛', sstEnabled: false, serviceCharge: 0, joinedDate: Date.now() },
  { id: 'm3', name: 'Bubble Tea Central', category: 'Beverages', logo: '🧋', sstEnabled: true, serviceCharge: 0, joinedDate: Date.now() },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', merchantId: 'm1', name: 'Nasi Lemak Ayam Berempah', description: 'Fragrant coconut rice with spiced fried chicken.', price: 15.90, category: 'Main', image: 'https://picsum.photos/seed/nasi/400/300', isAvailable: true, stock: 50 },
  { id: 'p2', merchantId: 'm1', name: 'Kopi O Kaw', description: 'Strong local black coffee.', price: 3.50, category: 'Drinks', image: 'https://picsum.photos/seed/kopi/400/300', isAvailable: true, stock: 100 },
  { id: 'p3', merchantId: 'm1', name: 'Roti Bakar Kaya', description: 'Toasted bread with coconut jam.', price: 4.50, category: 'Sides', image: 'https://picsum.photos/seed/roti/400/300', isAvailable: true, stock: 40 },
  { id: 'p4', merchantId: 'm2', name: 'Nasi Kandar Ayam Madu', description: 'Rice with honey chicken and mixed curries.', price: 18.00, category: 'Main', image: 'https://picsum.photos/seed/nasi2/400/300', isAvailable: true, stock: 30 },
  { id: 'p5', merchantId: 'm3', name: 'Signature Milk Tea', description: 'Classic milk tea with pearls.', price: 12.90, category: 'Tea', image: 'https://picsum.photos/seed/tea/400/300', isAvailable: true, stock: 60 },
];

export const SST_RATE = 0.06;

// Added missing constant CATEGORIES
export const CATEGORIES = ['All', 'Main', 'Drinks', 'Sides', 'Tea', 'Beverages'];
