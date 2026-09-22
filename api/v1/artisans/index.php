<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../../../config/database.php';

try {
    $conditions = [
        "u.role = 'artisan'",
        "u.is_active = 1",
        "ap.verification_status = 'verified'",
    ];
    $parameters = [];

    $query = trim((string) (filter_input(INPUT_GET, 'q', FILTER_SANITIZE_STRING) ?? ''));
    if ($query !== '') {
        $conditions[] = '(CONCAT(u.first_name, \' \', u.last_name) LIKE :query OR ap.business_name LIKE :query OR ap.bio LIKE :query)';
        $parameters['query'] = '%' . $query . '%';
    }

    $category = filter_input(INPUT_GET, 'category', FILTER_SANITIZE_STRING);
    if (!empty($category)) {
        $conditions[] = 'ap.category = :category';
        $parameters['category'] = $category;
    }

    $city = filter_input(INPUT_GET, 'city', FILTER_SANITIZE_STRING);
    if (!empty($city)) {
        $conditions[] = 'ap.city = :city';
        $parameters['city'] = $city;
    }

    $minRating = filter_input(INPUT_GET, 'min_rating', FILTER_VALIDATE_FLOAT);
    if ($minRating !== false && $minRating !== null) {
        $conditions[] = 'ap.average_rating >= :min_rating';
        $parameters['min_rating'] = $minRating;
    }

    $available = filter_input(INPUT_GET, 'available', FILTER_SANITIZE_STRING);
    if ($available !== null && $available !== '') {
        $conditions[] = 'ap.is_available = :available';
        $parameters['available'] = $available === '1' ? 1 : 0;
    }

    $sql = "
        SELECT
            ap.id,
            u.id AS user_id,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            COALESCE(ap.business_name, '') AS business_name,
            ap.category AS specialty,
            ap.city AS location,
            ap.bio AS description,
            ap.average_rating AS rating,
            ap.total_reviews AS review_count,
            ap.is_available AS available,
            ap.verification_status = 'verified' AS verified,
            COUNT(DISTINCT o.id) AS orders_count
        FROM artisan_profiles ap
        INNER JOIN users u ON u.id = ap.user_id
        LEFT JOIN orders o ON o.artisan_id = ap.id AND o.status = 'completed'
        WHERE " . implode(' AND ', $conditions) . "
        GROUP BY ap.id, u.id
        ORDER BY ap.average_rating DESC, ap.created_at DESC
    ";

    $statement = $pdo->prepare($sql);
    $statement->execute($parameters);
    $artisans = $statement->fetchAll();

    $artisans = array_map(static function (array $artisan): array {
        return [
            'id' => (int) $artisan['id'],
            'userId' => (int) $artisan['user_id'],
            'name' => $artisan['name'],
            'businessName' => $artisan['business_name'],
            'specialty' => $artisan['specialty'],
            'location' => $artisan['location'],
            'description' => $artisan['description'],
            'rating' => (float) $artisan['rating'],
            'reviewCount' => (int) $artisan['review_count'],
            'ordersCount' => (int) $artisan['orders_count'],
            'available' => (bool) $artisan['available'],
            'verified' => (bool) $artisan['verified'],
            'image' => 'https://via.placeholder.com/300x200/C2652A/FFFFFF?text=Artisan',
        ];
    }, $artisans);

    echo json_encode(['success' => true, 'data' => $artisans]);
} catch (PDOException $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de charger les artisans.']);
}
