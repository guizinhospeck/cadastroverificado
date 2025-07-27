<?php
header('Content-Type: application/json');

if (!isset($_GET['cpf'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parâmetro CPF não informado.']);
    exit;
}

$cpf = preg_replace('/\D/', '', $_GET['cpf']);

if (strlen($cpf) !== 11) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'CPF inválido.']);
    exit;
}

$url = "https://api.cpf-brasil.org/cpf/" . urlencode($cpf);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: 79eb7194aad32c371d3d8609bf47fb8b',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$response) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro ao conectar com a API externa.']);
    exit;
}

$data = json_decode($response, true);

if (isset($data['data'])) {
    $sexoRaw = strtoupper(trim($data['data']['SEXO'] ?? ''));
    if ($sexoRaw === 'M' || $sexoRaw === 'MASCULINO') {
        $sexo = 'Masculino';
    } elseif ($sexoRaw === 'F' || $sexoRaw === 'FEMININO') {
        $sexo = 'Feminino';
    } else {
        $sexo = '';
    }

    echo json_encode([
        'nome' => $data['data']['NOME'] ?? '',
        'dataNascimento' => $data['data']['NASC'] ?? '', // <<< AQUI FOI CORRIGIDO
        'cpf' => $data['data']['CPF'] ?? '',
        'sexo' => $sexo,
        'nome_mae' => $data['data']['NOME_MAE'] ?? ''
    ]);
} else {
    http_response_code($httpCode);
    echo json_encode(['success' => false, 'error' => 'Dados não encontrados.']);
}
?>