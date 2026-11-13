<?php
session_start();

if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

$nome = $_SESSION["usuario_nome"] ?? "Aventureiro";

// Progresso provisório: será substituído pela consulta ao banco.
$regioes = [
    [
        "nome" => "Floresta da Sequência",
        "imagem" => "imagens/floresta-sequencia.png",
        "status" => "disponivel",
        "link" => "regiao.php?id=1"
    ],
    [
        "nome" => "Vale das Variáveis",
        "imagem" => "imagens/vale-variaveis.png",
        "status" => "disponivel",
        "link" => "regiao.php?id=2"
    ],
    [
        "nome" => "Montanhas das Decisões",
        "imagem" => "imagens/montanhas-decisoes.png",
        "status" => "disponivel",
        "link" => "regiao.php?id=3"
    ],
    [
        "nome" => "Cavernas da Repetição",
        "imagem" => "imagens/cavernas-repeticao.png",
        "status" => "disponivel",
        "link" => "regiao.php?id=4"
    ]
];
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>PIXEL QUEST | Minha Jornada</title>

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

        <p class="subtitulo">SUA AVENTURA COMEÇA AQUI</p>

        <h1>
            Olá, <?= htmlspecialchars($nome, ENT_QUOTES, 'UTF-8'); ?>!
        </h1>

        <p>
            Prepare-se para explorar mundos, aprender programação
            e conquistar novos desafios!
        </p>

    </section>

    <section class="area-mapa">

        <h2>MAPA DO MUNDO</h2>

        <p>
            Seu universo de aventuras está esperando por você.
        </p>

        <img
            src="imagens/mapa-mundo.png"
            alt="Mapa completo do PIXEL QUEST"
            class="imagem-mapa"
        >

    </section>

    <section class="area-regioes">

        <h2>SUA JORNADA</h2>

        <p>
            Complete os desafios de cada região para desbloquear
            o próximo território.
        </p>

        <div class="grade-regioes">

            <?php foreach ($regioes as $indice => $regiao): ?>

                <article class="card-regiao <?= $regiao['status']; ?>">

                    <div class="imagem-regiao-container">

                        <img
                            src="<?= htmlspecialchars($regiao['imagem']); ?>"
                            alt="<?= htmlspecialchars($regiao['nome']); ?>"
                            class="imagem-card-regiao"
                        >

                        <?php if ($regiao['status'] === 'bloqueada'): ?>

                            <div class="camada-bloqueio">
                                <span class="icone-cadeado">🔒</span>
                                <span>REGIÃO BLOQUEADA</span>
                            </div>

                        <?php endif; ?>

                    </div>

                    <div class="informacoes-regiao">

                        <h3>
                            <?= ($indice + 1) . ". " .
                            htmlspecialchars($regiao['nome']); ?>
                        </h3>

                        <?php if ($regiao['status'] === 'disponivel'): ?>

                            <span class="status-regiao disponivel">
                                DISPONÍVEL
                            </span>

                            <a href="<?= htmlspecialchars($regiao['link']); ?>"
                               class="botao-regiao">
                                EXPLORAR REGIÃO
                            </a>

                        <?php else: ?>

                            <span class="status-regiao bloqueada">
                                CONCLUA A REGIÃO ANTERIOR
                            </span>

                            <button class="botao-regiao botao-bloqueado"
                                    disabled>
                                BLOQUEADA
                            </button>

                        <?php endif; ?>

                    </div>

                </article>

            <?php endforeach; ?>

        </div>

    </section>

</main>

</body>
</html>