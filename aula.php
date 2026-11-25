<?php
session_start();
require_once __DIR__ . "/conexao.php";
if (!isset($_SESSION["usuario_id"])) {
    header("Location: login.php");
    exit;
}
$uid = (int)$_SESSION["usuario_id"];
$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
if (!$id) {
    header("Location: regioes.php");
    exit;
}
$st = $conexao->prepare("SELECT a.*,r.nome AS nome_regiao FROM aulas a INNER JOIN regioes r ON r.id=a.regiao_id WHERE a.id=? AND a.publicada=1");
$st->execute([$id]);
$aula = $st->fetch();
if (!$aula) {
    header("Location: regioes.php");
    exit;
}
if (empty($_SESSION["csrf_aluno"])) $_SESSION["csrf_aluno"] = bin2hex(random_bytes(32));
$st = $conexao->prepare("SELECT q.id,q.enunciado,q.alternativa_a,q.alternativa_b,q.alternativa_c,q.alternativa_d,(pq.questao_id IS NOT NULL) AS concluida FROM questoes q LEFT JOIN progresso_questoes pq ON pq.questao_id=q.id AND pq.usuario_id=? WHERE q.aula_id=? AND q.ativa=1 ORDER BY q.ordem");
$st->execute([$uid, $id]);
$questoes = $st->fetchAll();
$st = $conexao->prepare("SELECT e.*,(p.concluido=1) AS concluido FROM exercicios e LEFT JOIN progresso p ON p.exercicio_id=e.id AND p.usuario_id=? WHERE e.aula_id=? AND e.ativo=1 ORDER BY e.ordem");
$st->execute([$uid, $id]);
$exercicios = $st->fetchAll();
$unidades = count($questoes) + count($exercicios);
$feitas = count(array_filter($questoes, fn($q) => (int)$q["concluida"] === 1)) + count(array_filter($exercicios, fn($e) => (int)$e["concluido"] === 1));
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PIXEL QUEST | <?= htmlspecialchars($aula["titulo"], ENT_QUOTES, "UTF-8") ?></title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/aula.css">
</head>

<body class="pagina-dashboard">
    <header class="cabecalho-dashboard">
        <h2>PIXEL QUEST</h2>
        <nav><a href="dashboard.php">Início</a><a href="regioes.php">Regiões</a><a href="logout.php">Sair</a></nav>
    </header>
    <main class="pq-aula">
        <div class="pq-caminho"><a href="aulas.php?id=<?= (int)$aula["regiao_id"] ?>">← <?= htmlspecialchars($aula["nome_regiao"], ENT_QUOTES, "UTF-8") ?></a><span><?= $unidades ? "$feitas de $unidades atividades concluídas" : "Aula em preparação" ?></span></div>
        <header class="pq-aula-cabecalho">
            <p><?= htmlspecialchars($aula["nome_regiao"], ENT_QUOTES, "UTF-8") ?></p>
            <h1><?= htmlspecialchars($aula["titulo"], ENT_QUOTES, "UTF-8") ?></h1><?php if (trim((string)$aula["resumo"]) !== ""): ?><p><?= htmlspecialchars($aula["resumo"], ENT_QUOTES, "UTF-8") ?></p><?php endif; ?>
        </header>
        <?php if (trim((string)$aula["conteudo"]) !== ""): ?><section class="pq-bloco pq-teoria">
                <h2>Conteúdo da aula</h2>
                <div class="pq-conteudo"><?= nl2br(htmlspecialchars($aula["conteudo"], ENT_QUOTES, "UTF-8")) ?></div>
            </section><?php endif; ?>
        <?php if ($questoes): ?><section class="pq-bloco">
                <div class="pq-bloco-titulo">
                    <div>
                        <p class="pq-etiqueta">FIXAÇÃO DO CONTEÚDO</p>
                        <h2>Vamos verificar o que você aprendeu?</h2>
                    </div><span><?= count($questoes) ?> questões</span>
                </div>
                <?php foreach ($questoes as $i => $q): ?><article class="pq-questao <?= $q["concluida"] ? "concluida" : "" ?>" data-question="<?= (int)$q["id"] ?>">
                        <div class="pq-questao-topo"><strong>Questão <?= $i + 1 ?></strong><span class="pq-status"><?= $q["concluida"] ? "Concluída" : "Pendente" ?></span></div>
                        <h3><?= nl2br(htmlspecialchars($q["enunciado"], ENT_QUOTES, "UTF-8")) ?></h3>
                        <form class="form-questao"><input type="hidden" name="questao_id" value="<?= (int)$q["id"] ?>"><?php foreach (["A" => "alternativa_a", "B" => "alternativa_b", "C" => "alternativa_c", "D" => "alternativa_d"] as $letra => $campo): ?><label class="pq-alternativa"><input type="radio" name="alternativa" value="<?= $letra ?>" <?= $q["concluida"] ? "disabled" : "required" ?>><span><b><?= $letra ?>.</b> <?= htmlspecialchars($q[$campo], ENT_QUOTES, "UTF-8") ?></span></label><?php endforeach; ?><button type="submit" <?= $q["concluida"] ? "disabled" : "" ?>>Responder</button></form>
                        <div class="pq-feedback" aria-live="polite"></div>
                    </article><?php endforeach; ?>
            </section><?php endif; ?>
        <?php if ($exercicios): ?><section class="pq-bloco">
                <div class="pq-bloco-titulo">
                    <div>
                        <p class="pq-etiqueta">MÃO NA MASSA</p>
                        <h2>Pratique no editor Python</h2>
                    </div><span><?= count($exercicios) ?> exercícios</span>
                </div>
                <?php foreach ($exercicios as $i => $e): ?><article class="pq-exercicio <?= $e["concluido"] ? "concluido" : "" ?>">
                        <div class="pq-questao-topo"><strong>Desafio <?= $i + 1 ?> · <?= htmlspecialchars($e["titulo"], ENT_QUOTES, "UTF-8") ?></strong><span class="pq-status"><?= $e["concluido"] ? "Concluído" : "Pendente" ?></span></div>
                        <p class="pq-enunciado"><?= nl2br(htmlspecialchars($e["enunciado"], ENT_QUOTES, "UTF-8")) ?></p>
                        <div class="pq-editor" data-exercise="<?= (int)$e["id"] ?>" data-initial="<?= htmlspecialchars((string)$e["codigo_inicial"], ENT_QUOTES, "UTF-8") ?>"></div><button class="pq-executar" type="button" data-run="<?= (int)$e["id"] ?>">Executar e corrigir</button>
                        <pre class="pq-resultado" data-result="<?= (int)$e["id"] ?>">O resultado aparecerá aqui.</pre>
                    </article><?php endforeach; ?>
            </section><?php endif; ?>
        <?php if (!$questoes && !$exercicios): ?><section class="pq-bloco pq-vazio">
                <h2>Atividades em preparação</h2>
                <p>O conteúdo desta aula está sendo organizado. Volte em breve!</p>
            </section><?php endif; ?>
        <a class="pq-voltar" href="aulas.php?id=<?= (int)$aula["regiao_id"] ?>">Voltar para as aulas</a>
    </main>
    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js"></script>
    <script>
        const CSRF_ALUNO = <?= json_encode($_SESSION["csrf_aluno"]) ?>;
        document.querySelectorAll('.form-questao').forEach(form => form.addEventListener('submit', async ev => {
            ev.preventDefault();
            const card = form.closest('.pq-questao'),
                feedback = card.querySelector('.pq-feedback'),
                btn = form.querySelector('button'),
                choice = form.querySelector('input[name="alternativa"]:checked');
            if (!choice) {
                feedback.textContent = 'Escolha uma alternativa.';
                return;
            }
            btn.disabled = true;
            feedback.textContent = 'Corrigindo...';
            try {
                const r = await fetch('responder_questao.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        csrf: CSRF_ALUNO,
                        questao_id: form.questao_id.value,
                        alternativa: choice.value
                    })
                });
                const d = await r.json();
                feedback.className = 'pq-feedback ' + (d.correto ? 'certo' : 'errado');
                feedback.textContent = d.mensagem + (d.correto ? ' ' : ' Resposta correta: ' + d.gabarito + '. ') + (d.explicacao || '') + (d.xp_ganho ? ' (+' + d.xp_ganho + ' XP)' : '');
                if (d.correto) {
                    card.classList.add('concluida');
                    card.querySelector('.pq-status').textContent = 'Concluída';
                    form.querySelectorAll('input').forEach(x => x.disabled = true);
                    btn.textContent = 'Concluída';
                } else {
                    btn.disabled = false;
                }
            } catch (e) {
                feedback.textContent = 'Não foi possível enviar sua resposta. Tente novamente.';
                btn.disabled = false;
            }
        }));
        const editors = new Map();
        const baseUrl = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/';
        window.MonacoEnvironment = {
            getWorkerUrl: () => {
                const code = `self.MonacoEnvironment={baseUrl:'${baseUrl}'};importScripts('${baseUrl}vs/base/worker/workerMain.js');`;
                return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(code);
            }
        };
        require.config({
            paths: {
                vs: baseUrl + 'vs'
            }
        });
        require(['vs/editor/editor.main'], () => {
            document.querySelectorAll('.pq-editor').forEach(el => {
                const ed = monaco.editor.create(el, {
                    value: el.dataset.initial || '',
                    language: 'python',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontSize: 14,
                    minimap: {
                        enabled: false
                    },
                    scrollBeyondLastLine: false
                });
                editors.set(el.dataset.exercise, ed);
            });
        });
        document.querySelectorAll('[data-run]').forEach(btn => btn.addEventListener('click', async () => {
            const id = btn.dataset.run,
                ed = editors.get(id),
                out = document.querySelector('[data-result="' + id + '"]');
            if (!ed) {
                out.textContent = 'O editor ainda está carregando.';
                return;
            }
            btn.disabled = true;
            btn.textContent = 'EXECUTANDO...';
            out.textContent = 'Executando código Python...';
            try {
                const r = await fetch('monaco/executar.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        codigo: ed.getValue(),
                        exercicio_id: Number(id),
                        csrf: CSRF_ALUNO
                    })
                });
                const d = await r.json();
                out.textContent = (d.mensagem || '') + (d.saida !== undefined ? '\n\nSaída:\n' + d.saida : '') + (d.erro ? '\n\nDetalhes:\n' + d.erro : '');
                out.className = 'pq-resultado ' + (d.correto ? 'certo' : 'errado');
                if (d.correto) {
                    btn.textContent = 'Concluído';
                    const card = btn.closest('.pq-exercicio');
                    card.classList.add('concluido');
                    card.querySelector('.pq-status').textContent = 'Concluído';
                } else {
                    btn.textContent = 'Executar e corrigir';
                }
            } catch (e) {
                out.textContent = 'Erro ao comunicar com o servidor: ' + e.message;
                btn.textContent = 'Executar e corrigir';
            } finally {
                btn.disabled = false;
            }
        }));
    </script>
</body>

</html>