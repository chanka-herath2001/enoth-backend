-- ENOTH Database Schema

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  collection TEXT NOT NULL,
  category TEXT NOT NULL,
  tag TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collections table (optional - for dynamic collections)
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  description TEXT,
  color TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_collection ON products(collection);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Insert sample products
INSERT INTO products (name, description, price, collection, category, tag, image_url, stock) VALUES
('The Maverick', 'A bold fusion of traditional craftsmanship and contemporary design. Hand-rolled edges, premium Italian silk.', 145.00, 'Spring 2026', 'Ties', 'New', 'tie1.jpeg', 30),
('Crimson Cascade', 'Deep red silk tie with intricate paisley patterns. Hand-rolled edges for lasting elegance.', 135.00, 'Essentials', 'Ties', 'Best Seller', 'tie2.jpeg', 25),
('Midnight Rebellion', 'Bold statement piece in midnight blue with gold accents. Limited run of 20 units.', 165.00, 'Limited Edition', 'Ties', 'Limited', 'tie1.jpeg', 20),
('Golden Hour', 'Warm golden tones meet classic patterns. Perfect for making an entrance.', 145.00, 'Spring 2026', 'Ties', NULL, 'tie2.jpeg', 35),
('Urban Chaos', 'Abstract geometric patterns inspired by city landscapes. Contemporary maximalism.', 155.00, 'Essentials', 'Ties', 'New', 'tie1.jpeg', 28),
('Velvet Dreams', 'Luxurious velvet finish with hand-embroidered details. True collector piece.', 175.00, 'Limited Edition', 'Ties', 'Limited', 'tie2.jpeg', 15);

-- Insert collections
INSERT INTO collections (name, subtitle, description, color) VALUES
('Spring 2026', 'Bold & Fearless', 'A celebration of colour, confidence, and controlled chaos.', '#FF3366'),
('Essentials', 'Timeless Statements', 'The permanent backbone of the brand. Designs that transcend season and trend.', '#00D9FF'),
('Limited Edition', 'Exclusive Pieces', 'Produced in runs of 20 units or fewer. Once they are gone, they are gone.', '#FFD700'),
('New Releases', 'New Innovation', 'The newest additions to the ENOTH universe. Experimentation lives here.', '#29dd4d');
