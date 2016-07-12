
var Live = {
    setInterval: function (object, func, timeout) {
        var a = setInterval(function () {
            if (object && typeof func == 'function') {
                func();
                clearInterval(a);
            }
        }, timeout);
    },
    set : function (n, k, v) {
        if (!window.localStorage || !n) return;
        var storage = window.localStorage;
        if (!storage[n]) storage[n] = JSON.stringify({});
        var l = JSON.parse(storage[n]);
        if (v == undefined) {
            storage[n] = typeof k == 'string' ? k.trim() : JSON.stringify(k);
        } else {
            l[k] = typeof v == 'string' ? v.trim() : JSON.stringify(v);
            storage[n] = JSON.stringify(l);
        }
    }
};

var event = document.createEvent('Event');
event.initEvent('sendMessage', true, true);
var sendMessage = function (json) {
    var message = JSON.stringify(json);
    Live.set('bilibili_helper_message',message);
    document.dispatchEvent(event);
};

Live.setInterval(window.protocol, function () {
    Live.setInterval(window.protocol.SYS_MSG, function () {
        var b = window.protocol.SYS_MSG;
        window.protocol.SYS_MSG = function (json) {
            b(json);
            sendMessage(json);
        };
        var msg = new Notification("自动抽小电视功能已启动", {
            icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-25.png"
        });
        setTimeout(function () {
            msg.close();
    }, 500);
    Live.setInterval(window.protocol.TV_END, function () {
        var b = window.protocol.TV_END;
        window.protocol.TV_END = function (json) {
            b(json);
            sendMessage(json);
        };
    }, 500);
}, 1000);
Live.setInterval(window.liveRoomFuncs, function () {
    Live.setInterval(window.liveRoomFuncs.addDanmu, function () {
        var b = window.liveRoomFuncs.addDanmu;
        window.liveRoomFuncs.addDanmu = function (json) {
            b(json);
            sendMessage(json);
        };
    }, 500);
    Live.setInterval(window.liveRoomFuncs.addGift, function () {
        var b = window.liveRoomFuncs.addGift;
        window.liveRoomFuncs.addGift = function (json) {
            b(json);
            sendMessage(json);
        };
    }, 500);
}, 1000);
