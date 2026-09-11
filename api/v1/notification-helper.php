<?php

declare(strict_types=1);

function createNotification(PDO $pdo, int $userId, string $type, string $title, string $message, ?string $linkUrl = null): void
{
    $statement = $pdo->prepare('INSERT INTO notifications (user_id, type, title, message, link_url) VALUES (:user_id, :type, :title, :message, :link_url)');
    $statement->execute(['user_id' => $userId, 'type' => $type, 'title' => $title, 'message' => $message, 'link_url' => $linkUrl]);
}
