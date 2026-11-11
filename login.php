
<?php

session_start();

// Se o usuário já estiver logado, vai direto para o painel
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

    <title>Entrar | PIXEL QUEST</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

    <main class="tela-cadastro">

        <section class="formulario-cadastro">

            <div class="simbolo-topo">✦</div>

            <p class="subtitulo">SUA AVENTURA CONTINUA</p>

            <h1>ENTRAR</h1>

            <p class="descricao">
                Entre na sua conta e continue sua jornada!
            </p>

            <form action="autenticar.php" method="POST">

                <div class="campo">
                    <label for="usuario">Usuário ou e-mail</label>

                    <input
                        type="text"
                        id="usuario"
                        name="usuario"
                        placeholder="Digite seu usuário ou e-mail"
                        required
                    >
                </div>

                <div class="campo">
                    <label for="senha">Senha</label>

                    <input
                        type="password"
                        id="senha"
                        name="senha"
                        placeholder="Digite sua senha"
                        required
                    >
                </div>

                <button type="submit" class="botao-cadastro">
                    ENTRAR NA JORNADA
                </button>

            </form>

            <p class="link-login">
                Ainda não possui uma conta?
                <a href="cadastro_usuario.php">Criar conta</a>
            </p>

            <a href="index.php" class="voltar">Voltar ao início</a>

        </section>

    </main>

</body>

</html>
