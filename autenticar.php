
<?php

session_start();

require_once "conexao.php";

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
    die("Preencha todos os campos.");
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

    // Cria a sessão do usuário
    $_SESSION["usuario_id"] = $dados_usuario["id"];
    $_SESSION["usuario_nome"] = $dados_usuario["nome"];
    $_SESSION["usuario"] = $dados_usuario["usuario"];

    // Redireciona para o painel
    header("Location: dashboard.php");
    exit;

} else {
    echo "Usuário ou senha incorretos.";
}

?>
