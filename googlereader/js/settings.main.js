$(document).ready(function() {

	// ONLY FOR TESTING PURPOSE!
	//chameleon.saveSharedData({});

	var stoken = "";
	$("#accounts_select").hide();
	populateAccounts();
	
	$("#add-account-button").click(function() {
		chameleon.promptOauth({
			version:"2.0",
			authorize:{
				url: 'https://accounts.google.com/o/oauth2/auth',
				args: {
					response_type: 'code',
					access_type: 'offline',
					approval_prompt: 'force',
					scope: 'https://www.googleapis.com/auth/userinfo.email https://www.google.com/reader/api/'
				}
			},
			callbackURL: 'http://thomasgallinari.com/chameleon/googlereader/oauth2.php',
			consumerKey: '200755636152.apps.googleusercontent.com',
			onResult:function(success, data) {
				if (success) {
					var account = {};
					account.token = data.access_token;
					account.refresh_token = data.refresh_token;
					account.expires = (new Date().getTime() + parseInt(data.expires_in) * 1000) - 5000;
					account.secret = data.access_secret;
					account.email = "unknown";
					$.getJSON('https://www.googleapis.com/oauth2/v1/userinfo', { access_token: account.token }, function(data) {
						account.email = data.email;
						saveAccount(account); 
						populateAccounts(account);
					});
				}
			}
		});	
	
	});
	
	function populateAccounts(account_to_select) {
		var shared_data = chameleon.getSharedData();
		if (shared_data == null) shared_data = {};
		if (shared_data.accounts == null) shared_data.accounts = [];
		var options = [];
		if (shared_data.accounts.length > 0) {
			for (var i = 0; i < shared_data.accounts.length; i++) {
				var listing = {};
				listing.name = shared_data.accounts[i].email.toUpperCase();
				listing.value = shared_data.accounts[i].email;
				options.push(listing);
			}
			$("#accounts_select").show();
			$("#accounts_select").chameleonSelectList({
				title:"Select An Account:",
				list:options,
			});
			if (account_to_select != null) {
				$("#accounts_select").chameleonSelectList({selectedValue:account_to_select});
			}
		}
	}
	
	function saveAccount(account) {
		var shared_data = chameleon.getSharedData();
		if (shared_data == null) shared_data = {};
		if (shared_data.accounts == null) shared_data.accounts = [];
		var found = false;
		for (var i = 0; i < shared_data.accounts.length; i++) {
			if (shared_data.accounts[i].email == account.email && account.email != "unknown") {
				shared_data.accounts[i].token = account.token;
				shared_data.accounts[i].refresh_token = account.refresh_token;
				shared_data.accounts[i].expires = account.expires;
				shared_data.accounts[i].secret = account.secret;
				found = true;
			}
		}
		if (!found) shared_data.accounts.push(account);
		chameleon.saveSharedData(shared_data);
	}
	
	$("#close-button").click(function() {
		var selected_account = $("#accounts_select").chameleonSelectList({getSelectedItem:true}).value;
		if (selected_account != null && selected_account != "") {
			var data = chameleon.getData();
			if (data == null) data = {};
			data.account_to_load = selected_account;
			chameleon.saveData(data);	
			chameleon.close(true);
		} else {
			chameleon.close(false);
		}
	});
	
	function getEmailsFromString(input)  {
		var pattern = /([\w-\.]+)@((?:[\w]+\.)+)([a-zA-Z]{2,4})/g; 
		var results = input.match(pattern);
		return results;
	}

});
