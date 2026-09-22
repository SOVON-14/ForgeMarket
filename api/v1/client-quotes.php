<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

$userId = (int) ($_SESSION['user_id'] ?? 0);
if ($userId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }
$user = $pdo->prepare("SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1");
$user->execute(['id' => $userId]);
if ($user->fetchColumn() !== 'client') { http_response_code(403); echo json_encode(['error' => 'Accès réservé aux clients.']); exit; }

try {
    // Optimized single query with LEFT JOIN to avoid N+1 problem
    $statement = $pdo->prepare("
        SELECT 
            q.id, q.quote_type, q.title, q.description, q.category, q.city, 
            q.estimated_budget, q.deadline, q.project_address, q.status, q.created_at,
            qr.id as response_id, qr.proposed_amount, qr.estimated_days, qr.message, qr.status as response_status,
            CONCAT(u.first_name, ' ', u.last_name) AS artisan_name
        FROM quotes q
        LEFT JOIN quote_responses qr ON qr.quote_id = q.id
        LEFT JOIN artisan_profiles ap ON ap.id = qr.artisan_id
        LEFT JOIN users u ON u.id = ap.user_id
        WHERE q.client_id = :client_id
        ORDER BY q.created_at DESC, qr.proposed_amount ASC
    ");
    $statement->execute(['client_id' => $userId]);
    $results = $statement->fetchAll();
    
    // Group results by quote to reconstruct the structure
    $data = [];
    foreach ($results as $row) {
        $quoteId = (int) $row['id'];
        
        if (!isset($data[$quoteId])) {
            $data[$quoteId] = [
                'id' => $quoteId,
                'quote_type' => $row['quote_type'],
                'title' => $row['title'],
                'description' => $row['description'],
                'category' => $row['category'],
                'city' => $row['city'],
                'estimated_budget' => $row['estimated_budget'] !== null ? (float) $row['estimated_budget'] : null,
                'deadline' => $row['deadline'],
                'project_address' => $row['project_address'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'responses' => []
            ];
        }
        
        // Add response if exists
        if ($row['response_id'] !== null) {
            $data[$quoteId]['responses'][] = [
                'id' => (int) $row['response_id'],
                'amount' => (float) $row['proposed_amount'],
                'days' => (int) $row['estimated_days'],
                'message' => $row['message'],
                'status' => $row['response_status'],
                'artisanName' => $row['artisan_name']
            ];
        }
    }
    
    echo json_encode(['success' => true, 'data' => array_values($data)]);
} catch (PDOException $exception) { http_response_code(500); echo json_encode(['error' => 'Impossible de charger les devis.']); }
