<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$clientId = (int) ($_SESSION['user_id'] ?? 0);
if ($clientId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }

$user = $pdo->prepare("SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1");
$user->execute(['id' => $clientId]);
if (($user->fetchColumn() ?: '') !== 'client') { http_response_code(403); echo json_encode(['error' => 'Seuls les clients peuvent demander un devis.']); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare('SELECT id, quote_type, artisan_id, category, city, title, description, estimated_budget, deadline, project_address, status, created_at FROM quotes WHERE client_id = :client_id ORDER BY created_at DESC');
    $statement->execute(['client_id' => $clientId]);
    echo json_encode(['success' => true, 'data' => $statement->fetchAll()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); header('Allow: GET, POST'); echo json_encode(['error' => 'Méthode non autorisée.']); exit; }

$completedOrders = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE client_id = :client_id AND status = 'completed'");
$completedOrders->execute(['client_id' => $clientId]);
if ((int) $completedOrders->fetchColumn() < 5) {
    http_response_code(403);
    echo json_encode(['error' => 'Vous devez avoir 5 commandes finalisées avant de demander un devis.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) { http_response_code(400); echo json_encode(['error' => 'Données JSON invalides.']); exit; }

$type = $input['type'] ?? 'direct';
$artisanId = filter_var($input['artisanId'] ?? null, FILTER_VALIDATE_INT);
$category = $input['category'] ?? null;
$city = $input['location'] ?? null;
$title = trim((string) ($input['title'] ?? ''));
$description = trim((string) ($input['description'] ?? ''));
$deadline = $input['deadline'] ?: null;
$address = trim((string) ($input['address'] ?? ''));
$budget = ($input['budget'] ?? '') !== '' ? filter_var($input['budget'], FILTER_VALIDATE_FLOAT) : null;
$errors = [];

if (!in_array($type, ['direct', 'tender'], true)) $errors['type'] = 'Type de demande invalide.';
if ($type === 'direct' && (!$artisanId || !artisanIsVerified($pdo, $artisanId))) $errors['artisanId'] = 'Artisan vérifié invalide.';
if ($type === 'tender' && !in_array($category, ['ferronnerie', 'soudure', 'construction_metallique', 'menuiserie_metal'], true)) $errors['category'] = 'Catégorie obligatoire.';
if ($type === 'tender' && !in_array($city, ['lome', 'sokode', 'kara', 'atsapie', 'tsevie'], true)) $errors['location'] = 'Ville obligatoire.';
if ($title === '' || mb_strlen($title) > 180) $errors['title'] = 'Titre obligatoire.';
if ($description === '') $errors['description'] = 'Description obligatoire.';
if ($address === '' || mb_strlen($address) > 255) $errors['address'] = 'Adresse obligatoire.';
if ($budget !== null && ($budget === false || $budget < 0)) $errors['budget'] = 'Budget invalide.';
if ($deadline !== null && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadline) || $deadline < date('Y-m-d'))) $errors['deadline'] = 'Date limite invalide.';

if ($errors) { http_response_code(422); echo json_encode(['error' => 'Certaines données sont invalides.', 'fields' => $errors]); exit; }

try {
    $statement = $pdo->prepare('INSERT INTO quotes (client_id, artisan_id, quote_type, category, city, title, description, estimated_budget, deadline, project_address) VALUES (:client_id, :artisan_id, :quote_type, :category, :city, :title, :description, :budget, :deadline, :address)');
    $statement->execute(['client_id' => $clientId, 'artisan_id' => $type === 'direct' ? $artisanId : null, 'quote_type' => $type, 'category' => $category, 'city' => $city, 'title' => $title, 'description' => $description, 'budget' => $budget, 'deadline' => $deadline, 'address' => $address]);
    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Demande de devis enregistrée.', 'id' => (int) $pdo->lastInsertId()]);
} catch (PDOException $exception) { http_response_code(500); echo json_encode(['error' => 'Impossible d’enregistrer la demande.']); }

function artisanIsVerified(PDO $pdo, int $artisanId): bool {
    $statement = $pdo->prepare("SELECT COUNT(*) FROM artisan_profiles WHERE id = :id AND verification_status = 'verified'");
    $statement->execute(['id' => $artisanId]);
    return (int) $statement->fetchColumn() === 1;
}
