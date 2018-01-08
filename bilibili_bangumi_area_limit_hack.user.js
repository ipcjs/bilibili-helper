// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      6.4.1
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效; 只支持番剧视频;
// @author       ipcjs
// @require      https://static.hdslb.com/js/md5.js
// @include      *://www.bilibili.com/video/av*
// @include      *://www.bilibili.com/bangumi/play/ep*
// @include      *://www.bilibili.com/bangumi/play/ss*
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/movie/*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @run-at       document-start
// @grant        none
// ==/UserScript==

'use strict';
const log = console.log.bind(console, 'injector:')

function injector() {
    if (document.getElementById('balh-injector-source')) {
        log(`脚本已经注入过, 不需要执行`)
        return
    }
    // @require      https://static.hdslb.com/js/md5.js
    GM_info.scriptMetaStr.replace(new RegExp('// @require\\s+https?:(//.*)'), (match, /*p1:*/url) => {
        log('@require:', url)
        let $script = document.createElement('script')
        $script.className = 'balh-injector-require'
        $script.setAttribute('type', 'text/javascript')
        $script.setAttribute('src', url)
        document.head.appendChild($script)
        return match
    })
    let $script = document.createElement('script')
    $script.id = 'balh-injector-source'
    $script.appendChild(document.createTextNode(`
        ;(function(GM_info){
            ${scriptSource.toString()}
            ${scriptSource.name}('${GM_info.scriptHandler}.${injector.name}')
        })(${JSON.stringify(GM_info)})
    `))
    document.head.appendChild($script)
    log('注入完成')
}

if (!Object.getOwnPropertyDescriptor(window, 'XMLHttpRequest').writable) {
    log('XHR对象不可修改, 需要把脚本注入到页面中', GM_info.script.name, location.href, document.readyState)
    injector()
    return
}

/** 脚本的主体部分, 在GM4中, 需要把这个函数转换成字符串, 注入到页面中, 故不要引用外部的变量 */
function scriptSource(invokeBy) {
    'use strict';
    let log = console.log.bind(console, 'injector:')
    if (document.getElementById('balh-injector-source') && invokeBy === GM_info.scriptHandler) {
        // 当前, 在Firefox+GM4中, 当返回缓存的页面时, 脚本会重新执行, 并且此时XMLHttpRequest是可修改的(为什么会这样?) + 页面中存在注入的代码
        // 导致scriptSource的invokeBy直接是GM4...
        log(`页面中存在注入的代码, 但invokeBy却等于${GM_info.scriptHandler}, 这种情况不合理, 终止脚本执行`)
        return
    }
    if (document.readyState === 'uninitialized') { // Firefox上, 对于ifame中执行的脚本, 会出现这样的状态且获取到的href为about:blank...
        log('invokeBy:', invokeBy, 'readState:', document.readyState, 'href:', location.href, '需要等待进入loading状态')
        setTimeout(() => scriptSource(invokeBy + '.timeout'), 0) // 这里会暴力执行多次, 直到状态不为uninitialized...
        return
    }
    const r = {
        text: {
            ok: { en: 'OK', zh_cn: '确定', },
        },
        html: {},
        css: {
            settings: '#balh-settings {font-size: 12px;color: #6d757a;}  #balh-settings h1 {color: #161a1e}  #balh-settings a {color: #00a1d6;}  #balh-settings a:hover {color: #f25d8e}  #balh-settings input {margin-left: 3px;margin-right: 3px;}  @keyframes balh-settings-bg { from {background: rgba(0, 0, 0, 0)} to {background: rgba(0, 0, 0, .7)} }  #balh-settings label {width: 100%;display: inline-block;cursor: pointer}  #balh-settings label:after {content: "";width: 0;height: 1px;background: #4285f4;transition: width .3s;display: block}  #balh-settings label:hover:after {width: 100%}  form {margin: 0}  #balh-settings input[type="radio"] {-webkit-appearance: radio;-moz-appearance: radio;appearance: radio;}  #balh-settings input[type="checkbox"] {-webkit-appearance: checkbox;-moz-appearance: checkbox;appearance: checkbox;} ',
        },
        attr: {},
        url: {
            issue: 'https://github.com/ipcjs/bilibili-helper/issues/new'
        },
        script: {
            is_dev: GM_info.script.name.includes('.dev'),
        },
        const: {
            mode: {
                DEFAULT: 'default',// 默认模式, 自动判断使用何种模式, 推荐;
                REPLACE: 'replace', // 替换模式, 替换有区域限制的视频的接口的返回值;
                REDIRECT: 'redirect',// 重定向模式, 直接重定向所有番剧视频的接口到代理服务器; 所有番剧视频都通过代理服务器获取视频地址, 如果代理服务器不稳定, 可能加载不出视频;
            },
            server: {
                S0: 'https://biliplus.ipcjs.win',
                S1: 'https://www.biliplus.com',
                defaultServer: function () {
                    return this.S0
                },
            }
        }
    }

    const util_arr_stringify = function (arr) {
        return arr.map(item => {
            if (typeof item === 'object') {
                try {
                    return JSON.stringify(item)
                } catch (e) {
                    console.debug(e)
                    return item.toString()
                }
            } else {
                return item
            }
        }).join(' ')
    }

    const util_str_multiply = function (str, multiplier) {
        let result = ''
        for (let i = 0; i < multiplier; i++) {
            result += str
        }
        return result
    }

    const util_log_hub = (function () {
        const tag = GM_info.script.name + '.msg'

        // 计算"楼层", 若当前window就是顶层的window, 则floor为0, 以此类推
        function computefloor(w = window, floor = 0) {
            if (w === window.top) {
                return floor
            } else {
                return computefloor(w.parent, floor + 1)
            }
        }

        let floor = computefloor()
        let msgList = []
        if (floor === 0) { // 只有顶层的Window才需要收集日志
            window.addEventListener('message', (event) => {
                if (event.data instanceof Array && event.data[0] === tag) {
                    let [/*tag*/, fromFloor, msg] = event.data
                    msgList.push(util_str_multiply('    ', fromFloor) + msg)
                }
            })
        }
        return {
            msg: function (msg) {
                window.top.postMessage([tag, floor, msg], '*')
            },
            getAllMsg: function () {
                return msgList.join('\n')
            }
        }
    }())
    const util_log_impl = function (type) {
        if (r.script.is_dev) {
            // 直接打印, 会显示行数
            return window.console[type].bind(window.console, type + ':');
        } else {
            // 将log收集到util_log_hub中, 显示的行数是错误的...
            return function (...args) {
                args.unshift(type + ':')
                window.console[type].apply(window.console, args)
                util_log_hub.msg(util_arr_stringify(args))
            }
        }
    }
    const util_log = util_log_impl('log')
    const util_debug = util_log_impl('debug')
    const util_error = util_log_impl('error')
    log = util_log
    log(`[${GM_info.script.name} v${GM_info.script.version} (${invokeBy})] run on: ${window.location.href}`);

    const util_func_noop = function () { }
    const util_func_catched = function (func, onError) {
        let ret = function () {
            try {
                return func.apply(this, arguments)
            } catch (e) {
                if (onError) return onError(e) // onError可以处理报错时的返回值
                // 否则打印log, 并返回undefined
                util_error('Exception while run %o: %o\n%o', func, e, e.stack)
                return undefined
            }
        }
        // 函数的name属性是不可写+可配置的, 故需要如下代码实现类似这样的效果: ret.name = func.name
        // 在Edge上匿名函数的name的描述符会为undefined, 需要做特殊处理, fuck
        let funcNameDescriptor = Object.getOwnPropertyDescriptor(func, 'name') || {
            value: '',
            writable: false,
            configurable: true,
        }
        Object.defineProperty(ret, 'name', funcNameDescriptor)
        return ret
    }

    const util_init = (function () {
        const RUN_AT = {
            DOM_LOADED: 0,
            DOM_LOADED_AFTER: 1,
            COMPLETE: 2,
        }
        const PRIORITY = {
            FIRST: 1e6,
            HIGH: 1e5,
            BEFORE: 1e3,
            DEFAULT: 0,
            AFTER: -1e3,
            LOW: -1e5,
            LAST: -1e6,
        }
        const callbacks = {
            [RUN_AT.DOM_LOADED]: [],
            [RUN_AT.DOM_LOADED_AFTER]: [],
            [RUN_AT.COMPLETE]: [],
        }
        const util_page_valid = () => true // 是否要运行
        const dclCreator = function (runAt) {
            let dcl = function () {
                util_init.atRun = runAt // 更新运行状态
                const valid = util_page_valid()
                // 优先级从大到小, index从小到大, 排序
                callbacks[runAt].sort((a, b) => b.priority - a.priority || a.index - b.index)
                    .filter(item => valid || item.always)
                    .forEach(item => item.func(valid))
            }
            return dcl
        }

        if (window.document.readyState !== 'loading') {
            throw new Error('unit_init must run at loading, current is ' + document.readyState)
        }

        window.document.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED))
        window.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED_AFTER))
        window.addEventListener('load', dclCreator(RUN_AT.COMPLETE))

        const util_init = function (func, priority = PRIORITY.DEFAULT, runAt = RUN_AT.DOM_LOADED, always = false) {
            func = util_func_catched(func)
            if (util_init.atRun < runAt) { // 若还没运行到runAt指定的状态, 则放到队列里去 
                callbacks[runAt].push({
                    priority,
                    index: callbacks[runAt].length, // 使用callback数组的长度, 作为添加元素的index属性
                    func,
                    always
                })
            } else { // 否则直接运行
                let valid = util_page_valid()
                setTimeout(() => (valid || always) && func(valid), 1)
            }
            return func
        }
        util_init.atRun = -1 // 用来表示当前运行到什么状态
        util_init.RUN_AT = RUN_AT
        util_init.PRIORITY = PRIORITY
        return util_init
    }())
    /** 通知模块 剽窃自 YAWF 用户脚本 硬广：https://tiansh.github.io/yawf/ */
    const util_notify = (function () {
        var avaliable = {};
        var shown = [];
        var use = {
            'hasPermission': function () { return null; },
            'requestPermission': function (callback) { return null; },
            'hideNotification': function (notify) { return null; },
            'showNotification': function (id, title, body, icon, delay, onclick) { return null; }
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
                    setTimeout(function () { hideNotification(notify); }, delay);
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
            shown = shown.filter(function (x) { return x !== notify; });
        };

        document.addEventListener('unload', function () {
            shown.forEach(hideNotification);
            shown = [];
        });
        var showNotificationAnyway = function (id, title, body, icon, delay, onclick) {
            var that = this, thatArguments = arguments;
            switch (that.hasPermission()) {
                case null: // default
                    that.requestPermission(function () {
                        showNotificationAnyway.apply(that, thatArguments);
                    });
                    break;
                case true: // granted
                    // 只有已获取了授权, 才能有返回值...
                    return that.showNotification.apply(that, thatArguments);
                    break;
                case false: // denied
                    log('Notification permission: denied');
                    break;
            }
            return null;
        }

        return {
            'avaliableNotification': avaliableNotification,
            'choseNotification': choseNotification,
            'hasPermission': hasPermission,
            'requestPermission': requestPermission,
            'showNotification': showNotification,
            'hideNotification': hideNotification,
            show: function (body, onclick, delay = 3e3) {
                return this.showNotificationAnyway(Date.now(), GM_info.script.name, body, '//bangumi.bilibili.com/favicon.ico', delay, onclick)
            },
            showNotificationAnyway
        };
    }())
    const util_cookie = (function () {
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

        return new Proxy({ set: setCookie, get: getCookie, all: getCookies }, {
            get: function (target, prop) {
                if (prop in target) return target[prop]
                return getCookie(prop)
            },
            set: function (target, prop, value) {
                setCookie(prop, value)
                return true
            }
        })
    }())
    const util_ajax = function (options) {
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

    /**
     * 创建元素的快捷方法
     * @param type string, 标签名; 特殊的, 若为text, 则表示创建文字, 对应的t为文字的内容
     * @param props object, 属性; 特殊的属性名有: className, 类名; style, 样式, 值为(样式名, 值)形式的object; event, 值为(事件名, 监听函数)形式的object;
     * @param children array, 子元素;
     */
    const util_ui_element_creator = (type, props, children) => {
        let elem = null;
        if (type === "text") {
            return document.createTextNode(props);
        } else {
            elem = document.createElement(type);
        }
        for (let n in props) {
            if (n === "style") {
                for (let x in props.style) {
                    elem.style[x] = props.style[x];
                }
            } else if (n === "className") {
                elem.className = props[n];
            } else if (n === "event") {
                for (let x in props.event) {
                    elem.addEventListener(x, props.event[x]);
                }
            } else {
                elem.setAttribute(n, props[n]);
            }
        }
        if (children) {
            for (let i = 0; i < children.length; i++) {
                if (children[i] != null)
                    elem.appendChild(children[i]);
            }
        }
        return elem;
    }
    const _ = util_ui_element_creator
    const util_ui_popframe = function (iframeSrc) {
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

    /**
     * MessageBox -> from base.core.js
     * MessageBox.show(referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback)
     * MessageBox.close()
     */
    const util_ui_msg = (function () {
        function MockMessageBox() {
            this.show = (...args) => util_log(MockMessageBox.name, 'show', args)
            this.close = (...args) => util_log(MockMessageBox.name, 'close', args)
        }

        let popMessage = null
        let mockPopMessage = new MockMessageBox()
        let notifyPopMessage = {
            _current_notify: null,
            show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
                this.close()
                this._current_notify = util_notify.show(message, buttonTypeConfirmCallback, closeTime)
            },
            close: function () {
                if (this._current_notify) {
                    util_notify.hideNotification(this._current_notify)
                    this._current_notify = null
                }
            }
        }
        let alertPopMessage = {
            show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
                setTimeout(() => {
                    if (boxType === 'button') {
                        if (window.confirm(message)) {
                            buttonTypeConfirmCallback()
                        }
                    } else {
                        alert(message)
                    }
                }, 500)
            },
            close: util_func_noop
        }

        util_init(() => {
            if (!popMessage && window.MessageBox) {
                popMessage = new window.MessageBox()
                popMessage.close = function () {
                    // 若没调用过show, 就调用close, msgbox会为null, 导致报错
                    this.msgbox != null && window.MessageBox.prototype.close.apply(this, arguments)
                }
            }
        }, util_init.PRIORITY.FIRST, util_init.RUN_AT.DOM_LOADED_AFTER)

        return {
            _impl: function () {
                return popMessage || alertPopMessage
            },
            show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
                let pop = this._impl()
                return pop.show.apply(pop, arguments)
            },
            close: function () {
                let pop = this._impl()
                return pop.close.apply(pop, arguments)
            },
            setMsgBoxFixed: function (fixed) {
                if (popMessage) {
                    popMessage.msgbox[0].style.position = fixed ? 'fixed' : ''
                } else {
                    util_log(MockMessageBox.name, 'setMsgBoxFixed', fixed)
                }
            },
            showOnError: function (e) {
                if (e.readyState === 0) {
                    this.show($('.balh_settings'), '哎呀，服务器连不上了，确认一下连接？', 0, 'button', balh_ui_setting.show);
                }
            }
        }
    }())
    const util_ui_copy = function (text, textarea) {
        textarea.value = text
        textarea.select()
        try {
            return document.execCommand('copy')
        } catch (e) {
            util_error('复制文本出错', e)
        }
        return false
    }
    const util_url_param = function (url, key) {
        return (url.match(new RegExp('[?|&]' + key + '=(\\w+)')) || ['', ''])[1];
    }

    const util_page = {
        player: () => location.href.includes('www.bilibili.com/blackboard/html5player'),
        // 在av页面中的iframe标签形式的player
        player_in_av: util_func_catched(() => util_page.player() && window.top.location.href.includes('www.bilibili.com/video/av'), (e) => log(e), false),
        av: () => location.href.includes('www.bilibili.com/video/av'),
        bangumi: () => location.href.match(new RegExp('^https?://bangumi\\.bilibili\\.com/anime/\\d+/?$')),
        // movie页面使用window.aid, 保存当前页面av号
        movie: () => location.href.includes('bangumi.bilibili.com/movie/'),
        // anime页面使用window.season_id, 保存当前页面season号
        anime: () => location.href.match(new RegExp('^https?://bangumi\\.bilibili\\.com/anime/\\d+/play.*')),
        anime_ep: () => location.href.includes('www.bilibili.com/bangumi/play/ep'),
        anime_ss: () => location.href.includes('www.bilibili.com/bangumi/play/ss'),
    }

    const balh_config = (function () {
        const cookies = util_cookie.all() // 缓存的cookies
        return new Proxy({ /*保存config的对象*/ }, {
            get: function (target, prop) {
                if (prop in target) {
                    return target[prop]
                } else { // 若target中不存在指定的属性, 则从缓存的cookies中读取, 并保存到target中
                    let value = cookies['balh_' + prop]
                    switch (prop) {
                        case 'server':
                            value = value || r.const.server.defaultServer()
                            // 从tk域名迁移到新的默认域名
                            if (value.includes('biliplus.ipcjsdev.tk')) {
                                value = r.const.server.defaultServer()
                                balh_config.server = value
                            }
                            break
                        case 'mode':
                            value = value || (balh_config.blocked_vip ? r.const.mode.REDIRECT : r.const.mode.DEFAULT)
                            break
                        default:
                            // case 'blocked_vip':
                            // case 'flv_prefer_ws':
                            // case 'remove_pre_ad':
                            break
                    }
                    target[prop] = value
                    return value
                }
            },
            set: function (target, prop, value) {
                target[prop] = value // 更新值
                util_cookie['balh_' + prop] = value // 更新cookie中的值
                return true
            }
        })
    }())

    const balh_api_plus_view = function (aid, update = true) {
        return util_ajax(`${balh_config.server}/api/view?id=${aid}&update=${update}`)
    }
    const balh_api_plus_season = function (season_id) {
        return util_ajax(`${balh_config.server}/api/bangumi?season=${season_id}`)
    }

    const balh_feature_area_limit = (function () {
        function injectXHR() {
            util_debug('XMLHttpRequest的描述符:', Object.getOwnPropertyDescriptor(window, 'XMLHttpRequest'))
            let firstCreateXHR = true
            window.XMLHttpRequest = new Proxy(window.XMLHttpRequest, {
                construct: function (target, args) {
                    // 第一次创建XHR时, 打上断点...
                    if (firstCreateXHR && r.script.is_dev) {
                        firstCreateXHR = false
                        debugger
                    }
                    let container = {} // 用来替换responseText等变量
                    return new Proxy(new target(...args), {
                        set: function (target, prop, value, receiver) {
                            if (prop === 'onreadystatechange') {
                                let cb = value
                                value = function () {
                                    if (target.readyState === 4) {
                                        if (target.responseURL.includes('bangumi.bilibili.com/view/web_api/season/user/status')) {
                                            log('/season/user/status:', target.responseText)
                                            let json = JSON.parse(target.responseText)
                                            let rewriteResult = false
                                            if (json.code === 0 && json.result) {
                                                areaLimit(json.result.area_limit !== 0)
                                                if (json.result.area_limit !== 0) {
                                                    json.result.area_limit = 0 // 取消区域限制
                                                    rewriteResult = true
                                                }
                                                if (balh_config.blocked_vip) {
                                                    json.result.pay = 1
                                                    rewriteResult = true
                                                }
                                                if (rewriteResult) {
                                                    container.responseText = JSON.stringify(json)
                                                }
                                            }
                                        } else if (target.responseURL.includes('bangumi.bilibili.com/web_api/season_area')) {
                                            log('/season_area', target.responseText)
                                            let json = JSON.parse(target.responseText)
                                            if (json.code === 0 && json.result) {
                                                areaLimit(json.result.play === 0)
                                                if (json.result.play === 0) {
                                                    json.result.play = 1
                                                    container.responseText = JSON.stringify(json)
                                                }
                                            }
                                        } else if (target.responseURL.includes('api.bilibili.com/x/web-interface/nav')) {
                                            let json = JSON.parse(target.responseText)
                                            log('/x/web-interface/nav', json.data
                                                ? { isLogin: json.data.isLogin, vipType: json.data.vipType, vipStatus: json.data.vipStatus }
                                                : target.responseText)
                                            if (json.code === 0 && json.data && balh_config.blocked_vip) {
                                                json.data.vipType = 2; // 类型, 年度大会员
                                                json.data.vipStatus = 1; // 状态, 启用
                                                container.responseText = JSON.stringify(json)
                                            }
                                        }
                                    }
                                    // 这里的this是原始的xhr, 在container.responseText设置了值时需要替换成代理对象
                                    cb.apply(container.responseText ? receiver : this, arguments)
                                }
                            }
                            target[prop] = value
                            return true
                        },
                        get: function (target, prop, receiver) {
                            if (prop in container) return container[prop]
                            let value = target[prop]
                            if (typeof value === 'function') {
                                let func = value
                                // open等方法, 必须在原始的xhr对象上才能调用...
                                value = function () {
                                    return func.apply(target, arguments)
                                }
                            }
                            return value
                        }
                    })
                }
            })
        }

        function injectAjax() {
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
                    if (needRedirect()) { // 对应redirect模式
                        param.url = one_api.transToProxyUrl(param.url);
                        param.type = 'GET';
                        delete param.data;
                        param.success = function (data) {
                            var returnVal = one_api.processProxySuccess(data);
                            log('Redirected request: get_source', returnVal);
                            oriSuccess(returnVal);
                        };
                        var oriError = param.error;
                        param.error = function (e) {
                            util_ui_msg.showOnError(e);
                            oriError(e);
                        };
                    } else { // 对应replace模式
                        param.success = function (json) {
                            log(json);
                            if (json.code === -40301 // 区域限制
                                || json.result.payment && json.result.payment.price != 0 && balh_config.blocked_vip) { // 需要付费的视频, 此时B站返回的cid是错了, 故需要使用代理服务器的接口
                                one_api.asyncAjaxByProxy(param.url, oriSuccess, function (e) {
                                    util_ui_msg.showOnError(e);
                                    oriSuccess(json); // 新的请求报错, 也应该返回原来的数据
                                });
                                areaLimit(true); // 只要默认模式才要跟踪是否有区域限制
                            } else {
                                areaLimit(false);
                                if ((balh_config.blocked_vip || balh_config.remove_pre_ad) && json.code === 0 && json.result.pre_ad) {
                                    json.result.pre_ad = 0; // 去除前置广告
                                }
                                oriSuccess(json); // 保证一定调用了原来的success
                            }
                        };
                    }
                } else if (param.url.match('/player/web_api/playurl') || param.url.match('/player/web_api/v2/playurl')) {
                    one_api = bilibiliApis._playurl;
                    if (needRedirect()) {
                        param.url = one_api.transToProxyUrl(param.url);
                        param.success = function (data) {
                            oriSuccess(one_api.processProxySuccess(data));
                        };
                        var oriError = param.error;
                        param.error = function (e) {
                            util_ui_msg.showOnError(e);
                            oriError(e);
                        };
                        log('Redirected request: bangumi playurl -> ', param.url);
                    } else {
                        param.success = function (json) {
                            // 获取视频地址 API
                            log(json);
                            if (balh_config.blocked_vip || json.code || isAreaLimitForPlayUrl(json)) {
                                one_api.asyncAjaxByProxy(param.url, oriSuccess, function (e) {
                                    util_ui_msg.showOnError(e);
                                    oriSuccess(json);
                                });
                                areaLimit(true);
                            } else {
                                areaLimit(false);
                                oriSuccess(json);
                            }
                        };
                    }
                } else if (param.url.match('//interface.bilibili.com/player?')) {
                    if (balh_config.blocked_vip) {
                        mySuccess = function (data) {
                            try {
                                var xml = new window.DOMParser().parseFromString(`<userstatus>${data.replace(/\&/g, '&amp;')}</userstatus>`, 'text/xml');
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
                } else if (param.url.match('//api.bilibili.com/x/ad/video?')) {
                    if (balh_config.remove_pre_ad) {
                        mySuccess = function (data) {
                            log('/ad/video', data)
                            if (data && data.code === 0 && data.data) {
                                data.data = [] // 移除广告接口返回的数据
                            }
                            oriSuccess(data)
                        }
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
            return util_cookie['balh_season_' + getSeasonId()];
        }

        function needRedirect() {
            return balh_config.mode === r.const.mode.REDIRECT || (balh_config.mode === r.const.mode.DEFAULT && isAreaLimitSeason())
        }

        function areaLimit(limit) {
            balh_config.mode === r.const.mode.DEFAULT && setAreaLimitSeason(limit)
        }

        function setAreaLimitSeason(limit) {
            var season_id = getSeasonId();
            util_cookie.set('balh_season_' + season_id, limit ? '1' : undefined, ''); // 第三个参数为'', 表示时Session类型的cookie
            log('setAreaLimitSeason', season_id, limit);
        }

        function getSeasonId() {
            var seasonId;
            // 取anime页面的seasonId
            try {
                // 若w, 是其frame的window, 则有可能没有权限, 而抛异常
                seasonId = window.season_id || window.top.season_id;
            } catch (e) {
                log(e);
            }
            if (!seasonId) {
                try {
                    seasonId = (window.top.location.pathname.match(/\/anime\/(\d+)/) || ['', ''])[1];
                } catch (e) {
                    log(e);
                }
            }

            // 若没取到, 则取movie页面的seasonId, 以m开头
            if (!seasonId) {
                try {
                    seasonId = (window.top.location.pathname.match(/\/movie\/(\d+)/) || ['', ''])[1];
                    if (seasonId) {
                        seasonId = 'm' + seasonId;
                    }
                } catch (e) {
                    log(e);
                }
            }

            // 若没取到, 则去新的番剧播放页面的ep或ss
            if (!seasonId) {
                try {
                    seasonId = (window.top.location.pathname.match(/\/bangumi\/play\/((ep|ss)\d+)/) || ['', ''])[1];
                } catch (e) {
                    log(e);
                }
            }

            // 最后, 若没取到, 则试图取出当前页面url中的aid
            if (!seasonId) {
                seasonId = util_url_param(window.location.href, 'aid');
                if (seasonId) {
                    seasonId = 'av' + seasonId;
                }
            }
            return seasonId || '000';
        }

        function isAreaLimitForPlayUrl(json) {
            return json.durl && json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627;
        }

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
                    return balh_config.server + '/api/view?id=' + window.aid + '&update=true';
                },
                processProxySuccess: function (data) {
                    if (data && data.list && data.list[0] && data.movie) {
                        return {
                            code: 0,
                            message: 'success',
                            result: {
                                cid: data.list[0].cid,
                                formal_aid: data.aid,
                                movie_status: balh_config.blocked_vip ? 2 : data.movie.movie_status, // 2, 大概是免费的意思?
                                pay_begin_time: 1507708800,
                                pay_timestamp: 0,
                                pay_user_status: data.movie.pay_user.status, // 一般都是0
                                player: data.list[0].type, // 一般为movie
                                vid: data.list[0].vid,
                                vip: { // 2+1, 表示年度大会员; 0+0, 表示普通会员
                                    vipType: balh_config.blocked_vip ? 2 : 0,
                                    vipStatus: balh_config.blocked_vip ? 1 : 0,
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
                    return balh_config.server + '/api/bangumi?season=' + window.season_id;
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
                        util_notify.show('代理服务器错误:' + JSON.stringify(data) + '\n点击刷新界面.', window.location.reload.bind(window.location));
                    }
                    var returnVal = found !== null
                        ? {
                            "code": 0,
                            "message": "success",
                            "result": {
                                "aid": found.av_id,
                                "cid": found.danmaku,
                                "episode_status": balh_config.blocked_vip ? 2 : found.episode_status,
                                "payment": { "price": "9876547210.33" },
                                "pay_user": {
                                    "status": balh_config.blocked_vip ? 1 : 0 // 是否已经支付过
                                },
                                "player": "vupload",
                                "pre_ad": 0,
                                "season_status": balh_config.blocked_vip ? 2 : data.result.season_status
                            }
                        }
                        : { code: -404, message: '不存在该剧集' };
                    return returnVal;
                }
            });
            var playurl = new BilibiliApi({
                transToProxyUrl: function (url) {
                    var params = url.split('?')[1];
                    // 只有在av页面中的iframe标签形式的player, 不需要插入'bangumi'参数, 其他页面都要插入这个参数
                    if (!util_page.player_in_av()) {
                        params = params.replace(/(cid=\d+)/, '$1|' + (url.match(/module=(\w+)/) || ['', 'bangumi'])[1])
                    }
                    return `${balh_config.server}/BPplayurl.php?${params}`;
                },
                processProxySuccess: function (data) {
                    // data有可能为null
                    if (data && data.code === -403) {
                        // window.alert('当前使用的服务器(' + balh_config.server + ')依然有区域限制');
                        util_notify.show(`突破黑洞失败，我们未能穿透敌人的盔甲\n当前代理服务器（${balh_config.server}）依然有区域限制Σ( ￣□￣||)`);
                    } else if (data === null || data.code) {
                        util_error(data);
                        util_notify.show(`突破黑洞失败\n${JSON.stringify(data)}\n点击刷新界面`, window.location.reload.bind(window.location));
                    } else if (isAreaLimitForPlayUrl(data)) {
                        util_error('>>area limit');
                        util_notify.show(`突破黑洞失败，需要登录\n点此进行登录`, balh_feature_sign.showLogin);
                    } else {
                        if (balh_config.flv_prefer_ws) {
                            data.durl.forEach(function (seg) {
                                var t, url, i;
                                if (!seg.url.includes('ws.acgvideo.com')) {
                                    for (i in seg.backup_url) {
                                        url = seg.backup_url[i];
                                        if (url.includes('ws.acgvideo.com')) {
                                            log('flv prefer use:', url);
                                            t = seg.url;
                                            seg.url = url;
                                            url = t;
                                            break;
                                        }
                                    }

                                }
                            });
                        }
                    }
                    return data;
                }
            })

            return {
                _get_source: util_page.movie() ? get_source_by_aid : get_source_by_season_id,
                _playurl: playurl
            };
        })();

        injectXHR();
        if (!window.jQuery) { // 若还未加载jQuery, 则监听
            var jQuery;
            Object.defineProperty(window, 'jQuery', {
                configurable: true, enumerable: true, set: function (v) {
                    jQuery = v;
                    injectAjax();// 设置jQuery后, 立即注入
                }, get: function () {
                    return jQuery;
                }
            });
        } else {
            injectAjax();
        }
    }())
    const balh_feature_remove_pre_ad = (function () {
        if (util_page.player()) {
            // 播放页面url中的pre_ad参数, 决定是否播放广告...
            if (balh_config.remove_pre_ad && util_url_param(location.href, 'pre_ad') == 1) {
                log('需要跳转到不含广告的url')
                location.href = location.href.replace(/&?pre_ad=1/, '')
            }
        }
    }())
    const balh_feature_check_html5 = (function () {
        function isHtml5Player() {
            return localStorage.defaulth5 === '1'
        }

        function checkHtml5() {
            var playerContent = document.querySelector('.player-content');
            if (!localStorage.balh_h5_not_first && !isHtml5Player() && window.GrayManager && playerContent) {
                new MutationObserver(function (mutations, observer) {
                    observer.disconnect();
                    localStorage.balh_h5_not_first = 'yes';
                    if (window.confirm(GM_info.script.name + '只在HTML5播放器下有效，是否切换到HTML5？')) {
                        window.GrayManager.clickMenu('change_h5');// change_flash, change_h5
                    }
                }).observe(playerContent, {
                    childList: true, // 监听child的增减
                    attributes: false, // 监听属性的变化
                });
            }
        }

        util_init(() => {
            // 除了播放器和番剧列表页面, 其他页面都需要检测html5
            if (!(util_page.bangumi() || util_page.player())) {
                checkHtml5()
            }
        })
        return isHtml5Player
    }())
    const balh_feature_runPing = function () {
        var pingOutput = document.getElementById('balh_server_ping');

        var xhr = new XMLHttpRequest(), testUrl = [r.const.server.S0, r.const.server.S1],
            testUrlIndex = 0, isReused = false, prevNow, outputArr = [];
        pingOutput.textContent = '正在进行服务器测速…';
        pingOutput.style.height = '100px';
        xhr.open('GET', '', true);
        xhr.onreadystatechange = function () {
            this.readyState == 4 && pingResult();
        };
        var pingLoop = function () {
            prevNow = performance.now();
            xhr.open('GET', testUrl[testUrlIndex] + '/api/bangumi', true);
            xhr.send();
        };
        var pingResult = function () {
            var duration = (performance.now() - prevNow) | 0;
            if (isReused)
                outputArr.push('\t复用连接：' + duration + 'ms'), isReused = false, testUrlIndex++;
            else
                outputArr.push(testUrl[testUrlIndex] + ':'), outputArr.push('\t初次连接：' + duration + 'ms'), isReused = true;
            pingOutput.textContent = outputArr.join('\n');
            testUrlIndex < testUrl.length ? pingLoop() : pingOutput.appendChild(_('a', { href: 'javascript:', event: { click: balh_feature_runPing } }, [_('text', '\n再测一次？')]));
        };
        pingLoop();
    }
    const balh_feature_sign = (function () {
        // 逻辑有点乱, 当前在如下情况才会弹一次登录提示框:
        // 1. 第一次使用
        // 2. 主站+服务器都退出登录后, 再重新登录主站
        function checkLoginState() {
            if (util_cookie["DedeUserID"] === undefined) {
                //未登录主站，强制指定值
                localStorage.balh_not_first_v3 = 1;
                localStorage.balh_login = 0;
                localStorage.balh_mainLogin = 0;
            } else if (localStorage.balh_mainLogin !== undefined) {
                //主站未登录变为登录，重置显示弹窗
                delete localStorage.balh_not_first_v3;
                delete localStorage.balh_login;
                delete localStorage.balh_mainLogin;
                delete localStorage.oauthTime;
            }
            if (!localStorage.balh_not_first_v3) {
                //第一次打开，确认是否已登陆；未登录显示确认弹窗
                localStorage.balh_not_first_v3 = 1;
                checkExpiretime(function () {
                    if (localStorage.oauthTime === undefined) {
                        localStorage.balh_login = 0;
                        util_ui_msg.show($('.balh_settings'), `看起来你是第一次使用${GM_info.script.name}<br>要不要考虑进行一下授权？<br><br>授权后可以观看区域限定番剧的1080P<br>（如果你是大会员或承包过这部番的话）<br><br>你可以随时在设置中打开授权页面`, 0, 'button', balh_feature_sign.showLogin);
                        util_ui_msg.setMsgBoxFixed(true)
                        /*if (confirm()) {
                            showLogin();
                        }*/
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
                script.src = balh_config.server + '/login?act=expiretime';
                loadCallback && script.addEventListener('load', loadCallback);
                document.head.appendChild(script);
            }
        }

        function showLogin() {
            var loginUrl = balh_config.server + '/login',
                iframeSrc = 'https://passport.bilibili.com/login?appkey=27eb53fc9058f8c3&api=' + encodeURIComponent(loginUrl) + '&sign=' + hex_md5('api=' + loginUrl + 'c2ed53a74eeefe3cf99fbd01d8c9c375');
            util_ui_popframe(iframeSrc);
            delete localStorage.balh_login;
        }

        function showLogout() {
            util_ui_popframe(balh_config.server + '/login?act=logout');
        }

        // 监听登录message
        window.addEventListener('message', function (e) {
            switch (e.data) {
                case 'BiliPlus-Login-Success':
                    //登入
                    document.head.appendChild(_('script', {
                        src: balh_config.server + '/login?act=getlevel',
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


        util_init(() => {
            if (!(util_page.player() || util_page.av())) {
                checkLoginState()
            }
        }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER)
        return {
            showLogin,
            showLogout,
        }
    }())
    const balh_feature_RedirectToBangumiOrInsertPlayer = (function () {
        // 重定向到Bangumi页面， 或者在当前页面直接插入播放页面
        function tryRedirectToBangumiOrInsertPlayer() {
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
            balh_api_plus_view(aid)
                .then(function (data) {
                    if (data.code) {
                        return Promise.reject(JSON.stringify(data));
                    }
                    // 计算当前页面的cid
                    for (var i = 0; i < data.list.length; i++) {
                        if (data.list[i].page == page) {
                            cid = data.list[i].cid;
                            break;
                        }
                    }
                    if (!data.bangumi) {
                        var generateSrc = function (aid, cid) {
                            return `//www.bilibili.com/blackboard/html5player.html?cid=${cid}&aid=${aid}&player_type=1`;
                        }
                        var generatePageList = function (pages) {
                            var $curPage = null;
                            function onPageBtnClick(e) {
                                e.target.className = 'curPage'
                                $curPage && ($curPage.className = '')

                                var index = e.target.attributes['data-index'].value;
                                iframe.src = generateSrc(aid, pages[index].cid);
                            }

                            return pages.map(function (item, index) {
                                var isCurPage = item.page == page
                                var $item = _('a', { 'data-index': index, className: isCurPage ? 'curPage' : '', event: { click: onPageBtnClick } }, [_('text', item.page + ': ' + item.part)])
                                if (isCurPage) $curPage = $item
                                return $item
                            });
                        }
                        // 当前av不属于番剧页面, 直接在当前页面插入一个播放器的iframe
                        var pageBodyEle = document.querySelector('.b-page-body');
                        var iframe = _('iframe', { className: 'player bilibiliHtml5Player', style: { position: 'relative' }, src: generateSrc(aid, cid) });

                        // 添加播放器
                        pageBodyEle.insertBefore(_('div', { className: 'player-wrapper' }, [
                            _('div', { className: 'main-inner' }, [
                                _('div', { className: 'v-plist' }, [
                                    _('div', { id: 'plist', className: 'plist-content open' }, generatePageList(data.list))
                                ])
                            ]),
                            _('div', { id: 'bofqi', className: 'scontent' }, [iframe])
                        ]), pageBodyEle.firstChild);
                        // 添加评论区
                        pageBodyEle.appendChild(_('div', { className: 'main-inner' }, [
                            _('div', { className: 'common report-scroll-module report-wrap-module', id: 'common_report' }, [
                                _('div', { className: 'b-head' }, [
                                    _('span', { className: 'b-head-t results' }),
                                    _('span', { className: 'b-head-t' }, [_('text', '评论')]),
                                    _('a', { className: 'del-log', href: `//www.bilibili.com/replydeletelog?aid=${aid}&title=${data.title}`, target: '_blank' }, [_('text', '查看删除日志')])
                                ]),
                                _('div', { className: 'comm', id: 'bbComment' }, [
                                    _('div', { id: 'load_comment', className: 'comm_open_btn', onclick: "var fb = new bbFeedback('.comm', 'arc');fb.show(" + aid + ", 1);", style: { cursor: 'pointer' } })
                                ])
                            ])
                        ]));
                        // 添加包含bbFeedback的js
                        document.head.appendChild(_('script', { type: 'text/javascript', src: '//static.hdslb.com/js/core-v5/base.core.js' }))

                        document.title = data.title;
                        msgBox.parentNode.remove(); // 移除 .error-container
                        // return Promise.reject('该AV号不属于任何番剧页');//No bangumi in api response
                    } else {
                        // 当前av属于番剧页面, 继续处理
                        season_id = data.bangumi.season_id;
                        return balh_api_plus_season(season_id);
                    }
                })
                .then(function (result) {
                    if (result === undefined) return // 上一个then不返回内容时, 不需要处理
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
                        var bangumi_url = `//bangumi.bilibili.com/anime/${season_id}/play#${episode_id}`;
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

        util_init(() => {
            if (util_page.av()) {
                tryRedirectToBangumiOrInsertPlayer()
            }
        })
        return true // 随便返回一个值...
    }())
    const bash_feature_FillSeasonList = (function () {
        function tryFillSeasonList() {
            var error_container, season_id;
            if (!(error_container = document.querySelector('div.error-container'))) {
                return;
            }
            if (!(season_id = window.location.pathname.match(/^\/anime\/(\d+)\/?$/)[1])) {
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
            }catch(e){util_error(e);}
            */

            var msg = _('a', { href: '//bangumi.bilibili.com/anime/' + season_id + '/play', style: { fontSize: '20px' } }, [_('text', `【${GM_info.script.name}】尝试获取视频列表中...`)]),
                content = _('div');

            error_container.insertBefore(content, error_container.firstChild);
            content.appendChild(msg);
            log('season>:', season_id);
            balh_api_plus_season(season_id)
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
                                    _('div', { className: 'text-wrp-num' }, [_('div', { className: 'text-wrp-num-content' }, [_('text', `第${i.index}话`)])]),
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

        util_init(() => {
            if (util_page.bangumi()) {
                tryFillSeasonList()
            }
        })
        return true
    }())

    const balh_ui_setting = (function () {
        function addSettingsButton() {
            var indexNav = document.getElementById('index_nav') || document.querySelector('.bangumi-nav-right'),
                bottom = '110px';
            if (indexNav == null) {
                document.head.appendChild(_('style', {}, [_('text', '.index-nav{opacity:1;display:block;bottom:50px;left:calc(50% + 500px);z-index:100} @media screen and (min-width:1160px){.index-nav{left:calc(50% + 590px)}}')]));
                indexNav = document.body.appendChild(_('div', {
                    id: 'index_nav',
                    className: 'index-nav'
                }));
                bottom = 0;
            } else {
                window.dispatchEvent(new Event('resize'));
                indexNav.style.display = 'block';
            }
            indexNav.appendChild(_('div', { className: 'n-i gotop balh_settings', style: { bottom: bottom }, title: GM_info.script.name + ' 设置', event: { click: showSettings } }, [_('div', { className: 'btn_gotop', style: { background: '#f6f9fa' } })]));
            indexNav.lastChild.firstChild.innerHTML = '<!-- https://www.flaticon.com/free-icon/saturn_53515 --><svg style="width:30px;height:50px;fill:rgb(153,162,170)" viewBox="0 0 612.017 612.017"><path d="M596.275,15.708C561.978-18.59,478.268,5.149,380.364,68.696c-23.51-7.384-48.473-11.382-74.375-11.382c-137.118,0-248.679,111.562-248.679,248.679c0,25.902,3.998,50.865,11.382,74.375C5.145,478.253-18.575,561.981,15.724,596.279c34.318,34.318,118.084,10.655,216.045-52.949c23.453,7.365,48.378,11.344,74.241,11.344c137.137,0,248.679-111.562,248.679-248.68c0-25.862-3.979-50.769-11.324-74.24C606.931,133.793,630.574,50.026,596.275,15.708zM66.435,545.53c-18.345-18.345-7.919-61.845,23.338-117.147c22.266,39.177,54.824,71.716,94.02,93.943C128.337,553.717,84.837,563.933,66.435,545.53z M114.698,305.994c0-105.478,85.813-191.292,191.292-191.292c82.524,0,152.766,52.605,179.566,125.965c-29.918,41.816-68.214,87.057-113.015,131.839c-44.801,44.819-90.061,83.116-131.877,113.034C167.303,458.76,114.698,388.479,114.698,305.994z M305.99,497.286c-3.156,0-6.236-0.325-9.354-0.459c35.064-27.432,70.894-58.822,106.11-94.059c35.235-35.235,66.646-71.046,94.058-106.129c0.153,3.118,0.479,6.198,0.479,9.354C497.282,411.473,411.469,497.286,305.99,497.286z M428.379,89.777c55.303-31.238,98.803-41.683,117.147-23.338c18.402,18.383,8.187,61.902-23.204,117.377C500.095,144.62,467.574,112.043,428.379,89.777z"/></svg>';
        }

        function _showSettings() {
            document.body.appendChild(settingsDOM);
            var form = settingsDOM.querySelector('form');
            // elements包含index的属性, 和以name命名的属性, 其中以name命名的属性是不可枚举的, 只能通过这种方式获取出来
            Object.getOwnPropertyNames(form.elements).forEach(function (name) {
                if (name.startsWith('balh_')) {
                    var key = name.replace('balh_', '')
                    var ele = form.elements[name]
                    if (ele.type === 'checkbox') {
                        ele.checked = balh_config[key];
                    } else {
                        ele.value = balh_config[key];
                    }
                }
            })
            document.body.style.overflow = 'hidden';
        }

        // 往顶层窗口发显示设置的请求
        function showSettings() {
            window.top.postMessage('balh-show-setting', '*')
        }

        // 只有顶层窗口才接收请求
        if (window === window.top) {
            window.addEventListener('message', (event) => {
                if (event.data === 'balh-show-setting') {
                    _showSettings()
                }
            })
        }

        function onSignClick(event) {
            settingsDOM.click();
            switch (event.target.attributes['data-sign']) {
                default:
                case 'in':
                    balh_feature_sign.showLogin();
                    break;
                case 'out':
                    balh_feature_sign.showLogout();
                    break;
            }
        }

        function onSettingsFormChange(e) {
            var name = e.target.name;
            var value = e.target.type === 'checkbox' ? (e.target.checked ? 'Y' : '') : e.target.value
            balh_config[name.replace('balh_', '')] = value
            log(name, ' => ', value);
        }

        // 第一次点击时:
        // 1. '复制日志&问题反馈' => '复制日志'
        // 2. 显示'问题反馈'
        // 3. 复制成功后请求跳转到GitHub
        // 之后的点击, 只是正常的复制功能~~
        function onCopyClick(event) {
            let issueLink = document.getElementById('balh-issue-link')
            let continueToIssue = issueLink.style.display === 'none'
            if (continueToIssue) {
                issueLink.style.display = 'inline'
                let copyBtn = document.getElementById('balh-copy-log')
                copyBtn.innerText = '复制日志'
            }

            let textarea = document.getElementById('balh-textarea-copy')
            textarea.style.display = 'inline-block'
            if (util_ui_copy(util_log_hub.getAllMsg(), textarea)) {
                textarea.style.display = 'none'
                util_ui_msg.show($(this),
                    continueToIssue ? '复制日志成功; 点击确定, 继续提交问题(需要GitHub帐号)\n请把日志粘贴到问题描述中' : '复制成功',
                    continueToIssue ? 0 : 3e3,
                    continueToIssue ? 'button' : undefined,
                    continueToIssue ? () => window.open(r.url.issue) : undefined)
            } else {
                util_ui_msg.show($(this), '复制失败, 请从下面的文本框手动复制', 5e3)
            }
        }

        let printSystemInfoOk = false

        // 鼠标移入设置底部的时候, 打印一些系统信息, 方便问题反馈
        function onMouseEnterSettingBottom(event) {
            if (!printSystemInfoOk) {
                printSystemInfoOk = true
                util_debug('userAgent', navigator.userAgent)
            }
        }

        var settingsDOM = _('div', { id: 'balh-settings', style: { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.7)', animationName: 'balh-settings-bg', animationDuration: '.5s', zIndex: 10000, cursor: 'pointer' }, event: { click: function (e) { if (e.target === this) util_ui_msg.close(), document.body.style.overflow = '', this.remove(); } } }, [
            _('style', {}, [_('text', r.css.settings)]),
            _('div', { style: { position: 'absolute', background: '#FFF', borderRadius: '10px', padding: '20px', top: '50%', left: '50%', width: '600px', transform: 'translate(-50%,-50%)', cursor: 'default' } }, [
                _('h1', {}, [_('text', `${GM_info.script.name} v${GM_info.script.version} 参数设置`)]),
                _('br'),
                _('form', { id: 'balh-settings-form', event: { change: onSettingsFormChange } }, [
                    _('text', '使用的服务器：'), _('br'),
                    _('div', { style: { display: 'flex' } }, [
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_server', value: r.const.server.S0 }), _('text', r.const.server.S0)]),
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_server', value: r.const.server.S1 }), _('text', r.const.server.S1)])
                    ]), _('br'),
                    _('div', { id: 'balh_server_ping', style: { whiteSpace: 'pre-wrap', overflow: 'auto' } }, [_('a', { href: 'javascript:', event: { click: balh_feature_runPing } }, [_('text', '服务器测速')])]), _('br'),
                    _('text', '脚本工作模式：'), _('br'),
                    _('div', { style: { display: 'flex' } }, [
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.DEFAULT }), _('text', '默认：自动判断')]),
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.REPLACE }), _('text', '替换：在需要时处理番剧')]),
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.REDIRECT }), _('text', '重定向：完全代理所有番剧')])
                    ]), _('br'),
                    _('text', '其他：'), _('br'),
                    _('div', { style: { display: 'flex' } }, [
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_blocked_vip' }), _('text', '被永封的大会员？'), _('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.md#大会员账号被b站永封了', target: '_blank' }, [_('text', '（详细说明）')])]),
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_flv_prefer_ws' }), _('text', '优先使用ws.acgvideo.com')]),
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_remove_pre_ad' }), _('text', '移除前置广告')]),
                    ]), _('br'),
                    _('a', { href: 'javascript:', 'data-sign': 'in', event: { click: onSignClick } }, [_('text', '帐号授权')]),
                    _('text', '　'),
                    _('a', { href: 'javascript:', 'data-sign': 'out', event: { click: onSignClick } }, [_('text', '取消授权')]),
                    _('text', '　　'),
                    _('a', { href: 'javascript:', event: { click: function () { util_ui_msg.show($(this), '如果你的帐号进行了付费，不论是大会员还是承包，<br>进行授权之后将可以在解除限制时正常享有这些权益<br><br>你可以随时在这里授权或取消授权<br><br>不进行授权不会影响脚本的正常使用，但可能会缺失1080P', 1e4); } } }, [_('text', '（这是什么？）')]),
                    _('br'), _('br'),
                    _('div', { style: { whiteSpace: 'pre-wrap' }, event: { mouseenter: onMouseEnterSettingBottom } }, [
                        _('a', { href: 'https://greasyfork.org/zh-CN/scripts/25718-%E8%A7%A3%E9%99%A4b%E7%AB%99%E5%8C%BA%E5%9F%9F%E9%99%90%E5%88%B6', target: '_blank' }, [_('text', '脚本主页')]),
                        _('text', '　'),
                        _('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.md', target: '_blank' }, [_('text', '帮助说明')]),
                        _('text', '　'),
                        _('a', { id: 'balh-copy-log', href: 'javascript:;', event: { click: onCopyClick } }, [_('text', '复制日志&问题反馈')]),
                        _('text', '　'),
                        _('a', { id: 'balh-issue-link', href: r.url.issue, target: '_blank', style: { display: 'none' } }, [_('text', '问题反馈')]),
                        _('text', '\n作者: ipcjs esterTion FlandreDaisuki　接口：BiliPlus')
                    ]),
                    _('textarea', { id: 'balh-textarea-copy', style: { display: 'none' } })
                ])
            ])
        ]);

        util_init(() => {
            if (!(util_page.player() || util_page.av())) {
                addSettingsButton()
            }
        }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER)
        return {
            dom: settingsDOM,
            show: showSettings,
        }
    }())

    function main() {
        util_log(
            'mode:', balh_config.mode,
            'blocked_vip:', balh_config.blocked_vip,
            'server:', balh_config.server,
            'flv_prefer_ws:', balh_config.flv_prefer_ws,
            'remove_pre_ad:', balh_config.remove_pre_ad,
            'readyState:', document.readyState
        )
        // 暴露接口
        window.bangumi_area_limit_hack = {
            setCookie: util_cookie.set,
            getCookie: util_cookie.get,
            login: balh_feature_sign.showLogin,
            logout: balh_feature_sign.showLogout,
            _clear_local_value: function () {
                delete localStorage.balh_not_first_v3;
                delete localStorage.balh_login;
                delete localStorage.balh_mainLogin;
                delete localStorage.oauthTime;
                delete localStorage.balh_h5_not_first;
            }
        }
    }

    main();
}

scriptSource(GM_info.scriptHandler);