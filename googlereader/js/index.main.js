$(document).ready(function(){

	var REFRESH_TIMESPAN = 60000 * 5;

	var current_account = null;
	var last_update_call = -1;

	/*
		- Initialize Chameleon Lifecycle
		- All callback functions are optional.
		- If you are not using a callback, remove it for extra performance.
	*/
	
	chameleon.widget({

		//Triggered every time the widget loads.
		onLoad:function() {	
			loadFeed();
		},
		
		//Triggered the first time the widget is created.
		/*
		onCreate:function()
		{	
			//		
		},
		
		//Triggered everytime Chameleon resumes	(comes back into focus).				
		onResume:function()
		{
			//
		},
		
		//Triggered every time Chameleon pauses (goes out of focus).
		onPause:function()
		{
			//
		},
		
		//Triggered every time the size of the widget changes.
		onLayout:function()
		{
			//	
		},
		*/
		
		//Triggered when the user scrolls the widget to it's top.
		onScrollTop:function() {
			if (current_account != null && chameleon.connected()) {
				updateFeedIfWithinTimespan();
				startPolling();	
			}
		},
		
		//Triggered when the user scrolls the widget away from it's top.
		onScrollElsewhere:function() {
			stopPolling();
		},
		
		//Triggered when the user enters dashboard edit mode.
		onLayoutModeStart:function() {
			if (current_account != null) {
				stopPolling();
			} else {
				if (chameleon.connected()) {
					displayNoFeedMessage();
				} else {
					displayOfflineMessage();
				}
			}
		},
		
		//Triggered when the user exits dashboard edit mode.
		onLayoutModeComplete:function() {
			if (current_account != null) {
				startPolling();
				updateFeedIfWithinTimespan();
			} else {
				if (chameleon.connected()) {
					displayNoFeedMessage();
				} else {
					displayOfflineMessage();
				}
			}
		},
		
		//Triggered when the status of network availability changes.
		onConnectionAvailableChanged:function(available) {
			if (available) {
				if (current_account != null) {
					loadReaderFeed();
				} else {
					loadFeed();	
				}
			} else {
				stopPolling();
				if (current_account == null) displayOfflineMessage();
			}
		},
		
		//Triggered when the user taps the configure button in the widget title bar.
		onConfigure:function() {
			stopPolling();
			launchSettings();
		},
		
		
		//Triggered when the user taps the widget titlebar.
		onTitleBar:function() {
			launchGoogleReaderApp();
		},
		
		//Triggered when the user taps the refresh button on the widget title bar.
		onRefresh:function() {
			if (current_account != null) {
				loadReaderFeed();
			}
		},
		
		//Triggered every time the widget loads, but not in Chameleon.				
		notChameleon:function() {
		},
	});

	function clearContent() {
		$("#chameleon-widget").html("");
	}
	
	function displayNoFeedMessage() {
		chameleon.invalidate();
		if (chameleon.isInLayoutMode()) {
			$("#chameleon-widget").chameleonWidgetConfigureHTML({onConfigure:launchSettings, title:"Register Your Account", noicon:true,  caption:"Tap the gear in the top right to register your Google Reader Account and display your feeds in this widget."});
			$("#chameleon-widget").chameleonInvalidate();
		} else {
			$("#chameleon-widget").chameleonWidgetConfigureHTML({onConfigure:launchSettings, title:"Register Your Account", caption:"Tap here to register your Google Reader Account and display your feeds in this widget."});
			$("#chameleon-widget").chameleonInvalidate();
		}
	}
	
	function displayNoItemsMessage() {
		chameleon.invalidate();
		$("#chameleon-widget").chameleonWidgetMessageHTML({title:"No item"});
		$("#chameleon-widget").chameleonInvalidate();
	}
	
	function displayOfflineMessage() {
		chameleon.invalidate();
		$("#chameleon-widget").chameleonWidgetNeedWiFiHTML();
		$("#chameleon-widget").chameleonInvalidate();
	}
	
	function drawMessages(messages) {
		chameleon.invalidate();
		var str = "";
		if (messages != null && messages.length > 0) {
			for (var i = 0; i < messages.length; i++) {
				str += getHTMLFromEntry(messages[i]);
			}
		}
		if (str != "") $("#chameleon-widget").html(str);
		$("#chameleon-widget").chameleonInvalidate();
		$("#chameleon-widget").chameleonProxyAllLinks();
		chameleon.initialize();
	}
	
	function getHTMLFromEntry(entry) {
		var r = "";
		r += "<div class='reader-entry'><a href='" + entry.link + "'>";
		r += "<p class='reader-entry-title'>" + entry.title + "</p>";
		if (entry.published != null) r += "<abbr class='reader-entry-published' title='" + entry.published + "'>" + chameleon.timesince(entry.published, "int") + "</abbr>";
		if (entry.summary != null) {
			var summary = entry.summary;
			summary = summary.replace(new RegExp("<(.|\n)*?>", "gi"), "");
			if (summary.length > 150) {
				summary = summary.substring(0, 150) + "...";
			}
			r += "<p class='reader-entry-summary'>" + summary + "</p>";
		}
		r += "</a></div>";
		return r;
	}
	
	function launchGoogleReaderApp() {
		var component = {package:"com.google.android.apps.reader", name:"com.google.android.apps.reader.app.StreamListActivity"};
		if (chameleon.componentExists(component)) {
			chameleon.intent({
				component:component,
				action:"android.intent.action.MAIN"
			});
		} else {
			chameleon.intent({
				action:"android.intent.action.VIEW",
				data:"http://www.google.fr/reader/"
			});
		}
	}

	function launchSettings(e) {
		if (e != null) e.preventDefault();
		chameleon.promptHTML({
			url:"settings.html",
			callback:function(success, data){
				if (success) {
					loadFeed();
				}	
			}
		});
	}
	
	function loadFeed() {
		stopPolling();
		if (!loadFeedForSelectedAccount()) {
			if (!loadDefaultFeed()) {
				if (chameleon.connected()) {
					displayNoFeedMessage();
					chameleon.initialize();
				} else {
					displayOfflineMessage();
					chameleon.initialize();
				}
			}
		}
	}

	function loadDefaultFeed() {
		var r = false;
		var shared_data = chameleon.getSharedData();
		if (shared_data == null) shared_data = {};
		if (shared_data.accounts == null) shared_data.accounts = [];
		var account = null;
		if (shared_data.accounts.length > 0) {
			account = shared_data.accounts[0];
			if (current_account == null || account.secret != current_account.secret) {
				current_account = account;
				loadReaderFeed();
			}
			r = true;
		}
		return r;
	}
	
	function loadFeedForSelectedAccount() {
		var r = false;
		var data = chameleon.getData();
		if (data != null && data.account_to_load != null) {
			var shared_data = chameleon.getSharedData();
			if (shared_data == null) shared_data = {};
			if (shared_data.accounts == null) shared_data.accounts = [];
			var account = null;
			for (var i = 0; i < shared_data.accounts.length; i++) {
				if (shared_data.accounts[i].email == data.account_to_load) {
					account = shared_data.accounts[i];
					r = true;
					break;
				}
			}
			if (account != null && (current_account == null || account.secret != current_account.secret)) {
				current_account = account;
				loadReaderFeed();
			}
		}
		return r;
	}
	
	function loadReaderFeed() {
		if (current_account != null) {
			function callback() {
				var inst_data = chameleon.getData();
				if (inst_data == null) inst_data = {};
				chameleon.setTitle({text:"GOOGLE READER: " + current_account.email.toUpperCase()});
				if (chameleon.connected()) {
					last_update_call = (new Date()).valueOf();
					chameleon.showLoading({showloader:true});
					$.ajax({
						url: "googlereader.php",
						data: { oauth_token: current_account.token },
						dataType: "json",
						timeout: 5000,
						success: function(data, status, req) {
							chameleon.showLoading({showloader:false});
							clearContent();
							var messages = [];
							$.each(data.items, function(idx, item) {
								var message = {};
								message.title = item.title;
								message.link = item.alternate[0].href;
								message.published = item.published;
								message.summary = item.summary != null ? item.summary.content : (item.content != null ? item.content.content : null);
								messages.push(message);
							});
							if (messages.length > 0) {
								drawMessages(messages);
								chameleon.saveLocalData("cached_reader_items", messages);
							} else {
								clearContent();
								displayNoItemsMessage();
								chameleon.initialize();
							}
							startPolling();
						},
						error: function(req, status, err) {
							//alert("Could not load items: " + err);
							chameleon.showLoading({showloader:false});
							startPolling();
						}
					});
				} else {
					var local_data = chameleon.getLocalData("cached_reader_items");
					if (local_data != null) {
						drawMessages(local_data);
					} else {
						displayOfflineMessage();
					}
				}
			}
			if (current_account.expires > new Date().getTime()) {
				callback();
			} else {
				//alert("Access token expired");
				$.ajax({
					url: "oauth2.php",
					data: { refresh_token: current_account.refresh_token },
					dataType: "json",
					timeout: 5000,
					success: function(data, status, req) {
						current_account.token = data.access_token;
						current_account.expires = (new Date().getTime() + parseInt(data.expires_in) * 1000) - 5000;
						saveAccount(current_account);
						callback();
					},
					error: function(req, status, err) {
						//alert("Could not refresh token: " + err);
					}
				});
			}
		} else {
			stopPolling();
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
	
	function startPolling() {
		chameleon.poll({id:"feed_refresh", action:"start", interval:REFRESH_TIMESPAN, callback:loadReaderFeed});
	}
	
	function stopPolling() {
		chameleon.poll({id:"feed_refresh", action:"stop"});
	}
	
	function updateFeedIfWithinTimespan() {
		if (current_account != null && last_update_call != -1) {
			var now = (new Date()).valueOf();
			if (now > (last_update_call + 60000)) {
				loadReaderFeed();
			}
		}
	}
	
});

