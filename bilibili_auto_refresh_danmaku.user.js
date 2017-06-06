// ==UserScript==
// @name         自动刷新B站弹幕
// @namespace    https://github.com/ipcjs
// @version      0.1.4
// @description  2017-05-29：B站的弹幕居然不能实时更新, 只能用脚本来自动刷新了; 目前的策略是如果弹幕池没满, 就隔5-50秒刷新一次; 2017-06-06：B站已经开始通过WebSocket实时推送弹幕了, 但推的并不全, 会漏掉一些..., 所以这个脚本还是有点用的(-_-#);
// @author       ipcjs
// @include      *://www.bilibili.com/video/av*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @run-at       document-start
// @grant        none
// ==/UserScript==

'use strict';

// https://github.com/wendux/Ajax-hook
(function (global) {
    global.hookAjax = function (object, name, hookObj) {
        var oriName = '_' + name;
        object[oriName] = object[oriName] || object[name];
        object[name] = function (...args) {
            this[oriName] = new object[oriName](...args);
            for (var attr in this[oriName]) {
                var type = "";
                try {
                    type = typeof this[oriName][attr]
                } catch (e) { }
                if (type === "function") {
                    this[attr] = hookfun(attr);
                } else {
                    Object.defineProperty(this, attr, {
                        get: getterFactory(attr),
                        set: setterFactory(attr)
                    })
                }
            }
        }

        function getterFactory(attr) {
            return function () {
                return this.hasOwnProperty(attr + "_") ? this[attr + "_"] : this[oriName][attr];
            }
        }

        function setterFactory(attr) {
            return function (value) {
                var origin = this[oriName];
                var that = this;
                // 设置不是onXxx的回调属性时, 保存到hook对象里面, 因为大多数回调函数中不是使用this来取属性(如xhr.responseText), 而是直接使用之前创建的hook对象
                if (attr.indexOf("on") != 0) {
                    this[attr + "_"] = value;
                    return;
                }
                if (hookObj[attr]) {
                    this['_' + attr] = value; // 保存原始的回调, 供之后使用
                    origin[attr] = function () {
                        if (hookObj[attr].apply(that, arguments)) {
                            return;
                        }
                        return value.apply(origin, arguments);
                    };
                } else {
                    origin[attr] = value;
                }
            }
        }

        function hookfun(attr) {
            return function () {
                if (hookObj[attr] && hookObj[attr].apply(this, arguments)) {
                    return;
                }
                return this[oriName][attr].apply(this[oriName], arguments);
            }
        }
        return object[oriName];
    }
    global.unHookAjax = function (object, name) {
        var oriName = '_' + name;
        if (object[oriName]) object[name] = object[oriName];
        object[oriName] = undefined;
    }
})(window);

var group;

function AutoRefreshDanmaku(cid, onmessage) {
    this.cid = cid;
    this.size = -1;
    this.onmessage = onmessage;
    this.minInterval = 5 * 1000;
    this.maxInterval = this.minInterval * 10;
}
AutoRefreshDanmaku.prototype = {
    start: function () {
        this.timeoutRefresh(0);
    },
    stop: function () {
        clearTimeout(this.timeoutId);
    },
    send: function (p, text) {
        this.onmessage({ data: `0002["${p}", "${text}"]` })
        log('send:', text);
    },
    refresh: function () {
        var that = this;
        $.ajax({
            url: '//comment.bilibili.com/' + that.cid + '.xml',
            // xhrFields: { withCredentials: true },
            success: function (data) {
                if (that.cid !== getWindowCid()) {
                    log('cid改变了, 终止刷新');
                    return;
                }
                var maxlimitTags = data.getElementsByTagName('maxlimit');
                var maxlimit = maxlimitTags.length > 0 && +maxlimitTags[0].textContent || 999999;
                var dTags = data.getElementsByTagName('d');
                if (dTags.length < maxlimit) {
                    var delay = (that.maxInterval - that.minInterval) * Math.pow(dTags.length / maxlimit, 3) + that.minInterval,
                        infos;
                    if (that.size < 0) {
                        log('当前弹幕数量: %s/%s, delay: %s', dTags.length, maxlimit, delay);
                    } else {
                        for (var i = that.size; i < dTags.length; i++) {
                            // 这里的数据与xml中的数据相比, 在index=5上多个一个参数si, 这里把它设成'0'
                            infos = dTags[i].getAttribute('p').split(',');
                            infos.splice(5, 0, '0'); // 插入si
                            that.send(infos.join(','), dTags[i].textContent.replace(/(\/n|\\n|\n|\r\n)/g, "\r"));
                        }
                        log('新增了%s条弹幕, delay: %s', dTags.length - that.size, delay);
                    }
                    that.size = dTags.length;
                    that.timeoutRefresh(delay);
                } else {
                    log('弹幕数量(%s)已到达最大值(%s), 不需要刷新弹幕', dTags.length, maxlimit);
                }
            },
            error: function () {
                that.timeoutRefresh(that.minInterval);
            }
        });
    },
    timeoutRefresh: function (delay) {
        this.timeoutId = setTimeout(this.refresh.bind(this), delay);
    }
};

var autoRefreshDanmaku;
window.hookAjax(window, 'WebSocket', {
    onmessage: function (msg) {
        log('onmessage:', msg.data, this._WebSocket.url, getWindowCid());
        if (group = this._WebSocket.url.match(/chat\.bilibili\.com:\d+\/(\d+)/)) {
            var cid = group[1];
            if (cid === getWindowCid()) {
                if (autoRefreshDanmaku == null) {
                    autoRefreshDanmaku = new AutoRefreshDanmaku(cid, this._onmessage);
                    autoRefreshDanmaku.start();
                    log('开始刷新, cid:%s', autoRefreshDanmaku.cid);
                } else if (cid !== autoRefreshDanmaku.cid) {
                    autoRefreshDanmaku.stop();
                    autoRefreshDanmaku = new AutoRefreshDanmaku(cid, this._onmessage);
                    autoRefreshDanmaku.start();
                    log('重新开始刷新, cid:%s', autoRefreshDanmaku.cid);
                } else {
                    // log('继续刷新, cid:%s', autoLoadDanmu.cid);
                }
            }
        };
    }
});

function getWindowCid() {
    var cid = window.cid;
    if (!cid) {
        if (group = window.location.href.match(/cid=(\d+)/)) {
            cid = group[1];
        } else {
            try {
                cid = window.top.cid;
            } catch (e) {
                console.log(e);
                cid = '0';
            }
        }
    }
    return cid;
}

function log() {
    console.log.apply(console, arguments);
}