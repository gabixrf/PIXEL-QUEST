
<?php

session_start();

// Remove todas as variáveis da sessão
session_unset();

// Encerra a sessão
session_destroy();

// Volta para a página inicial
header("Location: index.php");
exit;

?>
