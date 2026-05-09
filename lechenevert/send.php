<?php
header('Content-Type: text/html; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Méthode non autorisée';
    exit;
}

function clean($value) {
    $value = trim((string)($value ?? ''));
    $value = strip_tags($value);
    return str_replace(["\r", "\n"], [' ', ' '], $value);
}

function clean_multiline($value) {
    return trim(strip_tags((string)($value ?? '')));
}

if (clean($_POST['website'] ?? '') !== '') {
    header('Location: merci.html');
    exit;
}

$name = clean($_POST['name'] ?? '');
$email = clean($_POST['email'] ?? '');
$phone = clean($_POST['phone'] ?? '');
$topic = clean($_POST['topic'] ?? 'Contact');
$groupType = clean($_POST['group_type'] ?? '');
$people = clean($_POST['people'] ?? '');
$dates = clean($_POST['dates'] ?? '');
$food = clean($_POST['food'] ?? '');
$message = clean_multiline($_POST['message'] ?? '');

$errors = [];
if ($name === '') $errors[] = 'Nom manquant.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Email invalide.';
if ($message === '') $errors[] = 'Message manquant.';

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/lechenevert_rate_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $ip);
$now = time();
if (file_exists($rateFile) && ($now - (int)file_get_contents($rateFile)) < 60) {
    $errors[] = 'Merci de patienter avant de renvoyer une demande.';
}

if ($errors) {
    http_response_code(400);
    echo '<h1>Formulaire incomplet</h1><ul>';
    foreach ($errors as $error) echo '<li>' . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . '</li>';
    echo '</ul><p><a href="javascript:history.back()">Retour</a></p>';
    exit;
}

@file_put_contents($rateFile, (string)$now, LOCK_EX);

$to = 'contact@hotellechenevert.com';
$from = 'contact@servicecompris.pro';
$subject = 'Demande site Le Chêne Vert - ' . $topic;

$body = "Nouvelle demande depuis la maquette Le Chêne Vert\n\n";
$body .= "Sujet : $topic\n";
$body .= "Nom : $name\n";
$body .= "Email : $email\n";
$body .= "Téléphone : $phone\n";
$body .= "Type de groupe : $groupType\n";
$body .= "Nombre de personnes : $people\n";
$body .= "Dates souhaitées : $dates\n";
$body .= "Restauration : $food\n\n";
$body .= "Message :\n$message\n\n";
$body .= "Date : " . date('Y-m-d H:i:s') . "\n";
$body .= "IP : " . $ip . "\n";

$headers = [];
$headers[] = 'From: Service Compris <' . $from . '>';
$headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

if (mail($to, $subject, $body, implode("\r\n", $headers), '-f' . $from)) {
    header('Location: merci.html');
    exit;
}

http_response_code(500);
echo '<h1>Erreur d’envoi</h1><p>Le message n’a pas pu être envoyé. Merci de réessayer plus tard.</p><p><a href="javascript:history.back()">Retour</a></p>';
?>
