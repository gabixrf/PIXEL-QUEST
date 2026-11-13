
<?php

session_start();

if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

// Recebe o ID da região pela URL
$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);

// Cadastro das regiões
$regioes = [
    1 => [
        "nome" => "Floresta da Sequência",
        "imagem" => "imagens/floresta-sequencia.png",
        "descricao" => "Aprenda a organizar instruções em uma sequência lógica."
    ],

    2 => [
        "nome" => "Vale das Variáveis",
        "imagem" => "imagens/vale-variaveis.png",
        "descricao" => "Descubra como armazenar e utilizar informações."
    ],

    3 => [
        "nome" => "Montanhas das Decisões",
        "imagem" => "imagens/montanhas-decisoes.png",
        "descricao" => "Aprenda a tomar decisões utilizando condições."
    ],

    4 => [
        "nome" => "Cavernas da Repetição",
        "imagem" => "imagens/cavernas-repeticao.png",
        "descricao" => "Conheça as estruturas de repetição e seus funcionamentos."
    ]
];

// Verifica se a região existe
if (!$id || !isset($regioes[$id])) {
    header("Location: regioes.php");
    exit;
}

// Seleciona a região escolhida
$regiao = $regioes[$id];

?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>PIXEL QUEST | <?= htmlspecialchars($regiao["nome"]); ?></title>

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

            <p class="subtitulo">SUA AVENTURA CONTINUA</p>

            <h1>
                <?= htmlspecialchars($regiao["nome"]); ?>
            </h1>

            <p>
                <?= htmlspecialchars($regiao["descricao"]); ?>
            </p>

        </section>

        <section class="area-mapa">

            <img
                src="<?= htmlspecialchars($regiao["imagem"]); ?>"
                alt="<?= htmlspecialchars($regiao["nome"]); ?>"
                class="imagem-detalhe-regiao"
            >

        </section>

        <section class="area-regioes">

            <h2>DESAFIOS DA REGIÃO</h2>

            <p>
                Prepare-se para aprender novos conceitos
                e superar os desafios deste território!
            </p>

            <a href="aulas.php?id=<?= (int) $id; ?>" class="botao-regiao">
                EXPLORAR AULAS
            </a>

        </section>

        <a href="regioes.php" class="botao-voltar-regioes">
            ← VOLTAR PARA AS REGIÕES
        </a>

    </main>

</body>
</html>
