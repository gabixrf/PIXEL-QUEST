
<?php

session_start();

require_once "conexao.php";

// Verifica se o formulário foi enviado pelo método POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: cadastro_usuario.php");
    exit;
}

// Recebe os dados do formulário
$nome = trim($_POST["nome"] ?? "");
$usuario = trim($_POST["usuario"] ?? "");
$email = trim($_POST["email"] ?? "");
$senha = $_POST["senha"] ?? "";
$confirmar_senha = $_POST["confirmar_senha"] ?? "";

// Verifica se todos os campos foram preenchidos
if (
    empty($nome) ||
    empty($usuario) ||
    empty($email) ||
    empty($senha) ||
    empty($confirmar_senha)
) {
    die("Preencha todos os campos.");
}

// Verifica se o e-mail é válido
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Digite um e-mail válido.");
}

// Verifica o tamanho da senha
if (strlen($senha) < 6) {
    die("A senha precisa ter pelo menos 6 caracteres.");
}

// Confere se as senhas são iguais
if ($senha !== $confirmar_senha) {
    die("As senhas não coincidem.");
}

try {

    // Verifica se o usuário ou e-mail já estão cadastrados
    $sql = "SELECT id FROM usuarios
            WHERE usuario = ? OR email = ?";

    $stmt = $conexao->prepare($sql);
    $stmt->execute([$usuario, $email]);

    if ($stmt->fetch()) {
        die("Esse nome de usuário ou e-mail já está cadastrado.");
    }

    // Protege a senha usando hash
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);

    // Insere o novo usuário no banco
    $sql = "INSERT INTO usuarios (nome, usuario, email, senha)
            VALUES (?, ?, ?, ?)";

    $stmt = $conexao->prepare($sql);
    $stmt->execute([
        $nome,
        $usuario,
        $email,
        $senha_hash
    ]);

    // Guarda os dados do usuário na sessão
    $_SESSION["usuario_id"] = $conexao->lastInsertId();
    $_SESSION["usuario_nome"] = $nome;
    $_SESSION["usuario"] = $usuario;

    // Redireciona para o painel
    header("Location: dashboard.php");
    exit;

} catch (PDOException $erro) {

    die("Erro ao cadastrar usuário: " . $erro->getMessage());

}
