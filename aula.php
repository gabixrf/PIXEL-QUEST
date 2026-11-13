
<?php

session_start();

require_once "conexao.php";

// Verifica se o jogador está logado
if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

// Recebe o ID da aula pela URL
$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);

// Verifica se o ID é válido
if (!$id) {
    header("Location: regioes.php");
    exit;
}

// Busca a aula e sua região no banco de dados
$sql = "SELECT aulas.*, regioes.nome AS nome_regiao
        FROM aulas
        INNER JOIN regioes ON aulas.regiao_id = regioes.id
        WHERE aulas.id = ? AND aulas.publicada = 1";

$stmt = $conexao->prepare($sql);
$stmt->execute([$id]);

$aula = $stmt->fetch(PDO::FETCH_ASSOC);

// Verifica se a aula existe e está publicada
if (!$aula) {
    header("Location: regioes.php");
    exit;
}

?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>PIXEL QUEST | <?= htmlspecialchars($aula["titulo"]); ?></title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body class="pagina-dashboard">

<header class="cabecalho-dashboard">

    <h2>PIXEL QUEST</h2>

    <nav>
        <a href="dashboard.php">Início</a>
        <a href="regioes.php">Regiões</a>
        <a href="logout.php">Sair</a>
    </nav>

</header>


<main class="tela-exercicio">

    <!-- LADO ESQUERDO: CONTEÚDO DA AULA -->

    <section class="conteudo-exercicio">

        <p class="subtitulo">
            <?= htmlspecialchars($aula["nome_regiao"]); ?>
        </p>

        <h1>
            <?= htmlspecialchars($aula["titulo"]); ?>
        </h1>

        <p>
            <?= htmlspecialchars($aula["resumo"] ?? "Prepare-se para aprender um novo conceito!"); ?>
        </p>

        <h2>CONTEÚDO DA AULA</h2>

        <div class="conteudo-aula">
            <?= nl2br(htmlspecialchars($aula["conteudo"] ?? "")); ?>
        </div>

        <a href="aulas.php?id=<?= (int) $aula["regiao_id"]; ?>" class="botao-regiao">
            VOLTAR PARA AS AULAS
        </a>

    </section>


    <!-- LADO DIREITO: EDITOR MONACO -->

    <section class="area-editor">

        <h2>EDITOR DE CÓDIGO</h2>

        <p>Escreva seu código Python abaixo:</p>

        <div id="editor"></div>

        <button
            class="botao-executar"
            id="botaoExecutar"
            onclick="executarCodigo()">

            EXECUTAR E CORRIGIR

        </button>

        <pre id="resultado">O resultado aparecerá aqui.</pre>

    </section>

</main>


<script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js"></script>

<script>
    const baseUrl =
        "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/";

    window.MonacoEnvironment = {
        getWorkerUrl: function () {

            const workerCode = `
                self.MonacoEnvironment = {
                    baseUrl: '${baseUrl}'
                };

                importScripts('${baseUrl}vs/base/worker/workerMain.js');
            `;

            return "data:text/javascript;charset=utf-8," +
                encodeURIComponent(workerCode);
        }
    };

    require.config({
        paths: {
            vs: baseUrl + "vs"
        }
    });

    let editor;

    require(["vs/editor/editor.main"], function () {

        editor = monaco.editor.create(
            document.getElementById("editor"),
            {
                value: [
                    'nome = "PIXEL QUEST"',
                    '',
                    'print("Olá, " + nome + "!")'
                ].join("\n"),

                language: "python",
                theme: "vs-dark",
                automaticLayout: true,
                fontSize: 15,

                minimap: {
                    enabled: false
                },

                scrollBeyondLastLine: false
            }
        );

    });


    async function executarCodigo() {

        if (!editor) {
            alert("O editor ainda está carregando.");
            return;
        }

        const botao = document.getElementById("botaoExecutar");
        const resultado = document.getElementById("resultado");

        botao.disabled = true;
        botao.textContent = "EXECUTANDO...";

        resultado.textContent = "Executando código Python...";

        try {

            const resposta = await fetch("executar.php", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    codigo: editor.getValue()
                })
            });

            const dados = await resposta.json();

            resultado.textContent =
                dados.mensagem || "Sem mensagem.";

            if (dados.saida !== undefined) {
                resultado.textContent +=
                    "\n\nSaída:\n" + dados.saida;
            }

            if (dados.erro) {
                resultado.textContent +=
                    "\n\nDetalhes:\n" + dados.erro;
            }

            resultado.style.color = dados.correto
                ? "#80f0ad"
                : "#ff9ba9";

        } catch (erro) {

            resultado.textContent =
                "Erro ao comunicar com o servidor: " + erro.message;

            resultado.style.color = "#ff9ba9";

        } finally {

            botao.disabled = false;
            botao.textContent = "EXECUTAR E CORRIGIR";

        }
    }
</script>



</body>
</html>
