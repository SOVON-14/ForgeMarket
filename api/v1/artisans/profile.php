<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/database.php';

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId < 1) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentification requise.']);
    exit;
}

$userStatement = $pdo->prepare("SELECT id, role FROM users WHERE id = :id AND is_active = 1 LIMIT 1");
$userStatement->execute(['id' => $userId]);
$user = $userStatement->fetch();

if (!$user || $user['role'] !== 'artisan') {
    http_response_code(403);
    echo json_encode(['error' => 'Seuls les artisans peuvent gérer ce profil.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare('SELECT id, business_name, bio, category, city, address, years_experience, verification_status, is_available FROM artisan_profiles WHERE user_id = :user_id LIMIT 1');
    $statement->execute(['user_id' => $userId]);
    $profile = $statement->fetch();

    echo json_encode(['success' => true, 'data' => $profile ?: null]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Données JSON invalides.']);
    exit;
}

$businessName = trim((string) ($input['businessName'] ?? ''));
$bio = trim((string) ($input['bio'] ?? ''));
$category = (string) ($input['category'] ?? '');
$city = (string) ($input['city'] ?? '');
$address = trim((string) ($input['address'] ?? ''));
$yearsExperience = filter_var($input['yearsExperience'] ?? null, FILTER_VALIDATE_INT);
$isAvailable = filter_var($input['isAvailable'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

$categories = ['ferronnerie', 'soudure', 'construction_metallique', 'menuiserie_metal'];
$cities = ['lome', 'sokode', 'kara', 'atsapie', 'tsevie'];
$errors = [];

if ($businessName === '' || mb_strlen($businessName) > 150) {
    $errors['businessName'] = 'Le nom professionnel est obligatoire.';
}
if ($bio === '' || mb_strlen($bio) > 5000) {
    $errors['bio'] = 'La description est obligatoire et doit contenir au maximum 5000 caractères.';
}
if (!in_array($category, $categories, true)) {
    $errors['category'] = 'La catégorie est invalide.';
}
if (!in_array($city, $cities, true)) {
    $errors['city'] = 'La ville est invalide.';
}
if ($address === '' || mb_strlen($address) > 255) {
    $errors['address'] = 'L’adresse est obligatoire.';
}
if ($yearsExperience === false || $yearsExperience < 0 || $yearsExperience > 80) {
    $errors['yearsExperience'] = 'Le nombre d’années d’expérience est invalide.';
}
if ($isAvailable === null) {
    $errors['isAvailable'] = 'La disponibilité est invalide.';
}

if ($errors !== []) {
    http_response_code(422);
    echo json_encode(['error' => 'Certaines données sont invalides.', 'fields' => $errors]);
    exit;
}

try {
    $statement = $pdo->prepare(
        'INSERT INTO artisan_profiles (user_id, business_name, bio, category, city, address, years_experience, is_available)
         VALUES (:user_id, :business_name, :bio, :category, :city, :address, :years_experience, :is_available)
         ON DUPLICATE KEY UPDATE
            business_name = VALUES(business_name), bio = VALUES(bio), category = VALUES(category),
            city = VALUES(city), address = VALUES(address), years_experience = VALUES(years_experience),
            is_available = VALUES(is_available), verification_status = IF(verification_status = \'rejected\', \'pending\', verification_status)'
    );
    $statement->execute([
        'user_id' => $userId,
        'business_name' => $businessName,
        'bio' => $bio,
        'category' => $category,
        'city' => $city,
        'address' => $address,
        'years_experience' => $yearsExperience,
        'is_available' => $isAvailable ? 1 : 0,
    ]);

    http_response_code(201);
    echo json_encode(['success' => true, 'message' => 'Profil enregistré. Il sera vérifié par notre équipe.']);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible d’enregistrer le profil.']);
}
