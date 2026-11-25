<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uma nova jornada | Pixel Quest</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body class="pagina-historia">

    <!-- Fundo: a mesma cena da tela inicial (escurecida) -->
    <div class="fundo"></div>

    <!-- Estrelinhas piscando (o JS cria) -->
    <div class="estrelas" id="estrelas"></div>

    <!-- Botão de pular -->
    <a href="cadastro_usuario.php" class="pular">PULAR »</a>

    <!-- NOVO: palco onde aparece o desenho de cada capítulo (o JS desenha aqui) -->
    <section class="cena" id="cena" aria-hidden="true"></section>

    <!-- Caixa de diálogo estilo RPG -->
    <main class="dialogo" id="dialogo">

        <div class="nome">✦ NARRADOR</div>

        <h1 id="titulo"></h1>

        <div class="area-texto">
            <p id="texto"></p>
            <span class="seta" id="seta">▼</span>
        </div>

        <!-- Botões de escolha (só no capítulo da escolha) -->
        <div class="escolhas" id="escolhas"></div>

        <div class="rodape">
            <div class="pontos" id="pontos"></div>

            <div class="botoes">
                <button id="voltar" class="botao-voltar" type="button">« VOLTAR</button>
                <button id="avancar" class="botao-avancar" type="button">CONTINUAR ▶</button>
            </div>
        </div>

    </main>

    <noscript>
        <p style="position:relative;z-index:9;text-align:center;padding:20px">
            <a href="cadastro_usuario.php" style="color:#c4a5ff">Continuar para o cadastro »</a>
        </p>
    </noscript>

    <script src="js/historia.js"></script>
</body>
</html>