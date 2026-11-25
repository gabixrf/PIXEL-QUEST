<?php
require_once __DIR__ . "/_base.php";

// Cada região tem no máximo uma missão (índice UNIQUE em regiao_id).
// Por isso tudo aqui é identificado pelo ID da região.

$dados = null;
$editar_regiao = 0;

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    csrf_validar();

    $acao = $_POST["acao"] ?? "";
    $regiao_id = post_int("id");

    try {

        if ($acao === "salvar") {

            $titulo = trim($_POST["titulo"] ?? "");
            $descricao = trim($_POST["descricao"] ?? "");
            $enunciado = trim($_POST["enunciado"] ?? "");
            $codigo_inicial = rtrim($_POST["codigo_inicial"] ?? "");
            $codigo_solucao = rtrim($_POST["codigo_solucao"] ?? "");
            $saida = trim($_POST["saida_esperada"] ?? "");
            $xp = filter_var($_POST["xp"] ?? "", FILTER_VALIDATE_INT, ["options" => ["min_range" => 0, "max_range" => 10000]]);
            $ativa = isset($_POST["ativa"]) ? 1 : 0;

            $st = $conexao->prepare("SELECT id FROM regioes WHERE id = ?");
            $st->execute([$regiao_id]);
            if (!$st->fetch()) {
                throw new InvalidArgumentException("Região inválida.");
            }
            if ($titulo === "" || mb_strlen($titulo) > 150) {
                throw new InvalidArgumentException("Informe um título de até 150 caracteres.");
            }
            if ($descricao === "") {
                throw new InvalidArgumentException("Escreva a descrição da missão.");
            }
            if ($xp === false) {
                throw new InvalidArgumentException("O XP precisa ser um número entre 0 e 10000.");
            }
            if ($ativa && $saida === "") {
                throw new InvalidArgumentException("Uma missão ativa precisa de saída esperada para ser corrigida.");
            }

            // Cria ou atualiza a missão da região
            $conexao->prepare(
                "INSERT INTO missoes (regiao_id, titulo, descricao, enunciado, codigo_inicial, codigo_solucao, saida_esperada, xp, ativa)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), descricao = VALUES(descricao),
                    enunciado = VALUES(enunciado), codigo_inicial = VALUES(codigo_inicial),
                    codigo_solucao = VALUES(codigo_solucao), saida_esperada = VALUES(saida_esperada),
                    xp = VALUES(xp), ativa = VALUES(ativa)"
            )->execute([$regiao_id, $titulo, $descricao, $enunciado, $codigo_inicial, $codigo_solucao, $saida, $xp, $ativa]);

            flash("ok", "Missão salva.");

        } elseif ($acao === "alternar") {

            $conexao->prepare("UPDATE missoes SET ativa = IF(ativa = 1, 0, 1) WHERE regiao_id = ?")->execute([$regiao_id]);
            flash("ok", "Status da missão alterado.");
        }

        redirecionar("missoes.php");

    } catch (PDOException $e) {

        error_log($e->getMessage());
        flash("erro", "Erro ao gravar no banco de dados.");
        if ($acao === "salvar") { $dados = $_POST; $editar_regiao = $regiao_id; }

    } catch (InvalidArgumentException $e) {

        flash("erro", $e->getMessage());
        $dados = $_POST;
        $editar_regiao = $regiao_id;
    }
}

/* ---------- Formulário ---------- */

$modo_form = $dados !== null || isset($_GET["editar"]);
$d = [];
$nome_regiao = "";

if ($modo_form) {

    if ($dados === null) {
        $editar_regiao = (int) $_GET["editar"];
    }

    $st = $conexao->prepare("SELECT nome FROM regioes WHERE id = ?");
    $st->execute([$editar_regiao]);
    $nome_regiao = $st->fetchColumn();

    if ($nome_regiao === false) {
        flash("erro", "Região não encontrada.");
        redirecionar("missoes.php");
    }

    if ($dados !== null) {
        $d = [
            "titulo" => $dados["titulo"] ?? "", "descricao" => $dados["descricao"] ?? "",
            "enunciado" => $dados["enunciado"] ?? "", "codigo_inicial" => $dados["codigo_inicial"] ?? "",
            "codigo_solucao" => $dados["codigo_solucao"] ?? "", "saida_esperada" => $dados["saida_esperada"] ?? "",
            "xp" => $dados["xp"] ?? 50, "ativa" => isset($dados["ativa"]) ? 1 : 0,
        ];
    } else {
        $st = $conexao->prepare("SELECT * FROM missoes WHERE regiao_id = ?");
        $st->execute([$editar_regiao]);
        $d = $st->fetch() ?: [
            "titulo" => "", "descricao" => "", "enunciado" => "", "codigo_inicial" => "",
            "codigo_solucao" => "", "saida_esperada" => "", "xp" => 50, "ativa" => 1,
        ];
    }
}

/* ---------- Lista ---------- */

$lista = $conexao->query(
    "SELECT r.id AS regiao_id, r.nome AS regiao, m.id AS missao_id, m.titulo, m.xp, m.ativa, m.saida_esperada
     FROM regioes r LEFT JOIN missoes m ON m.regiao_id = r.id
     ORDER BY r.ordem"
)->fetchAll();

admin_topo($modo_form ? "Missão: " . $nome_regiao : "Missões", "missoes");

if ($modo_form): ?>

    <form method="post" action="missoes.php" class="form-admin">
        <?= csrf_campo() ?>
        <input type="hidden" name="acao" value="salvar">
        <input type="hidden" name="id" value="<?= $editar_regiao ?>">

        <label>Título
            <input type="text" name="titulo" maxlength="150" value="<?= h($d["titulo"]) ?>" required>
        </label>

        <label>Descrição (resumo da missão)
            <textarea name="descricao" rows="2" required><?= h($d["descricao"]) ?></textarea>
        </label>

        <label>Enunciado completo
            <textarea name="enunciado" rows="6"><?= h($d["enunciado"]) ?></textarea>
        </label>

        <label>Código inicial
            <textarea name="codigo_inicial" rows="6" class="codigo"><?= h($d["codigo_inicial"]) ?></textarea>
        </label>

        <label>Código da solução (só para você consultar)
            <textarea name="codigo_solucao" rows="6" class="codigo"><?= h($d["codigo_solucao"]) ?></textarea>
        </label>

        <label>Saída esperada
            <textarea name="saida_esperada" rows="3" class="codigo"><?= h($d["saida_esperada"]) ?></textarea>
        </label>

        <label>XP da missão
            <input type="number" name="xp" min="0" max="10000" value="<?= h($d["xp"]) ?>" required>
        </label>

        <label class="check">
            <input type="checkbox" name="ativa" <?= $d["ativa"] ? "checked" : "" ?>>
            Missão ativa
        </label>

        <div class="acoes-form">
            <button type="submit" class="btn">Salvar missão</button>
            <a href="missoes.php" class="btn btn-sec">Cancelar</a>
        </div>
    </form>

<?php else: ?>

    <div class="tabela-wrap">
    <table class="tabela">
        <thead><tr><th>Região</th><th>Missão</th><th>XP</th><th>Correção</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody>
        <?php foreach ($lista as $m): ?>
            <tr>
                <td><?= h($m["regiao"]) ?></td>
                <?php if ($m["missao_id"]): ?>
                    <td><?= h($m["titulo"]) ?></td>
                    <td><?= (int) $m["xp"] ?></td>
                    <td>
                        <span class="badge <?= trim((string) $m["saida_esperada"]) !== "" ? "ok" : "alerta" ?>">
                            <?= trim((string) $m["saida_esperada"]) !== "" ? "Configurada" : "Sem saída esperada" ?>
                        </span>
                    </td>
                    <td><span class="badge <?= $m["ativa"] ? "ok" : "off" ?>"><?= $m["ativa"] ? "Ativa" : "Inativa" ?></span></td>
                    <td class="acoes">
                        <a class="btn btn-peq btn-sec" href="?editar=<?= (int) $m["regiao_id"] ?>">Editar</a>
                        <?php botao_post("alternar", (int) $m["regiao_id"], $m["ativa"] ? "Desativar" : "Ativar"); ?>
                    </td>
                <?php else: ?>
                    <td colspan="4" class="vazio-celula">Esta região ainda não tem missão.</td>
                    <td class="acoes"><a class="btn btn-peq" href="?editar=<?= (int) $m["regiao_id"] ?>">Criar missão</a></td>
                <?php endif; ?>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>

<?php endif;

admin_rodape();