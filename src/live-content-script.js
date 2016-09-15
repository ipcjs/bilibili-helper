var Live = {
    setInterval: function (object, func, timeout) {
        var a = setInterval(function () {
            if (object && typeof func == 'function') {
                func();
                clearInterval(a);
            }
        }, timeout);
    },
    set: function (n, k, v) {
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
console.log("%c弹幕监控脚本 插入成功㇏(°ω° )ノ♪~", "color:#FFFFFF;background-color:#4fc1e9;padding:5px;border-radius:7px;line-height:30px;");
var event = document.createEvent('Event');
event.initEvent('sendMessage', true, true);
var sendMessage = function (json) {
    var message = JSON.stringify(json);
    Live.set('bilibili_helper_message', message);
    document.dispatchEvent(event);
};
var options = document.getElementById('bilibiliHelperScript').getAttribute('options');
if (options != '{}') options = JSON.parse(options);
//treause
// if (options['treasure']){
    // Live.setInterval(window.refreshCaptcha, function () {
    //     window.refreshCaptcha = function () {
    //         $("#captchaImg").attr("src", "http://live.bilibili.com/freeSilver/getCaptcha?ts=" + Date.now());
    //     };
    // }, 1000);
// }
//giftpackage
// if (options['giftpackage']){
//     Live.setInterval(window.flash_giftPackageOpen, function () {
//         window.flash_giftPackageOpen = function () {
//             $(".items-package").click();
//         };
//     }, 1000);
// }
//watcher
if (options['watcher']) {
    Live.setInterval(window.protocol, function () {
        Live.setInterval(window.protocol.SYS_MSG, function () {
            var b = window.protocol.SYS_MSG;
            window.protocol.SYS_MSG = function (json) {
                b(json);
                sendMessage(json);
            };
        }, 500);
        Live.setInterval(window.protocol.SYS_GIFT, function () {
            var b = window.protocol.SYS_GIFT;
            window.protocol.SYS_GIFT = function (json) {
                b(json);
                sendMessage(json);
            };
        }, 500);
        // Live.setInterval(window.protocol.TV_END, function () {
        //     var b = window.protocol.TV_END;
        //     window.protocol.TV_END = function (json) {
        //         b(json);
        //         sendMessage(json);
        //     };
        // }, 500);
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
}