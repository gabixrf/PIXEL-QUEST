<?php

session_start();

// Se o usuário já estiver logado, vai direto para o painel
if (isset($_SESSION["usuario_id"])) {
    header("Location: dashboard.php");
    exit;
}

$modo = "login";
require __DIR__ . "/includes/auth_tela.php";