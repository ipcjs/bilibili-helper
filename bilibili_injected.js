(function() {
	if ($("html").hasClass("bilibili-helper")) return false;

	var adModeOn = false;
	var biliHelper = new Object();
	var ff_status = {},
		ff_status_id = 0,
		ff_embed_stack = null,
		ff_embed_stack_style = null;

	function formatInt(Source, Length) {
		var strTemp = "";
		for (i = 1; i <= Length - (Source + "").length; i++) {
			strTemp += "0";
		}
		return strTemp + Source;
	}

	function parseSafe(text) {
		return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}

	function parseTime(timecount) {
		return formatInt(parseInt(timecount / 60000), 2) + ':' + formatInt(parseInt((timecount / 1000) % 60), 2);
	}

	function inject_css(name, content) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("id", name);
		styleElement.setAttribute("type", "text/css");
		styleElement.appendChild(document.createTextNode(content));
		if (document.head) {
			document.head.appendChild(styleElement);
		} else {
			document.documentElement.appendChild(styleElement);
		}
	}

	function disable() {
		var style = document.getElementById("bilibili_helper");
		if (style) style.parentNode.removeChild(style);
	}

	function enable(style2apply) {
		disable();
		if (style2apply) {
			inject_css("bilibili_helper", style2apply);
			if (window.location.hostname == "space.bilibili.com") {
				$('link[type="text/css"]').each(function(index, element) {
					if ($(element).attr("href").indexOf("space.css") != -1) disable();
				});
			}
		}
	}

	function notifyCidHack(callback) {
		var majorVersion = parseInt(/Chrome\/([\d\.apre]+)/.exec(window.navigator.userAgent)[1]);
		if (biliHelper.cidHack) {
			chrome.extension.sendMessage({
				command: "cidHack",
				cid: biliHelper.cid,
				type: biliHelper.cidHack
			}, function(response) {
				if (majorVersion < 37 && !biliHelper.outdateNotice) {
					biliHelper.outdateNotice = true;
					biliHelper.favorHTML5 = true;
					if (confirm('您的 Chrome 版本过旧，可能无法完成播放器替换。\n扩展支持的最低版本: Chrome 37\n您正在使用的版本: Chrome ' + /Chrome\/([\d\.apre]+)/.exec(window.navigator.userAgent)[1] + '\n您想要下载新版吗？')) {
						window.open('http://dlsw.baidu.com/sw-search-sp/soft/9d/14744/ChromeStandaloneSetup.1413788677.exe');
					};
				}
				if (typeof callback === 'function') callback();
			});
		} else {
			if (typeof callback === 'function') callback();
		}
	}

	function adMode(css) {
		var style = document.getElementById("bilibili_helper_ad_mode");
		if (style) style.parentNode.removeChild(style);
		if (adModeOn == true) {
			adModeOn = false;
		} else {
			adModeOn = true;
			inject_css("bilibili_helper_ad_mode", css);
		}
		return adModeOn;
	}

	function addTitleLink(text, mode) {
		if (mode == "off") return text;
		return text.replace(/(\d+)/g, function(mathchedText, $1, offset, str) {
			for (var i = offset; i >= 0; i--) {
				if (str[i] == "】") break;
				else if (str[i] == "【") return mathchedText;
			}
			var previous = str.substring(0, offset) + (parseInt(mathchedText) - 1).toString() + str.substring(offset + mathchedText.length, str.length),
				next = str.substring(0, offset) + (parseInt(mathchedText) + 1).toString() + str.substring(offset + mathchedText.length, str.length);
			previous = previous.replace(/(#)/g, " ");
			next = next.replace(/(#)/g, " ");
			if (mode == "without") {
				previous = previous.replace(/(\【.*?\】)/g, "");
				next = next.replace(/(\【.*?\】)/g, "");
			}
			return "<span class=\"titleNumber\" previous = \"" + previous + "\" next = \"" + next + "\">" + mathchedText + "</span>";
		});
	}

	function intilize_style() {
		chrome.extension.sendMessage({
			command: "getCSS",
			url: document.URL
		}, function(response) {
			if (response.result == "ok") enable(response.css);
		});
	}

	function miniPlayer() {
		var l = $("#bofqi"),
			j = l.offset().top + l.height() + 100,
			s = 0,
			r = !1;
		$('<input type="checkbox" id="checkbox_miniplayer" /><label class="no-select" for="checkbox_miniplayer">\u5f00\u542f\u8ff7\u4f60\u64ad\u653e\u5668</label>').appendTo(".common .b-head");
		var q = $("#checkbox_miniplayer");
		1 != ChatGetSettings("b_miniplayer") && null != ChatGetSettings("b_miniplayer") || q.attr("checked", !0);
		q.change(function() {
			var a = $(this).is(":checked") ? 1 : 0;
			ChatSaveSettings("b_miniplayer", a);
			0 == a ? (r = !0, o()) : (j == l.offset().top + l.height() + 100 || l.hasClass("float") || (j = l.offset().top + l.height() + 100), $(window).scrollTop() > j && (r = !1, p()))
		});
		var p = function() {
				if (!l.hasClass("float") && !r && 0 != $(".comm").find("ul").length) {
					var a = $('<div class="dami"></div>').insertBefore(l);
					l.hasClass("wide") && a.addClass("wide");
					$('<div class="move"><div class="gotop">\u56de\u5230\u9876\u90e8</div><div class="t">\u70b9\u51fb\u6309\u4f4f\u62d6\u52a8</div><div class="close">\u5173\u95ed</div></div>').prependTo(l);
					0 < $(".huodong_bg").length && $(".huodong_bg").hide();
					a = 0 < $(".rat").length ? $(".rat").offset().left : $(".v_small").offset().left;
					l.addClass("float").css({
						left: a,
						opacity: 0
					}).stop().animate({
						opacity: 1
					}, 300);
					730 >= $(window).height() && l.css({
						top: "inherit",
						bottom: "5px"
					})
				}
			},
			o = function() {
				n();
				$(".move", l).remove();
				$(".dami").remove();
				l.removeClass("float");
				l.css({
					left: "",
					top: "",
					bottom: ""
				});
				0 < $(".huodong_bg").length && $(".huodong_bg").show()
			},
			n = function() {
				s = 0;
				$(".mmask").remove();
				$(document).unbind("mousemove");
				$("body,#bofqi").removeClass("noselect");
				$(".move", l).removeClass("on")
			};
		$(document).scroll(function() {
			0 != ChatGetSettings("b_miniplayer") && (j == l.offset().top + l.height() + 100 || l.hasClass("float") || (j = l.offset().top + l.height() + 100), $(window).scrollTop() > j ? p() : (r && (r = !1), l.hasClass("float") && o()))
		});
		l.hover(function() {
			l.hasClass("float") && !s && $(".move", l).show()
		}, function() {
			s || $(".move", l).hide()
		});
		$(l).delegate(".move", "mousedown", function(a) {
			s = 1;
			$("body,#bofqi").addClass("noselect");
			$(this).addClass("on");
			$('<div class="mmask"></div>').appendTo("body");
			var e = a.pageX - $(this).offset().left,
				c = a.pageY - $(this).offset().top;
			$(document).bind("mousemove", function(d) {
				var g = d.clientX - e,
					f = d.clientY - c <= $(window).height() - l.height() ? d.clientY - c : $(window).height() - l.height(),
					f = d.clientY - c >= $(window).height() - l.height() - 5 ? $(window).height() - l.height() - 5 : 0 >= d.clientY - c ? 0 : d.clientY - c;
				l.css({
					left: g,
					top: f
				})
			})
		});
		$(l).delegate(".move", "mouseup", function(b) {
			n()
		});
		$(l).delegate(".move .close", "click", function(b) {
			r = !0;
			o()
		});
		$(l).delegate(".move .gotop", "click", function(b) {
			$("html,body").animate({
				scrollTop: $(".viewbox").offset().top
			}, 300)
		})
	}

	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		switch (request.command) {
			case "update":
				intilize_style();
				sendResponse({
					result: "ok"
				});
				return true;
			case "checkAdMode":
				sendResponse({
					result: "ok",
					mode: adModeOn
				});
				return true;
			case "adMode":
				sendResponse({
					result: "ok",
					mode: adMode(request.css)
				});
				return true;
			case "copyright":
				biliHelper.copyright = true;
				return true;
			case "error":
				if (biliHelper.cidHack == 0) {
					biliHelper.cidHack = 1;
					biliHelper.switcher[biliHelper.switcher.current]();
				} else if (biliHelper.cidHack == 1 && biliHelper.copyright) {
					biliHelper.cidHack = 2;
					biliHelper.switcher[biliHelper.switcher.current]();
				} else if (biliHelper.switcher.current != "original") {
					biliHelper.switcher["original"]();
				}
				return true;
			default:
				sendResponse({
					result: "unknown"
				});
				return false;
		}
	});

	var finishUp = function(forceCidHack) {
		chrome.extension.sendMessage({
			command: "getDownloadLink",
			cid: biliHelper.cid,
			cidHack: forceCidHack || biliHelper.cidHack
		}, function(response) {
			var videoDownloadLink = response["download"],
				videoPlaybackLink = response["playback"];
			biliHelper.downloadUrls = [];
			biliHelper.playbackUrls = [];
			if (videoDownloadLink.result == "error") {
				if (typeof videoDownloadLink.message == "string") {
					if (videoDownloadLink.message.indexOf("地区") > -1) {
						biliHelper.copyright = true;
						if (forceCidHack || biliHelper.cidHack != 2) {
							finishUp(2);
						}
					}
					biliHelper.error = '错误: ' + videoDownloadLink.message;
				}
			} else {
				if (typeof videoDownloadLink.durl["url"] === "undefined") {
					biliHelper.downloadUrls = videoDownloadLink.durl;
				} else {
					biliHelper.downloadUrls.push(videoDownloadLink.durl);
				}
				if (typeof videoPlaybackLink.durl["url"] === "undefined") {
					biliHelper.playbackUrls = videoPlaybackLink.durl;
				} else {
					biliHelper.playbackUrls.push(videoPlaybackLink.durl);
				}
				$('#loading-notice').fadeOut(300);
				if (biliHelper.favorHTML5 && biliHelper.cid && biliHelper.playbackUrls && biliHelper.playbackUrls.length == 1 && biliHelper.playbackUrls[0].url.indexOf('m3u8') < 0) {
					$('#loading-notice').fadeOut(300, function() {
						biliHelper.switcher.html5();
					});
				} else if (biliHelper.replacePlayer) {
					$('#loading-notice').fadeOut(300, function() {
						biliHelper.switcher.swf();
					});
				} else {
					$('#loading-notice').fadeOut(300);
				}
			}
		});
	}

	var biliHelperFunc = function() {
		intilize_style();
		$("html").addClass("bilibili-helper");
		var bili_reg = /\/video\/av([0-9]+)\/(?:index_([0-9]+)\.html)?$/,
			urlResult = bili_reg.exec(document.URL.split('#')[0]);
		if (urlResult) {
			biliHelper.avid = urlResult[1];
			biliHelper.page = urlResult[2];
			biliHelper.cidHack = 0;
			if (typeof biliHelper.page === "undefined") {
				biliHelper.page = 1;
			} else {
				biliHelper.page = parseInt(biliHelper.page);
			}
			biliHelper.pageOffset = 0;
			chrome.extension.sendMessage({
				command: "init"
			}, function(response) {
				biliHelper.genPage = false;
				biliHelper.copyright = false;
				if (!$('.z').length) {
					biliHelper.genPage = true;
					biliHelper.redirectUrl = decodeURIComponent(__GetCookie('redirectUrl'));
				}
				if ($('.z .z-msg').length > 0 && $('.z .z-msg').text().indexOf('版权') > -1) {
					biliHelper.genPage = true;
					biliHelper.copyright = true;
				}
				if ($('#bofqi div') > 0 && $('#bofqi div').text().indexOf('版权') > -1) {
					biliHelper.copyright = true;
				}
				if ($('meta[name="redirect"]').length) {
					biliHelper.redirectUrl = $('meta[name="redirect"]').attr('content');
				}
				biliHelper.version = response.version;
				var helperBlock = $("<div class=\"block helper\" id=\"bilibili_helper\"><span class=\"title\"><div class=\"icon\"></div>哔哩哔哩助手</span><div class=\"info\"><div class=\"main\">加载中，请稍候…</div><div class=\"version\">哔哩哔哩助手 " + biliHelper.version + " by <a href=\"http://weibo.com/guguke\" target=\"_blank\">@啾咕咕www</a></div></div></div>");
				helperBlock.find('.title').click(function() {
					var blockInfo = $(this).closest('.block').find('.info'),
						main = blockInfo.find('.main');
					if (blockInfo.hasClass('active')) {
						blockInfo.removeClass('active');
					} else {
						main.empty();
						var infoSection = $('<div class="section video"><h3>视频信息</h3><p><span></span><span>aid: ' + biliHelper.avid + '</span><span>pg: ' + biliHelper.page + '</span></p></div>');
						if (biliHelper.cid) {
							infoSection.find('p').append($('<span>cid: ' + biliHelper.cid + '</span>'));
						}
						main.append(infoSection);
						if (!biliHelper.cid && biliHelper.error) {
							var errorSection = $('<div class="section error"><h3>Cid 获取失败</h3><p><span></span><span>' + parseSafe(biliHelper.error) + '</span></p></div>');
							main.append(errorSection);
						}
						if (biliHelper.redirectUrl) {
							var redirectSection = $('<div class="section redirect"><h3>生成页选项</h3><p><a class="b-btn w" href="' + biliHelper.redirectUrl + '">前往原始跳转页</a></p></div>');
							main.append(redirectSection);
						}
						if (biliHelper.cid && biliHelper.playbackUrls && biliHelper.playbackUrls.length == 1 && biliHelper.playbackUrls[0].url.indexOf('m3u8') < 0 || biliHelper.replacePlayer && typeof biliHelper.cid !== "undefined") {
							var switcherSection = $('<div class="section switcher"><h3>播放器切换</h3><p></p></div>');
							switcherSection.find('p').append($('<a class="b-btn w" type="original">原始播放器</a><a class="b-btn w" type="swf">SWF 播放器</a><a class="b-btn w" type="iframe">Iframe 播放器</a><a class="b-btn w" type="html5">HTML5 播放器</a>').click(function() {
								$('.arc-tool-bar .helper .section.switcher a.b-btn').addClass('w');
								biliHelper.switcher[$(this).attr('type')]();
								$(this).removeClass('w');
							}));
							if (biliHelper.redirectUrl) {
								switcherSection.find('a[type="original"]').remove();
							}
							if (!biliHelper.replacePlayer || !biliHelper.cid) {
								switcherSection.find('a[type="iframe"],a[type="swf"]').remove();
							}
							if (!biliHelper.cid || !biliHelper.playbackUrls || biliHelper.playbackUrls.length != 1 || biliHelper.playbackUrls[0].url.indexOf('m3u8') >= 0) {
								switcherSection.find('a[type="html5"]').remove();
							}
							switcherSection.find('a.b-btn[type="' + biliHelper.switcher.current + '"]').removeClass('w');
							main.append(switcherSection);
						}
						if (typeof biliHelper.downloadUrls !== "undefined" || biliHelper.error) {
							if (typeof biliHelper.downloadUrls !== "object" || !biliHelper.downloadUrls.length) {
								var errorMessage = biliHelper.error || "视频地址获取失败",
									downloaderSection = $('<div class="section downloder"><h3>视频下载</h3><p><span></span>' + errorMessage + '</p></div>');
							} else {
								var downloaderSection = $('<div class="section downloder"><h3>视频下载</h3><p></p></div>');
								for (i in biliHelper.downloadUrls) {
									var segmentInfo = biliHelper.downloadUrls[i];
									if (typeof segmentInfo == "object") downloaderSection.find('p').append($('<a class="b-btn w" rel="noreferrer"></a>').text('分段 ' + (parseInt(i) + 1)).attr('download', 'av' + biliHelper.avid + 'p' + biliHelper.page + '_' + i).attr('title', isNaN(parseInt(segmentInfo.filesize / 1048576 + 0.5)) ? ('长度: ' + parseTime(segmentInfo.length)) : ('长度: ' + parseTime(segmentInfo.length) + ' 大小: ' + parseInt(segmentInfo.filesize / 1048576 + 0.5) + ' MB')).attr('href', segmentInfo.url));
								}
							}
						} else {
							var downloaderSection = $('<div class="section downloder"><h3>视频下载</h3><p><span></span>视频地址获取中，请稍等…</p></div>');
						}
						main.append(downloaderSection);
						blockInfo.addClass('active');
					}
				});
				if (!biliHelper.genPage) $('.player-wrapper .arc-tool-bar').append(helperBlock);
				biliHelper.originalPlayer = $('#bofqi').html();
				if (response.replace == "on" &&
					($('#bofqi object').length > 0 && $('#bofqi object').attr('data') != 'http://static.hdslb.com/play.swf' && $('#bofqi object').attr('data') != 'https://static-s.bilibili.com/play.swf' && $('#bofqi object').attr('data') != 'http://static.hdslb.com/letv.swf' && $('#bofqi object').attr('data') != 'http://static.hdslb.com/play_old.swf') ||
					($('#bofqi embed').length > 0 && $('#bofqi embed').attr('src') != 'http://static.hdslb.com/play.swf' && $('#bofqi embed').attr('src') != 'https://static-s.bilibili.com/play.swf' && $('#bofqi embed').attr('src') != 'http://static.hdslb.com/letv.swf' && $('#bofqi embed').attr('src') != 'http://static.hdslb.com/play_old.swf') ||
					($('#bofqi iframe').length > 0 && ($('#bofqi iframe').attr('src').indexOf('bilibili.com') < 0 || $('#bofqi iframe').attr('src').indexOf('iqiyi') > 0)) ||
					($('#bofqi object').length + $('#bofqi embed').length + $('#bofqi iframe').length == 0)) {
					biliHelper.replacePlayer = true;
				} else {
					biliHelper.replacePlayer = false;
				}
				if (response.html5 == "on") {
					biliHelper.favorHTML5 = true;
				} else {
					biliHelper.favorHTML5 = false;
				}
				if (biliHelper.replacePlayer || biliHelper.favorHTML5) {
					var replaceNotice = $('<div id="loading-notice">正在尝试替换播放器…<span id="cancel-replacing">取消</span></div>');
					replaceNotice.find('#cancel-replacing').click(function() {
						$('#loading-notice').fadeOut(300);
						biliHelper.replacePlayer = false;
						biliHelper.favorHTML5 = false;
					});
					$('#bofqi').append(replaceNotice);
				}
				biliHelper.switcher = {
					current: "original",
					original: function() {
						this.current = "original";
						notifyCidHack(function() {
							$('#bofqi').html(biliHelper.originalPlayer);
							if ($('#bofqi embed').attr('width') == 950) $('#bofqi embed').attr('width', 980);
						});
					},
					swf: function() {
						this.current = "swf";
						notifyCidHack(function() {
							$('#bofqi').html('<object type="application/x-shockwave-flash" class="player" data="http://static.hdslb.com/play.swf" id="player_placeholder" style="visibility: visible;"><param name="allowfullscreeninteractive" value="true"><param name="allowfullscreen" value="true"><param name="quality" value="high"><param name="allowscriptaccess" value="always"><param name="wmode" value="opaque"><param name="flashvars" value="cid=' + biliHelper.cid + '&aid=' + biliHelper.avid + '"></object>');
						});
					},
					iframe: function() {
						this.current = "iframe";
						notifyCidHack(function() {
							$('#bofqi').html('<iframe height="536" width="980" class="player" src="https://secure.bilibili.com/secure,cid=' + biliHelper.cid + '&aid=' + biliHelper.avid + '" scrolling="no" border="0" frameborder="no" framespacing="0" onload="window.securePlayerFrameLoaded=true"></iframe>');
						});
					},
					html5: function() {
						this.current = "html5";
						$('#bofqi').html('<div id="bilibili_helper_html5_player" class="player"><video id="bilibili_helper_html5_player_video" autobuffer="true" poster="' + biliHelper.videoPic + '"><source src="' + biliHelper.playbackUrls[0].url + '" type="video/mp4"></video></div>');
						var abp = ABP.create(document.getElementById("bilibili_helper_html5_player"), {
							"src": {
								"playlist": [{
									"video": document.getElementById("bilibili_helper_html5_player_video"),
									"comments": "http://comment.bilibili.com/" + biliHelper.cid + ".xml"
								}]
							},
							width: "100%",
							height: "100%"
						});
						abp.playerUnit.addEventListener("wide", function() {
							$("#bofqi").addClass("wide");
						});
						abp.playerUnit.addEventListener("normal", function() {
							$("#bofqi").removeClass("wide");
						});
						var bofqiHeight = 0;
						$(window).scroll(function() {
							if (bofqiHeight != $("#bofqi").width()) {
								bofqiHeight = $("#bofqi").width();
								if (abp && abp.cmManager) {
									abp.cmManager.setBounds();
								}
							}
						});
					}
				}
				work();
			});

			var work = function() {
				chrome.extension.sendMessage({
					command: "getVideoInfo",
					avid: biliHelper.avid,
					pg: biliHelper.page + biliHelper.pageOffset
				}, function(response) {
					var videoInfo = response.videoInfo,
						error = false;
					biliHelper.videoPic = videoInfo.pic;
					if ($('#alist a').length) {
						var maxPage = 0;
						$('#alist a').each(function(i, e) {
							var match = bili_reg.exec($(e).attr('href'));
							if (match && match[2]) {
								var page = parseInt(match[2]);
								if (page > maxPage) {
									maxPage = page;
								}
							}
						});
						if (maxPage > videoInfo.pages && biliHelper.pageOffset > videoInfo.pages - maxPage) {
							biliHelper.pageOffset = videoInfo.pages - maxPage;
							work();
							return false;
						}
					}
					if (typeof videoInfo.code !== "undefined") {
						if (biliHelper.page != 1) {
							chrome.extension.sendMessage({
								command: "getVideoInfo",
								avid: biliHelper.avid,
								pg: 1
							}, function(response) {
								var firstVideoInfo = response.videoInfo;
								if (firstVideoInfo.pages == biliHelper.page - 1) {
									biliHelper.pageOffset -= 1;
									work();
									return false;
								}
							});
						} else {
							biliHelper.error = '错误' + videoInfo.code + ': ' + videoInfo.error;
							$('#loading-notice').fadeOut(300);
						}
					} else {
						biliHelper.cid = videoInfo.cid;
					}
					if (biliHelper.genPage) {
						$.get(chrome.extension.getURL("template.html"), function(template) {
							var page = template.replace(/%avid%/g, biliHelper.avid).replace(/%page%/g, biliHelper.page).replace(/%tid%/g, videoInfo.tid).replace(/%mid%/g, videoInfo.mid).replace(/%pic%/g, videoInfo.pic).replace(/%title%/g, parseSafe(videoInfo.title)).replace(/%sp_title%/g, videoInfo.sp_title ? parseSafe(videoInfo.sp_title) : '').replace(/%sp_title_uri%/g, videoInfo.sp_title ? encodeURIComponent(videoInfo.sp_title) : '').replace(/%spid%/g, videoInfo.spid).replace(/%season_id%/g, videoInfo.season_id).replace(/%created_at%/g, videoInfo.created_at).replace(/%description%/g, parseSafe(videoInfo.description)).replace(/%redirectUrl%/g, biliHelper.redirectUrl).replace(/%tags%/g, JSON.stringify(videoInfo.tag.split(",")));
							document.open();
							document.write(page);
							document.close();
						});
						biliHelperFunc();
						return false;
					}

					if (biliHelper.replacePlayer) {
						miniPlayer();
					}

					window.postMessage ? (c = function(a) {
						"https://secure.bilibili.com" != a.origin && "https://ssl.bilibili.com" != a.origin || "secJS:" != a.data.substr(0, 6) || eval(a.data.substr(6));
						"undefined" != typeof console && console.log(a.origin + ": " + a.data)
					}, window.addEventListener ? window.addEventListener("message", c, !1) : window.attachEvent && window.attachEvent("onmessage", c)) : setInterval(function() {
						if (evalCode = __GetCookie("__secureJS")) {
							__SetCookie("__secureJS", ""), eval(evalCode)
						}
					}, 1000);

					if (biliHelper.cid && !biliHelper.favorHTML5) {
						$('#loading-notice').fadeOut(300, function() {
							biliHelper.switcher.swf();
						});
					}
					if (!biliHelper.cid) {
						biliHelper.error = '错误' + videoInfo.code + ': ' + videoInfo.error;
						return false;
					}

					finishUp();

					$('.viewbox .info h2').html(addTitleLink($('.viewbox .info h2').attr('title'), response.rel_search));
					$(".titleNumber").click(function() {
						var msgbox = new MessageBox;
						msgbox.show(this, '\u70b9\u51fb\u641c\u7d22\u76f8\u5173\u89c6\u9891\uff1a<br /><a target="_blank" href="http://www.bilibili.com/search?orderby=default&keyword=' + encodeURIComponent($(this).attr("previous")) + '">' + $(this).attr("previous") + '</a><br /><a target="_blank" href="http://www.bilibili.com/search?orderby=ranklevel&keyword=' + encodeURIComponent($(this).attr("next")) + '">' + $(this).attr("next") + '</a>', 1e3);
					});
				});
			}
		}
	}
	$(document).ready(biliHelperFunc);
})();