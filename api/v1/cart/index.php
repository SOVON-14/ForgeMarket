<?php
require_once '../../config/database.php';

session_start();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetCart();
        break;
    case 'POST':
        handleAddToCart();
        break;
    case 'PATCH':
        handleUpdateCartItem();
        break;
    case 'DELETE':
        handleRemoveFromCart();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGetCart() {
    try {
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        $sessionId = session_id();

        $query = "SELECT ci.*, p.title, p.price, p.stock, p.image_url,
                    pi.image_url as primary_image,
                    a.business_name as artisan_name,
                    c.name as category_name
                    FROM cart_items ci
                    JOIN products p ON ci.product_id = p.id
                    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
                    JOIN artisan_profiles a ON p.artisan_id = a.id
                    JOIN product_categories c ON p.category_id = c.id
                    WHERE (ci.user_id = ? OR ci.session_id = ?)
                    ORDER BY ci.created_at DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId, $sessionId]);
        $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $total = 0;
        $totalItems = 0;
        $uniqueArtisans = [];

        foreach ($cartItems as &$item) {
            $item['subtotal'] = $item['price'] * $item['quantity'];
            $total += $item['subtotal'];
            $totalItems += $item['quantity'];

            if (!in_array($item['artisan_id'], $uniqueArtisans)) {
                $uniqueArtisans[] = $item['artisan_id'];
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $cartItems,
            'summary' => [
                'total_items' => $totalItems,
                'total_amount' => $total,
                'unique_artisans' => count($uniqueArtisans),
                'is_authenticated' => isset($_SESSION['user_id'])
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleAddToCart() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['product_id']) || empty($data['quantity'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID and quantity are required']);
            exit;
        }

        $quantity = max(1, intval($data['quantity']));

        // Check if product exists and has stock
        $productStmt = $pdo->prepare("SELECT id, stock, artisan_id FROM products WHERE id = ? AND is_active = 1");
        $productStmt->execute([$data['product_id']]);
        $product = $productStmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found or inactive']);
            exit;
        }

        if ($product['stock'] < $quantity) {
            http_response_code(400);
            echo json_encode(['error' => 'Insufficient stock']);
            exit;
        }

        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        $sessionId = session_id();

        // Check if item already exists in cart
        $checkStmt = $pdo->prepare("SELECT id, quantity FROM cart_items WHERE product_id = ? AND (user_id = ? OR session_id = ?)");
        $checkStmt->execute([$data['product_id'], $userId, $sessionId]);
        $existingItem = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingItem) {
            // Update quantity
            $newQuantity = $existingItem['quantity'] + $quantity;
            if ($newQuantity > $product['stock']) {
                http_response_code(400);
                echo json_encode(['error' => 'Requested quantity exceeds available stock']);
                exit;
            }

            $updateStmt = $pdo->prepare("UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $updateStmt->execute([$newQuantity, $existingItem['id']]);
        } else {
            // Add new item
            $insertStmt = $pdo->prepare("INSERT INTO cart_items (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, ?)");
            $insertStmt->execute([$userId, $sessionId, $data['product_id'], $quantity]);
        }

        // Notify artisan that their product was added to cart
        $notificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, type, title, message, link_url)
                                            SELECT u.id, 'cart_update', ?, ?, ? FROM users u
                                            JOIN artisan_profiles ap ON u.id = ap.user_id
                                            WHERE ap.id = ?");
        $notificationStmt->execute([
            'Votre produit a été ajouté au panier',
            'Un client a ajouté votre produit au panier d\'achat',
            '/artisan-dashboard.php'
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Product added to cart'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleUpdateCartItem() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['cart_item_id']) || empty($data['quantity'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Cart item ID and quantity are required']);
            exit;
        }

        $quantity = max(1, intval($data['quantity']));

        // Check stock
        $stockStmt = $pdo->prepare("SELECT stock FROM products p JOIN cart_items ci ON p.id = ci.product_id WHERE ci.id = ?");
        $stockStmt->execute([$data['cart_item_id']]);
        $stock = $stockStmt->fetch(PDO::FETCH_ASSOC);

        if ($quantity > $stock['stock']) {
            http_response_code(400);
            echo json_encode(['error' => 'Requested quantity exceeds available stock']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$quantity, $data['cart_item_id']]);

        echo json_encode([
            'success' => true,
            'message' => 'Cart item updated'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleRemoveFromCart() {
    try {
        $cartItemId = $_GET['id'] ?? null;

        if (!$cartItemId) {
            http_response_code(400);
            echo json_encode(['error' => 'Cart item ID is required']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM cart_items WHERE id = ?");
        $stmt->execute([$cartItemId]);

        echo json_encode([
            'success' => true,
            'message' => 'Item removed from cart'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}