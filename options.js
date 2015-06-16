$(document).ready(function() {
	var bkg_page = chrome.extension.getBackgroundPage();
	document.title = chrome.i18n.getMessage('extName') + " - " + chrome.i18n.getMessage('optionPage');
	$("#menu_title").text(chrome.i18n.getMessage('extName'));
	$("#version").html(bkg_page.version);
	$("#ad_opacity_opt").hide();
	$("div[option=\"" + bkg_page.getOption("replace") + "\"].replace").addClass("on");
	$("div[option=\"" + bkg_page.getOption("html5") + "\"].html5").addClass("on");
	$("div[option=\"" + bkg_page.getOption("contextmenu") + "\"].contextmenu").addClass("on");
	$("div[option=\"" + bkg_page.getOption("dynamic") + "\"].dynamic").addClass("on");
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
});