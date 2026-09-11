<?php

declare(strict_types=1);
session_start(); header('Content-Type: application/json; charset=utf-8'); require_once __DIR__ . '/../../../config/database.php';
$adminId = (int) ($_SESSION['user_id'] ?? 0); if ($adminId < 1) { http_response_code(401); echo json_encode(['error' => 'Authentification requise.']); exit; } $check = $pdo->prepare("SELECT role FROM users WHERE id = :id AND is_active = 1 LIMIT 1"); $check->execute(['id' => $adminId]); if ($check->fetchColumn() !== 'admin') { http_response_code(403); echo json_encode(['error' => 'Accès réservé aux administrateurs.']); exit; } $statement = $pdo->query("SELECT id, role, first_name, last_name, email, phone, is_active, created_at, last_login_at FROM users ORDER BY created_at DESC"); echo json_encode(['success' => true, 'data' => $statement->fetchAll()]);
