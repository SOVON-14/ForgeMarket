<?php
require_once '../../config/database.php';

session_start();

header('Content-Type: application/json');

// Check if user is authenticated artisan
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'artisan') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Artisan access required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    handleCreateProduct();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function handleCreateProduct() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validation
        if (empty($data['title']) || empty($data['description']) || empty($data['price']) || empty($data['category_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }

        if ($data['price'] <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Price must be positive']);
            exit;
        }

        // Get artisan profile ID
        $artisanStmt = $pdo->prepare("SELECT id FROM artisan_profiles WHERE user_id = ?");
        $artisanStmt->execute([$_SESSION['user_id']]);
        $artisan = $artisanStmt->fetch(PDO::FETCH_ASSOC);

        if (!$artisan) {
            http_response_code(400);
            echo json_encode(['error' => 'Artisan profile not found']);
            exit;
        }

        $query = "INSERT INTO products (artisan_id, category_id, title, description, price, stock, is_standard, specifications, delivery_days, image_url)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $specifications = isset($data['specifications']) ? json_encode($data['specifications']) : null;

        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $artisan['id'],
            $data['category_id'],
            $data['title'],
            $data['description'],
            $data['price'],
            $data['stock'] ?? 0,
            $data['is_standard'] ?? true,
            $specifications,
            $data['delivery_days'] ?? null,
            $data['image_url'] ?? null
        ]);

        $productId = $pdo->lastInsertId();

        // Add images if provided
        if (!empty($data['images'])) {
            foreach ($data['images'] as $index => $imageUrl) {
                $isPrimary = ($index === 0);
                $imageStmt = $pdo->prepare("INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)");
                $imageStmt->execute([$productId, $imageUrl, $isPrimary, $index]);
            }
        }

        // Create notification for admin
        $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, type, title, message, link_url) SELECT id, 'new_product', ?, ?, ? FROM users WHERE role = 'admin' LIMIT 1");
        $notificationStmt->execute([
            'Nouveau produit ajouté',
            $data['title'] . ' par ' . $_SESSION['first_name'] . ' ' . $_SESSION['last_name'],
            '/admin-artisans.php'
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Product created successfully',
            'product_id' => $productId
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}