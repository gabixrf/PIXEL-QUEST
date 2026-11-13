
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

<main class="conteudo-dashboard">

    <section class="boas-vindas">

        <p class="subtitulo">
            <?= htmlspecialchars($aula["nome_regiao"]); ?>
        </p>

        <h1>
            <?= htmlspecialchars($aula["titulo"]); ?>
        </h1>

        <p>
            <?= htmlspecialchars($aula["resumo"] ?? "Prepare-se para aprender um novo conceito!"); ?>
        </p>

    </section>

    <section class="area-regioes">

        <h2>CONTEÚDO DA AULA</h2>

        <div class="conteudo-aula">
            <?= nl2br(htmlspecialchars($aula["conteudo"] ?? "")); ?>
        </div>

    </section>

    <a href="aulas.php?id=<?= (int) $aula["regiao_id"]; ?>" class="botao-regiao">
        VOLTAR PARA AS AULAS
    </a>

</main>

</body>
</html>
