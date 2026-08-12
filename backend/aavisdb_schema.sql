-- ==========================================
-- Aavis — AI Food Label Scanner
-- Production-Ready PostgreSQL Schema
-- Database: aavisdb
-- ==========================================

-- Note: If running via psql, uncomment the following two lines:
-- CREATE DATABASE aavisdb;
-- \c aavisdb;

-- Enable UUID extension (Required for Supabase & general UUID usage)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUM TYPES
-- ==========================================
CREATE TYPE risk_level_enum AS ENUM ('Safe', 'Caution', 'Hazardous', 'Unknown');
CREATE TYPE verdict_enum AS ENUM ('safe', 'caution', 'hazardous');
CREATE TYPE scan_type_enum AS ENUM ('barcode', 'image_ocr', 'manual_text');
CREATE TYPE report_status_enum AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE notification_type_enum AS ENUM ('alert', 'achievement', 'reminder', 'system');

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 1. USERS
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age INT CHECK (age > 0 AND age < 120),
    language VARCHAR(10) DEFAULT 'en',
    avatar_url TEXT,
    streak_count INT DEFAULT 0 CHECK (streak_count >= 0),
    weekly_grade VARCHAR(2) DEFAULT 'A',
    total_scans INT DEFAULT 0 CHECK (total_scans >= 0),
    harmful_products_avoided INT DEFAULT 0 CHECK (harmful_products_avoided >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX idx_users_email ON users(email);

-- ==========================================
-- 2. DIET TYPES
-- ==========================================
CREATE TABLE diet_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. USER DIET PREFERENCES
-- ==========================================
CREATE TABLE user_diet_preferences (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    diet_type_id UUID REFERENCES diet_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, diet_type_id)
);

-- ==========================================
-- 4. HEALTH CONDITIONS
-- ==========================================
CREATE TABLE health_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. USER HEALTH CONDITIONS
-- ==========================================
CREATE TABLE user_health_conditions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    condition_id UUID REFERENCES health_conditions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, condition_id)
);

-- ==========================================
-- 6. ALLERGENS
-- ==========================================
CREATE TABLE allergens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 7. USER ALLERGENS
-- ==========================================
CREATE TABLE user_allergens (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    allergen_id UUID REFERENCES allergens(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, allergen_id)
);

-- ==========================================
-- 8. PRODUCTS
-- ==========================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    barcode VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    ingredients_text TEXT,
    nutrition_json JSONB DEFAULT '{}',
    additives_detected JSONB DEFAULT '[]',
    allergens_detected JSONB DEFAULT '[]',
    health_score INT CHECK (health_score >= 0 AND health_score <= 100),
    verdict verdict_enum DEFAULT 'safe',
    image_url TEXT,
    country VARCHAR(100) DEFAULT 'India',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_brand ON products(brand_name);
-- GIN index for full-text search on JSONb if needed
CREATE INDEX idx_products_nutrition ON products USING GIN (nutrition_json);

-- ==========================================
-- 9. ADDITIVES
-- ==========================================
CREATE TABLE additives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    additive_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'E102'
    additive_name VARCHAR(255) NOT NULL,       -- e.g., 'Tartrazine'
    risk_level risk_level_enum DEFAULT 'Unknown',
    description TEXT,
    banned_countries TEXT[],                   -- Array of countries where banned
    side_effects TEXT[],                       -- Array of known side effects
    scientific_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_additives
BEFORE UPDATE ON additives
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX idx_additives_code ON additives(additive_code);

-- ==========================================
-- 10. PRODUCT ADDITIVES
-- ==========================================
CREATE TABLE product_additives (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    additive_id UUID REFERENCES additives(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, additive_id)
);

-- ==========================================
-- 11. SCANS
-- ==========================================
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    scanned_image_url TEXT,
    ai_summary TEXT,
    roast_text TEXT,
    health_score INT CHECK (health_score >= 0 AND health_score <= 100),
    scan_type scan_type_enum DEFAULT 'image_ocr',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_product_id ON scans(product_id);
CREATE INDEX idx_scans_created_at ON scans(created_at);

-- ==========================================
-- 12. SCAN NUTRIENTS
-- ==========================================
CREATE TABLE scan_nutrients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE UNIQUE,
    calories DECIMAL(10,2) DEFAULT 0,
    sugar DECIMAL(10,2) DEFAULT 0,
    sodium DECIMAL(10,2) DEFAULT 0,
    fat DECIMAL(10,2) DEFAULT 0,
    fiber DECIMAL(10,2) DEFAULT 0,
    protein DECIMAL(10,2) DEFAULT 0,
    carbs DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 13. SAVED PRODUCTS
-- ==========================================
CREATE TABLE saved_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_saved_products_user ON saved_products(user_id);

-- ==========================================
-- 14. SCAN HISTORY (Log Table)
-- ==========================================
CREATE TABLE scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
    action_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 15. PRODUCT REVIEWS
-- ==========================================
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

CREATE TRIGGER set_timestamp_product_reviews
BEFORE UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);

-- ==========================================
-- 16. NOTIFICATIONS
-- ==========================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ==========================================
-- 17. ACHIEVEMENTS
-- ==========================================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    required_streak INT DEFAULT 0,
    required_scans INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 18. USER ACHIEVEMENTS
-- ==========================================
CREATE TABLE user_achievements (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- ==========================================
-- 19. DAILY HEALTH REPORTS
-- ==========================================
CREATE TABLE daily_health_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary_text TEXT,
    average_score INT,
    scans_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, report_date)
);

-- ==========================================
-- 20. WEEKLY HEALTH REPORTS
-- ==========================================
CREATE TABLE weekly_health_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    grade VARCHAR(2),
    summary_text TEXT,
    average_score INT,
    hazardous_avoided INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start_date)
);

-- ==========================================
-- 21. SEARCH HISTORY
-- ==========================================
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    search_query VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_user ON search_history(user_id);

-- ==========================================
-- 22. AI CHAT HISTORY
-- ==========================================
CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) CHECK (role IN ('user', 'model')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_chat_history_user ON ai_chat_history(user_id);

-- ==========================================
-- 23. EDUCATIONAL ARTICLES
-- ==========================================
CREATE TABLE educational_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    image_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_articles
BEFORE UPDATE ON educational_articles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ==========================================
-- 24. PRODUCT ALTERNATIVES
-- ==========================================
CREATE TABLE product_alternatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazardous_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    alternative_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    match_percentage INT CHECK (match_percentage >= 0 AND match_percentage <= 100),
    reason_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hazardous_product_id, alternative_product_id)
);

-- ==========================================
-- 25. REPORTS
-- ==========================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    report_reason TEXT NOT NULL,
    status report_status_enum DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_timestamp_reports
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ==========================================
-- SAMPLE DATA INSERTS
-- ==========================================

-- Diet Types
INSERT INTO diet_types (name, description) VALUES
('Vegetarian', 'No meat, poultry, or fish.'),
('Vegan', 'No animal products whatsoever.'),
('Jain', 'No root vegetables, meat, or eggs.'),
('Keto', 'High-fat, low-carbohydrate diet.'),
('Diabetic-Friendly', 'Low sugar, low glycemic index foods.'),
('Non-Vegetarian', 'Includes meat, poultry, and fish.')
ON CONFLICT (name) DO NOTHING;

-- Health Conditions
INSERT INTO health_conditions (name, description) VALUES
('Diabetes', 'Requires monitoring of sugar and carbohydrates.'),
('Hypertension', 'Requires monitoring of sodium intake.'),
('Heart Disease', 'Requires monitoring of trans fats and saturated fats.'),
('Obesity', 'Focuses on caloric deficit and metabolic health.')
ON CONFLICT (name) DO NOTHING;

-- Allergens
INSERT INTO allergens (name, description) VALUES
('Peanuts', 'Allergy to peanuts.'),
('Dairy', 'Allergy or intolerance to milk products.'),
('Gluten', 'Celiac disease or gluten sensitivity.'),
('Soy', 'Allergy to soy-based products.'),
('Eggs', 'Allergy to eggs.'),
('Shellfish', 'Allergy to marine animals with shells.'),
('Tree Nuts', 'Allergy to almonds, walnuts, etc.')
ON CONFLICT (name) DO NOTHING;

-- Additives (Sample)
INSERT INTO additives (additive_code, additive_name, risk_level, description, banned_countries, side_effects) VALUES
('E102', 'Tartrazine', 'Hazardous', 'Synthetic lemon yellow azo dye.', '{"Norway", "Austria"}', '{"Hyperactivity in children", "Allergic reactions"}'),
('E211', 'Sodium Benzoate', 'Caution', 'Preservative commonly used in acidic foods.', '{}', '{"Asthma exacerbation", "DNA damage when combined with Vitamin C"}'),
('E621', 'Monosodium Glutamate (MSG)', 'Caution', 'Flavor enhancer commonly used in savory foods.', '{}', '{"Headaches", "Nausea", "Palpitations in sensitive individuals"}'),
('E300', 'Ascorbic Acid (Vitamin C)', 'Safe', 'Naturally occurring antioxidant.', '{}', '{}')
ON CONFLICT (additive_code) DO NOTHING;

-- ==========================================
-- END OF SCHEMA
-- ==========================================
