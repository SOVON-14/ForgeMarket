<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare('SELECT id, type, title, message, link_url, read_at, created_at FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 30');
    $statement->execute(['user_id' => $userId]);
    echo json_encode(['success' => true, 'data' => $statement->fetchAll()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); header('Allow: GET, POST'); echo json_encode(['error' => 'Méthode non autorisée.']); exit; }
$input = json_decode(file_get_contents('php://input'), true);
$notificationId = filter_var($input['notificationId'] ?? null, FILTER_VALIDATE_INT);
if (!$notificationId) { http_response_code(422); echo json_encode(['error' => 'Notification invalide.']); exit; }
$statement = $pdo->prepare('UPDATE notifications SET read_at = NOW() WHERE id = :id AND user_id = :user_id');
$statement->execute(['id' => $notificationId, 'user_id' => $userId]);
echo json_encode(['success' => true]);
