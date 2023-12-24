// @ts-nocheck
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

// 检查一个微博是不是已经被显示过了，如果显示过了不重复显示
var shownFeed = function (id) {
    return false;
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
var availableNotification = function () {
    return Object.keys(available);
};
// 选择用哪个接口
var choseNotification = function (prefer) {
    return (use = prefer && available[prefer] || available.standard);
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
            console.log('Notification permission: denied');
            break;
    }
    return null;
}

export const util_notify = {
    'availableNotification': availableNotification,
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

