<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/database.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id || $id < 1) {
    http_response_code(400);
    echo json_encode(['error' => 'Identifiant artisan invalide.']);
    exit;
}

try {
    $statement = $pdo->prepare("SELECT ap.id, u.id AS user_id, CONCAT(u.first_name, ' ', u.last_name) AS name, COALESCE(ap.business_name, '') AS business_name, ap.category AS specialty, ap.city AS location, ap.bio AS description, ap.years_experience AS experience_years, ap.average_rating AS rating, ap.total_reviews AS review_count, ap.is_available AS available, ap.verification_status AS verification_status, ap.created_at FROM artisan_profiles ap INNER JOIN users u ON u.id = ap.user_id WHERE ap.id = :id AND u.role = 'artisan' AND u.is_active = 1 AND ap.verification_status = 'verified' LIMIT 1");
    $statement->execute(['id' => $id]);
    $artisan = $statement->fetch();
    if (!$artisan) {
        http_response_code(404);
        echo json_encode(['error' => 'Artisan introuvable.']);
        exit;
    }
    echo json_encode(['success' => true, 'data' => ['id' => (int) $artisan['id'], 'userId' => (int) $artisan['user_id'], 'name' => $artisan['name'], 'businessName' => $artisan['business_name'], 'specialty' => $artisan['specialty'], 'location' => $artisan['location'], 'description' => $artisan['description'] ?: 'Aucune description disponible.', 'experienceYears' => (int) ($artisan['experience_years'] ?? 0), 'rating' => (float) $artisan['rating'], 'reviewCount' => (int) $artisan['review_count'], 'ordersCount' => 0, 'responseRate' => 0, 'available' => (bool) $artisan['available'], 'verified' => $artisan['verification_status'] === 'verified', 'image' => 'https://via.placeholder.com/300x300/C2652A/FFFFFF?text=Artisan', 'skills' => [], 'services' => [], 'verificationDate' => null, 'verificationDocuments' => []]]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de charger le profil.']);
}
