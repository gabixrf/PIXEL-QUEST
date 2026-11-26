<?php
// Imagem da cena da tela inicial (quadrada, 1:1). Troque aqui se o nome for outro.
$cena = 'imagens/intro-scene.png';
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#03050f">

    <title>PIXEL QUEST</title>

    <link rel="preload" as="image" href="<?= $cena ?>">
    <link rel="stylesheet" href="css/style.css">
    <script src="js/intro.js" defer></script>

    <noscript>
        <style>
            .loader { display: none; }
            body.carregando { overflow: auto; }
            .tela-inicial .simbolo-topo, .tela-inicial .linha-decorativa, .tela-inicial .subtitulo,
            .tela-inicial .pixel, .tela-inicial .quest, .tela-inicial .botao-start,
            .tela-inicial .indicacao, .botao-som { opacity: 1; }
        </style>
    </noscript>
</head>

<body class="pagina-intro carregando">

    <!-- ========== CENA ANIMADA (fundo) ========== -->
    <div class="cena" aria-hidden="true">
        <div class="quadro" id="quadro">
            <img class="cena-img" src="<?= $cena ?>" alt="">
            <div class="aurora"></div>
            <canvas id="estrelas"></canvas>
            <img class="personagem" src="<?= $cena ?>" alt="">
            <div class="nevoa"></div>
            <div class="nevoa n2"></div>
            <div class="brilho"></div>
            <canvas id="ponte"></canvas>
            <span class="pct" id="pct">0%</span>
        </div>
        <div class="vinheta"></div>
    </div>

    <!-- ========== LOADING (só a legenda; a travessia é desenhada sobre a própria cena) ========== -->
    <div class="loader" id="loader" role="status" aria-label="Carregando o reino de Asteria">
        <div class="lc-base">
            <p class="lc-legenda"><span class="lc-etapa">ETAPA <b id="lv">1</b>/6</span> <span id="legenda">Acordando o reino de Asteria</span></p>
            <p class="dica" id="dica"></p>
        </div>
        <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden></div>
    </div>

    <!-- ========== SOM ========== -->
    <button class="botao-som" id="botaoSom" type="button" aria-pressed="true">♪ SOM: LIGADO</button>

    <!-- ========== TELA INICIAL ========== -->
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

            <div class="slot-start" id="slotStart"></div>

            <p class="frase" id="frase">A jornada começa com uma lógica.</p>

            <a href="historia.php" class="botao-start" id="botaoStart">
                [ START ]
            </a>

            <p class="indicacao">
                PREPARE-SE PARA A AVENTURA
            </p>

        </section>

    </main>

</body>
</html>