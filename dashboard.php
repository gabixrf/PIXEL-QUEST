<?php
session_start();

if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}

$nome = $_SESSION["usuario_nome"] ?? "Aventureiro";

function e($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

/* Regiões na ordem da trilha. x / y = posição do ponto no mapa (em %). */
$regioes = [
    ["nome" => "Floresta da Sequência",  "desc" => "Comandos executados em ordem, um depois do outro.",
     "link" => "regiao.php?id=1", "status" => "disponivel", "cor" => "#4ade80", "x" => 14, "y" => 50],
    ["nome" => "Vale das Variáveis",     "desc" => "Guardar informações e usar quando precisar.",
     "link" => "regiao.php?id=2", "status" => "disponivel", "cor" => "#a3e635", "x" => 39, "y" => 40],
    ["nome" => "Montanhas das Decisões", "desc" => "Fazer o programa escolher um caminho com se e senão.",
     "link" => "regiao.php?id=3", "status" => "disponivel", "cor" => "#c4b5fd", "x" => 80, "y" => 22],
    ["nome" => "Cavernas da Repetição",  "desc" => "Repetir ações sem escrever o mesmo código várias vezes.",
     "link" => "regiao.php?id=4", "status" => "disponivel", "cor" => "#60a5fa", "x" => 65, "y" => 67],
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

<body class="pagina-dashboard pagina-inicio">

<header class="cabecalho-dashboard">

    <h2>PIXEL QUEST</h2>

    <nav>
        <a href="dashboard.php" class="ativo" aria-current="page">Início</a>
        <a href="regioes.php">Regiões</a>
        <a href="logout.php">Sair</a>
    </nav>

</header>

<main class="conteudo-dashboard">

    <div class="topo-inicio">

    <section class="boas-vindas">

        <p class="subtitulo">SUA AVENTURA COMEÇA AQUI</p>

        <h1>Olá, <?= e($nome) ?>!</h1>

        <p>
            Prepare-se para explorar mundos, aprender programação
            e conquistar novos desafios!
        </p>

    </section>

    <section class="area-trilha">

        <h2>Trilha de aprendizado</h2>
        <p>Siga as regiões na ordem para aprender um conceito de cada vez.</p>

        <ol class="trilha">
            <?php foreach ($regioes as $i => $r): $livre = $r["status"] === "disponivel"; ?>
                <li>
                    <a data-regiao="<?= $i ?>"
                       class="<?= $livre ? "" : "bloqueado" ?>"
                       href="<?= $livre ? e($r["link"]) : "#" ?>"
                       style="--cor: <?= e($r["cor"]) ?>">
                        <span class="trilha-no"></span>
                        <strong><?= e($r["nome"]) ?></strong>
                        <span class="trilha-desc"><?= e($r["desc"]) ?></span>
                    </a>
                </li>
            <?php endforeach; ?>
        </ol>

    </section>

    </div>

    <section class="area-mapa">

        <div class="mapa-animado" id="mapa">

            <img
                src="imagens/mapa-mundo.png"
                alt="Mapa completo do PIXEL QUEST"
                class="imagem-mapa"
            >

            <span class="particula particula-1"></span>
            <span class="particula particula-2"></span>
            <span class="particula particula-3"></span>
            <span class="particula particula-4"></span>
            <span class="particula particula-5"></span>
            <span class="particula particula-6"></span>
            <span class="particula particula-7"></span>
            <span class="particula particula-8"></span>

            <?php foreach ($regioes as $i => $r): $livre = $r["status"] === "disponivel"; ?>
                <a class="ponto-mapa<?= $livre ? "" : " bloqueado" ?>"
                   data-regiao="<?= $i ?>"
                   href="<?= $livre ? e($r["link"]) : "#" ?>"
                   style="--x: <?= (int)$r["x"] ?>%; --y: <?= (int)$r["y"] ?>%; --cor: <?= e($r["cor"]) ?>; --i: <?= $i ?>"
                   aria-label="<?= e($r["nome"]) ?>"
                   <?= $livre ? "" : 'aria-disabled="true"' ?>>
                    <span class="ponto-pino"></span>
                    <span class="ponto-nome"><?= e($r["nome"]) ?></span>
                </a>
            <?php endforeach; ?>

        </div>

    </section>

</main>

<script>
(function () {
    // Passar o mouse na trilha destaca o ponto no mapa (e o contrário)
    var itens = document.querySelectorAll('[data-regiao]');
    function marcar(id, ligado) {
        document.querySelectorAll('[data-regiao="' + id + '"]').forEach(function (el) {
            el.classList.toggle('destaque', ligado);
        });
    }
    itens.forEach(function (el) {
        var id = el.getAttribute('data-regiao');
        el.addEventListener('mouseenter', function () { marcar(id, true); });
        el.addEventListener('mouseleave', function () { marcar(id, false); });
        el.addEventListener('focus', function () { marcar(id, true); });
        el.addEventListener('blur', function () { marcar(id, false); });
    });

    // Inclinação suave do mapa (desligada se o usuário prefere menos movimento)
    var mapa = document.getElementById('mapa');
    if (!mapa || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    mapa.addEventListener('mousemove', function (ev) {
        var b = mapa.getBoundingClientRect();
        var x = (ev.clientX - b.left) / b.width - 0.5;
        var y = (ev.clientY - b.top) / b.height - 0.5;
        mapa.style.transform = 'perspective(1100px) rotateY(' + (x * 4) + 'deg) rotateX(' + (-y * 4) + 'deg)';
    });
    mapa.addEventListener('mouseleave', function () { mapa.style.transform = ''; });
})();
</script>

</body>
</html>