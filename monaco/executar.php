<?php
session_start();
require_once __DIR__ . "/../conexao.php";
header("Content-Type: application/json; charset=utf-8");
function responder(array $dados, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}
if (!isset($_SESSION["usuario_id"])) responder(["mensagem" => "Faça login para executar os exercícios."], 401);
$dados = json_decode(file_get_contents("php://input"), true) ?: [];
$codigo = $dados["codigo"] ?? "";
$exercicio_id = (int)($dados["exercicio_id"] ?? 0);
$uid = (int)$_SESSION["usuario_id"];
if (!hash_equals($_SESSION["csrf_aluno"] ?? "", (string)($dados["csrf"] ?? ""))) responder(["mensagem" => "Sessão expirada. Atualize a página."], 403);
if (!is_string($codigo) || trim($codigo) === "") responder(["mensagem" => "Digite um código Python."], 400);
if (strlen($codigo) > 10000) responder(["mensagem" => "Código muito grande."], 400);
if (!$exercicio_id) responder(["mensagem" => "Exercício inválido."], 400);
$st = $conexao->prepare("SELECT e.id,e.saida_esperada,e.xp FROM exercicios e INNER JOIN aulas a ON a.id=e.aula_id WHERE e.id=? AND e.ativo=1 AND a.publicada=1");
$st->execute([$exercicio_id]);
$exercicio = $st->fetch();
if (!$exercicio) responder(["mensagem" => "Este exercício não está disponível."], 404);
$api = "https://ce.judge0.com";
function requisicao_judge(string $url, string $metodo = "GET", ?array $corpo = null): array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_HTTPHEADER => ["Content-Type: application/json"], CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 12]);
    if ($corpo !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($corpo));
    $res = curl_exec($curl);
    $err = curl_error($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if ($res === false) throw new Exception("Falha de conexão com o executor: " . $err);
    $json = json_decode($res, true);
    if ($status < 200 || $status >= 300) throw new Exception("Executor indisponível (HTTP $status).");
    if (!is_array($json)) throw new Exception("Resposta inválida do executor.");
    return $json;
}
try {
    $envio = requisicao_judge($api . "/submissions?base64_encoded=true&wait=false", "POST", ["source_code" => base64_encode($codigo), "language_id" => 71, "cpu_time_limit" => 2, "wall_time_limit" => 5, "memory_limit" => 128000]);
    if (empty($envio["token"])) throw new Exception("O executor não retornou o identificador da execução.");
    $resultado = null;
    for ($i = 0; $i < 20; $i++) {
        usleep(500000);
        $resultado = requisicao_judge($api . "/submissions/" . rawurlencode($envio["token"]) . "?base64_encoded=true&fields=stdout,stderr,compile_output,message,status");
        if (($resultado["status"]["id"] ?? 0) > 2) break;
    }
    if (!$resultado || ($resultado["status"]["id"] ?? 0) <= 2) responder(["mensagem" => "A execução demorou demais. Tente novamente."], 504);
    if (($resultado["status"]["id"] ?? 0) !== 3) responder(["correto" => false, "mensagem" => $resultado["status"]["description"] ?? "Erro na execução.", "erro" => $resultado["stderr"] ?? $resultado["compile_output"] ?? $resultado["message"] ?? ""]);
    $saida = trim(base64_decode($resultado["stdout"] ?? "", true) ?: "");
    $esperada = trim(str_replace(["\r\n", "\r"], "\n", (string)$exercicio["saida_esperada"]));
    $correto = $saida === $esperada;
    $xpGanho = 0;
    if ($correto) {
        $conexao->beginTransaction();
        try {
            $st = $conexao->prepare("SELECT id,concluido FROM progresso WHERE usuario_id=? AND exercicio_id=? FOR UPDATE");
            $st->execute([$uid, $exercicio_id]);
            $p = $st->fetch();
            if (!$p) {
                $conexao->prepare("INSERT INTO progresso (usuario_id,exercicio_id,concluido,tentativas,xp_concedido,concluido_em) VALUES (?,?,1,1,?,NOW())")->execute([$uid, $exercicio_id, (int)$exercicio["xp"]]);
                $xpGanho = (int)$exercicio["xp"];
            } else {
                $conexao->prepare("UPDATE progresso SET concluido=1,tentativas=tentativas+1,concluido_em=COALESCE(concluido_em,NOW()),xp_concedido=IF(xp_concedido=0,?,xp_concedido) WHERE id=?")->execute([(int)$exercicio["xp"], $p["id"]]);
                if (!(int)$p["concluido"]) {
                    $xpGanho = (int)$exercicio["xp"];
                }
            }
            if ($xpGanho > 0) $conexao->prepare("UPDATE usuarios SET xp=xp+? WHERE id=?")->execute([$xpGanho, $uid]);
            $conexao->commit();
        } catch (Throwable $e) {
            $conexao->rollBack();
            throw $e;
        }
    } else {
        $st = $conexao->prepare("INSERT INTO progresso (usuario_id,exercicio_id,concluido,tentativas,xp_concedido) VALUES (?,?,0,1,0) ON DUPLICATE KEY UPDATE tentativas=tentativas+1");
        $st->execute([$uid, $exercicio_id]);
    }
    responder(["correto" => $correto, "saida" => $saida, "mensagem" => $correto ? "Parabéns! Você concluiu o exercício." : "A saída ainda não corresponde ao esperado. Revise seu código e tente novamente.", "xp_ganho" => $xpGanho]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    responder(["mensagem" => "Não foi possível executar o código agora. Tente novamente em instantes."], 502);
}
