// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      8.2.26
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效;
// @author       ipcjs
// @supportURL   https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md
// @compatible   chrome
// @compatible   firefox
// @license      MIT
// @require      https://static.hdslb.com/js/md5.js
// @include      *://www.bilibili.com/video/av*
// @include      *://www.bilibili.com/video/BV*
// @include      *://www.bilibili.com/bangumi/play/ep*
// @include      *://www.bilibili.com/bangumi/play/ss*
// @include      *://m.bilibili.com/bangumi/play/ep*
// @include      *://m.bilibili.com/bangumi/play/ss*
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/movie/*
// @include      *://www.bilibili.com/bangumi/media/md*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @include      *://www.bilibili.com/watchroom/*
// @include      *://space.bilibili.com/*
// @include      https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png*
// @run-at       document-start
// @grant        none
// ==/UserScript==

const log = console.log.bind(console, 'injector:')

if (location.href.match(/^https:\/\/www\.mcbbs\.net\/template\/mcbbs\/image\/special_photo_bg\.png/) != null) {
    if (location.href.match('access_key') != null && window.opener != null) {
        window.stop();
        document.children[0].innerHTML = '<title>BALH - 授权</title><meta charset="UTF-8" name="viewport" content="width=device-width">正在跳转……';
        window.opener.postMessage('balh-login-credentials: ' + location.href, '*');
    }
    return
}

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
    // @template-content
    var Strings;
    (function (Strings) {
        function multiply(str, multiplier) {
            let result = '';
            for (let i = 0; i < multiplier; i++) {
                result += str;
            }
            return result;
        }
        Strings.multiply = multiply;
        function toSnakeCase(str) {
            return str.replace(/[A-Z]/g, (a) => `_${a.toLowerCase()}`).replace(/^_/, "");
        }
        Strings.toSnakeCase = toSnakeCase;
        function getSearchParam(url, key) {
            return (url.match(new RegExp('[?|&]' + key + '=(\\w+)')) || ['', ''])[1];
        }
        Strings.getSearchParam = getSearchParam;
        function replaceTemplate(template, values) {
            return template.replace(/___(\w+)___/g, (match, name) => {
                return values[name];
            });
        }
        Strings.replaceTemplate = replaceTemplate;
        function escapeSpecialChars(str) {
            return str.replace(/\n/g, '\\\n')
                .replace(/"/g, '\\\"')
                .replace(/\r/g, '\\\r')
                .replace(/\t/g, '\\\t')
                .replace(/\b/g, '\\\b')
                .replace(/\f/g, '\\\f');
        }
        Strings.escapeSpecialChars = escapeSpecialChars;
    })(Strings || (Strings = {}));

    var Objects;
    (function (Objects) {
        function convertKeyToSnakeCase(obj) {
            // log(typeof obj, Array.isArray(obj), obj)
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    convertKeyToSnakeCase(item);
                }
            }
            else if (typeof obj === 'object') {
                const o = obj;
                for (const key of Object.keys(o)) {
                    const value = o[key];
                    convertKeyToSnakeCase(value);
                    o[Strings.toSnakeCase(key)] = value;
                }
            }
            return obj; // 该方法会修改传入的obj的内容, 返回obj只是为了调用方便...
        }
        Objects.convertKeyToSnakeCase = convertKeyToSnakeCase;
        function stringify(item) {
            if (typeof item === 'object') {
                try {
                    return JSON.stringify(item);
                }
                catch (e) {
                    console.debug(e);
                    return `${item}`;
                }
            }
            else {
                return item;
            }
        }
        Objects.stringify = stringify;
        function stringifyArray(arr) {
            return arr.map(stringify).join(' ');
        }
        Objects.stringifyArray = stringifyArray;
    })(Objects || (Objects = {}));

    const r_text = {
        ok: { en: 'OK', zh_cn: '确定', },
        close: { en: 'Close', zh_cn: '关闭' },
        welcome_to_acfun: '<p><b>缺B乐 了解下？</b></p>',
        version_remind: ``,
    };
    function _t(key) {
        const text = r_text[key];
        const lang = 'zh_cn';
        return typeof text === 'string' ? text : text[lang];
    }
    const TRUE = 'Y';
    const FALSE = '';
    const r = {
        html: {},
        css: {
            settings: '#balh-settings {font-size: 12px;color: #6d757a;}  #balh-settings h1 {color: #161a1e}  #balh-settings a {color: #00a1d6;}  #balh-settings a:hover {color: #f25d8e}  #balh-settings input {margin-left: 3px;margin-right: 3px;}  @keyframes balh-settings-bg { from {background: rgba(0, 0, 0, 0)} to {background: rgba(0, 0, 0, .7)} }  #balh-settings label {width: 100%;display: inline-block;cursor: pointer}  #balh-settings label:after {content: "";width: 0;height: 1px;background: #4285f4;transition: width .3s;display: block}  #balh-settings label:hover:after {width: 100%}  form {margin: 0}  #balh-settings input[type="radio"] {-webkit-appearance: radio;-moz-appearance: radio;appearance: radio;}  #balh-settings input[type="checkbox"] {-webkit-appearance: checkbox;-moz-appearance: checkbox;appearance: checkbox;} ',
        },
        attr: {},
        url: {
            issue: 'https://github.com/ipcjs/bilibili-helper/issues',
            issue_new: 'https://github.com/ipcjs/bilibili-helper/issues/new',
            readme: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md#%E8%A7%A3%E9%99%A4b%E7%AB%99%E5%8C%BA%E5%9F%9F%E9%99%90%E5%88%B6',
        },
        script: {
            is_dev: GM_info.script.name.includes('.dev'),
        },
        const: {
            mode: {
                /** 默认模式, 自动判断使用何种模式, 推荐; */
                DEFAULT: 'default',
                /** 替换模式, 替换有区域限制的视频的接口的返回值; */
                REPLACE: 'replace',
                /** 重定向模式, 直接重定向所有番剧视频的接口到代理服务器; 所有番剧视频都通过代理服务器获取视频地址, 如果代理服务器不稳定, 可能加载不出视频; */
                REDIRECT: 'redirect',
            },
            server: {
                S0: 'https://biliplus.ipcjs.top',
                S1: 'https://www.biliplus.com',
                CUSTOM: '__custom__',
                defaultServer: function () {
                    return this.S1;
                },
            },
            TRUE: TRUE,
            FALSE: FALSE,
        },
        regex: {
            /** api.bilibili.com的全站代理 */
            bilibili_api_proxy: /^https?:\/\/(?<user_pass>[\p{L}\d:_-]+@)?(?<user_server>[\p{L}\d_-]+(\.[\p{L}\d_-]+)+(:\d+)?)$/u,
        },
        baipiao: [
            { key: 'zomble_land_saga', match: () => { var _a, _b; return ((_b = (_a = window.__INITIAL_STATE__) === null || _a === void 0 ? void 0 : _a.epInfo) === null || _b === void 0 ? void 0 : _b.ep_id) === 251255; }, link: 'http://www.acfun.cn/bangumi/ab5022161_31405_278830', message: r_text.welcome_to_acfun },
            { key: 'zomble_land_saga', match: () => { var _a, _b; return ((_b = (_a = window.__INITIAL_STATE__) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.media_id) === 140772; }, link: 'http://www.acfun.cn/bangumi/aa5022161', message: r_text.welcome_to_acfun },
        ]
    };

    const tag = GM_info.script.name + '.msg';
    // 计算"楼层", 若当前window就是顶层的window, 则floor为0, 以此类推
    function computeFloor(w = window, floor = 0) {
        if (w === window.top) {
            return floor;
        }
        else {
            return computeFloor(w.parent, floor + 1);
        }
    }
    let floor = computeFloor();
    let msgList = [];
    if (floor === 0) { // 只有顶层的Window才需要收集日志
        window.addEventListener('message', (event) => {
            if (event.data instanceof Array && event.data[0] === tag) {
                let [/*tag*/ , fromFloor, msg] = event.data;
                msgList.push(Strings.multiply('    ', fromFloor) + msg);
            }
        });
    }
    const logHub = {
        msg: function (msg) {
            window.top.postMessage([tag, floor, msg], '*');
        },
        getAllMsg: function (replaces = {}) {
            let allMsg = msgList.join('\n');
            for (const k of Object.keys(replaces)) {
                allMsg = allMsg.replace(k, replaces[k]);
            }
            return allMsg;
        }
    };
    function logImpl(type) {
        if (r.script.is_dev) {
            // 直接打印, 会显示行数
            return window.console[type].bind(window.console, type + ':');
        }
        else {
            // 将log收集到util_log_hub中, 显示的行数是错误的...
            return function (...args) {
                args.unshift(type + ':');
                window.console[type].apply(window.console, args);
                logHub.msg(Objects.stringifyArray(args));
            };
        }
    }
    const util_log = logImpl('log');
    const util_info = logImpl('info');
    const util_debug = logImpl('debug');
    const util_warn = logImpl('warn');
    const util_error = logImpl('error');

    /** @see https://github.com/yujincheng08/BiliRoaming/blob/f689b138da7ac45d2591d375f19698c969844324/app/src/main/res/values/strings.xml#L112-L131 */
    const uposMap = {
        ks3: 'upos-sz-mirrorks3.bilivideo.com',
        ks3b: 'upos-sz-mirrorks3b.bilivideo.com',
        ks3c: 'upos-sz-mirrorks3c.bilivideo.com',
        ks32: 'upos-sz-mirrorks32.bilivideo.com',
        kodo: 'upos-sz-mirrorkodo.bilivideo.com',
        kodob: 'upos-sz-mirrorkodob.bilivideo.com',
        cos: 'upos-sz-mirrorcos.bilivideo.com',
        cosb: 'upos-sz-mirrorcosb.bilivideo.com',
        bos: 'upos-sz-mirrorbos.bilivideo.com',
        wcs: 'upos-sz-mirrorwcs.bilivideo.com',
        wcsb: 'upos-sz-mirrorwcsb.bilivideo.com',
        /** 不限CROS, 限制UA */
        hw: 'upos-sz-mirrorhw.bilivideo.com',
        hwb: 'upos-sz-mirrorhwb.bilivideo.com',
        upbda2: 'upos-sz-upcdnbda2.bilivideo.com',
        upws: 'upos-sz-upcdnws.bilivideo.com',
        uptx: 'upos-sz-upcdntx.bilivideo.com',
        uphw: 'upos-sz-upcdnhw.bilivideo.com',
        js: 'upos-tf-all-js.bilivideo.com',
        hk: 'cn-hk-eq-bcache-01.bilivideo.com',
        akamai: 'upos-hz-mirrorakam.akamaized.net',
    };
    var Converters;
    (function (Converters) {
        // https://greasyfork.org/zh-CN/scripts/398535-bv2av/code
        const table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF';
        const tr = {};
        for (var i = 0; i < 58; ++i) {
            tr[table[i]] = i;
        }
        const s = [11, 10, 3, 8, 4, 6];
        const xor = 177451812;
        const add = 8728348608;
        function bv2aid(bv) {
            let r = 0;
            for (let i = 0; i < 6; ++i) {
                r += tr[bv[s[i]]] * (58 ** i);
            }
            return String((r - add) ^ xor);
        }
        Converters.bv2aid = bv2aid;
        function aid2bv(x) {
            x = (x ^ xor) + add;
            const r = Array.from('BV1  4 1 7  ');
            for (let i = 0; i < 6; i++) {
                r[s[i]] = table[Math.trunc(x / (58 ** i)) % 58];
            }
            return r.join('');
        }
        Converters.aid2bv = aid2bv;
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
                        }
                        else {
                            if (typeof (obj[nodeName].push) == "undefined") { // 若老的属性没有push方法, 则把属性改成Array
                                var old = obj[nodeName];
                                obj[nodeName] = [];
                                obj[nodeName].push(old);
                            }
                            obj[nodeName].push(xml2obj(item));
                        }
                    }
                }
                else {
                    text = xml.textContent; // todo: 强转为非空是否有问题?
                    if (/^\d+(\.\d+)?$/.test(text)) {
                        obj = Number(text);
                    }
                    else if (text === 'true' || text === 'false') {
                        obj = Boolean(text);
                    }
                    else {
                        obj = text;
                    }
                }
                return obj;
            }
            catch (e) {
                util_error(e);
            }
        }
        Converters.xml2obj = xml2obj;
        function generateSign(params, key) {
            let s_keys = [];
            for (let i in params) {
                s_keys.push(i);
            }
            s_keys.sort();
            let data = "";
            for (let i = 0; i < s_keys.length; i++) {
                // encodeURIComponent 返回的转义数字必须为大写( 如 %2F )
                data += (data ? "&" : "") + s_keys[i] + "=" + encodeURIComponent(params[s_keys[i]]);
            }
            return {
                sign: hex_md5(data + key),
                params: data,
            };
        }
        Converters.generateSign = generateSign;
        /**
         * 直接替换host大多数时候似乎不行, 即使可以视频的分辨率也很低, 原因未知
         * @param replaceAkamai 详见:`BalhConfig.upos_replace_akamai`
         */
        function replaceUpos(data, host = uposMap.uptx, replaceAkamai) {
            var str = JSON.stringify(data);
            if (!str.includes("akamaized.net") || replaceAkamai) {
                str = str.replace(/:\\?\/\\?\/[^\/]+\\?\//g, `://${host}/`);
            }
            return JSON.parse(str);
        }
        Converters.replaceUpos = replaceUpos;
    })(Converters || (Converters = {}));

    /**
    * 创建元素的快捷方法:
    * 1. type, props, children
    * 2. type, props, innerHTML
    * 3. 'text', text
    * @param type string, 标签名; 特殊的, 若为text, 则表示创建文字, 对应的t为文字的内容
    * @param props object, 属性; 特殊的属性名有: className, 类名; style, 样式, 值为(样式名, 值)形式的object; event, 值为(事件名, 监听函数)形式的object;
    * @param children array, 子元素; 也可以直接是html文本;
    */
    function createElement(type, props, children) {
        let elem = null;
        if (type === "text") {
            return document.createTextNode(props);
        }
        else {
            elem = document.createElement(type);
        }
        for (let n in props) {
            if (n === "style") {
                for (let x in props.style) {
                    elem.style[x] = props.style[x];
                }
            }
            else if (n === "className") {
                elem.className = props[n];
            }
            else if (n === "event") {
                for (let x in props.event) {
                    elem.addEventListener(x, props.event[x]);
                }
            }
            else {
                // 用undefined表示不设置这个属性
                props[n] !== undefined && elem.setAttribute(n, props[n]);
            }
        }
        if (children) {
            if (typeof children === 'string') {
                elem.innerHTML = children;
            }
            else {
                for (let i = 0; i < children.length; i++) {
                    if (children[i] != null)
                        elem.appendChild(children[i]);
                }
            }
        }
        return elem;
    }

    // 继承系统的[Error]在ES5下可能不生效, 使用这个类替代
    // 详见: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    class Exception {
        constructor(message) {
            this.message = message;
        }
        toString() {
            return `Exception: ${this.message}`;
        }
    }

    // 在某些情况下, 页面中会修改window.Promise... 故我们要备份一下原始的Promise
    const Promise$1 = window.Promise;
    /**
    * 模仿RxJava中的compose操作符
    * @param transformer 转换函数, 传入Promise, 返回Promise; 若为空, 则啥也不做
    */
    Promise$1.prototype.compose = function (transformer) {
        return transformer ? transformer(this) : this;
    };
    var Async;
    (function (Async) {
        function timeout(timeout) {
            return new Promise$1((resolve, reject) => {
                setTimeout(resolve, timeout);
            });
        }
        Async.timeout = timeout;
        class RetryUntilTimeoutException extends Exception {
        }
        // 直到满足condition()为止, 才执行promiseCreator(), 创建Promise
        // https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
        function retryUntil(condition, promiseCreator, retryCount = Number.MAX_VALUE, interval = 1) {
            const loop = (time) => {
                if (!condition()) {
                    if (time < retryCount) {
                        return timeout(interval).then(loop.bind(null, time + 1));
                    }
                    else {
                        return Promise$1.reject(new RetryUntilTimeoutException(`retryUntil timeout, condition: ${condition.toString()}`));
                    }
                }
                else {
                    return promiseCreator();
                }
            };
            return loop(0);
        }
        Async.retryUntil = retryUntil;
        /**
        * @param promiseCreator  创建Promise的函数
        * @param resultTransformer 用于变换result的函数, 返回新的result或Promise
        * @param errorTransformer  用于变换error的函数, 返回新的error或Promise, 返回的Promise可以做状态恢复...
        */
        function wrapper(promiseCreator, resultTransformer, errorTransformer) {
            return function (...args) {
                return new Promise$1((resolve, reject) => {
                    // log(promiseCreator, ...args)
                    promiseCreator(...args)
                        .then(r => resultTransformer ? resultTransformer(r) : r)
                        .then(r => resolve(r))
                        .catch(e => {
                        e = errorTransformer ? errorTransformer(e) : e;
                        if (!(e instanceof Promise$1)) {
                            // 若返回值不是Promise, 则表示是一个error
                            e = Promise$1.reject(e);
                        }
                        e.then(r => resolve(r)).catch(e => reject(e));
                    });
                });
            };
        }
        Async.wrapper = wrapper;
        function requestByXhr(url) {
            return new Promise$1((resolve, reject) => {
                const req = new XMLHttpRequest();
                req.onreadystatechange = (event) => {
                    if (req.readyState === 4) {
                        if (req.status === 200) {
                            try {
                                resolve(JSON.parse(req.responseText));
                            }
                            catch (e) {
                                reject(req);
                            }
                        }
                        else {
                            reject(req);
                        }
                    }
                };
                req.withCredentials = true;
                let authorization = '';
                // 理论上来说网页中的请求不应该带username&password, 这里直接将它们替换成authorization header...
                const originUrl = new URL(url, document.location.href);
                if (originUrl.username && originUrl.password) {
                    authorization = "Basic " + btoa(`${originUrl.username}:${originUrl.password}`);
                    // 清除username&password
                    originUrl.username = '';
                    originUrl.password = '';
                    url = originUrl.href;
                }
                req.open('GET', url);
                if (authorization) {
                    req.setRequestHeader("Authorization", authorization);
                }
                req.send();
            });
        }
        function requestByJQuery(url) {
            const creator = () => new Promise$1((resolve, reject) => {
                let options = { url: url };
                const originUrl = new URL(url, document.location.href);
                // 同上
                if (originUrl.username && originUrl.password) {
                    options.headers = { 'Authorization': 'Basic ' + btoa(`${originUrl.username}:${originUrl.password}`) };
                    originUrl.username = '';
                    originUrl.password = '';
                    options.url = originUrl.href;
                }
                options.async === undefined && (options.async = true);
                options.xhrFields === undefined && (options.xhrFields = { withCredentials: true });
                options.success = function (data) {
                    resolve(data);
                };
                options.error = function (err) {
                    reject(err);
                };
                util_debug(`ajax: ${options.url}`);
                window.$.ajax(options);
            });
            // 重试 30 * 100 = 3s
            return retryUntil(() => {
                util_debug(`retryUntil.ajaxBy$: ${window.$}`);
                return window.$;
            }, creator, 30, 100);
        }
        function ajax(url) {
            // todo: 直接用fetch实现更简单?
            return requestByJQuery(url)
                .catch(e => {
                if (e instanceof RetryUntilTimeoutException) {
                    return requestByXhr(url);
                }
                else {
                    return Promise$1.reject(e);
                }
            });
        }
        Async.ajax = ajax;
        function jsonp(url) {
            return new Promise$1((resolve, reject) => {
                document.head.appendChild(createElement('script', {
                    src: url,
                    event: {
                        load: function () {
                            resolve();
                        },
                        error: function () {
                            reject();
                        }
                    }
                }));
            });
        }
        Async.jsonp = jsonp;
    })(Async || (Async = {}));

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
    const target = {
        set: setCookie,
        get: getCookie,
        all: getCookies,
    };
    /**
     * 模仿localStorage
     */
    const cookieStorage = new Proxy(target, {
        get: function (target, prop) {
            if (prop in target)
                return target[prop];
            if (typeof prop !== 'string')
                throw new TypeError(`unsupported prop=${String(prop)}`);
            return getCookie(prop);
        },
        set: function (target, prop, value) {
            if (typeof prop !== 'string')
                return false;
            setCookie(prop, value);
            return true;
        }
    });

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    var Func;
    (function (Func) {
        function noop() { }
        Func.noop = noop;
        function runCatching(func, onError) {
            let ret = function () {
                try {
                    return func.apply(this, arguments);
                }
                catch (e) {
                    if (onError)
                        return onError(e); // onError可以处理报错时的返回值
                    // 否则打印log, 并返回undefined
                    util_error('Exception while run %o: %o\n%o', func, e, e.stack);
                    return undefined;
                }
            };
            // 函数的name属性是不可写+可配置的, 故需要如下代码实现类似这样的效果: ret.name = func.name
            // 在Edge上匿名函数的name的描述符会为undefined, 需要做特殊处理, fuck
            let funcNameDescriptor = Object.getOwnPropertyDescriptor(func, 'name') || {
                value: '',
                writable: false,
                configurable: true,
            };
            Object.defineProperty(ret, 'name', funcNameDescriptor);
            return ret;
        }
        Func.runCatching = runCatching;
        Func.safeGet = (code) => {
            return eval(`
            (()=>{
                try{
                    return ${code}
                }catch(e){
                    console.warn(e.toString())
                    return null
                }
            })()
            `);
        };
    })(Func || (Func = {}));
    /**
     * TS不支持可选链赋值, 详见: https://github.com/tc39/proposal-optional-chaining#not-supported
     * 可以使用该方法简化书写
     * */
    function ifNotNull(value, block) {
        if (value != null) {
            block(value);
        }
    }

    const util_page = {
        player: () => location.href.includes('www.bilibili.com/blackboard/html5player'),
        // 在av页面中的iframe标签形式的player
        player_in_av: Func.runCatching(() => util_page.player() && window.top.location.href.includes('www.bilibili.com/video/av'), (e) => util_debug(e)),
        av: () => location.href.includes('www.bilibili.com/video/av') || location.href.includes('www.bilibili.com/video/BV'),
        av_new: function () { return this.av() && (window.__playinfo__ || window.__playinfo__origin); },
        bangumi: () => location.href.match(new RegExp('^https?://bangumi\\.bilibili\\.com/anime/\\d+/?$')),
        bangumi_md: () => location.href.includes('www.bilibili.com/bangumi/media/md'),
        // movie页面使用window.aid, 保存当前页面av号
        movie: () => location.href.includes('bangumi.bilibili.com/movie/'),
        // anime页面使用window.season_id, 保存当前页面season号
        anime: () => location.href.match(new RegExp('^https?://bangumi\\.bilibili\\.com/anime/\\d+/play.*')),
        anime_ep: () => location.href.includes('www.bilibili.com/bangumi/play/ep'),
        anime_ss: () => location.href.includes('www.bilibili.com/bangumi/play/ss'),
        anime_ep_m: () => location.href.includes('m.bilibili.com/bangumi/play/ep'),
        anime_ss_m: () => location.href.includes('m.bilibili.com/bangumi/play/ss'),
        new_bangumi: () => location.href.includes('www.bilibili.com/bangumi'),
        watchroom: () => location.href.includes("www.bilibili.com/watchroom"),
        get ssId() {
            var _a, _b;
            return (_b = (_a = window.__INITIAL_STATE__) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.ssId;
        },
    };

    const cookies = cookieStorage.all(); // 缓存的cookies
    const balh_config = new Proxy({ /*保存config的对象*/}, {
        get: function (target, prop) {
            if (typeof prop !== 'string')
                throw new TypeError(`unsupported prop: ${String(prop)}`);
            if (prop === 'server') {
                const server_inner = balh_config.server_inner;
                // 保证balh_config.server一定指向biliplus
                const server = server_inner === r.const.server.CUSTOM ? r.const.server.defaultServer() : server_inner;
                return server;
            }
            else if (prop === 'server_bilibili_api_proxy') {
                return r.regex.bilibili_api_proxy.test(balh_config.server_custom) ? balh_config.server_custom : undefined;
            }
            if (prop in target) {
                return target[prop];
            }
            else { // 若target中不存在指定的属性, 则从缓存的cookies中读取, 并保存到target中
                let value = cookies['balh_' + prop];
                switch (prop) {
                    case 'server_inner':
                        value = value || r.const.server.CUSTOM;
                        break;
                    case 'server_custom':
                        value = value || '';
                        break;
                    case 'server_custom_tw':
                        value = value || '';
                        break;
                    case 'server_custom_hk':
                        value = value || '';
                        break;
                    case 'server_custom_cn':
                        value = value || '';
                        break;
                    case 'server_custom_th':
                        value = value || '';
                        break;
                    case 'mode':
                        value = value || (balh_config.blocked_vip ? r.const.mode.REDIRECT : r.const.mode.DEFAULT);
                        break;
                    case 'flv_prefer_ws':
                        value = r.const.FALSE; // 关闭该选项
                        break;
                    case 'is_closed':
                        if (value == null) {
                            value = FALSE; // 默认为false
                        }
                        break;
                }
                target[prop] = value;
                return value;
            }
        },
        set: function (target, prop, value) {
            if (typeof prop !== 'string') {
                return false;
            }
            target[prop] = value; // 更新值
            cookieStorage['balh_' + prop] = value; // 更新cookie中的值
            return true;
        }
    });
    // 迁移到自定义代理服务器, 只会执行一次
    if (util_page.new_bangumi() && !localStorage.balh_migrate_to_2) {
        localStorage.balh_migrate_to_2 = r.const.TRUE;
        balh_config.server_inner = r.const.server.CUSTOM;
        balh_config.is_closed = FALSE;
        util_debug('迁移配置完成');
    }
    function isClosed() {
        return balh_config.is_closed || !balh_config.server_custom;
    }

    /**
     * 构建 mobi api 解析链接
     * host 举例: 'https://example.com'
     *
     * 参考：https://github.com/kghost/bilibili-area-limit/issues/16
     */
    function getMobiPlayUrl(originUrl, host, area) {
        // 合成泰区 url
        if (area == 'th') {
            return `${host}/intl/gateway/v2/ogv/playurl?${generateMobiPlayUrlParams(originUrl, area)}`;
        }
        // 合成完整 mobi api url
        return `${host}/pgc/player/api/playurl?${generateMobiPlayUrlParams(originUrl, area)}`;
    }
    function generateMobiPlayUrlParams(originUrl, area) {
        // 提取参数为数组
        let a = originUrl.split('?')[1].split('&');
        // 参数数组转换为对象
        let theRequest = {};
        for (let i = 0; i < a.length; i++) {
            let key = a[i].split("=")[0];
            let value = a[i].split("=")[1];
            // 给对象赋值
            theRequest[key] = value;
        }
        // 追加 mobi api 需要的参数
        theRequest.access_key = localStorage.access_key;
        if (area === 'th') {
            theRequest.appkey = '7d089525d3611b1c';
            theRequest.area = 'th';
            theRequest.build = '1001310';
            theRequest.mobi_app = 'bstar_a';
            theRequest.platform = 'android';
        }
        else {
            theRequest.appkey = '07da50c9a0bf829f';
            theRequest.area = area;
            theRequest.build = '5380700';
            theRequest.device = 'android';
            theRequest.mobi_app = 'android_b';
            theRequest.platform = 'android_b';
            theRequest.buvid = 'XY418E94B89774E201E22C5B709861B7712DD';
            // theRequest.fnval = '0'; // 强制 FLV
            theRequest.track_path = '0';
        }
        theRequest.force_host = '2'; // 强制音视频返回 https
        theRequest.ts = `${~~(Date.now() / 1000)}`;
        // 所需参数数组
        let param_wanted = ['access_key', 'appkey', 'area', 'build', 'buvid', 'cid', 'device', 'ep_id', 'fnval', 'fnver', 'force_host', 'fourk', 'mobi_app', 'platform', 'qn', 's_locale', 'season_id', 'track_path', 'ts'];
        // 生成 mobi api 参数字符串
        let mobi_api_params = '';
        for (let i = 0; i < param_wanted.length; i++) {
            if (theRequest.hasOwnProperty(param_wanted[i])) {
                mobi_api_params += param_wanted[i] + `=` + theRequest[param_wanted[i]] + `&`;
            }
        }
        // 准备明文
        let plaintext = '';
        if (area === 'th') {
            plaintext = mobi_api_params.slice(0, -1) + `acd495b248ec528c2eed1e862d393126`;
        }
        else {
            plaintext = mobi_api_params.slice(0, -1) + `25bdede4e1581c836cab73a48790ca6e`;
        }
        // 生成 sign
        let ciphertext = hex_md5(plaintext);
        return `${mobi_api_params}sign=${ciphertext}`;
    }
    function fixMobiPlayUrlJson(originJson) {
        return __awaiter(this, void 0, void 0, function* () {
            const codecsMap = {
                30120: 'avc1.64003C',
                30121: 'hev1.1.6.L156.90',
                30112: 'avc1.640028',
                30102: 'hev1.1.6.L120.90',
                30080: 'avc1.640028',
                30077: 'hev1.1.6.L120.90',
                30064: 'avc1.64001F',
                30066: 'hev1.1.6.L120.90',
                30032: 'avc1.64001E',
                30033: 'hev1.1.6.L120.90',
                30011: 'hev1.1.6.L120.90',
                30016: 'avc1.64001E',
                30006: 'avc1.64001E',
                30005: 'avc1.64001E',
                30280: 'mp4a.40.2',
                30232: 'mp4a.40.2',
                30216: 'mp4a.40.2',
                'nb2-1-30016': 'avc1.64001E',
                'nb2-1-30032': 'avc1.64001F',
                'nb2-1-30064': 'avc1.640028',
                'nb2-1-30080': 'avc1.640032',
                'nb2-1-30216': 'mp4a.40.2',
                'nb2-1-30232': 'mp4a.40.2',
                'nb2-1-30280': 'mp4a.40.2' // APP源 高码音频
            };
            const resolutionMap = {
                30120: [3840, 2160],
                30121: [3840, 2160],
                30112: [1920, 1080],
                30102: [1920, 1080],
                30080: [1920, 1080],
                30077: [1920, 1080],
                30064: [1280, 720],
                30066: [1280, 720],
                30032: [852, 480],
                30033: [852, 480],
                30011: [640, 360],
                30016: [640, 360],
                30006: [426, 240],
                30005: [256, 144],
            };
            const frameRateMap = {
                30120: '16000/672',
                30121: '16000/672',
                30112: '16000/672',
                30102: '16000/672',
                30080: '16000/672',
                30077: '16000/656',
                30064: '16000/672',
                30066: '16000/656',
                30032: '16000/672',
                30033: '16000/656',
                30011: '16000/656',
                30016: '16000/672',
                30006: '16000/672',
                30005: '16000/672',
            };
            let segmentBaseMap = {};
            function getId(url, default_value, get_filename = false) {
                if (get_filename) {
                    // 作为SegmentBaseMap的Key，在同一个页面下切换集数不至于出错
                    let path = url.split('?')[0];
                    let pathArr = path.split('/');
                    return pathArr[pathArr.length - 1].replace('.m4s', ''); // 返回文件名
                }
                let i = /(nb2-1-)?\d{5}\.m4s/.exec(url);
                if (i !== null) {
                    return i[0].replace('.m4s', '');
                }
                else {
                    return default_value;
                }
            }
            function getSegmentBase(url, id, range = '5000') {
                return new Promise((resolve, reject) => {
                    // 从 window 中读取已有的值
                    if (window.__segment_base_map__) {
                        if (window.__segment_base_map__.hasOwnProperty(id)) {
                            // console.log('SegmentBase read from cache ', window.__segment_base_map__[id], 'id=', id)
                            return resolve(window.__segment_base_map__[id]);
                        }
                    }
                    let xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    // TV 动画 range 通常在 4000~5000，剧场版动画大概 14000+
                    xhr.setRequestHeader('Range', `bytes=0-${range}`); // 下载前 5000 字节数据用于查找 sidx 位置
                    xhr.responseType = 'arraybuffer';
                    let data;
                    xhr.onload = function (oEvent) {
                        data = new Uint8Array(xhr.response);
                        let hex_data = Array.prototype.map.call(data, x => ('00' + x.toString(16)).slice(-2)).join(''); // 转换成 hex
                        let indexRangeStart = hex_data.indexOf('73696478') / 2 - 4; // 73696478 是 'sidx' 的 hex ，前面还有 4 个字节才是 sidx 的开始
                        let indexRagneEnd = hex_data.indexOf('6d6f6f66') / 2 - 5; // 6d6f6f66 是 'moof' 的 hex，前面还有 4 个字节才是 moof 的开始，-1为sidx结束位置
                        let result = ['0-' + String(indexRangeStart - 1), String(indexRangeStart) + '-' + String(indexRagneEnd)];
                        // 储存在 window，切换清晰度不用重新解析
                        if (window.__segment_base_map__) {
                            window.__segment_base_map__[id] = result;
                        }
                        else {
                            window.__segment_base_map__ = {};
                            window.__segment_base_map__[id] = result;
                        }
                        // console.log('get SegmentBase ', result, 'id=', id);
                        resolve(result);
                    };
                    xhr.send(null); // 发送请求
                });
            }
            let result = JSON.parse(JSON.stringify(originJson));
            result.dash.duration = Math.round(result.timelength / 1000);
            result.dash.minBufferTime = 1.5;
            result.dash.min_buffer_time = 1.5;
            // 异步构建 segmentBaseMap
            let taskList = [];
            // SegmentBase 最大 range 和 duration 的比值大概在 2.5~3.2，保险这里取 3.5
            let range = Math.round(result.dash.duration * 3.5);
            // 避免 太高或太低 导致 泡面番 和 剧场版 加载不了
            if (range < 1500) {
                range = 1500;
            }
            if (range > 20000) {
                range = 20000;
            }
            // 乱猜 range 导致泡面番播不出
            result.dash.video.forEach((video) => {
                if (video.backupUrl.length > 0 && video.backupUrl[0].indexOf('akamaized.net') > -1) {
                    // 有时候返回 bcache 地址, 直接访问 bcache CDN 会报 403，如果备用地址有 akam，替换为 akam
                    video.baseUrl = video.backupUrl[0];
                }
                taskList.push(getSegmentBase(video.baseUrl, getId(video.baseUrl, '30080', true), range.toString()));
            });
            result.dash.audio.forEach((audio) => {
                if (audio.backupUrl.length > 0 && audio.backupUrl[0].indexOf('akamaized.net') > -1) {
                    audio.baseUrl = audio.backupUrl[0];
                }
                taskList.push(getSegmentBase(audio.baseUrl, getId(audio.baseUrl, '30080', true), range.toString()));
            });
            yield Promise.all(taskList);
            if (window.__segment_base_map__)
                segmentBaseMap = window.__segment_base_map__;
            // 填充视频流数据
            result.dash.video.forEach((video) => {
                let video_id = getId(video.baseUrl, '30280');
                if (!codecsMap.hasOwnProperty(video_id)) {
                    // https://github.com/ipcjs/bilibili-helper/issues/775
                    // 泰区的视频URL不包含 id 了
                    video_id = (30000 + video.id).toString();
                }
                video.codecs = codecsMap[video_id];
                let segmentBaseId = getId(video.baseUrl, '30280', true);
                video.segment_base = {
                    initialization: segmentBaseMap[segmentBaseId][0],
                    index_range: segmentBaseMap[segmentBaseId][1]
                };
                video.SegmentBase = {
                    Initialization: segmentBaseMap[segmentBaseId][0],
                    indexRange: segmentBaseMap[segmentBaseId][1]
                };
                video_id = video_id.replace('nb2-1-', '');
                video.width = resolutionMap[video_id][0];
                video.height = resolutionMap[video_id][1];
                video.mimeType = 'video/mp4';
                video.mime_type = 'video/mp4';
                video.frameRate = frameRateMap[video_id];
                video.frame_rate = frameRateMap[video_id];
                video.sar = "1:1";
                video.startWithSAP = 1;
                video.start_with_sap = 1;
            });
            // 填充音频流数据
            result.dash.audio.forEach((audio) => {
                let audio_id = getId(audio.baseUrl, '30280');
                if (!codecsMap.hasOwnProperty(audio_id)) {
                    // https://github.com/ipcjs/bilibili-helper/issues/775
                    // 泰区的音频URL不包含 id 了
                    audio_id = audio.id.toString();
                }
                let segmentBaseId = getId(audio.baseUrl, '30280', true);
                audio.segment_base = {
                    initialization: segmentBaseMap[segmentBaseId][0],
                    index_range: segmentBaseMap[segmentBaseId][1]
                };
                audio.SegmentBase = {
                    Initialization: segmentBaseMap[segmentBaseId][0],
                    indexRange: segmentBaseMap[segmentBaseId][1]
                };
                audio.codecs = codecsMap[audio_id];
                audio.mimeType = 'audio/mp4';
                audio.mime_type = 'audio/mp4';
                audio.frameRate = '';
                audio.frame_rate = '';
                audio.height = 0;
                audio.width = 0;
            });
            return result;
        });
    }
    function fixThailandPlayUrlJson(originJson) {
        return __awaiter(this, void 0, void 0, function* () {
            let origin = JSON.parse(JSON.stringify(originJson));
            let result = {
                'format': 'flv720',
                'type': 'DASH',
                'result': 'suee',
                'video_codecid': 7,
                'no_rexcode': 0,
                'code': origin.code,
                'message': +origin.message,
                'timelength': origin.data.video_info.timelength,
                'quality': origin.data.video_info.quality,
                'accept_format': 'hdflv2,flv,flv720,flv480,mp4',
            };
            let dash = {
                'duration': 0,
                'minBufferTime': 0.0,
                'min_buffer_time': 0.0,
                'audio': []
            };
            // 填充音频流数据
            origin.data.video_info.dash_audio.forEach((audio) => {
                audio.backupUrl = [];
                audio.backup_url = [];
                audio.base_url = audio.base_url.replace('http://', 'https://');
                audio.baseUrl = audio.base_url;
                dash.audio.push(audio);
            });
            // 填充视频流数据
            let accept_quality = [];
            let accept_description = [];
            let support_formats = [];
            let dash_video = [];
            origin.data.video_info.stream_list.forEach((stream) => {
                support_formats.push(stream.stream_info);
                accept_quality.push(stream.stream_info.quality);
                accept_description.push(stream.stream_info.new_description);
                // 只加入有视频链接的数据
                if (stream.dash_video && stream.dash_video.base_url) {
                    stream.dash_video.backupUrl = [];
                    stream.dash_video.backup_url = [];
                    stream.dash_video.base_url = stream.dash_video.base_url.replace('http://', 'https://');
                    stream.dash_video.baseUrl = stream.dash_video.base_url;
                    stream.dash_video.id = stream.stream_info.quality;
                    dash_video.push(stream.dash_video);
                }
            });
            dash['video'] = dash_video;
            result['accept_quality'] = accept_quality;
            result['accept_description'] = accept_description;
            result['support_formats'] = support_formats;
            result['dash'] = dash;
            // 下面参数取自安达(ep359333)，总之一股脑塞进去（
            result['fnval'] = 80;
            result['fnver'] = 0;
            result['status'] = 2;
            result['vip_status'] = 1;
            result['vip_type'] = 2;
            result['seek_param'] = 'start';
            result['seek_type'] = 'offset';
            result['bp'] = 0;
            result['from'] = 'local';
            result['has_paid'] = false;
            result['is_preview'] = 0;
            return fixMobiPlayUrlJson(result);
        });
    }
    var BiliPlusApi;
    (function (BiliPlusApi) {
        BiliPlusApi.view = function (aid, update = true) {
            return Async.ajax(`${balh_config.server}/api/view?id=${aid}&update=${update}${access_key_param_if_exist()}`);
        };
        BiliPlusApi.season = function (season_id) {
            return Async.ajax(`${balh_config.server}/api/bangumi?season=${season_id}${access_key_param_if_exist()}`);
        };
        // https://www.biliplus.com/BPplayurl.php?otype=json&cid=30188339&module=bangumi&qn=16&src=vupload&vid=vupload_30188339
        // qn = 16, 能看
        BiliPlusApi.playurl = function (cid, qn = 16, bangumi = true) {
            return Async.ajax(`${balh_config.server}/BPplayurl.php?otype=json&cid=${cid}${bangumi ? '&module=bangumi' : ''}&qn=${qn}&src=vupload&vid=vupload_${cid}${access_key_param_if_exist()}`);
        };
        // https://www.biliplus.com/api/h5play.php?tid=33&cid=31166258&type=vupload&vid=vupload_31166258&bangumi=1
        BiliPlusApi.playurl_for_mp4 = (cid, bangumi = true) => Async.ajax(`${balh_config.server}/api/h5play.php?tid=33&cid=${cid}&type=vupload&vid=vupload_${cid}&bangumi=${bangumi ? 1 : 0}${access_key_param_if_exist()}`)
            .then(text => (text.match(/srcUrl=\{"mp4":"(https?.*)"\};/) || ['', ''])[1]); // 提取mp4的url
    })(BiliPlusApi || (BiliPlusApi = {}));

    const access_key_param_if_exist = function (isKghost = false) {
        // access_key是由B站验证的, B站帐号和BP帐号不同时, access_key无效
        // kghost的服务器使用的B站帐号, access_key有效
        return (localStorage.access_key && (!balh_config.blocked_vip || isKghost)) ? `&access_key=${localStorage.access_key}` : '';
    };
    const platform_android_param_if_app_only = function () {
        return window.__balh_app_only__ ? '&platform=android&fnval=0' : '';
    };
    class BiliBiliApi {
        constructor(server = '//api.bilibili.com') {
            this.server = server;
        }
        getSeasonInfoByEpId(ep_id) {
            return Async.ajax(`${this.server}/pgc/view/web/season?ep_id=${ep_id}`);
        }
        getSeasonInfo(season_id) {
            return Async.ajax(`${this.server}/pgc/view/web/season?season_id=${season_id}`);
        }
        getSeasonInfoByEpSsIdOnBangumi(ep_id, season_id) {
            return Async.ajax('//bangumi.bilibili.com/view/web_api/season?' + (ep_id != '' ? `ep_id=${ep_id}` : `season_id=${season_id}`));
        }
        getSeasonInfoByEpSsIdOnThailand(ep_id, season_id) {
            const params = '?' + (ep_id != '' ? `ep_id=${ep_id}` : `season_id=${season_id}`) + `&mobi_app=bstar_a&s_locale=zh_SG`;
            const newParams = generateMobiPlayUrlParams(params, 'th');
            return Async.ajax(`${this.server}/intl/gateway/v2/ogv/view/app/season?` + newParams);
        }
    }

    var ui;
    (function (ui) {
        ui.alert = function (message, resolve, reject) {
            setTimeout(() => {
                if (resolve) {
                    if (window.confirm(message)) {
                        resolve();
                    }
                    else {
                        if (reject) {
                            reject();
                        }
                    }
                }
                else {
                    window.alert(message);
                }
            }, 500);
        };
        function prompt(message, defaultValue) {
            return __awaiter(this, void 0, void 0, function* () {
                yield Async.timeout(500);
                return window.prompt(message, defaultValue);
            });
        }
        ui.prompt = prompt;
        ui.copy = function (text, textarea) {
            textarea.value = text;
            textarea.select();
            try {
                return document.execCommand('copy');
            }
            catch (e) {
                util_error('复制文本出错', e);
            }
            return false;
        };
        /**
         * - param.content: 内容元素数组/HTML
         * - param.showConfirm: 是否显示确定按钮
         * - param.confirmBtn: 确定按钮的文字
         * - param.onConfirm: 确定回调
         * - param.onClose: 关闭回调
         */
        ui.pop = function (param) {
            var _a;
            if (typeof param.content === 'string') {
                let template = createElement('template');
                template.innerHTML = param.content.trim();
                param.content = Array.from(template.content.childNodes);
            }
            else if (!(param.content instanceof Array)) {
                util_log(`param.content(${param.content}) 不是数组`);
                return;
            }
            if (document.getElementById('AHP_Notice_style') == null) {
                let noticeWidth = Math.min(500, innerWidth - 40);
                document.head.appendChild(createElement('style', { id: 'AHP_Notice_style' }, [createElement('text', `#AHP_Notice{ line-height:normal;position:fixed;left:0;right:0;top:0;height:0;z-index:20000;transition:.5s;cursor:default;pointer-events:none } .AHP_down_banner{ margin:2px;padding:2px;color:#FFFFFF;font-size:13px;font-weight:bold;background-color:green } .AHP_down_btn{ margin:2px;padding:4px;color:#1E90FF;font-size:14px;font-weight:bold;border:#1E90FF 2px solid;display:inline-block;border-radius:5px } body.ABP-FullScreen{ overflow:hidden } @keyframes pop-iframe-in{0%{opacity:0;transform:scale(.7);}100%{opacity:1;transform:scale(1)}} @keyframes pop-iframe-out{0%{opacity:1;transform:scale(1);}100%{opacity:0;transform:scale(.7)}} #AHP_Notice>div{ position:absolute;bottom:0;left:0;right:0;font-size:15px } #AHP_Notice>div>div{ border:1px #AAA solid;width:${noticeWidth}px;margin:0 auto;padding:20px 10px 5px;background:#EFEFF4;color:#000;border-radius:5px;box-shadow:0 0 5px -2px;pointer-events:auto;white-space:pre-wrap } #AHP_Notice>div>div *{ margin:5px 0; } #AHP_Notice input[type=text]{ border: none;border-bottom: 1px solid #AAA;width: 60%;background: transparent } #AHP_Notice input[type=text]:active{ border-bottom-color:#4285f4 } #AHP_Notice input[type=button] { border-radius: 2px; border: #adadad 1px solid; padding: 3px; margin: 0 5px; min-width:50px } #AHP_Notice input[type=button]:hover { background: #FFF; } #AHP_Notice input[type=button]:active { background: #CCC; } .noflash-alert{display:none}`)]));
            }
            (_a = document.querySelector('#AHP_Notice')) === null || _a === void 0 ? void 0 : _a.remove();
            let div = createElement('div', { id: 'AHP_Notice' });
            let children = [];
            if (param.showConfirm || param.confirmBtn || param.onConfirm) {
                children.push(createElement('input', { value: param.confirmBtn || _t('ok'), type: 'button', className: 'confirm', event: { click: param.onConfirm } }));
            }
            children.push(createElement('input', {
                value: _t('close'), type: 'button', className: 'close', event: {
                    click: function () {
                        param.onClose && param.onClose();
                        div.style.height = '0';
                        setTimeout(function () { div.remove(); }, 500);
                    }
                }
            }));
            div.appendChild(createElement('div', {}, [createElement('div', {}, param.content.concat([createElement('hr'), createElement('div', { style: { textAlign: 'right' } }, children)]))]));
            document.body.appendChild(div);
            div.style.height = div.firstChild.offsetHeight + 'px';
        };
        ui.playerMsg = function (message) {
            const msg = Objects.stringify(message);
            util_info('player msg:', msg);
            const $panel = document.querySelector('.bilibili-player-video-panel-text');
            if ($panel) {
                let stage = $panel.children.length + 1000; // 加1000和B站自己发送消息的stage区别开来
                $panel.appendChild(createElement('div', { className: 'bilibili-player-video-panel-row', stage: stage }, [createElement('text', `[${GM_info.script.name}] ${msg}`)]));
            }
        };
        ui.popFrame = function (iframeSrc) {
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
        };
    })(ui || (ui = {}));

    const RUN_AT = {
        // readyState = loading
        LOADING: -1,
        // readyState = interactive
        DOM_LOADED: 0,
        // readyState = interactive
        DOM_LOADED_AFTER: 1,
        // readyState = complete
        COMPLETE: 2,
    };
    const PRIORITY = {
        FIRST: 1e6,
        HIGH: 1e5,
        BEFORE: 1e3,
        DEFAULT: 0,
        AFTER: -1e3,
        LOW: -1e5,
        LAST: -1e6,
    };
    const callbacks = {
        [RUN_AT.LOADING]: [],
        [RUN_AT.DOM_LOADED]: [],
        [RUN_AT.DOM_LOADED_AFTER]: [],
        [RUN_AT.COMPLETE]: [],
    };
    function showWarn() {
        util_warn(`${GM_info.script.name} ${window.document.readyState} 加载时机不太对, 不能保证正常工作\n\n1. 尝试刷新页面, 重载脚本\n2. 若依然出现该提示, 请尝试'硬性重新加载'(快捷键一般为ctrl+f5)\n3. 若还是出现该提示, 请尝试关闭再重新打开该页面\n4. 若反复出现该提示, 那也没其他办法了_(:3」∠)_\n`);
    }
    let atRun; // 用来表示当前运行到什么状态
    switch (window.document.readyState) {
        case 'loading':
            atRun = RUN_AT.LOADING;
            break;
        case 'interactive':
            showWarn();
            atRun = RUN_AT.DOM_LOADED_AFTER;
            break;
        case 'complete':
            showWarn();
            atRun = RUN_AT.COMPLETE;
            break;
    }
    util_debug(`atRun: ${atRun}, ${window.document.readyState}`);
    const util_page_valid = () => true; // 是否要运行
    const dclCreator = function (runAt) {
        let dcl = function () {
            util_debug(`atRun: ${runAt}, ${window.document.readyState}`);
            atRun = runAt; // 更新运行状态
            const valid = util_page_valid();
            // 优先级从大到小, index从小到大, 排序
            callbacks[runAt].sort((a, b) => b.priority - a.priority || a.index - b.index)
                .filter(item => valid )
                .forEach(item => item.func(valid));
        };
        return dcl;
    };
    window.document.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED));
    window.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED_AFTER));
    window.addEventListener('load', dclCreator(RUN_AT.COMPLETE));
    const util_init = function (func, priority = PRIORITY.DEFAULT, runAt = RUN_AT.DOM_LOADED, always = false) {
        func = Func.runCatching(func);
        if (atRun < runAt) { // 若还没运行到runAt指定的状态, 则放到队列里去
            callbacks[runAt].push({
                priority,
                index: callbacks[runAt].length,
                func,
                always
            });
        }
        else { // 否则直接运行, TODO: 这种情况下优先级得不到保证...
            let valid = util_page_valid();
            {
                func(valid);
            }
        }
    };
    util_init.RUN_AT = RUN_AT;
    util_init.PRIORITY = PRIORITY;

    // @ts-check-off
    /**
     * 通知模块 剽窃自 YAWF 用户脚本 硬广：https://tiansh.github.io/yawf/ 
     * 
     * 由于目前基本上没用上, 故懒得标注类型(-_-#)
     * */

    var available = {};
    var shown = [];
    var use = {
        'hasPermission': function () { return null; },
        'requestPermission': function (callback) { return null; },
        'hideNotification': function (notify) { return null; },
        'showNotification': function (id, title, body, icon, delay, onclick) { return null; }
    };

    // webkitNotifications
    // Tab Notifier 扩展实现此接口，但显示的桌面提示最多只能显示前两行
    if (typeof webkitNotifications !== 'undefined') available.webkit = {
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
    if (typeof Notification !== 'undefined') available.standard = {
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
    // 选择用哪个接口
    var choseNotification = function (prefer) {
        return (use = prefer && available[prefer] || available.standard);
    };
    choseNotification();
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

    // @ts-check-off
    /**
     * {@link BiliMessageBox}
     * MessageBox -> from base.core.js
     * MessageBox.show(referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback)
     * MessageBox.close()
     */
    let popMessage = null;
    let alertPopMessage = {
        show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
            ui.alert(message, buttonTypeConfirmCallback);
        },
        close: Func.noop
    };
    util_init(() => {
        if (!popMessage && window.MessageBox) {
            popMessage = new window.MessageBox();
            let orignShow = popMessage.show;
            popMessage.show = function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
                // 这个窗，有一定机率弹不出来。。。不知道为什么
                orignShow.call(this, referenceElement, message.replace('\n', '<br>'), closeTime, boxType, buttonTypeConfirmCallback);
            };
            popMessage.close = function () {
                // 若没调用过show, 就调用close, msgbox会为null, 导致报错
                this.msgbox != null && window.MessageBox.prototype.close.apply(this, []);
            };
        }
    }, util_init.PRIORITY.FIRST, util_init.RUN_AT.DOM_LOADED_AFTER);
    const util_ui_msg = {
        _impl: function () {
            return popMessage || alertPopMessage;
        },
        show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
            let pop = this._impl();
            return pop.show.apply(pop, arguments);
        },
        close: function () {
            let pop = this._impl();
            return pop.close.apply(pop, arguments);
        },
        setMsgBoxFixed: function (fixed) {
            if (popMessage) {
                popMessage.msgbox[0].style.position = fixed ? 'fixed' : '';
            }
            else {
                util_log('MockMessageBox', 'setMsgBoxFixed', fixed);
            }
        },
        showOnNetError: function (e) {
            if (e.readyState === 0) {
                this.show(window.$('.balh_settings'), '哎呀，服务器连不上了，进入设置窗口，换个服务器试试？', 0, 'button', window.bangumi_area_limit_hack.showSettings);
            }
        },
        showOnNetErrorInPromise: function () {
            return (p) => p
                .catch((e) => {
                this.showOnNetError(e);
                return Promise.reject(e);
            });
        }
    };

    var RegExps;
    (function (RegExps) {
        const _raw = (str) => str.replace(/(\.|\?)/g, '\\$1');
        RegExps.url = (url) => new RegExp(`^(https?:)?//${_raw(url)}`);
        RegExps.urlPath = (path) => new RegExp(`^(https?:)?//[\\w\\-\\.]+${_raw(path)}`);
    })(RegExps || (RegExps = {}));

    function switch_to_old_player() {
        if (util_page.av() && !localStorage.balh_disable_switch_to_old_player) {
            util_init(() => {
                const $switchToOldBtn = document.querySelector('#entryOld > .old-btn > a');
                if ($switchToOldBtn) {
                    ui.pop({
                        content: `${GM_info.script.name} 对新版播放器的支持还在测试阶段, 不稳定, 推荐切换回旧版`,
                        confirmBtn: '切换回旧版',
                        onConfirm: () => $switchToOldBtn.click(),
                        onClose: () => localStorage.balh_disable_switch_to_old_player = r.const.TRUE,
                    });
                }
            });
        }
        if (util_page.new_bangumi()) {
            if (cookieStorage.stardustpgcv === '0606') {
                util_init(() => {
                    let $panel = document.querySelector('.error-container > .server-error');
                    if ($panel) {
                        $panel.insertBefore(createElement('text', '临时切换到旧版番剧页面中...'), $panel.firstChild);
                        cookieStorage.stardustpgcv = '0';
                        localStorage.balh_temp_switch_to_old_page = r.const.TRUE;
                        location.reload();
                    }
                });
            }
            if (localStorage.balh_temp_switch_to_old_page) {
                cookieStorage.stardustpgcv = '0606';
                delete localStorage.balh_temp_switch_to_old_page;
            }
        }
    }

    function version_remind() {
        if (!util_page.new_bangumi())
            return;
        util_init(() => {
            if ((localStorage.balh_version || '0') < GM_info.script.version) {
                localStorage.balh_version = GM_info.script.version;
                let version_remind = _t('version_remind');
                if (version_remind) {
                    ui.pop({ content: `<h3>${GM_info.script.name} v${GM_info.script.version} 更新日志</h3>${version_remind}` });
                }
            }
        });
    }

    function isHtml5Player() {
        return localStorage.defaulth5 === '1';
    }
    function check_html5() {
        function checkHtml5() {
            var playerContent = document.querySelector('.player-content');
            if (!localStorage.balh_h5_not_first && !isHtml5Player() && window.GrayManager && playerContent) {
                new MutationObserver(function (mutations, observer) {
                    var _a;
                    observer.disconnect();
                    localStorage.balh_h5_not_first = r.const.TRUE;
                    if (window.confirm(GM_info.script.name + '只在HTML5播放器下有效，是否切换到HTML5？')) {
                        (_a = window.GrayManager) === null || _a === void 0 ? void 0 : _a.clickMenu('change_h5'); // change_flash, change_h5
                    }
                }).observe(playerContent, {
                    childList: true,
                    attributes: false,
                });
            }
        }
        util_init(() => {
            // 除了播放器和番剧列表页面, 其他页面都需要检测html5
            if (!(util_page.bangumi() || util_page.bangumi_md() || util_page.player())) {
                checkHtml5();
            }
        });
    }

    function jump_to_baipiao() {
        util_init(() => {
            for (let bp of r.baipiao) {
                const cookie_key = `balh_baipao_${bp.key}`;
                if (bp.match() && !cookieStorage[cookie_key]) {
                    ui.pop({
                        content: [
                            createElement('text', '发现白嫖地址: '), createElement('a', { href: bp.link }, bp.link),
                            createElement('div', {}, bp.message),
                        ],
                        confirmBtn: '一键跳转',
                        onConfirm: () => { location.href = bp.link; },
                        onClose: () => { cookieStorage.set(cookie_key, r.const.TRUE, ''); }
                    });
                    break;
                }
            }
        }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER);
    }

    function biliplus_check_area_limit() {
        if (!util_page.bangumi_md()) {
            return;
        }
        // 服务器需要通过这个接口判断是否有区域限制
        // 详见: https://github.com/ipcjs/bilibili-helper/issues/385
        util_init(() => {
            var _a, _b, _c;
            const season_id = (_c = (_b = (_a = window === null || window === void 0 ? void 0 : window.__INITIAL_STATE__) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.param) === null || _c === void 0 ? void 0 : _c.season_id;
            if (season_id) {
                BiliPlusApi.season(season_id)
                    .then(r => util_debug(`season${season_id}`, r))
                    .catch(e => util_debug(`season${season_id}`, e));
            }
        });
    }

    function fill_season_page() {
        function tryFillSeasonList() {
            var _a;
            const error_container = document.querySelector('div.error-container');
            if (!error_container) {
                return;
            }
            let season_id = (_a = window.location.pathname.match(/^\/anime\/(\d+)\/?$/)) === null || _a === void 0 ? void 0 : _a[1];
            if (!season_id) {
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
            const msg = createElement('a', { href: '//bangumi.bilibili.com/anime/' + season_id + '/play', style: { fontSize: '20px' } }, [createElement('text', `【${GM_info.script.name}】尝试获取视频列表中...`)]);
            const content = createElement('div');
            error_container.insertBefore(content, error_container.firstChild);
            content.appendChild(msg);
            util_debug('season>:', season_id);
            BiliPlusApi.season(season_id)
                .then(function (data) {
                var _a;
                util_debug('season>then:', data);
                if (data.code) {
                    return Promise.reject(data);
                }
                function generateEpisodeList(episodes) {
                    const children = [];
                    episodes.reverse().forEach(function (i) {
                        children.push(createElement('li', { className: 'v1-bangumi-list-part-child', 'data-episode-id': i.episode_id }, [createElement('a', { className: 'v1-complete-text', href: '//bangumi.bilibili.com/anime/' + season_id + '/play#' + i.episode_id, title: i.index + ' ' + i.index_title, target: '_blank', style: { height: '60px' } }, [
                                createElement('div', { className: 'img-wrp' }, [createElement('img', { src: i.cover, style: { opacity: 1 }, loaded: 'loaded', alt: i.index + ' ' + i.index_title })]),
                                createElement('div', { className: 'text-wrp' }, [
                                    createElement('div', { className: 'text-wrp-num' }, [createElement('div', { className: 'text-wrp-num-content' }, [createElement('text', `第${i.index}话`)])]),
                                    createElement('div', { className: 'text-wrp-title trunc' }, [createElement('text', i.index_title)])
                                ])
                            ])]));
                    });
                    return children;
                }
                function generateSeasonList(seasons) {
                    function onSeasonClick(event) {
                        var _a;
                        window.location.href = '//bangumi.bilibili.com/anime/' + ((_a = event.target) === null || _a === void 0 ? void 0 : _a.attributes['data-season-id'].value);
                    }
                    return seasons.map(function (season) {
                        return createElement('li', { className: season.season_id == season_id ? 'cur' : '', 'data-season-id': season.season_id, event: { click: onSeasonClick } }, [createElement('text', season.title)]);
                    });
                }
                if (data.result) {
                    if (((_a = msg.parentNode) === null || _a === void 0 ? void 0 : _a.parentNode) != error_container) {
                        util_error('`msg.parentNode?.parentNode != error_container`, 按理来说不可能...');
                    }
                    document.title = data.result.title;
                    document.head.appendChild(createElement('link', { href: 'https://s3.hdslb.com/bfs/static/anime/css/tag-index.css?v=110', rel: 'stylesheet' }));
                    document.head.appendChild(createElement('link', { href: 'https://s1.hdslb.com/bfs/static/anime/css/bangumi-index.css?v=110', rel: 'stylesheet' }));
                    document.body.insertBefore(createElement('div', { className: 'main-container-wrapper' }, [createElement('div', { className: 'main-container' }, [
                            createElement('div', { className: 'page-info-wrp' }, [createElement('div', { className: 'bangumi-info-wrapper' }, [
                                    createElement('div', { className: 'bangumi-info-blurbg-wrapper' }, [createElement('div', { className: 'bangumi-info-blurbg blur', style: { backgroundImage: 'url(' + data.result.cover + ')' } })]),
                                    createElement('div', { className: 'main-inner' }, [createElement('div', { className: 'info-content' }, [
                                            createElement('div', { className: 'bangumi-preview' }, [createElement('img', { alt: data.result.title, src: data.result.cover })]),
                                            createElement('div', { className: 'bangumi-info-r' }, [
                                                createElement('div', { className: 'b-head' }, [createElement('h1', { className: 'info-title', 'data-seasonid': season_id, title: data.result.title }, [createElement('text', data.result.title)])]),
                                                createElement('div', { className: 'info-count' }, [
                                                    createElement('span', { className: 'info-count-item info-count-item-play' }, [createElement('span', { className: 'info-label' }, [createElement('text', '总播放')]), createElement('em', {}, [createElement('text', data.result.play_count)])]),
                                                    createElement('span', { className: 'info-count-item info-count-item-fans' }, [createElement('span', { className: 'info-label' }, [createElement('text', '追番人数')]), createElement('em', {}, [createElement('text', data.result.favorites)])]),
                                                    createElement('span', { className: 'info-count-item info-count-item-review' }, [createElement('span', { className: 'info-label' }, [createElement('text', '弹幕总数')]), createElement('em', {}, [createElement('text', data.result.danmaku_count)])])
                                                ]),
                                                //_('div',{className:'info-row info-update'},[]),
                                                //_('div',{className:'info-row info-cv'},[]),
                                                createElement('div', { className: 'info-row info-desc-wrp' }, [
                                                    createElement('div', { className: 'info-row-label' }, [createElement('text', '简介：')]),
                                                    createElement('div', { className: 'info-desc' }, [createElement('text', data.result.evaluate)])
                                                ]),
                                            ])
                                        ])])
                                ])]),
                            createElement('div', { className: 'main-inner' }, [createElement('div', { className: 'v1-bangumi-list-wrapper clearfix' }, [
                                    createElement('div', { className: 'v1-bangumi-list-season-wrapper' }, [
                                        createElement('div', { className: 'v1-bangumi-list-season-content slider-list-content' }, [
                                            createElement('div', {}, [
                                                createElement('ul', { className: 'v1-bangumi-list-season clearfix slider-list', 'data-current-season-id': season_id, style: { opacity: 1 } }, generateSeasonList(data.result.seasons))
                                            ])
                                        ])
                                    ]),
                                    createElement('div', { className: 'v1-bangumi-list-part-wrapper slider-part-wrapper' }, [createElement('div', { className: 'v1-bangumi-list-part clearfix', 'data-current-season-id': season_id, style: { display: 'block' } }, [
                                            createElement('div', { className: 'complete-list', style: { display: 'block' } }, [createElement('div', { className: 'video-slider-list-wrapper' }, [createElement('div', { className: 'slider-part-wrapper' }, [createElement('ul', { className: 'slider-part clearfix hide', style: { display: 'block' } }, generateEpisodeList(data.result.episodes))])])])
                                        ])])
                                ])])
                        ])]), error_container);
                    error_container.remove();
                }
            })
                .catch(function (error) {
                util_debug('season>catch', error);
                msg.innerText = 'error:' + JSON.stringify(error) + '\n点击跳转到播放界面 (不一定能够正常播放...)';
            });
        }
        util_init(() => {
            if (util_page.bangumi()) {
                tryFillSeasonList();
            }
        });
    }

    function redirect_to_bangumi_or_insert_player() {
        // 重定向到Bangumi页面， 或者在当前页面直接插入播放页面
        function tryRedirectToBangumiOrInsertPlayer() {
            let $errorPanel;
            $errorPanel = document.querySelector('.error-container > .error-panel');
            if (!$errorPanel && !window.__INITIAL_STATE__) {
                // 新版视频不见了页面, 错误面板也是用Vue写的, 只能通过是否存在__INITIAL_STATE__来判断是不是错误页面
                // eg: https://www.bilibili.com/video/BV1ja411X7Ba
                $errorPanel = createElement('div', { style: { position: 'fixed', top: '100px', left: '100px' } });
                document.body.appendChild($errorPanel);
            }
            if (!$errorPanel) {
                return;
            }
            let msg = document.createElement('a');
            $errorPanel.insertBefore(msg, $errorPanel.firstChild);
            msg.innerText = '获取番剧页Url中...';
            let aid = (location.pathname.match(/\/video\/av(\d+)/) || ['', ''])[1], page = (location.pathname.match(/\/index_(\d+).html/) || ['', '1'])[1], cid, season_id, episode_id;
            let avData;
            if (!aid) {
                let bv = (location.pathname.match(/\/video\/(BV\w+)/) || ['', ''])[1];
                if (bv) {
                    aid = Converters.bv2aid(bv);
                }
            }
            BiliPlusApi.view(aid)
                .then(function (data) {
                avData = data;
                if (data.code) {
                    return Promise.reject(JSON.stringify(data));
                }
                // 计算当前页面的cid
                for (let i = 0; i < data.list.length; i++) {
                    if (data.list[i].page == page) {
                        cid = data.list[i].cid;
                        break;
                    }
                }
                if (!data.bangumi) {
                    generatePlayer(data, aid, page, cid);
                    // return Promise.reject('该AV号不属于任何番剧页');//No bangumi in api response
                }
                else {
                    // 当前av属于番剧页面, 继续处理
                    season_id = data.bangumi.season_id;
                    return BiliPlusApi.season(season_id);
                }
            })
                .then(function (result) {
                if (result === undefined)
                    return; // 上一个then不返回内容时, 不需要处理
                if (result.code === 10) { // av属于番剧页面, 通过接口却未能找到番剧信息
                    let ep_id_newest = avData && avData.bangumi && avData.bangumi.newest_ep_id;
                    if (ep_id_newest) {
                        episode_id = ep_id_newest; // 此时, 若avData中有最新的ep_id, 则直接使用它
                    }
                    else {
                        util_debug(`av${aid}属于番剧${season_id}, 但却不能找到番剧页的信息, 试图直接创建播放器`);
                        generatePlayer(avData, aid, page, cid);
                        return;
                    }
                }
                else if (result.code) {
                    return Promise.reject(JSON.stringify(result));
                }
                else {
                    let ep_id_by_cid, ep_id_by_aid_page, ep_id_by_aid, episodes = result.result.episodes, ep;
                    // 为何要用三种不同方式匹配, 详见: https://greasyfork.org/zh-CN/forum/discussion/22379/x#Comment_34127
                    for (let i = 0; i < episodes.length; i++) {
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
                }
                if (episode_id) {
                    let bangumi_url = `//www.bilibili.com/bangumi/play/ss${season_id}#${episode_id}`;
                    util_debug('Redirect', 'aid:', aid, 'page:', page, 'cid:', cid, '==>', bangumi_url, 'season_id:', season_id, 'ep_id:', episode_id);
                    msg.innerText = '即将跳转到：' + bangumi_url;
                    location.href = bangumi_url;
                }
                else {
                    return Promise.reject('查询episode_id失败');
                }
            })
                .catch(function (e) {
                util_debug('error:', arguments);
                msg.innerText = 'error:' + e;
            });
        }
        function generatePlayer(data, aid, page, cid) {
            var _a;
            let generateSrc = function (aid, cid) {
                return `//www.bilibili.com/blackboard/html5player.html?cid=${cid}&aid=${aid}&player_type=1`;
            };
            let generatePageList = function (pages) {
                let $curPage = null;
                function onPageBtnClick(e) {
                    e.target.className = 'curPage';
                    $curPage && ($curPage.className = '');
                    let index = e.target.attributes['data-index'].value;
                    iframe.src = generateSrc(aid, pages[index].cid);
                }
                return pages.map(function (item, index) {
                    let isCurPage = item.page == page;
                    let $item = createElement('a', { 'data-index': index, className: isCurPage ? 'curPage' : '', event: { click: onPageBtnClick } }, [createElement('text', item.page + ': ' + item.part)]);
                    if (isCurPage)
                        $curPage = $item;
                    return $item;
                });
            };
            // 当前av不属于番剧页面, 直接在当前页面插入一个播放器的iframe
            let $pageBody = document.querySelector('.b-page-body');
            if (!$pageBody) { // 若不存在, 则创建
                $pageBody = createElement('div', { className: '.b-page-body' });
                document.querySelector('body').insertBefore($pageBody, document.querySelector('#app'));
                // 添加相关样式
                document.head.appendChild(createElement('link', { type: 'text/css', rel: 'stylesheet', href: '//static.hdslb.com/css/core-v5/page-core.css' }));
            }
            let iframe = createElement('iframe', { className: 'player bilibiliHtml5Player', style: { position: 'relative' }, src: generateSrc(aid, cid) });
            // 添加播放器
            $pageBody.appendChild(createElement('div', { className: 'player-wrapper' }, [
                createElement('div', { className: 'main-inner' }, [
                    createElement('div', { className: 'v-plist' }, [
                        createElement('div', { id: 'plist', className: 'plist-content open' }, generatePageList(data.list))
                    ])
                ]),
                createElement('div', { id: 'bofqi', className: 'scontent' }, [iframe])
            ]));
            // 添加评论区
            $pageBody.appendChild(createElement('div', { className: 'main-inner' }, [
                createElement('div', { className: 'common report-scroll-module report-wrap-module', id: 'common_report' }, [
                    createElement('div', { className: 'b-head' }, [
                        createElement('span', { className: 'b-head-t results' }),
                        createElement('span', { className: 'b-head-t' }, [createElement('text', '评论')]),
                        createElement('a', { className: 'del-log', href: `//www.bilibili.com/replydeletelog?aid=${aid}&title=${data.title}`, target: '_blank' }, [createElement('text', '查看删除日志')])
                    ]),
                    createElement('div', { className: 'comm', id: 'bbComment' }, [
                        createElement('div', { id: 'load_comment', className: 'comm_open_btn', onclick: "var fb = new bbFeedback('.comm', 'arc');fb.show(" + aid + ", 1);", style: { cursor: 'pointer' } })
                    ])
                ])
            ]));
            // 添加包含bbFeedback的js
            document.head.appendChild(createElement('script', { type: 'text/javascript', src: '//static.hdslb.com/js/core-v5/base.core.js' }));
            document.title = data.title;
            (_a = (document.querySelector('.error-body') || document.querySelector('.error-container'))) === null || _a === void 0 ? void 0 : _a.remove(); // 移除错误信息面板
        }
        util_init(() => {
            if (util_page.av()) {
                tryRedirectToBangumiOrInsertPlayer();
            }
        }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.COMPLETE);
    }

    var pageTemplate = "<!DOCTYPE html>\n<html>\n\n<head>\n    <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">\n    <meta name=\"referrer\" content=\"no-referrer-when-downgrade\">\n    <link rel=\"dns-prefetch\" href=\"//s1.hdslb.com\">\n    <link rel=\"dns-prefetch\" href=\"//s2.hdslb.com\">\n    <link rel=\"dns-prefetch\" href=\"//s3.hdslb.com\">\n    <link rel=\"dns-prefetch\" href=\"//i0.hdslb.com\">\n    <link rel=\"dns-prefetch\" href=\"//i1.hdslb.com\">\n    <link rel=\"dns-prefetch\" href=\"//i2.hdslb.com\">\n    <link rel=\"dns-prefetch\" href=\"//static.hdslb.com\">\n    <title>【A站独播】___htmlTitle___ AcFun弹幕视频网 - 认真你就输啦 (?ω?)ノ- ( ゜- ゜)つロ</title>\n    <meta name=\"description\" content=\"江户时代末期（本作的20年前）, 被称为“天人（あまんと）”的谜之异星人来袭。于是地球人与天人之间的战争瞬即爆发，为数众多的武士和攘夷派志士都参与与天人的战斗，幕府见识到天人强大的实力后，最终向天人低\">\n    <meta name=\"keywords\" content=\"銀魂（僅限港澳台地區）\">\n    <meta name=\"author\" content=\"哔哩哔哩番剧\">\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\n    <meta property=\"og:title\" content=\"銀魂（僅限港澳台地區）\">\n    <meta property=\"og:type\" content=\"video.anime\">\n    <meta property=\"og:url\" content=\"https://www.bilibili.com/bangumi/play/ss33577/\">\n    <meta property=\"og:image\" content=\"https://i0.hdslb.com/bfs/archive/65dc2aa1781fbb507dbb7faef1d0a6169162ffed.jpg\">\n    <meta name=\"spm_prefix\" content=\"666.25\">\n    <link rel=\"shortcut icon\" href=\"//static.hdslb.com/images/favicon.ico\">\n    <script>\n        !function () {\n            for (var n = window.navigator.userAgent, i = [\"Android\", \"iPhone\", \"SymbianOS\", \"Windows Phone\", \"iPod\"], o = !0, e = 0, r = i.length; e < r; e++)\n                if (0 < n.indexOf(i[e])) {\n                    o = !1;\n                    break\n                }\n            if (0 == o) {\n                var w = window.location.href.replace(\"www\", \"m\");\n                window.location.href = w\n            }\n        }()\n    </script>\n    <link rel=\"stylesheet\" href=\"//s1.hdslb.com/bfs/static/pgcv/css/video.1.d78d6e85da752e622f857a963ae79be916fe4c01.css\">\n    <link rel=\"stylesheet\" href=\"//s1.hdslb.com/bfs/static/pgcv/css/video.0.d78d6e85da752e622f857a963ae79be916fe4c01.css\">\n    <script type=\"text/javascript\" src=\"//s1.hdslb.com/bfs/static/player/main/video.70db8af8.js?v=20210111\"></script>\n    <!-- <script type=\"text/javascript\" src=\"//s2.hdslb.com/bfs/cm/st/bundle.js\"></script> -->\n    <script type=\"application/ld+json\">\n\n                    {\n                        \"@context\": \"https://schema.org\",\n                        \"@type\": \"ItemList\",\n                        \"itemListElement\": [\n                            {\n                                \"@type\": \"VideoObject\",\n                                \"position\": 1,\n                                \"name\": \"銀魂（僅限港澳台地區）\",\n                                \"url\": \"https://www.bilibili.com/bangumi/play/ss33577/\",\n                                \"description\": \"江户时代末期（本作的20年前）, 被称为“天人（あまんと）”的谜之异星人来袭。于是地球人与天人之间的战争瞬即爆发，为数众多的武士和攘夷派志士都参与与天人的战斗，幕府见识到天人强大的实力后，最终向天人低\",\n                                \"thumbnailUrl\": [\"https://i0.hdslb.com/bfs/archive/65dc2aa1781fbb507dbb7faef1d0a6169162ffed.jpg\"],\n                                \"uploadDate\": \"2006-04-06T11:26:00.000Z\",\n                                \"interactionStatistic\": {\n                                    \"@type\": \"InteractionCounter\",\n                                    \"interactionType\": { \"@type\": \"http://schema.org/WatchAction\" },\n                                    \"userInteractionCount\": \"786346\"\n                                }\n                            }\n                        ]\n                    }\n                \n        </script>\n    <!-- 隐藏点评和评分，去掉了评论上面的大片空白 -->\n    <style type=\"text/css\">\n        .player-mask {\n            display: none;\n        }\n        .media-rating {\n            display: none;\n        }\n        .btn-rating {\n            display: none;\n        }\n        .review-module {\n            display: none;\n        }\n        .media-right {\n            height: auto !important;\n        }\n        .btn-follow {\n            display: none;\n        }\n        .bilibili-player-ending-panel {\n            display: none !important;\n        }\n        .bilibili-player-video-top-follow {\n            display: none !important;\n        }\n    </style>\n</head>\n\n<body class=\"\" style=\"opacity:0\">\n    <script type=\"text/javascript\">\n        function getIEVersion() {\n            var rv = 99;\n            if (navigator.appName == \"Microsoft Internet Explorer\") {\n                var ua = navigator.userAgent;\n                var re = new RegExp(\"MSIE ([0-9]{1,}[.0-9]{0,})\");\n                if (re.exec(ua) != null) {\n                    rv = parseFloat(RegExp.$1)\n                }\n            }\n            return rv\n        }\n        if (getIEVersion() <= 9) {\n            document.body.innerHTML = \"<div class='ie-fix'><div class='title'>为了保障你的账号安全和最佳预览体验，播放页已不支持IE9及以下IE版本浏览器访问，建议你使用Chrome等高级浏览器或升级到IE最新版本浏览器。</div></div>\"\n        }\n        window.bid = 13\n        window.spmReportData = {}\n        window.reportConfig = {\n            sample: 1,\n            scrollTracker: true,\n            msgObjects: 'spmReportData',\n            errorTracker: true,\n            hasAbtest: true,\n            abtestPlatform: 4\n        }\n    </script>\n    <script type=\"text/javascript\" src=\"//s1.hdslb.com/bfs/seed/log/report/log-reporter.js\" crossorigin></script>\n    <div id=\"biliMainHeader\" style=\"height:56px\"></div>\n    <!-- app标签Vue需要读取, 多一个空格都不行, 不要格式化它 -->\n    <div id=\"app\" data-server-rendered=\"true\" class=\"main-container clearfix\"><div class=\"plp-l\"><div id=\"player_module\" class=\"player-module\"><div id=\"bilibili-player\" class=\"stardust-player report-wrap-module player-container\"></div> <div class=\"player-tool-bar\"></div> <div id=\"player_mask_module\" class=\"player-mask report-wrap-module\" style=\"display:none;\"><!----> <!----> <!----> <!----> <!----> <!----> <!----> <div class=\"bar-wrapper\"><div class=\"left-bar\"></div><div class=\"right-bar\"></div></div></div></div> <div class=\"media-wrapper\"><h1 title=\"銀魂（僅限港澳台地區）：01-02 \">銀魂（僅限港澳台地區）：01-02 </h1> <div id=\"toolbar_module\" class=\"tool-bar clearfix report-wrap-module report-scroll-module\"><div class=\"like-info\"><i class=\"iconfont icon-like\"></i><span>点赞</span> <div id=\"sanlin\"></div> <!----> <!----> <!----></div> <div class=\"coin-info\"><i class=\"iconfont icon-coins\"></i><span>--</span></div> <div class=\"share-info\"><i class=\"iconfont icon-share\"></i><span>分享</span> <!----></div> <div class=\"mobile-info\"><i class=\"iconfont icon-mobile-full\"></i><span>用手机观看</span> <!----></div> <!----></div> <div id=\"media_module\" class=\"media-info clearfix report-wrap-module\"><a href=\"//www.bilibili.com/bangumi/media/md___mediaInfoId___/\" target=\"_blank\" class=\"media-cover\"><!----></a> <div class=\"media-right\"><a href=\"//www.bilibili.com/bangumi/media/md28229002/\" target=\"_blank\" title=\"銀魂（僅限港澳台地區）\" class=\"media-title\">銀魂（僅限港澳台地區）</a> <div class=\"media-count\">--&nbsp;&nbsp;·&nbsp;&nbsp;--&nbsp;&nbsp;·&nbsp;&nbsp;--</div> <div class=\"pub-wrapper clearfix\"><a href=\"//www.bilibili.com/anime/\" target=\"_blank\" class=\"home-link\">番剧</a> <span class=\"pub-info\">连载中</span> <!----> <!----></div> <a href=\"//www.bilibili.com/bangumi/media/md28229002/\" target=\"_blank\" class=\"media-desc webkit-ellipsis\"><span class=\"absolute\">江户时代末期（本作的20年前）, 被称为“天人（あまんと）”的谜之异星人来袭。于是地球人与天人之间的战争瞬即爆发，为数众多的武士和攘夷派志士都参与与天人的战斗，幕府见识到天人强大的实力后，最终向天人低头，放弃武士不管，擅自与天人签订不平等条约，准许他们入国。其后更颁布了“废刀令”，夺走了武士的刀，使他们无力反抗。自此，天人横行霸道，幕府为天人所影响，甚至被控制，成为了“傀儡政权”。在这样的时代，有一个武士与同伴愉快地过著异想天开的生活。</span><span>江户时代末期（本作的20年前）, 被称为“天人（あまんと）”的谜之异星人来袭。于是地球人与天人之间的战争瞬即爆发，为数众多的武士和攘夷派志士都参与与天人的战斗，幕府见识到天人强大的实力后，最终向天人低头，放弃武士不管，擅自与天人签订不平等条约，准许他们入国。其后更颁布了“废刀令”，夺走了武士的刀，使他们无力反抗。自此，天人横行霸道，幕府为天人所影响，甚至被控制，成为了“傀儡政权”。在这样的时代，有一个武士与同伴愉快地过著异想天开的生活。</span><i style=\"display:none;\">展开</i></a> <div class=\"media-rating\"><h4 class=\"score\">9.7</h4> <p>1368人评分</p></div> <div class=\"media-tool-bar clearfix\"><div report-id=\"click_review_publish\" class=\"btn-rating\"><ul class=\"star-wrapper clearfix\"><li><i class=\"iconfont icon-star-empty\"></i> <!----></li><li><i class=\"iconfont icon-star-empty\"></i> <!----></li><li><i class=\"iconfont icon-star-empty\"></i> <!----></li><li><i class=\"iconfont icon-star-empty\"></i> <!----></li><li><i class=\"iconfont icon-star-empty\"></i> <!----></li></ul><span>点评</span></div> <div report-id=\"click_follow\" class=\"btn-follow\"><i class=\"iconfont icon-follow\"></i><span>追番</span> <div class=\"bangumi-options clearfix\"><ul class=\"opt-list\"><li>标记为 想看</li> <li>标记为 在看</li> <li>标记为 已看</li> <li>取消追番</li></ul></div></div></div></div></div></div> <div id=\"review_module\" class=\"review-module report-wrap-module report-scroll-module\"><div class=\"module-title clearfix\"><h4>点评</h4> <a href=\"//www.bilibili.com/bangumi/media/md28229002/\" target=\"_blank\" class=\"more-link\">查看全部</a></div> <div class=\"review-list\"><div class=\"review-item\"><div class=\"review-empty pre-mask\"></div> <!----></div><div class=\"review-item\"><div class=\"review-empty pre-mask\"></div> <!----></div><div class=\"review-item\"><div class=\"review-empty pre-mask\"></div> <!----></div> <!----></div></div> <!----> <div id=\"comment_module\" class=\"comment-wrapper common report-wrap-module report-scroll-module\" style=\"display:;\"><div class=\"b-head\"><span class=\"results\"></span><span>评论</span></div> <div class=\"comm\"></div></div></div> <div class=\"plp-r\"><div id=\"paybar_module\" class=\"pay-bar report-wrap-module pre-mask\" style=\"display:none;\"><!----> <!----> <!----> <!----> <!----> <!----></div> <div id=\"danmukuBox\" class=\"danmaku-box\" style=\"display:;\"><div class=\"danmaku-wrap\"></div></div> <div id=\"eplist_module\" class=\"ep-list-wrapper report-wrap-module\"><div class=\"list-title clearfix\"><h4 title=\"选集\">选集</h4> <span class=\"mode-change\" style=\"position:relative\"><i report-id=\"click_ep_switch\" class=\"iconfont icon-ep-list-simple\"></i> <!----></span> <!----> <span class=\"ep-list-progress\">1/220</span></div> <div class=\"list-wrapper simple\" style=\"display:none;\"><ul class=\"clearfix\" style=\"height:50px;\"></ul></div></div>  <div class=\"omit-hint\" style=\"display:none;\">部分集数受地区限制不予展示</div> <!----> <div id=\"recom_module\" class=\"recom-wrapper report-wrap-module report-scroll-module\"><div class=\"recom-title\">相关推荐</div> <div class=\"recom-list\"><div class=\"recom-item clearfix\"><div class=\"cover-wrapper pre-mask\"></div> <!----> <div class=\"info-wrapper\"><div class=\"video-title pre-mask\"></div> <div class=\"video-subtitle pre-mask\"></div> <div class=\"video-count pre-mask\"></div></div> <!----></div><div class=\"recom-item clearfix\"><div class=\"cover-wrapper pre-mask\"></div> <!----> <div class=\"info-wrapper\"><div class=\"video-title pre-mask\"></div> <div class=\"video-subtitle pre-mask\"></div> <div class=\"video-count pre-mask\"></div></div> <!----></div><div class=\"recom-item clearfix\"><div class=\"cover-wrapper pre-mask\"></div> <!----> <div class=\"info-wrapper\"><div class=\"video-title pre-mask\"></div> <div class=\"video-subtitle pre-mask\"></div> <div class=\"video-count pre-mask\"></div></div> <!----></div><div class=\"recom-item clearfix\"><div class=\"cover-wrapper pre-mask\"></div> <!----> <div class=\"info-wrapper\"><div class=\"video-title pre-mask\"></div> <div class=\"video-subtitle pre-mask\"></div> <div class=\"video-count pre-mask\"></div></div> <!----></div><div class=\"recom-item clearfix\"><div class=\"cover-wrapper pre-mask\"></div> <!----> <div class=\"info-wrapper\"><div class=\"video-title pre-mask\"></div> <div class=\"video-subtitle pre-mask\"></div> <div class=\"video-count pre-mask\"></div></div> <!----></div></div> <!----></div></div> <div class=\"nav-tools\" style=\"display:none;\"><div title=\"返回顶部\" class=\"tool-item backup iconfont icon-up\"></div> <!----> <a title=\"帮助反馈\" href=\"//www.bilibili.com/blackboard/help.html#常见问题自救方法?id=c9954d53034d43d796465e24eb792593\" target=\"_blank\"><div class=\"tool-item help iconfont icon-customer-serv\"></div></a></div> <!----> <!----> <!----> <!----> <!----> <!----> <!----> <!----> <!----> <!----></div>\n    <script>\n        window.__PGC_USERSTATE__ = {\n            \"area_limit\": 1,\n            \"ban_area_show\": 1,\n            \"follow\": 0,\n            \"follow_status\": 2,\n            \"login\": 1,\n            \"pay\": 0,\n            \"pay_pack_paid\": 0,\n            \"sponsor\": 0,\n            \"vip_info\": {\n                \"due_date\": 1672675200000,\n                \"status\": 1,\n                \"type\": 2\n            }\n        }\n    </script>\n    <script>\n        window.__BILI_CONFIG__ = {\n            \"show_bv\": true\n        }\n    </script>\n    <script>\n        window.__INITIAL_STATE__ = {\n            \"loginInfo\": {},\n            \"isLogin\": false,\n            \"couponSelected\": null,\n            \"payGlobal\": null,\n            \"loaded\": true,\n            \"ver\": {},\n            \"ssr\": {},\n            \"h1Title\": \"銀魂（僅限港澳台地區）：01-02 \",\n            \"mediaInfo\": {\n                \"stat\": {\n                    \"coins\": 3444,\n                    \"danmakus\": 8325,\n                    \"favorites\": 75951,\n                    \"likes\": 0,\n                    \"reply\": 2614,\n                    \"share\": 515,\n                    \"views\": 786346\n                },\n                \"id\": ___mediaInfoId___,\n                \"ssId\": ___ssId___,\n                \"title\": \"___mediaInfoTitle___\",\n                \"jpTitle\": \"\",\n                \"series\": \"銀魂（國際版）\",\n                \"alias\": \"\",\n                \"evaluate\": \"___evaluate___\",\n                \"ssType\": 1,\n                \"ssTypeFormat\": {\n                    \"name\": \"番剧\",\n                    \"homeLink\": \"\\u002F\\u002Fwww.bilibili.com\\u002Fanime\\u002F\"\n                },\n                \"status\": 2,\n                \"multiMode\": true,\n                \"forceWide\": false,\n                \"specialCover\": \"\",\n                \"squareCover\": \"\\u002F\\u002Fi0.hdslb.com\\u002Fbfs\\u002Fbangumi\\u002Fimage\\u002Ff22bfaf955d4938d426029582fdd2303e6844a09.png\",\n                \"cover\": \"___cover___\",\n                \"playerRecord\": \"\",\n                \"rights\": {\n                    \"allowBp\": false,\n                    \"allowBpRank\": false,\n                    \"allowReview\": true,\n                    \"isPreview\": false,\n                    \"appOnly\": ___appOnly___,\n                    \"limitNotFound\": false,\n                    \"isCoverShow\": false,\n                    \"canWatch\": true\n                },\n                \"pub\": {\n                    \"time\": \"2006-04-06 19:26:00\",\n                    \"timeShow\": \"2006年04月06日19:26\",\n                    \"isStart\": true,\n                    \"isFinish\": false,\n                    \"unknow\": false\n                },\n                \"upInfo\": {\n                    \"mid\": -1,\n                    \"avatar\": \"\",\n                    \"name\": \"\",\n                    \"isAnnualVip\": false,\n                    \"pendantId\": -1,\n                    \"pendantName\": \"\",\n                    \"pendantImage\": \"\"\n                },\n                \"rating\": {\n                    \"score\": 9.7,\n                    \"count\": 1368\n                },\n                \"newestEp\": {\n                    \"id\": 331925,\n                    \"desc\": \"连载中\",\n                    \"isNew\": false\n                },\n                \"payMent\": {\n                    \"tip\": \"\",\n                    \"promotion\": \"\",\n                    \"vipProm\": \"\",\n                    \"vipFirstProm\": \"\",\n                    \"discount\": 1,\n                    \"vipDiscount\": 1,\n                    \"sixType\": {\n                        \"allowTicket\": false,\n                        \"allowTimeLimit\": false,\n                        \"allowDiscount\": false,\n                        \"allowVipDiscount\": false\n                    }\n                },\n                \"payPack\": {\n                    \"title\": \"\",\n                    \"appNoPayText\": \"\",\n                    \"appPayText\": \"\",\n                    \"url\": \"\"\n                },\n                \"activity\": {\n                    \"id\": 0,\n                    \"title\": \"\",\n                    \"pendantOpsImg\": \"\",\n                    \"pendantOpsLink\": \"\"\n                },\n                \"count\": {\n                    \"coins\": 0,\n                    \"danmus\": 0,\n                    \"follows\": 0,\n                    \"views\": 0,\n                    \"likes\": 0\n                },\n                \"pgcType\": \"anime\",\n                \"epSpMode\": true,\n                \"newEpSpMode\": false,\n                \"mainSecTitle\": \"选集\",\n                \"premiereInfo\": {},\n                \"sectionBottomDesc\": \"\"\n            },\n            \"epList\": ___episodes___,\n            \"epInfo\": {\n                \"loaded\": true,\n                \"id\": ___id___,\n                \"badge\": \"\",\n                \"badgeType\": 0,\n                \"badgeColor\": \"#999999\",\n                \"epStatus\": 2,\n                \"aid\": ___aid___,\n                \"bvid\": \"___bvid___\",\n                \"cid\": ___cid___,\n                \"from\": \"bangumi\",\n                \"cover\": \"\\u002F\\u002Fi0.hdslb.com\\u002Fbfs\\u002Farchive\\u002F65dc2aa1781fbb507dbb7faef1d0a6169162ffed.jpg\",\n                \"title\": \"___title___\",\n                \"titleFormat\": \"___titleFormat___\",\n                \"vid\": \"\",\n                \"longTitle\": \"\",\n                \"hasNext\": true,\n                \"i\": 0,\n                \"sectionType\": 0,\n                \"releaseDate\": \"\",\n                \"skip\": {},\n                \"hasSkip\": false,\n                \"rights\": {\n                    \"allow_demand\": 0,\n                    \"allow_dm\": 0,\n                    \"allow_download\": 0,\n                    \"area_limit\": 1\n                },\n                \"stat\": {}\n            },\n            \"sections\": [],\n            \"orderSections\": [],\n            \"ssList\": [{\n                \"id\": 33577,\n                \"title\": \"TV\",\n                \"type\": 1,\n                \"pgcType\": \"anime\",\n                \"cover\": \"\\u002F\\u002Fi0.hdslb.com\\u002Fbfs\\u002Fbangumi\\u002Fimage\\u002Fed473b3c6ccc653074e66a3f586bb960c25a9707.png\",\n                \"epCover\": \"\\u002F\\u002Fi0.hdslb.com\\u002Fbfs\\u002Farchive\\u002F5dae515b205b46feb2f69c0f2f79f95c1ca234d8.png\",\n                \"desc\": \"更新至第221话\",\n                \"badge\": \"\",\n                \"badgeType\": 0,\n                \"badgeColor\": \"#FB7299\",\n                \"views\": 786346,\n                \"follows\": 75946\n            }],\n            \"userState\": {\n                \"loaded\": false,\n                \"vipInfo\": {},\n                \"history\": {}\n            },\n            \"ssPayMent\": {},\n            \"epPayMent\": null,\n            \"player\": {\n                \"loaded\": false,\n                \"miniOn\": false,\n                \"limitType\": 0\n            },\n            \"sponsor\": {\n                \"allReady\": false,\n                \"allState\": 0,\n                \"allRank\": [],\n                \"allMine\": null,\n                \"allCount\": 0,\n                \"weekReady\": false,\n                \"weekState\": 0,\n                \"weekRank\": [],\n                \"weekMine\": null,\n                \"weekCount\": 0\n            },\n            \"ssRecom\": {\n                \"status\": \"loading\",\n                \"data\": []\n            },\n            \"showBv\": false,\n            \"interact\": {\n                \"shown\": false,\n                \"btnText\": \"\",\n                \"callback\": null\n            },\n            \"nextEp\": null,\n            \"playerEpList\": {\n                \"code\": 0,\n                \"message\": \"\",\n                \"result\": {\n                    \"main_section\": {\n                        \"episodes\": []\n                    }\n                }\n            },\n            \"isOriginal\": false,\n            \"premiereCountDown\": \"\",\n            \"premiereStatus\": {},\n            \"premiereEp\": {},\n            \"likeMap\": {},\n            \"uperMap\": {},\n            \"hasPlayableEp\": false,\n            \"insertScripts\": [\"\\u002F\\u002Fs1.hdslb.com\\u002Fbfs\\u002Fstatic\\u002Fpgcv\\u002F1.video.d78d6e85da752e622f857a963ae79be916fe4c01.js\", \"\\u002F\\u002Fs1.hdslb.com\\u002Fbfs\\u002Fstatic\\u002Fpgcv\\u002Fvideo.d78d6e85da752e622f857a963ae79be916fe4c01.js\"]\n        };\n        (function () {\n            var s;\n            (s = document.currentScript || document.scripts[document.scripts.length - 1]).parentNode.removeChild(s);\n        }());\n    </script>\n    <script type=\"text/javascript\">\n        if (window.__INITIAL_STATE__) {\n            var jsUrls = window.__INITIAL_STATE__.insertScripts || [];\n            function insertLink() {\n                for (var e = [\"//static.hdslb.com/phoenix/dist/css/comment.min.css?v=\" + Date.now(), \"//pay.bilibili.com/paysdk/bilipay.css\"], i = 0; i < e.length; i++) {\n                    var t = document.createElement(\"link\");\n                    t.rel = \"stylesheet\",\n                        t.type = \"text/css\",\n                        t.href = e[i],\n                        document.body.appendChild(t)\n                }\n            }\n            function insertScript() {\n                if (!(window.scriptIsInject || jsUrls[0] && -1 < window.document.body.innerHTML.indexOf(jsUrls[0]))) {\n                    window.scriptIsInject = !0,\n                        window.jQuery || jsUrls.unshift(\"//static.hdslb.com/js/jquery.min.js\"),\n                        window.Promise || jsUrls.unshift(\"//static.hdslb.com/js/promise.auto.min.js\"),\n                        jsUrls.push(\"//s1.hdslb.com/bfs/static/ogv/fe/iris.min.js?v=20210112.1\");\n                    for (var e = 0; e < jsUrls.length; e++)\n                        loadScript(jsUrls[e])\n                }\n            }\n            function loadScript(e, i) {\n                var t = document.createElement(\"script\");\n                t.type = \"text/javascript\",\n                    -1 == (t.src = e).indexOf(\"jquery\") && -1 == e.indexOf(\"promise\") && (t.crossOrigin = \"true\"),\n                    document.body.appendChild(t),\n                    t.onload = function () {\n                        i && i()\n                    }\n            }\n            var ep = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.epInfo\n                , md = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.mediaInfo;\n            function getCookie(e) {\n                var i = new RegExp(\"(^| )\" + e + \"=([^;]*)(;|$)\")\n                    , t = document.cookie.match(i);\n                return t ? unescape(t[2]) : null\n            }\n            function setSize() {\n                var e = md.specialCover ? 1070 : 1280\n                    , i = 350\n                    , t = window.innerHeight || document.documentElement.clientHeight\n                    , o = window.innerWidth || window.document.documentElement.clientWidth\n                    , n = Math.round(md.specialCover ? 16 * (t - 264) / 9 - i : 16 * (.743 * t - 108.7) / 9)\n                    , d = o - 152 - i\n                    , s = d < n ? d : n;\n                s < 638 && (s = 638),\n                    e < s && (s = e);\n                var a = s + i\n                    , r = o < a + 152\n                    , l = document.querySelector(\".main-container\");\n                if (l.style.width = (r ? a + 76 : a) + \"px\",\n                    l.style.paddingLeft = (r ? 76 : 0) + \"px\",\n                    l.style.marginLeft = r ? \"0\" : \"\",\n                    l.style.marginRight = r ? \"0\" : \"\",\n                    md.specialCover) {\n                    var p = Math.round(9 * a / 16 + 46);\n                    (y = document.querySelector(\"#player_module\")).style.height = p + \"px\",\n                        y.style.width = a + \"px\",\n                        y.style.paddingLeft = \"\",\n                        y.style.left = r ? \"76px\" : \"\",\n                        y.style.transform = r ? \"none\" : \"\",\n                        y.style.webkitTransform = r ? \"none\" : \"\";\n                    var _ = document.querySelector(\".special-cover\")\n                        , w = document.querySelector(\".plp-l\")\n                        , c = document.querySelector(\".plp-r\")\n                        , m = document.querySelector(\"#danmukuBox\");\n                    _.style.height = p + 218 + \"px\",\n                        w.style.paddingTop = p + 24 + \"px\",\n                        c.style.marginTop = p + 40 + \"px\",\n                        window.isWide ? (m.style.top = \"0px\",\n                            m.style.position = \"relative\") : (m.style.top = -(p + 40) + \"px\",\n                                m.style.position = \"absolute\")\n                } else {\n                    var u = parseInt(9 * (s + (window.isWide ? i : 0)) / 16) + 46 + (window.hasBlackSide && !window.isWide ? 96 : 0);\n                    if ((m = document.querySelector(\"#danmukuBox\")).style.top = \"\",\n                        window.isWide) {\n                        (y = document.querySelector(\"#player_module\")).style.height = u - 0 + \"px\",\n                            y.style.width = \"\",\n                            y.style.paddingLeft = r ? \"76px\" : \"\",\n                            y.style.left = \"\",\n                            y.style.transform = \"\",\n                            y.style.webkitTransform = \"\";\n                        w = document.querySelector(\".plp-l\"),\n                            c = document.querySelector(\".plp-r\");\n                        w.style.paddingTop = u - 0 + \"px\",\n                            c.style.marginTop = u + 16 + \"px\"\n                    } else {\n                        var y;\n                        (y = document.querySelector(\"#player_module\")).style.height = u - 0 + \"px\",\n                            y.style.width = \"\",\n                            y.style.paddingLeft = \"\",\n                            y.style.left = \"\",\n                            y.style.transform = \"\",\n                            y.style.webkitTransform = \"\";\n                        w = document.querySelector(\".plp-l\"),\n                            c = document.querySelector(\".plp-r\");\n                        w.removeAttribute(\"style\"),\n                            c.removeAttribute(\"style\")\n                    }\n                }\n            }\n            if (window.isWide = md.forceWide || !!md.specialCover || !md.multiMode,\n                window.hasBlackSide = Boolean(parseInt(getCookie(\"blackside_state\"))),\n                window.PlayerAgent = {\n                    player_widewin: function () {\n                        window.isWide = !0,\n                            setSize()\n                    },\n                    player_fullwin: function () {\n                        window.isWide = !1,\n                            setSize()\n                    },\n                    toggleBlackSide: function (e) {\n                        window.hasBlackSide = e,\n                            setSize()\n                    }\n                },\n                setSize(),\n                window.document.body.style.opacity = \"\",\n                window.addEventListener(\"resize\", setSize),\n                !(ep && ep.loaded && -1 < ep.id) || md.rights.appOnly || md.premiereInfo && md.premiereInfo.epid === ep.id)\n                insertScript();\n            else {\n                var r = function (s) {\n                    window.pgcPlayerLoaded = !0;\n                    var e = window.__PGC_USERSTATE__.vip_info || {}\n                        , a = window.__PGC_USERSTATE__.login && (1 === window.__PGC_USERSTATE__.pay || 1 === window.__PGC_USERSTATE__.sponsor || 1 === window.__PGC_USERSTATE__.pay_pack_paid || 0 !== e.type && 1 === e.status);\n                    window.playerCallback = function () {\n                        window.jwTimer = setInterval(function () {\n                            var e = window.document.querySelector(\"#player_placeholder\");\n                            \"function\" == typeof e.jwAddEventListener && (e.jwAddEventListener(\"jwplayerMediaComplete\", \"function(){ window.showPreviewMask();}\"),\n                                clearInterval(window.jwTimer))\n                        }, 1e3);\n                        var e = function () {\n                            window.player && \"function\" == typeof window.player.addEventListener && (window.player.addEventListener(\"video_media_play\", function () {\n                                window.hadVideoPlay = !0\n                            }),\n                                window.player.addEventListener(\"video_media_seek\", function () {\n                                    window.hadVideoPlay = !0\n                                }),\n                                clearInterval(window.vMediaPTimer))\n                        };\n                        window.vMediaPTimer = setInterval(e, 1e3),\n                            e()\n                    }\n                        ,\n                        window.getPlayerExtraParams = function () {\n                            var e = window.__PGC_USERSTATE__.paster || {}\n                                , i = ep.skip || {}\n                                , t = window.__PGC_USERSTATE__.progress || {\n                                    last_ep_id: -1\n                                }\n                                , o = !1;\n                            o = !window.hadVideoPlay && (t.last_ep_id < 0 && !t.last_ep_index && !t.last_time);\n                            var n = window.__PGC_USERSTATE__ && window.__PGC_USERSTATE__.epsToastType\n                                , d = window.__PGC_USERSTATE__ && window.__PGC_USERSTATE__.toastTypeMap;\n                            return {\n                                title: ep.longTitle ? ep.titleFormat + \" \" + ep.longTitle : ep.titleFormat,\n                                mediaTitle: md.title,\n                                epTitle: ep.longTitle,\n                                epIndex: ep.titleFormat,\n                                epCover: ep.cover,\n                                epStat: ep.epStatus || md.status,\n                                squarePic: md.squareCover || \"//static.hdslb.com/images/square-cover-default.png\",\n                                record: 0 !== ep.sectionType ? \"\" : md.playerRecord ? encodeURIComponent(md.playerRecord) : \"\",\n                                shareText: window.__INITIAL_STATE__.h1Title + \" #哔哩哔哩#\",\n                                sharePic: md.cover,\n                                shareUrl: \"//www.bilibili.com/bangumi/play/ss\" + md.ssId + \"/\",\n                                isStart: md.pub.isStart || !md.rights.canWatch && 0 !== ep.sectionType,\n                                isPreview: md.rights.isPreview && s,\n                                allowTicket: md.payMent.sixType.allowTicket,\n                                deadLineToast: md.payMent.sixType.allowTimeLimit && !s && window.__PGC_USERSTATE__.dead_line ? window.__PGC_USERSTATE__.dead_line : void 0,\n                                canPlay1080: a,\n                                allowSponsor: md.rights.allowBp,\n                                multiMode: md.multiMode,\n                                epNeedPay: s,\n                                isFollow: 1 === window.__PGC_USERSTATE__.follow,\n                                canWatch: md.rights.canWatch,\n                                sponsorWeekList: [],\n                                sponsorTotalList: [],\n                                sponsorCount: 0,\n                                danmakuListOffset: md.specialCover ? 0 : 64,\n                                paster: {\n                                    aid: ep.aid || 0,\n                                    cid: e.aid || 0,\n                                    type: e.type || 0,\n                                    duration: e.duration || 0,\n                                    allow_jump: e.allow_jump || 0,\n                                    url: e.url ? e.url : \"\"\n                                },\n                                pubTime: md.pub.timeShow,\n                                recommend: [],\n                                epList: {},\n                                nextEp: null,\n                                headTail: {\n                                    first: !!window.__PGC_USERSTATE__.login && o,\n                                    op: [i.op && i.op.start || 0, i.op && i.op.end || 0],\n                                    ed: [i.ed && i.ed.start || 0, i.ed && i.ed.end || 0],\n                                    hasSkip: ep.hasSkip || !1\n                                },\n                                whitelistToast: n && d && \"white_can_watch\" === n[ep.id] && d[n[ep.id]] && d[n[ep.id]].text_info,\n                                preSaleToast: n && d && \"presell\" === n[ep.id] && d[n[ep.id]] && d[n[ep.id]].text_info\n                            }\n                        }\n                        ;\n                    var i, t, o;\n                    if (\"bangumi\" === ep.from) {\n                        var n = (i = new RegExp(\"(^|&)\" + \"t\" + \"=([^&|^#]*)(&|#|$)\"),\n                            t = window.location.href.split(\"?\"),\n                            null !== (o = (1 < t.length ? t[1] : \"\").match(i)) ? unescape(o[2]) : \"\")\n                            , d = window.__PGC_USERSTATE__.progress || {}\n                            , r = d.last_time || 0\n                            , l = -1 < d.last_ep_id ? d.last_ep_id : void 0\n                            , p = encodeURIComponent(\"module=\" + (2 !== md.ssType ? \"bangumi\" : \"movie\") + \"&season_type=\" + md.ssType)\n                            , _ = (1 === (e = window.__PGC_USERSTATE__.vipInfo || {}).type || 2 === e.type) && 1 === e.status\n                            , w = window.__PGC_USERSTATE__.paster || {}\n                            , c = !_ && 1 !== window.__PGC_USERSTATE__.pay && 1 !== window.__PGC_USERSTATE__.sponsor && w.cid && 0 < w.cid ? 1 : void 0\n                            , m = window.__BILI_CONFIG__ && window.__BILI_CONFIG__.show_bv && ep.bvid ? \"&bvid=\" + ep.bvid + \"&show_bv=1\" : \"\"\n                            , u = \"cid=\" + ep.cid + \"&aid=\" + ep.aid + m + \"&season_type=\" + md.ssType + (r ? \"&lastplaytime=\" + 1e3 * r : \"\") + (l ? \"&last_ep_id=\" + l : \"\") + (c ? \"&pre_ad=1\" : \"\") + \"&has_next=\" + (ep.hasNext ? 1 : \"\") + (window.isWide ? \"&as_wide=1\" : \"\") + \"&player_type=\" + (2 !== md.ssType ? 1 : 2) + \"&urlparam=\" + p + \"&seasonId=\" + md.ssId + \"&episodeId=\" + ep.id + \"&record=\" + (0 !== ep.sectionType ? \"\" : md.playerRecord ? encodeURIComponent(md.playerRecord) : \"\") + \"&t=\" + n + (ep.attribute ? \"&attribute=\" + ep.attribute : \"\");\n                        window.EmbedPlayer(\"player\", \"//static.hdslb.com/play.swf\", u, \"\", \"\", window.playerCallback)\n                    } else {\n                        (window.document.querySelector(\"#bilibili-player\") || window.document.querySelector(\"#bofqi\")).innerHTML = '<embed height=\"100%\" width=\"100%\" src=\"//static.hdslb.com/tc.swf\" type=\"application/x-shockwave-flash\" pluginspage=\"//www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash\" allowscriptaccess=\"always\" rel=\"noreferrer\" quality=\"high\" flashvars=\"bili-cid=' + ep.cid + \"&amp;bili-aid=\" + ep.aid + \"&amp;vid=\" + ep.vid + '\" allowfullscreen=\"true\">'\n                    }\n                }\n                    , promiseArr = [];\n                if (window.__PGC_USERSTATE__)\n                    startPlayer();\n                else {\n                    var cnt = 0;\n                    function t() {\n                        new Promise(function (e) {\n                            window.$.ajax({\n                                url: \"//api.bilibili.com/pgc/view/web/season/user/status\",\n                                type: \"get\",\n                                dataType: \"json\",\n                                xhrFields: {\n                                    withCredentials: !0\n                                },\n                                data: {\n                                    season_id: md.ssId,\n                                    ts: (new Date).getTime()\n                                },\n                                success: function (e) {\n                                    0 === e.code ? window.__PGC_USERSTATE__ = e.result || {} : window.__PGC_USERSTATE__ = {}\n                                }\n                            }).always(e)\n                        }\n                        ).then(function () {\n                            startPlayer()\n                        })\n                    }\n                    window.jQuery || (cnt += 1,\n                        loadScript(\"//static.hdslb.com/js/jquery.min.js\", function () {\n                            0 == --cnt && t()\n                        })),\n                        window.Promise || (cnt += 1,\n                            loadScript(\"//static.hdslb.com/js/promise.auto.min.js\", function () {\n                                0 == --cnt && t()\n                            }))\n                }\n                function startPlayer() {\n                    var e = !1\n                        , i = !0\n                        , t = !1;\n                    window.__INITIAL_STATE__.sections.forEach(function (e) {\n                        0 < e.epList.length && (t = !0)\n                    });\n                    var o = window.__PGC_USERSTATE__.vipInfo || {}\n                        , n = o && (1 === o.type || 2 === o.type) && 1 === o.status\n                        , d = !(6 !== ep.epStatus && 7 !== ep.epStatus && 13 !== ep.epStatus || window.__PGC_USERSTATE__.login && n)\n                        , s = 12 === ep.epStatus && (!window.__PGC_USERSTATE__.login || 1 !== window.__PGC_USERSTATE__.pay_pack_paid)\n                        , a = ep.rights && ep.rights.allow_demand && window.__PGC_USERSTATE__.demand && window.__PGC_USERSTATE__.demand.no_pay_epids && -1 !== window.__PGC_USERSTATE__.demand.no_pay_epids.indexOf(ep.id);\n                    if (1 !== window.__PGC_USERSTATE__.pay && (d || 8 === ep.epStatus || 9 === ep.epStatus || s) && (e = !0),\n                        a || 14 === ep.epStatus ? e = !0 : md.pub.isStart || 0 !== window.__INITIAL_STATE__.epList.length || t ? md.rights.isPreview && !ep.attribute && (0 < window.__INITIAL_STATE__.epList.length || t) ? i = !0 : e && (i = !1) : i = !1,\n                        i) {\n                        if (\"bangumi\" === ep.from) {\n                            var l = setTimeout(function () {\n                                clearTimeout(l),\n                                    window.PlayerMediaLoaded = void 0,\n                                    insertScript()\n                            }, 4e3);\n                            window.PlayerMediaLoaded = function () {\n                                clearTimeout(l),\n                                    window.performance && window.performance.timing && (window.performance.timing.firstscreenfinish = window.performance.timing.playerStage3 || (new Date).getTime()),\n                                    insertScript(),\n                                    window.PlayerMediaLoaded = void 0\n                            }\n                        } else\n                            insertScript();\n                        r(e)\n                    } else\n                        insertScript()\n                }\n            }\n        }\n    </script>\n</body>\n\n</html>";

    function modifyGlobalValue(name, options) {
        const _window = window;
        const name_origin = `${name}_origin`;
        _window[name_origin] = _window[name];
        let value = undefined;
        Object.defineProperty(_window, name, {
            configurable: true,
            enumerable: true,
            get: () => {
                var _a;
                (_a = options === null || options === void 0 ? void 0 : options.onRead) === null || _a === void 0 ? void 0 : _a.call(options, value);
                return value;
            },
            set: (val) => {
                value = options.onWrite(val);
            }
        });
        if (_window[name_origin]) {
            _window[name] = _window[name_origin];
        }
    }
    let callbackCount = 1000;
    function appendScript(node, innerHTML, props) {
        // log(`fuck: ${JSON.stringify(props)}`)
        return new Promise((resolve, reject) => {
            let onLoad;
            if (props.src) {
                onLoad = resolve;
            }
            else if (!props.type || props.type === 'text/javascript') {
                const anyWindow = window;
                const key = `balh_appendScript_${callbackCount++}`;
                anyWindow[key] = resolve;
                innerHTML = `try { ${innerHTML} } finally { window['${key}'](); } `;
            }
            else {
                setTimeout(resolve, 0);
            }
            node.appendChild(createElement('script', {
                // 所有属性为null/''时都替换成undefined
                type: props.type || undefined,
                src: props.src || undefined,
                crossOrigin: props.crossOrigin || undefined,
                // 无论成功失败, 都需要让异步方法继续执行下去
                event: { load: onLoad, error: onLoad },
            }, innerHTML));
        });
    }
    function cloneChildNodes(fromNode, toNode) {
        return __awaiter(this, void 0, void 0, function* () {
            // 坑1: 一定要倒序遍历, forEach内部使用的顺序遍历实现, 直接remove()会让顺序混乱
            for (let i = toNode.childNodes.length - 1; i >= 0; i--) {
                toNode.childNodes[i].remove();
            }
            for (let i = 0; i < fromNode.childNodes.length; i++) {
                const it = fromNode.childNodes[i];
                if (it instanceof HTMLScriptElement) {
                    // 坑2: 要让script内容正常执行, 一定要重新构建script标签
                    yield appendScript(toNode, it.innerHTML, { type: it.type, src: it.src, crossOrigin: it.crossOrigin });
                }
                else {
                    // 坑3: 不clone可能导致forEach方法出问题...
                    toNode.appendChild(it.cloneNode(true));
                }
            }
        });
    }
    function fixThailandSeason(ep_id, season_id) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // 部分泰区番剧通过 bangumi 无法取得数据或者数据不完整
            // 通过泰区 api 补全
            // https://github.com/yujincheng08/BiliRoaming/issues/112
            const thailandApi = new BiliBiliApi(balh_config.server_custom_th);
            const origin = yield thailandApi.getSeasonInfoByEpSsIdOnThailand(ep_id, season_id);
            const input_episodes = origin.result.modules[0].data.episodes;
            origin.result.actors = origin.result.actor.info;
            origin.result.is_paster_ads = 0;
            origin.result.jp_title = origin.result.origin_name;
            origin.result.newest_ep = origin.result.new_ep;
            origin.result.season_status = origin.result.status;
            origin.result.season_title = origin.result.title;
            origin.result.total_ep = input_episodes.length;
            origin.result.rights.watch_platform = 1;
            origin.result.episodes = [];
            input_episodes.forEach((ep) => {
                var _a;
                ep.episode_status = ep.status;
                ep.ep_id = ep.id;
                ep.index = ep.title;
                ep.index_title = ep.long_title;
                (_a = origin.result.episodes) === null || _a === void 0 ? void 0 : _a.push(ep);
            });
            origin.result.style = [];
            (_a = origin.result.styles) === null || _a === void 0 ? void 0 : _a.forEach((it) => {
                origin.result.style.push(it.name);
            });
            let result = JSON.parse(JSON.stringify(origin));
            return result;
        });
    }
    let invalidInitialState;
    function fixBangumiPlayPage() {
        util_init(() => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            if (util_page.bangumi_md()) {
                // 临时保存当前的season_id
                cookieStorage.set('balh_curr_season_id', (_b = (_a = window === null || window === void 0 ? void 0 : window.__INITIAL_STATE__) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.season_id, '');
            }
            if (util_page.anime_ep() || util_page.anime_ss()) {
                const $app = document.getElementById('app');
                if (!$app || invalidInitialState) {
                    // 这个fixBangumiPlayPage()函数，本来是用来重建appOnly页面的，不过最近这样appOnly的页面基本上没有了，反而出现了一批非appOnly但页面也需要重建的情况
                    // 如：https://www.bilibili.com/bangumi/media/md28235576
                    // 故当前默认值改为false🤔
                    let appOnly = (_e = (_d = (_c = invalidInitialState === null || invalidInitialState === void 0 ? void 0 : invalidInitialState.mediaInfo) === null || _c === void 0 ? void 0 : _c.rights) === null || _d === void 0 ? void 0 : _d.appOnly) !== null && _e !== void 0 ? _e : false;
                    try {
                        // 读取保存的season_id
                        const season_id = (window.location.pathname.match(/\/bangumi\/play\/ss(\d+)/) || ['', cookieStorage.get('balh_curr_season_id')])[1];
                        const ep_id = (window.location.pathname.match(/\/bangumi\/play\/ep(\d+)/) || ['', ''])[1];
                        const bilibiliApi = new BiliBiliApi(balh_config.server_bilibili_api_proxy);
                        let templateArgs = null;
                        // 不限制地区的接口，可以查询泰区番剧，该方法前置给代理服务器和BP节省点请求
                        // 如果该接口失效，自动尝试后面的方法
                        try {
                            let result = yield bilibiliApi.getSeasonInfoByEpSsIdOnBangumi(ep_id, season_id);
                            if (balh_config.server_custom_th && (result.code == -404 || result.result.up_info.mid == 677043260 /* 主站残留泰区数据，部分不完整 */)) {
                                result = yield fixThailandSeason(ep_id, season_id);
                                appOnly = true;
                            }
                            if (result.code) {
                                throw result;
                            }
                            const ep = ep_id != '' ? result.result.episodes.find(ep => ep.ep_id === +ep_id) : result.result.episodes[0];
                            if (!ep) {
                                throw `通过bangumi接口未找到${ep_id}对应的视频信息`;
                            }
                            const eps = JSON.stringify(result.result.episodes.map((item, index) => {
                                // 返回的数据是有序的，不需要另外排序                                
                                if (/^\d+(\.\d+)?$/.exec(item.index)) {
                                    item.titleFormat = "第" + item.index + "话 " + item.index_title;
                                }
                                else {
                                    item.titleFormat = item.index;
                                    item.index_title = item.index;
                                }
                                item.loaded = true;
                                item.epStatus = item.episode_status;
                                item.sectionType = 0;
                                item.id = +item.ep_id;
                                item.i = index;
                                item.link = 'https://www.bilibili.com/bangumi/play/ep' + item.ep_id;
                                item.title = item.index;
                                return item;
                            }));
                            let titleForma;
                            if (ep.index_title) {
                                titleForma = ep.index_title;
                            }
                            else {
                                titleForma = "第" + ep.index + "话";
                            }
                            templateArgs = {
                                id: ep.ep_id,
                                aid: ep.aid,
                                cid: ep.cid,
                                bvid: ep.bvid,
                                title: ep.index,
                                titleFormat: Strings.escapeSpecialChars(titleForma),
                                htmlTitle: result.result.title,
                                mediaInfoId: result.result.media_id,
                                mediaInfoTitle: result.result.title,
                                evaluate: Strings.escapeSpecialChars(result.result.evaluate),
                                cover: result.result.cover,
                                episodes: eps,
                                ssId: result.result.season_id,
                                appOnly: appOnly,
                            };
                        }
                        catch (e) {
                            util_warn('通过bangumi接口获取ep信息失败', e);
                        }
                        if (balh_config.server_bilibili_api_proxy && !templateArgs) {
                            try {
                                const result = yield bilibiliApi.getSeasonInfoByEpId(ep_id);
                                if (result.code) {
                                    throw result;
                                }
                                const ep = result.result.episodes.find(ep => ep.id === +ep_id);
                                if (!ep) {
                                    throw `未找到${ep_id}对应的视频信息`;
                                }
                                const eps = JSON.stringify(result.result.episodes.map((item, index) => {
                                    item.loaded = true;
                                    item.epStatus = item.status;
                                    item.sectionType = 0;
                                    item.titleFormat = "第" + item.title + "话 " + item.long_title;
                                    item.i = index;
                                    return item;
                                }));
                                templateArgs = {
                                    id: ep.id,
                                    aid: ep.aid,
                                    cid: ep.cid,
                                    bvid: ep.bvid,
                                    title: ep.title,
                                    titleFormat: ep.long_title,
                                    htmlTitle: result.result.season_title,
                                    mediaInfoId: result.result.media_id,
                                    mediaInfoTitle: result.result.season_title,
                                    evaluate: result.result.evaluate,
                                    cover: result.result.cover,
                                    episodes: eps,
                                    ssId: result.result.season_id,
                                    appOnly: appOnly,
                                };
                            }
                            catch (e) {
                                // 很多balh_config.server_bilibili_api_proxy并不支持代理所有Api
                                // catch一下, 回退到用biliplus的api的读取ep的信息
                                util_warn('通过自定义代理服务器获取ep信息失败', e);
                            }
                        }
                        if (!templateArgs) {
                            if (!season_id) {
                                throw '无法获取season_id, 请先刷新动画对应的www.bilibili.com/bangumi/media/md页面';
                            }
                            const result = yield BiliPlusApi.season(season_id);
                            if (result.code) {
                                throw result;
                            }
                            const ep = result.result.episodes.find((ep) => ep.episode_id === ep_id);
                            if (!ep) {
                                throw '无法查询到ep信息, 请先刷新动画对应的www.bilibili.com/bangumi/media/md页面';
                            }
                            let pvCounter = 1;
                            const ep_length = result.result.episodes.length;
                            const eps = JSON.stringify(result.result.episodes.map((item) => {
                                if (/^\d+$/.exec(item.index)) {
                                    item.titleFormat = "第" + item.index + "话 " + item.index_title;
                                    item.i = +item.index - 1;
                                }
                                else {
                                    item.titleFormat = item.index;
                                    item.i = ep_length - pvCounter;
                                    pvCounter++;
                                    item.index_title = item.index;
                                }
                                item.link = 'https://www.bilibili.com/bangumi/play/ep' + item.episode_id;
                                item.bvid = Converters.aid2bv(+item.av_id);
                                item.badge = '';
                                item.badge_info = { "bg_color": "#FB7299", "bg_color_night": "#BB5B76", "text": "" };
                                item.badge_type = 0;
                                item.title = item.index;
                                item.id = +item.episode_id;
                                item.cid = +item.danmaku;
                                item.aid = +item.av_id;
                                item.loaded = true;
                                item.epStatus = item.episode_status;
                                item.sectionType = item.episode_type;
                                item.rights = { 'allow_demand': 0, 'allow_dm': 1, 'allow_download': 0, 'area_limit': 0 };
                                return item;
                            }).sort((a, b) => {
                                return a.i - b.i; // BP接口返回的数据是无序的，需要排序
                            }));
                            templateArgs = {
                                id: ep.episode_id,
                                aid: ep.av_id,
                                cid: ep.danmaku,
                                bvid: Converters.aid2bv(+ep.av_id),
                                title: ep.index,
                                titleFormat: ep.index_title,
                                htmlTitle: result.result.title,
                                mediaInfoTitle: result.result.title,
                                mediaInfoId: (_g = (_f = result.result.media) === null || _f === void 0 ? void 0 : _f.media_id) !== null && _g !== void 0 ? _g : 28229002,
                                evaluate: result.result.evaluate,
                                cover: result.result.cover,
                                episodes: eps,
                                ssId: season_id,
                                appOnly: appOnly,
                            };
                        }
                        const pageTemplateString = Strings.replaceTemplate(pageTemplate, templateArgs);
                        const template = new DOMParser().parseFromString(pageTemplateString, 'text/html');
                        yield cloneChildNodes(template.getElementsByTagName('head')[0], document.head);
                        yield cloneChildNodes(template.getElementsByTagName('body')[0], document.body);
                        window.bangumi_area_limit_hack._setupSettings();
                    }
                    catch (e) {
                        util_warn('重建ep页面失败', e);
                        ui.alert(Objects.stringify(e));
                    }
                }
            }
            if (util_page.new_bangumi()) {
                let $eplist_module = document.getElementById('eplist_module');
                if (!$eplist_module) {
                    const $danmukuBox = document.getElementById('danmukuBox');
                    if (!$danmukuBox) {
                        util_warn('danmukuBox not found!');
                        return;
                    }
                    // 插入eplist_module的位置和内容一定要是这样... 不能改...
                    // 写错了会导致Vue渲染出错, 比如视频播放窗口消失之类的(╯°口°)╯(┴—┴
                    const $template = createElement('template', {}, `<div id="eplist_module" class="ep-list-wrapper report-wrap-module"><div class="list-title clearfix"><h4 title="正片">正片</h4> <span class="mode-change" style="position:relative"><i report-id="click_ep_switch" class="iconfont icon-ep-list-detail"></i> <!----></span> <!----> <span class="ep-list-progress">8/8</span></div> <div class="list-wrapper" style="display:none;"><ul class="clearfix" style="height:-6px;"></ul></div></div>`.trim());
                    (_h = $danmukuBox.parentElement) === null || _h === void 0 ? void 0 : _h.replaceChild($template.content.firstElementChild, $danmukuBox.nextSibling.nextSibling);
                }
            }
        }));
    }
    function area_limit_for_vue() {
        if (isClosed())
            return;
        if (!((util_page.av() && balh_config.enable_in_av) || util_page.new_bangumi())) {
            return;
        }
        function replacePlayInfo() {
            util_debug("window.__playinfo__", window.__playinfo__);
            window.__playinfo__origin = window.__playinfo__;
            let playinfo = undefined;
            // 将__playinfo__置空, 让播放器去重新加载它...
            Object.defineProperty(window, '__playinfo__', {
                configurable: true,
                enumerable: true,
                get: () => {
                    util_debug('__playinfo__', 'get');
                    return playinfo;
                },
                set: (value) => {
                    // debugger
                    util_debug('__playinfo__', 'set');
                    // 原始的playinfo为空, 且页面在loading状态, 说明这是html中对playinfo进行的赋值, 这个值可能是有区域限制的, 不能要
                    if (!window.__playinfo__origin && window.document.readyState === 'loading') {
                        util_debug('__playinfo__', 'init in html', value);
                        window.__playinfo__origin = value;
                        return;
                    }
                    playinfo = value;
                },
            });
        }
        function replaceUserState() {
            modifyGlobalValue('__PGC_USERSTATE__', {
                onWrite: (value) => {
                    if (value) {
                        // 区域限制
                        // todo      : 调用areaLimit(limit), 保存区域限制状态
                        // 2019-08-17: 之前的接口还有用, 这里先不保存~~
                        value.area_limit = 0;
                        // 会员状态
                        if (balh_config.blocked_vip && value.vip_info) {
                            value.vip_info.status = 1;
                            value.vip_info.type = 2;
                        }
                    }
                    return value;
                }
            });
        }
        function replaceInitialState() {
            modifyGlobalValue('__INITIAL_STATE__', {
                onWrite: (value) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    if (((_a = value === null || value === void 0 ? void 0 : value.epInfo) === null || _a === void 0 ? void 0 : _a.id) === -1 && ((_b = value === null || value === void 0 ? void 0 : value.epList) === null || _b === void 0 ? void 0 : _b.length) === 0 && ((_d = (_c = value === null || value === void 0 ? void 0 : value.mediaInfo) === null || _c === void 0 ? void 0 : _c.rights) === null || _d === void 0 ? void 0 : _d.limitNotFound) === true) {
                        invalidInitialState = value;
                        return undefined;
                    }
                    if (value && value.epInfo && value.epList && balh_config.blocked_vip) {
                        for (let ep of [value.epInfo, ...value.epList]) {
                            // 13貌似表示会员视频, 2为普通视频
                            if (ep.epStatus === 13) {
                                util_debug('epStatus 13 => 2', ep);
                                ep.epStatus = 2;
                            }
                        }
                    }
                    if (((_f = (_e = value === null || value === void 0 ? void 0 : value.mediaInfo) === null || _e === void 0 ? void 0 : _e.rights) === null || _f === void 0 ? void 0 : _f.appOnly) === true) {
                        value.mediaInfo.rights.appOnly = false;
                        window.__balh_app_only__ = true;
                    }
                    ifNotNull((_g = value === null || value === void 0 ? void 0 : value.epInfo) === null || _g === void 0 ? void 0 : _g.rights, (it) => it.area_limit = 0);
                    (_h = value === null || value === void 0 ? void 0 : value.epList) === null || _h === void 0 ? void 0 : _h.forEach((it) => ifNotNull(it === null || it === void 0 ? void 0 : it.rights, (it) => it.area_limit = 0));
                    return value;
                }
            });
        }
        replaceInitialState();
        replaceUserState();
        replacePlayInfo();
        fixBangumiPlayPage();
        modifyGlobalValue('BilibiliPlayer', {
            onWrite: (value) => {
                return value;
            },
            onRead: (value) => {
            }
        });
    }

    function isLogin() {
        return localStorage.oauthTime !== undefined;
    }
    function clearLoginFlag() {
        delete localStorage.oauthTime;
    }
    function updateLoginFlag(loadCallback) {
        Async.jsonp(balh_config.server + '/login?act=expiretime')
            .then(() => loadCallback && loadCallback(true));
        // .catch(() => loadCallback && loadCallback(false)) // 请求失败不需要回调
    }
    function isLoginBiliBili() {
        return cookieStorage['DedeUserID'] !== undefined;
    }
    // 当前在如下情况才会弹一次登录提示框:
    // 1. 第一次使用
    // 2. 主站+服务器都退出登录后, 再重新登录主站
    function checkLoginState() {
        // 给一些状态，设置初始值
        localStorage.balh_must_remind_login_v3 === undefined && (localStorage.balh_must_remind_login_v3 = r.const.TRUE);
        if (isLoginBiliBili()) {
            if (!localStorage.balh_old_isLoginBiliBili // 主站 不登录 => 登录
                || localStorage.balh_pre_server !== balh_config.server // 代理服务器改变了
                || localStorage.balh_must_remind_login_v3) { // 设置了"必须提醒"flag
                clearLoginFlag();
                updateLoginFlag(() => {
                    if (!isLogin() || !localStorage.access_key) {
                        localStorage.balh_must_remind_login_v3 = r.const.FALSE;
                        ui.pop({
                            content: [
                                createElement('text', `${GM_info.script.name}\n要不要考虑进行一下授权？\n\n授权后可以观看区域限定番剧的1080P\n（如果你是大会员或承包过这部番的话）\n\n你可以随时在设置中打开授权页面`)
                            ],
                            onConfirm: () => {
                                var _a;
                                biliplus_login.showLogin();
                                (_a = document.querySelector('#AHP_Notice')) === null || _a === void 0 ? void 0 : _a.remove();
                            }
                        });
                    }
                });
            }
            else if ((isLogin() && Date.now() - parseInt(localStorage.oauthTime) > 24 * 60 * 60 * 1000) // 已登录，每天为周期检测key有效期，过期前五天会自动续期
                || localStorage.balh_must_updateLoginFlag) { // 某些情况下，必须更新一次
                updateLoginFlag(() => localStorage.balh_must_updateLoginFlag = r.const.FALSE);
            }
        }
        localStorage.balh_old_isLoginBiliBili = isLoginBiliBili() ? r.const.TRUE : r.const.FALSE;
        localStorage.balh_pre_server = balh_config.server;
    }
    function showLogin() {
        const balh_auth_window = window.open('about:blank');
        balh_auth_window.document.title = 'BALH - 授权';
        balh_auth_window.document.body.innerHTML = '<meta charset="UTF-8" name="viewport" content="width=device-width">正在获取授权，请稍候……';
        window.balh_auth_window = balh_auth_window;
        window.$.ajax('https://passport.bilibili.com/login/app/third?appkey=27eb53fc9058f8c3&api=https%3A%2F%2Fwww.mcbbs.net%2Ftemplate%2Fmcbbs%2Fimage%2Fspecial_photo_bg.png&sign=04224646d1fea004e79606d3b038c84a', {
            xhrFields: { withCredentials: true },
            type: 'GET',
            dataType: 'json',
            success: (data) => {
                if (data.data.has_login) {
                    balh_auth_window.document.body.innerHTML = '<meta charset="UTF-8" name="viewport" content="width=device-width">正在跳转……';
                    balh_auth_window.location.href = data.data.confirm_uri;
                }
                else {
                    balh_auth_window.close();
                    ui.alert('必须登录B站才能正常授权', () => {
                        location.href = 'https://passport.bilibili.com/login';
                    });
                }
            },
            error: (e) => {
                alert('error');
            }
        });
    }
    function showLogout() {
        ui.popFrame(balh_config.server + '/login?act=logout');
    }
    // 监听登录message
    window.addEventListener('message', function (e) {
        var _a;
        if (typeof e.data !== 'string')
            return; // 只处理e.data为string的情况
        switch (e.data.split(':')[0]) {
            case 'BiliPlus-Login-Success': {
                //登入
                localStorage.balh_must_updateLoginFlag = r.const.TRUE;
                Promise.resolve('start')
                    .then(() => Async.jsonp(balh_config.server + '/login?act=getlevel'))
                    .then(() => location.reload())
                    .catch(() => location.reload());
                break;
            }
            case 'BiliPlus-Logout-Success': {
                //登出
                clearLoginFlag();
                location.reload();
                break;
            }
            case 'balh-login-credentials': {
                (_a = window.balh_auth_window) === null || _a === void 0 ? void 0 : _a.close();
                let url = e.data.split(': ')[1];
                const access_key = new URL(url).searchParams.get('access_key');
                localStorage.access_key = access_key;
                ui.popFrame(url.replace('https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png', balh_config.server + '/login'));
                break;
            }
        }
    });
    util_init(() => {
        if (!(util_page.player() || util_page.av())) {
            checkLoginState();
        }
    }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER);
    const biliplus_login = {
        showLogin,
        showLogout,
        isLogin,
        isLoginBiliBili,
    };

    const balh_feature_runPing = function () {
        const pingOutput = document.getElementById('balh_server_ping');
        if (!pingOutput) {
            return;
        }
        let xhr = new XMLHttpRequest();
        let testUrl = [r.const.server.S0, r.const.server.S1];
        let testUrlIndex = 0;
        let isReused = false;
        let prevNow;
        let outputArr = [];
        if (balh_config.server_custom) {
            testUrl.push(balh_config.server_custom);
        }
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
            testUrlIndex < testUrl.length ? pingLoop() : pingOutput.appendChild(createElement('a', { href: 'javascript:', event: { click: balh_feature_runPing } }, [createElement('text', '\n再测一次？')]));
        };
        pingLoop();
    };
    function settings() {
        function addSettingsButton() {
            let indexNav = document.querySelector('.bangumi-nav-right, #index_nav, #fixnav_report');
            let settingBtnSvgContainer;
            const createBtnStyle = (size, diffCss) => {
                diffCss = diffCss || `
                        #balh-settings-btn {
                            bottom: 110px;
                            border: 1px solid #e5e9ef;
                            border-radius: 4px;
                            background: #f6f9fa;
                            margin-top: 4px;
                        }
                        #balh-settings-btn .btn-gotop {
                            text-align: center;
                        }
                    `;
                return createElement('style', {}, [createElement('text', `
                        ${diffCss}
                        #balh-settings-btn {
                            width: ${size};
                            height: ${size};
                            cursor: pointer;
                        }
                        #balh-settings-btn:hover {
                            background: #00a1d6;
                            border-color: #00a1d6;
                        }
                        #balh-settings-btn .icon-saturn {
                            width: 30px;
                            height: ${size};
                            fill: rgb(153,162,170);
                        }
                        #balh-settings-btn:hover .icon-saturn {
                            fill: white;
                        }
                `)]);
            };
            if (indexNav == null) {
                // 信息页添加到按钮右侧
                if (util_page.bangumi_md()) {
                    indexNav = document.querySelector('.media-info-btns');
                    indexNav === null || indexNav === void 0 ? void 0 : indexNav.appendChild(createBtnStyle('44px', `
                            #balh-settings-btn {
                                float: left;
                                margin: 3px 0 0 20px;
                                background: #FFF;
                                border-radius: 10px;
                            }
                            #balh-settings-btn>:first-child {
                                text-align: center;
                                height: 100%;
                            }
                        `));
                }
                else if (util_page.watchroom()) {
                    const _indexNav = indexNav = document.body.appendChild(createElement('div', { style: { position: 'fixed', right: '6px', bottom: '45px', zIndex: '129', textAlign: 'center', display: 'none' } }));
                    indexNav.appendChild(createBtnStyle('45px'));
                    window.addEventListener('scroll', (event) => {
                        _indexNav.style.display = window.scrollY < 600 ? 'none' : '';
                    });
                }
                else {
                    // 新版视频页面的“返回页面顶部”按钮, 由Vue控制, 对内部html的修改会被重置, 故只能重新创建新的indexNav
                    let navTools = document.querySelector('.nav-tools, .float-nav');
                    if (navTools) {
                        let bottom = navTools.className.includes('float-nav') ? '53px' : '45px';
                        const _indexNav = indexNav = document.body.appendChild(createElement('div', { style: { position: 'fixed', right: '6px', bottom: bottom, zIndex: '129', textAlign: 'center', display: 'none' } }));
                        indexNav.appendChild(createBtnStyle('45px'));
                        window.addEventListener('scroll', (event) => {
                            _indexNav.style.display = window.scrollY < 600 ? 'none' : '';
                        });
                    }
                }
                if (indexNav) {
                    settingBtnSvgContainer = indexNav.appendChild(createElement('div', { id: 'balh-settings-btn', title: GM_info.script.name + ' 设置', event: { click: showSettings } }, [createElement('div', {})])).firstChild;
                }
            }
            else {
                // 视频页添加到回顶部下方
                window.dispatchEvent(new Event('resize'));
                indexNav.style.display = 'block';
                indexNav.appendChild(createBtnStyle('46px'));
                settingBtnSvgContainer = indexNav.appendChild(createElement('div', { id: 'balh-settings-btn', title: GM_info.script.name + ' 设置', event: { click: showSettings } }, [createElement('div', { className: 'btn-gotop' })])).firstChild;
            }
            settingBtnSvgContainer && (settingBtnSvgContainer.innerHTML = `<!-- https://www.flaticon.com/free-icon/saturn_53515 --><svg class="icon-saturn" viewBox="0 0 612.017 612.017"><path d="M596.275,15.708C561.978-18.59,478.268,5.149,380.364,68.696c-23.51-7.384-48.473-11.382-74.375-11.382c-137.118,0-248.679,111.562-248.679,248.679c0,25.902,3.998,50.865,11.382,74.375C5.145,478.253-18.575,561.981,15.724,596.279c34.318,34.318,118.084,10.655,216.045-52.949c23.453,7.365,48.378,11.344,74.241,11.344c137.137,0,248.679-111.562,248.679-248.68c0-25.862-3.979-50.769-11.324-74.24C606.931,133.793,630.574,50.026,596.275,15.708zM66.435,545.53c-18.345-18.345-7.919-61.845,23.338-117.147c22.266,39.177,54.824,71.716,94.02,93.943C128.337,553.717,84.837,563.933,66.435,545.53z M114.698,305.994c0-105.478,85.813-191.292,191.292-191.292c82.524,0,152.766,52.605,179.566,125.965c-29.918,41.816-68.214,87.057-113.015,131.839c-44.801,44.819-90.061,83.116-131.877,113.034C167.303,458.76,114.698,388.479,114.698,305.994z M305.99,497.286c-3.156,0-6.236-0.325-9.354-0.459c35.064-27.432,70.894-58.822,106.11-94.059c35.235-35.235,66.646-71.046,94.058-106.129c0.153,3.118,0.479,6.198,0.479,9.354C497.282,411.473,411.469,497.286,305.99,497.286z M428.379,89.777c55.303-31.238,98.803-41.683,117.147-23.338c18.402,18.383,8.187,61.902-23.204,117.377C500.095,144.62,467.574,112.043,428.379,89.777z"/></svg>`);
        }
        function _showSettings() {
            document.body.appendChild(settingsDOM);
            var form = settingsDOM.querySelector('form');
            // elements包含index的属性, 和以name命名的属性, 其中以name命名的属性是不可枚举的, 只能通过这种方式获取出来
            Object.getOwnPropertyNames(form.elements).forEach(function (name) {
                if (name.startsWith('balh_')) {
                    var key = name.replace('balh_', '');
                    var ele = form.elements[name];
                    if (ele.type === 'checkbox') {
                        ele.checked = balh_config[key];
                    }
                    else {
                        ele.value = balh_config[key];
                    }
                }
            });
            document.body.style.overflow = 'hidden';
        }
        // 往顶层窗口发显示设置的请求
        function showSettings() {
            window.top.postMessage('balh-show-setting', '*');
        }
        // 只有顶层窗口才接收请求
        if (window === window.top) {
            window.addEventListener('message', (event) => {
                if (event.data === 'balh-show-setting') {
                    _showSettings();
                    window.$('#upos-server')[0].value = balh_config.upos_server || '';
                }
            });
        }
        function onSignClick(event) {
            settingsDOM.click();
            switch (event.target.attributes['data-sign'].value) {
                default:
                case 'in':
                    biliplus_login.showLogin();
                    break;
                case 'out':
                    biliplus_login.showLogout();
                    break;
            }
        }
        function onSettingsFormChange(e) {
            const target = e.target;
            var name = target.name;
            var value = target.type === 'checkbox' ? (target.checked ? r.const.TRUE : r.const.FALSE) : target.value.trim();
            if (name.startsWith('balh_server_custom')) {
                // 自动/强制添加 https
                if (r.regex.bilibili_api_proxy.test(`https://${value}`)) {
                    value = `https://${value}`;
                    target.value = value;
                }
                if (r.regex.bilibili_api_proxy.test(value.replace('http://', 'https://'))) {
                    value = value.replace('http://', 'https://');
                    target.value = value;
                }
            }
            balh_config[name.replace('balh_', '')] = value;
            util_debug(name, ' => ', value);
        }
        // 第一次点击时:
        // 1. '复制日志&问题反馈' => '复制日志'
        // 2. 显示'问题反馈'
        // 3. 复制成功后请求跳转到GitHub
        // 之后的点击, 只是正常的复制功能~~
        function onCopyClick(event) {
            let issueLink = document.getElementById('balh-issue-link');
            if (!issueLink) {
                return;
            }
            let continueToIssue = issueLink.style.display === 'none';
            if (continueToIssue) {
                issueLink.style.display = 'inline';
                let copyBtn = document.getElementById('balh-copy-log');
                copyBtn.innerText = '复制日志';
            }
            let textarea = document.getElementById('balh-textarea-copy');
            textarea.style.display = 'inline-block';
            if (ui.copy(logHub.getAllMsg({ [localStorage.access_key]: '{{access_key}}' }), textarea)) {
                textarea.style.display = 'none';
                util_ui_msg.show(window.$(this), continueToIssue ? '复制日志成功; 点击确定, 继续提交问题(需要GitHub帐号)\n请把日志粘贴到问题描述中' : '复制成功', continueToIssue ? 0 : 3e3, continueToIssue ? 'button' : undefined, continueToIssue ? openIssuePage : undefined);
            }
            else {
                util_ui_msg.show(window.$(this), '复制失败, 请从下面的文本框手动复制', 5e3);
            }
        }
        function openIssuePage() {
            // window.open(r.url.issue)
            window.open(r.url.readme);
        }
        let printSystemInfoOk = false;
        // 鼠标移入设置底部的时候, 打印一些系统信息, 方便问题反馈
        function onMouseEnterSettingBottom(event) {
            if (!printSystemInfoOk) {
                printSystemInfoOk = true;
                util_debug('userAgent', navigator.userAgent);
            }
        }
        let customServerCheckText;
        let customTWServerCheckText;
        let customHKServerCheckText;
        let customCNServerCheckText;
        let customTHServerCheckText;
        var settingsDOM = createElement('div', { id: 'balh-settings', style: { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.7)', animationName: 'balh-settings-bg', animationDuration: '.5s', zIndex: 10000, cursor: 'pointer' }, event: { click: function (e) { if (e.target === this)
                    util_ui_msg.close(), document.body.style.overflow = '', this.remove(); } } }, [
            createElement('style', {}, [createElement('text', r.css.settings)]),
            createElement('div', { style: { position: 'absolute', background: '#FFF', borderRadius: '10px', padding: '20px', top: '50%', left: '50%', width: '600px', transform: 'translate(-50%,-50%)', cursor: 'default' } }, [
                createElement('h1', {}, [createElement('text', `${GM_info.script.name} v${GM_info.script.version} 参数设置`)]),
                createElement('br'),
                createElement('h6', { style: { color: '#d01d00', display: balh_config.server_custom ? 'none' : '' } }, [createElement('text', 'BiliPlus已被屏蔽，请填写自定义代理服务, 详见: '), createElement('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%BB%A3%E7%90%86%E6%9C%8D%E5%8A%A1%E5%99%A8', target: '_blank' }, [createElement('text', '帮助>自定义代理服务器')])]),
                createElement('br'),
                createElement('form', { id: 'balh-settings-form', event: { change: onSettingsFormChange } }, [
                    createElement('text', '代理服务器：'), createElement('a', { href: 'javascript:', event: { click: balh_feature_runPing } }, [createElement('text', '测速')]), createElement('br'),
                    createElement('div', { style: { display: 'flex' } }, [
                        // _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_server_inner', value: r.const.server.S0 }), _('text', '土豆服')]),
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'radio', disabled: 'true', name: 'balh_server_inner', value: r.const.server.S1 }), createElement('text', 'BiliPlus'), createElement('a', { href: 'https://www.biliplus.com/?about' }, [createElement('text', '（捐赠）')]),
                        ]),
                        createElement('label', { style: { flex: 2 } }, [
                            createElement('input', { type: 'radio', name: 'balh_server_inner', value: r.const.server.CUSTOM }), createElement('text', `自定义（首选服务器）`),
                            createElement('input', {
                                type: 'text', name: 'balh_server_custom', placeholder: '一定要填,形如：https://hd.pilipili.com',
                                event: {
                                    input: (event) => {
                                        onSettingsFormChange(event);
                                        customServerCheckText.innerText = r.regex.bilibili_api_proxy.test(event.target.value.trim()) ? '✔️' : '🔗️';
                                    }
                                }
                            }),
                            customServerCheckText = createElement('span'),
                        ]),
                    ]),
                    createElement('br'),
                    createElement('text', '自定义服务器列表'), createElement('a', { href: 'javascript:;', title: '脚本会缓存当前视频是否属于港/澳/台/泰；修改代理服务器地址后, 建议手动清除下这个缓存。', event: { click: () => localStorage.removeItem('balh_bangumi_area_cache') } }, [createElement('text', '（清除缓存）')]),
                    createElement('div', { style: { display: 'flex', 'flex-wrap': 'wrap' } }, [
                        createElement('label', { style: { flex: '1 1 50%' } }, [
                            createElement('text', `台湾: `),
                            createElement('input', {
                                type: 'text', name: 'balh_server_custom_tw', placeholder: '形如：https://hd.pilipili.com',
                                event: {
                                    input: (event) => {
                                        onSettingsFormChange(event);
                                        customTWServerCheckText.innerText = r.regex.bilibili_api_proxy.test(event.target.value.trim()) ? '✔️' : '🔗️';
                                    }
                                }
                            }),
                            customTWServerCheckText = createElement('span'),
                        ]),
                        createElement('label', { style: { flex: '1 1 50%' } }, [
                            createElement('text', `香港: `),
                            createElement('input', {
                                type: 'text', name: 'balh_server_custom_hk', placeholder: '形如：https://hd.pilipili.com',
                                event: {
                                    input: (event) => {
                                        onSettingsFormChange(event);
                                        customHKServerCheckText.innerText = r.regex.bilibili_api_proxy.test(event.target.value.trim()) ? '✔️' : '🔗️';
                                    }
                                }
                            }),
                            customHKServerCheckText = createElement('span'),
                        ]),
                        createElement('label', { style: { flex: '1 1 50%' } }, [
                            createElement('text', `大陆: `),
                            createElement('input', {
                                type: 'text', name: 'balh_server_custom_cn', placeholder: '形如：https://hd.pilipili.com',
                                event: {
                                    input: (event) => {
                                        onSettingsFormChange(event);
                                        customCNServerCheckText.innerText = r.regex.bilibili_api_proxy.test(event.target.value.trim()) ? '✔️' : '🔗️';
                                    }
                                }
                            }),
                            customCNServerCheckText = createElement('span'),
                        ]),
                        createElement('label', { style: { flex: '1 1 50%' } }, [
                            createElement('text', `泰国/东南亚: `),
                            createElement('input', {
                                type: 'text', name: 'balh_server_custom_th', placeholder: '形如：https://hd.pilipili.com',
                                event: {
                                    input: (event) => {
                                        onSettingsFormChange(event);
                                        customTHServerCheckText.innerText = r.regex.bilibili_api_proxy.test(event.target.value.trim()) ? '✔️' : '🔗️';
                                    }
                                }
                            }),
                            customTHServerCheckText = createElement('span'),
                        ])
                    ]),
                    createElement('br'),
                    createElement('div', { id: 'balh_server_ping', style: { whiteSpace: 'pre-wrap', overflow: 'auto' } }, []),
                    createElement('div', { style: { display: '' } }, [
                        createElement('text', 'upos服务器：'), createElement('br'),
                        createElement('div', { style: { display: 'flex' } }, [
                            createElement('div', { title: '变更后 切换清晰度 或 刷新 生效', style: { flex: 1 } }, [
                                createElement('input', { style: { visibility: 'hidden' }, type: 'checkbox' }),
                                createElement('text', '替换upos视频服务器：'),
                                createElement('select', {
                                    id: 'upos-server',
                                    event: {
                                        change: function () {
                                            let server = this.value;
                                            let message = window.$('#upos-server-message');
                                            balh_config.upos_server = server;
                                            document.getElementById('balh-upos-replace-akamai').disabled = !server;
                                            message.text(`已保存`);
                                        }
                                    }
                                }, [
                                    createElement('option', { value: "" }, [createElement('text', '不替换')]),
                                    createElement('option', { value: "ks3" }, [createElement('text', 'ks3（金山）')]),
                                    createElement('option', { value: "kodo" }, [createElement('text', 'kodo（七牛）')]),
                                    createElement('option', { value: "cos" }, [createElement('text', 'cos（腾讯）')]),
                                    createElement('option', { value: "bos" }, [createElement('text', 'bos（百度）')]),
                                    createElement('option', { value: "wcs" }, [createElement('text', 'wcs（网宿）')]),
                                    createElement('option', { value: "hw" }, [createElement('text', 'hw（251）')]),
                                ]),
                                createElement('span', { 'id': 'upos-server-message' })
                            ]),
                            createElement('label', { style: { flex: 1 }, title: '开启upos替换时, 是否替换`akamaized.net`' }, [createElement('input', { id: 'balh-upos-replace-akamai', type: 'checkbox', name: 'balh_upos_replace_akamai', disabled: balh_config.upos_server ? undefined : 'true' }), createElement('text', '替换akamai'), createElement('a', { href: 'https://github.com/ipcjs/bilibili-helper/pull/762#discussion_r569911774' }, [createElement('text', '(？)')])]),
                        ]),
                        createElement('br'),
                    ]),
                    createElement('text', '脚本工作模式：'), createElement('br'),
                    createElement('div', { style: { display: 'flex' } }, [
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.DEFAULT }), createElement('text', '默认：自动判断')]),
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.REPLACE }), createElement('text', '替换：在需要时处理番剧')]),
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.REDIRECT }), createElement('text', '重定向：完全代理所有番剧')])
                    ]), createElement('br'),
                    createElement('text', '其他：'), createElement('br'),
                    createElement('div', { style: { display: 'flex' } }, [
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'checkbox', name: 'balh_blocked_vip' }), createElement('text', '被永封的大会员'), createElement('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md#大会员账号被b站永封了', target: '_blank' }, [createElement('text', '(？)')])]),
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'checkbox', name: 'balh_enable_in_av' }), createElement('text', '在AV页面启用'), createElement('a', { href: 'https://github.com/ipcjs/bilibili-helper/issues/172', target: '_blank' }, [createElement('text', '(？)')])]),
                        createElement('div', { style: { flex: 1, display: 'flex' } }, [
                            createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'checkbox', name: 'balh_remove_pre_ad' }), createElement('text', '去前置广告')]),
                        ])
                    ]), createElement('br'),
                    createElement('div', { style: { display: 'flex' } }, [
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'checkbox', name: 'balh_generate_sub' }), createElement('text', '为简繁字幕生成相应的繁简字幕')]),
                    ]), createElement('br'),
                    createElement('div', { style: { display: 'flex' } }, [
                        createElement('label', { style: { flex: 1 } }, [createElement('input', { type: 'checkbox', name: 'balh_is_closed' }), createElement('text', '关闭脚本（脚本当前还有挺多问题, 若影响正常使用, 可以临时关闭它）'),]),
                    ]), createElement('br'),
                    createElement('a', { href: 'javascript:', 'data-sign': 'in', event: { click: onSignClick } }, [createElement('text', '帐号授权')]),
                    createElement('text', '　'),
                    createElement('a', { href: 'javascript:', 'data-sign': 'out', event: { click: onSignClick } }, [createElement('text', '取消授权')]),
                    createElement('text', '　　'),
                    createElement('a', { href: 'javascript:', event: { click: function () { util_ui_msg.show(window.$(this), '如果你的帐号进行了付费，不论是大会员还是承包，\n进行授权之后将可以在解除限制时正常享有这些权益\n\n你可以随时在这里授权或取消授权\n\n不进行授权不会影响脚本的正常使用，但可能会缺失1080P', 1e4); } } }, [createElement('text', '（这是什么？）')]),
                    createElement('br'), createElement('br'),
                    createElement('div', { style: { whiteSpace: 'pre-wrap' }, event: { mouseenter: onMouseEnterSettingBottom } }, [
                        createElement('a', { href: 'https://greasyfork.org/zh-CN/scripts/25718-%E8%A7%A3%E9%99%A4b%E7%AB%99%E5%8C%BA%E5%9F%9F%E9%99%90%E5%88%B6', target: '_blank' }, [createElement('text', '脚本主页')]),
                        createElement('text', '　'),
                        createElement('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md', target: '_blank' }, [createElement('text', '帮助说明')]),
                        createElement('text', '　'),
                        createElement('a', { id: 'balh-copy-log', href: 'javascript:;', event: { click: onCopyClick } }, [createElement('text', '复制日志&问题反馈')]),
                        createElement('text', '　'),
                        createElement('a', { id: 'balh-issue-link', href: 'javascript:;', event: { click: openIssuePage }, style: { display: 'none' } }, [createElement('text', '问题反馈')]),
                        createElement('a', { href: 'https://github.com/ipcjs/bilibili-helper/graphs/contributors' }, [createElement('text', '贡献者')]),
                        createElement('text', ' 接口：'),
                        createElement('a', { href: 'https://www.biliplus.com/' }, [createElement('text', 'BiliPlus ')]),
                        createElement('a', { href: 'https://github.com/kghost/bilibili-area-limit' }, [createElement('text', 'kghost ')]),
                        createElement('a', { href: 'https://github.com/yujincheng08/BiliRoaming' }, [createElement('text', 'BiliRoaming ')]),
                    ]),
                    createElement('textarea', { id: 'balh-textarea-copy', style: { display: 'none' } })
                ])
            ])
        ]);
        util_init(() => {
            if (!(util_page.player() || (util_page.av() && !balh_config.enable_in_av))) {
                addSettingsButton();
            }
        }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER);
        return {
            dom: settingsDOM,
            show: showSettings,
            setup: addSettingsButton,
        };
    }

    function remove_pre_ad() {
        if (util_page.player()) {
            // 播放页面url中的pre_ad参数, 决定是否播放广告...
            if (balh_config.remove_pre_ad && Strings.getSearchParam(location.href, 'pre_ad') === '1') {
                util_debug('需要跳转到不含广告的url');
                location.href = location.href.replace(/&?pre_ad=1/, '');
            }
        }
    }

    function injectFetch() {
        // 当前未替换任何内容...
        const originFetch = window.fetch;
        window.fetch = function (input, init) {
            util_debug('fetch', input, init);
            return originFetch(input, init)
                .then(r => {
                // log('then', r)
                return r;
            });
        };
    }
    function injectFetch4Mobile() {
        util_debug('injectFetch4Mobile');
        window.fetch = Async.wrapper(window.fetch, resp => new Proxy(resp, {
            get: function (target, prop, receiver) {
                if (prop === 'json') {
                    return Async.wrapper(target.json.bind(target), oriResult => {
                        util_debug('injectFetch:', target.url);
                        if (target.url.match(RegExps.urlPath('/player/web_api/v2/playurl/html5'))) {
                            let cid = Strings.getSearchParam(target.url, 'cid');
                            return BiliPlusApi.playurl(cid)
                                .then(result => {
                                if (result.code) {
                                    return Promise.reject('error: ' + JSON.stringify(result));
                                }
                                else {
                                    return BiliPlusApi.playurl_for_mp4(cid)
                                        .then(url => {
                                        util_debug(`mp4地址, 移动版: ${url}, pc版: ${result.durl[0].url}`);
                                        return {
                                            "code": 0,
                                            "cid": `http://comment.bilibili.com/${cid}.xml`,
                                            "timelength": result.timelength,
                                            "src": url || result.durl[0].url,
                                        };
                                    });
                                }
                            })
                                .catch(e => {
                                // 若拉取视频地址失败, 则返回原始的结果
                                util_debug('fetch mp4 url failed', e);
                                return oriResult;
                            });
                        }
                        return oriResult;
                    }, error => error);
                }
                return target[prop];
            }
        }), error => error);
    }

    var space_account_info_map = {
        "11783021": { "code": 0, "message": "0", "ttl": 1, "data": { "mid": 11783021, "name": "哔哩哔哩番剧出差", "sex": "保密", "face": "http://i0.hdslb.com/bfs/face/9f10323503739e676857f06f5e4f5eb323e9f3f2.jpg", "sign": "", "rank": 10000, "level": 6, "jointime": 0, "moral": 0, "silence": 0, "coins": 0, "fans_badge": false, "fans_medal": { "show": false, "wear": false, "medal": null }, "official": { "role": 3, "title": "哔哩哔哩番剧出差 官方账号", "desc": "", "type": 1 }, "vip": { "type": 0, "status": 0, "due_date": 0, "vip_pay_type": 0, "theme_type": 0, "label": { "path": "", "text": "", "label_theme": "", "text_color": "", "bg_style": 0, "bg_color": "", "border_color": "" }, "avatar_subscript": 0, "nickname_color": "", "role": 0, "avatar_subscript_url": "" }, "pendant": { "pid": 0, "name": "", "image": "", "expire": 0, "image_enhance": "", "image_enhance_frame": "" }, "nameplate": { "nid": 0, "name": "", "image": "", "image_small": "", "level": "", "condition": "" }, "user_honour_info": { "mid": 0, "colour": null, "tags": [] }, "is_followed": true, "top_photo": "http://i2.hdslb.com/bfs/space/cb1c3ef50e22b6096fde67febe863494caefebad.png", "theme": {}, "sys_notice": {}, "live_room": { "roomStatus": 1, "liveStatus": 0, "url": "https://live.bilibili.com/931774", "title": "「梦之祭！部」 社团活动最终回", "cover": "http://i0.hdslb.com/bfs/live/c89c499096fa6527765de1fcaa021c9e2db7fbf8.jpg", "online": 0, "roomid": 931774, "roundStatus": 0, "broadcast_type": 0 }, "birthday": "", "school": { "name": "" }, "profession": { "name": "" }, "tags": null, "series": { "user_upgrade_status": 3, "show_upgrade_window": false } } },
        "1988098633": { "code": 0, "message": "0", "ttl": 1, "data": { "mid": 1988098633, "name": "b站_戲劇咖", "sex": "保密", "face": "http://i0.hdslb.com/bfs/face/member/noface.jpg", "sign": "提供bilibili港澳台地區專屬戲劇節目。", "rank": 10000, "level": 2, "jointime": 0, "moral": 0, "silence": 0, "coins": 0, "fans_badge": false, "fans_medal": { "show": false, "wear": false, "medal": null }, "official": { "role": 0, "title": "", "desc": "", "type": -1 }, "vip": { "type": 0, "status": 0, "due_date": 0, "vip_pay_type": 0, "theme_type": 0, "label": { "path": "", "text": "", "label_theme": "", "text_color": "", "bg_style": 0, "bg_color": "", "border_color": "" }, "avatar_subscript": 0, "nickname_color": "", "role": 0, "avatar_subscript_url": "" }, "pendant": { "pid": 0, "name": "", "image": "", "expire": 0, "image_enhance": "", "image_enhance_frame": "" }, "nameplate": { "nid": 0, "name": "", "image": "", "image_small": "", "level": "", "condition": "" }, "user_honour_info": { "mid": 0, "colour": null, "tags": [] }, "is_followed": true, "top_photo": "http://i0.hdslb.com/bfs/space/cb1c3ef50e22b6096fde67febe863494caefebad.png", "theme": {}, "sys_notice": {}, "live_room": { "roomStatus": 0, "liveStatus": 0, "url": "", "title": "", "cover": "", "online": 0, "roomid": 0, "roundStatus": 0, "broadcast_type": 0 }, "birthday": "01-01", "school": { "name": "" }, "profession": { "name": "" }, "tags": null, "series": { "user_upgrade_status": 3, "show_upgrade_window": false } } },
        "2042149112": { "code": 0, "message": "0", "ttl": 1, "data": { "mid": 2042149112, "name": "b站_綜藝咖", "sex": "保密", "face": "http://i0.hdslb.com/bfs/face/member/noface.jpg", "sign": "提供bilibili港澳台地區專屬綜藝節目。", "rank": 10000, "level": 3, "jointime": 0, "moral": 0, "silence": 0, "coins": 0, "fans_badge": false, "fans_medal": { "show": false, "wear": false, "medal": null }, "official": { "role": 0, "title": "", "desc": "", "type": -1 }, "vip": { "type": 0, "status": 0, "due_date": 0, "vip_pay_type": 0, "theme_type": 0, "label": { "path": "", "text": "", "label_theme": "", "text_color": "", "bg_style": 0, "bg_color": "", "border_color": "" }, "avatar_subscript": 0, "nickname_color": "", "role": 0, "avatar_subscript_url": "" }, "pendant": { "pid": 0, "name": "", "image": "", "expire": 0, "image_enhance": "", "image_enhance_frame": "" }, "nameplate": { "nid": 0, "name": "", "image": "", "image_small": "", "level": "", "condition": "" }, "user_honour_info": { "mid": 0, "colour": null, "tags": [] }, "is_followed": true, "top_photo": "http://i0.hdslb.com/bfs/space/cb1c3ef50e22b6096fde67febe863494caefebad.png", "theme": {}, "sys_notice": {}, "live_room": { "roomStatus": 0, "liveStatus": 0, "url": "", "title": "", "cover": "", "online": 0, "roomid": 0, "roundStatus": 0, "broadcast_type": 0 }, "birthday": "", "school": { "name": "" }, "profession": { "name": "" }, "tags": null, "series": { "user_upgrade_status": 3, "show_upgrade_window": false } } },
    };

    function scriptContent() {
        let log = console.log.bind(console, 'injector:');
        if (document.getElementById('balh-injector-source') && invokeBy === GM_info.scriptHandler) {
            // 当前, 在Firefox+GM4中, 当返回缓存的页面时, 脚本会重新执行, 并且此时XMLHttpRequest是可修改的(为什么会这样?) + 页面中存在注入的代码
            // 导致scriptSource的invokeBy直接是GM4...
            log(`页面中存在注入的代码, 但invokeBy却等于${GM_info.scriptHandler}, 这种情况不合理, 终止脚本执行`);
            return
        }
        if (document.readyState === 'uninitialized') { // Firefox上, 对于iframe中执行的脚本, 会出现这样的状态且获取到的href为about:blank...
            log('invokeBy:', invokeBy, 'readState:', document.readyState, 'href:', location.href, '需要等待进入loading状态');
            setTimeout(() => scriptSource(invokeBy + '.timeout'), 0); // 这里会暴力执行多次, 直到状态不为uninitialized...
            return
        }

        log = util_debug;
        log(`[${GM_info.script.name} v${GM_info.script.version} (${invokeBy})] run on: ${window.location.href}`);

        version_remind();
        switch_to_old_player();

        area_limit_for_vue();

        const balh_feature_area_limit = (function () {
            if (isClosed()) return
            injectFetch();
            function injectXHR() {
                util_debug('XMLHttpRequest的描述符:', Object.getOwnPropertyDescriptor(window, 'XMLHttpRequest'));
                window.XMLHttpRequest = new Proxy(window.XMLHttpRequest, {
                    construct: function (target, args) {
                        let container = {}; // 用来替换responseText等变量
                        const dispatchResultTransformer = p => {
                            let event = {}; // 伪装的event
                            return p
                                .then(r => {
                                    container.readyState = 4;
                                    container.response = r;
                                    container.responseText = typeof r === 'string' ? r : JSON.stringify(r);
                                    container.__onreadystatechange(event); // 直接调用会不会存在this指向错误的问题? => 目前没看到, 先这样(;¬_¬)
                                })
                                .catch(e => {
                                    // 失败时, 让原始的response可以交付
                                    container.__block_response = false;
                                    if (container.__response != null) {
                                        container.readyState = 4;
                                        container.response = container.__response;
                                        container.__onreadystatechange(event); // 同上
                                    }
                                })
                        };
                        const dispatchResultTransformerCreator = () => {
                            container.__block_response = true;
                            return dispatchResultTransformer
                        };
                        return new Proxy(new target(...args), {
                            set: function (target, prop, value, receiver) {
                                if (prop === 'onreadystatechange') {
                                    container.__onreadystatechange = value;
                                    let cb = value;
                                    value = function (event) {
                                        if (target.readyState === 4) {
                                            if (target.responseURL.match(RegExps.url('bangumi.bilibili.com/view/web_api/season/user/status'))
                                                || target.responseURL.match(RegExps.url('api.bilibili.com/pgc/view/web/season/user/status'))) {
                                                log('/season/user/status:', target.responseText);
                                                let json = JSON.parse(target.responseText);
                                                let rewriteResult = false;
                                                if (json.code === 0 && json.result) {
                                                    areaLimit(json.result.area_limit !== 0);
                                                    if (json.result.area_limit !== 0) {
                                                        json.result.area_limit = 0; // 取消区域限制
                                                        rewriteResult = true;
                                                    }
                                                    if (balh_config.blocked_vip) {
                                                        json.result.pay = 1;
                                                        rewriteResult = true;
                                                    }
                                                    if (rewriteResult) {
                                                        container.responseText = JSON.stringify(json);
                                                    }
                                                }
                                            } else if (target.responseURL.match(RegExps.url('bangumi.bilibili.com/web_api/season_area'))) {
                                                log('/season_area', target.responseText);
                                                let json = JSON.parse(target.responseText);
                                                if (json.code === 0 && json.result) {
                                                    areaLimit(json.result.play === 0);
                                                    if (json.result.play === 0) {
                                                        json.result.play = 1;
                                                        container.responseText = JSON.stringify(json);
                                                    }
                                                }
                                            } else if (target.responseURL.match(RegExps.url('api.bilibili.com/x/web-interface/nav'))) {
                                                const isFromReport = Strings.getSearchParam(target.responseURL, 'from') === 'report';
                                                let json = JSON.parse(target.responseText);
                                                log('/x/web-interface/nav', (json.data && json.data.isLogin)
                                                    ? { uname: json.data.uname, isLogin: json.data.isLogin, level: json.data.level_info.current_level, vipType: json.data.vipType, vipStatus: json.data.vipStatus, isFromReport: isFromReport }
                                                    : target.responseText);
                                                if (json.code === 0 && json.data && balh_config.blocked_vip
                                                    && !isFromReport // report时, 还是不伪装了...
                                                ) {
                                                    json.data.vipType = 2; // 类型, 年度大会员
                                                    json.data.vipStatus = 1; // 状态, 启用
                                                    container.responseText = JSON.stringify(json);
                                                }
                                            } else if (target.responseURL.match(RegExps.url('api.bilibili.com/x/player.so'))) {
                                                // 这个接口的返回数据貌似并不会影响界面...
                                                if (balh_config.blocked_vip) {
                                                    log('/x/player.so');
                                                    const xml = new DOMParser().parseFromString(`<root>${target.responseText.replace(/\&/g, "&amp;")}</root>`, 'text/xml');
                                                    const vipXml = xml.querySelector('vip');
                                                    if (vipXml) {
                                                        const vip = JSON.parse(vipXml.innerHTML);
                                                        vip.vipType = 2; // 同上
                                                        vip.vipStatus = 1;
                                                        vipXml.innerHTML = JSON.stringify(vip);
                                                        container.responseText = xml.documentElement.innerHTML;
                                                        container.response = container.responseText;
                                                    }
                                                }
                                            } else if (target.responseURL.match(RegExps.url('api.bilibili.com/x/player/v2'))) {
                                                // 上一个接口的新版本
                                                let json = JSON.parse(target.responseText);
                                                // 生成字幕
                                                if (balh_config.generate_sub && json.code == 0 && json.data.subtitle && json.data.subtitle.subtitles) {
                                                    let subtitles = json.data.subtitle.subtitles;
                                                    let lans = subtitles.map((item) => item.lan);
                                                    let genCN = lans.includes('zh-Hant') && !lans.includes('zh-CN');
                                                    let genHant = lans.includes('zh-CN') && !lans.includes('zh-Hant');
                                                    let origin = genCN ? 'zh-Hant' : genHant ? 'zh-CN' : null;
                                                    let target = genCN ? 'zh-CN' : genHant ? 'zh-Hant' : null;
                                                    let converter = genCN ? 't2cn' : genHant ? 'cn2t' : null;
                                                    let targetDoc = genCN ? '中文（中国）生成' : genHant ? '中文（繁体）生成' : null;
                                                    if (origin && target && converter && targetDoc) {
                                                        let origSub = subtitles.find((item) => item.lan == origin);
                                                        let origSubUrl = 'http:' + origSub.subtitle_url;
                                                        let origSubId = origSub.id;
                                                        let origSubRealId = BigInt(origSub.id_str);
                                                        let encSubUrl = encodeURIComponent(origSubUrl);
                                                        let encSubId = encodeURIComponent(origSub.id_str);
                                                        let targetSub = {
                                                            lan: target,
                                                            lan_doc: targetDoc,
                                                            is_lock: false,
                                                            subtitle_url: `//www.kofua.top/bsub/${converter}?sub_url=${encSubUrl}&sub_id=${encSubId}`,
                                                            type: 0,
                                                            id: origSubId + 1,
                                                            id_str: (origSubRealId + 1n).toString(),
                                                        };
                                                        json.data.subtitle.subtitles.push(targetSub);
                                                        container.responseText = JSON.stringify(json);
                                                    }
                                                }
                                                // https://github.com/ipcjs/bilibili-helper/issues/775
                                                // 适配有些泰区番剧有返回数据，但字幕为空的问题（ep372478）
                                                /*
                                                if (json.code == -404 || (json.code == 0 && window.__balh_app_only__ && json.data.subtitle.subtitles.length == 0)) {
                                                    log('/x/player/v2', '404', target.responseText);
                                                    container.__block_response = true;
                                                    let url = container.__url.replace('player/v2', 'v2/dm/view').replace('cid', 'oid') + '&type=1'; //从APP接口拉取字幕信息
                                                    Async.ajax(url).then(async data => {
                                                        if (!data.code && data.data.subtitle) {
                                                            // 使用APP接口获取的字幕信息重构返回数据，其它成员不明暂时无视
                                                            const subtitle = data.data.subtitle;
                                                            if (subtitle.subtitles) {
                                                                subtitle.subtitles.forEach(item => (item.subtitle_url = item.subtitle_url.replace(/https?:\/\//, '//')));
                                                            } else {
                                                                // 泰区番剧返回的字幕为 null，需要使用泰区服务器字幕接口填充数据
                                                                let thailand_sub_url = url.replace('https://api.bilibili.com/x/v2/dm/view', `${balh_config.server_custom_th}/intl/gateway/v2/app/subtitle`);
                                                                let thailand_data = await Async.ajax(thailand_sub_url);
                                                                subtitle.subtitles = [];
                                                                thailand_data.data.subtitles.forEach((item) => {
                                                                    let sub = {
                                                                        'id': item.id,
                                                                        'id_str': item.id.toString(),
                                                                        'lan': item.key,
                                                                        'lan_doc': item.title,
                                                                        'subtitle_url': item.url.replace(/https?:\/\//, '//')
                                                                    }
                                                                    subtitle.subtitles.push(sub);
                                                                })
                                                            }
                                                            subtitle.allow_submit = false;
                                                            json.data = { subtitle };
                                                            json.code = 0;
                                                            if (balh_config.blocked_vip) {
                                                                json.data.vip = {
                                                                    type: 2, //年费大会员
                                                                    status: 1 //启用
                                                                };
                                                                log('/x/player/v2', 'vip');
                                                            }
                                                            log('/x/player/v2', 'rebuild', json);
                                                        }
                                                        container.responseText = JSON.stringify(json);
                                                        container.response = container.responseText;
                                                        cb.apply(container.responseText ? receiver : this, arguments);
                                                    }).catch(e => {
                                                        util_error('/x/player/v2', e);
                                                        cb.apply(this, arguments);
                                                    })
                                                }
                                                */
                                                if ((json.code === -400 || json.code === -404 || (json.code == 0 && window.__balh_app_only__ && json.data.subtitle.subtitles.length == 0)) && balh_config.server_custom_th) {
                                                    // 泰区番剧返回的字幕为 null，需要使用泰区服务器字幕接口填充数据
                                                    // https://www.bilibili.com/bangumi/play/ep10649765
                                                    let thailand_sub_url = container.__url.replace('https://api.bilibili.com/x/player/v2', `${balh_config.server_custom_th}/intl/gateway/v2/app/subtitle`);
                                                    Async.ajax(thailand_sub_url)
                                                        .then(async thailand_data => {
                                                            let subtitle = { subtitles: [] };
                                                            thailand_data.data.subtitles.forEach((item) => {
                                                                let sub = {
                                                                    'id': item.id,
                                                                    'id_str': item.id.toString(),
                                                                    'lan': item.key,
                                                                    'lan_doc': item.title,
                                                                    'subtitle_url': item.url.replace(/https?:\/\//, '//')
                                                                };
                                                                subtitle.subtitles.push(sub);
                                                            });
                                                            let json = { code: 0, data: { subtitle: subtitle } };
                                                            // todo: json.data中有许多字段, 需要想办法填充
                                                            if (balh_config.blocked_vip) {
                                                                json.data.vip = {
                                                                    type: 2, //年费大会员
                                                                    status: 1 //启用
                                                                };
                                                            }
                                                            return json
                                                        })
                                                        .compose(dispatchResultTransformerCreator());
                                                }
                                                else if (!json.code && json.data && balh_config.blocked_vip) {
                                                    log('/x/player/v2', 'vip');
                                                    const vip = json.data.vip;
                                                    if (vip) {
                                                        vip.type = 2; // 同上
                                                        vip.status = 1;
                                                        container.responseText = JSON.stringify(json);
                                                        container.response = container.responseText;
                                                    }
                                                }
                                            } else if (target.responseURL.match(RegExps.url('api.bilibili.com/x/player/playurl'))) {
                                                log('/x/player/playurl', 'origin', `block: ${container.__block_response}`, target.response);
                                                // todo      : 当前只实现了r.const.mode.REPLACE, 需要支持其他模式
                                                // 2018-10-14: 等B站全面启用新版再说(;¬_¬)
                                            } else if (target.responseURL.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl'))
                                                && !Strings.getSearchParam(target.responseURL, 'balh_ajax')) {
                                                log('/pgc/player/web/playurl', 'origin', `block: ${container.__block_response}`, target.response);
                                                if (!container.__redirect) { // 请求没有被重定向, 则需要检测结果是否有区域限制
                                                    let json = typeof target.response === 'object' ? target.response : JSON.parse(target.responseText);
                                                    if (balh_config.blocked_vip || json.code || isAreaLimitForPlayUrl(json.result)) {
                                                        areaLimit(true);
                                                        container.__block_response = true;
                                                        let url = container.__url;
                                                        if (isBangumiPage()) {
                                                            url += `&module=bangumi`;
                                                        }
                                                        bilibiliApis._playurl.asyncAjax(url)
                                                            .then(data => {
                                                                if (!data.code) {
                                                                    data = { code: 0, result: data, message: "0" };
                                                                }
                                                                log('/pgc/player/web/playurl', 'proxy', data);
                                                                return data
                                                            })
                                                            .compose(dispatchResultTransformer);
                                                    } else {
                                                        areaLimit(false);
                                                    }
                                                }
                                                // 同上
                                            } else if (target.responseURL.match(RegExps.url('api.bilibili.com/pgc/view/web/freya/season'))) {
                                                /* 一起看放映室用这个api来识别区域限制 */
                                                let json = JSON.parse(target.response);
                                                log('/pgc/view/web/freya/season', 'origin', `area_limit`, json.data.viewUserStatus.area_limit);
                                                if (json.code == 0 && json.data.viewUserStatus.area_limit == 1) {
                                                    areaLimit(true);
                                                    json.data.viewUserStatus.area_limit = 0;
                                                    container.__block_response = true;

                                                    container.responseText = JSON.stringify(json);
                                                    container.response = container.responseText;
                                                    cb.apply(container.responseText ? receiver : this, arguments);
                                                } else {
                                                    areaLimit(false);
                                                }
                                            } else if (target.responseURL.match(RegExps.url('api.bilibili.com/x/space/acc/info?'))) {
                                                const json = JSON.parse(target.responseText);
                                                if (json.code === -404) {
                                                    const mid = new URL(target.responseURL).searchParams.get('mid');
                                                    if (space_account_info_map[mid]) {
                                                        container.responseText = JSON.stringify(space_account_info_map[mid]);
                                                    }
                                                }
                                            }
                                            if (container.__block_response) {
                                                // 屏蔽并保存response
                                                container.__response = target.response;
                                                return
                                            }
                                        }
                                        // 这里的this是原始的xhr, 在container.responseText设置了值时需要替换成代理对象
                                        cb.apply(container.responseText ? receiver : this, arguments);
                                    };
                                }
                                target[prop] = value;
                                return true
                            },
                            get: function (target, prop, receiver) {
                                if (prop in container) return container[prop]
                                let value = target[prop];
                                if (typeof value === 'function') {
                                    let func = value;
                                    // open等方法, 必须在原始的xhr对象上才能调用...
                                    value = function () {
                                        if (prop === 'open') {
                                            container.__method = arguments[0];
                                            container.__url = arguments[1];
                                        } else if (prop === 'send') {
                                            if (container.__url.match(RegExps.url('api.bilibili.com/x/player/playurl')) && balh_config.enable_in_av) {
                                                log('/x/player/playurl');
                                                // debugger
                                                bilibiliApis._playurl.asyncAjax(container.__url)
                                                    .then(data => {
                                                        if (!data.code) {
                                                            data = {
                                                                code: 0,
                                                                data: data,
                                                                message: "0",
                                                                ttl: 1
                                                            };
                                                        }
                                                        log('/x/player/playurl', 'proxy', data);
                                                        return data
                                                    })
                                                    .compose(dispatchResultTransformerCreator());
                                            } else if (container.__url.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl'))
                                                && !Strings.getSearchParam(container.__url, 'balh_ajax')
                                                && needRedirect()) {
                                                log('/pgc/player/web/playurl');
                                                // debugger
                                                container.__redirect = true; // 标记该请求被重定向
                                                let url = container.__url;
                                                if (isBangumiPage()) {
                                                    url += `&module=bangumi`;
                                                }
                                                bilibiliApis._playurl.asyncAjax(url)
                                                    .then(data => {
                                                        if (!data.code) {
                                                            data = {
                                                                code: 0,
                                                                result: data,
                                                                message: "0",
                                                            };
                                                        }
                                                        log('/pgc/player/web/playurl', 'proxy(redirect)', data);
                                                        return data
                                                    })
                                                    .compose(dispatchResultTransformerCreator());
                                            }
                                        }
                                        return func.apply(target, arguments)
                                    };
                                }
                                return value
                            }
                        })
                    }
                });
            }

            function injectAjax() {
                log('injectAjax at:', window.jQuery);
                let originalAjax = $.ajax;
                $.ajax = function (arg0, arg1) {
                    let param;
                    if (arg1 === undefined) {
                        param = arg0;
                    } else {
                        arg0 && (arg1.url = arg0);
                        param = arg1;
                    }
                    let oriSuccess = param.success;
                    let oriError = param.error;
                    let mySuccess, myError;
                    // 投递结果的transformer, 结果通过oriSuccess/Error投递
                    let dispatchResultTransformer = p => p
                        .then(r => {
                            // debugger
                            oriSuccess(r);
                        })
                        .catch(e => oriError(e));
                    // 转换原始请求的结果的transformer
                    let oriResultTransformer;
                    let oriResultTransformerWhenProxyError;
                    let one_api;
                    // log(param)
                    if (param.url.match(RegExps.urlPath('/web_api/get_source'))) {
                        one_api = bilibiliApis._get_source;
                        oriResultTransformer = p => p
                            .then(json => {
                                log(json);
                                if (json.code === -40301 // 区域限制
                                    || json.result.payment && json.result.payment.price != 0 && balh_config.blocked_vip) { // 需要付费的视频, 此时B站返回的cid是错了, 故需要使用代理服务器的接口
                                    areaLimit(true);
                                    return one_api.asyncAjax(param.url)
                                        .catch(e => json)// 新的请求报错, 也应该返回原来的数据
                                } else {
                                    areaLimit(false);
                                    if ((balh_config.blocked_vip || balh_config.remove_pre_ad) && json.code === 0 && json.result.pre_ad) {
                                        json.result.pre_ad = 0; // 去除前置广告
                                    }
                                    return json;
                                }
                            });
                    } else if (param.url.match(RegExps.urlPath('/player/web_api/playurl')) // 老的番剧页面playurl接口
                        || param.url.match(RegExps.urlPath('/player/web_api/v2/playurl')) // 新的番剧页面playurl接口
                        || param.url.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl')) // 新的番剧页面playurl接口
                        || (balh_config.enable_in_av && param.url.match(RegExps.url('interface.bilibili.com/v2/playurl'))) // 普通的av页面playurl接口
                    ) {
                        // 新playrul:
                        // 1. 部分页面参数放在param.data中
                        // 2. 成功时, 返回的结果放到了result中: {"code":0,"message":"success","result":{}}
                        // 3. 失败时, 返回的结果没变
                        let isNewPlayurl;
                        if (isNewPlayurl = param.url.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl'))) {
                            if (param.data) {
                                param.url += `?${Object.keys(param.data).map(key => `${key}=${param.data[key]}`).join('&')}`;
                                param.data = undefined;
                            }
                            if (isBangumiPage()) {
                                log(`playurl add 'module=bangumi' param`);
                                param.url += `&module=bangumi`;
                            }
                            // 加上这个参数, 防止重复拦截这个url
                            param.url += `&balh_ajax=1`;
                        }
                        one_api = bilibiliApis._playurl;
                        if (isNewPlayurl) {
                            oriResultTransformerWhenProxyError = p => p
                                .then(json => !json.code ? json.result : json);
                        }
                        oriResultTransformer = p => p
                            .then(json => {
                                log(json);
                                if (isNewPlayurl && !json.code) {
                                    json = json.result;
                                }
                                if (balh_config.blocked_vip || json.code || isAreaLimitForPlayUrl(json)) {
                                    areaLimit(true);
                                    return one_api.asyncAjax(param.url)
                                        .catch(e => json)
                                } else {
                                    areaLimit(false);
                                    return json
                                }
                            });
                        const oriDispatchResultTransformer = dispatchResultTransformer;
                        dispatchResultTransformer = p => p
                            .then(r => {
                                if (!r.code && !r.from && !r.result && !r.accept_description) {
                                    util_warn('playurl的result缺少必要的字段:', r);
                                    r.from = 'local';
                                    r.result = 'suee';
                                    r.accept_description = ['未知 3P'];
                                    // r.timelength = r.durl.map(it => it.length).reduce((a, b) => a + b, 0)
                                    if (r.durl && r.durl[0] && r.durl[0].url.includes('video-sg.biliplus.com')) {
                                        const aid = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.aid || window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.aid || 'fuck';
                                        ui.pop({
                                            content: `原视频已被删除, 当前播放的是<a href="https://video-sg.biliplus.com/">转存服务器</a>中的视频, 速度较慢<br>被删的原因可能是:<br>1. 视频违规<br>2. 视频被归类到番剧页面 => 试下<a href="https://search.bilibili.com/bangumi?keyword=${aid}">搜索av${aid}</a>`
                                        });
                                    }
                                }
                                if (isNewPlayurl && !r.code) {
                                    r = {
                                        code: 0,
                                        message: 'success',
                                        result: r
                                    };
                                }
                                return r
                            })
                            .compose(oriDispatchResultTransformer);
                    } else if (param.url.match(RegExps.url('interface.bilibili.com/player?'))) {
                        if (balh_config.blocked_vip) {
                            mySuccess = function (data) {
                                try {
                                    let xml = new window.DOMParser().parseFromString(`<userstatus>${data.replace(/\&/g, '&amp;')}</userstatus>`, 'text/xml');
                                    let vipTag = xml.querySelector('vip');
                                    if (vipTag) {
                                        let vip = JSON.parse(vipTag.innerHTML);
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
                    } else if (param.url.match(RegExps.url('api.bilibili.com/x/ad/video?'))) {
                        if (balh_config.remove_pre_ad) {
                            mySuccess = function (data) {
                                log('/ad/video', data);
                                if (data && data.code === 0 && data.data) {
                                    data.data = []; // 移除广告接口返回的数据
                                }
                                oriSuccess(data);
                            };
                        }
                    }

                    if (one_api && oriResultTransformer) {
                        // 请求结果通过mySuccess/Error获取, 将其包装成Promise, 方便处理
                        let oriResultPromise = new Promise$1((resolve, reject) => {
                            mySuccess = resolve;
                            myError = reject;
                        });
                        if (needRedirect()) {
                            // 通过proxy, 执行请求
                            one_api.asyncAjax(param.url)
                                // proxy报错时, 返回原始请求的结果
                                .catch(e => oriResultPromise.compose(oriResultTransformerWhenProxyError))
                                .compose(dispatchResultTransformer);
                        } else {
                            oriResultPromise
                                .compose(oriResultTransformer)
                                .compose(dispatchResultTransformer);
                        }
                    }

                    // 若外部使用param.success处理结果, 则替换param.success
                    if (oriSuccess && mySuccess) {
                        param.success = mySuccess;
                    }
                    // 处理替换error
                    if (oriError && myError) {
                        param.error = myError;
                    }
                    // default
                    let xhr = originalAjax.apply(this, [param]);

                    // 若外部使用xhr.done()处理结果, 则替换xhr.done()
                    if (!oriSuccess && mySuccess) {
                        xhr.done(mySuccess);
                        xhr.done = function (success) {
                            oriSuccess = success; // 保存外部设置的success函数
                            return xhr;
                        };
                    }
                    // 处理替换error
                    if (!oriError && myError) {
                        xhr.fail(myError);
                        xhr.fail = function (error) {
                            oriError = error;
                            return xhr;
                        };
                    }
                    return xhr;
                };
            }



            function isAreaLimitSeason() {
                return cookieStorage['balh_season_' + getSeasonId()];
            }

            function needRedirect() {
                return balh_config.mode === r.const.mode.REDIRECT || (balh_config.mode === r.const.mode.DEFAULT && isAreaLimitSeason())
            }

            function areaLimit(limit) {
                balh_config.mode === r.const.mode.DEFAULT && setAreaLimitSeason(limit);
            }

            function setAreaLimitSeason(limit) {
                var season_id = getSeasonId();
                cookieStorage.set('balh_season_' + season_id, limit ? '1' : undefined, ''); // 第三个参数为'', 表示时Session类型的cookie
                log('setAreaLimitSeason', season_id, limit);
            }
            /** 使用该方法判断是否需要添加module=bangumi参数, 并不准确... */
            function isBangumi(season_type) {
                log(`season_type: ${season_type}`);
                // 1: 动画
                // 2: 电影
                // 3: 纪录片
                // 4: 国创
                // 5: 电视剧
                return season_type != null // 存在season_type就是bangumi?
            }

            function isBangumiPage() {
                return isBangumi(Func.safeGet('window.__INITIAL_STATE__.mediaInfo.season_type || window.__INITIAL_STATE__.mediaInfo.ssType'))
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

                // 若没取到, 则从search params获取（比如放映室）
                if (!seasonId) {
                    try {
                        seasonId = Strings.getSearchParam(window.location.href, 'seasonid');
                    } catch (e) {
                        log(e);
                    }
                }

                // 若没取到, 则去取av页面的av号
                if (!seasonId) {
                    try {
                        seasonId = (window.top.location.pathname.match(/\/video\/((av|BV)\w+)/) || ['', ''])[1];
                    } catch (e) {
                        log(e);
                    }
                }
                // 最后, 若没取到, 则试图取出当前页面url中的aid
                if (!seasonId) {
                    seasonId = Strings.getSearchParam(window.location.href, 'aid');
                    if (seasonId) {
                        seasonId = 'aid' + seasonId;
                    }
                }
                return seasonId || '000';
            }

            function isAreaLimitForPlayUrl(json) {
                return (json.errorcid && json.errorcid == '8986943') || (json.durl && json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627);
            }

            var bilibiliApis = (function () {
                function AjaxException(message, code = 0/*用0表示未知错误*/) {
                    this.name = 'AjaxException';
                    this.message = message;
                    this.code = code;
                }
                AjaxException.prototype.toString = function () {
                    return `${this.name}: ${this.message}(${this.code})`
                };
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
                BilibiliApi.prototype.asyncAjax = function (originUrl) {
                    return Async.ajax(this.transToProxyUrl(originUrl))
                        .then(r => this.processProxySuccess(r))
                        .compose(util_ui_msg.showOnNetErrorInPromise()) // 出错时, 提示服务器连不上
                };
                var get_source_by_aid = new BilibiliApi({
                    transToProxyUrl: function (url) {
                        return balh_config.server + '/api/view?id=' + window.aid + `&update=true${access_key_param_if_exist()}`;
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
                        return balh_config.server + '/api/bangumi?season=' + window.season_id + access_key_param_if_exist();
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
                            ui.alert('代理服务器错误:' + JSON.stringify(data) + '\n点击刷新界面.', window.location.reload.bind(window.location));
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
                var playurl_by_bilibili = new BilibiliApi({
                    dataType: 'xml',
                    transToProxyUrl: function (originUrl) {
                        const api_url = 'https://interface.bilibili.com/playurl?';
                        const SEC_NORMAL = '1c15888dc316e05a15fdd0a02ed6584f';
                        let paramDict = {
                            cid: Strings.getSearchParam(originUrl, 'cid'),
                            quality: Strings.getSearchParam(originUrl, 'quality'),
                            qn: Strings.getSearchParam(originUrl, 'qn'), // 增加这个参数, 返回的清晰度更多
                            player: 1,
                            ts: Math.floor(Date.now() / 1000),
                        };
                        if (localStorage.access_key) {
                            paramDict.access_key = localStorage.access_key;
                        }
                        let { sign, params } = Converters.generateSign(paramDict,  SEC_NORMAL);
                        let url =  api_url + params + '&sign=' + sign;
                        return url
                    },
                    processProxySuccess: function (result, alertWhenError = true) {
                        // 将xml解析成json
                        let obj = Converters.xml2obj(result.documentElement);
                        if (!obj || obj.code) {
                            if (alertWhenError) {
                                ui.alert(`从B站接口获取视频地址失败\nresult: ${JSON.stringify(obj)}\n\n点击确定, 进入设置页面关闭'使用B站接口获取视频地址'功能`, settings$1.show);
                            } else {
                                return Promise$1.reject(`服务器错误: ${JSON.stringify(obj)}`)
                            }
                        } else {
                            obj.accept_quality && (obj.accept_quality = obj.accept_quality.split(',').map(n => +n));
                            if (!obj.durl.push) {
                                obj.durl = [obj.durl];
                            }
                            obj.durl.forEach((item) => {
                                if (item.backup_url === '') {
                                    item.backup_url = undefined;
                                } else if (item.backup_url && item.backup_url.url) {
                                    item.backup_url = item.backup_url.url;
                                }
                            });
                        }
                        log('xml2obj', result, '=>', obj);
                        return obj
                    },
                    _asyncAjax: function (originUrl) {
                        return Async.ajax(this.transToProxyUrl(originUrl))
                            .then(r => this.processProxySuccess(r, false))
                    }
                });
                var playurl_by_proxy = new BilibiliApi({
                    _asyncAjax: function (originUrl, bangumi) {
                        return Async.ajax(this.transToProxyUrl(originUrl, bangumi))
                            .then(r => this.processProxySuccess(r, false))
                    },
                    transToProxyUrl: function (url, bangumi) {
                        let params = url.split('?')[1];
                        if (bangumi === undefined) { // 自动判断
                            // av页面中的iframe标签形式的player, 不是番剧视频
                            bangumi = !util_page.player_in_av();
                            // url中存在season_type的情况
                            let season_type_param = Strings.getSearchParam(url, 'season_type');
                            if (season_type_param && !isBangumi(+season_type_param)) {
                                bangumi = false;
                            }
                            if (!bangumi) {
                                params = params.replace(/&?module=(\w+)/, ''); // 移除可能存在的module参数
                            }
                        } else if (bangumi === true) { // 保证添加module=bangumi参数
                            params = params.replace(/&?module=(\w+)/, '');
                            params += '&module=bangumi';
                        } else if (bangumi === false) { // 移除可能存在的module参数
                            params = params.replace(/&?module=(\w+)/, '');
                        }
                        // 管他三七二十一, 强行将module=bangumi替换成module=pgc _(:3」∠)_
                        params = params.replace(/(&?module)=bangumi/, '$1=pgc');
                        return `${balh_config.server}/BPplayurl.php?${params}${access_key_param_if_exist()}${platform_android_param_if_app_only()}`;
                    },
                    processProxySuccess: function (data, alertWhenError = true) {
                        // data有可能为null
                        if (data && data.code === -403) {
                            ui.pop({
                                content: `<b>code-403</b>: <i style="font-size:4px;white-space:nowrap;">${JSON.stringify(data)}</i>\n\n当前代理服务器（${balh_config.server}）依然有区域限制\n\n可以考虑进行如下尝试:\n1. 进行“帐号授权”\n2. 换个代理服务器\n3. 耐心等待服务端修复问题\n\n点击确定, 打开设置页面`,
                                onConfirm: settings$1.show,
                            });
                        } else if (data === null || data.code) {
                            util_error(data);
                            if (alertWhenError) {
                                ui.alert(`突破黑洞失败\n${JSON.stringify(data)}\n点击确定刷新界面`, window.location.reload.bind(window.location));
                            } else {
                                return Promise$1.reject(new AjaxException(`服务器错误: ${JSON.stringify(data)}`, data ? data.code : 0))
                            }
                        } else if (isAreaLimitForPlayUrl(data)) {
                            util_error('>>area limit');
                            ui.pop({
                                content: `突破黑洞失败\n需要登录\n点此确定进行登录`,
                                onConfirm: biliplus_login.showLogin
                            });
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
                });
                // https://github.com/kghost/bilibili-area-limit/issues/3
                const playurl_by_kghost = new BilibiliApi({
                    _asyncAjax: function (originUrl) {
                        const proxyHostMap = [
                            [/僅.*台.*地區/, '//bilibili-tw-api.kghost.info/', []],
                            [/僅.*港.*地區/, '//bilibili-hk-api.kghost.info/', [
                                34680, // 安达与岛村
                                36297,
                            ]],
                            [/仅限东南亚/, '//bilibili-sg-api.kghost.info/', []],
                            [/.*/, '//bilibili-cn-api.kghost.info/', []],
                        ];
                        let proxyHost;
                        for (const [regex, host, ssIds] of proxyHostMap) {
                            if (document.title.match(regex) || ssIds.includes(util_page.ssId)) {
                                proxyHost = host;
                                break;
                            }
                        }
                        if (proxyHost) {
                            return Async.ajax(this.transToProxyUrl(originUrl, proxyHost))
                                .then(r => this.processProxySuccess(r))
                        } else {
                            return Promise$1.reject("没有支持的服务器")
                        }
                    },
                    transToProxyUrl: function (originUrl, proxyHost) {
                        return originUrl.replace(/^(https:)?(\/\/api\.bilibili\.com\/)/, `$1${proxyHost}`) + access_key_param_if_exist(true);
                    },
                    processProxySuccess: function (result) {
                        if (result.code) {
                            return Promise$1.reject(result)
                        }
                        return result.result
                    },
                });
                const playurl_by_custom = new BilibiliApi({
                    _asyncAjax: function (originUrl) {
                        return this.selectServer(originUrl).then(r => this.processProxySuccess(r))
                    },
                    selectServer: async function (originUrl) {
                        let result;
                        // 对应this.transToProxyUrl的参数, 用`/`分隔, 形如: `${proxyHost}/${area}`
                        let tried_server_args = [];
                        const isTriedServerArg = (proxyHost, area) => tried_server_args.includes(`${proxyHost}/*`) || tried_server_args.includes(`${proxyHost}/${area}`);
                        /**
                         * @param {string} proxyHost 代理地址
                         * @param {"cn"|"hk"|"th"|"cn"|""} area 区域
                         */
                        const requestPlayUrl = (proxyHost, area) => {
                            tried_server_args.push(`${proxyHost}/${area}`);
                            return Async.ajax(this.transToProxyUrl(originUrl, proxyHost, area))
                                // 捕获错误, 防止依次尝试各各服务器的流程中止
                                .catch((e) => {
                                    // proxyHost临时不可用, 将它添加到tried_server_args中, 防止重复请求
                                    tried_server_args.push(`${proxyHost}/*`);
                                    return ({ code: -1, error: e });
                                })
                        };

                        // 标题有明确说明优先尝试，通常准确率最高
                        if (document.title.includes('僅限台灣') && balh_config.server_custom_tw) {
                            ui.playerMsg('捕获标题提示，使用台湾代理服务器拉取视频地址...');
                            result = await requestPlayUrl(balh_config.server_custom_tw, 'tw');
                            if (!result.code) {
                                return Promise$1.resolve(result)
                            }
                        }
                        if (document.title.includes('僅限港澳') && balh_config.server_custom_hk) {
                            ui.playerMsg('捕获标题提示，使用香港代理服务器拉取视频地址...');
                            result = await requestPlayUrl(balh_config.server_custom_hk, 'hk');
                            if (!result.code) {
                                return Promise$1.resolve(result)
                            }
                        }

                        // 服务器列表, 按顺序解析
                        const server_list = [
                            // 大陆, 通过标题没法区分
                            [balh_config.server_custom_cn, '大陆', 'cn'],
                            // 泰, 通过标题没法区分
                            [balh_config.server_custom_th, '泰国（东南亚）', 'th'],
                            // 港台, 一般能够从标题中匹配到, 因而优先级可以低一点
                            [balh_config.server_custom_hk, '香港', 'hk'],
                            [balh_config.server_custom_tw, '台湾', 'tw'],
                        ];

                        // 尝试读取番剧区域缓存判断番剧区域进行解析
                        let bangumi_area_cache = {};
                        if (localStorage.getItem('balh_bangumi_area_cache')) {
                            bangumi_area_cache = JSON.parse(localStorage.getItem('balh_bangumi_area_cache'));
                            if (util_page.ssId && bangumi_area_cache.hasOwnProperty(util_page.ssId)) {
                                // 缓存存在
                                let server_list_map = {};
                                server_list.forEach((item) => {
                                    server_list_map[item[2]] = item;
                                });
                                let area_code = bangumi_area_cache[util_page.ssId];
                                let cache_host = server_list_map[area_code][0];
                                let cache_host_name = server_list_map[area_code][1];
                                ui.playerMsg(`读取番剧地区缓存，使用${cache_host_name}代理服务器拉取视频地址...`);
                                if (cache_host) {
                                    result = await requestPlayUrl(cache_host, area_code);
                                    if (!result.code) {
                                        return Promise$1.resolve(result)
                                    }
                                }
                            }
                        }

                        // 首选服务器解析
                        if (balh_config.server_custom) {
                            ui.playerMsg('使用首选代理服务器拉取视频地址...');
                            // 首选代理服务器的area参数需要为空
                            result = await requestPlayUrl(balh_config.server_custom, '');
                            if (!result.code) {
                                return Promise$1.resolve(result)
                            }
                        }


                        // 首选服务器失败后开始尝试服务器列表, 按顺序解析
                        for (let server_info of server_list) {
                            const host = server_info[0];
                            const host_name = server_info[1];
                            const host_code = server_info[2];
                            // 请求过的服务器, 不应该重复请求
                            if (host && (!isTriedServerArg(host, host_code))) {
                                ui.playerMsg(`使用${host_name}代理服务器拉取视频地址...`);
                                result = await requestPlayUrl(host, host_code);
                                if (!result.code) {
                                    // 解析成功，将结果存入番剧区域缓存
                                    if (util_page.ssId) {
                                        bangumi_area_cache[util_page.ssId] = host_code;
                                        localStorage.setItem('balh_bangumi_area_cache', JSON.stringify(bangumi_area_cache));
                                    }
                                    return Promise$1.resolve(result)
                                }
                            }
                        }
                        return Promise$1.resolve(result)  // 都失败了，返回最后一次数据
                    },
                    transToProxyUrl: function (originUrl, proxyHost, area) {
                        if (r.regex.bilibili_api_proxy.test(proxyHost)) {
                            if (area === 'th') {
                                // 泰区番剧解析
                                return getMobiPlayUrl(originUrl, proxyHost, area)
                            }
                            if (window.__balh_app_only__) {
                                // APP 限定用 mobi api
                                return getMobiPlayUrl(originUrl, proxyHost, area)
                            }
                            return originUrl.replace(/^(https:)?(\/\/api\.bilibili\.com\/)/, `$1${proxyHost}/`) + '&area=' + area + access_key_param_if_exist(true);
                        } else {
                            if (window.__balh_app_only__) {
                                return `${proxyHost}?${generateMobiPlayUrlParams(originUrl)}`
                            }
                            // 将proxyHost当成接口的完整路径进行拼接
                            const params = originUrl.split('?')[1];
                            return `${proxyHost}?${params}${access_key_param_if_exist(true)}`

                        }
                    },
                    processProxySuccess: function (result) {
                        if (result.code) {
                            return Promise$1.reject(result)
                        }
                        // 在APP限定情况启用 mobi api 解析
                        if (window.__balh_app_only__) {
                            // 泰区番也是 APP 限定
                            if (result.hasOwnProperty('data')) {
                                return fixThailandPlayUrlJson(result)
                            }
                            if (result['type'] == "DASH") {
                                return fixMobiPlayUrlJson(result)
                            }
                            return result;
                        }
                        return result.result
                    },
                });
                const playurl = new BilibiliApi({
                    asyncAjax: function (originUrl) {
                        ui.playerMsg(`从${r.const.server.CUSTOM === balh_config.server_inner ? '自定义' : '代理'}服务器拉取视频地址中...`);
                        return (r.const.server.CUSTOM === balh_config.server_inner ? playurl_by_custom._asyncAjax(originUrl) : (playurl_by_proxy._asyncAjax(originUrl) // 优先从代理服务器获取
                            .catch(e => {
                                if (e instanceof AjaxException) {
                                    ui.playerMsg(e);
                                    if (e.code === 1 // code: 1 表示非番剧视频, 不能使用番剧视频参数
                                        || (Strings.getSearchParam(originUrl, 'module') === 'bangumi' && e.code === -404)) { // 某些番剧视频又不需要加module=bangumi, 详见: https://github.com/ipcjs/bilibili-helper/issues/494
                                        ui.playerMsg('尝试使用非番剧视频接口拉取视频地址...');
                                        return playurl_by_proxy._asyncAjax(originUrl, false)
                                            .catch(e2 => Promise$1.reject(e)) // 忽略e2, 返回原始错误e
                                    } else if (e.code === 10004) { // code: 10004, 表示视频被隐藏, 一般添加module=bangumi参数可以拉取到视频
                                        ui.playerMsg('尝试使用番剧视频接口拉取视频地址...');
                                        return playurl_by_proxy._asyncAjax(originUrl, true)
                                            .catch(e2 => Promise$1.reject(e))
                                    }
                                }
                                return Promise$1.reject(e)
                            })))
                            .catch(e => {
                                if ((typeof e === 'object' && e.statusText == 'error')
                                    || (e instanceof AjaxException && (e.code === -502 || e.code === -412/*请求被拦截*/ || e.code === -500/*已爆炸*/))
                                    || (typeof e === 'object' && e.code === -10403)
                                ) {
                                    ui.playerMsg('尝试使用kghost的服务器拉取视频地址...');
                                    return playurl_by_kghost._asyncAjax(originUrl)
                                        .catch(e2 => Promise$1.reject(e))
                                }
                                return Promise$1.reject(e)
                            })
                            // 报错时, 延时1秒再发送错误信息
                            .catch(e => Async.timeout(1000).then(r => Promise$1.reject(e)))
                            .catch(e => {
                                let msg;
                                if (typeof e === 'object' && e.statusText == 'error') {
                                    msg = '代理服务器临时不可用';
                                    ui.playerMsg(msg);
                                } else {
                                    msg = Objects.stringify(e);
                                }
                                ui.pop({
                                    content: `## 拉取视频地址失败\n原因: ${msg}\n\n可以考虑进行如下尝试:\n1. 多<a href="">刷新</a>几下页面\n2. 进入<a href="javascript:bangumi_area_limit_hack.showSettings();">设置页面</a>更换代理服务器\n3. 耐心等待代理服务器端修复问题`,
                                    onConfirm: window.location.reload.bind(window.location),
                                    confirmBtn: '刷新页面'
                                });
                                return Promise$1.reject(e)
                            })
                            .then(data => {
                                if (data.dash) {
                                    // dash中的字段全部变成了类似C语言的下划线风格...
                                    Objects.convertKeyToSnakeCase(data.dash);
                                }
                                // 替换后大多数bangumi下的视频都会报CROS错误
                                if (!window.__balh_app_only__ && balh_config.upos_server) {
                                    return Converters.replaceUpos(data, uposMap[balh_config.upos_server], balh_config.upos_replace_akamai)
                                }
                                return data
                            })
                    }
                });
                return {
                    _get_source: util_page.movie() ? get_source_by_aid : get_source_by_season_id,
                    _playurl: playurl,
                };
            })();

            if (util_page.anime_ep_m() || util_page.anime_ss_m()) {
                // BiliPlusApi.playurl_for_mp4返回的url能在移动设备上播放的前提是, 请求头不包含Referer...
                // 故这里设置meta, 使页面不发送Referer
                // 注意动态改变引用策略的方式并不是标准行为, 目前在Chrome上测试是有用的
                document.head.appendChild(createElement('meta', { name: "referrer", content: "no-referrer" }));
                injectFetch4Mobile();
                util_init(() => {
                    const $wrapper = document.querySelector('.player-wrapper');
                    new MutationObserver(function (mutations, observer) {
                        for (let mutation of mutations) {
                            if (mutation.type === 'childList') {
                                for (let node of mutation.addedNodes) {
                                    if (node.tagName === 'DIV' && node.className.split(' ').includes('player-mask')) {
                                        log('隐藏添加的mask');
                                        node.style.display = 'none';
                                    }
                                }
                            }
                        }
                    }).observe($wrapper, {
                        childList: true,
                        attributes: false,
                    });
                });
            }
            injectXHR();
            {
                let jQuery = window.jQuery;
                if (jQuery) { // 若已加载jQuery, 则注入
                    injectAjax();
                }
                // 需要监听jQuery变化, 因为有时会被设置多次...
                Object.defineProperty(window, 'jQuery', {
                    configurable: true, enumerable: true, set: function (v) {
                        // debugger
                        log('set jQuery', jQuery, '->', v);
                        // 临时规避这个问题：https://github.com/ipcjs/bilibili-helper/issues/297
                        // 新的av页面中, 运行脚本的 injectXHR() 后, 页面会往该方法先后设置两个jQuery...原因未知
                        // 一个从jquery.min.js中设置, 一个从player.js中设置
                        // 并且点击/载入等事件会从两个jQuery中向下分发...导致很多功能失常
                        // 这里我们屏蔽掉jquery.min.js分发的一些事件, 避免一些问题
                        if (util_page.av_new() && balh_config.enable_in_av) {
                            try { // 获取调用栈的方法不是标准方法, 需要try-catch
                                const stack = (new Error()).stack.split('\n');
                                if (stack[stack.length - 1].includes('jquery')) { // 若从jquery.min.js中调用
                                    log('set jQueury by jquery.min.js', v);
                                    v.fn.balh_on = v.fn.on;
                                    v.fn.on = function (arg0, arg1) {
                                        if (arg0 === 'click.reply' && arg1 === '.reply') {
                                            // 屏蔽掉"回复"按钮的点击事件
                                            log('block click.reply', arguments);
                                            return
                                        }
                                        return v.fn.balh_on.apply(this, arguments)
                                    };
                                }
                                // jQuery.fn.paging方法用于创建评论区的页标, 需要迁移到新的jQuery上
                                if (jQuery != null && jQuery.fn.paging != null
                                    && v != null && v.fn.paging == null) {
                                    log('迁移jQuery.fn.paging');
                                    v.fn.paging = jQuery.fn.paging;
                                }
                            } catch (e) {
                                util_error(e);
                            }
                        }

                        jQuery = v;
                        injectAjax();// 设置jQuery后, 立即注入
                    }, get: function () {
                        return jQuery;
                    }
                });
            }
        }());

        remove_pre_ad();

        check_html5();

        redirect_to_bangumi_or_insert_player();

        fill_season_page();

        const settings$1 = settings();

        jump_to_baipiao();
        biliplus_check_area_limit();

        function main() {
            util_info(
                'mode:', balh_config.mode,
                'blocked_vip:', balh_config.blocked_vip,
                'server:', balh_config.server,
                'upos_server:', balh_config.upos_server,
                'flv_prefer_ws:', balh_config.flv_prefer_ws,
                'remove_pre_ad:', balh_config.remove_pre_ad,
                'generate_sub:', balh_config.generate_sub,
                'enable_in_av:', balh_config.enable_in_av,
                'readyState:', document.readyState,
                'isLogin:', biliplus_login.isLogin(),
                'isLoginBiliBili:', biliplus_login.isLoginBiliBili()
            );
            // 暴露接口
            window.bangumi_area_limit_hack = {
                setCookie: cookieStorage.set,
                getCookie: cookieStorage.get,
                login: biliplus_login.showLogin,
                logout: biliplus_login.showLogout,
                getLog: (...args) => {
                    setTimeout(() => {
                        util_warn('日志包含access_key等敏感数据, 请不要发给不信任的人!');
                    }, 0);
                    return logHub.getAllMsg.apply(null, args)
                },
                showSettings: settings$1.show,
                _setupSettings: settings$1.setup,
                set1080P: function () {
                    const settings = JSON.parse(localStorage.bilibili_player_settings);
                    const oldQuality = settings.setting_config.defquality;
                    util_debug(`defauality: ${oldQuality}`);
                    settings.setting_config.defquality = 112; // 1080P
                    localStorage.bilibili_player_settings = JSON.stringify(settings);
                    location.reload();
                },
                _clear_local_value: function () {
                    delete localStorage.oauthTime;
                    delete localStorage.balh_h5_not_first;
                    delete localStorage.balh_old_isLoginBiliBili;
                    delete localStorage.balh_must_remind_login_v3;
                    delete localStorage.balh_must_updateLoginFlag;
                }
            };
        }

        main();
    }

    scriptContent();
}

scriptSource(GM_info.scriptHandler);
