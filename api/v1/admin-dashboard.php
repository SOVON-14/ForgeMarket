<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$adminId = (int) ($_SESSION['user_id'] ?? 0);
if ($adminId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }
$admin = $pdo->prepare("SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1");
$admin->execute(['id' => $adminId]);
if ($admin->fetchColumn() !== 'admin') { http_response_code(403); echo json_encode(['error' => 'Accès réservé aux administrateurs.']); exit; }

try {
    $stats = [
        'totalUsers' => (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
        'totalArtisans' => (int) $pdo->query("SELECT COUNT(*) FROM artisan_profiles WHERE verification_status = 'verified'")->fetchColumn(),
        'totalOrders' => (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn(),
        'totalRevenue' => (float) $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM orders WHERE status = 'completed'")->fetchColumn(),
    ];

    $pending = $pdo->query("SELECT ap.id, CONCAT(u.first_name, ' ', u.last_name) AS name, ap.category AS specialty, ap.created_at AS submitted_at FROM artisan_profiles ap INNER JOIN users u ON u.id = ap.user_id WHERE ap.verification_status = 'pending' ORDER BY ap.created_at ASC LIMIT 5")->fetchAll();
    foreach ($pending as &$artisan) { $artisan['id'] = (int) $artisan['id']; }
    unset($artisan);

    $orders = $pdo->query("SELECT o.id, o.amount, o.status, CONCAT(c.first_name, ' ', c.last_name) AS client, CONCAT(a.first_name, ' ', a.last_name) AS artisan FROM orders o INNER JOIN users c ON c.id = o.client_id INNER JOIN artisan_profiles ap ON ap.id = o.artisan_id INNER JOIN users a ON a.id = ap.user_id ORDER BY o.created_at DESC LIMIT 5")->fetchAll();
    foreach ($orders as &$order) { $order['id'] = (int) $order['id']; $order['amount'] = (float) $order['amount']; }
    unset($order);

    $disputes = $pdo->query("SELECT d.id, d.order_id AS `order`, d.reason AS type, CONCAT(c.first_name, ' ', c.last_name) AS client, CONCAT(a.first_name, ' ', a.last_name) AS artisan FROM disputes d INNER JOIN orders o ON o.id = d.order_id INNER JOIN users c ON c.id = o.client_id INNER JOIN artisan_profiles ap ON ap.id = o.artisan_id INNER JOIN users a ON a.id = ap.user_id WHERE d.status IN ('open', 'under_review') ORDER BY d.created_at DESC LIMIT 5")->fetchAll();
    foreach ($disputes as &$dispute) { $dispute['id'] = (int) $dispute['id']; $dispute['order'] = (int) $dispute['order']; }
    unset($dispute);

    echo json_encode(['success' => true, 'data' => ['stats' => $stats, 'pendingArtisans' => $pending, 'recentOrders' => $orders, 'activeDisputes' => $disputes]]);
} catch (PDOException $exception) { http_response_code(500); echo json_encode(['error' => 'Impossible de charger le dashboard admin.']); }
