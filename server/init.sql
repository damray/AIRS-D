-- ============================================
-- POSTGRESQL SCHEMA INITIALIZATION
-- ============================================
-- Database: shop_assist
-- Purpose: E-commerce chatbot with user accounts and shopping cart
-- ============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    stock INT DEFAULT 0,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert sample products
INSERT INTO products (name, description, price, image_url, stock, category) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'https://images.pexels.com/photos/18105/pexels-photo.jpg', 25, 'Electronics'),
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg', 150, 'Electronics'),
('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader', 49.99, 'https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg', 80, 'Electronics'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches', 89.99, 'https://images.pexels.com/photos/1194713/pexels-photo-1194713.jpeg', 60, 'Electronics'),
('Noise-Canceling Headphones', 'Premium wireless headphones with active noise cancellation', 249.99, 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg', 40, 'Electronics'),
('4K Monitor 27"', 'Ultra HD 4K monitor with HDR support', 399.99, 'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg', 30, 'Electronics'),
('Webcam HD', '1080p webcam with auto-focus and built-in microphone', 79.99, 'https://images.pexels.com/photos/4792285/pexels-photo-4792285.jpeg', 100, 'Electronics'),
('Portable SSD 1TB', 'Ultra-fast portable SSD with USB-C connectivity', 129.99, 'https://images.pexels.com/photos/2582928/pexels-photo-2582928.jpeg', 70, 'Electronics'),
('Desk Lamp LED', 'Adjustable LED desk lamp with USB charging port', 39.99, 'https://images.pexels.com/photos/1047540/pexels-photo-1047540.jpeg', 120, 'Home'),
('Office Chair Ergonomic', 'Ergonomic office chair with lumbar support', 199.99, 'https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg', 45, 'Furniture')
ON CONFLICT DO NOTHING;
