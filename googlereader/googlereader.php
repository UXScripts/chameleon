<?php

$ch = curl_init('https://www.google.com/reader/api/0/stream/contents/user/-/state/com.google/reading-list');
$header = array('Authorization: OAuth ' . $_GET['oauth_token']);
curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
$result = curl_exec($ch);
curl_close($ch);
echo $result;

?>
