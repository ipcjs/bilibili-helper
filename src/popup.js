var bkg_page = chrome.extension.getBackgroundPage();

function adModeFunction(cmd) {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, {
			command: cmd,
			css: bkg_page.ad_mode
		}, function(response) {
			if(typeof response !== "undefined") {
				if((response.mode) == false) $('#ad_mode').html(chrome.i18n.getMessage('adModeOff'));
				else if((response.mode) == true) $('#ad_mode').html(chrome.i18n.getMessage('adModeOn'));
			}
		})
	});
}

function getDynamic() {
	bkg_page.chrome.cookies.get({
		url: "http://interface.bilibili.com/",
		name: "DedeUserID"
	}, function(cookie) {
		if(cookie === null) $('#go_dynamic').html(chrome.i18n.getMessage('goDynamic') + chrome.i18n.getMessage('notLogged'));
		else if(bkg_page.getOption("updates") > 0) $('#go_dynamic').html(chrome.i18n.getMessage('goDynamic') + '<span class="red">' + chrome.i18n.getMessage('nNewUpdate').replace('%n', bkg_page.getOption("updates")) + '</span>');
		else $('#go_dynamic').html(chrome.i18n.getMessage('goDynamic'));
	});
}

$(document).ready(function() {
	chrome.tabs.getSelected(null, function(tab) {
		if(tab.url.match(/:\/\/(.[^/]+)/)[1] == "www.bilibili.com" || tab.url.match(/:\/\/(.[^/]+)/)[1] == "space.bilibili.com") {
			$("#go_bili").hide();
		} else if(tab.url.match(/:\/\/(.[^/]+)/)[1] == "space.bilibili.com" || tab.url.match(/:\/\/(.[^/]+)/)[1] == "member.bilibili.com") {
			$("#go_bili, #ad_mode").hide();
		} else {
			$("#css_switch,#ad_mode").hide();
		}
	});
	$('#go_bili').html(chrome.i18n.getMessage('goBili'));
	$('#ad_mode').html(chrome.i18n.getMessage('adModeOff'));
	$('#go_video').html(chrome.i18n.getMessage('goVideo'));
	$('#go_option').html(chrome.i18n.getMessage('goOption'));
	$('#go_favorite').html(chrome.i18n.getMessage('goFavorite'));
	getDynamic();
	adModeFunction("checkAdMode");
	setTimeout(function() {
		$('button').blur();
		$('#video_id').focus();
	}, 100);
	$('#go_bili').click(function() {
		chrome.tabs.create({
			url: bkg_page.getOption("indexversion") == "old" ? "http://www.bilibili.com/index_old.html" : "http://www.bilibili.com/"
		});
		return false;
	});
	$('#go_dynamic').click(function() {
		bkg_page.chrome.browserAction.setBadgeText({
			text: ""
		});
		bkg_page.setOption("updates", 0);
		chrome.tabs.create({
			url: "http://www.bilibili.com/account/dynamic"
		});
		return false;
	});
	$('#go_favorite').click(function() {
		chrome.tabs.create({
			url: "http://member.bilibili.com/#favorite_manage"
		});
		return false;
	});
	$('#go_option').click(function() {
		chrome.tabs.create({
			url: chrome.extension.getURL('options.html')
		});
		return false;
	});
	$('#ad_mode').click(function() {
		adModeFunction("adMode");
	});
	$('#video_id').keyup(function (e) {
    	if (e.keyCode == 13) {
    		$('#go_video').click();
    	}
	});
	$('#go_video').click(function() {
		var value = $('#video_id').val().toLowerCase();
		if (/av[0-9]+/g.test(value)) {
			chrome.tabs.create({
				url: 'http://www.bilibili.com/video/' + value
			});
		} else if (/[0-9]+/g.test(value)) {
			chrome.tabs.create({
				url: 'http://www.bilibili.com/video/av' + value
			});
		} else {
			$('#video_id').val('').focus();
		}
		return false;
	});
});
