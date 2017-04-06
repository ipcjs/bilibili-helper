// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @description  把获取视频地址相关接口的返回值替换成我的反向代理服务器的返回值; 因为替换值的操作是同步的, 所有会卡几下..., 普通视频不受影响; 我的服务器有点渣, 没获取成功请多刷新几下; 当前只支持bangumi.bilibili.com域名下的番剧视频;
// @author       ipcjs
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/anime/v/*
// @include      *://www.bilibili.com/html/html5player.html*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * 把获取视频地址相关接口的返回值替换成biliplus的接口的返回值,
 * 因为替换值的操作是同步的, 所有会卡几下..., 又因为biliplus的接口不支持跨域请求, 所以使用了我自己的服务器做反向代理(-_-#);
 * 源码仓库: https://github.com/ipcjs/bilibili-helper/tree/user.js
 */

(function () {
    'use strict';
    var biliplusHost = getCookie('bangumi_aera_limit_hack_server'); // 优先从cookie中读取服务器地址
    var i_am_a_big_member_who_is_permanently_banned = getCookie('bangumi_aera_limit_hack_blocked_forever'); // "我是一位被永久封号的大会员"(by Google翻译)
    if (!biliplusHost) {
        biliplusHost = 'http://biliplus.ipcjsdev.tk'; // 我的反向代理服务器
        // biliplusHost = 'https://www.biliplus.com'; // 支持https的服务器
    }

    console.log('[' + GM_info.script.name + '] run on: ' + window.location.href);
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

    function injectDataFilter() {
        window.jQuery.ajaxSetup({
            dataFilter: function (data, type) {
                var json, obj, group, params, curIndex, aid;
                // console.log(arguments, this);
                if (this.url.startsWith(window.location.protocol + '//bangumi.bilibili.com/web_api/get_source')) {
                    // 获取cid API
                    console.log(data);
                    json = JSON.parse(data);
                    if (json.code === -40301) {
                        $.ajax({
                            url: '/web_api/episode/' + window.episode_id + '.json', // 查询episode_id对应的实际av号和index
                            async: false,
                            xhrFields: { withCredentials: true },
                            success: function (info) {
                                var episode = info.result.currentEpisode;
                                // console.log(window.episode_id, '=>', episode.avId, episode.index, episode.page);
                                aid = episode.avId;
                                curIndex = parseInt(episode.page) - 1;
                            },
                            error: function () {
                                console.log('error', arguments, this);
                            }
                        });
                        $.ajax({
                            url: biliplusHost + '/api/view?id=' + aid,
                            async: false,
                            xhrFields: { withCredentials: true },
                            success: function (result) {
                                obj = {
                                    code: 0, message: 'success', result: {
                                        episode_status: 2,
                                        pre_ad: 0,
                                        season_status: 2
                                    }
                                };
                                obj.result.aid = result.id;
                                console.log('curIndex:', curIndex);
                                if (curIndex >= result.list.length) {
                                    curIndex = result.list.length - 1;
                                    console.warn('reset curIndex to:', curIndex);
                                } else if (curIndex < 0) {
                                    curIndex = 0;
                                    console.warn('reset curIndex to:', curIndex);
                                }
                                obj.result.cid = result.list[curIndex].cid;
                                obj.result.player = result.list[curIndex].type;
                                obj.result.vid = result.list[curIndex].vid;
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
                    if (json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627 || i_am_a_big_member_who_is_permanently_banned) {
                        // https://bangumi.bilibili.com/player/web_api/playurl?cid=10482695&appkey=84956560bc028eb7&otype=json&type=flv&quality=4&module=bangumi&sign=f77367cf031933161a5b6ff8c29a011e
                        // https://biliplus.com/BPplayurl.php?cid=10482695|bangumi&player=1&ts=12345678
                        // ==> http://biliplus.ipcjsdev.tk/BPplayurl.php?cid=10482695|bangumi&otype=json&type=flv&quality=4
                        params = {
                            cid: getParam(this.url, 'cid') + '|bangumi',
                            otype: getParam(this.url, 'otype'),
                            type: getParam(this.url, 'type'),
                            quality: getParam(this.url, 'quality')
                        };
                        $.ajax({
                            url: biliplusHost + '/BPplayurl.php?' + Object.keys(params).map(function (key) {
                                return key + '=' + params[key];
                            }).join('&'),
                            async: false,
                            xhrFields: { withCredentials: true },
                            success: function (result) {
                                // console.log('success', arguments, this);
                                obj = result;
                                if (obj.code === -403) {
                                    window.alert('当前使用的服务器(' + biliplusHost + ')依然有区域限制');
                                } else if (obj.durl.length === 1 && obj.durl[0].length == 15126 && obj.durl[0].size === 124627) {
                                    if (window.confirm('试图获取视频地址失败, 请登录biliplus' +
                                        '\n注意: 只支持"使用bilibili账户密码进行登录"'
                                    )) {
                                        window.top.location = biliplusHost + '/login';
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
                } else if (this.url.startsWith(window.location.protocol + '//bangumi.bilibili.com/web_api/season_area')) {
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

    function getParam(url, key) {
        return (url.match(new RegExp('[?|&]' + key + '=(\\w+)')) || ['', ''])[1];
    }
    function getCookie(key) {
        var map = document.cookie.split('; ').reduce(function (obj, item) {
            var entry = item.split('=');
            obj[entry[0]] = entry[1];
            return obj;
        }, {});
        return map[key];
    }
    // document.cookie=`bangumi_aera_limit_hack_server=https://www.biliplus.com; domain=.bilibili.com; path=/; expires=${new Date("2020-01-01").toUTCString()}`;
    function setCookie(key, value, options) {
        options || (options = { domain: '.bilibili.com', path: '/', expires: new Date('2020-01-01').toUTCString() });
        var c = Object.keys(options).reduce(function (str, key) {
            return str + '; ' + key + '=' + options[key];
        }, key + '=' + value);
        document.cookie = c;
        return c;
    }
    window.bangumi_aera_limit_hack = {
        setCookie: setCookie,
        getCookie: getCookie
    };
})();