// ==UserScript==
// @name         B站主页动态提醒直接显示在顶栏
// @namespace    http://tampermonkey.net/
// @version      0.7.3
// @description  可以直接看到当前的提醒的类型, 省去鼠标移过去的麻烦...
// @author       ipcjs
// @include      *://www.bilibili.com/
// @include      *://www.bilibili.com/index.html
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    function log(...args) {
        // console.log(...args);
    }
    let msgStyleHtml = `
#dyn_wnd {
    display: block!important;
    opacity: 1!important;
    background-color: transparent;
    
    left:-470px!important;
    top: -10px!important;
    z-index: -10000;
    
    box-shadow: none;
    border: none;
}
#dyn_wnd > .dyn_menu > .menu > .line {
    left: 5px;
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
    let msgStyle = $('<style>').attr('id', 'msg_style').html(msgStyleHtml);
    let msgHideListStyle = $('<style>').attr('id', 'msg_hide_list_style').html(msgHideListStyleHtml);
    let head = $('head');
    let dynamic = $('#i_menu_msg_btn');
    head.append(msgStyle, msgHideListStyle);

    let enterFromI = false, showMsgListTimeoutId;
    dynamic.find('> .i-link').hover(function () {
        enterFromI = true;
        log('i enter');
    }, function () {
        log('i exit');
    });
    dynamic.hover(function () {
        if (enterFromI) {
            msgStyle.remove();
            msgHideListStyle.remove();
        } else {
            showMsgListTimeoutId = setTimeout(msgHideListStyle.remove.bind(msgHideListStyle), 300); // 使用bind, 绑定this
            // msgHideListStyle.remove();
        }
        log('enter');
    }, function () {
        if (enterFromI) {
            head.append(msgStyle, msgHideListStyle);
            enterFromI = false;
        } else {
            clearTimeout(showMsgListTimeoutId);
            msgHideListStyle.appendTo(head);
        }
        log('exit');
    });

    function hoverToPopupMsg() {
        function autoClick() {
            if (!enterFromI) {
                $(this).click();
                if ($(this).attr('mode') === window.defaultDynObj.params.type) {
                    var b = window.defaultDynObj;
                    b.target.attr("loaded") || (b.initMenu(), b.init(), b.target.attr("loaded", 1));// 加载默认的视频动态
                }
            }
            log('click');
        }

        let timeoutId;
        dynamic.find('.dyn_menu > .menu > ul > li').mouseenter(function () {
            timeoutId = setTimeout(autoClick.bind(this), 100);
        }).mouseleave(function () {
            clearTimeout(timeoutId);
        });
    }

    function delayMouseover(selector, namespace) {
        let frameItems = $(selector);
        console.log(frameItems);
        frameItems.each(function () {
            let item = $(this);
            let mouseoverEvents = item.getEvents().mouseover;
            if (!mouseoverEvents) return; // 可能没有mouseover事件
            for (let event of mouseoverEvents) {
                if (event.handler && event.namespace === namespace) { // 命名空间为空的事件, 对应弹出详细内容的事件
                    let timeoutId;
                    item.off('mouseenter', event.handler); // 先移除该事件
                    log(item, event);
                    item.mouseenter(function () {
                        timeoutId = setTimeout(event.handler.bind(this), 300); // 重新添加延迟执行的事件
                    }).mouseleave(function () {
                        clearTimeout(timeoutId);
                    });
                    break;
                }
            }
        });
    }

    $(window).load(function () {
        jQuery.fn.getEvents = function () {
            if (typeof (jQuery._data) == 'function') {
                return jQuery._data(this.get(0), 'events') || {};
            } else if (typeof (this.data) == 'function') { // jQuery version < 1.7.?
                return this.data('events') || {};
            }
            return {};
        };
        delayMouseover('.z_top .z_top_nav [hasframe]', ''); // 使顶栏的中的"游戏中心"/"直播"等条目的详细内容的窗口延时弹出
        delayMouseover('#i_menu_become_vip', ''); // 使"我的大会员"延时弹出
        hoverToPopupMsg();
    });
})();