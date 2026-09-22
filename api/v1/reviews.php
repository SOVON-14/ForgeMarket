<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $orderId = filter_input(INPUT_GET, 'order_id', FILTER_VALIDATE_INT);
    if (!$orderId) { http_response_code(422); echo json_encode(['error' => 'Commande invalide.']); exit; }
    $statement = $pdo->prepare("SELECT o.id, o.title, o.amount, o.created_at, o.completed_at, CONCAT(u.first_name, ' ', u.last_name) AS artisan, ap.id AS artisan_id FROM orders o INNER JOIN artisan_profiles ap ON ap.id = o.artisan_id INNER JOIN users u ON u.id = ap.user_id WHERE o.id = :order_id AND o.client_id = :client_id AND o.status = 'completed' LIMIT 1");
    $statement->execute(['order_id' => $orderId, 'client_id' => $userId]);
    $order = $statement->fetch();
    if (!$order) { http_response_code(404); echo json_encode(['error' => 'Commande terminée introuvable.']); exit; }
    echo json_encode(['success' => true, 'data' => ['id' => (int) $order['id'], 'title' => $order['title'], 'price' => (float) $order['amount'], 'createdAt' => $order['created_at'], 'completedAt' => $order['completed_at'], 'artisan' => $order['artisan'], 'artisanId' => (int) $order['artisan_id']]]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); header('Allow: GET, POST'); echo json_encode(['error' => 'Méthode non autorisée.']); exit; }
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) { http_response_code(400); echo json_encode(['error' => 'Données JSON invalides.']); exit; }
$orderId = filter_var($input['orderId'] ?? null, FILTER_VALIDATE_INT);
$overall = filter_var($input['overallRating'] ?? null, FILTER_VALIDATE_INT);
$comment = trim((string) ($input['comment'] ?? ''));
$ratings = ['qualityRating' => 'quality_rating', 'timelinessRating' => 'timeliness_rating', 'communicationRating' => 'communication_rating', 'valueRating' => 'value_rating'];
$values = [];
foreach ($ratings as $inputKey => $column) { $value = filter_var($input[$inputKey] ?? null, FILTER_VALIDATE_INT); $values[$column] = ($value && $value >= 1 && $value <= 5) ? $value : null; }
$errors = [];
if (!$orderId || !$overall || $overall < 1 || $overall > 5) $errors['overallRating'] = 'Note globale invalide.';
if (mb_strlen($comment) < 20) $errors['comment'] = 'Le commentaire doit contenir au moins 20 caractères.';
if ($errors) { http_response_code(422); echo json_encode(['error' => 'Évaluation invalide.', 'fields' => $errors]); exit; }

try {
    $statement = $pdo->prepare("SELECT o.id, o.client_id, o.artisan_id FROM orders o WHERE o.id = :order_id AND o.client_id = :client_id AND o.status = 'completed' LIMIT 1");
    $statement->execute(['order_id' => $orderId, 'client_id' => $userId]);
    $order = $statement->fetch();
    if (!$order) { http_response_code(404); echo json_encode(['error' => 'Commande terminée introuvable.']); exit; }

    $statement = $pdo->prepare('INSERT INTO reviews (order_id, client_id, artisan_id, overall_rating, quality_rating, timeliness_rating, communication_rating, value_rating, comment, pros, cons, recommend) VALUES (:order_id, :client_id, :artisan_id, :overall, :quality, :timeliness, :communication, :value, :comment, :pros, :cons, :recommend)');
    $statement->execute(['order_id' => $orderId, 'client_id' => $userId, 'artisan_id' => $order['artisan_id'], 'overall' => $overall, 'quality' => $values['quality_rating'], 'timeliness' => $values['timeliness_rating'], 'communication' => $values['communication_rating'], 'value' => $values['value_rating'], 'comment' => $comment, 'pros' => trim((string) ($input['pros'] ?? '')) ?: null, 'cons' => trim((string) ($input['cons'] ?? '')) ?: null, 'recommend' => !empty($input['recommend']) ? 1 : 0]);

    $update = $pdo->prepare("UPDATE artisan_profiles SET average_rating = (SELECT AVG(overall_rating) FROM reviews WHERE artisan_id = :artisan_id_avg), total_reviews = (SELECT COUNT(*) FROM reviews WHERE artisan_id = :artisan_id_count) WHERE id = :artisan_id_profile");
    $update->execute(['artisan_id_avg' => $order['artisan_id'], 'artisan_id_count' => $order['artisan_id'], 'artisan_id_profile' => $order['artisan_id']]);
    echo json_encode(['success' => true, 'message' => 'Évaluation publiée.']);
} catch (PDOException $exception) {
    if ((int) $exception->errorInfo[1] === 1062) { http_response_code(409); echo json_encode(['error' => 'Cette commande a déjà été évaluée.']); exit; }
    http_response_code(500); echo json_encode(['error' => 'Impossible de publier l’évaluation.']);
}
