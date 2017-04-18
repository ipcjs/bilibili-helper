// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      3.1.1
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效; 只支持bangumi.bilibili.com域名下的番剧视频;
// @author       ipcjs
// @require      https://static.hdslb.com/js/md5.js
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @run-at       document-start
// @grant        none
// ==/UserScript==

'use strict';
log('[' + GM_info.script.name + '] run on: ' + window.location.href);

var MODE_DEFAULT = 'default'; // 默认模式, 自动判断使用何种模式, 推荐;
var MODE_REPLACE = 'replace'; // 替换模式, 替换有区域限制的视频的接口的返回值; 因为替换的操作是同步的会卡一下界面, 但没有区域限制的视频不会受到影响;
var MODE_REDIRECT = 'redirect'; // 重定向模式, 直接重定向所有番剧视频的接口到代理服务器; 所有番剧视频都通过代理服务器获取视频地址, 如果代理服务器不稳定, 可能加载不出视频;

var settings = getCookies();
var biliplusHost = settings.balh_server; // 优先从cookie中读取服务器地址
var isBlockedVip = settings.balh_blocked_vip; // "我是一位被永久封号的大会员"(by Google翻译)
var mode = settings.balh_mode || (isBlockedVip ? MODE_REDIRECT : MODE_DEFAULT); // 若账号是被永封的大会员, 默认使用重定向模式
if (!biliplusHost) {
    biliplusHost = 'http://biliplus.ipcjsdev.tk'; // 我的反向代理服务器
    // biliplusHost = 'https://www.biliplus.com'; // 支持https的服务器
}

log('Mode:', mode, 'isBlockedVip:', isBlockedVip, 'server:', biliplusHost, 'readyState:', document.readyState);

var api = {
    syncAjax: function (one_api, originUrl) {
        var data;
        $.ajax({
            url: one_api.transUrl(originUrl),
            async: false,
            xhrFields: {withCredentials: true},
            success: function (result) {
                data = JSON.stringify(one_api.processSuccess(result));
                log('==>', data);
                // log('success', arguments, this);
            },
            error: function () {
                log('error', arguments, this);
            }
        });
        return data;
    },
    _get_source: {
        transUrl: function (url) {
            return biliplusHost + '/api/bangumi?season=' + window.season_id;
        },
        processSuccess: function (data) {
            var found = null;
            for (var i = 0; i < data.result.episodes.length; i++) {
                if (data.result.episodes[i].episode_id == window.episode_id) {
                    found = data.result.episodes[i];
                }
            }
            var returnVal = found !== null ? {
                "code": 0,
                "message": "success",
                "result": {
                    "aid": found.av_id,
                    "cid": found.danmaku,
                    "episode_status": isBlockedVip ? 2 : found.episode_status,
                    "payment": {"price": "100000000"},
                    "player": "vupload",
                    "pre_ad": 0,
                    "season_status": isBlockedVip ? 2 : data.result.season_status
                }
            } : {
                code: -404,
                message: '不存在该剧集'
            };
            return returnVal;
        }
    },
    _playurl: {
        transUrl: function (url) {
            return biliplusHost + '/BPplayurl.php?' + url.split('?')[1].replace(/(cid=\d+)/, '$1|' + (url.match(/module=(\w+)/) || ['', 'bangumi'])[1]);
        },
        processSuccess: function (data) {
            if (data.code === -403) {
                window.alert('当前使用的服务器(' + biliplusHost + ')依然有区域限制');
            } else if (data.code) {
                console.error(data);
            } else if (isAreaLimitForPlayUrl(data)) {
                console.error('>>aera limit');
                // if (window.confirm('试图获取视频地址失败, 请登录biliplus' +
                //         '\n注意: 只支持"使用bilibili账户密码进行登录"'
                //     )) {
                //     window.top.location = biliplusHost + '/login';
                // }
            }
            return data;
        }
    }
};

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

documentReady(function () {
    if (window.location.hostname === 'bangumi.bilibili.com') {
        checkLoginState();
    }
});

// 暴露接口
window.bangumi_aera_limit_hack = {
    setCookie: function (key, value, options) {
        return setCookie(key === 'bangumi_aera_limit_hack_server' ? 'balh_server' : key, value, options);
    },
    getCookie: function (key) {
        return getCookie(key === 'bangumi_aera_limit_hack_server' ? 'balh_server' : key);
    },
    login: showLogin,
    _clear_login_state: function () {
        delete localStorage.balh_notFirst;
        delete localStorage.balh_login;
        delete localStorage.balh_mainLogin;
        delete localStorage.oauthTime;
    }
};

////////////////接下来全是函数/////////////////

function injectDataFilter() {
    window.jQuery.ajaxSetup({
        dataFilter: jqueryDataFilter
    });
    if (mode === MODE_DEFAULT || mode === MODE_REDIRECT) { // 替换模式不需要修改ajax
        redirectAjax();
    }
}

function jqueryDataFilter(data, type) {
    var json, group;
    // log(arguments, this);
    if (this.url.startsWith(window.location.protocol + '//bangumi.bilibili.com/web_api/get_source')) {
        // 获取cid API
        log(data);
        json = JSON.parse(data);
        if (json.code === -40301 // 区域限制
            || json.result.pay_user && isBlockedVip) { // 需要付费的视频, 此时B站返回的cid是错了, 故需要使用biliplus的接口
            data = api.syncAjax(api._get_source, this.url) || data;
            mode === MODE_DEFAULT && setAreaLimitSeason(true); // 只要默认模式才要跟踪是否有区域限制
        } else {
            mode === MODE_DEFAULT && setAreaLimitSeason(false);
            if (isBlockedVip && json.code === 0 && json.result.pre_ad) {
                json.result.pre_ad = 0; // 去除前置广告
                data = JSON.stringify(json);
            }
        }
    } else if (this.url.startsWith('https://bangumi.bilibili.com/player/web_api/playurl')) {
        // 获取视频地址 API
        log(data);
        json = JSON.parse(data);
        if (isBlockedVip || isAreaLimitForPlayUrl(json)) {
            data = api.syncAjax(api._playurl, this.url) || data;
            mode === MODE_DEFAULT && setAreaLimitSeason(true);
        } else {
            mode === MODE_DEFAULT && setAreaLimitSeason(false);
        }
    } else if (this.url.startsWith(window.location.protocol + '//bangumi.bilibili.com/web_api/season_area')) {
        // 番剧页面是否要隐藏番剧列表 API
        log(data);
        json = JSON.parse(data);
        // 限制区域时的data为:
        // {"code":0,"message":"success","result":{"play":0}}
        if (json.code === 0 && json.result && json.result.play === 0) {
            mode === MODE_DEFAULT && setAreaLimitSeason(true);
            json.result.play = 1; // 改成1就能够显示
            data = JSON.stringify(json);
            log('==>', data);
        } else {
            mode === MODE_DEFAULT && setAreaLimitSeason(false);
        }
    }
    return data;
}

/*
 {"code":0,"message":"success","result":{"aid":9854952,"cid":16292628,"episode_status":2,"payment":{"price":"0"},"player":"vupload","pre_ad":0,"season_status":2}}
 */
function redirectAjax() {
    var originalAjax = $.ajax;
    $.ajax = function (param) {
        if (param.url.match('/web_api/get_source') && (mode === MODE_REDIRECT || isAreaLimitSeason())) { // 重定向模式不需要判断是否有区域限制
            param.url = api._get_source.transUrl(param.url);
            param.type = 'GET';
            delete param.data;
            var oriSuccess = param.success;
            param.success = function (data) {
                var returnVal = api._get_source.processSuccess(data);
                log('Redirected request: get_source', returnVal);
                oriSuccess(returnVal);
            };
            return originalAjax.apply(this, [param])
        } else if (param.url.match('/player/web_api/playurl') && (mode === MODE_REDIRECT || isAreaLimitSeason())) {
            var oriSuccess = param.success;
            param.url = api._playurl.transUrl(param.url);
            param.success = function (data) {
                oriSuccess(api._playurl.processSuccess(data));
            };
            log('Redirected request: bangumi playurl -> ', param.url);
            return originalAjax.apply(this, [param]);
        } else {
            return originalAjax.apply(this, arguments);
        }
    }
}

function isAreaLimitSeason() {
    return getCookie('balh_season_' + getSeasonId());
}
function setAreaLimitSeason(limit) {
    var season_id = getSeasonId();
    setCookie('balh_season_' + season_id, limit ? '1' : undefined, ''); // 第三个参数为'', 表示时Session类型的cookie
    log('setAreaLimitSeason', season_id, limit);
}

function getSeasonId() {
    try {
        return window.season_id || window.top.season_id;
    } catch (e) {
        console.error(e);
        return (window.top.location.pathname.match(/\/anime\/(\d+)/) || ['', '000'])[1];
    }
}

function isAreaLimitForPlayUrl(json) {
    return json.durl && json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627;
}

function getParam(url, key) {
    return (url.match(new RegExp('[?|&]' + key + '=(\\w+)')) || ['', ''])[1];
}

function getCookies() {
    var map = document.cookie.split('; ').reduce(function (obj, item) {
        var entry = item.split('=');
        obj[entry[0]] = entry[1];
        return obj;
    }, {});
    return map;
}

function getCookie(key) {
    return getCookies()[key];
}
// document.cookie=`bangumi_aera_limit_hack_server=https://www.biliplus.com; domain=.bilibili.com; path=/; expires=${new Date("2020-01-01").toUTCString()}`;

/**
 * @key     key
 * @value   为undefined时, 表示删除cookie
 * @options 为undefined时, 表示过期时间为3年
 *          为''时, 表示Session cookie
 *          为数字时, 表示指定过期时间
 *          为{}时, 表示指定所有的属性
 * */
function setCookie(key, value, options) {
    if (typeof options !== 'object') {
        options = {
            domain: '.bilibili.com',
            path: '/',
            'max-age': value === undefined ? 0 : (options === undefined ? 94608000 : options)
        };
    }
    var c = Object.keys(options).reduce(function (str, key) {
        return str + '; ' + key + '=' + options[key];
    }, key + '=' + value);
    document.cookie = c;
    return c;
}

function showLogin() {
    if (!document.getElementById('balh-style-login')) {
        var style = document.createElement('style');
        style.id = 'balh-style-login';
        document.head.appendChild(style).innerHTML = '@keyframes pop-iframe-in{0%{opacity:0;transform:scale(.7);}100%{opacity:1;transform:scale(1)}}@keyframes pop-iframe-out{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(.7)}}.GMBiliPlusCloseBox{position:absolute;top:5%;right:8%;font-size:40px;color:#FFF}';
    }

    var loginUrl = biliplusHost + '/login',
        iframeSrc = 'https://passport.bilibili.com/login?appkey=27eb53fc9058f8c3&api=' + encodeURIComponent(loginUrl) + '&sign=' + hex_md5('api=' + loginUrl + 'c2ed53a74eeefe3cf99fbd01d8c9c375');

    var div = document.createElement('div');
    div.id = 'GMBiliPlusLoginContainer';
    div.innerHTML = '<div style="position:fixed;top:0;left:0;z-index:10000;width:100%;height:100%;background:rgba(0,0,0,.5);animation-fill-mode:forwards;animation-name:pop-iframe-in;animation-duration:.5s;cursor:pointer"><iframe src="' + iframeSrc + '" style="background:#e4e7ee;position:absolute;top:10%;left:10%;width:80%;height:80%"></iframe><div class="GMBiliPlusCloseBox">×</div></div>';
    div.firstChild.addEventListener('click', function (e) {
        if (e.target === this || e.target.className === 'GMBiliPlusCloseBox') {
            if (!confirm('确认关闭？')) {
                return false;
            }
            div.firstChild.style.animationName = 'pop-iframe-out';
            setTimeout(function () {
                div.remove();
                window.location.reload();
            }, 5e2);
        }
    });
    document.body.appendChild(div);
    delete localStorage.balh_login;
}

// 逻辑有点乱, 当前在如下情况才会弹一次登录提示框:
// 1. 第一次使用
// 2. 主站+服务器都退出登录后, 再重新登录主站
function checkLoginState() {
    if (getCookie("DedeUserID") === undefined) {
        //未登录主站，强制指定值
        localStorage.balh_notFirst = 1;
        localStorage.balh_login = 0;
        localStorage.balh_mainLogin = 0
    } else if (localStorage.balh_mainLogin !== undefined) {
        //主站未登录变为登录，重置显示弹窗
        delete localStorage.balh_notFirst;
        delete localStorage.balh_login;
        delete localStorage.balh_mainLogin;
        delete localStorage.oauthTime;
    }
    if (!localStorage.balh_notFirst) {
        //第一次打开，确认是否已登陆；未登录显示确认弹窗
        localStorage.balh_notFirst = 1;
        checkExpiretime(function () {
            if (localStorage.oauthTime === undefined) {
                localStorage.balh_login = 0;
                if (confirm('看起来你是第一次使用解除区域限制\n要不要考虑进行一下授权？\n\n授权后可以观看1080P（如果你是大会员或承包过的话）\n\n你可以随时通过执行 bangumi_aera_limit_hack.login() 来打开授权页面')) {
                    showLogin();
                }
            } else {
                localStorage.balh_login = 1;
            }
        });
    } else if (localStorage.balh_login === undefined) {
        //非第一次打开，登录状态被重置，重新检测
        checkExpiretime(function () {
            localStorage.balh_login = (localStorage.oauthTime === undefined) ? 0 : 1
        });
    } else if (localStorage.balh_login == 1 && Date.now() - parseInt(localStorage.oauthTime) > 24 * 60 * 60 * 1000) {
        //已登录，每天为周期检测key有效期，过期前五天会自动续期
        checkExpiretime();
    }

    function checkExpiretime(loadCallback) {
        var script = document.createElement('script');
        script.src = biliplusHost + '/login?act=expiretime';
        loadCallback && script.addEventListener('load', loadCallback);
        document.head.appendChild(script);
    }
}

// document载入完成后回调, 相当于$(cb);
function documentReady(cb) {
    if (document.readyState !== 'loading') {
        return setTimeout(cb, 1);
    }
    var cbWrapper = function () {
        document.removeEventListener('DOMContentLoaded', cbWrapper);
        cb();
    };
    document.addEventListener('DOMContentLoaded', cbWrapper);
}

function log() {
    console.log.apply(console, arguments);
}

