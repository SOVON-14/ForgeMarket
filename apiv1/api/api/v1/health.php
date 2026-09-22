<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/database.php';

try {
    $statement = $pdo->query('SELECT DATABASE() AS database_name');
    $result = $statement->fetch();

    echo json_encode([
        'success' => true,
        'message' => 'Connexion réussie',
        'database' => $result['database_name'],
    ]);
} catch (PDOException $exception) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la vérification de la base',
    ]);
}