$(document).ready(function() {
	var bkg_page = chrome.extension.getBackgroundPage();
	document.title = chrome.i18n.getMessage('extShortName') + " - " + chrome.i18n.getMessage('optionPage');
	$("#menu_title").text(chrome.i18n.getMessage('extShortName'));
	$("#version").html(bkg_page.version);
	$("#ad_opacity_opt").hide();
	$("div[option=\"" + bkg_page.getOption("replace") + "\"].replace").addClass("on");
	$("div[option=\"" + bkg_page.getOption("html5") + "\"].html5").addClass("on");
	$("div[option=\"" + bkg_page.getOption("contextmenu") + "\"].contextmenu").addClass("on");
	$("div[option=\"" + bkg_page.getOption("dynamic") + "\"].dynamic").addClass("on");
	// $("div[option=\"" + bkg_page.getOption("support") + "\"].support").addClass("on");
	$("div[option=\"" + bkg_page.getOption("dlquality") + "\"].dlquality").addClass("on");
	$("div[option=\"" + bkg_page.getOption("indexversion") + "\"].indexversion").addClass("on");
	$("div[option=\"" + bkg_page.getOption("rel_search") + "\"].rel_search").addClass("on");
	var adOption = bkg_page.getOption("ad");
	$("div[option=\"" + adOption + "\"].ad").addClass("on");
	if (adOption == "fade") $("#ad_opacity_opt").show();
	$("#ad_opacity").val(bkg_page.getOption("ad_opacity"));
	$('.ad').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.ad').removeClass('on');
		$(this).addClass('on');
		if ($(this).attr("option") == "fade") $("#ad_opacity_opt").slideDown(300);
		else $("#ad_opacity_opt").slideUp(300);
		bkg_page.setOption("ad", $(this).attr("option"), true);
		updatepreview();
	});
	$('#ad_opacity').change(function() {
		bkg_page.setOption("ad_opacity", $(this).val(), true);
		updatepreview();
	});
	/*$('.support').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.support').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("support", $(this).attr("option"));
	});*/
	$('.dynamic').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.dynamic').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("dynamic", $(this).attr("option"));
	});
	$('.replace').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.replace').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("replace", $(this).attr("option"));
	});
	$('.html5').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.html5').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("html5", $(this).attr("option"));
	});
	$('.contextmenu').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.contextmenu').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("contextmenu", $(this).attr("option"));
		if ($(this).attr("option") == 'on') {
			chrome.contextMenus.create({
				title: chrome.i18n.getMessage('searchBili'),
				contexts: ["selection"],
				onclick: bkg_page.searchBilibili
			});
		} else {
			chrome.contextMenus.removeAll();
		}
	});
	$('.dlquality').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.dlquality').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("dlquality", $(this).attr("option"));
		updatepreview();
	});
	$('.indexversion').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.indexversion').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("indexversion", $(this).attr("option"));
		updatepreview();
	});
	$('.rel_search').click(function() {
		if ($(this).hasClass('on')) return false;
		$('.rel_search').removeClass('on');
		$(this).addClass('on');
		bkg_page.setOption("rel_search", $(this).attr("option"));
		updatepreview();
	});

	function getQueryVariable(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (decodeURIComponent(pair[0]) == variable) {
				return decodeURIComponent(pair[1]);
			}
		}
	}

	function formateDatetime(timestamp) {
		if (timestamp == 0) {
			return lang['oneDay'];
		}
		var date = new Date((parseInt(timestamp)) * 1000),
			year, month, day, hour, minute, second;
		year = String(date.getFullYear());
		month = String(date.getMonth() + 1);
		if (month.length == 1) month = "0" + month;
		day = String(date.getDate());
		if (day.length == 1) day = "0" + day;
		hour = String(date.getHours());
		if (hour.length == 1) hour = "0" + hour;
		minute = String(date.getMinutes());
		if (minute.length == 1) minute = "0" + minute;
		second = String(date.getSeconds());
		if (second.length == 1) second = "0" + second;
		return String(year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second);
	}

	var updateInfo = JSON.parse(bkg_page.getOption('crx_update'));

	if (updateInfo.version && bkg_page.compareVersion(updateInfo.version, chrome.app.getDetails().version) > 0) {
		$('#update').show();
		$('#update .version').text(updateInfo.version);
		$('#update .date').text(formateDatetime(updateInfo.update_time/1000));
		if (updateInfo.detail) {
			$('#update .detail').text(updateInfo.detail);
		} else {
			$('#update .detail').parent().hide();
		}
		$('#update .url').attr('href', 'https://bilihelper.guguke.net/');
	}

	/*$('#support_qm').click(function() {
		swal({
			title: "通过 VigLink 支持扩展开发",
			text: "通过在非 https 域网页参与合作商家的链接中加入合作信息等不影响原网页内容或安全性的方式, 为扩展项目获得盈利以支持解析服务器等相关开销. 您可以随时选择退出该项目.",
			type: "info",
			confirmButtonText: "参与",
			cancelButtonText: "之后再说",
			showCancelButton: true,
			html: true
		}, function(confirm) {
			if (confirm) $('.button.support[option="on"]').click();
		});
	});*/

	switch(getQueryVariable('mod')) {
		case 'update':
			swal({
				title: "升级成功",
				text: "您已成功升级至哔哩哔哩助手版本 v" + chrome.app.getDetails().version + "！请参阅右侧有关扩展更新内容，再次感谢您对哔哩哔哩助手项目的支持。",
				type: "success",
				confirmButtonText: "好的",
				html: true
			});
			break;
		case 'install':
			swal({
				title: "安装成功",
				text: "感谢您安装哔哩哔哩助手版本 v" + chrome.app.getDetails().version + "！请根据您的需要在左侧更改扩展的选项，右侧为有关扩展的相关介绍和说明。使用此扩展前请您阅读相关<a href=\"http://addons-privacy.com/\" target=\"_blank\">使用协议和隐私策略</a>。",
				type: "success",
				confirmButtonText: "同意并开始使用扩展",
				html: true,
				//closeOnConfirm: false
			}, function() {
				//$('#support_qm').click();
			});
			break;
		case 'new':
			if (updateInfo.version) {
				swal({
					title: "发现新版本",
					text: "发现新版哔哩哔哩助手: v" + updateInfo.version + "<br/>您当前使用的版本是: v" + chrome.app.getDetails().version + "<br/>如果您不能通过 Google 自动更新扩展或者在使用上遇到严重的问题，建议您参阅右侧信息，手动更新。",
					type: "warning",
					confirmButtonText: "好的",
					html: true
				}, function() {
					$('#about #update p').addClass('highlight');
				});
			}
			break;
	}

	window.history.replaceState({}, document.title, '/options.html');
});