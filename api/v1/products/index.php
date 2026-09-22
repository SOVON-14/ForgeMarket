<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetProducts();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGetProducts() {
    try {
        $category_id = $_GET['category_id'] ?? null;
        $artisan_id = $_GET['artisan_id'] ?? null;
        $search = $_GET['search'] ?? null;
        $sort = $_GET['sort'] ?? 'created_at';
        $order = $_GET['order'] ?? 'DESC';
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
        $offset = ($page - 1) * $limit;

        $query = "SELECT p.*, c.name as category_name, a.business_name as artisan_name,
                    a.average_rating as artisan_rating, a.city as artisan_city,
                    a.verification_status, u.first_name, u.last_name
                    FROM products p
                    JOIN product_categories c ON p.category_id = c.id
                    JOIN artisan_profiles a ON p.artisan_id = a.id
                    JOIN users u ON a.user_id = u.id
                    WHERE p.is_active = 1 AND a.verification_status = 'verified'";

        $params = [];

        if ($category_id) {
            $query .= " AND p.category_id = ?";
            $params[] = $category_id;
        }

        if ($artisan_id) {
            $query .= " AND p.artisan_id = ?";
            $params[] = $artisan_id;
        }

        if ($search) {
            $query .= " AND (p.title LIKE ? OR p.description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        // Sorting
        $allowedSort = ['created_at', 'price', 'title', 'views_count', 'orders_count'];
        $sort = in_array($sort, $allowedSort) ? $sort : 'created_at';
        $order = strtoupper($order) === 'DESC' ? 'DESC' : 'ASC';

        $query .= " ORDER BY p.$sort $order LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get primary images for each product
        foreach ($products as &$product) {
            $imageStmt = $pdo->prepare("SELECT image_url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1");
            $imageStmt->execute([$product['id']]);
            $primaryImage = $imageStmt->fetch(PDO::FETCH_ASSOC);
            $product['primary_image'] = $primaryImage ? $primaryImage['image_url'] : null;

            // Get total images count
            $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM product_images WHERE product_id = ?");
            $countStmt->execute([$product['id']]);
            $imageCount = $countStmt->fetch(PDO::FETCH_ASSOC);
            $product['images_count'] = $imageCount['count'];
        }

        // Get total count for pagination
        $countQuery = str_replace("SELECT p.*, c.name as category_name, a.business_name as artisan_name,
                    a.average_rating as artisan_rating, a.city as artisan_city,
                    a.verification_status, u.first_name, u.last_name
                    FROM products p
                    JOIN product_categories c ON p.category_id = c.id
                    JOIN artisan_profiles a ON p.artisan_id = a.id
                    JOIN users u ON a.user_id = u.id
                    WHERE p.is_active = 1 AND a.verification_status = 'verified'", "SELECT COUNT(*) as total FROM products p
                    JOIN product_categories c ON p.category_id = c.id
                    JOIN artisan_profiles a ON p.artisan_id = a.id
                    JOIN users u ON a.user_id = u.id
                    WHERE p.is_active = 1 AND a.verification_status = 'verified'");

        $countParams = [];
        if ($category_id) {
            $countQuery .= " AND p.category_id = ?";
            $countParams[] = $category_id;
        }
        if ($artisan_id) {
            $countQuery .= " AND p.artisan_id = ?";
            $countParams[] = $artisan_id;
        }
        if ($search) {
            $countQuery .= " AND (p.title LIKE ? OR p.description LIKE ?)";
            $countParams[] = "%$search%";
            $countParams[] = "%$search%";
        }

        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($countParams);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        echo json_encode([
            'success' => true,
            'data' => $products,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}