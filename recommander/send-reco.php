<?php
// Service Compris - Traitement formulaire recommandation
// Aucun stockage. Aucun MySQL. Envoi email uniquement.

$to = "contact@servicecompris.pro";
$subject = "Recommandation Service Compris - Nouveau contact";
$from_email = "contact@servicecompris.pro";

function clean($value) {
    $value = trim($value ?? "");
    $value = strip_tags($value);
    $value = str_replace(["\r", "\n"], [" ", " "], $value);
    return $value;
}

function clean_multiline($value) {
    $value = trim($value ?? "");
    $value = strip_tags($value);
    return $value;
}

// Honeypot anti-bot : si rempli, on fait semblant que c'est OK.
if (!empty($_POST["website"])) {
    header("Location: merci.html");
    exit;
}

$recommender_name = clean($_POST["recommender_name"] ?? "");
$recommender_email = clean($_POST["recommender_email"] ?? "");
$recommender_phone = clean($_POST["recommender_phone"] ?? "");
$business_type = clean($_POST["business_type"] ?? "");
$business_name = clean($_POST["business_name"] ?? "");
$business_city = clean($_POST["business_city"] ?? "");
$contact_name = clean($_POST["contact_name"] ?? "");
$contact_info = clean($_POST["contact_info"] ?? "");
$message_free = clean_multiline($_POST["message"] ?? "");
$consent = clean($_POST["consent"] ?? "");

$errors = [];

if ($recommender_name === "") $errors[] = "Nom du recommandeur manquant.";
if (!filter_var($recommender_email, FILTER_VALIDATE_EMAIL)) $errors[] = "Email recommandeur invalide.";
if ($business_type === "") $errors[] = "Type de contact manquant.";
if ($business_name === "") $errors[] = "Nom du restaurant / commerce manquant.";
if ($business_city === "") $errors[] = "Ville manquante.";
if ($contact_info === "") $errors[] = "Téléphone ou email du contact recommandé manquant.";
if ($consent !== "yes") $errors[] = "Consentement manquant.";

if (!empty($errors)) {
    http_response_code(400);
    echo "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'><title>Erreur</title></head><body style='font-family:Arial;background:#060b18;color:white;padding:40px;'>";
    echo "<h1>Formulaire incomplet</h1><ul>";
    foreach ($errors as $error) {
        echo "<li>" . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . "</li>";
    }
    echo "</ul><p><a href='javascript:history.back()' style='color:#bef264'>Retour au formulaire</a></p></body></html>";
    exit;
}

$body = "Nouvelle recommandation Service Compris\n\n";
$body .= "=== RECOMMANDEUR ===\n";
$body .= "Nom : $recommender_name\n";
$body .= "Email : $recommender_email\n";
$body .= "Téléphone : $recommender_phone\n\n";

$body .= "=== CONTACT RECOMMANDÉ ===\n";
$body .= "Type : $business_type\n";
$body .= "Nom établissement : $business_name\n";
$body .= "Ville : $business_city\n";
$body .= "Nom du contact : $contact_name\n";
$body .= "Téléphone / email : $contact_info\n\n";

$body .= "=== CONTEXTE ===\n";
$body .= "$message_free\n\n";

$body .= "Consentement relation réelle : oui\n";
$body .= "Date : " . date("Y-m-d H:i:s") . "\n";
$body .= "IP : " . ($_SERVER["REMOTE_ADDR"] ?? "inconnue") . "\n";

$headers = [];
$headers[] = "From: Service Compris <" . $from_email . ">";
$headers[] = "Reply-To: " . $recommender_name . " <" . $recommender_email . ">";
$headers[] = "Content-Type: text/plain; charset=UTF-8";

$sent = mail($to, $subject, $body, implode("\r\n", $headers), "-f" . $from_email);

if ($sent) {
    $confirmation_subject = "Service Compris - recommandation bien reçue";
    $confirmation_body = "Bonjour $recommender_name,\n\n";
    $confirmation_body .= "Merci, nous avons bien reçu ta recommandation pour $business_name à $business_city.\n\n";
    $confirmation_body .= "Nous allons regarder le contact et revenir vers toi si besoin.\n\n";
    $confirmation_body .= "Pour rappel, si le contact devient client et que son premier paiement est encaissé, tu pourras recevoir la récompense prévue selon l'offre signée.\n\n";
    $confirmation_body .= "À bientôt,\n";
    $confirmation_body .= "L'équipe Service Compris\n";

    $confirmation_headers = [];
    $confirmation_headers[] = "From: Service Compris <" . $from_email . ">";
    $confirmation_headers[] = "Reply-To: Service Compris <" . $from_email . ">";
    $confirmation_headers[] = "Content-Type: text/plain; charset=UTF-8";

    mail($recommender_email, $confirmation_subject, $confirmation_body, implode("\r\n", $confirmation_headers), "-f" . $from_email);

    header("Location: merci.html");
    exit;
}

http_response_code(500);
echo "<!DOCTYPE html><html lang='fr'><head><meta charset='UTF-8'><title>Erreur</title></head><body style='font-family:Arial;background:#060b18;color:white;padding:40px;'>";
echo "<h1>Erreur d'envoi</h1>";
echo "<p>Le message n'a pas pu être envoyé. Merci de réessayer plus tard.</p>";
echo "<p><a href='javascript:history.back()' style='color:#bef264'>Retour au formulaire</a></p>";
echo "</body></html>";
?>
