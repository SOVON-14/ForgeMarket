<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$adminId = (int) ($_SESSION['user_id'] ?? 0);
if ($adminId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }
$check = $pdo->prepare("SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1");
$check->execute(['id' => $adminId]);
if ($check->fetchColumn() !== 'admin') { http_response_code(403); echo json_encode(['error' => 'Accès réservé aux administrateurs.']); exit; }

$statement = $pdo->query("SELECT o.id, o.title, o.amount, o.status, o.payment_status, o.created_at, CONCAT(c.first_name, ' ', c.last_name) AS client, CONCAT(a.first_name, ' ', a.last_name) AS artisan FROM orders o INNER JOIN users c ON c.id = o.client_id INNER JOIN artisan_profiles ap ON ap.id = o.artisan_id INNER JOIN users a ON a.id = ap.user_id ORDER BY o.created_at DESC");
echo json_encode(['success' => true, 'data' => $statement->fetchAll()]);
