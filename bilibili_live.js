/**
 * Created by Ruo on 4/12/2016.
 */
(function () {
    var Live = {};
    Live.set = function (k, v) {
        if (!window.localStorage) return;
        var l = JSON.parse(window.localStorage.live);
        l[k] = JSON.stringify(v);
        window.localStorage.live = JSON.stringify(l);
    };
    Live.get = function (k) {
        if (!window.localStorage) return;
        var l = JSON.parse(window.localStorage.live);
        return l[k];
    };
    Live.del = function (k) {
        if (!window.localStorage) return;
        var l = JSON.parse(window.localStorage.live);
        delete l[k];
        window.localStorage.live = JSON.stringify(l);
    };
    var live_sotre = (function () {
        if (!window.localStorage) return;
        if (window.localStorage.live) return window.localStorage.live;
        else {
            return window.localStorage.live = JSON.stringify({});
        }
    })();

    Live.doSign = {
        sign: function () {
            var date = new Date().getDate();
            if (Live.get('today') == false || Live.get('signDate') != date) {
                $.get("/sign/doSign", function (data) {
                    var e = JSON.parse(data);
                    if (e.code == 0) {
                        var msg = new Notification(eval("'" + e.msg + "'"), {
                            body: "获得" + e.data.silver + "瓜子~",
                            icon: "//static.hdslb.com/live-static/images/7.png"
                        });
                        Live.set('today', true);
                        Live.set('signDate', date);
                        setTimeout(function () {
                            msg.close();
                        }, 1000);
                    } else if (e.code == -500) {
                        var msg = new Notification(eval("'" + e.msg + "'"), {
                            body: "不能重复签到",
                            icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                        });
                        Live.set('today', true);
                        Live.set('signDate', date);
                        setTimeout(function () {
                            msg.close()
                        }, 5000);
                    }
                    else if (e.code == -101) {
                        var msg = new Notification(eval("'" + e.msg + "'"), {
                            body: "您还没有登录",
                            icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                        });
                        setTimeout(function () {
                            msg.close()
                        }, 5000);
                    }
                });
            }
        }
    };
    Live.doSign.sign();
    Notification.requestPermission();
})();