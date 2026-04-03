<?php
/**
 * Service Compris — Réception des briefs
 * Placez ce fichier dans le même dossier que index.html
 *
 * CONFIGURATION : changez SC_TOKEN par un mot de passe de votre choix.
 * Mettez la même valeur dans SYNC_CONFIG.token dans index.html et resultats.html.
 */
define('SC_TOKEN', 'CHANGE_ME');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-SC-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); exit; }

// Vérification du token
$token = $_SERVER['HTTP_X_SC_TOKEN'] ?? '';
if (SC_TOKEN !== 'CHANGE_ME' && $token !== SC_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

// Lecture du body JSON
$raw   = file_get_contents('php://input');
$brief = json_decode($raw, true);

if (!$brief || empty($brief['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

// Chargement du fichier existant
$file  = __DIR__ . '/briefs_data.json';
$store = [];
if (file_exists($file)) {
    $store = json_decode(file_get_contents($file), true) ?: [];
}

// Ajout / mise à jour
$brief['syncedAt'] = date('c');
$store[$brief['name']] = $brief;

if (file_put_contents($file, json_encode($store, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible d\'écrire le fichier. Vérifiez les permissions.']);
    exit;
}

echo json_encode(['ok' => true]);
