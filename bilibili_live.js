/**
 * Created by Ruo on 4/12/2016.
 */

(function () {
    if (location.hostname == 'live.bilibili.com') {
        d = document.createElement('script');
        d.innerHTML = 'window.localStorage.live' + location.pathname.substr(1) + '=ROOMID;';
        document.body.appendChild(d);
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

        Live.bet = {
            times: 0,
            stop: false,
            rate: undefined,
            number: undefined,
            interval: undefined,
            rooms: {},
            checkBetStatus: function () {
                var bet = Live.bet.getBet();
                if (bet.isBet == false) {
                    if (Live.get('autoMode' + Live.bet.getRoomId()) == 1) {
                        Live.bet.disable();
                        Live.set('autoMode' + Live.bet.getRoomId(), 0);
                    }
                    return false;
                }//none bet permission
                if (bet.betStatus == false) {
                    if (Live.get('autoMode' + Live.bet.getRoomId()) == 1) {
                        Live.bet.disable();
                        Live.set('autoMode' + Live.bet.getRoomId(), 0);
                    }
                    return false;
                }//bet is not on
                return true;
                //Live.set('autoMode'+Live.bet.getRoomId(), 1);
            },
            init: function () {
                if (!parseInt(Live.get('autoMode' + Live.bet.getRoomId()))) return;

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
                    Live.bet.quiz_helper.append(
                        Live.bet.quiz_success_btn,
                        Live.bet.quiz_cancel_btn,
                        $('<div class="quiz_helper">').append($('<span class="rate_title">').text('赔率'), Live.bet.quiz_rate),
                        $('<div class="quiz_helper">').append($('<span class="number_title">').text('数额'), Live.bet.quiz_number),
                        Live.bet.quiz_btns
                    )
                    Live.bet.quiz_panel.append(Live.bet.quiz_helper);
                }
                /*change default style*/
                $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').addClass('hide');
                $('#quiz-control-panel .section-title').append(Live.bet.description);
                Live.bet.quiz_toggle_btn.addClass('on');
                Live.bet.quiz_helper.removeClass('hide');

                /*add listener*/
                $(document).on('click', '#quiz_helper .bet-buy-btns button', function () {
                    var which = $(this).attr('data-target');

                    Live.bet.stop = false;
                    if (Live.bet.quiz_rate.val() == '') {
                        Live.bet.quiz_rate.addClass('error');
                        return;
                    } else Live.bet.quiz_rate.removeClass('error');
                    if (Live.bet.quiz_number.val() == '') {
                        Live.bet.quiz_number.addClass('error');
                        return;
                    } else Live.bet.quiz_number.removeClass('error');

                    /*rate*/
                    var rate = parseFloat(Live.bet.quiz_rate.val());
                    if (rate.length > 3) rate = rate.toFixed(1);
                    Live.set('rate' + Live.bet.getRoomId(), rate)

                    /*number*/
                    var number = parseFloat(Live.bet.quiz_number.val());
                    Live.set('number' + Live.bet.getRoomId(), number)

                    Live.set('which' + Live.bet.getRoomId(), which)

                    Live.bet.quiz_cancel_btn.text('返' + rate + ' 买' + (which == 'a' ? '蓝 ' : '红 ') + number + '注');

                    Live.bet.startInterval();
                });
                Live.bet.quiz_cancel_btn.click(function () {
                    Live.bet.cancel(true);
                });
                Live.bet.quiz_success_btn.click(function () {
                    Live.bet.cancel(true);
                });
            },
            getRoomId: function () {
                return window.localStorage['live' + location.pathname.substr(1)];
            },
            getBet: function () {
                var roomId = Live.bet.getRoomId();
                //console.log(roomId);
                var bet =
                    $.ajax({
                        url: 'http://live.bilibili.com/bet/getRoomBet',
                        type: 'POST',
                        dataType: 'json',
                        async: false,
                        data: {roomid: roomId}
                    }).responseText;
                return JSON.parse(bet).data;
            },
            do: function () {
                var bet = Live.bet.getBet();
                var w = Live.get('which' + Live.bet.getRoomId()) == '"a"' ? 'a' : 'b';
                var bankerId = bet.silver[w].id;
                var rate = bet.silver[w].times;
                //console.log('Times:', rate, w, Live.get('which' + Live.bet.getRoomId()));
                if (!rate) {
                    Live.bet.error('无法买入');
                    return;
                }
                if (Live.bet.stop) clearInterval(Live.get('setBet' + Live.bet.getRoomId()));
                if (rate >= Live.get('rate' + Live.bet.getRoomId())) {
                    var number = Live.get('number' + Live.bet.getRoomId());
                    $.ajax({
                        url: 'http://live.bilibili.com/bet/addBettor',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            bankerId: bankerId,
                            amount: number,
                            token: __GetCookie('LIVE_LOGIN_DATA')
                        },
                        complete: function (data, ts) {

                            b = JSON.parse(data.responseText);
                            if (b.code == -400) {//error
                                Live.bet.error(b.msg);
                            } else if (b.code == 0) {//success
                                Live.bet.success();
                            }
                        }
                    });
                }
            },
            startInterval: function () {
                Live.bet.cancelCheck();
                Live.bet.quiz_helper.children('input,div').addClass('hide');
                Live.bet.quiz_cancel_btn.removeClass('hide');
                Live.bet.quiz_success_btn.addClass('hide');
                Live.bet.do();
                Live.set('setBet' + Live.bet.getRoomId(), setInterval(function () {
                    Live.bet.do();
                }, 2000));
                //console.log(Live.get('setBet' + Live.bet.getRoomId()));

            },
            success: function () {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_cancel_btn.addClass('hide');
                    Live.bet.quiz_success_btn.removeClass('hide');
                }
                clearInterval(Live.get('setBet' + Live.bet.getRoomId()));
                Live.bet.check();
            },
            error: function (msg) {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_cancel_btn.removeClass('hide');
                    Live.bet.quiz_success_btn.addClass('hide');
                    Live.bet.quiz_cancel_btn.text(msg);
                }
                clearInterval(Live.get('setBet' + Live.bet.getRoomId()));
                //Live.bet.check();
            },
            cancel: function (check) {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_helper.children('input,div').removeClass('hide');
                    Live.bet.quiz_cancel_btn.addClass('hide');
                    Live.bet.quiz_success_btn.addClass('hide');
                    clearInterval(Live.get('setBet' + Live.bet.getRoomId()));
                }
                //if (check)Live.bet.check();
            },
            disable: function () {
                Live.bet.cancel(false);
                Live.bet.cancelCheck();
                $(document).ready(function () {

                    Live.bet.quiz_toggle_btn.removeClass('on');
                    $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').removeClass('hide');
                    $('#quiz-control-panel .section-title').children('.description').remove();
                    if (Live.bet.quiz_helper != undefined)
                        Live.bet.quiz_helper.addClass('hide');
                    Live.set('autoMode' + Live.bet.getRoomId(), 0);
                })
            },
            check: function () {
                var status = Live.bet.checkBetStatus();
                if (Live.bet.checkInterval == undefined)
                    Live.set('checkInterval' + Live.bet.getRoomId(), setInterval(Live.bet.checkBetStatus, 3000));
                if (status) return true;
            },
            cancelCheck: function () {
                clearInterval(Live.get('checkInterval' + Live.bet.getRoomId()));
            }
        }

        /*toggle btn*/
        Live.bet.quiz_toggle_btn = $('<a class="bet_toggle">自动下注</a>');
        $('#quiz-control-panel .section-title').append(Live.bet.quiz_toggle_btn);


        Live.bet.quiz_toggle_btn.click(function () {
            if ($(this).hasClass('on')) {
                Live.bet.disable();
            } else {
                if (Live.bet.check()) Live.set('autoMode' + Live.bet.getRoomId(), 1);
                Live.bet.init();
            }
        });
        setInterval(Live.doSign.sign, 300000); //doSign per 5 min
        if (Live.get('autoMode' + Live.bet.getRoomId()) == 1)
            Live.bet.check();

        Live.bet.init();
        Notification.requestPermission();
    }
})();