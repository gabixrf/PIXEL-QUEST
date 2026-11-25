<?php

$host = "localhost";
$banco = "pixel-quest";
$usuario = "root";
$senha = "";

try {

    $conexao = new PDO(
        "mysql:host=$host;dbname=$banco;charset=utf8mb4",
        $usuario,
        $senha
    );

    $conexao->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    $conexao->setAttribute(
        PDO::ATTR_DEFAULT_FETCH_MODE,
        PDO::FETCH_ASSOC
    );

} catch (PDOException $erro) {

    die("Erro ao conectar ao banco de dados: " . $erro->getMessage());

}

?>
