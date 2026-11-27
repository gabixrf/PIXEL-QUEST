<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#000000">
    <title>Uma nova jornada | Pixel Quest</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body class="pagina-historia">

    <!-- Único botão de navegação: pular a animação -->
    <button type="button" class="h-pular" id="pular">PULAR</button>

    <!-- Narrativa contínua: o JS cria as cenas aqui, uma abaixo da outra -->
    <main class="h-historia" id="historia" aria-live="polite"></main>

    <!-- Só aparece quando a história termina (ou após pular) -->
    <div class="h-fim">
        <a href="cadastro_usuario.php" class="h-final" id="final" hidden>COMEÇAR</a>
    </div>

    <noscript>
        <p style="text-align:center;padding:20px">
            <a href="cadastro_usuario.php" style="color:#c4a5ff">Continuar para o cadastro »</a>
        </p>
    </noscript>

    <script src="js/historia.js"></script>
</body>
</html>