<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Uma nova jornada - Pixel Quest</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

    <main class="tela-historia">

        <button class="pular-historia" id="pularHistoria">
            PULAR HISTÓRIA »
        </button>

        <section class="conteudo-historia">

            <p class="identificacao">
                ✦ UMA HISTÓRIA ESTÁ PRESTES A COMEÇAR ✦
            </p>

            <div class="linha-decorativa"></div>

            <h2 class="titulo-historia">
                O REINO DOS PIXELS
            </h2>

            <p class="subtitulo-historia">
                Uma jornada em busca do equilíbrio.
            </p>

            <h1 id="textoHistoria"></h1>

            <div class="indicador" id="indicador">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <a href="cadastro_usuario.php" class="botao-iniciar" id="botaoIniciar">
                INICIAR AVENTURA
            </a>

        </section>

    </main>

    <script>
        const frases = [
            "Em um universo distante, existia um reino formado por pixels.",
            "Era um lugar onde tudo funcionava em perfeita harmonia.",
            "Mas, certo dia, o equilíbrio do Reino dos Pixels foi perdido.",
            "Os caminhos ficaram confusos e os desafios começaram a surgir.",
            "Para restaurar o reino, será necessário aprender a lógica por trás de cada desafio.",
            "Sua jornada começa agora."
        ];

        const textoHistoria = document.getElementById("textoHistoria");
        const indicador = document.getElementById("indicador");
        const botaoIniciar = document.getElementById("botaoIniciar");
        const pularHistoria = document.getElementById("pularHistoria");

        let fraseAtual = 0;
        let caractereAtual = 0;
        let pulando = false;

        function escreverFrase() {

            if (pulando) return;

            const frase = frases[fraseAtual];

            textoHistoria.classList.add("visivel");

            if (caractereAtual < frase.length) {

                textoHistoria.textContent += frase.charAt(caractereAtual);
                caractereAtual++;

                setTimeout(escreverFrase, 55);

            } else {

                setTimeout(apagarFrase, 2200);

            }
        }

        function apagarFrase() {

            textoHistoria.classList.remove("visivel");

            setTimeout(() => {

                fraseAtual++;
                caractereAtual = 0;

                if (fraseAtual < frases.length) {

                    textoHistoria.textContent = "";
                    escreverFrase();

                } else {

                    finalizarHistoria();

                }

            }, 700);
        }

        function finalizarHistoria() {

            indicador.style.display = "none";
            textoHistoria.textContent = "Sua aventura começa aqui.";
            textoHistoria.classList.add("visivel");

            botaoIniciar.classList.add("mostrar");
        }

        pularHistoria.addEventListener("click", () => {
            window.location.href = "cadastro_usuario.php";
        });

        escreverFrase();
    </script>

</body>
</html>