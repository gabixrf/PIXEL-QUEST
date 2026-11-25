<?php
require_once __DIR__ . "/_base.php";

$filtro = filter_input(INPUT_GET, "aula", FILTER_VALIDATE_INT) ?: 0;
$base = "questoes.php" . ($filtro ? "?aula=$filtro" : "");
$dados = null;
$editar_id = 0;

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    csrf_validar();
    $acao = $_POST["acao"] ?? "";
    $id = post_int("id");

    try {
        if ($acao === "salvar") {
            $enunciado = trim($_POST["enunciado"] ?? "");
            $a = trim($_POST["alternativa_a"] ?? "");
            $b = trim($_POST["alternativa_b"] ?? "");
            $c = trim($_POST["alternativa_c"] ?? "");
            $d = trim($_POST["alternativa_d"] ?? "");
            $correta = strtoupper(trim($_POST["resposta_correta"] ?? ""));
            $explicacao = trim($_POST["explicacao"] ?? "");
            $ativa = isset($_POST["ativa"]) ? 1 : 0;

            if ($enunciado === "" || $a === "" || $b === "" || $c === "" || $d === "")
                throw new InvalidArgumentException("Preencha o enunciado e as quatro alternativas.");
            if (!in_array($correta, ["A", "B", "C", "D"], true))
                throw new InvalidArgumentException("Selecione a alternativa correta.");
            if ($explicacao === "")
                throw new InvalidArgumentException("Escreva uma explicação para o aluno receber após responder.");

            if ($id) {
                $st = $conexao->prepare("UPDATE questoes SET enunciado=?, alternativa_a=?, alternativa_b=?, alternativa_c=?, alternativa_d=?, resposta_correta=?, explicacao=?, ativa=? WHERE id=?");
                $st->execute([$enunciado, $a, $b, $c, $d, $correta, $explicacao, $ativa, $id]);
                flash("ok", "Questão atualizada.");
            } else {
                $aula_id = post_int("aula_id");
                $st = $conexao->prepare("SELECT id FROM aulas WHERE id=?");
                $st->execute([$aula_id]);
                if (!$st->fetch()) throw new InvalidArgumentException("Escolha a aula da questão.");
                $st = $conexao->prepare("SELECT COALESCE(MAX(ordem),0)+1 FROM questoes WHERE aula_id=?");
                $st->execute([$aula_id]);
                $ordem = (int)$st->fetchColumn();
                $st = $conexao->prepare("INSERT INTO questoes (aula_id,enunciado,alternativa_a,alternativa_b,alternativa_c,alternativa_d,resposta_correta,explicacao,ordem,ativa) VALUES (?,?,?,?,?,?,?,?,?,?)");
                $st->execute([$aula_id, $enunciado, $a, $b, $c, $d, $correta, $explicacao, $ordem, $ativa]);
                flash("ok", "Questão criada.");
                redirecionar("questoes.php?aula=$aula_id");
            }
        } elseif ($acao === "alternar") {
            $conexao->prepare("UPDATE questoes SET ativa=IF(ativa=1,0,1) WHERE id=?")->execute([$id]);
            flash("ok", "Status da questão alterado.");
        } elseif ($acao === "mover") {
            mover_ordem($conexao, "questoes", "aula_id", $id, ($_POST["dir"] ?? "") === "subir" ? "subir" : "descer");
        } elseif ($acao === "excluir") {
            $conexao->prepare("DELETE FROM questoes WHERE id=?")->execute([$id]);
            flash("ok", "Questão excluída.");
        }
        redirecionar($base);
    } catch (PDOException $e) {
        error_log($e->getMessage());
        flash("erro", "Não foi possível salvar. Verifique se a atualização do banco foi executada.");
        if ($acao === "salvar") {
            $dados = $_POST;
            $editar_id = $id;
        }
    } catch (InvalidArgumentException $e) {
        flash("erro", $e->getMessage());
        $dados = $_POST;
        $editar_id = $id;
    }
}

$d = ["enunciado" => "", "alternativa_a" => "", "alternativa_b" => "", "alternativa_c" => "", "alternativa_d" => "", "resposta_correta" => "", "explicacao" => "", "ativa" => 1, "aula_id" => $filtro];
$modo_form = $dados !== null || isset($_GET["novo"]) || isset($_GET["editar"]);
if ($dados !== null) {
    foreach ($d as $k => $v) $d[$k] = $dados[$k] ?? $v;
    $d["ativa"] = isset($dados["ativa"]) ? 1 : 0;
} elseif (isset($_GET["editar"])) {
    $editar_id = (int)$_GET["editar"];
    $st = $conexao->prepare("SELECT * FROM questoes WHERE id=?");
    $st->execute([$editar_id]);
    $d = $st->fetch();
    if (!$d) {
        flash("erro", "Questão não encontrada.");
        redirecionar($base);
    }
}

$aulas = $conexao->query("SELECT a.id,a.titulo,r.nome AS regiao FROM aulas a INNER JOIN regioes r ON r.id=a.regiao_id ORDER BY r.ordem,a.ordem")->fetchAll();
$sql = "SELECT q.*,a.titulo AS aula,r.nome AS regiao FROM questoes q INNER JOIN aulas a ON a.id=q.aula_id INNER JOIN regioes r ON r.id=a.regiao_id" . ($filtro ? " WHERE q.aula_id=?" : "") . " ORDER BY r.ordem,a.ordem,q.ordem";
$st = $conexao->prepare($sql);
$st->execute($filtro ? [$filtro] : []);
$questoes = $st->fetchAll();
admin_topo($modo_form ? ($editar_id ? "Editar questão" : "Nova questão") : "Questões", "questoes");
if ($modo_form): ?>
    <form method="post" action="<?= h($base) ?>" class="form-admin">
        <?= csrf_campo() ?><input type="hidden" name="acao" value="salvar"><input type="hidden" name="id" value="<?= $editar_id ?>">
        <?php if (!$editar_id): ?><label>Aula<select name="aula_id" required>
                    <option value="">Escolha a aula</option><?php foreach ($aulas as $a): ?><option value="<?= (int)$a["id"] ?>" <?= (int)$d["aula_id"] === (int)$a["id"] ? "selected" : "" ?>><?= h($a["regiao"] . " › " . $a["titulo"]) ?></option><?php endforeach; ?>
                </select></label><?php endif; ?>
        <label>Enunciado<textarea name="enunciado" rows="4" required><?= h($d["enunciado"]) ?></textarea></label>
        <?php foreach (["a" => "A", "b" => "B", "c" => "C", "d" => "D"] as $k => $letra): ?><label>Alternativa <?= $letra ?><textarea name="alternativa_<?= $k ?>" rows="2" required><?= h($d["alternativa_" . $k]) ?></textarea></label><?php endforeach; ?>
        <label>Alternativa correta<select name="resposta_correta" required>
                <option value="">Selecione</option><?php foreach (["A", "B", "C", "D"] as $v): ?><option value="<?= $v ?>" <?= $d["resposta_correta"] === $v ? "selected" : "" ?>><?= $v ?></option><?php endforeach; ?>
            </select></label>
        <label>Explicação da resposta<textarea name="explicacao" rows="4" required><?= h($d["explicacao"]) ?></textarea></label>
        <label class="check"><input type="checkbox" name="ativa" <?= $d["ativa"] ? "checked" : "" ?>> Questão ativa para os alunos</label>
        <div class="acoes-form"><button type="submit" class="btn">Salvar questão</button><a href="<?= h($base) ?>" class="btn btn-sec">Cancelar</a></div>
    </form>
<?php else: ?>
    <div class="barra">
        <form method="get" class="filtros"><label>Aula<select name="aula" onchange="this.form.submit()">
                    <option value="0">Todas</option><?php foreach ($aulas as $a): ?><option value="<?= (int)$a["id"] ?>" <?= $filtro === (int)$a["id"] ? "selected" : "" ?>><?= h($a["regiao"] . " › " . $a["titulo"]) ?></option><?php endforeach; ?>
                </select></label></form><a class="btn" href="<?= h($base . ($filtro ? "&" : "?")) ?>novo=1">Nova questão</a>
    </div>
    <?php if ($questoes): ?><div class="tabela-wrap">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Ordem</th>
                        <th>Enunciado</th>
                        <th>Aula</th>
                        <th>Gabarito</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($questoes as $q): ?><tr>
                            <td class="ordem"><?= (int)$q["ordem"] ?><?php botao_post("mover", (int)$q["id"], "↑", "btn btn-peq btn-sec", ["dir" => "subir"]); ?><?php botao_post("mover", (int)$q["id"], "↓", "btn btn-peq btn-sec", ["dir" => "descer"]); ?></td>
                            <td><?= h(mb_strimwidth($q["enunciado"], 0, 90, "…")) ?></td>
                            <td><?= h($q["regiao"] . " › " . $q["aula"]) ?></td>
                            <td><?= h($q["resposta_correta"]) ?></td>
                            <td><span class="badge <?= $q["ativa"] ? "ok" : "off" ?>"><?= $q["ativa"] ? "Ativa" : "Inativa" ?></span></td>
                            <td class="acoes"><a class="btn btn-peq btn-sec" href="<?= h($base . ($filtro ? "&" : "?")) ?>editar=<?= (int)$q["id"] ?>">Editar</a><?php botao_post("alternar", (int)$q["id"], $q["ativa"] ? "Desativar" : "Ativar"); ?><?php botao_post("excluir", (int)$q["id"], "Excluir", "btn btn-peq btn-perigo", [], "Excluir esta questão e seu histórico de tentativas?"); ?></td>
                        </tr><?php endforeach; ?>
                </tbody>
            </table>
        </div><?php else: ?><p class="vazio">Nenhuma questão cadastrada. Crie a primeira questão para esta aula.</p><?php endif; ?>
<?php endif;
admin_rodape();
