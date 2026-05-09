<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

function clean($value) {
    $value = trim((string)($value ?? ''));
    $value = strip_tags($value);
    return str_replace(["\r", "\n"], [' ', ' '], $value);
}

function clean_multiline($value) {
    return trim(strip_tags((string)($value ?? '')));
}

if (clean($data['website'] ?? '') !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/sc_audit_rate_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $ip);
$now = time();
if (file_exists($rateFile)) {
    $last = (int)file_get_contents($rateFile);
    if ($last > 0 && ($now - $last) < 90) {
        http_response_code(429);
        echo json_encode(['ok' => false, 'error' => 'Trop de demandes rapprochées. Merci de réessayer dans quelques instants.']);
        exit;
    }
}

$businessName = clean($data['business_name'] ?? '');
$businessType = clean($data['business_type'] ?? '');
$contactName = clean($data['contact_name'] ?? '');
$email = clean($data['email'] ?? '');
$phone = clean($data['phone'] ?? '');
$websiteUrl = clean($data['website_url'] ?? '');
$slotLabel = clean($data['slot_label'] ?? '');
$slotKey = clean($data['slot_key'] ?? '');
$calendarUrl = clean($data['calendar_url'] ?? '');
$contactMethod = clean($data['contact_method'] ?? '');
$formStartedAt = (int)clean($data['form_started_at'] ?? '0');
$message = clean_multiline($data['message'] ?? '');
$consent = clean($data['consent'] ?? '');

$errors = [];
$elapsedMs = (int)(microtime(true) * 1000) - $formStartedAt;
if ($formStartedAt <= 0 || $elapsedMs < 3500 || $elapsedMs > 7200000) $errors[] = 'Validation anti-spam invalide.';
if ($businessName === '') $errors[] = 'Nom de l’entreprise manquant.';
if ($contactName === '') $errors[] = 'Nom du contact manquant.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Email invalide.';
if ($slotKey === '' || $slotLabel === '') $errors[] = 'Créneau manquant.';
if (!in_array($contactMethod, ['phone', 'whatsapp', 'meet'], true)) $errors[] = 'Mode de contact invalide.';
if (($contactMethod === 'phone' || $contactMethod === 'whatsapp') && $phone === '') $errors[] = 'Téléphone manquant.';
if ($consent !== 'yes') $errors[] = 'Consentement manquant.';

if ($errors) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => implode(' ', $errors)]);
    exit;
}

$rateWrite = @file_put_contents($rateFile, (string)$now, LOCK_EX);

$to = 'ft@servicecompris.pro, romain@servicecompris.pro, damien@servicecompris.pro';
$from = 'contact@servicecompris.pro';
$subject = 'Nouvelle demande d’audit Service Compris - ' . $businessName;

$body = "Nouvelle demande d'audit Service Compris\n\n";
$body .= "=== ENTREPRISE ===\n";
$body .= "Nom : $businessName\n";
$body .= "Type : $businessType\n";
$body .= "Site / réseau : $websiteUrl\n\n";
$body .= "=== CONTACT ===\n";
$body .= "Nom : $contactName\n";
$body .= "Canal choisi : " . ($contactMethod === 'phone' ? 'Téléphone' : ($contactMethod === 'whatsapp' ? 'WhatsApp' : 'Google Meet')) . "\n";
$body .= "Email : $email\n";
$body .= "Téléphone : $phone\n\n";
$body .= "=== RENDEZ-VOUS ===\n";
$body .= "Créneau : $slotLabel\n";
$body .= "Slot key : $slotKey\n";
$body .= "Google Calendar : $calendarUrl\n\n";
$body .= "=== MESSAGE ===\n";
$body .= ($message !== '' ? $message : 'Aucun message.') . "\n\n";
$body .= "Consentement contact : oui\n";
$body .= "Date : " . date('Y-m-d H:i:s') . "\n";
$body .= "IP : " . ($_SERVER['REMOTE_ADDR'] ?? 'inconnue') . "\n";

$headers = [];
$headers[] = 'From: Service Compris <' . $from . '>';
$headers[] = 'Reply-To: ' . $contactName . ' <' . $email . '>';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$sent = mail($to, $subject, $body, implode("\r\n", $headers), '-f' . $from);
if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Email non envoyé']);
    exit;
}

echo json_encode(['ok' => true]);
?>
