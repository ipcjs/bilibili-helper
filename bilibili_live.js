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
            if(window.localStorage.live==undefined)window.localStorage.live=JSON.stringify({})
            var l = JSON.parse(window.localStorage.live);
            l[k] = JSON.stringify(v);
            window.localStorage.live = JSON.stringify(l);
        };
        Live.get = function (k) {
            if (!window.localStorage) return;
            if(window.localStorage.live==undefined)window.localStorage.live=JSON.stringify({})
            var l = JSON.parse(window.localStorage.live);
            return l[k];
        };
        Live.del = function (k) {
            if (!window.localStorage) return;
            if(window.localStorage.live==undefined)window.localStorage.live=JSON.stringify({})
            var l = JSON.parse(window.localStorage.live);
            delete l[k];
            window.localStorage.live = JSON.stringify(l);
        };
        Live.getUser = function () {
            var user = $.ajax({
                url: 'http://live.bilibili.com/user/getuserinfo',
                type: 'GET',
                dataType: 'json',
                async: false
            }).responseText;
            user = JSON.parse(user);

            if (user.code == 'REPONSE_OK')return user.data;
            else return false;
        };
        Live.initUserInfo = function () {
            var user = Live.getUser();
            if (user == false) {
                //Live.bet.error('未登录');
                return false;
            } else {
                Live.set('username', user.uname);
                Live.set('userLevel', user.user_level);
                Live.set('silver', user.silver);
                Live.set('gold', user.gold);
                Live.set('face', user.face);
                Live.set('login', true);

                return true;
            }
        };
        Live.getRoomId = function () {
            return window.localStorage['live' + location.pathname.substr(1)];
        }
        Live.set('checkInterval' + Live.getRoomId(), undefined);
        Live.set('setBet' + Live.getRoomId(), undefined);
        Live.set('login', false);
        Live.initUserInfo();


        Live.doSign = {
            sign: function () {
                /*check login*/
                if (!Live.get('login')) return;

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
                        else {
                            var msg = new Notification(eval("'" + e.msg + "'"), {
                                body: "",
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
            checkBetStatus: function () {
                /*check login*/
                var bet = Live.bet.getBet();
                if (!Live.get('login') && bet.betStatus == false) {
                    Live.bet.cancelCheck();
                    return;
                }

                if (bet.isBet == false) {
                    if (Live.get('autoMode' + Live.getRoomId()) == 1) {
                        Live.bet.disable();
                        Live.set('autoMode' + Live.getRoomId(), 0);
                    }
                    return false;
                }//none bet permission
                if (bet.betStatus == false) {
                    if (Live.get('autoMode' + Live.getRoomId()) == 1) {
                        Live.bet.hide();
                        Live.set('autoMode' + Live.getRoomId(), 0);
                    }
                    return false;
                }//bet is not on
                return true;
            },
            init: function () {
                /*check login*/
                if (!Live.get('login')) return;

                /*auto mode*/
                if (!parseInt(Live.get('autoMode' + Live.getRoomId()))) return;

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
                $('#quiz_helper .bet-buy-btns button').unbind('click').click(function () {
                    var which = $(this).attr('data-target');

                    /*rate*/
                    var rate = parseFloat(Live.bet.quiz_rate.val());
                    if (rate.length > 3) rate = rate.toFixed(1);
                    Live.set('rate' + Live.getRoomId(), rate)

                    /*number*/
                    var number = parseFloat(Live.bet.quiz_number.val());
                    Live.set('number' + Live.getRoomId(), number)

                    Live.set('which' + Live.getRoomId(), which)

                    Live.bet.quiz_cancel_btn.text('返' + rate + ' 买' + (which == 'a' ? '蓝 ' : '红 ') + number + '注');

                    Live.bet.startInterval();
                });
                Live.bet.quiz_number.focus(function () {
                    Live.initUserInfo();
                });
                Live.bet.quiz_number.keyup(function () {
                    var v = $(this).val();
                    var silver = Live.get('silver');
                    if (v != '' && isNaN(v)) {
                        $(this).val(v.substr(0, v.length - 1));
                        return;
                    }
                    if (v > silver)
                        $(this).val(silver);
                })
                Live.bet.quiz_rate.keyup(function () {
                    var v = $(this).val();
                    if (v != '' && isNaN(v)) {
                        $(this).val(v.substr(0, v.length - 1));
                        return;
                    }
                });
                Live.bet.quiz_cancel_btn.click(function () {
                    Live.bet.cancel(true);
                });
                Live.bet.quiz_success_btn.click(function () {
                    Live.bet.cancel(true);
                });
            },
            getBet: function () {
                var roomId = Live.getRoomId();
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
                var w = Live.get('which' + Live.getRoomId()) == '"a"' ? 'a' : 'b';
                var bankerId = bet.silver[w].id;
                var rate = bet.silver[w].times;
                if (Live.bet.stop) clearInterval(Live.get('setBet' + Live.getRoomId()));
                if (rate >= Live.get('rate' + Live.getRoomId())) {
                    var number = Live.get('number' + Live.getRoomId());
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
                Live.bet.stop = false;

                /*Style*/
                Live.bet.quiz_helper.children('input,div').addClass('hide');
                Live.bet.quiz_cancel_btn.removeClass('hide');
                Live.bet.quiz_success_btn.addClass('hide');

                if (Live.bet.quiz_rate.val() == '') {
                    Live.bet.quiz_rate.addClass('error');
                    return;
                } else Live.bet.quiz_rate.removeClass('error');
                if (Live.bet.quiz_number.val() == '') {
                    Live.bet.quiz_number.addClass('error');
                    return;
                } else Live.bet.quiz_number.removeClass('error');

                /*bet number > user's silver*/
                var userSilver = Live.get('silver' + Live.getRoomId());
                if (Live.bet.quiz_number.val() > userSilver)
                    Live.set('number' + Live.getRoomId(), userSilver);


                /*Action*/
                Live.bet.do();
                Live.set('setBet' + Live.getRoomId(),setInterval(Live.bet.do, 2000));

            },
            success: function () {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_cancel_btn.addClass('hide');
                    Live.bet.quiz_success_btn.removeClass('hide');
                }
                clearInterval(Live.get('setBet' + Live.getRoomId()));
                Live.set('setBet' + Live.getRoomId(), undefined);
            },
            error: function (msg) {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_cancel_btn.removeClass('hide');
                    Live.bet.quiz_success_btn.addClass('hide');
                    Live.bet.quiz_cancel_btn.text(msg);
                }
                clearInterval(Live.get('setBet' + Live.getRoomId()));
                Live.set('setBet' + Live.getRoomId(), undefined);
            },
            cancel: function (check) {
                Live.bet.stop = true;
                if (Live.bet.quiz_helper != undefined) {
                    Live.bet.quiz_helper.children('input,div').removeClass('hide');
                    Live.bet.quiz_cancel_btn.addClass('hide');
                    Live.bet.quiz_success_btn.addClass('hide');
                    clearInterval(Live.get('setBet' + Live.getRoomId()));
                    Live.set('setBet' + Live.getRoomId(), undefined);
                }
                if (check)Live.bet.check();
            },
            hide: function () {
                Live.bet.quiz_toggle_btn.removeClass('on');
                $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').removeClass('hide');
                $('#quiz-control-panel .section-title').children('.description').remove();
                if (Live.bet.quiz_helper != undefined)
                    Live.bet.quiz_helper.addClass('hide');
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
                    Live.set('autoMode' + Live.getRoomId(), 0);
                })
            },
            check: function () {
                var status = Live.bet.checkBetStatus();
                if (Live.get('checkInterval' + Live.getRoomId()) == undefined)
                    Live.set('checkInterval' + Live.getRoomId(), setInterval(Live.bet.checkBetStatus, 3000));
                if (status) return true;
            },
            cancelCheck: function () {
                clearInterval(Live.get('checkInterval' + Live.getRoomId()));
                Live.set('checkInterval' + Live.getRoomId(), undefined);
            }
        }

        /*toggle btn*/
        if (Live.get('login')) {
            Live.bet.quiz_toggle_btn = $('<a class="bet_toggle">自动下注</a>');
            $('#quiz-control-panel .section-title').append(Live.bet.quiz_toggle_btn);
            Live.bet.quiz_toggle_btn.click(function () {
                if ($(this).hasClass('on')) {
                    Live.bet.disable();
                } else if (Live.bet.check()) {
                    Live.set('autoMode' + Live.getRoomId(), 1);
                    Live.bet.init();
                }
            });
            setInterval(Live.doSign.sign, 300000); //doSign per 5 min
            if (Live.get('autoMode' + Live.getRoomId()) == 1)
                Live.bet.check();

            Live.bet.init();
            Notification.requestPermission();
        }


    }
})();