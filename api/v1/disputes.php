<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }
$user = $pdo->prepare('SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1');
$user->execute(['id' => $userId]);
$role = $user->fetchColumn();
if (!in_array($role, ['client', 'artisan', 'admin'], true)) { http_response_code(403); echo json_encode(['error' => 'Accès interdit.']); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $condition = $role === 'admin' ? '1 = 1' : '(d.opened_by = :user_id OR o.client_id = :user_id OR ap.user_id = :user_id)';
    $parameters = $role === 'admin' ? [] : ['user_id' => $userId];
    $statement = $pdo->prepare("SELECT d.id, d.order_id, d.reason, d.description, d.status, d.resolution, d.created_at, d.resolved_at, CONCAT(c.first_name, ' ', c.last_name) AS client_name, CONCAT(a.first_name, ' ', a.last_name) AS artisan_name FROM disputes d INNER JOIN orders o ON o.id = d.order_id INNER JOIN users c ON c.id = o.client_id INNER JOIN artisan_profiles ap ON ap.id = o.artisan_id INNER JOIN users a ON a.id = ap.user_id WHERE $condition ORDER BY d.created_at DESC");
    $statement->execute($parameters);
    echo json_encode(['success' => true, 'data' => $statement->fetchAll()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); header('Allow: GET, POST'); echo json_encode(['error' => 'Méthode non autorisée.']); exit; }
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) { http_response_code(400); echo json_encode(['error' => 'Données JSON invalides.']); exit; }
$action = $input['action'] ?? 'open';

if ($action === 'open') {
    if ($role !== 'client') { http_response_code(403); echo json_encode(['error' => 'Seuls les clients peuvent ouvrir un litige.']); exit; }
    $orderId = filter_var($input['orderId'] ?? null, FILTER_VALIDATE_INT);
    $reason = trim((string) ($input['reason'] ?? ''));
    $description = trim((string) ($input['description'] ?? ''));
    if (!$orderId || $reason === '' || mb_strlen($description) < 10) { http_response_code(422); echo json_encode(['error' => 'Motif et description détaillée obligatoires.']); exit; }
    $order = $pdo->prepare("SELECT id FROM orders WHERE id = :order_id AND client_id = :client_id AND status NOT IN ('cancelled', 'completed') LIMIT 1");
    $order->execute(['order_id' => $orderId, 'client_id' => $userId]);
    if (!$order->fetch()) { http_response_code(404); echo json_encode(['error' => 'Commande non éligible au litige.']); exit; }
    $statement = $pdo->prepare("INSERT INTO disputes (order_id, opened_by, reason, description) VALUES (:order_id, :opened_by, :reason, :description)");
    $statement->execute(['order_id' => $orderId, 'opened_by' => $userId, 'reason' => $reason, 'description' => $description]);
    $pdo->prepare("UPDATE orders SET status = 'disputed' WHERE id = :id")->execute(['id' => $orderId]);
    http_response_code(201); echo json_encode(['success' => true, 'message' => 'Litige ouvert.']); exit;
}

if ($role !== 'admin' || !in_array($action, ['resolve', 'reject'], true)) { http_response_code(403); echo json_encode(['error' => 'Action réservée à l’administration.']); exit; }
$disputeId = filter_var($input['disputeId'] ?? null, FILTER_VALIDATE_INT);
$resolution = trim((string) ($input['resolution'] ?? ''));
if (!$disputeId || $resolution === '') { http_response_code(422); echo json_encode(['error' => 'Résolution obligatoire.']); exit; }
$status = $action === 'resolve' ? 'resolved' : 'rejected';
$statement = $pdo->prepare("UPDATE disputes SET status = :status, resolution = :resolution, resolved_by = :admin_id, resolved_at = NOW(), updated_at = NOW() WHERE id = :id AND status IN ('open', 'under_review')");
$statement->execute(['status' => $status, 'resolution' => $resolution, 'admin_id' => $userId, 'id' => $disputeId]);
if ($statement->rowCount() !== 1) { http_response_code(404); echo json_encode(['error' => 'Litige introuvable ou déjà traité.']); exit; }
echo json_encode(['success' => true, 'message' => 'Litige mis à jour.']);
