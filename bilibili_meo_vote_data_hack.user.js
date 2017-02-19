// ==UserScript==
// @name         B萌无需投票查看数据
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  不投票就可以查看数据
// @author       ipcjs
// @match        *://bangumi.bilibili.com/moe/*/schedule/*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    // console.log(window.jQuery);
    window.jQuery.ajaxSetup({
        dataFilter: function (data, type) {
            var r;
            // console.log(arguments, this);
            if (this.url.startsWith('http://bangumi.bilibili.com/moe/2016/2/api/vote/my_vote')) {
                r = JSON.parse(data);
                if (!r.result) {
                    data = '{"code": 0, "message": "success", "result": [{"group_id": 74, "list": [' +
                        '{"character": {"area": 2, "character_id": 1238, "chn_name": "七海小天使", "cover": "http://i0.hdslb.com/bfs/bangumi/c5a6d4f355c2fe075f7b30da2dd674e03446d9c6.jpg", "sex": 1, "video_num": 1 }, "type": 0 } ' +
                        '], "name": "女性角色", "sex": 1 }, {"group_id": 73, "list": [' +
                        '{"character": {"area": 2, "character_id": 1598, "chn_name": "自动填充的模拟数据", "cover": "http://i0.hdslb.com/bfs/bangumi/4d560515743139837d569b86ff9f8f5bdd526002.jpg", "sex": 0, "video_num": 4 }, "type": 0 } ' +
                        '], "name": "男性角色", "sex": 0 } ] }';
                }
            }
            return data;
        }
    });
})();