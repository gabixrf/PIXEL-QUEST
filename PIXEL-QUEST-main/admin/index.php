<?php
require_once __DIR__ . "/_base.php";

$n = fn(string $sql): int => (int) $conexao->query($sql)->fetchColumn();

$cards = [
    "Alunos"     => $n("SELECT COUNT(*) FROM usuarios WHERE tipo = 'aluno'"),
    "Regiões"    => $n("SELECT COUNT(*) FROM regioes"),
    "Aulas"      => $n("SELECT COUNT(*) FROM aulas"),
    "Exercícios" => $n("SELECT COUNT(*) FROM exercicios"),
    "Questões"   => $n("SELECT COUNT(*) FROM questoes"),
    "Missões"    => $n("SELECT COUNT(*) FROM missoes"),
];

// Pendências que deixam o site "vazio" para o aluno
$avisos = [];

$q = $n("SELECT COUNT(*) FROM aulas WHERE publicada = 1 AND (conteudo IS NULL OR conteudo = '')");
if ($q) $avisos[] = ["$q aula(s) publicada(s) sem conteúdo", "aulas.php"];

$q = $n("SELECT COUNT(*) FROM aulas a WHERE a.publicada=1
         AND NOT EXISTS (SELECT 1 FROM exercicios e WHERE e.aula_id=a.id AND e.ativo=1)
         AND NOT EXISTS (SELECT 1 FROM questoes q WHERE q.aula_id=a.id AND q.ativa=1)");
if ($q) $avisos[] = ["$q aula(s) publicada(s) sem questão ou exercício ativo", "aulas.php"];

$q = $n("SELECT COUNT(*) FROM missoes WHERE ativa = 1
         AND (saida_esperada IS NULL OR saida_esperada = '')");
if ($q) $avisos[] = ["$q missão(ões) ativa(s) sem saída esperada", "missoes.php"];

$q = $n("SELECT COUNT(*) FROM regioes r WHERE NOT EXISTS (SELECT 1 FROM missoes m WHERE m.regiao_id = r.id)");
if ($q) $avisos[] = ["$q região(ões) sem missão", "missoes.php"];

$recentes = $conexao->query(
    "SELECT nome, usuario, xp, criado_em FROM usuarios WHERE tipo = 'aluno' ORDER BY id DESC LIMIT 5"
)->fetchAll();

admin_topo("Painel", "index");
?>

<div class="cards">
    <?php foreach ($cards as $rotulo => $valor): ?>
        <div class="card-num">
            <strong><?= $valor ?></strong>
            <span><?= h($rotulo) ?></span>
        </div>
    <?php endforeach; ?>
</div>

<h2>Pendências</h2>
<?php if ($avisos): ?>
    <ul class="lista-avisos">
        <?php foreach ($avisos as [$texto, $link]): ?>
            <li><a href="<?= $link ?>"><?= h($texto) ?></a></li>
        <?php endforeach; ?>
    </ul>
<?php else: ?>
    <p class="vazio">Tudo certo por aqui. Nenhuma pendência encontrada.</p>
<?php endif; ?>

<h2>Últimos alunos</h2>
<?php if ($recentes): ?>
    <div class="tabela-wrap">
        <table class="tabela">
            <thead><tr><th>Nome</th><th>Usuário</th><th>XP</th><th>Cadastro</th></tr></thead>
            <tbody>
            <?php foreach ($recentes as $u): ?>
                <tr>
                    <td><?= h($u["nome"]) ?></td>
                    <td><?= h($u["usuario"]) ?></td>
                    <td><?= (int) $u["xp"] ?></td>
                    <td><?= h(date("d/m/Y H:i", strtotime($u["criado_em"]))) ?></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php else: ?>
    <p class="vazio">Nenhum aluno cadastrado ainda.</p>
<?php endif; ?>

<?php admin_rodape();