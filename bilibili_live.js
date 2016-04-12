/**
 * Created by Ruo on 4/12/2016.
 */
(function () {
    var Live = {};
    var live_sotre = (function () {
        if (!store.enabled) {
            new Notification("浏览器版本过低", {
                body: "请使用最先进的浏览器",
                icon: ""
            });
            return;
        }
        if (store.set('live') != undefined) return Live.get('live');
        else {
            store.set('live', {today: false})
            return {};
        }
    })();
    Live.set = function (k, v) {
        if (!store.enabled) return;

        store.set('live', {k: v})
    };
    Live.get = function (k) {
        if (!store.enabled) return;
        return store.get('live')[k];
    };
    Live.doSign = {
        today: false,
        sign: function () {
            if (!Live.get('today')) {
                $.get("/sign/doSign", function (data) {
                    var e = JSON.parse(data);
                    if (e.code == 0) {
                        var msg = new Notification(eval("'" + e.msg + "'"), {
                            body: "获得" + e.data.silver + "瓜子~",
                            icon: "//static.hdslb.com/live-static/images/7.png"
                        });
                        setTimeout(function () {
                            msg.close()
                        }, 1000);
                    } else if (e.code == -500) {
                        var msg = new Notification(eval("'" + e.msg + "'"), {
                            body: "不能重复签到",
                            icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                        });
                        setTimeout(function () {
                            msg.close()
                        }, 5000);
                        Live.set('today', true);
                    }
                });
            }
        }
    };
    Live.doSign.sign();
    Notification.requestPermission();
})();