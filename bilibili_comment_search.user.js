// ==UserScript==
// @name         Bilibili评论定位
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  点击消息中心的评论后, 自动定位评论; (B站评论系统改版中, 当前在番剧页面无效, B萌界面还是有效的)
// @author       ipcjs
// @include      http://*.bilibili.com/*?*aid=*
// @include      http://message.bilibili.com/
// @exclude      http://www.bilibili.com/html/html5player.html*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';
    function jumpToComment() {
        var id, type, feedback, group, title = '[' + GM_info.script.name + ']';
        if (unsafeWindow.aid) {
            id = unsafeWindow.aid;
            type = "arc";
        } else if (unsafeWindow.tp_id) {
            id = unsafeWindow.tp_id;
            type = "topic";
        } else if (group = unsafeWindow.location.href.match(/aid=(\d+)/)) {
            // 试图从url中提取id
            id = group[1];
            type = 'arc';
        }
        if (id && unsafeWindow.bbFeedback) {
            console.log(title, 'search...');
            $('#comment .comm').children().remove(); // 移除评论区域..., 让bbFeedback重新生成
            feedback = new unsafeWindow.bbFeedback(".comm", type, {autoLoad: true});
            $("#load_comment").off("click").removeAttr("onclick").on("click", function () {
                feedback.show(id, 1)
            });
            var replyId,
                callback = function (context) {
                    var replyElement = $("#l_id_" + replyId, context);
                    if (replyElement.length !== 0) {
                        setTimeout(function () {
                            $(document).scrollTop(replyElement.offset().top - 20)
                        }, 0);
                        if (replyElement.parents(".reply").length) {
                            $(".re_ta", replyElement).click();
                        } else {
                            $(".huifu", replyElement).click()
                        }
                    }
                };
            if (group = unsafeWindow.location.href.match(/#fb,([0-9]+),([0-9]+),([0-9]+),(.+)$/)) {
                replyId = group[3];
                feedback.show(id, 1, replyId, callback);
            } else if (group = unsafeWindow.location.href.match(/#reply([0-9]+)$/)) {
                replyId = group[1];
                feedback.show(id, 1, replyId, callback);
            } else {
                feedback.show(id, 1);
            }
        } else {
            console.log(title, '当前页不可用:', unsafeWindow.location.href);
        }
    }

    if (document.readyState === 'complete') {
        jumpToComment();
    } else {
        $(unsafeWindow).load(jumpToComment); // 页面完全加载完成后在再触发
    }
})();