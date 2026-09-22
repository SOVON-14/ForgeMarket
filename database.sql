CREATE DATABASE IF NOT EXISTS forgemarket
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE forgemarket;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS order_attachments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS orders_split;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS quote_responses;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS artisan_portfolio;
DROP TABLE IF EXISTS artisan_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_categories;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role ENUM('client', 'artisan', 'admin') NOT NULL DEFAULT 'client',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE artisan_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    business_name VARCHAR(150) NULL,
    bio TEXT NULL,
    category ENUM('ferronnerie', 'soudure', 'construction_metallique', 'menuiserie_metal') NOT NULL,
    city ENUM('lome', 'sokode', 'kara', 'atsapie', 'tsevie') NOT NULL,
    address VARCHAR(255) NULL,
    years_experience SMALLINT UNSIGNED NULL,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    verification_document_url VARCHAR(500) NULL,
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
    total_orders INT UNSIGNED NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_artisan_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_artisans_category_city (category, city),
    INDEX idx_artisans_verification (verification_status),
    INDEX idx_artisans_rating (average_rating)
) ENGINE=InnoDB;

CREATE TABLE artisan_portfolio (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    artisan_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_portfolio_artisan FOREIGN KEY (artisan_id) REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    INDEX idx_portfolio_artisan (artisan_id)
) ENGINE=InnoDB;

CREATE TABLE quotes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    artisan_id BIGINT UNSIGNED NULL,
    quote_type ENUM('direct', 'tender') NOT NULL DEFAULT 'direct',
    category ENUM('ferronnerie', 'soudure', 'construction_metallique', 'menuiserie_metal') NULL,
    city ENUM('lome', 'sokode', 'kara', 'atsapie', 'tsevie') NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    estimated_budget DECIMAL(12,2) NULL,
    deadline DATE NULL,
    project_address VARCHAR(255) NOT NULL,
    status ENUM('open', 'in_review', 'accepted', 'rejected', 'cancelled', 'expired') NOT NULL DEFAULT 'open',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quotes_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotes_artisan FOREIGN KEY (artisan_id) REFERENCES artisan_profiles(id) ON DELETE SET NULL,
    INDEX idx_quotes_client (client_id),
    INDEX idx_quotes_artisan (artisan_id),
    INDEX idx_quotes_status (status),
    INDEX idx_quotes_category_city (category, city)
) ENGINE=InnoDB;

CREATE TABLE quote_responses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT UNSIGNED NOT NULL,
    artisan_id BIGINT UNSIGNED NOT NULL,
    proposed_amount DECIMAL(12,2) NOT NULL,
    estimated_days SMALLINT UNSIGNED NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_quote_artisan UNIQUE (quote_id, artisan_id),
    CONSTRAINT fk_response_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    CONSTRAINT fk_response_artisan FOREIGN KEY (artisan_id) REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    INDEX idx_responses_status (status)
) ENGINE=InnoDB;

CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    artisan_id BIGINT UNSIGNED NULL,
    quote_id BIGINT UNSIGNED NULL,
    order_type ENUM('custom', 'catalog', 'mixed') NOT NULL DEFAULT 'custom',
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed') NOT NULL DEFAULT 'pending',
    payment_status ENUM('unpaid', 'pending', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    delivery_address VARCHAR(255) NOT NULL,
    expected_date DATE NULL,
    completed_at DATETIME NULL,
    is_multi_artisan BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_artisan FOREIGN KEY (artisan_id) REFERENCES artisan_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
    INDEX idx_orders_client_status (client_id, status),
    INDEX idx_orders_artisan_status (artisan_id, status),
    INDEX idx_orders_created (created_at),
    INDEX idx_orders_type (order_type)
) ENGINE=InnoDB;

CREATE TABLE order_attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT UNSIGNED NOT NULL,
    recipient_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,
    quote_id BIGINT UNSIGNED NULL,
    body TEXT NOT NULL,
    attachment_url VARCHAR(500) NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT fk_message_quote FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
    INDEX idx_messages_conversation (sender_id, recipient_id, created_at),
    INDEX idx_messages_unread (recipient_id, read_at)
) ENGINE=InnoDB;

CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,
    client_id BIGINT UNSIGNED NOT NULL,
    artisan_id BIGINT UNSIGNED NOT NULL,
    overall_rating TINYINT UNSIGNED NOT NULL,
    quality_rating TINYINT UNSIGNED NULL,
    timeliness_rating TINYINT UNSIGNED NULL,
    communication_rating TINYINT UNSIGNED NULL,
    value_rating TINYINT UNSIGNED NULL,
    comment TEXT NOT NULL,
    pros TEXT NULL,
    cons TEXT NULL,
    recommend BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reviews_overall CHECK (overall_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_quality CHECK (quality_rating IS NULL OR quality_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_timeliness CHECK (timeliness_rating IS NULL OR timeliness_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_communication CHECK (communication_rating IS NULL OR communication_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_reviews_value CHECK (value_rating IS NULL OR value_rating BETWEEN 1 AND 5),
    CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_review_artisan FOREIGN KEY (artisan_id) REFERENCES artisan_profiles(id) ON DELETE RESTRICT,
    INDEX idx_reviews_artisan (artisan_id)
) ENGINE=InnoDB;

CREATE TABLE disputes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    opened_by BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'under_review', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
    resolution TEXT NULL,
    resolved_by BIGINT UNSIGNED NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_opener FOREIGN KEY (opened_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dispute_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_disputes_status (status)
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(500) NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, read_at, created_at)
) ENGINE=InnoDB;

-- Tables pour le catalogue de produits et le panier
CREATE TABLE product_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    icon VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    artisan_id BIGINT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    is_standard BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    specifications JSON NULL,
    delivery_days SMALLINT UNSIGNED NULL,
    image_url VARCHAR(500) NULL,
    views_count INT UNSIGNED NOT NULL DEFAULT 0,
    orders_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_artisan FOREIGN KEY (artisan_id) REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT,
    INDEX idx_products_artisan (artisan_id),
    INDEX idx_products_category (category_id),
    INDEX idx_products_active (is_active),
    INDEX idx_products_price (price)
) ENGINE=InnoDB;

CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_image_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_images_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    session_id VARCHAR(100) NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cart_user (user_id),
    INDEX idx_cart_session (session_id)
) ENGINE=InnoDB;

CREATE TABLE orders_split (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parent_order_id BIGINT UNSIGNED NOT NULL,
    artisan_id BIGINT UNSIGNED NOT NULL,
    product_ids JSON NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_split_parent FOREIGN KEY (parent_order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_split_artisan FOREIGN KEY (artisan_id) REFERENCES artisan_profiles(id) ON DELETE CASCADE,
    INDEX idx_split_parent (parent_order_id),
    INDEX idx_split_artisan (artisan_id)
) ENGINE=InnoDB;

-- Insérer les catégories de produits par défaut
INSERT INTO product_categories (name, description, icon) VALUES
('Portails', 'Portails en fer forgé et clôtures', 'fa-door-open'),
('Clôtures', 'Clôtures métalliques et grillages', 'fa-border-all'),
('Structures', 'Structures métalliques et charpentes', 'fa-building'),
('Mobilier', 'Mobilier métallique et rangements', 'fa-chair'),
('Décoration', 'Éléments décoratifs en métal', 'fa-star'),
('Réparation', 'Services de réparation et soudure', 'fa-tools');

