<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }

try {
    $user = $pdo->prepare("SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1");
    $user->execute(['id' => $userId]);
    if ($user->fetchColumn() !== 'client') { http_response_code(403); echo json_encode(['error' => 'Tableau de bord client uniquement.']); exit; }

    $orders = $pdo->prepare('SELECT COUNT(*) AS total, SUM(status = \'completed\') AS completed FROM orders WHERE client_id = :user_id');
    $orders->execute(['user_id' => $userId]);
    $orderStats = $orders->fetch();

    $messages = $pdo->prepare('SELECT COUNT(*) FROM messages WHERE recipient_id = :user_id AND read_at IS NULL');
    $messages->execute(['user_id' => $userId]);

    $reviews = $pdo->prepare('SELECT COUNT(*) FROM reviews WHERE client_id = :user_id');
    $reviews->execute(['user_id' => $userId]);

    echo json_encode(['success' => true, 'data' => ['totalOrders' => (int) ($orderStats['total'] ?? 0), 'completedOrders' => (int) ($orderStats['completed'] ?? 0), 'unreadMessages' => (int) $messages->fetchColumn(), 'reviewsGiven' => (int) $reviews->fetchColumn()]]);
} catch (PDOException $exception) { http_response_code(500); echo json_encode(['error' => 'Impossible de charger les statistiques.']); }
