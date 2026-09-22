<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

if ($argc !== 6) {
    fwrite(STDERR, "Usage: php tools/create_admin.php prenom nom email telephone mot_de_passe\n");
    exit(1);
}

[$script, $firstName, $lastName, $email, $phone, $password] = $argv;
$email = strtolower(trim($email));

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    fwrite(STDERR, "Email invalide ou mot de passe de moins de 8 caracteres.\n");
    exit(1);
}

require_once __DIR__ . '/../config/database.php';

try {
    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute(['email' => $email]);
    if ($check->fetch()) {
        fwrite(STDERR, "Cette adresse email existe deja.\n");
        exit(1);
    }

    $statement = $pdo->prepare(
        "INSERT INTO users (role, first_name, last_name, email, phone, password_hash)
         VALUES ('admin', :first_name, :last_name, :email, :phone, :password_hash)"
    );
    $statement->execute([
        'first_name' => trim($firstName),
        'last_name' => trim($lastName),
        'email' => $email,
        'phone' => trim($phone),
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    fwrite(STDOUT, "Administrateur cree avec succes.\n");
} catch (PDOException $exception) {
    fwrite(STDERR, "Impossible de creer l'administrateur.\n");
    exit(1);
}
