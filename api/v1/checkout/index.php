<?php
require_once '../../config/database.php';

session_start();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    handleCheckout();
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function handleCheckout() {
    try {
        // Check if user is authenticated
        if (!isset($_SESSION['user_id'])) {
            echo json_encode([
                'success' => false,
                'error' => 'Authentication required',
                'redirect' => 'login.html'
            ]);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['delivery_address'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Delivery address is required']);
            exit;
        }

        $userId = $_SESSION['user_id'];
        $sessionId = session_id();

        // Get cart items
        $query = "SELECT ci.*, p.title, p.price, p.artisan_id, p.delivery_days,
                    p.stock, a.city as artisan_city
                    FROM cart_items ci
                    JOIN products p ON ci.product_id = p.id
                    JOIN artisan_profiles a ON p.artisan_id = a.id
                    WHERE (ci.user_id = ? OR ci.session_id = ?)
                    ORDER BY ci.created_at DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId, $sessionId]);
        $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($cartItems)) {
            http_response_code(400);
            echo json_encode(['error' => 'Cart is empty']);
            exit;
        }

        // Check stock availability
        foreach ($cartItems as $item) {
            if ($item['quantity'] > $item['stock']) {
                http_response_code(400);
            echo json_encode(['error' => 'Insufficient stock for: ' . $item['title']]);
                exit;
            }
        }

        // Group cart items by artisan
        $artisanItems = [];
        foreach ($cartItems as $item) {
            $artisanId = $item['artisan_id'];
            if (!isset($artisanItems[$artisanId])) {
                $artisanItems[$artisanId] = [];
            }
            $artisanItems[$artisanId][] = $item;
        }

        // Calculate delivery fees (estimated based on city)
        $deliveryFees = calculateDeliveryFees($artisanItems);

        // Create main order
        $totalAmount = array_sum(array_map(function($item) {
            return $item['price'] * $item['quantity'];
        }, $cartItems));

        $totalDeliveryFee = array_sum($deliveryFees);
        $grandTotal = $totalAmount + $totalDeliveryFee;

        $orderQuery = "INSERT INTO orders (client_id, order_type, title, description, amount, delivery_address, payment_status, is_multi_artisan)
                        VALUES (?, 'catalog', ?, ?, ?, ?, ?, 'pending', TRUE)";

        $stmt = $pdo->prepare($orderQuery);
        $stmt->execute([
            $userId,
            'Commande depuis catalogue',
            'Commande de produits depuis catalogue',
            'Panier: ' . count($cartItems) . ' articles',
            $grandTotal,
            $data['delivery_address']
        ]);

        $parentOrderId = $pdo->lastInsertId();

        // Create split orders for each artisan
        foreach ($artisanItems as $artisanId => $items) {
            $artisanTotal = array_sum(array_map(function($item) {
                return $item['price'] * $item['quantity'];
            }, $items));

            $artisanDeliveryFee = $deliveryFees[$artisanId] ?? 0;
            $commission = $artisanTotal * 0.08; // 8% commission

            $orderSplitQuery = "INSERT INTO orders_split (parent_order_id, artisan_id, product_ids, total_amount, commission_amount, delivery_fee)
                                    VALUES (?, ?, ?, ?, ?, ?)";

            $productIds = array_map(function($item) {
                return $item['product_id'];
            }, $items);

            $splitStmt = $pdo->prepare($orderSplitQuery);
            $splitStmt->execute([
                $parentOrderId,
                $artisanId,
                json_encode($productIds),
                $artisanTotal,
                $commission,
                $artisanDeliveryFee
            ]);

            // Update product stock
            foreach ($items as $item) {
                $updateStockStmt = $pdo->prepare("UPDATE products SET stock = stock - ?, orders_count = orders_count + 1 WHERE id = ?");
                $updateStockStmt->execute([$item['quantity'], $item['product_id']]);
            }

            // Create individual order for artisan
            $individualOrderQuery = "INSERT INTO orders (client_id, artisan_id, order_type, title, description, amount, delivery_address, expected_date, status)
                                     VALUES (?, ?, 'catalog', ?, ?, ?, ?, ?, 'pending')";

            $expectedDate = date('Y-m-d', strtotime('+' . ($items[0]['delivery_days'] ?? 7) . ' days'));

            $orderStmt = $pdo->prepare($individualOrderQuery);
            $orderStmt->execute([
                $userId,
                $artisanId,
                'Commande catalogue: ' . $items[0]['title'] . (count($items) > 1 ? ' + ' . (count($items) - 1) . ' autres' : ''),
                'Commande depuis catalogue ForgeMarket',
                $artisanTotal + $artisanDeliveryFee,
                $data['delivery_address'],
                $expectedDate
            ]);

            // Notify artisan
            $notificationQuery = "INSERT INTO notifications (user_id, type, title, message, link_url)
                                         SELECT u.id, 'new_order', ?, ?, ? FROM users u
                                         JOIN artisan_profiles ap ON u.id = ap.user_id
                                         WHERE ap.id = ?";
            $notificationQuery = $pdo->prepare($notificationQuery);
            $notificationQuery->execute([
                'Nouvelle commande catalogue',
                'Vous avez reçu une nouvelle commande de ' . count($items) . ' produit(s) pour un total de ' . ($artisanTotal + $artisanDeliveryFee) . ' FCFA',
                '/artisan-dashboard.php'
            ]);
        }

        // Clear cart
        $clearCartStmt = $pdo->prepare("DELETE FROM cart_items WHERE user_id = ? OR session_id = ?");
        $clearCartStmt->execute([$userId, $sessionId]);

        // Create notification for client
        $clientNotificationStmt = $pdo->prepare("INSERT INTO notifications (user_id, type, title, message, link_url) VALUES (?, 'order_created', ?, ?, ?)");
        $clientNotificationStmt->execute([
            $userId,
            'Commande créée avec succès',
            'Votre commande de ' . $grandTotal . ' FCFA a été créée. ' . count($artisanItems) . ' artisan(s) traiteront votre commande.',
            '/orders.php'
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Order created successfully',
            'order_id' => $parentOrderId,
            'total_amount' => $grandTotal,
            'items_count' => count($cartItems),
            'artisans_count' => count($artisanItems)
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

function calculateDeliveryFees($artisanItems) {
    $fees = [];
    $baseFee = 2000; // Base delivery fee

    foreach ($artisanItems as $artisanId => $items) {
        // Fee based on city (estimated)
        $city = $items[0]['artisan_city'];
        switch ($city) {
            case 'lome':
                $fees[$artisanId] = $baseFee;
                break;
            case 'sokode':
            case 'kara':
                $fees[$artisanId] = $baseFee + 1000;
                break;
            default:
                $fees[$artisanId] = $baseFee + 2000;
        }
    }

    return $fees;
}