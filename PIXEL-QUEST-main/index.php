<?php
// index.php - Tela inicial do Pixel Quest
// Usa css/style.css e js/intro.js (independentes do style.css do resto do site)
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>PIXEL QUEST</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Roboto+Mono:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="css/style.css">

    <noscript>
        <style>
            .conteudo-inicial * { opacity: 1 !important; animation: none !important; }
        </style>
    </noscript>
</head>

<body class="pagina-intro entrou">

    <!-- CENA: fundo, estrelas, personagem e brilho do notebook -->
    <div class="cena" aria-hidden="true">
        <div class="quadro" id="quadro">
            <img class="cena-img" src="imagens/intro-scene.png" alt="">
            <canvas id="estrelas"></canvas>
            <img class="personagem" src="imagens/intro-scene.png" alt="">
            <span class="brilho"></span>
            <span class="luz" style="left:68.4%; top:75.7%; --d:0s;  --t:3.1s"></span>
            <span class="luz" style="left:70.8%; top:75%;   --d:.6s; --t:2.7s"></span>
            <span class="luz" style="left:72.5%; top:74%;   --d:1.2s;--t:3.5s"></span>
            <span class="luz" style="left:74.7%; top:73%;   --d:.3s; --t:2.9s"></span>
            <span class="luz" style="left:77.4%; top:72.7%; --d:1.7s;--t:3.3s"></span>
            <span class="luz" style="left:79.9%; top:74.2%; --d:.9s; --t:2.6s"></span>
            <span class="fagulha" style="--dx:-8px;  --d:0s"></span>
            <span class="fagulha" style="--dx:10px;  --d:.7s"></span>
            <span class="fagulha" style="--dx:-14px; --d:1.4s"></span>
            <span class="fagulha" style="--dx:4px;   --d:2.1s"></span>
            <span class="fagulha" style="--dx:16px;  --d:2.7s"></span>
        </div>
        <div class="vinheta"></div>
    </div>

    <button class="botao-som" id="botaoSom" type="button">♪ SOM: LIGADO</button>

    <main class="tela-inicial">

        <section class="conteudo-inicial">

            <div class="simbolo-topo">
                ✦
            </div>

            <div class="linha-decorativa"></div>

            <p class="subtitulo">
                O REINO DOS PIXELS AGUARDA
            </p>

            <h1 class="titulo-principal">
                <span class="pixel">PIXEL</span>
                <span class="quest">QUEST</span>
            </h1>

            <p class="frase" id="frase">A jornada começa com uma lógica.</p>

            <a href="historia.php" class="botao-start">
                [ START ]
            </a>

            <p class="indicacao">
                PREPARE-SE PARA A AVENTURA
            </p>

        </section>

    </main>

    <script src="js/intro.js"></script>
</body>

</html>