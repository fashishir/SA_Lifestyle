-- Admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@salifestyle.com', '$2a$10$D.rxZ0Ry9L21FKpYQGPi/e8aS.l//sDCPFcczLqBEnnJugqDDi2PS', 'admin'),
('John Doe', 'john@example.com', '$2a$10$D.rxZ0Ry9L21FKpYQGPi/e8aS.l//sDCPFcczLqBEnnJugqDDi2PS', 'customer');

-- Categories
INSERT INTO categories (name, slug, image_url, gender) VALUES
('New & Featured', 'new-and-featured', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'unisex'),
('Men''s Shoes', 'mens-shoes', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'men'),
('Women''s Shoes', 'womens-shoes', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'women'),
('Kids'' Shoes', 'kids-shoes', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'kids'),
('Men''s Clothing', 'mens-clothing', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600', 'men'),
('Women''s Clothing', 'womens-clothing', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600', 'women'),
('Accessories', 'accessories', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'unisex');

-- Products (all shoes!)
INSERT INTO products (name, slug, description, price, compare_price, category_id, image_urls, sizes, colors, gender, featured) VALUES
('SA_Lifestyle Air Force 1 ''07', 'salifestyle-air-force-1-07', 'The radiance lives on in the SA_Lifestyle Air Force 1 ''07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash to make you shine.', 129.99, 149.99, 1,
  ARRAY['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  ARRAY['6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12'],
  '[{"name":"White","hex":"#FFFFFF"},{"name":"Black","hex":"#000000"},{"name":"Red","hex":"#CC0000"}]',
  'unisex', true),

('SA_Lifestyle Dunk Low Retro', 'salifestyle-dunk-low-retro', 'Created for the hardwood but taken to the streets, the SA_Lifestyle Dunk Low Retro returns with classic details and retro basketball style.', 119.99, null, 2,
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'],
  ARRAY['6','7','8','9','10','11','12'],
  '[{"name":"University Red","hex":"#CC0000"},{"name":"Midnight Navy","hex":"#1B1B4B"},{"name":"White/Black","hex":"#EEEEEE"}]',
  'men', true),

('SA_Lifestyle Air Max 270', 'salifestyle-air-max-270', 'The SA_Lifestyle Air Max 270 delivers visible, oversized Air and a huge heel for a look that''s anything but subtle. The sleek design is perfect for everyday wear.', 159.99, 179.99, 3,
  ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'],
  ARRAY['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10'],
  '[{"name":"Pink Blast","hex":"#FF69B4"},{"name":"Black/White","hex":"#222222"},{"name":"White/Pure Platinum","hex":"#E8E8E8"}]',
  'women', true),

('SA_Lifestyle Air Zoom Pegasus 40', 'salifestyle-air-zoom-pegasus-40', 'Responsive cushioning meets reliable support in the Pegasus 40. An airy mesh upper and Zoom Air unit provide a smooth, energized ride.', 139.99, null, 2,
  ARRAY['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  ARRAY['7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12'],
  '[{"name":"Black/Anthracite","hex":"#333333"},{"name":"White/Black","hex":"#FFFFFF"},{"name":"Blue Fury","hex":"#4169E1"}]',
  'men', true),

('SA_Lifestyle Revolution 6', 'salifestyle-revolution-6', 'The SA_Lifestyle Revolution 6 is a reliable everyday running shoe with a soft foam midsole and breathable mesh upper for comfort mile after mile.', 74.99, 89.99, 2,
  ARRAY['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'],
  ARRAY['6','7','8','9','10','11','12','13'],
  '[{"name":"Black/White","hex":"#000000"},{"name":"Blue/White","hex":"#4169E1"},{"name":"Grey","hex":"#808080"}]',
  'men', true),

('SA_Lifestyle Winflo 10', 'salifestyle-winflo-10', 'Soft and smooth, the SA_Lifestyle Winflo 10 is made for the miles. Breathable mesh and responsive foam keep you comfortable on every run.', 99.99, 119.99, 3,
  ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  ARRAY['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5'],
  '[{"name":"White/Pink","hex":"#FFFFFF"},{"name":"Black/White","hex":"#222222"},{"name":"Teal","hex":"#008080"}]',
  'women', true),

('SA_Lifestyle Air Max 90', 'salifestyle-air-max-90', 'Nothing as fly, nothing as comfortable, nothing as proven. The SA_Lifestyle Air Max 90 stays true to its roots with the iconic Waffle sole, stitched overlays and classic TPU accents.', 139.99, null, 1,
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'],
  ARRAY['6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11'],
  '[{"name":"White/Chlorophyll","hex":"#F5F5F5"},{"name":"Black/Red","hex":"#1A1A1A"},{"name":"University Gold","hex":"#FFD700"}]',
  'unisex', true),

('SA_Lifestyle Court Vision Low', 'salifestyle-court-vision-low', 'Inspired by retro basketball style, the SA_Lifestyle Court Vision Low combines classic comfort with a clean, modern look for everyday wear.', 84.99, 99.99, 2,
  ARRAY['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  ARRAY['6','7','8','9','10','11','12'],
  '[{"name":"White/Navy","hex":"#FFFFFF"},{"name":"Black","hex":"#000000"},{"name":"White/Red","hex":"#FFFFFF"}]',
  'men', false),

('SA_Lifestyle Legend Essential', 'salifestyle-legend-essential', 'The SA_Lifestyle Legend Essential trainer is designed for high-intensity workouts with supportive fit and durable construction.', 89.99, null, 3,
  ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600'],
  ARRAY['5','5.5','6','6.5','7','7.5','8','8.5','9'],
  '[{"name":"White/Vapor Green","hex":"#FFFFFF"},{"name":"Photon Dust","hex":"#C0C0C0"},{"name":"Black","hex":"#000000"}]',
  'women', false),

('SA_Lifestyle Everyday Plus Cushioned Socks', 'salifestyle-everyday-plus-cushioned-socks', 'The SA_Lifestyle Everyday Plus Cushioned Crew Socks give you a plush feel with every step. Cushioned in the heel and toe for comfort.', 19.99, null, 7,
  ARRAY['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'],
  ARRAY['S/M','L/XL'],
  '[{"name":"White/Black","hex":"#FFFFFF"},{"name":"Black/White","hex":"#000000"},{"name":"Multicolor","hex":"#FF6B6B"}]',
  'unisex', false),

('SA_Lifestyle Training Duffel Bag', 'salifestyle-training-duffel-bag', 'Made from durable coated material, the SA_Lifestyle Training Duffel has a large main compartment and multiple pockets for organisation.', 49.99, 64.99, 7,
  ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'],
  ARRAY['One Size'],
  '[{"name":"Black/White","hex":"#000000"},{"name":"Grey/Black","hex":"#555555"}]',
  'unisex', false),

('SA_Lifestyle Head Tie', 'salifestyle-head-tie', 'Made from soft, lightweight woven fabric, the SA_Lifestyle Head Tie helps keep your hair back and your look fresh.', 24.99, null, 7,
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600'],
  ARRAY['One Size'],
  '[{"name":"Black","hex":"#000000"},{"name":"White","hex":"#FFFFFF"}]',
  'unisex', false),

('SA_Lifestyle SB Force 58', 'salifestyle-sb-force-58', 'The SA_Lifestyle SB Force 58 is a low-top lace-up skate shoe with a vulcanized construction for a flexible, board-feel outsole.', 79.99, 94.99, 4,
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600'],
  ARRAY['3','3.5','4','4.5','5','5.5','6','6.5','7'],
  '[{"name":"Black/White","hex":"#000000"},{"name":"University Red","hex":"#CC0000"}]',
  'kids', false),

('SA_Lifestyle Air Force 1 LV8 3', 'salifestyle-air-force-1-lv8-3', 'Let your little one''s style shine with the SA_Lifestyle Air Force 1 LV8 3. Inspired by the OG basketball shoe, it has a hook-and-loop strap for easy on and off.', 89.99, null, 4,
  ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  ARRAY['1','1.5','2','2.5','3','3.5','4'],
  '[{"name":"White","hex":"#FFFFFF"},{"name":"Black","hex":"#000000"}]',
  'kids', false),

('SA_Lifestyle Run Swift', 'salifestyle-run-swift', 'Lightweight and breathable, the SA_Lifestyle Run Swift is perfect for your daily jog. The soft foam midsole provides responsive cushioning with every step.', 109.99, 129.99, 3,
  ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
  ARRAY['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5'],
  '[{"name":"White/Silver","hex":"#E8E8E8"},{"name":"Black/Pink","hex":"#1A1A1A"},{"name":"Lavender","hex":"#E6E6FA"}]',
  'women', true);
