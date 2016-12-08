// 在匿名函数中执行代码, 防止污染全局变量
(function () {
    'use strict';
    console.log('hello world');
    var id, type, feedback, group;
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
    if (id) {
        $('#comment .comm').children().remove(); // 移除评论区域..., 让bbFeedback重新生成
        feedback = new bbFeedback(".comm", type, {autoLoad: true});
        $("#load_comment").off("click").removeAttr("onclick").on("click", function () {
            feedback.show(id, 1)
        });
        var replyId,
            callback = function (context) {
                var replyElement = $("#l_id_" + replyId, context);
                if (replyElement.length != 0) {
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
    }
})();
