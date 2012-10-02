<?php

if ($_GET['code']) {
	$params = array();
	$params['client_id'] = '200755636152.apps.googleusercontent.com';
	$params['client_secret'] = 'uwswcT5DfQ8p_AWD1nA-CZV2';
	$params['code'] = $_GET['code'];
	$params['grant_type'] = 'authorization_code';
	$params['redirect_uri'] = 'http://thomasgallinari.com/chameleon/googlereader/oauth2.php';

	$ch = curl_init('https://accounts.google.com/o/oauth2/token');
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_HEADER, false);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
	$result = json_decode(curl_exec($ch));
	curl_close($ch);
	
	$url = 'http://chameleonlauncher.com/widgets/common/oauth/callback?';
	foreach ($result as $key => $value) {
		$url = $url . $key . '=' . $value . '&';
	}
	$url = substr_replace($url, '', -1);
	header('Location: ' . $url);
} else if ($_GET['refresh_token']) {
	$params = array();
	$params['client_id'] = '200755636152.apps.googleusercontent.com';
	$params['client_secret'] = 'uwswcT5DfQ8p_AWD1nA-CZV2';
	$params['refresh_token'] = $_GET['refresh_token'];
	$params['grant_type'] = 'refresh_token';

	$ch = curl_init('https://accounts.google.com/o/oauth2/token');
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_HEADER, false);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
	$result = curl_exec($ch);
	curl_close($ch);

	echo $result;
}

?>

