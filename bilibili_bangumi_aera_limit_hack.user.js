// ==UserScript==
// @name         解除B站番剧页限制
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  仅仅是做到显示番剧列表而已
// @author       ipcjs
// @include      /^http:\/\/bangumi\.bilibili\.com\/anime\/\d+/?$/
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    function injectDataFilter() {
        // console.log(window.jQuery, document.readyState);
        window.jQuery.ajaxSetup({
            dataFilter: function (data, type) {
                var json;
                // console.log(arguments, this);
                if (this.url.startsWith('http://bangumi.bilibili.com/web_api/season_area')) {
                    json = JSON.parse(data);
                    // 限制区域时的data为:
                    // {"code":0,"message":"success","result":{"play":0}}
                    if (json.code === 0 && json.result && json.result.play === 0) {
                        json.result.play = 1; // 改成1就能够显示
                        data = JSON.stringify(json);
                        console.log(data);
                    }
                }
                return data;
            }
        });
    }

    if (!window.jQuery) { // 若还未加载jQuery, 则监听
        var jQuery;
        Object.defineProperty(window, 'jQuery', {
            configurable: true, enumerable: true, set: function (v) {
                jQuery = v;
                injectDataFilter();// 设置jQuery后, 立即注入
            }, get: function () {
                return jQuery;
            }
        });
    } else {
        injectDataFilter();
    }
})();