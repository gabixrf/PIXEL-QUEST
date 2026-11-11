
<?php
session_start();

// Se já estiver logado, não precisa cadastrar novamente.
if (isset($_SESSION["usuario_id"])) {
    header("Location: dashboard.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Criar conta | PIXEL QUEST</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

    <main class="tela-cadastro">

        <section class="formulario-cadastro">

            <div class="simbolo-topo">✦</div>

            <p class="subtitulo">SUA JORNADA COMEÇA AQUI</p>

            <h1>CRIAR CONTA</h1>

            <p class="descricao">
                Prepare-se para explorar o reino dos pixels!
            </p>

            <form action="salvar_usuario.php" method="POST">

                <div class="campo">
                    <label for="nome">Nome completo</label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        placeholder="Digite seu nome"
                        required
                    >
                </div>

                <div class="campo">
                    <label for="usuario">Nome de usuário</label>
                    <input
                        type="text"
                        id="usuario"
                        name="usuario"
                        placeholder="Escolha um usuário"
                        required
                    >
                </div>

                <div class="campo">
                    <label for="email">E-mail</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Digite seu e-mail"
                        required
                    >
                </div>

                <div class="campo">
                    <label for="senha">Senha</label>
                    <input
                        type="password"
                        id="senha"
                        name="senha"
                        placeholder="Crie uma senha"
                        minlength="6"
                        required
                    >
                </div>

                <div class="campo">
                    <label for="confirmar_senha">Confirmar senha</label>
                    <input
                        type="password"
                        id="confirmar_senha"
                        name="confirmar_senha"
                        placeholder="Digite a senha novamente"
                        minlength="6"
                        required
                    >
                </div>

                <button type="submit" class="botao-cadastro">
                    INICIAR JORNADA
                </button>

            </form>

            <p class="link-login">
                Já possui uma conta?
                <a href="login.php">Entrar</a>
            </p>

            <a href="historia.php" class="voltar">
                Voltar
            </a>

        </section>

    </main>

</body>
</html>
