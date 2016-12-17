// ==UserScript==
// @name         Bilibili评论定位
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  点击消息中心的评论后, 自动定位评论
// @author       ipcjs
// @match        http://*.bilibili.com/*?*aid=*
// @exclude      http://www.bilibili.com/html/html5player.html*
// @grant        none
// ==/UserScript==

/**
* 文档注释会被自动读取？
*/

(function () {
    'use strict';
    function jumpToComment() {
        var id, type, feedback, group, title = '[' + GM_info.script.name + ']';
        if (window.aid) {
            id = window.aid;
            type = "arc";
        } else if (window.tp_id) {
            id = window.tp_id;
            type = "topic";
        } else if (group = window.location.href.match(/aid=(\d+)/)) {
            // 试图从url中提取id
            id = group[1];
            type = 'arc';
        }
        if (id && window.bbFeedback) {
            console.log(title, 'search...');
            $('#comment .comm').children().remove(); // 移除评论区域..., 让bbFeedback重新生成
            feedback = new window.bbFeedback(".comm", type, {autoLoad: true});
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
            if (group = window.location.href.match(/#fb,([0-9]+),([0-9]+),([0-9]+),(.+)$/)) {
                replyId = group[3];
                feedback.show(id, 1, replyId, callback);
            } else if (group = window.location.href.match(/#reply([0-9]+)$/)) {
                replyId = group[1];
                feedback.show(id, 1, replyId, callback);
            } else {
                feedback.show(id, 1);
            }
        } else {
            console.log(title, '当前页不可用:', window.location.href);
        }
    }

    if (document.readyState === 'complete') {
        jumpToComment();
    } else {
        $(window).load(jumpToComment); // 页面完全加载完成后在再触发
    }
})();