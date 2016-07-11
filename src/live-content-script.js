if (window.localStorage) {
    if (!window.localStorage.helper_live_roomId) { window.localStorage.helper_live_roomId = JSON.stringify({}); }
    var l = JSON.parse(window.localStorage.helper_live_roomId);
    l[ROOMURL] = ROOMID;
    window.localStorage.helper_live_roomId = JSON.stringify(l);
    if (!window.localStorage.helper_live_rnd) { window.localStorage.helper_live_rnd = JSON.stringify({}); }
    var r = JSON.parse(window.localStorage.helper_live_rnd);
    r[ROOMURL] = DANMU_RND;
    window.localStorage.helper_live_rnd = JSON.stringify(r);
}
var Live = {
    setInterval: function (object, func, timeout) {
        var a = setInterval(function () {
            if (object && typeof func == 'function') {
                func();
                clearInterval(a);
            }
        }, timeout);
    },
    extensionId: 'kpbnombpnpcffllnianjibmpadjolanh'
};
var port = chrome.runtime.connect(Live.extensionId);
var event = document.createEvent('Event');
event.initEvent('sendMessage', true, true);
var json = document.createElement('div');
json.id = 'bilibiliHelperMessage';
document.body.appendChild(json);
var sendMessage = function (json) {
    var message = JSON.stringify(json);
    $('#bilibiliHelperMessage').text(message);
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
        }, 10000);
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
