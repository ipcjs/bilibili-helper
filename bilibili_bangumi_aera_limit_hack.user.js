// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  把获取视频地址相关接口的返回值替换成biliplus的接口的返回值, 因为替换值的操作是同步的, 所有会卡几下..., 又因为biliplus的接口不支持跨域请求, 所以使用了我自己的服务器做反向代理(-_-#); 源码仓库: https://github.com/ipcjs/bilibili-helper/tree/user.js
// @author       ipcjs
// @include      http://bangumi.bilibili.com/anime/*
// @include      http://bangumi.bilibili.com/anime/v/*
// @include      http://www.bilibili.com/html/html5player.html*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      biliplus.com
// @connect      biliplus.ipcjsdev.tk
// ==/UserScript==

(function () {
    'use strict';
    var biliplusHost = 'http://biliplus.ipcjsdev.tk';
    // var biliplusHost = 'https://www.biliplus.com';
    console.log('[' + GM_info.script.name + '] run on: ' + unsafeWindow.location.href);
    if (!unsafeWindow.jQuery) { // 若还未加载jQuery, 则监听
        var jQuery;
        Object.defineProperty(unsafeWindow, 'jQuery', {
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

    function injectDataFilter() {
        unsafeWindow.jQuery.ajaxSetup({
            dataFilter: function (data, type) {
                var json, obj, group;
                // console.log(arguments, this);
                if (this.url.startsWith('http://bangumi.bilibili.com/web_api/get_source')) {
                    // 获取cid API
                    console.log(data);
                    json = JSON.parse(data);
                    if (json.code === -40301) {
                        $.ajax({
                            url: biliplusHost + '/api/view?id=' + unsafeWindow.aid,
                            async: false,
                            success: function (result) {
                                obj = {
                                    code: 0, message: 'success', result: {
                                        episode_status: 2,
                                        pre_ad: 0,
                                        season_status: 2
                                    }
                                };
                                obj.result.aid = result.id;
                                obj.result.cid = result.list[0].cid;
                                obj.result.player = result.list[0].type;
                                obj.result.vid = result.list[0].vid;
                                data = JSON.stringify(obj);
                                console.log('==>', data);
                                // console.log('success', arguments, this);
                            },
                            error: function () {
                                console.log('error', arguments, this);
                            }
                        });
                    }
                } else if (this.url.startsWith('https://bangumi.bilibili.com/player/web_api/playurl')) {
                    // 获取视频地址 API
                    console.log(data);
                    json = JSON.parse(data);
                    if (json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627) {
                        group = unsafeWindow.location.href.match(/cid=(\d+)/);
                        $.ajax({
                            // url: biliplusHost+'/BPplayurl.php?cid=' + group[1] +'|bangumi&player=1&ts=' + parseInt(new Date().getTime() / 1000),
                            url: biliplusHost + '/BPplayurl.php?cid=' + group[1] + '|bangumi',
                            async: false,
                            xhrFields: {withCredentials: true},
                            success: function (result) {
                                // console.log('success', arguments, this);
                                obj = xml2obj(result.documentElement);
                                obj.accept_quality && (obj.accept_quality = obj.accept_quality.split(',').map(function (item) {
                                    return Number(item);
                                }));
                                if (!obj.durl.push) {
                                    obj.durl = [obj.durl];
                                }
                                obj.durl.forEach(function (item) {
                                    if (item.backup_url === '') {
                                        item.backup_url = undefined;
                                    } else if (item.backup_url && item.backup_url.url) {
                                        item.backup_url = item.backup_url.url;
                                    }
                                });
                                if (obj.durl.length === 1 && obj.durl[0].length == 15126 && obj.durl[0].size === 124627) {
                                    if (confirm('试图解除区域限制失败, 请登录biliplus' +
                                            '\n注意: 只支持"使用bilibili账户密码进行登录"'
                                        )) {
                                        unsafeWindow.top.location = biliplusHost + '/login';
                                    }
                                } else {
                                    data = JSON.stringify(obj);
                                    console.log('==>', data);
                                }
                            },
                            error: function () {
                                console.log('error', arguments, this);
                            }
                        });
                    }
                } else if (this.url.startsWith('http://bangumi.bilibili.com/web_api/season_area')) {
                    // 番剧页面是否要隐藏番剧列表 API
                    console.log(data);
                    json = JSON.parse(data);
                    // 限制区域时的data为:
                    // {"code":0,"message":"success","result":{"play":0}}
                    if (json.code === 0 && json.result && json.result.play === 0) {
                        json.result.play = 1; // 改成1就能够显示
                        data = JSON.stringify(json);
                        console.log('==>', data);
                    }
                }
                return data;
            }
        });
    }

    function xml2obj(xml) {
        try {
            var obj = {}, text;
            var children = xml.children;
            if (children.length > 0) {
                for (var i = 0; i < children.length; i++) {
                    var item = children.item(i);
                    var nodeName = item.nodeName;

                    if (typeof (obj[nodeName]) == "undefined") { // 若是新的属性, 则往obj中添加
                        obj[nodeName] = xml2obj(item);
                    } else {
                        if (typeof (obj[nodeName].push) == "undefined") { // 若老的属性没有push方法, 则把属性改成Array
                            var old = obj[nodeName];

                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(xml2obj(item));
                    }
                }
            } else {
                text = xml.textContent;
                if (/^\d+(\.\d+)?$/.test(text)) {
                    obj = Number(text);
                } else if (text === 'true' || text === 'false') {
                    obj = Boolean(text);
                } else {
                    obj = text;
                }
            }
            return obj;
        } catch (e) {
            console.log(e.message);
        }
    }
})();