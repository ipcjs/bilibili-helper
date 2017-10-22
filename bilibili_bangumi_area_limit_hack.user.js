// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      5.6.1
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效; 只支持番剧视频;
// @author       ipcjs
// @require      https://static.hdslb.com/js/md5.js
// @include      *://www.bilibili.com/video/av*
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/movie/*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @include      *://www.bilibili.com/blackboard/html5playerbeta.html*
// @run-at       document-start
// @grant        none
// ==/UserScript==

'use strict';
var log = window.console.log.bind(window.console); // console.log简写为log

log('[' + GM_info.script.name + '] run on: ' + window.location.href);

var MODE_DEFAULT = 'default'; // 默认模式, 自动判断使用何种模式, 推荐;
var MODE_REPLACE = 'replace'; // 替换模式, 替换有区域限制的视频的接口的返回值; 因为替换的操作是同步的会卡一下界面, 但没有区域限制的视频不会受到影响;
var MODE_REDIRECT = 'redirect'; // 重定向模式, 直接重定向所有番剧视频的接口到代理服务器; 所有番剧视频都通过代理服务器获取视频地址, 如果代理服务器不稳定, 可能加载不出视频;

var settings = getCookies();
var proxyServer = settings.balh_server || 'https://biliplus.ipcjsdev.tk'; // 优先从cookie中读取服务器地址
var isBlockedVip = settings.balh_blocked_vip; // "我是一位被永久封号的大会员"(by Google翻译)
var mode = settings.balh_mode || (isBlockedVip ? MODE_REDIRECT : MODE_DEFAULT); // 若账号是被永封的大会员, 默认使用重定向模式
// movie页面使用window.aid, 保存当前页面av号
// anime页面使用window.season_id, 保存当前页面season号
var isMoviePage = window.location.href.indexOf('bangumi.bilibili.com/movie/') !== -1;

log('Mode:', mode, 'isBlockedVip:', isBlockedVip, 'server:', proxyServer, 'readyState:', document.readyState);

var bilibiliApis = (function () {
    function BilibiliApi(props) {
        Object.assign(this, props);
    }

    BilibiliApi.prototype.asyncAjaxByProxy = function (originUrl, success, error) {
        var one_api = this;
        $.ajax({
            url: one_api.transToProxyUrl(originUrl),
            async: true,
            xhrFields: { withCredentials: true },
            success: function (result) {
                log('==>', result);
                success(one_api.processProxySuccess(result));
                // log('success', arguments, this);
            },
            error: function (e) {
                log('error', arguments, this);
                error(e);
            }
        });
    };
    var get_source_by_aid = new BilibiliApi({
        transToProxyUrl: function (url) {
            return proxyServer + '/api/view?id=' + window.aid + '&update=true';
        },
        processProxySuccess: function (data) {
            if (data && data.list && data.list[0] && data.movie) {
                return {
                    code: 0,
                    message: 'success',
                    result: {
                        cid: data.list[0].cid,
                        formal_aid: data.aid,
                        movie_status: isBlockedVip ? 2 : data.movie.movie_status, // 2, 大概是免费的意思?
                        pay_begin_time: 1507708800,
                        pay_timestamp: 0,
                        pay_user_status: data.movie.pay_user.status, // 一般都是0
                        player: data.list[0].type, // 一般为movie
                        vid: data.list[0].vid,
                        vip: { // 2+1, 表示年度大会员; 0+0, 表示普通会员
                            vipType: isBlockedVip ? 2 : 0,
                            vipStatus: isBlockedVip ? 1 : 0,
                        }
                    }
                };
            } else {
                return {
                    code: -404,
                    message: '不存在该剧集'
                };
            }
        }
    });
    var get_source_by_season_id = new BilibiliApi({
        transToProxyUrl: function (url) {
            return proxyServer + '/api/bangumi?season=' + window.season_id;
        },
        processProxySuccess: function (data) {
            var found = null;
            if (!data.code) {
                for (var i = 0; i < data.result.episodes.length; i++) {
                    if (data.result.episodes[i].episode_id == window.episode_id) {
                        found = data.result.episodes[i];
                    }
                }
            } else {
                notify.showNotification(Date.now(), GM_info.script.name, '代理服务器错误:' + JSON.stringify(data) + '\n点击刷新界面.', '//bangumi.bilibili.com/favicon.ico', 3e3, window.location.reload.bind(window.location));
            }
            var returnVal = found !== null ? {
                "code": 0,
                "message": "success",
                "result": {
                    "aid": found.av_id,
                    "cid": found.danmaku,
                    "episode_status": isBlockedVip ? 2 : found.episode_status,
                    "payment": { "price": "9876547210.33" },
                    "pay_user": {
                        "status": isBlockedVip ? 1 : 0 // 是否已经支付过
                    },
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
    });

    return {
        _get_source: isMoviePage ? get_source_by_aid : get_source_by_season_id,
        _playurl: new BilibiliApi({
            transToProxyUrl: function (url) {
                return proxyServer + '/BPplayurl.php?' + url.split('?')[1].replace(/(cid=\d+)/, '$1|' + (url.match(/module=(\w+)/) || ['', 'bangumi'])[1]);
            },
            processProxySuccess: function (data) {
                // data有可能为null
                if (data && data.code === -403) {
                    // window.alert('当前使用的服务器(' + proxyServer + ')依然有区域限制');
                    showNotification(Date.now(), GM_info.script.name, '突破黑洞失败，我们未能穿透敌人的盔甲\n当前代理服务器（' + proxyServer + '）依然有区域限制Σ( ￣□￣||)', '//bangumi.bilibili.com/favicon.ico', 3e3);
                } else if (data === null || data.code) {
                    console.error(data);
                    showNotification(Date.now(), GM_info.script.name, '突破黑洞失败\n' + JSON.stringify(data) + '\n点击刷新界面', '//bangumi.bilibili.com/favicon.ico', 3e3, window.location.reload.bind(window.location));
                } else if (isAreaLimitForPlayUrl(data)) {
                    console.error('>>area limit');
                    showNotification(Date.now(), GM_info.script.name, '突破黑洞失败，需要登录\n点此进行登录', '//bangumi.bilibili.com/favicon.ico', 3e3, showLogin);
                    // if (window.confirm('试图获取视频地址失败, 请登录代理服务器' +
                    //         '\n注意: 只支持"使用bilibili账户密码进行登录"'
                    //     )) {
                    //     window.top.location = proxyServer + '/login';
                    // }
                } else {
                    // showNotification(Date.now(), GM_info.script.name, '已突破黑洞，开始加载视频', '//bangumi.bilibili.com/favicon.ico', 2e3);
                }
                return data;
            }
        })
    };
})();

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

var documentReadyQueue = [];
var windowReadyQueue = [];
document.addEventListener('readystatechange', function(){
    if (document.readyState === 'interactive') {
        // DOMContentLoad
        for(var i in documentReadyQueue) {
            documentReadyQueue[i]();
        }
    } else if (document.readyState === 'complete') {
        // window.load
        for(var i in windowReadyQueue) {
            windowReadyQueue[i]();
        }
    } else {
        // loading
    }
});

documentReady(function () {
    if (window.location.hostname === 'bangumi.bilibili.com') {
        checkLoginState();
        checkHtml5();
        if (window.location.pathname.match(/^\/anime\/\d+$/)) {
            tryFillSeasonList();
        }
    } else if (window.location.href.indexOf('www.bilibili.com/video/av') !== -1) {
        tryBangumiRedirect();
    }
});

windowReady(function () {
    if (window.location.hostname === 'bangumi.bilibili.com') {
        addSettingsButton();
    }
});

// 监听登录message
window.addEventListener('message', function (e) {
    switch (e.data) {
        case 'BiliPlus-Login-Success':
            //登入
            document.head.appendChild(_('script', {
                src: proxyServer + '/login?act=getlevel',
                event: {
                    load: function () { location.reload(); },
                    error: function () { location.reload(); }
                }
            }));
            break;
        case 'BiliPlus-Logout-Success':
            //登出
            location.reload();
            break;
    }
});

// 添加设置入口节点
function addSettingsButton() {
    var indexNav = document.getElementById('index_nav'), bottom = '110px';
    if (indexNav == null) {
        document.head.appendChild(_('style', {}, [_('text', '.index-nav{opacity:1;display:block;bottom:50px;left:calc(50% + 500px);z-index:100} @media screen and (min-width:1160px){.index-nav{left:calc(50% + 590px)}}')]));
        indexNav = document.body.appendChild(_('div', {
            id: 'index_nav',
            className: 'index-nav'
        }));
        bottom = 0;
    }
    indexNav.appendChild(_('div', { className: 'n-i gotop balh_settings', style: { bottom: bottom }, title: GM_info.script.name + ' 设置', event: { click: showSettings } }, [_('div', { className: 'btn_gotop', style: { background: '#f6f9fa' } })]));
    indexNav.lastChild.firstChild.innerHTML = '<!-- https://www.flaticon.com/free-icon/saturn_53515 --><svg style="width:30px;height:50px;fill:rgb(153,162,170)" viewBox="0 0 612.017 612.017"><path d="M596.275,15.708C561.978-18.59,478.268,5.149,380.364,68.696c-23.51-7.384-48.473-11.382-74.375-11.382c-137.118,0-248.679,111.562-248.679,248.679c0,25.902,3.998,50.865,11.382,74.375C5.145,478.253-18.575,561.981,15.724,596.279c34.318,34.318,118.084,10.655,216.045-52.949c23.453,7.365,48.378,11.344,74.241,11.344c137.137,0,248.679-111.562,248.679-248.68c0-25.862-3.979-50.769-11.324-74.24C606.931,133.793,630.574,50.026,596.275,15.708zM66.435,545.53c-18.345-18.345-7.919-61.845,23.338-117.147c22.266,39.177,54.824,71.716,94.02,93.943C128.337,553.717,84.837,563.933,66.435,545.53z M114.698,305.994c0-105.478,85.813-191.292,191.292-191.292c82.524,0,152.766,52.605,179.566,125.965c-29.918,41.816-68.214,87.057-113.015,131.839c-44.801,44.819-90.061,83.116-131.877,113.034C167.303,458.76,114.698,388.479,114.698,305.994z M305.99,497.286c-3.156,0-6.236-0.325-9.354-0.459c35.064-27.432,70.894-58.822,106.11-94.059c35.235-35.235,66.646-71.046,94.058-106.129c0.153,3.118,0.479,6.198,0.479,9.354C497.282,411.473,411.469,497.286,305.99,497.286z M428.379,89.777c55.303-31.238,98.803-41.683,117.147-23.338c18.402,18.383,8.187,61.902-23.204,117.377C500.095,144.62,467.574,112.043,428.379,89.777z"/></svg>';
}

function onSettingsFormChange(e) {
    var name = e.target.name;
    console.log(name, ' => ', e.target.value, e.target.checked);
    switch (name) {
        case 'balh_proxy_server':
            proxyServer = e.target.value;
            setCookie('balh_server', proxyServer);
            break;
        case 'balh_mode':
            mode = e.target.value;
            setCookie('balh_mode', mode);
            break;
        case 'balh_blocked_vip':
            isBlockedVip = e.target.checked ? 'Y' : '';
            setCookie('balh_blocked_vip', isBlockedVip);
            break;
    }
}

var settingsDOM = _('div', { id: 'balh-settings', style: { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.7)', animationName: 'balh-settings-bg', animationDuration: '.5s', zIndex: 1000, cursor: 'pointer' }, event: { click: function (e) { if (e.target === this) this.remove(); } } }, [
    _('style', {}, [_('text', '@keyframes balh-settings-bg{from{background:rgba(0,0,0,0)}to{background:rgba(0,0,0,.7)}}#balh-settings label{width:100%;display:inline-block;cursor:pointer}#balh-settings label:after{content:"";width:0;height:1px;background:#4285f4;transition:width .3s;display:block}#balh-settings label:hover:after{width:100%}form{margin:0}')]),
    _('div', { style: { position: 'absolute', background: '#FFF', borderRadius: '10px', padding: '20px', top: '50%', left: '50%', width: '600px', transform: 'translate(-50%,-50%)', cursor: 'default' } }, [
        _('h1', {}, [_('text', GM_info.script.name + ' 参数设置')]),
        _('br'),
        _('form', { id: 'balh-settings-form', event: { change: onSettingsFormChange } }, [
            _('text', '使用的服务器：'), _('br'),
            _('div', { style: { display: 'flex' } }, [
                _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_proxy_server', value: 'https://biliplus.ipcjsdev.tk' }), _('text', 'https://biliplus.ipcjsdev.tk')]),
                _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_proxy_server', value: 'https://www.biliplus.com' }), _('text', 'https://www.biliplus.com')])
            ]), _('br'),
            _('text', '脚本工作模式：'), _('br'),
            _('div', { style: { display: 'flex' } }, [
                _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: MODE_DEFAULT }), _('text', '默认：自动判断')]),
                _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: MODE_REPLACE }), _('text', '替换：在需要时处理视频')]),
                _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: MODE_REDIRECT }), _('text', '重定向：完全代理所有视频')])
            ]), _('br'),
            _('text', '其他：'), _('br'),
            _('div', { style: { display: 'flex' } }, [
                _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_blocked_vip' }), _('text', '被永封的大会员？'), _('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.md#大会员账号被b站永封了', target: '_blank' }, [_('text', '（详细说明）')])]),
            ]), _('br'),
            _('a', { href: 'javascript:', event: { click: function () { settingsDOM.click(); showLogin(); } } }, [_('text', '授权代理服务器')]),
            _('text', '　'),
            _('a', { href: 'javascript:', event: { click: function () { settingsDOM.click(); showLogout(); } } }, [_('text', '取消授权')]),
            _('br'), _('br'),
            _('div', { style: { whiteSpace: 'pre-wrap' } }, [
                _('text', '作者: ipcjs\n代码贡献: esterTion FlandreDaisuki\n接口提供：BiliPlus')
            ])
        ])
    ])
]);

function showSettings() {
    document.body.appendChild(settingsDOM);
    var form = settingsDOM.querySelector('form');
    form.elements['balh_proxy_server'].value = proxyServer;
    form.elements['balh_mode'].value = mode;
    form.elements['balh_blocked_vip'].checked = isBlockedVip;
}

// 暴露接口
window.bangumi_area_limit_hack = {
    setCookie: setCookie,
    getCookie: getCookie,
    login: showLogin,
    logout: showLogout,
    _clear_local_value: function () {
        delete localStorage.balh_notFirst;
        delete localStorage.balh_login;
        delete localStorage.balh_mainLogin;
        delete localStorage.oauthTime;
        delete localStorage.balh_h5_not_first;
    }
};
window.bangumi_aera_limit_hack = window.bangumi_area_limit_hack; // 兼容...

////////////////接下来全是函数/////////////////

function injectDataFilter() {
    window.jQuery.ajaxSetup({
        dataFilter: jqueryDataFilter
    });
    replaceAjax();
}

function jqueryDataFilter(data, type) {
    var json, group;
    // log(arguments, this);
    if (this.url.startsWith(window.location.protocol + '//bangumi.bilibili.com/web_api/season_area')) {
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
            // showNotification(Date.now(), GM_info.script.name, '检测到区域限制番剧，准备启动黑洞突破程序\n\n刷下存在感(°∀°)ﾉ', '//bangumi.bilibili.com/favicon.ico', 2e3);
        } else {
            mode === MODE_DEFAULT && setAreaLimitSeason(false);
        }
    }
    return data;
}

/*
 {"code":0,"message":"success","result":{"aid":9854952,"cid":16292628,"episode_status":2,"payment":{"price":"0"},"player":"vupload","pre_ad":0,"season_status":2}}
 */
function replaceAjax() {
    var originalAjax = $.ajax;
    $.ajax = function (arg0, arg1) {
        // log(arguments);
        var param;
        if (arg1 === undefined) {
            param = arg0;
        } else {
            arg0 && (arg1.url = arg0);
            param = arg1;
        }
        var oriSuccess = param.success;
        var mySuccess;
        var one_api;
        if (param.url.match('/web_api/get_source')) {
            one_api = bilibiliApis._get_source;
            if (mode === MODE_REDIRECT || (mode === MODE_DEFAULT && isAreaLimitSeason())) { // 对应redirect模式
                param.url = one_api.transToProxyUrl(param.url);
                param.type = 'GET';
                delete param.data;
                param.success = function (data) {
                    var returnVal = one_api.processProxySuccess(data);
                    log('Redirected request: get_source', returnVal);
                    oriSuccess(returnVal);
                };
            } else { // 对应replace模式
                param.success = function (json) {
                    log(json);
                    if (json.code === -40301 // 区域限制
                        || json.result.payment && json.result.payment.price != 0 && isBlockedVip) { // 需要付费的视频, 此时B站返回的cid是错了, 故需要使用代理服务器的接口
                        one_api.asyncAjaxByProxy(param.url, oriSuccess, function (e) {
                            oriSuccess(json); // 新的请求报错, 也应该返回原来的数据
                        });
                        mode === MODE_DEFAULT && setAreaLimitSeason(true); // 只要默认模式才要跟踪是否有区域限制
                    } else {
                        mode === MODE_DEFAULT && setAreaLimitSeason(false);
                        if (isBlockedVip && json.code === 0 && json.result.pre_ad) {
                            json.result.pre_ad = 0; // 去除前置广告
                        }
                        oriSuccess(json); // 保证一定调用了原来的success
                    }
                };
            }
        } else if (param.url.match('/player/web_api/playurl')) {
            one_api = bilibiliApis._playurl;
            if (mode === MODE_REDIRECT || (mode === MODE_DEFAULT && isAreaLimitSeason())) {
                param.url = one_api.transToProxyUrl(param.url);
                param.success = function (data) {
                    oriSuccess(one_api.processProxySuccess(data));
                };
                log('Redirected request: bangumi playurl -> ', param.url);
            } else {
                param.success = function (json) {
                    // 获取视频地址 API
                    log(json);
                    if (isBlockedVip || json.code || isAreaLimitForPlayUrl(json)) {
                        one_api.asyncAjaxByProxy(param.url, oriSuccess, function (e) {
                            oriSuccess(json);
                        });
                        mode === MODE_DEFAULT && setAreaLimitSeason(true);
                    } else {
                        mode === MODE_DEFAULT && setAreaLimitSeason(false);
                        oriSuccess(json);
                    }
                };
            }
        } else if (param.url.match('//interface.bilibili.com/player?')) {
            if (isBlockedVip) {
                mySuccess = function (data) {
                    try {
                        var xml = new window.DOMParser().parseFromString('<userstatus>' + data.replace(/\&/g, '&amp;') + '</userstatus>', 'text/xml');
                        var vipTag = xml.querySelector('vip');
                        if (vipTag) {
                            var vip = JSON.parse(vipTag.innerHTML);
                            vip.vipType = 2; // 类型, 年度大会员
                            vip.vipStatus = 1; // 状态, 启用
                            vipTag.innerHTML = JSON.stringify(vip);
                            data = xml.documentElement.innerHTML;
                        }
                    } catch (e) {
                        log('parse xml error: ', e);
                    }
                    oriSuccess(data);
                };
            }
        }

        // 若外部使用param.success处理结果, 则替换param.success
        if (oriSuccess && mySuccess) {
            param.success = mySuccess;
        }
        // default
        var xhr = originalAjax.apply(this, [param]);

        // 若外部使用xhr.done()处理结果, 则替换xhr.done()
        if (!oriSuccess && mySuccess) {
            xhr.done(mySuccess);
            xhr.done = function (success) {
                oriSuccess = success; // 保存外部设置的success函数
                return xhr;
            };
        }
        return xhr;
    };
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
    var seasonId;
    // 取anime页面的seasonId
    try {
        // 若w, 是其frame的window, 则有可能没有权限, 而抛异常
        seasonId = window.season_id || window.top.season_id;
    } catch (e) {
        console.error(e);
    }
    if (!seasonId) {
        seasonId = (window.top.location.pathname.match(/\/anime\/(\d+)/) || ['', ''])[1];
    }

    // 若没取到, 则取movie页面的seasonId, 以m开头
    if (!seasonId) {
        seasonId = (window.top.location.pathname.match(/\/movie\/(\d+)/) || ['', ''])[1];
        if (seasonId) {
            seasonId = 'm' + seasonId;
        }
    }
    return seasonId || '000';
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

// document.cookie=`bangumi_area_limit_hack_server=https://www.biliplus.com; domain=.bilibili.com; path=/; expires=${new Date("2020-01-01").toUTCString()}`;

/**
 * @param key     key
 * @param value   为undefined时, 表示删除cookie
 * @param options 为undefined时, 表示过期时间为3年
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
    var loginUrl = proxyServer + '/login',
        iframeSrc = 'https://passport.bilibili.com/login?appkey=27eb53fc9058f8c3&api=' + encodeURIComponent(loginUrl) + '&sign=' + hex_md5('api=' + loginUrl + 'c2ed53a74eeefe3cf99fbd01d8c9c375');
    showPopWindow(iframeSrc);
    delete localStorage.balh_login;
}

function showLogout() {
    showPopWindow(proxyServer + '/login?act=logout');
}

function showPopWindow(iframeSrc) {
    if (!document.getElementById('balh-style-login')) {
        var style = document.createElement('style');
        style.id = 'balh-style-login';
        document.head.appendChild(style).innerHTML = '@keyframes pop-iframe-in{0%{opacity:0;transform:scale(.7);}100%{opacity:1;transform:scale(1)}}@keyframes pop-iframe-out{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(.7)}}.GMBiliPlusCloseBox{position:absolute;top:5%;right:8%;font-size:40px;color:#FFF}';
    }

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
            }, 5e2);
        }
    });
    document.body.appendChild(div);
}

// 逻辑有点乱, 当前在如下情况才会弹一次登录提示框:
// 1. 第一次使用
// 2. 主站+服务器都退出登录后, 再重新登录主站
function checkLoginState() {
    if (getCookie("DedeUserID") === undefined) {
        //未登录主站，强制指定值
        localStorage.balh_notFirst = 1;
        localStorage.balh_login = 0;
        localStorage.balh_mainLogin = 0;
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
                if (confirm('看起来你是第一次使用' + GM_info.script.name + '\n要不要考虑进行一下授权？\n\n授权后可以观看区域限定番剧的1080P（如果你是大会员或承包过的话）\n\n你可以随时通过执行 bangumi_area_limit_hack.login() 来打开授权页面')) {
                    showLogin();
                }
            } else {
                localStorage.balh_login = 1;
            }
        });
    } else if (localStorage.balh_login === undefined) {
        //非第一次打开，登录状态被重置，重新检测
        checkExpiretime(function () {
            localStorage.balh_login = (localStorage.oauthTime === undefined) ? 0 : 1;
        });
    } else if (localStorage.balh_login == 1 && Date.now() - parseInt(localStorage.oauthTime) > 24 * 60 * 60 * 1000) {
        //已登录，每天为周期检测key有效期，过期前五天会自动续期
        checkExpiretime();
    }

    function checkExpiretime(loadCallback) {
        var script = document.createElement('script');
        script.src = proxyServer + '/login?act=expiretime';
        loadCallback && script.addEventListener('load', loadCallback);
        document.head.appendChild(script);
    }
}

function checkHtml5() {
    if (!localStorage.balh_h5_not_first && localStorage.defaulth5 !== '1' && window.GrayManager) {
        new MutationObserver(function (mutations, observer) {
            observer.disconnect();
            localStorage.balh_h5_not_first = 'yes';
            if (window.confirm(GM_info.script.name + '只在HTML5播放器下有效，是否切换到HTML5？')) {
                window.GrayManager.clickMenu('change_h5');// change_flash, change_h5
            }
        }).observe(document.querySelector('.player-content'), {
            childList: true, // 监听child的增减
            attributes: false, // 监听属性的变化
        });
    }
}

// document载入完成后回调, 相当于$(cb);
function documentReady(cb) {
    documentReadyQueue.push(cb);
}

// window载入完成后回掉
function windowReady(cb) {
    windowReadyQueue.push(cb);
}

/**
 * 通知模块
 * 剽窃自 YAWF 用户脚本
 * 硬广：https://tiansh.github.io/yawf/
 */
var notify = (function () {
    var avaliable = {};
    var shown = [];
    var use = {
        'hasPermission': function () {
            return null;
        },
        'requestPermission': function (callback) {
            return null;
        },
        'hideNotification': function (notify) {
            return null;
        },
        'showNotification': function (id, title, body, icon, delay, onclick) {
            return null;
        }
    };

    // 检查一个微博是不是已经被显示过了，如果显示过了不重复显示
    var shownFeed = function (id) {
        return false;
    };

    // webkitNotifications
    // Tab Notifier 扩展实现此接口，但显示的桌面提示最多只能显示前两行
    if (typeof webkitNotifications !== 'undefined') avaliable.webkit = {
        'hasPermission': function () {
            return [true, null, false][webkitNotifications.checkPermission()];
        },
        'requestPermission': function (callback) {
            return webkitNotifications.requestPermission(callback);
        },
        'hideNotification': function (notify) {
            notify.cancel();
            afterHideNotification(notify);
        },
        'showNotification': function (id, title, body, icon, delay, onclick) {
            if (shownFeed(id)) return null;
            var notify = webkitNotifications.createNotification(icon, title, body);
            if (delay && delay > 0) notify.addEventListener('display', function () {
                setTimeout(function () {
                    hideNotification(notify);
                }, delay);
            });
            if (onclick) notify.addEventListener('click', function () {
                onclick.apply(this, arguments);
                hideNotification(notify);
            });
            notify.show();
            return notify;
        },
    };

    // Notification
    // Firefox 22+
    // 显示4秒会自动关闭 https://bugzil.la/875114
    if (typeof Notification !== 'undefined') avaliable.standard = {
        'hasPermission': function () {
            return {
                'granted': true,
                'denied': false,
                'default': null,
            }[Notification.permission];
        },
        'requestPermission': function (callback) {
            return Notification.requestPermission(callback);
        },
        'hideNotification': function (notify) {
            notify.close();
            afterHideNotification(notify);
        },
        'showNotification': function (id, title, body, icon, delay, onclick) {
            if (shownFeed(id)) return null;
            var notify = new Notification(title, { 'body': body, 'icon': icon, 'requireInteraction': !delay });
            if (delay && delay > 0) notify.addEventListener('show', function () {
                setTimeout(function () {
                    hideNotification(notify);
                }, delay);
            });
            if (onclick) notify.addEventListener('click', function () {
                onclick.apply(this, arguments);
                hideNotification(notify);
            });
            return notify;
        },
    };

    // 有哪些接口可用
    var avaliableNotification = function () {
        return Object.keys(avaliable);
    };
    // 选择用哪个接口
    var choseNotification = function (prefer) {
        return (use = prefer && avaliable[prefer] || avaliable.standard);
    };
    choseNotification();
    // 检查权限
    var hasPermission = function () {
        return use.hasPermission.apply(this, arguments);
    };
    // 请求权限
    var requestPermission = function () {
        return use.requestPermission.apply(this, arguments);
    };
    // 显示消息
    var showNotification = function (id, title, body, icon, delay, onclick) {
        var notify = use.showNotification.apply(this, arguments);
        shown.push(notify);
        return notify;
    };
    // 隐藏已经显示的消息
    var hideNotification = function (notify) {
        use.hideNotification.apply(this, arguments);
        return notify;
    };
    var afterHideNotification = function (notify) {
        shown = shown.filter(function (x) {
            return x !== notify;
        });
    };

    document.addEventListener('unload', function () {
        shown.forEach(hideNotification);
        shown = [];
    });

    return {
        'avaliableNotification': avaliableNotification,
        'choseNotification': choseNotification,
        'hasPermission': hasPermission,
        'requestPermission': requestPermission,
        'showNotification': showNotification,
        'hideNotification': hideNotification
    };

}());

function showNotification() {
    switch (notify.hasPermission()) {
        case null: // default
            var thatArguments = arguments;
            notify.requestPermission(function () {
                showNotification.apply(null, thatArguments);
            });
            break;
        case true: // granted
            notify.showNotification.apply(null, arguments);
            break;
        case false: // denied
            log('Notification permission: denied');
            break;
    }
}

/**
 * 创建元素的快捷方法
 * @param type string, 标签名; 特殊的, 若为text, 则表示创建文字, 对应的t为文字的内容
 * @param props object, 属性; 特殊的属性名有: className, 类名; style, 样式, 值为(样式名, 值)形式的object; event, 值为(事件名, 监听函数)形式的object;
 * @param children array, 子元素;
 */
function _(type, props, children) {
    var elem = null;
    if (type === "text") {
        return document.createTextNode(props);
    } else {
        elem = document.createElement(type);
    }
    for (var n in props) {
        if (n === "style") {
            for (var x in props.style) {
                elem.style[x] = props.style[x];
            }
        } else if (n === "className") {
            elem.className = props[n];
        } else if (n === "event") {
            for (var x in props.event) {
                elem.addEventListener(x, props.event[x]);
            }
        } else {
            elem.setAttribute(n, props[n]);
        }
    }
    if (children) {
        for (var i = 0; i < children.length; i++) {
            if (children[i] != null)
                elem.appendChild(children[i]);
        }
    }
    return elem;
}

function tryBangumiRedirect() {
    var msgBox;
    if (!(msgBox = document.querySelector('.b-page-body > .error-container > .error-panel'))) {
        return;
    }
    var msg = document.createElement('a');
    msgBox.insertBefore(msg, msgBox.firstChild);
    msg.innerText = '获取番剧页Url中...';

    var aid = location.pathname.replace(/.*av(\d+).*/, '$1'),
        page = (location.pathname.match(/\/index_(\d+).html/) || ['', '1'])[1],
        cid,
        season_id,
        episode_id;
    ajaxPromise(proxyServer + '/api/view?id=' + aid + '&update=true')
        .then(function (data) {
            if (data.code) {
                return Promise.reject(JSON.stringify(data));
            }
            if (!data.bangumi) {
                return Promise.reject('该AV号不属于任何番剧页');//No bangumi in api response
            }
            season_id = data.bangumi.season_id;
            for (var i = 0; i < data.list.length; i++) {
                if (data.list[i].page == page) {
                    cid = data.list[i].cid;
                    break;
                }
            }
            return ajaxPromise(proxyServer + '/api/bangumi?season=' + season_id);
        })
        .then(function (result) {
            if (result.code) {
                return Promise.reject(JSON.stringify(result));
            }
            var ep_id_by_cid, ep_id_by_aid_page, ep_id_by_aid,
                episodes = result.result.episodes,
                ep;
            // 为何要用三种不同方式匹配, 详见: https://greasyfork.org/zh-CN/forum/discussion/22379/x#Comment_34127
            for (var i = 0; i < episodes.length; i++) {
                ep = episodes[i];
                if (ep.danmaku == cid) {
                    ep_id_by_cid = ep.episode_id;
                }
                if (ep.av_id == aid && ep.page == page) {
                    ep_id_by_aid_page = ep.episode_id;
                }
                if (ep.av_id == aid) {
                    ep_id_by_aid = ep.episode_id;
                }
            }
            episode_id = ep_id_by_cid || ep_id_by_aid_page || ep_id_by_aid;
            if (episode_id) {
                var bangumi_url = '//bangumi.bilibili.com/anime/' + season_id + '/play#' + episode_id;
                log('Redirect', 'aid:', aid, 'page:', page, 'cid:', cid, '==>', bangumi_url, '(ep_id:', ep_id_by_cid, ep_id_by_aid_page, ep_id_by_aid, ')');
                msg.innerText = '即将跳转到：' + bangumi_url;
                location.href = bangumi_url;
            } else {
                return Promise.reject('查询episode_id失败');
            }
        })
        .catch(function (e) {
            log('error:', arguments);
            msg.innerText = 'error:' + e;
        });
}

function tryFillSeasonList() {
    var error_container, season_id;
    if (!(error_container = document.querySelector('div.error-container'))) {
        return;
    }
    if (!(season_id = window.location.pathname.match(/^\/anime\/(\d+)$/)[1])) {
        return;
    }

    //尝试解决怪异模式渲染
    /*
    会造成变量丢失，等待官方重写doctype
    try{
    window.stop();
        var xhr = new XMLHttpRequest();
    xhr.open('GET',location.href,false);
    xhr.send();
    document.head.appendChild(_('script',{},[_('text',
        'document.write(unescape("'+escape(xhr.response.replace(/<!DOCTYPE.+?>/,'<!DOCTYPE HTML>'))+'"));window.stop()'
    )]));
    }catch(e){console.error(e);}
    */

    var msg = _('a', { href: '//bangumi.bilibili.com/anime/' + season_id + '/play', style: { fontSize: '20px' } }, [_('text', '【' + GM_info.script.name + '】尝试获取视频列表中...')]),
        content = _('div');

    error_container.insertBefore(content, error_container.firstChild);
    content.appendChild(msg);
    log('season>:', season_id);
    ajaxPromise(proxyServer + '/api/bangumi?season=' + season_id)
        .then(function (data) {
            log('season>then:', data);
            if (data.code) {
                return Promise.reject(data);
            }

            function generateEpisodeList(episodes) {
                var childs = [];
                episodes.reverse().forEach(function (i) {
                    childs.push(_('li', { className: 'v1-bangumi-list-part-child', 'data-episode-id': i.episode_id }, [_('a', { className: 'v1-complete-text', href: '//bangumi.bilibili.com/anime/' + season_id + '/play#' + i.episode_id, title: i.index + ' ' + i.index_title, target: '_blank', style: { height: '60px' } }, [
                        _('div', { className: 'img-wrp' }, [_('img', { src: i.cover, style: { opacity: 1 }, loaded: 'loaded', alt: i.index + ' ' + i.index_title })]),
                        _('div', { className: 'text-wrp' }, [
                            _('div', { className: 'text-wrp-num' }, [_('div', { className: 'text-wrp-num-content' }, [_('text', '第' + i.index + '话')])]),
                            _('div', { className: 'text-wrp-title trunc' }, [_('text', i.index_title)])
                        ])
                    ])]));
                });
                return childs;
            }

            function generateSeasonList(seasons) {
                function onSeasonClick(event) {
                    window.location.href = '//bangumi.bilibili.com/anime/' + event.target.attributes['data-season-id'].value;
                }

                return seasons.map(function (season) {
                    return _('li', { className: season.season_id == season_id ? 'cur' : '', 'data-season-id': season.season_id, event: { click: onSeasonClick } }, [_('text', season.title)]);
                });
            }

            if (data.result) {
                document.title = data.result.title;
                document.head.appendChild(_('link', { href: 'https://s3.hdslb.com/bfs/static/anime/css/tag-index.css?v=110', rel: 'stylesheet' }));
                document.head.appendChild(_('link', { href: 'https://s1.hdslb.com/bfs/static/anime/css/bangumi-index.css?v=110', rel: 'stylesheet' }));
                document.body.insertBefore(_('div', { className: 'main-container-wrapper' }, [_('div', { className: 'main-container' }, [
                    _('div', { className: 'page-info-wrp' }, [_('div', { className: 'bangumi-info-wrapper' }, [
                        _('div', { className: 'bangumi-info-blurbg-wrapper' }, [_('div', { className: 'bangumi-info-blurbg blur', style: { backgroundImage: 'url(' + data.result.cover + ')' } })]),
                        _('div', { className: 'main-inner' }, [_('div', { className: 'info-content' }, [
                            _('div', { className: 'bangumi-preview' }, [_('img', { alt: data.result.title, src: data.result.cover })]),
                            _('div', { className: 'bangumi-info-r' }, [
                                _('div', { className: 'b-head' }, [_('h1', { className: 'info-title', 'data-seasonid': season_id, title: data.result.title }, [_('text', data.result.title)])]),
                                _('div', { className: 'info-count' }, [
                                    _('span', { className: 'info-count-item info-count-item-play' }, [_('span', { className: 'info-label' }, [_('text', '总播放')]), _('em', {}, [_('text', data.result.play_count)])]),
                                    _('span', { className: 'info-count-item info-count-item-fans' }, [_('span', { className: 'info-label' }, [_('text', '追番人数')]), _('em', {}, [_('text', data.result.favorites)])]),
                                    _('span', { className: 'info-count-item info-count-item-review' }, [_('span', { className: 'info-label' }, [_('text', '弹幕总数')]), _('em', {}, [_('text', data.result.danmaku_count)])])
                                ]),
                                //_('div',{className:'info-row info-update'},[]),
                                //_('div',{className:'info-row info-cv'},[]),
                                _('div', { className: 'info-row info-desc-wrp' }, [
                                    _('div', { className: 'info-row-label' }, [_('text', '简介：')]),
                                    _('div', { className: 'info-desc' }, [_('text', data.result.evaluate)])
                                ]),
                            ])
                        ])])
                    ])]),
                    _('div', { className: 'main-inner' }, [_('div', { className: 'v1-bangumi-list-wrapper clearfix' }, [
                        _('div', { className: 'v1-bangumi-list-season-wrapper' }, [
                            _('div', { className: 'v1-bangumi-list-season-content slider-list-content' }, [
                                _('div', {}, [
                                    _('ul', { className: 'v1-bangumi-list-season clearfix slider-list', 'data-current-season-id': season_id, style: { opacity: 1 } }, generateSeasonList(data.result.seasons))
                                ])
                            ])
                        ]),
                        _('div', { className: 'v1-bangumi-list-part-wrapper slider-part-wrapper' }, [_('div', { className: 'v1-bangumi-list-part clearfix', 'data-current-season-id': season_id, style: { display: 'block' } }, [
                            _('div', { className: 'complete-list', style: { display: 'block' } }, [_('div', { className: 'video-slider-list-wrapper' }, [_('div', { className: 'slider-part-wrapper' }, [_('ul', { className: 'slider-part clearfix hide', style: { display: 'block' } }, generateEpisodeList(data.result.episodes))])])])
                        ])])
                    ])])
                ])]), msg.parentNode.parentNode);
                msg.parentNode.parentNode.remove();
            }
        })
        .catch(function (error) {
            log('season>catch', error);
            msg.innerText = 'error:' + JSON.stringify(error) + '\n点击跳转到播放界面 (不一定能够正常播放...)';
        });
}

function ajaxPromise(options) {
    return new Promise(function (resolve, reject) {
        typeof options !== 'object' && (options = { url: options });

        options.async === undefined && (options.async = true);
        options.xhrFields === undefined && (options.xhrFields = { withCredentials: true });
        options.success = function (data) {
            resolve(data);
        };
        options.error = function (err) {
            reject(err);
        };
        $.ajax(options);
    });
}
