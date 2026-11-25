<?php

session_start();

// Se já estiver logado, não precisa cadastrar novamente.
if (isset($_SESSION["usuario_id"])) {
    header("Location: dashboard.php");
    exit;
}

$modo = "cadastro";
require __DIR__ . "/includes/auth_tela.php";