
<?php

header("Content-Type: application/json; charset=utf-8");

// Função para retornar respostas em JSON
function responder($dados, $status = 200) {
    http_response_code($status);

    echo json_encode(
        $dados,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// Recebe os dados enviados pelo Monaco Editor
$dados = json_decode(file_get_contents("php://input"), true);

$codigo = $dados["codigo"] ?? "";

// Verifica se existe código
if (!is_string($codigo) || trim($codigo) === "") {
    responder([
        "mensagem" => "Digite um código Python."
    ], 400);
}

// Limita o tamanho do código
if (strlen($codigo) > 10000) {
    responder([
        "mensagem" => "Código muito grande."
    ], 400);
}

// Resposta esperada do exercício
$respostaEsperada = "Olá, PIXEL QUEST!";

// Endereço da API Judge0
$api = "https://ce.judge0.com";

// Função responsável pelas requisições
function requisicao($url, $metodo = "GET", $corpo = null) {

    $curl = curl_init($url);

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $metodo,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json"
        ],
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10
    ]);

    if ($corpo !== null) {
        curl_setopt(
            $curl,
            CURLOPT_POSTFIELDS,
            json_encode($corpo, JSON_UNESCAPED_UNICODE)
        );
    }

    $resposta = curl_exec($curl);
    $erro = curl_error($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if ($resposta === false) {
        throw new Exception(
            "Falha de conexão: " . $erro
        );
    }

    $resultado = json_decode($resposta, true);

    if ($status < 200 || $status >= 300) {

        $detalhe = $resultado["error"]
            ?? $resultado["message"]
            ?? $resposta;

        throw new Exception(
            "Judge0 HTTP " . $status . ": " . $detalhe
        );
    }

    if (!is_array($resultado)) {
        throw new Exception("Resposta inválida do Judge0.");
    }

    return $resultado;
}

try {

    // 1. Envia o código Python codificado em Base64
    $envio = requisicao(
        $api . "/submissions?base64_encoded=true&wait=false",
        "POST",
        [
            "source_code" => base64_encode($codigo),
            "language_id" => 71,
            "cpu_time_limit" => 2,
            "wall_time_limit" => 5,
            "memory_limit" => 128000
        ]
    );

    // Verifica se o Judge0 retornou um identificador
    if (empty($envio["token"])) {
        throw new Exception(
            "O Judge0 não retornou o identificador da execução."
        );
    }

    $token = $envio["token"];
    $resultado = null;

    // 2. Consulta o resultado da execução
    for ($i = 0; $i < 20; $i++) {

        usleep(500000);

        $resultado = requisicao(
            $api . "/submissions/" . rawurlencode($token) .
            "?base64_encoded=true&fields=stdout,stderr,compile_output,message,status"
        );

        $statusId = $resultado["status"]["id"] ?? 0;

        // 1 = na fila; 2 = executando
        if ($statusId > 2) {
            break;
        }
    }

    // Verifica se a execução demorou demais
    if (!$resultado || ($resultado["status"]["id"] ?? 0) <= 2) {

        responder([
            "mensagem" => "A execução demorou demais. Tente novamente."
        ], 504);
    }

    // 3. Verifica se o código foi executado corretamente
    if (($resultado["status"]["id"] ?? 0) !== 3) {

        responder([
            "correto" => false,

            "mensagem" => $resultado["status"]["description"]
                ?? "Erro na execução.",

            "erro" => $resultado["stderr"]
                ?? $resultado["compile_output"]
                ?? $resultado["message"]
                ?? ""
        ]);
    }

    // 4. Obtém a saída produzida pelo Python
    $saida = trim(
    base64_decode($resultado["stdout"] ?? "", true) ?: ""
);

    // 5. Compara com a resposta esperada
    $correto = ($saida === $respostaEsperada);

    responder([
        "correto" => $correto,
        "saida" => $saida,

        "mensagem" => $correto
            ? "Parabéns! Você acertou!"
            : "Resposta incorreta. Tente novamente."
    ]);

} catch (Throwable $erro) {

    responder([
        "mensagem" => $erro->getMessage()
    ], 502);

}

