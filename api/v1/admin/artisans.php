<?php

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';
$adminId = (int) ($_SESSION['user_id'] ?? 0);
if ($adminId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; }
$adminStatement = $pdo->prepare("SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1"); $adminStatement->execute(['id' => $adminId]); $admin = $adminStatement->fetch();
if (!$admin || $admin['role'] !== 'admin') { http_response_code(403); echo json_encode(['error' => 'Accès réservé aux administrateurs.']); exit; }
if ($_SERVER['REQUEST_METHOD'] === 'GET') { $status = $_GET['status'] ?? 'pending'; if (!in_array($status, ['pending', 'verified', 'rejected'], true)) { http_response_code(422); echo json_encode(['error' => 'Statut invalide.']); exit; } $statement = $pdo->prepare('SELECT ap.id, ap.user_id, ap.business_name, ap.bio, ap.category, ap.city, ap.address, ap.years_experience, ap.verification_status, ap.created_at, u.first_name, u.last_name, u.email, u.phone FROM artisan_profiles ap INNER JOIN users u ON u.id = ap.user_id WHERE ap.verification_status = :status ORDER BY ap.created_at ASC'); $statement->execute(['status' => $status]); echo json_encode(['success' => true, 'data' => $statement->fetchAll()]); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); header('Allow: GET, POST'); echo json_encode(['error' => 'Méthode non autorisée.']); exit; }
$input = json_decode(file_get_contents('php://input'), true); $artisanId = filter_var($input['artisanId'] ?? null, FILTER_VALIDATE_INT); $status = $input['status'] ?? '';
if (!$artisanId || !in_array($status, ['verified', 'rejected'], true)) { http_response_code(422); echo json_encode(['error' => 'Artisan ou statut invalide.']); exit; }
try { $statement = $pdo->prepare("UPDATE artisan_profiles SET verification_status = :status, updated_at = NOW() WHERE id = :id AND verification_status = 'pending'"); $statement->execute(['status' => $status, 'id' => $artisanId]); if ($statement->rowCount() !== 1) { http_response_code(404); echo json_encode(['error' => 'Profil en attente introuvable.']); exit; } echo json_encode(['success' => true, 'message' => $status === 'verified' ? 'Artisan validé.' : 'Artisan rejeté.']); } catch (PDOException $exception) { http_response_code(500); echo json_encode(['error' => 'Impossible de mettre à jour le statut.']); }
