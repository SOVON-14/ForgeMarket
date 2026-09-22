<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Données JSON invalides']);
    exit;
}

$role = $input['role'] ?? '';
$firstName = trim((string) ($input['firstName'] ?? ''));
$lastName = trim((string) ($input['lastName'] ?? ''));
$email = strtolower(trim((string) ($input['email'] ?? '')));
$phone = trim((string) ($input['phone'] ?? ''));
$password = (string) ($input['password'] ?? '');

$errors = [];
if (!in_array($role, ['client', 'artisan'], true)) {
    $errors['role'] = 'Le rôle sélectionné est invalide.';
}
if ($firstName === '' || mb_strlen($firstName) > 100) {
    $errors['firstName'] = 'Le prénom est obligatoire et doit contenir au maximum 100 caractères.';
}
if ($lastName === '' || mb_strlen($lastName) > 100) {
    $errors['lastName'] = 'Le nom est obligatoire et doit contenir au maximum 100 caractères.';
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 191) {
    $errors['email'] = 'Adresse email invalide.';
}
if (!preg_match('/^\\+?[0-9 ()-]{8,30}$/', $phone)) {
    $errors['phone'] = 'Numéro de téléphone invalide.';
}
if (strlen($password) < 8) {
    $errors['password'] = 'Le mot de passe doit contenir au moins 8 caractères.';
}

if ($errors !== []) {
    http_response_code(422);
    echo json_encode(['error' => 'Certaines données sont invalides.', 'fields' => $errors]);
    exit;
}

try {
    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute(['email' => $email]);

    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Cette adresse email est déjà utilisée.']);
        exit;
    }

    $statement = $pdo->prepare(
        'INSERT INTO users (role, first_name, last_name, email, phone, password_hash)
         VALUES (:role, :first_name, :last_name, :email, :phone, :password_hash)'
    );
    $statement->execute([
        'role' => $role,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'phone' => $phone,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Compte créé avec succès.',
        'user' => [
            'id' => (int) $pdo->lastInsertId(),
            'role' => $role,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $email,
        ],
    ]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de créer le compte.']);
}
