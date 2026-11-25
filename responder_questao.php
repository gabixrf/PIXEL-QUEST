<?php
session_start();
require_once __DIR__ . "/conexao.php";
header("Content-Type: application/json; charset=utf-8");
function resposta_json(array $dados, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}
if (!isset($_SESSION["usuario_id"])) resposta_json(["mensagem" => "Faça login novamente."], 401);
$dados = json_decode(file_get_contents("php://input"), true) ?: [];
if (!hash_equals($_SESSION["csrf_aluno"] ?? "", (string)($dados["csrf"] ?? ""))) resposta_json(["mensagem" => "Sessão expirada. Atualize a página."], 403);
$uid = (int)$_SESSION["usuario_id"];
$qid = (int)($dados["questao_id"] ?? 0);
$marcada = strtoupper((string)($dados["alternativa"] ?? ""));
if (!$qid || !in_array($marcada, ["A", "B", "C", "D"], true)) resposta_json(["mensagem" => "Selecione uma alternativa válida."], 400);
$st = $conexao->prepare("SELECT q.*,a.id AS aula_id FROM questoes q INNER JOIN aulas a ON a.id=q.aula_id WHERE q.id=? AND q.ativa=1 AND a.publicada=1");
$st->execute([$qid]);
$q = $st->fetch();
if (!$q) resposta_json(["mensagem" => "Questão não encontrada ou indisponível."], 404);
$correta = $marcada === $q["resposta_correta"];
$conexao->prepare("INSERT INTO tentativas_questoes (usuario_id,questao_id,alternativa_marcada,correta) VALUES (?,?,?,?)")->execute([$uid, $qid, $marcada, $correta ? 1 : 0]);
$xp = 0;
if ($correta) {
    $conexao->beginTransaction();
    try {
        $st = $conexao->prepare("INSERT IGNORE INTO progresso_questoes (usuario_id,questao_id,xp_concedido) VALUES (?,?,5)");
        $st->execute([$uid, $qid]);
        if ($st->rowCount() === 1) {
            $conexao->prepare("UPDATE usuarios SET xp=xp+5 WHERE id=?")->execute([$uid]);
            $xp = 5;
        }
        $conexao->commit();
    } catch (Throwable $e) {
        $conexao->rollBack();
        throw $e;
    }
}
resposta_json(["correto" => $correta, "gabarito" => $q["resposta_correta"], "explicacao" => $q["explicacao"], "mensagem" => $correta ? "Resposta correta!" : "Ainda não. Leia a explicação e tente novamente.", "xp_ganho" => $xp]);
