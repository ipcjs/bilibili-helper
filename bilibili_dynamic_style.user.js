// ==UserScript==
// @name         B站主页动态提醒直接显示在顶栏
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  可以直接看到当前的提醒的类型, 省去鼠标移过去的麻烦...
// @author       ipcjs
// @match        http://www.bilibili.com/
// @grant        none
// ==/UserScript==

(function() {
	'use strict';
	let msgStyleHtml = `#dyn_wnd {
    display: block!important;
    opacity: 1!important;
    background-color: transparent;
    
    left:-470px!important;
    top: -10px!important;
    z-index: -10000;
    
    box-shadow: none;
    border: none;
}
`;
	let msgHideListStyleHtml = `
#dyn_wnd > .dyn_menu {
    display: block!important;
}
#dyn_wnd > * {
    display: none!important;
}
`;
	let msgStyle = $('<style>').attr('id','msg_style').html(msgStyleHtml);
	let msgHideListStyle = $('<style>').attr('id','msg_hide_list_style').html(msgHideListStyleHtml);
	let head = $('head');
	let dynamic = $('#i_menu_msg_btn');
	head.append(msgStyle, msgHideListStyle);
	
	let enterFromI = false;
	dynamic.find('> .i-link').hover(function (){
		enterFromI = true;
		// console.log('i enter');
	}, function(){
		// console.log('i exit');
	});
	dynamic.hover(function (){
		if(enterFromI){
			msgStyle.remove();
			msgHideListStyle.remove();
		} else {
			msgHideListStyle.remove();
		}
		// console.log('enter');
	}, function(){
		if(enterFromI){
			head.append(msgStyle, msgHideListStyle);
			enterFromI = false;
		} else {
			msgHideListStyle.appendTo(head);
		}
		// console.log('exit');
	});
	$(window).load(function(){
		 var b = window.defaultDynObj;
         b.target.attr("loaded") || (b.initMenu(), b.init(), b.target.attr("loaded", 1));// 加载默认的视频动态

		 let li = dynamic.find('.dyn_menu > .menu > ul > li').mouseenter(function(){
			enterFromI || $(this).click();
			// console.log('click');
		});
	});
})();