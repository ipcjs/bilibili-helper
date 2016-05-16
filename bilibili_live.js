/**
 * Created by Ruo on 4/12/2016.
 */
(function () {
    if (location.hostname == 'live.bilibili.com') {
        d           = document.createElement('script');
        d.innerHTML = 'if (window.localStorage) {if(!window.localStorage.helper_live_roomId){window.localStorage.helper_live_roomId=JSON.stringify({});}var l = JSON.parse(window.localStorage.helper_live_roomId);l[' + location.pathname.substr(1) + '] = ROOMID;window.localStorage.helper_live_roomId=JSON.stringify(l);var r = JSON.parse(window.localStorage.helper_live_rnd);l[' + location.pathname.substr(1) + '] = DANMU_RND;window.localStorage.helper_live_rnd=JSON.stringify(r);}';
        document.body.appendChild(d);


        var Live               = {};
        Live.set               = function (n, k, v) {
            if (!window.localStorage || !n) return;

            if (!window.localStorage[n])window.localStorage[n] = JSON.stringify({});
            var l = JSON.parse(window.localStorage[n]);
            if (!k) window.localStorage[n] = JSON.stringify(v);
            else {
                l[k]                   = JSON.stringify(v);
                window.localStorage[n] = JSON.stringify(l);
            }
        };
        Live.get               = function (n, k) {
            if (!window.localStorage || !n) return;

            if (!window.localStorage[n]) {
                window.localStorage[n] = JSON.stringify({});
                return null;
            }
            var l = JSON.parse(window.localStorage[n]);
            if (!k) return l;
            return l[k];
        };
        Live.del               = function (n, k) {
            if (!window.localStorage || !n || !k) return;

            if (!window.localStorage[n]) {
                window.localStorage[n] = JSON.stringify({});
                return;
            }
            var l = JSON.parse(window.localStorage[n]);
            delete l[k];
            window.localStorage[n] = JSON.stringify(l);
        };
        Live.getUser           = function () {
            return $.ajax({
                url     : 'http://live.bilibili.com/user/getuserinfo',
                type    : 'GET',
                dataType: 'json'
            }).promise();
        };
        Live.initUserInfo      = function () {
            var pro = Live.getUser();
            return pro.done(function (user) {
                if (user.code == 'REPONSE_OK') {
                    user = user.data;
                    Live.set('helper_userInfo', 'username', user.uname);
                    Live.set('helper_userInfo', 'userLevel', user.user_level);
                    Live.set('helper_userInfo', 'silver', user.silver);
                    Live.set('helper_userInfo', 'gold', user.gold);
                    Live.set('helper_userInfo', 'face', user.face);
                    Live.set('helper_userInfo', 'vip', user.vip);
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
        Live.getRoomId         = function () {
            return Live.get('helper_live_roomId', location.pathname.substr(1));
        };
        Live.numFormat         = function (num) {
            var number = num;
            if (num >= 10000) number = (num / 10000).toFixed(1) + '万';
            return number;
        };
        Live.rgb2hex           = function (rgb) {
            function zero_fill_hex(num, digits) {
                var s = num.toString(16);
                while (s.length < digits)
                    s = "0" + s;
                return s;
            }

            if (rgb.charAt(0) == '#') return rgb;

            var ds      = rgb.split(/\D+/);
            var decimal = Number(ds[1]) * 65536 + Number(ds[2]) * 256 + Number(ds[3]);
            return "#" + zero_fill_hex(decimal, 6);
        };

        Live.doSign   = {
            sign: function () {
                /*check login*/
                if (!Live.get('helper_userInfo', 'login')) return;

                var date = new Date().getDate();
                if (Live.get('helper_doSign', 'today') == false || Live.get('helper_doSign', 'signDate') != date) {
                    $.get("/sign/doSign", function (data) {
                        var e = JSON.parse(data), msg = undefined;
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
                            //noinspection JSDuplicatedDeclaration
                            msg = new Notification("签到成功", {
                                body: "您获得了" + e.data.text,
                                icon: "//static.hdslb.com/live-static/images/7.png"
                            });
                            Live.set('helper_doSign', 'today', true);
                            Live.set('helper_doSign', 'signDate', date);
                            setTimeout(function () {
                                msg.close();
                            }, 1000);
                        } else if (e.code == -500) {
                            msg = new Notification(eval("'" + e.msg + "'"), {
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
                            msg = new Notification(eval("'" + e.msg + "'"), {
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
        Live.Queue    = function (which) {
            if (arguments.length < 1) return false;
            var o         = new Object();
            o.id          = new Date().getTime();
            o.which       = which;
            o.total       = 0;
            o.run         = [];
            o.wait        = [];
            o.error       = [];
            o.success     = [];
            o.cancel      = [];
            o.add         = function (appoint, state) {
                state = state == undefined ? 'wait' : state;
                o[state].push(appoint);
            };
            o.empty       = function () {
                $('#quiz_helper .' + o.which + '-box').children().addClass('hide');
                o.run     = [];
                o.wait    = [];
                o.error   = [];
                o.cancel  = [];
                o.success = [];
            };
            o.remove      = function (appoint) {
                var index = o[appoint.state].indexOf(appoint);
                if (index != -1) {
                    o[appoint.state].splice(index, 1);
                    appoint.destory();
                }
            };
            o.pushQueue   = function (appoint, state) {
                if (appoint.state != state) {
                    state = state == undefined ? 'wait' : state;
                    o.remove(appoint);
                    if (state != 'run') {
                        if (state == 'success') {
                            o.total += appoint.number;
                            //o.updateTotal();
                        }
                        appoint.state = state;
                        o.add(appoint, state);
                        appoint.create_dom().updateMenu();
                    } else {
                        appoint.state = 'run';
                        if (o.run.length > 0) {
                            var a = o.run.shift();
                            a.wait().updateMenu();
                            o.wait = [a].concat(o.wait);
                        }
                        o.run.push(appoint);
                        appoint.create_dom(true).updateMenu();
                    }
                }
            };
            o.updateTotal = function () {
                Live.bet[o.which + '_sum_number'].text(o.total);
            };
            return o;
        };
        Live.Appoint  = function (which, rate, number, state) {
            if (arguments.length < 3) return false;
            //var queueStr = {'0': 'cancel', '1': 'success', '2': 'error', '3': 'wait', '4': 'run'};
            var o    = new Object();
            o.id     = new Date().getTime();
            o.which  = which;
            o.rate   = rate;
            o.number = number;
            /*0:cancel,1:success,2:error,3:wait,4:run*/
            o.state      = state == undefined ? 'wait' : state;
            o.emit       = function (which, state) {
                /*set state*/
                o.state = state == undefined ? o.state : state;
                o.create_dom();

                /*emit*/
                Live.bet[which + '_box'].append(o.dom);
                Live.bet[which + '_queue'].pushQueue(o);
                Live.bet.checkQueue();
                return o;
            };
            o.create_dom = function (top) {
                if (o.dom == undefined) {
                    var rate_dom   = $('<span>').addClass('rate').text(rate);
                    var number_dom = $('<h4>').addClass('number').text(Live.numFormat(o.number));
                    o.menu         = $('<div>').addClass('menu');

                    var count_dom = $('<div>').addClass('count').addClass(o.state).attr({
                        id    : o.id,
                        rate  : rate,
                        number: o.number
                    }).append(number_dom, rate_dom, $('<a>').addClass('close'), o.menu);
                    o.dom         = count_dom;
                    o.updateMenu();
                    var success_dom = Live.bet[which + '_box'].children('.success:last');
                    if (top) {
                        if (success_dom.length != 0) {
                            success_dom.after(o.dom);
                        } else Live.bet[which + '_box'].prepend(o.dom);
                    } else Live.bet[which + '_box'].append(o.dom);
                }
                return o;
            };
            o.updateMenu = function () {
                o.menu.empty();
                o.menu_delete = $('<span class="delete"></span>').off('click').click(function () {
                    Live.bet[o.which + '_queue'].remove(o);
                });
                o.menu_reset  = $('<span class="reset"></span>').off('click').click(function () {
                    Live.bet[o.which + '_queue'].pushQueue(o, 'wait');
                });
                o.menu_run    = $('<span class="run"></span>').off('click').click(function () {
                    Live.bet[o.which + '_queue'].pushQueue(o, 'run');
                });
                if (o.state == 'run' || o.state == 'success' || o.state == 'error' || o.state == 'cancel') {
                    o.menu.append(o.menu_reset, o.menu_delete);
                } else if (o.state == 'wait') {
                    o.menu.append(o.menu_run, o.menu_delete);
                }
                return o;
            };
            o.run        = function (bet) {
                if (!bet) return false;
                o.state = 'run';
                /*deal style class*/
                o.dom.removeClass('cancel wait error success');
                if (!o.dom.hasClass('run')) o.dom.addClass('run');

                /*get data*/
                var w        = (o.which == 'blue') ? 'a' : 'b';
                var bankerId = bet.silver[w].id;
                var rate     = bet.silver[w].times;
                //var amount = bet.silver[w].amount;
                //Live.bet.quiz_msg.text(amount);
                /*be canceled*/
                if (Live.bet.stop) clearInterval(Live.get('helper_live_bet', Live.getRoomId()));
                if (rate >= o.rate) {
                    $.ajax({
                        url     : 'http://live.bilibili.com/bet/addBettor',
                        type    : 'POST',
                        dataType: 'json',
                        data    : {
                            bankerId: bankerId,
                            amount  : o.number,
                            token   : __GetCookie('LIVE_LOGIN_DATA')
                        },
                        complete: function (data) {
                            var b = JSON.parse(data.responseText);
                            if (b.code == -400) {//error
                                o.error(b);
                            } else if (b.msg == 'ok') {//success
                                o.success();

                            }
                        }
                    });
                }
                return o;
            };
            o.error      = function (data) {
                if (!data) return false;
                o.state = 'error';
                console.log(data.msg);
                /*deal style class*/
                o.dom.removeClass('cancel wait run success');
                if (!o.dom.hasClass('error')) o.dom.addClass('error');
                Live.bet[o.which + '_queue'].pushQueue(Live.bet[o.which + '_queue'].run.shift(), 'error');
                return o;
            };
            o.success    = function () {
                o.updateMenu();
                /*deal style class*/
                o.dom.removeClass('cancel wait error run');
                if (!o.dom.hasClass('success')) o.dom.addClass('success');
                Live.bet[o.which + '_queue'].pushQueue(Live.bet[o.which + '_queue'].run.shift(), 'success');
                return o;
            };
            o.wait       = function () {
                o.state = 'wait';
                /*deal style class*/
                o.dom.removeClass('cancel success error run');
                if (!o.dom.hasClass('wait')) o.dom.addClass('wait');
                return o;
            };
            o.cancel     = function () {
                o.state = 'cancel';
                /*deal style class*/
                o.dom.removeClass('wait success error run');
                if (!o.dom.hasClass('cancel')) o.dom.addClass('cancel');
                Live.bet[o.which + '_queue'].pushQueue(Live.bet[o.which + '_queue'].run.shift(), 'cancel');
                return o;
            };
            o.destory    = function () {
                o.dom.remove();
                o.dom = undefined;
            };
            o.dealWith   = function (data) {
                switch (o.state) {
                    case 'cancel':
                        o.cancel();
                        break;
                    case 'success':
                        o.success();
                        break;
                    case 'error':
                        o.error(data);
                        break;
                    case 'wait':
                        o.wait();
                        break;
                    case 'run':
                        o.run(data);
                        break;
                }
            };
            return o;
        };
        Live.bet      = {
            times           : 0,
            stop            : false,
            hasInit         : false,
            hasShow         : false,
            blue_queue      : new Live.Queue('blue'),
            red_queue       : new Live.Queue('red'),
            checkBetStatus  : function (callback) {
                /*check bet*/
                Live.bet.getBet().done(function (bet) {
                    bet = bet.data;
                    if (!Live.get('helper_userInfo', 'login') && bet.betStatus == false) {
                        Live.bet.cancelCheck();
                        return;
                    }
                    /*none bet permission or bet is not on*/
                    if (!Live.bet.canBet(bet) || !Live.bet.betOn(bet)) {
                        Live.bet.stopBet();
                        return;
                    }
                    if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1) {
                        if (Live.bet.hasInit && !Live.bet.hasShow) Live.bet.show();
                        else if (!Live.bet.hasInit) Live.bet.init();
                    }
                    if (typeof callback == 'function') callback();
                });
            },
            canBet          : function (bet) {
                if (bet.isBet == false) {
                    if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1) {
                        Live.bet.disable();
                        Live.set('helper_live_autoMode', Live.getRoomId(), 0);
                    }
                    return false;
                } else return true;
            },
            betOn           : function (bet) {
                if (bet.betStatus == false) {
                    if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1) {
                        Live.bet.hide();
                        Live.bet.blue_queue.empty();
                        Live.bet.red_queue.empty();
                    }
                    return false;
                } else return true;
            },
            checkQueue      : function () {
                Live.bet.cancelCheck();
                if (Live.bet.stop) Live.bet.stopBet();
                /*check wait queue*/
                /*wait queue is not empty*/
                if (Live.bet.blue_queue.wait.length != 0 || Live.bet.red_queue.wait.length != 0) {
                    /*check run queue*/
                    if (Live.bet.blue_queue.run.length == 0 && Live.bet.blue_queue.wait.length != 0) {
                        Live.bet.blue_queue.pushQueue(Live.bet.blue_queue.wait.shift(), 'run');
                    }
                    if (Live.bet.red_queue.run.length == 0 && Live.bet.red_queue.wait.length != 0) {
                        Live.bet.red_queue.pushQueue(Live.bet.red_queue.wait.shift(), 'run');
                    }
                }
                if (Live.bet.blue_queue.wait.length == 0 && Live.bet.red_queue.wait.length == 0 && Live.bet.blue_queue.run.length == 0 && Live.bet.red_queue.run.length == 0) {
                    Live.bet.stopBet();
                    Live.bet.check();
                }
                /*if run queue is not empty*/
                else if (!Live.get('helper_live_bet', Live.getRoomId())) {
                    Live.bet.do();
                    Live.set('helper_live_bet', Live.getRoomId(), setInterval(Live.bet.do, 2000));
                }
            },
            hide_quiz_helper: function () {
                Live.bet.hasShow            = false;
                Live.bet.quiz_helper_height = Live.bet.quiz_helper.height();
                Live.bet.quiz_helper.animate({"height": "0px"});
            },
            show_quiz_helper: function () {
                Live.bet.hasShow = true;
                if (Live.bet.quiz_helper_height == undefined)Live.bet.quiz_helper_height = 'auto';
                Live.bet.quiz_helper.animate({height: Live.bet.quiz_helper_height}, function () {
                    Live.bet.quiz_helper.css('height', 'auto');
                });
            },
            init            : function () {
                /*check login*/
                if (!Live.get('helper_userInfo', 'login')) return;

                /*auto mode*/
                if (!parseInt(Live.get('helper_live_autoMode', Live.getRoomId()))) return;

                /*create quiz helper DOM*/
                if (!Live.bet.hasInit) {
                    Live.bet.quiz_panel  = $('#quiz-control-panel');
                    Live.bet.quiz_helper = $('<div id="quiz_helper"></div>');
                    //var quiz_helper_title = $('<h4 class="section-title"><span style="font-size: 13px;margin:30px 0 10px;display: block;">下注预约</span></h4>');
                    Live.bet.quiz_rate   = $('<input type="range" class="rate" min="0" max="9.9" step="0.1" />').val(1);
                    Live.bet.quiz_rate_n = $('<span class="rate_n">1</span>');
                    Live.bet.quiz_number = $('<input class="number" type="text" placeholder="数额" min="1" maxlength="8" required="required" />');
                    Live.bet.quiz_msg    = $('<span class="msg"></span>');
                    Live.bet.quiz_btns   = $('<div class="bet-buy-btns p-relative clear-float"></div>');
                    //Live.bet.quiz_cancel_btn = $('<button class="cancel hide" title="点击取消预约下注">取消下注</button>');
                    //Live.bet.quiz_success_btn = $('<button class="success hide">下注成功 - 点击继续下注</button>');
                    Live.bet.quiz_blue_btn = $('<button class="bet-buy-btn blue float-left" data-target="a" data-type="silver">填坑</button>');
                    Live.bet.quiz_red_btn  = $('<button class="bet-buy-btn pink float-right" data-target="b" data-type="silver">填坑</button>');
                    Live.bet.description   = $('<a class="description" title="自动下注功能会根据您填写的赔率及下注数额和实时的赔率及可购买量进行不停的比对，一旦满足条件则自动买入\n当实时赔率大于等于目标赔率且有购买量时自动买入"><i class="help-icon"></i></a>');
                    Live.bet.quiz_btns.append(Live.bet.quiz_blue_btn, Live.bet.quiz_red_btn);
                    Live.bet.version = $("<div class=\"version\">哔哩哔哩助手 " + chrome.runtime.getManifest().version + " by <a href=\"http://weibo.com/guguke\" target=\"_blank\">@啾咕咕www</a></div>");


                    /*count panel*/
                    Live.bet.count_panel = $('<div>').addClass('quiz-panel');
                    Live.bet.blue_box    = $('<div>').addClass('blue-box');
                    Live.bet.red_box     = $('<div>').addClass('red-box');

                    Live.bet.sum_box         = $('<div>').addClass('sum-sbox');
                    Live.bet.blue_sum_number = $('<div>').addClass('blue-sum-number');
                    Live.bet.blue_sum_income = $('<div>').addClass('blue-sum-income');
                    Live.bet.red_sum_number  = $('<div>').addClass('red-sum-number');
                    Live.bet.red_sum_income  = $('<div>').addClass('red-sum-income');
                    Live.bet.blue_sum_box    = $('<div>').addClass('blue-sum-sbox');
                    Live.bet.red_sum_box     = $('<div>').addClass('red-sum-box');

                    Live.bet.blue_sum_box.append(Live.bet.blue_sum_number, Live.bet.blue_sum_income);
                    Live.bet.red_sum_box.append(Live.bet.red_sum_number, Live.bet.red_sum_income);
                    Live.bet.sum_box.append(
                        Live.bet.blue_sum_box,
                        Live.bet.red_sum_box
                    );

                    Live.bet.count_panel.append(
                        Live.bet.blue_box,
                        Live.bet.red_box
                    );

                    Live.bet.quiz_helper.append(
                        Live.bet.count_panel,
                        Live.bet.sum_box,
                        //Live.bet.quiz_success_btn,
                        //Live.bet.quiz_cancel_btn,
                        $('<div class="quiz_helper">').append($('<span class="rate_title">').text('赔率'), Live.bet.quiz_rate, Live.bet.quiz_rate_n),
                        $('<div class="quiz_helper">').append($('<span class="number_title">').text('数额'), Live.bet.quiz_number, Live.bet.quiz_msg),
                        Live.bet.quiz_btns
                    );


                    Live.bet.quiz_panel.append(Live.bet.quiz_helper, Live.bet.version);


                    /*add listener*/
                    $('#quiz_helper .bet-buy-btns button').click(function () {
                        var which = $(this).attr('data-target');
                        /*rate*/
                        var rate = parseFloat(Live.bet.quiz_rate.val());
                        if (rate.length > 3) rate = rate.toFixed(1);
                        Live.set('helper_live_rate', Live.getRoomId(), rate);

                        /*number*/
                        var number = parseInt(Live.bet.quiz_number.val());

                        /*Style*/
                        if (Live.bet.quiz_rate.val() == '') {
                            Live.bet.quiz_rate.addClass('error');
                            return;
                        } else Live.bet.quiz_rate.removeClass('error');
                        if (Live.bet.quiz_number.val() == '') {
                            Live.bet.quiz_number.addClass('error');
                            return;
                        } else Live.bet.quiz_number.removeClass('error');
                        Live.bet.quiz_msg.text('');
                        if (Live.bet.quiz_number.val() < 1) {
                            Live.bet.quiz_number.addClass('error');
                            Live.bet.quiz_msg.text('下注数量不可小于1');
                            return;
                        }

                        Live.set('helper_live_number', Live.getRoomId(), number);

                        Live.set('helper_live_which', Live.getRoomId(), which);

                        //Live.bet.quiz_cancel_btn.text('返' + rate + ' 买' + (which == 'a' ? '蓝 ' : '红 ') + number + '注');
                        which = which == 'a' ? 'blue' : 'red';
                        new Live.Appoint(which, rate, number).emit(which);
                    });
                    Live.bet.quiz_number.focus(function () {
                        Live.initUserInfo();
                    });
                    Live.bet.quiz_number.keyup(function () {
                        var v      = $(this).val();
                        var silver = parseInt(Live.get('helper_userInfo', 'silver'));
                        while (v != '' && isNaN(v)) {
                            $(this).val(v.substr(0, v.length - 1));
                            v = $(this).val();
                        }
                        if (parseInt(v) > silver) {
                            $(this).val(silver);
                        }
                    });
                    Live.bet.quiz_rate.on('input change', function () {
                        Live.bet.quiz_rate_n.text($(this).val());
                    });
                    //Live.bet.quiz_cancel_btn.click(function () {
                    //    Live.bet.cancel(true);
                    //});
                    //Live.bet.quiz_success_btn.click(function () {
                    //    Live.bet.cancel(true);
                    //});
                }
                Live.bet.hasInit = true;
                Live.bet.show();
            },
            getBet          : function () {
                var roomId = Live.getRoomId();
                return $.ajax({
                    url     : 'http://live.bilibili.com/bet/getRoomBet',
                    type    : 'POST',
                    dataType: 'json',
                    //async: false,
                    data    : {roomid: roomId}
                }).promise();
            },
            do              : function () {
                Live.bet.getBet().done(function (bet) {
                    bet = bet.data;
                    /*no bet permission or bet is not on*/
                    if (!Live.bet.canBet(bet) || !Live.bet.betOn(bet)) {
                        Live.bet.stopBet();
                        Live.bet.cancel(true);
                        return;
                    }

                    /*deal with run queue*/
                    var blue = Live.bet.blue_queue.run[0];
                    var red  = Live.bet.red_queue.run[0];
                    if (blue)blue.dealWith(bet);
                    if (red) red.dealWith(bet);
                    Live.bet.checkQueue();
                });
            },
            success         : function () {
                if (Live.bet.hasInit) {
                }
                Live.clearLocalStorage();
                Live.bet.check();
            },
            error           : function (msg) {
                if (Live.bet.hasInit) {
                    //Live.bet.quiz_success_btn.addClass('hide');
                    //Live.bet.quiz_cancel_btn.removeClass('hide').text(msg);
                }
                Live.clearLocalStorage();
            },
            cancel          : function (check) {
                if (Live.bet.hasInit) {
                    Live.bet.quiz_helper.children('input,div').removeClass('hide');
                    Live.clearLocalStorage();
                }
                if (check)Live.bet.check();
            },
            hide            : function (all) {
                if (Live.bet.hasInit) {
                    if (all) {
                        Live.bet.quiz_toggle_btn.removeClass('on');
                        $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').removeClass('hide');
                        $('#quiz-control-panel .section-title').children('.description').remove();
                    }
                    Live.bet.hide_quiz_helper();
                }
            },
            show            : function () {
                if (Live.bet.hasInit) {
                    $('.bet-buy-ctnr.dp-none').children('.bet-buy-btns').addClass('hide');
                    $('#quiz-control-panel .section-title').append(Live.bet.description);
                    Live.bet.quiz_toggle_btn.addClass('on');
                    Live.bet.show_quiz_helper();
                }
            },
            stopBet         : function () {
                clearInterval(Live.get('helper_live_bet', Live.getRoomId()));
                Live.del('helper_live_bet', Live.getRoomId());
            },
            able            : function () {
                Live.bet.stop = false;
                Live.set('helper_live_autoMode', Live.getRoomId(), 1);
                if (Live.bet.hasInit) Live.bet.show();
                Live.bet.check();
            },
            disable         : function () {
                if (Live.bet.hasInit) {
                    Live.bet.stopBet();
                    Live.bet.cancelCheck();
                    Live.bet.cancel(false);
                    Live.bet.hide(true);
                    Live.set('helper_live_autoMode', Live.getRoomId(), 0);
                    Live.clearLocalStorage();
                    Live.bet.blue_queue.empty();
                    Live.bet.red_queue.empty();
                }
            },
            check           : function () {
                if (!Live.get('helper_live_check', Live.getRoomId())) {
                    Live.bet.checkBetStatus();
                    Live.set('helper_live_check', Live.getRoomId(), setInterval(Live.bet.checkBetStatus, 3000));
                }
            },
            cancelCheck     : function () {
                clearInterval(Live.get('helper_live_check', Live.getRoomId()));
                Live.set('helper_live_check', Live.getRoomId(), undefined);
            }
        };
        Live.treasure = {
            vote          : -1,
            minute        : 0,
            silver        : 0,
            totalTimes    : 3,
            init          : function () {
                Live.treasure.canvas        = document.createElement('canvas');
                Live.treasure.canvas.width  = 120;
                Live.treasure.canvas.height = 40;
                document.body.appendChild(Live.treasure.canvas);
                Live.treasure.context              = Live.treasure.canvas.getContext('2d');
                Live.treasure.context.font         = '40px agencyfbbold'; // 字体
                Live.treasure.context.textBaseline = 'top';
                if (!window.OCRAD) {
                    var d = document.createElement('script');
                    d.src = 'http://s.0w0.be/bsc/ocrad.js';
                    document.body.appendChild(d);
                }
                $('.treasure-box').click(function () {
                    if ($('.treasure-count-down').text() != '00:00') {
                        $('.acknowledge-btn').click();
                    }
                });
                Live.treasure.totalTime = (Live.get('helper_userInfo', 'vip') == 1) ? 3 : 5;
            },
            getCurrentTask: function () {
                return $.ajax({
                    url     : 'http://live.bilibili.com/FreeSilver/getCurrentTask',
                    type    : 'POST',
                    dataType: 'json',
                    data    : {r: Math.random}
                }).promise();
            },
            do            : function () {
                if (Live.treasure.vote == 0 && Live.treasure.times == Live.treasure.totalTime) {
                    clearInterval(Live.treasure.interval);
                    return;
                }
                if (Live.treasure.vote == -1) {
                    var currentTask = Live.treasure.getCurrentTask();
                    currentTask.done(function (data) {
                        if (data.code == ' -10017') {
                            clearInterval(Live.treasure.interval);
                            return;
                        }
                        Live.treasure.vote   = data.data.vote;
                        Live.treasure.times  = data.data.times;
                        Live.treasure.minute = data.data.minute;
                        Live.treasure.silver = data.data.silver;
                    });
                }
                var res = false;
                if ($('.treasure-count-down').text() == '00:00') {
                    clearInterval(Live.treasure.interval);
                    $('.treasure-box').click();
                    $('.acknowledge-btn').click();
                    var img    = document.getElementById('captchaImg');
                    img.onload = function () {
                        Live.treasure.context.clearRect(0, 0, Live.treasure.canvas.width, Live.treasure.canvas.height);
                        Live.treasure.context.drawImage(img, 0, 0);
                        var q = OCRAD(Live.treasure.context.getImageData(0, 0, 120, 40));
                        q     = q.replace(/[Zz]/g, "2").replace(/[Oo]/g, "0").replace(/g/g, "9").replace(/[lI]/g, "1").replace(/[Ss]/g, "5").replace(/_/g, "4").replace(/B/g, "8").replace(/b/g, "6");
                        res   = eval(q);
                        $('#freeSilverCaptchaInput').val(res);
                        $("#getFreeSilverAward").click();
                        var c = Live.treasure.getCurrentTask();
                        c.done(function (data) {
                            if (Live.treasure.minute != data.data.minute) {
                                Live.treasure.interval = setInterval(Live.treasure.do, 1000);
                            }
                        });
                        console.log(q, res);
                    };
                }
                return res;
            }
        };
        Live.chat     = {
            maxLength: undefined,
            text     : '',
            init     : function () {
                $('#danmu-textbox').focus(function () {
                    if (!Live.chat.maxLength)
                        Live.chat.maxLength = $(this).attr('maxlength');
                    $(this).removeAttr('maxlength');
                });
                $('#danmu-textbox').focus();
                $('.danmu-sender').append($('<button id="helper-send-btn" class="danmu-send-btn float-right live-btn default" style="position:absolute;" role="button" aria-label="点击发送弹幕">发送</button>'))
                $('#helper-send-btn').click(function (e) {
                    e.preventDefault();
                    Live.chat.text = $('#danmu-textbox').val();
                    $('#danmu-textbox').val('');
                    if (Live.chat.text.length > 0) {
                        Live.chat.send(Live.chat.text.substr(0, Live.chat.maxLength));
                        Live.chat.text = Live.chat.text.substr(Live.chat.maxLength);
                        if (Live.chat.text.length > 0) Live.chat.check();
                    }
                });
            },
            check    : function () {
                setTimeout(function () {
                    Live.chat.send(Live.chat.text.substr(0, Live.chat.maxLength));
                    Live.chat.text = Live.chat.text.substr(Live.chat.maxLength);
                    if (Live.chat.text != '')Live.chat.check();
                }, 500);
            },
            send     : function (danmu) {
                var color = Live.rgb2hex($('.color-select-panel .active').css('color'));
                $("#player_object")[0].sendMsg(danmu, '0x' + color.substr(1));
            }
        };

        Live.set('helper_userInfo', 'login', false);
        Live.clearLocalStorage();
        Live.initUserInfo();
        if (Live.get('helper_userInfo', 'login')) {
            Live.bet.quiz_toggle_btn = $('<a class="bet_toggle">自动下注</a>');
            $('#quiz-control-panel .section-title').append(Live.bet.quiz_toggle_btn);
            Live.bet.quiz_toggle_btn.click(function () {
                if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1)Live.bet.disable();
                else Live.bet.able();
            });
            chrome.extension.sendMessage({
                command: "getOption",
                key    : 'doSign',
            }, function (response) {
                if (response['value'] == 'on') setInterval(Live.doSign.sign, 300000); //doSign per 5 min
            });
            if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1) Live.bet.check();

            Live.treasure.init();
            Live.treasure.interval = setInterval(Live.treasure.do, 1000);
            Live.chat.init();
            Notification.requestPermission();
        }
    }
})();