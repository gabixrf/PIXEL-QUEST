
<?php
session_start();

if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

$nome = $_SESSION["usuario_nome"] ?? "Aventureiro";

// Progresso provisório
$regioes = [
    [
        "id" => 1,
        "nome" => "Floresta da Sequência",
        "imagem" => "imagens/floresta-sequencia.png",
        "status" => "disponivel"
    ],
    [
        "id" => 2,
        "nome" => "Vale das Variáveis",
        "imagem" => "imagens/vale-variaveis.png",
        "status" => "disponivel"
    ],
    [
        "id" => 3,
        "nome" => "Montanhas das Decisões",
        "imagem" => "imagens/montanhas-decisoes.png",
        "status" => "disponivel"
    ],
    [
        "id" => 4,
        "nome" => "Cavernas da Repetição",
        "imagem" => "imagens/cavernas-repeticao.png",
        "status" => "disponivel"
    ]
];
?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>PIXEL QUEST | Regiões</title>

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

        <p class="subtitulo">EXPLORE NOVOS TERRITÓRIOS</p>

        <h1>Suas Regiões</h1>

        <p>
            Olá, <?= htmlspecialchars($nome, ENT_QUOTES, 'UTF-8'); ?>!
            Escolha seu próximo destino e continue sua jornada.
        </p>

    </section>

    <section class="area-regioes">

        <h2>OS QUATRO TERRITÓRIOS</h2>

        <p>
            Complete os desafios para desbloquear novas regiões.
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

                            <a
                                href="regiao.php?id=<?= $regiao['id']; ?>"
                                class="botao-regiao"
                            >
                                EXPLORAR REGIÃO
                            </a>

                        <?php else: ?>

                            <span class="status-regiao bloqueada">
                                CONCLUA A REGIÃO ANTERIOR
                            </span>

                            <button
                                class="botao-regiao botao-bloqueado"
                                disabled
                            >
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
