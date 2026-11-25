<?php
// Tela única de login e cadastro. Quem inclui define $modo = "login" ou "cadastro".

$cadastro = ($modo ?? "login") === "cadastro";

// Mensagem de erro e valores digitados (vindos de autenticar.php / salvar_usuario.php)
$erro = $_SESSION["auth_erro"] ?? "";
$antigos = $_SESSION["auth_antigos"] ?? [];
unset($_SESSION["auth_erro"], $_SESSION["auth_antigos"]);

$e = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES, "UTF-8");

$svg = fn(string $d) => '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' . $d . '</svg>';
$i_user = $svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>');
$i_mail = $svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>');
$i_lock = $svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>');
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title><?= $cadastro ? "Criar conta" : "Entrar" ?> | PIXEL QUEST</title>

    <link rel="stylesheet" href="css/auth.css">
</head>

<body class="tela-auth">

<main class="auth-caixa <?= $cadastro ? "ativo" : "" ?>" id="authCaixa">

    <!-- FORMULÁRIO: ENTRAR -->
    <section class="form-box login" id="boxLogin" <?= $cadastro ? 'inert aria-hidden="true"' : "" ?>>

        <form action="autenticar.php" method="POST">

            <p class="subtitulo">SUA AVENTURA CONTINUA</p>
            <h1>ENTRAR</h1>

            <?php if ($erro && !$cadastro): ?>
                <p class="auth-erro" role="alert"><?= $e($erro) ?></p>
            <?php endif; ?>

            <div class="campo">
                <label for="login_usuario">Usuário ou e-mail</label>
                <input type="text" id="login_usuario" name="usuario" autocomplete="username"
                       placeholder="Digite seu usuário ou e-mail"
                       value="<?= $e(!$cadastro ? ($antigos["usuario"] ?? "") : "") ?>" required>
                <?= $i_user ?>
            </div>

            <div class="campo">
                <label for="login_senha">Senha</label>
                <input type="password" id="login_senha" name="senha" autocomplete="current-password"
                       placeholder="Digite sua senha" required>
                <?= $i_lock ?>
            </div>

            <button type="submit" class="auth-botao">ENTRAR NA JORNADA</button>

            <a href="index.php" class="voltar">Voltar ao início</a>

        </form>

    </section>

    <!-- FORMULÁRIO: CRIAR CONTA -->
    <section class="form-box cadastro" id="boxCadastro" <?= !$cadastro ? 'inert aria-hidden="true"' : "" ?>>

        <form action="salvar_usuario.php" method="POST">

            <p class="subtitulo">SUA JORNADA COMEÇA AQUI</p>
            <h1>CRIAR CONTA</h1>

            <?php if ($erro && $cadastro): ?>
                <p class="auth-erro" role="alert"><?= $e($erro) ?></p>
            <?php endif; ?>

            <div class="campo">
                <label for="cad_nome">Nome completo</label>
                <input type="text" id="cad_nome" name="nome" autocomplete="name"
                       placeholder="Digite seu nome"
                       value="<?= $e($cadastro ? ($antigos["nome"] ?? "") : "") ?>" required>
                <?= $i_user ?>
            </div>

            <div class="campo">
                <label for="cad_usuario">Nome de usuário</label>
                <input type="text" id="cad_usuario" name="usuario" autocomplete="username"
                       placeholder="Escolha um usuário"
                       value="<?= $e($cadastro ? ($antigos["usuario"] ?? "") : "") ?>" required>
                <?= $i_user ?>
            </div>

            <div class="campo">
                <label for="cad_email">E-mail</label>
                <input type="email" id="cad_email" name="email" autocomplete="email"
                       placeholder="Digite seu e-mail"
                       value="<?= $e($cadastro ? ($antigos["email"] ?? "") : "") ?>" required>
                <?= $i_mail ?>
            </div>

            <div class="campo">
                <label for="cad_senha">Senha</label>
                <input type="password" id="cad_senha" name="senha" autocomplete="new-password"
                       placeholder="Crie uma senha" minlength="6" required>
                <?= $i_lock ?>
            </div>

            <div class="campo">
                <label for="cad_confirmar">Confirmar senha</label>
                <input type="password" id="cad_confirmar" name="confirmar_senha" autocomplete="new-password"
                       placeholder="Digite a senha novamente" minlength="6" required>
                <?= $i_lock ?>
            </div>

            <button type="submit" class="auth-botao">INICIAR JORNADA</button>

            <a href="historia.php" class="voltar">Voltar</a>

        </form>

    </section>

    <!-- PAINEL COLORIDO QUE DESLIZA -->
    <div class="toggle-box">

        <div class="toggle-painel esquerda" id="painelEsquerda" <?= $cadastro ? "inert" : "" ?>>
            <div class="simbolo">✦</div>
            <h2>OLÁ, AVENTUREIRO!</h2>
            <p>Ainda não possui uma conta?</p>
            <a href="cadastro_usuario.php" class="toggle-btn" data-ir="cadastro">CRIAR CONTA</a>
        </div>

        <div class="toggle-painel direita" id="painelDireita" <?= !$cadastro ? "inert" : "" ?>>
            <div class="simbolo">✦</div>
            <h2>BEM-VINDO DE VOLTA!</h2>
            <p>Já possui uma conta?</p>
            <a href="login.php" class="toggle-btn" data-ir="login">ENTRAR</a>
        </div>

    </div>

</main>

<script src="js/auth.js"></script>
</body>
</html>