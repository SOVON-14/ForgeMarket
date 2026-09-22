<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    http_response_code(422);
    echo json_encode(['error' => 'Email ou mot de passe invalide.']);
    exit;
}

try {
    $statement = $pdo->prepare(
        'SELECT id, role, first_name, last_name, email, phone, password_hash
         FROM users
         WHERE email = :email AND is_active = 1
         LIMIT 1'
    );
    $statement->execute(['email' => $email]);
    $user = $statement->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Identifiants incorrects.']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['role'] = $user['role'];

    $update = $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = :id');
    $update->execute(['id' => $user['id']]);

    unset($user['password_hash']);
    $user['id'] = (int) $user['id'];
    $user['firstName'] = $user['first_name'];
    $user['lastName'] = $user['last_name'];
    unset($user['first_name'], $user['last_name']);

    echo json_encode([
        'success' => true,
        'message' => 'Connexion réussie.',
        'user' => $user,
    ]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de traiter la connexion.']);
}
