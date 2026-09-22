<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Product ID is required']);
    exit;
}

try {
    $query = "SELECT p.*, c.name as category_name, a.business_name as artisan_name,
                a.average_rating as artisan_rating, a.city as artisan_city,
                a.verification_status, a.years_experience,
                u.first_name, u.last_name, u.email, u.phone
                FROM products p
                JOIN product_categories c ON p.category_id = c.id
                JOIN artisan_profiles a ON p.artisan_id = a.id
                JOIN users u ON a.user_id = u.id
                WHERE p.id = ?";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }

    // Get all images for this product
    $imagesStmt = $pdo->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC");
    $imagesStmt->execute([$id]);
    $images = $imagesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Increment view count
    $updateViewStmt = $pdo->prepare("UPDATE products SET views_count = views_count + 1 WHERE id = ?");
    $updateViewStmt->execute([$id]);

    $product['images'] = $images;
    $product['primary_image'] = null;

    foreach ($images as $image) {
        if ($image['is_primary']) {
            $product['primary_image'] = $image['image_url'];
            break;
        }
    }

    // If no primary image, use first image
    if (!$product['primary_image'] && !empty($images)) {
        $product['primary_image'] = $images[0]['image_url'];
    }

    echo json_encode([
        'success' => true,
        'data' => $product
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}