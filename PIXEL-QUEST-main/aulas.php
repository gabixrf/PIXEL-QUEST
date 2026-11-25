
<?php

session_start();

require_once "conexao.php";

// Verifica se o jogador está logado
if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

// Recebe o ID da região pela URL
$regiao_id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);

// Verifica se o ID é válido
if (!$regiao_id) {
    header("Location: regioes.php");
    exit;
}

// Busca a região selecionada
$sql_regiao = "SELECT * FROM regioes WHERE id = ? AND ativa = 1";

$stmt_regiao = $conexao->prepare($sql_regiao);
$stmt_regiao->execute([$regiao_id]);

$regiao = $stmt_regiao->fetch(PDO::FETCH_ASSOC);

// Verifica se a região existe
if (!$regiao) {
    header("Location: regioes.php");
    exit;
}

// Busca as aulas publicadas da região
$sql_aulas = "SELECT * FROM aulas
              WHERE regiao_id = ? AND publicada = 1
              ORDER BY ordem ASC";

$stmt_aulas = $conexao->prepare($sql_aulas);
$stmt_aulas->execute([$regiao_id]);

$aulas = $stmt_aulas->fetchAll(PDO::FETCH_ASSOC);

?>

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aulas - PIXEL QUEST</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

   <header class="cabecalho-dashboard">
    <h2>PIXEL QUEST</h2>

    <nav>
        <a href="dashboard.php">Início</a>
        <a href="regioes.php">Regiões</a>
        <a href="logout.php">Sair</a>
    </nav>
</header>

    <main class="pagina-aulas">

        <h2>
            <?php echo htmlspecialchars($regiao["nome"]); ?>
        </h2>

        <p>
            <?php echo htmlspecialchars($regiao["descricao"] ?? ""); ?>
        </p>

        <h3>Jornada de aprendizado</h3>

        <?php if (count($aulas) > 0): ?>

            <div class="lista-aulas">

                <?php foreach ($aulas as $indice => $aula): ?>

                    <div class="card-aula">

                        <div>

                            <h4>
                                <?php echo htmlspecialchars($aula["titulo"]); ?>
                            </h4>

                            <p>
                                <?php echo htmlspecialchars($aula["resumo"] ?? "Prepare-se para aprender um novo conceito!"); ?>
                            </p>

                        </div>

                        <a href="aula.php?id=<?php echo (int) $aula["id"]; ?>">
                            ESTUDAR AULA
                        </a>

                    </div>

                <?php endforeach; ?>

            </div>

        <?php else: ?>

            <p class="sem-aulas">
                Nenhuma aula foi disponibilizada nesta região ainda.
                Volte em breve para continuar sua jornada!
            </p>

        <?php endif; ?>

        <a href="regioes.php">← VOLTAR PARA AS REGIÕES</a>

    </main>

</body>

</html>
