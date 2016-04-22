/**
 * Created by Ruo on 4/12/2016.
 */
(function () {
    if (location.hostname == 'live.bilibili.com') {
        d = document.createElement('script');
        d.innerHTML = 'if (window.localStorage) {if(!window.localStorage.helper_live_roomId){window.localStorage.helper_live_roomId=JSON.stringify({});}var l = JSON.parse(window.localStorage.helper_live_roomId);l[' + location.pathname.substr(1) + '] = ROOMID;window.localStorage.helper_live_roomId=JSON.stringify(l);}';
        document.body.appendChild(d);
        var Live = {};
        Live.set = function (n, k, v) {
            if (!window.localStorage || !n) return;

            if (!window.localStorage[n])window.localStorage[n] = JSON.stringify({});
            var l = JSON.parse(window.localStorage[n]);
            if (!k) window.localStorage[n] = JSON.stringify(v);
            else {
                l[k] = JSON.stringify(v);
                window.localStorage[n] = JSON.stringify(l);
            }
        };
        Live.get = function (n, k) {
            if (!window.localStorage || !n) return;

            if (!window.localStorage[n]) {
                window.localStorage[n] = JSON.stringify({});
                return null;
            }
            var l = JSON.parse(window.localStorage[n]);
            if (!k) return l;
            return l[k];
        };
        Live.del = function (n, k) {
            if (!window.localStorage || !n || !k) return;

            if (!window.localStorage[n]) {
                window.localStorage[n] = JSON.stringify({});
                return;
            }
            var l = JSON.parse(window.localStorage[n]);
            delete l[k];
            window.localStorage[n] = JSON.stringify(l);
        };
        Live.getUser = function () {
            return $.ajax({
                url: 'http://live.bilibili.com/user/getuserinfo',
                type: 'GET',
                dataType: 'json'
            }).promise();
        };
        Live.initUserInfo = function () {
            var pro = Live.getUser();
            return pro.done(function (user) {
                if (user.code == 'REPONSE_OK') {
                    user = user.data;
                    Live.set('helper_userInfo', 'username', user.uname);
                    Live.set('helper_userInfo', 'userLevel', user.user_level);
                    Live.set('helper_userInfo', 'silver', user.silver);
                    Live.set('helper_userInfo', 'gold', user.gold);
                    Live.set('helper_userInfo', 'face', user.face);
                    Live.set('helper_userInfo', 'login', true);

                    return true;
                } else return true;
            });

        };
        Live.clearLocalStorage = function () {
            Live.del('helper_live_bet', Live.getRoomId());
            Live.del('helper_live_check', Live.getRoomId());
            Live.del('helper_live_number', Live.getRoomId());
            Live.del('helper_live_rate', Live.getRoomId());
            Live.del('helper_live_which', Live.getRoomId());
        };
        Live.getRoomId = function () {
            return Live.get('helper_live_roomId', location.pathname.substr(1));
        };

        Live.set('helper_userInfo', 'login', false);
        Live.clearLocalStorage();
        Live.initUserInfo();

        Live.doSign = {
            sign: function () {
                /*check login*/
                if (!Live.get('helper_userInfo', 'login')) return;

                var date = new Date().getDate();
                if (Live.get('helper_doSign', 'today') == false || Live.get('helper_doSign', 'signDate') != date) {
                    $.get("/sign/doSign", function (data) {
                        var e = JSON.parse(data);
                        //    {
                        //    "code": 0,
                        //    "msg": "ok",
                        //    "data": {
                        //        "text": "200\u94f6\u74dc\u5b50,3000\u7528\u6237\u7ecf\u9a8c\u503c",
                        //        "lottery": {"status": false, "lottery": {"id": "", "data": ""}},
                        //        "allDays": "30",
                        //        "hadSignDays": 22,
                        //        "remindDays": 8
                        //    }
                        //};
                        if (e.code == 0) {
                            var msg = new Notification(eval("'" + e.msg + "'"), {
                                body: "您获得了" + e.data.text,
                                icon: "//static.hdslb.com/live-static/images/7.png"
                            });
                            Live.set('helper_doSign', 'today', true);
                            Live.set('helper_doSign', 'signDate', date);
                            setTimeout(function () {
                                msg.close();
                            }, 1000);
                        } else if (e.code == -500) {
                            var msg = new Notification(eval("'" + e.msg + "'"), {
                                body: "不能重复签到",
                                icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                            });
                            Live.set('helper_doSign', 'today', true);
                            Live.set('helper_doSign', 'signDate', date);
                            setTimeout(function () {
                                msg.close();
                            }, 5000);
                        }
                        else {
                            var msg = new Notification(eval("'" + e.msg + "'"), {
                                body: "",
                                icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                            });
                            setTimeout(function () {
                                msg.close();
                            }, 5000);
                        }
                    });
                }
            }
        };

        Live.bet = {
            times: 0,
            stop: false,
            checkBetStatus: function (callback) {
                /*check bet*/
                var r = false;
                Live.bet.getBet().done(function (bet) {
                    bet = bet.data;
                    if (!Live.get('helper_userInfo', 'login') && bet.betStatus == false) {
                        Live.bet.cancelCheck();
                        return
                    }

                    if (!Live.bet.canBet(bet)) return;//none bet permission
                    if (!Live.bet.betOn(bet)) return;//bet is not on
                    if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1)Live.bet.init();
                    if (typeof callback == 'function') callback();
                });
            },
            canBet: function (bet) {
                if (bet.isBet == false) {
                    if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1) {
                        Live.bet.disable();
                        Live.set('helper_live_autoMode', Live.getRoomId(), 0);
                    }
                    return false;
                } else return true;
            },
            betOn: function (bet) {
                if (bet.betStatus == false) {
                    if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1) Live.bet.hide();
                    return false;
                } else return true;
            },
            init: function () {
                /*check login*/
                if (!Live.get('helper_userInfo', 'login')) return;

                /*auto mode*/
                if (!parseInt(Live.get('helper_live_autoMode', Live.getRoomId()))) return;

                /*create quiz helper DOM*/
                Live.bet.quiz_panel = $('#quiz-control-panel');
                if (Live.bet.quiz_panel.children('#quiz_helper').length == 0) {
                    Live.bet.quiz_helper = $('<div id="quiz_helper"></div>');
                    //var quiz_helper_title = $('<h4 class="section-title"><span style="font-size: 13px;margin:30px 0 10px;display: block;">下注预约</span></h4>');
                    Live.bet.quiz_rate = $('<input class="rate" type="text"  placeholder="赔率" maxlength="3" required="required" />');
                    Live.bet.quiz_number = $('<input class="number" type="text" placeholder="数额" maxlength="8" required="required" />');
                    Live.bet.quiz_btns = $('<div class="bet-buy-btns p-relative clear-float"></div>');
                    Live.bet.quiz_cancel_btn = $('<button class="cancel hide" title="点击取消预约下注">取消下注</button>');
                    Live.bet.quiz_success_btn = $('<button class="success hide">下注成功 - 点击继续下注</button>');
                    Live.bet.quiz_blue_btn = $('<button class="bet-buy-btn blue float-left" data-target="a" data-type="silver">填坑</button>');
                    Live.bet.quiz_red_btn = $('<button class="bet-buy-btn pink float-right" data-target="b" data-type="silver">填坑</button>');
                    Live.bet.description = $('<a class="description" title="自动下注功能会根据您填写的赔率及下注数额和实时的赔率及可购买量进行不停的比对，一旦满足条件则自动买入\n当实时赔率大于等于目标赔率且有购买量时自动买入"><i class="help-icon"></i></a>');
                    Live.bet.quiz_btns.append(Live.bet.quiz_blue_btn, Live.bet.quiz_red_btn);
                    Live.bet.version = $("<div class=\"version\">哔哩哔哩助手 " + chrome.runtime.getManifest().version + " by <a href=\"http://weibo.com/guguke\" target=\"_blank\">@啾咕咕www</a></div>");
                    Live.bet.quiz_helper.append(
                        Live.bet.quiz_success_btn,
                        Live.bet.quiz_cancel_btn,
                        $('<div class="quiz_helper">').append($('<span class="rate_title">').text('赔率'), Live.bet.quiz_rate),
                        $('<div class="quiz_helper">').append($('<span class="number_title">').text('数额'), Live.bet.quiz_number),
                        Live.bet.quiz_btns
                    );
                    Live.bet.quiz_panel.append(Live.bet.quiz_helper, Live.bet.version);
                }
                /*change default style*/
                $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').addClass('hide');
                $('#quiz-control-panel .section-title').append(Live.bet.description);
                Live.bet.quiz_toggle_btn.addClass('on');
                Live.bet.quiz_helper.removeClass('hide');

                Live.bet.check();

                /*add listener*/
                $('#quiz_helper .bet-buy-btns button').unbind('click').click(function () {
                    var which = $(this).attr('data-target');
                    /*rate*/
                    var rate = parseFloat(Live.bet.quiz_rate.val());
                    if (rate.length > 3) rate = rate.toFixed(1);
                    Live.set('helper_live_rate', Live.getRoomId(), rate);

                    /*number*/
                    var number = parseInt(Live.bet.quiz_number.val());
                    Live.set('helper_live_number', Live.getRoomId(), number);

                    Live.set('helper_live_which', Live.getRoomId(), which);

                    Live.bet.quiz_cancel_btn.text('返' + rate + ' 买' + (which == 'a' ? '蓝 ' : '红 ') + number + '注');

                    Live.bet.startInterval();
                });
                Live.bet.quiz_number.unbind('focus').focus(function () {
                    Live.initUserInfo();
                });
                Live.bet.quiz_number.unbind('keyup').keyup(function () {
                    var v = $(this).val();
                    var silver = parseInt(Live.get('helper_userInfo', 'silver'));
                    while (v != '' && isNaN(v)) {
                        $(this).val(v.substr(0, v.length - 1));
                        v = $(this).val();
                    }
                    if (parseInt(v) > silver) {
                        $(this).val(silver);
                    }
                });
                Live.bet.quiz_rate.unbind('keyup').keyup(function () {
                    var v = $(this).val();
                    while (v != '' && isNaN(v)) {
                        $(this).val(v.substr(0, v.length - 1));
                        v = $(this).val();
                    }
                });
                Live.bet.quiz_cancel_btn.unbind('click').click(function () {
                    Live.bet.cancel(true);
                });
                Live.bet.quiz_success_btn.unbind('click').click(function () {
                    Live.bet.cancel(true);
                });
            },
            getBet: function () {
                var roomId = Live.getRoomId();
                return $.ajax({
                    url: 'http://live.bilibili.com/bet/getRoomBet',
                    type: 'POST',
                    dataType: 'json',
                    //async: false,
                    data: {roomid: roomId}
                }).promise();
                //return JSON.parse(bet).data;
            },
            do: function () {
                Live.bet.getBet().done(function (bet) {
                    bet = bet.data;

                    if (!Live.bet.canBet(bet) || !Live.bet.betOn(bet)) {
                        Live.bet.cancel(true);
                        return;
                    }//none bet permission ||bet is not on
                    var w = eval(Live.get('helper_live_which', Live.getRoomId()));
                    var bankerId = bet.silver[w].id;
                    var rate = bet.silver[w].times;
                    if (Live.bet.stop) clearInterval(Live.get('helper_live_bet', Live.getRoomId()));
                    if (rate >= Live.get('helper_live_rate', Live.getRoomId())) {
                        var number = eval(Live.get('helper_live_number', Live.getRoomId()));
                        $.ajax({
                            url: 'http://live.bilibili.com/bet/addBettor',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                bankerId: bankerId,
                                amount: number,
                                token: __GetCookie('LIVE_LOGIN_DATA')
                            },
                            complete: function (data) {
                                var b = JSON.parse(data.responseText);
                                if (b.code == -400) {//error
                                    Live.bet.error(b.msg);
                                } else if (b.code == 0) {//success
                                    Live.bet.success();
                                }
                            }
                        });
                    }
                });
            },
            startInterval: function () {
                Live.bet.cancelCheck();
                Live.bet.stop = false;

                /*Style*/
                if (Live.bet.quiz_rate.val() == '') {
                    Live.bet.quiz_rate.addClass('error');
                    return;
                } else Live.bet.quiz_rate.removeClass('error');
                if (Live.bet.quiz_number.val() == '') {
                    Live.bet.quiz_number.addClass('error');
                    return;
                } else Live.bet.quiz_number.removeClass('error');

                Live.bet.quiz_helper.children('input,div').addClass('hide');
                Live.bet.quiz_cancel_btn.removeClass('hide');
                Live.bet.quiz_success_btn.addClass('hide');

                Live.set('helper_live_number', Live.getRoomId(), Live.bet.quiz_number.val());

                /*Action*/
                Live.bet.do();
                Live.set('helper_live_bet', Live.getRoomId(), setInterval(Live.bet.do, 2000));
            },
            success: function () {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_cancel_btn.addClass('hide');
                    Live.bet.quiz_success_btn.removeClass('hide');
                }
                clearInterval(Live.get('helper_live_bet', Live.getRoomId()));
                Live.clearLocalStorage();
                Live.bet.check();
            },
            error: function (msg) {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_success_btn.addClass('hide');
                    Live.bet.quiz_cancel_btn.removeClass('hide').text(msg);
                }
                clearInterval(Live.get('helper_live_bet', Live.getRoomId()));
                Live.clearLocalStorage();
            },
            cancel: function (check) {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper) {
                    Live.bet.quiz_helper.children('input,div').removeClass('hide');
                    Live.bet.quiz_cancel_btn.addClass('hide');
                    Live.bet.quiz_success_btn.addClass('hide');
                    clearInterval(Live.get('helper_live_bet', Live.getRoomId()));
                    Live.clearLocalStorage();
                }
                if (check)Live.bet.check();
            },
            hide: function () {
                if (Live.bet.quiz_helper) {
                    Live.bet.quiz_toggle_btn.removeClass('on');
                    $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').removeClass('hide');
                    $('#quiz-control-panel .section-title').children('.description').remove();
                    Live.bet.quiz_helper.addClass('hide');
                }
            },
            disable: function () {
                Live.bet.cancel(false);
                Live.bet.cancelCheck();
                if (Live.bet.quiz_helper) {
                    Live.bet.quiz_toggle_btn.removeClass('on');
                    $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').removeClass('hide');
                    $('#quiz-control-panel .section-title').children('.description').remove();
                    Live.bet.quiz_helper.addClass('hide');
                    Live.set('helper_live_autoMode', Live.getRoomId(), 0);
                    Live.clearLocalStorage();
                }
            },
            check: function () {
                if (!Live.get('helper_live_check', Live.getRoomId())) {
                    Live.bet.checkBetStatus();
                    Live.set('helper_live_check', Live.getRoomId(), setInterval(Live.bet.checkBetStatus, 3000));
                }
            },
            cancelCheck: function () {
                clearInterval(Live.get('helper_live_check', Live.getRoomId()));
                Live.set('helper_live_check', Live.getRoomId(), undefined);
            }
        };

        /*toggle btn*/
        if (Live.get('helper_userInfo', 'login')) {
            Live.bet.quiz_toggle_btn = $('<a class="bet_toggle">自动下注</a>');
            $('#quiz-control-panel .section-title').append(Live.bet.quiz_toggle_btn);
            Live.bet.quiz_toggle_btn.click(function () {
                if ($(this).hasClass('on')) {
                    Live.bet.disable();
                } else {
                    Live.set('helper_live_autoMode', Live.getRoomId(), 1);
                    Live.bet.checkBetStatus();
                }
            });
            chrome.extension.sendMessage({
                command: "getOption",
                key: 'doSign',
            }, function (response) {
                if (response['value'] == 'on') setInterval(Live.doSign.sign, 300000); //doSign per 5 min
            });


            Live.bet.init();
            Notification.requestPermission();
        }
    }
})();