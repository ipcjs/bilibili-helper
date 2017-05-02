// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      5.2.1
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效; 只支持番剧视频;
// @author       ipcjs
// @require      https://static.hdslb.com/js/md5.js
// @include      *://www.bilibili.com/video/av*
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
var proxyServer = settings.balh_server || 'https://biliplus.ipcjsdev.tk'; // 优先从cookie中读取服务器地址
var isBlockedVip = settings.balh_blocked_vip; // "我是一位被永久封号的大会员"(by Google翻译)
var mode = settings.balh_mode || (isBlockedVip ? MODE_REDIRECT : MODE_DEFAULT); // 若账号是被永封的大会员, 默认使用重定向模式

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
            xhrFields: {withCredentials: true},
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
    return {
        _get_source: new BilibiliApi({
            transToProxyUrl: function (url) {
                return proxyServer + '/api/bangumi?season=' + window.season_id;
            },
            processProxySuccess: function (data) {
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
                        "payment": {"price": "9876547210.33"},
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
        }),
        _playurl: new BilibiliApi({
            transToProxyUrl: function (url) {
                return proxyServer + '/BPplayurl.php?' + url.split('?')[1].replace(/(cid=\d+)/, '$1|' + (url.match(/module=(\w+)/) || ['', 'bangumi'])[1]);
            },
            processProxySuccess: function (data) {
                if (data.code === -403) {
                    // window.alert('当前使用的服务器(' + proxyServer + ')依然有区域限制');
                    showNotification(Date.now(), GM_info.script.name, '突破黑洞失败，我们未能穿透敌人的盔甲\n当前代理服务器（' + proxyServer + '）依然有区域限制Σ( ￣□￣||)', '//bangumi.bilibili.com/favicon.ico', 3e3);
                } else if (data.code) {
                    console.error(data);
                    showNotification(Date.now(), GM_info.script.name, '突破黑洞失败\n' + JSON.stringify(data), '//bangumi.bilibili.com/favicon.ico', 3e3);
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

documentReady(function () {
    if (window.location.hostname === 'bangumi.bilibili.com') {
        checkLoginState();
        checkHtml5();
    } else if (window.location.href.indexOf('www.bilibili.com/video/av') !== -1) {
        tryBangumiRedirect();
    }
});

// 暴露接口
window.bangumi_area_limit_hack = {
    setCookie: setCookie,
    getCookie: getCookie,
    login: showLogin,
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
            showNotification(Date.now(), GM_info.script.name, '检测到区域限制番剧，准备启动黑洞突破程序\n\n刷下存在感(°∀°)ﾉ', '//bangumi.bilibili.com/favicon.ico', 2e3);
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
                        || json.result.pay_user && isBlockedVip) { // 需要付费的视频, 此时B站返回的cid是错了, 故需要使用代理服务器的接口
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
                    if (isBlockedVip || isAreaLimitForPlayUrl(json)) {
                        one_api.asyncAjaxByProxy(param.url, oriSuccess, function (e) {
                            oriSuccess(json);
                        });
                        mode === MODE_DEFAULT && setAreaLimitSeason(true);
                    } else {
                        mode === MODE_DEFAULT && setAreaLimitSeason(false);
                        oriSuccess(json);
                    }
                }
            }
        }
        // default
        return originalAjax.apply(this, [param]);
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
// document.cookie=`bangumi_area_limit_hack_server=https://www.biliplus.com; domain=.bilibili.com; path=/; expires=${new Date("2020-01-01").toUTCString()}`;

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

    var loginUrl = proxyServer + '/login',
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
            localStorage.balh_login = (localStorage.oauthTime === undefined) ? 0 : 1
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
    if (!localStorage.balh_h5_not_first && localStorage.defaulth5 == 0 && window.GrayManager) {
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
            if (onclick) notify.addEventListener('click', onclick);
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
            var notify = new Notification(title, {'body': body, 'icon': icon, 'requireInteraction': !delay});
            if (delay && delay > 0) notify.addEventListener('show', function () {
                setTimeout(function () {
                    hideNotification(notify);
                }, delay);
            });
            if (onclick) notify.addEventListener('click', onclick);
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
    var showNotification = function (title, body, icon, delay, onclick) {
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

function tryBangumiRedirect() {
    var msgBox;
    if (!(msgBox = document.querySelector('.b-page-body > .z-msg > .z-msg-box'))) {
        return;
    }
    var msg = document.createElement('a');
    msgBox.insertBefore(msg, msgBox.firstChild);
    msg.innerText = '获取番剧页Url中...';

    var season_id, ep_index, av_id = location.pathname.replace(/.*av(\d+).*/, '$1');
    ajaxPromise(proxyServer + '/api/view?id=' + av_id)
        .then(function (data) {
            if (!data.bangumi) {
                return Promise.reject('该AV号不属于任何番剧页');//No bangumi in api response
            }
            season_id = data.bangumi.season_id;
            return ajaxPromise(proxyServer + '/api/bangumi?season=' + season_id);
        })
        .then(function (result) {
            if (result.code !== 0) {
                return Promise.reject(result);
            }
            var episodes = result.result.episodes.filter(x => x.av_id === av_id);
            // if av_id unique, need not ep_index
            if (episodes.length > 1) {
                var int = parseInt,
                    old_ep_id = location.pathname.replace(/.*av\d+.(?:index_(\d+).*)?/, '$1');
                ep_index = int(old_ep_id) || int(result.result.season_index);
                ep_index = (isNaN(ep_index) || ep_index < 1) ? 1 : ep_index;

                episodes = episodes.filter(x => int(x.index) === ep_index);
            }
            if(episodes.length !== 1) {
                log('ep_ids ===>', episodes);
                return Promise.reject('该AV号不属于任何番剧页');
            }
            var episode_id = episodes[0].episode_id;
            var bangumi_url = '//bangumi.bilibili.com/anime/' + season_id + '/play#' + episode_id;
            log('Redirect av:', av_id, '==>', bangumi_url);
            msg.innerText = '即将跳转到：' + bangumi_url;
            location.href = bangumi_url;
        })
        .catch(function (e) {
            log('error:', arguments);
            msg.innerText = 'error:' + e;
        });
}

function ajaxPromise(options) {
    return new Promise(function (resolve, reject) {
        typeof options !== 'object' && (options = {url: options});

        options.async === undefined && (options.async = true);
        options.xhrFields === undefined && (options.xhrFields = {withCredentials: true});
        options.success = function (data) {
            resolve(data);
        };
        options.error = function (err) {
            reject(err);
        };
        $.ajax(options);
    })
}
