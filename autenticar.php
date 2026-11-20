<?php

session_start();

require_once "conexao.php";

// Volta para a tela de login mostrando a mensagem no cartão
function voltar_com_erro(string $mensagem): void
{
    $_SESSION["auth_erro"] = $mensagem;
    $_SESSION["auth_antigos"] = ["usuario" => trim($_POST["usuario"] ?? "")];
    header("Location: login.php");
    exit;
}

// Verifica se o formulário foi enviado pelo método POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: login.php");
    exit;
}

// Recebe os dados do formulário
$usuario = trim($_POST["usuario"] ?? "");
$senha = $_POST["senha"] ?? "";

// Verifica se os campos estão preenchidos
if (empty($usuario) || empty($senha)) {
    voltar_com_erro("Preencha todos os campos.");
}

// Procura o usuário pelo nome de usuário ou e-mail
$sql = "SELECT * FROM usuarios
        WHERE usuario = ? OR email = ?
        LIMIT 1";

$stmt = $conexao->prepare($sql);
$stmt->execute([$usuario, $usuario]);

$dados_usuario = $stmt->fetch(PDO::FETCH_ASSOC);

// Verifica se o usuário existe e se a senha está correta
if ($dados_usuario && password_verify($senha, $dados_usuario["senha"])) {

    // Gera um novo ID de sessão (evita session fixation)
    session_regenerate_id(true);

    // Cria a sessão do usuário
    $_SESSION["usuario_id"] = $dados_usuario["id"];
    $_SESSION["usuario_nome"] = $dados_usuario["nome"];
    $_SESSION["usuario"] = $dados_usuario["usuario"];
    $_SESSION["tipo"] = $dados_usuario["tipo"];

    // Administrador vai para o painel de administração
    if ($dados_usuario["tipo"] === "admin") {
        header("Location: admin/index.php");
    } else {
        header("Location: dashboard.php");
    }
    exit;

} else {
    voltar_com_erro("Usuário ou senha incorretos.");
}

?>