<?php
/**
 * Service Compris — Lecture des briefs depuis le serveur
 * Utilisé par resultats.html pour charger les données de n'importe quel appareil.
 */
define('SC_TOKEN', 'CHANGE_ME'); // Même valeur que dans save_brief.php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-SC-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET')     { http_response_code(405); exit; }

$token = $_SERVER['HTTP_X_SC_TOKEN'] ?? '';
if (SC_TOKEN !== 'CHANGE_ME' && $token !== SC_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

$file = __DIR__ . '/briefs_data.json';

if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}

echo file_get_contents($file);
