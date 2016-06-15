/**
 * Created by Ruo on 4/12/2016.
 */
(function () {
    if (location.hostname == 'live.bilibili.com') {
        d           = document.createElement('script');
        d.innerHTML = 'if (window.localStorage) {if(!window.localStorage.helper_live_roomId){window.localStorage.helper_live_roomId=JSON.stringify({});}var l = JSON.parse(window.localStorage.helper_live_roomId);l[ROOMURL] = ROOMID;window.localStorage.helper_live_roomId=JSON.stringify(l);if(!window.localStorage.helper_live_rnd){window.localStorage.helper_live_rnd=JSON.stringify({});}var r = JSON.parse(window.localStorage.helper_live_rnd);r[ROOMURL] = DANMU_RND;window.localStorage.helper_live_rnd=JSON.stringify(r);}';
        document.body.appendChild(d);

        var Live = {};

        Live.set = function (n, k, v) {
            if (!window.localStorage || !n) return;
            var storage = window.localStorage;
            if (!storage[n])storage[n] = JSON.stringify({});
            var l = JSON.parse(storage[n]);
            if (v == undefined) {
                storage[n] = typeof k == 'string' ? k.trim() : JSON.stringify(k);
            } else {
                l[k]       = typeof v == 'string' ? v.trim() : JSON.stringify(v);
                storage[n] = JSON.stringify(l);
            }
        };

        Live.get = function (n, k, v) {
            if (!window.localStorage || !n) return;

            if (!window.localStorage[n]) {
                window.localStorage[n] = JSON.stringify(v || {});
                return eval(v);
            }
            var l = JSON.parse(window.localStorage[n]);
            if (!k) return l;
            if (l[k] == 'true' || l[k] == 'false')l[k] = eval(l[k]);
            return l[k];
        };

        Live.del = function (n, k) {
            if (!window.localStorage || n == undefined || window.localStorage[n] == undefined) return;
            if (k == undefined) {
                window.localStorage.removeItem(n);
                return;
            }
            var l = JSON.parse(window.localStorage[n]);
            delete l[k];
            window.localStorage[n] = JSON.stringify(l);
        };

        Live.getUser = function () {
            return $.getJSON("/user/getuserinfo").promise();
        };

        Live.initUserInfo = function (callback) {
            return Live.getUser().done(function (user) {
                if (user.code == 'REPONSE_OK') {
                    user = user.data;
                    Live.set('helper_userInfo', 'username', user.uname);
                    Live.set('helper_userInfo', 'userLevel', user.user_level);
                    Live.set('helper_userInfo', 'silver', user.silver);
                    Live.set('helper_userInfo', 'gold', user.gold);
                    Live.set('helper_userInfo', 'face', user.face);
                    Live.set('helper_userInfo', 'vip', user.vip);
                    Live.set('helper_userInfo', 'login', true);
                    if (callback && typeof callback == 'function')callback(user);
                    return true;
                } else if (user.code == -101)Live.del('helper_userInfo');
            });

        };

        Live.clearLocalStorage = function () {
            Live.del('helper_live_bet', Live.getRoomId());
            Live.del('helper_live_check', Live.getRoomId());
            Live.del('helper_live_number', Live.getRoomId());
            Live.del('helper_live_rate', Live.getRoomId());
            Live.del('helper_live_which', Live.getRoomId());
            Live.del('helper_doSign_today', Live.getRoomId());
            Live.del('helper_doSign_date', Live.getRoomId());
            Live.del('helper_userInfo', Live.getRoomId());
        };

        Live.getRoomId = function () {
            return Live.get('helper_live_roomId', location.pathname.substr(1));
        };

        Live.getRoomInfo = function () {
            return $.getJSON("/live/getInfo?roomid=" + Live.getRoomId()).promise();
        };

        Live.numFormat = function (num) {
            var number = num;
            if (num >= 10000) number = (num / 10000).toFixed(1) + '万';
            return number;
        };

        Live.rgb2hex = function (rgb) {
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

        Live.getDomType = function (t) {
            var e = Object.prototype.toString.call(t), n = /HTML.*.Element/;
            return "[object Object]" === e && t.jquery ? "jQuery Object" : "[object Object]" === e ? "Object" : "[object Number]" === e ? "Number" : "[object String]" === e ? "String" : "[object Array]" === e ? "Array" : "[object Boolean]" === e ? "Boolean" : "[object Function]" === e ? "Function" : "[object Null]" === e ? "null" : "[object Undefined]" === e ? "undefined" : e.match(n) ? "HTML Element" : "[object HTMLCollection]" === e ? "HTML Elements Collection" : null
        };

        Live.randomEmoji = {
            list       : {
                happy   : ["(｀･ω･´)", "=‿=✧", "●ω●", "(/ ▽ \\)", "(=・ω・=)", "(●'◡'●)ﾉ♥", "<(▰˘◡˘▰)>", "(⁄ ⁄•⁄ω⁄•⁄ ⁄)", "(ง,,• ᴗ •,,)ง ✧"],
                shock   : [",,Ծ‸Ծ,,", "(｀･д･´)", "Σ( ° △ °|||)︴", "┌( ಠ_ಠ)┘", "(ﾟДﾟ≡ﾟдﾟ)!?"],
                sad     : ["∑(っ °Д °;)っ", "＞︿＜", "＞△＜", "●︿●", "(´；ω；`)"],
                helpless: ["◐▽◑", "ʅ（´◔౪◔）ʃ", "_(:3 」∠)_", "_(┐「ε:)_", "(/・ω・＼)", "(°▽°)ﾉ"]
            },
            happy      : function () {
                return Live.randomEmoji.list.happy[Math.floor(Math.random() * Live.randomEmoji.list.happy.length)]
            }, sad     : function () {
                return Live.randomEmoji.list.sad[Math.floor(Math.random() * Live.randomEmoji.list.sad.length)]
            }, shock   : function () {
                return Live.randomEmoji.list.shock[Math.floor(Math.random() * Live.randomEmoji.list.shock.length)]
            }, helpless: function () {
                return Live.randomEmoji.list.helpless[Math.floor(Math.random() * Live.randomEmoji.list.helpless.length)]
            }
        };

        Live.sendMsg = function (dom, type, msg) {
            if (n = type || "info", "success" !== n && "caution" !== n && "error" !== n && "info" !== n) return;
            var c = document.createDocumentFragment();
            var u = document.createElement("div");
            u.innerHTML = "<i class='toast-icon info'></i><span class='toast-text'>" + msg + Live.randomEmoji.helpless() + "</span>", u.className = "live-toast " + n;
            var d = null;
            switch (Live.getDomType(dom)) {
                case"HTML Element":
                    d = dom;
                    break;
                case"jQuery Object":
                    d = dom[0];
                    break;
                default:
                    throw new Error(a.consoleText.error + "在使用 Live Toast 时请传入正确的原生 Dom 对象或节点的 jQuery 对象.")
            }
            function o(t) {
                var e = t.offsetLeft;
                return null !== t.offsetParent ? e += o(t.offsetParent) : void 0, e
            }

            function i(t) {
                var e = t.offsetTop;
                return null !== t.offsetParent ? e += i(t.offsetParent) : void 0, e
            }

            var f = {width: $(d).width(), height: $(d).height()}, p = o(d), m = i(d);
            $(u).css({left: p + f.width});
            var v = 0;
            v = document.body.scrollTop, $(u).css({top: m + f.height}), setTimeout(function () {
                $(u).addClass("out"), setTimeout(function () {
                    $(u).remove(), c = u = d = f = p = m = v = null
                }, 400)
            }, 2e3), c.appendChild(u), document.body.appendChild(c);
            var h = $(window).width(), g = u.offsetWidth, y = u.offsetLeft;
            0 > h - g - y && $(u).css({left: h - g - 10}), h = g = y = null
        };

        Live.doSign = {
            getSignInfo: function () {
                return $.getJSON("/sign/GetSignInfo").promise();
            },
            init       : function () {
                Live.doSign.getSignInfo().done(function (data) {
                    if (data.code == 0 && data.data.status == 0) {
                        Live.doSign.sign();
                        setInterval(Live.doSign.sign, 60000);//doSign per 1 min
                    } else if (data.code == 0 && data.data.status == 1) {
                        var username = Live.get('helper_userInfo', 'username');
                        Live.set('helper_doSign_today', username, true);
                        Live.set('helper_doSign_date', username, new Date().getDate());
                    }
                });
            },
            sign       : function () {
                /*check login*/
                var date     = new Date().getDate();
                var username = Live.get('helper_userInfo', 'username');
                if (!Live.get('helper_doSign_today', username) || Live.get('helper_doSign_date', username) != date) {
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
                            Live.set('helper_doSign_today', username, true);
                            Live.set('helper_doSign_date', username, date);
                            setTimeout(function () {
                                msg.close();
                            }, 1000);
                            var spans = $('.body-container').find('.room-left-sidebar .sign-and-mission .sign-up-btn .dp-inline-block span');
                            $(spans[0]).hide(), $(spans[1]).show();
                        } else if (e.code == -500) {
                            msg = new Notification(eval("'" + e.msg + "'"), {
                                body: "不能重复签到",
                                icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                            });
                            Live.set('helper_doSign_today', username, true);
                            Live.set('helper_doSign_date', username, date);
                            setTimeout(function () {
                                msg.close();
                            }, 5000);
                        } else {
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

        Live.Queue = function (which) {
            var o         = {};
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
                $('#quiz_helper').find(o.which + '-box *').addClass('hide');
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
                            o.wait.unshift(a);
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

        Live.Appoint = function (which, rate, number, state) {
            //var queueStr = {'0': 'cancel', '1': 'success', '2': 'error', '3': 'wait', '4': 'run'};
            var o    = {};
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
                    o.dom          = $('<div>').addClass('count').addClass(o.state).attr({
                        id    : o.id,
                        rate  : rate,
                        number: o.number
                    }).append(number_dom, rate_dom, $('<a>').addClass('close'), o.menu);
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
                                if (b.msg == '手慢了,剩余可购数量不足！') {
                                }
                                else o.error(b);
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
                console.log(o.id + ':' + data.msg);
                /*deal style class*/
                o.dom.removeClass('cancel wait run success');
                if (!o.dom.hasClass('error')) o.dom.addClass('error').attr('title', data.msg);
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

        Live.bet = {
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
                    Live.bet.quiz_panel    = $('#quiz-control-panel');
                    Live.bet.quiz_helper   = $('<div id="quiz_helper"></div>');
                    Live.bet.quiz_rate     = $('<input type="range" class="rate" min="0" max="9.9" step="0.1" />').val(1);
                    Live.bet.quiz_rate_n   = $('<span class="rate_n">1</span>');
                    Live.bet.quiz_number   = $('<input class="number" type="text" placeholder="数额" min="1" maxlength="8" required="required" />');
                    Live.bet.quiz_msg      = $('<span class="msg"></span>');
                    Live.bet.quiz_btns     = $('<div class="bet-buy-btns p-relative clear-float"></div>');
                    Live.bet.quiz_blue_btn = $('<button class="bet-buy-btn blue float-left" data-target="a" data-type="silver">填坑</button>');
                    Live.bet.quiz_red_btn  = $('<button class="bet-buy-btn pink float-right" data-target="b" data-type="silver">填坑</button>');
                    Live.bet.description   = $('<a class="description" title="自动下注功能会根据您填写的赔率及下注数额和实时的赔率及可购买量进行不停的比对，一旦满足条件则自动买入\n当实时赔率大于等于目标赔率且有购买量时自动买入"><i class="help-icon"></i></a>');
                    Live.bet.quiz_btns.append(Live.bet.quiz_blue_btn, Live.bet.quiz_red_btn);

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
                        $('<div class="quiz_helper">').append($('<span class="rate_title">').text('赔率'), Live.bet.quiz_rate, Live.bet.quiz_rate_n),
                        $('<div class="quiz_helper">').append($('<span class="number_title">').text('数额'), Live.bet.quiz_number, Live.bet.quiz_msg),
                        Live.bet.quiz_btns
                    );

                    Live.bet.quiz_panel.append(Live.bet.quiz_helper);

                    /*add listener*/
                    $('#quiz_helper').find('.bet-buy-btns button').click(function () {
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
                }
                Live.bet.hasInit = true;
                Live.bet.show();
            },
            getBet          : function () {
                return $.post('http://live.bilibili.com/bet/getRoomBet', {roomid: Live.getRoomId()}, function () {
                }, 'json').promise();
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
                        $('.bet-buy-ctnr.dp-none').find('.bet-buy-btns').removeClass('hide');
                        $('#quiz-control-panel').find('.section-title .description').remove();
                    }
                    Live.bet.hide_quiz_helper();
                }
            },
            show            : function () {
                if (Live.bet.hasInit) {
                    $('.bet-buy-ctnr.dp-none').find('.bet-buy-btns').addClass('hide');
                    $('#quiz-control-panel').find('.section-title').append(Live.bet.description);
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
                Live.del('helper_live_check', Live.getRoomId());
            }
        };

        Live.currentRoom = [];

        Live.treasure = {
            vote           : undefined,
            minute         : undefined,
            silver         : undefined,
            totalTimes     : 3,
            correctStr     : {'g': 9, 'z': 2, '_': 4, 'Z': 2, 'o': 0, 'l': 1, 'B': 8, 'O': 0, 'S': 6, 's': 6, 'i':1, 'I':1},
            init           : function () {
                chrome.extension.sendMessage({
                    command: "getTreasure"
                }, function (response) {
                    $('#head-info-panel').append($('<div class="room-info treasure-info">自动领瓜子功能正在初始化</div>'));
                    if (response['data'].finish != undefined && response['data'].finish == true) {
                        $('#head-info-panel').find('.treasure-info').append('今天的瓜子已经领完');
                        return;
                    }
                    if (response['data'].roomId == undefined) {
                        Live.treasure.canvas        = document.createElement('canvas');
                        Live.treasure.canvas.width  = 120;
                        Live.treasure.canvas.height = 40;
                        document.body.appendChild(Live.treasure.canvas);
                        Live.treasure.context              = Live.treasure.canvas.getContext('2d');
                        Live.treasure.context.font         = '40px agencyfbbold';
                        Live.treasure.context.textBaseline = 'top';
                        if (!window.OCRAD) {
                            var d = document.createElement('script');
                            d.src = 'http://s.0w0.be/bsc/ocrad.js';
                            document.body.appendChild(d);
                        }
                        Live.treasure.totalTime = (Live.get('helper_userInfo', 'vip') == 1) ? 3 : 5;
                        Live.treasure.checkTask();
                        $(window).on('beforeunload', function () {
                            chrome.extension.sendMessage({
                                command: "delTreasure"
                            });
                            console.log(0);
                        });
                    } else if (Live.get('noTreasure', Live.get('helper_userInfo', 'username'))) {
                        $('#head-info-panel').find('.treasure-info').html('今天的瓜子已经领完');
                    } else if (response['data'].roomId != Live.getRoomId()) {
                        $('#head-info-panel').find('.treasure-info').html('已在<a target="_blank" href="' + response['data'].url + '">' + response['data'].upName + '</a>的直播间自动领瓜子');
                        $('#player-container').find('.treasure').hide();
                    } else if (response['data'].roomId == Live.getRoomId()) {
                        $('#head-info-panel').find('.treasure-info').html('本直播间页面已经被打开过');
                        $('#player-container').find('.treasure').hide();
                    }
                });
            },
            correctQuestion: function (question) {
                var q = '', question = question.trim();
                for (var i in question) {
                    var a = Live.treasure.correctStr[question[i]];
                    q += (a != undefined ? a : question[i]);
                }
                return q;
            },
            getCurrentTask : function () {
                return $.post('http://live.bilibili.com/FreeSilver/getCurrentTask', {r: Math.random}, function () {
                }, 'json').promise();
            },
            checkTask      : function () {
                Live.treasure.getCurrentTask().done(function (data) {
                    if (data.code == -101) {
                        clearInterval(Live.treasure.interval);
                        $('#head-info-panel').find('.treasure-info').html('没有登录');
                    } else if (data.code == -10017) {//领完
                        clearInterval(Live.treasure.interval);
                        if (!Live.get('noTreasure', Live.get('helper_userInfo', 'username'))) {
                            var msg = new Notification("今天所有的宝箱已经领完!", {
                                body: "",
                                icon: "//static.hdslb.com/live-static/images/7.png"
                            });
                            setTimeout(function () {
                                msg.close();
                            }, 5000);
                        }
                        Live.set('noTreasure', Live.get('helper_userInfo', 'username'), true);
                        $('#head-info-panel').find('.treasure-info').html('今天的瓜子已经领完');
                    } else if (data.code == 0) {
                        if (!data.data.silver) {
                            clearInterval(Live.treasure.interval);
                        } else {
                            if (Live.treasure.vote == undefined)
                                Live.getRoomInfo().done(function (data) {
                                    chrome.extension.sendMessage({
                                        command: "setTreasure",
                                        data   : {
                                            uid        : data.data.UID,
                                            roomId     : data.data.ROOMID,
                                            roomShortId: location.pathname.substr(1),
                                            roomTitle  : data.data.ROOMTITLE,
                                            upName     : data.data.ANCHOR_NICK_NAME,
                                            url        : location.href
                                        }
                                    });
                                    $('#head-info-panel').find('.treasure-info').html('已开始在本直播间自动领瓜子');
                                    var msg = new Notification("自动领瓜子功能已经启动", {
                                        body: data.data.ANCHOR_NICK_NAME + '：' + data.data.ROOMTITLE,
                                        icon: "//static.hdslb.com/live-static/images/7.png"
                                    });
                                    Live.set('noTreasure', Live.get('helper_userInfo', 'username'), false);
                                    setTimeout(function () {
                                        msg.close();
                                    }, 5000);
                                });
                            if (Live.treasure.vote != data.data.vote && Live.treasure.vote != undefined) {
                                var msg = new Notification("自动领取成功", {
                                    body: "领取了" + Live.treasure.silver + "个瓜子",
                                    icon: "//static.hdslb.com/live-static/images/7.png"
                                });
                                setTimeout(function () {
                                    msg.close();
                                }, 5000);
                                if (Live.get('silverSum', Live.get('helper_userInfo', 'username'))) {
                                    Live.set('silverSum', Live.get('silverSum', Live.get('helper_userInfo', 'username')) + Live.treasure.silver);
                                }
                            }
                            Live.treasure.vote     = data.data.vote;
                            Live.treasure.times    = data.data.times;
                            Live.treasure.minute   = data.data.minute;
                            Live.treasure.silver   = data.data.silver;
                            Live.treasure.interval = setInterval(Live.treasure.do, 3000);
                        }
                    }
                });
            },
            do             : function () {
                if ($('.treasure-count-down').text() == '00:00') {
                    $(".treasure-box").off('click').on('click', function () {
                        var img = document.getElementById('captchaImg');
                        if (img && img.onload == undefined)
                            img.onload = function () {
                                clearInterval(Live.treasure.interval);
                                Live.treasure.interval = undefined;
                                Live.treasure.context.clearRect(0, 0, Live.treasure.canvas.width, Live.treasure.canvas.height);
                                Live.treasure.context.drawImage(img, 0, 0);
                                Live.treasure.question = Live.treasure.correctQuestion(OCRAD(Live.treasure.context.getImageData(0, 0, 120, 40)));
                                Live.treasure.answer   = eval(Live.treasure.question);
                                $('#freeSilverCaptchaInput').val(Live.treasure.answer);
                                $("#getFreeSilverAward").click();
                                Live.treasure.checkTask();
                            };
                    }).click();
                } else if ($('.treasure-box-panel').css('display') != 'none') {
                    $(".acknowledge-btn").click();
                }
            }
        };

        Live.chat = {
            maxLength : 20,
            text      : '',
            colorValue: {'white': '0xffffff', 'red': '0xff6868', 'blue': '0x66ccff', 'blue-2': '0x006098', 'cyan': '0x00fffc', 'green': '0x7eff00', 'yellow': '0xffed4f', 'orange': '0xff9800'},
            giftHideStyle:'#chat-msg-list .gift-msg{display:none;}',
            init      : function () {
                var init_interval = setInterval(function () {
                    if ($('#danmu-textbox').attr('maxlength')) {
                        clearInterval(init_interval);

                        var chat_ctrl_panel = $('#chat-ctrl-panel');
                        Live.chat.counter = chat_ctrl_panel.find('.danmu-length-count');
                        //init & hide original ui
                        var original_emoji_btn = chat_ctrl_panel.find('.chat-ctrl-btns .btns .emoji');
                        var helper_emoji_btn   = original_emoji_btn.clone().addClass('helper_emoji');
                        original_emoji_btn.before(helper_emoji_btn).remove();

                        var original_emoji_list = chat_ctrl_panel.find('.ctrl-panels .emoji-panel');
                        var helper_emoji_list   = original_emoji_list.clone().addClass('helper_emoji_list');
                        original_emoji_list.before(helper_emoji_list);

                        var original_text_area = chat_ctrl_panel.find('.danmu-sender #danmu-textbox');
                        Live.chat.maxLength    = original_text_area.attr('maxlength');
                        var helper_text_area   = original_text_area.clone().addClass('helper_text_area').removeAttr('maxlength');
                        original_text_area.before(helper_text_area).hide();

                        var original_send_btn = chat_ctrl_panel.find('.danmu-sender #danmu-send-btn');
                        var helper_send_btn   = original_send_btn.clone().addClass('helper_send_btn');
                        original_send_btn.before(helper_send_btn).hide();

                        Live.chat.maxLength = parseInt(Live.get('helper_userInfo', 'userLevel'))>=20?30:20;

                        Live.chat.counter.text('0 / 1 + 0');

                        //init event
                        helper_emoji_btn.on('click', function () {
                            if (helper_emoji_list.css('display') == 'none') {
                                helper_emoji_list.show();
                                function n(t) {
                                    var e = t && (t.target || t.srcElement);
                                    e && e.className.indexOf("emoji-panel") > -1 || $(".emoji-panel").fadeOut(200, function () {
                                        $(window).off("click", n);
                                    })
                                }

                                setTimeout(function () {
                                    $(window).on("click", n)
                                }, 1);
                            }
                        });
                        helper_send_btn.on('click', function (e) {
                            e.preventDefault();
                            if (helper_text_area.val() != '') {
                                Live.chat.text = helper_text_area.val();
                                helper_text_area.val('');
                                Live.chat.do();
                            } else Live.sendMsg(helper_send_btn, 'info', '请输入弹幕后再发送~');
                        });
                        helper_text_area.on('keydown', function (e) {
                            var text = helper_text_area.val().trim();
                            if (e.keyCode === 13 && text == '') {
                                e.preventDefault();
                                Live.sendMsg(helper_send_btn, 'info', '请输入弹幕后再发送~');
                                helper_text_area.val('');
                                return false;
                            }else if (e.keyCode === 13 && text != '') {
                                e.preventDefault();
                                helper_text_area.val(text.substr(0,text.length));
                                helper_send_btn.click();
                                return false;
                            }
                            Live.chat.updateTextInfo(text);
                        });
                        helper_text_area.on('keyup',function(){
                            var text = helper_text_area.val().trim();
                            var part = parseInt(text.length / Live.chat.maxLength);
                            Live.chat.updateTextInfo(text);
                        });
                        helper_emoji_list.on('click', 'a', function () {
                            var text = helper_text_area.val().trim();
                            helper_text_area.val(text + $(this).text());
                            helper_text_area.focus();
                            Live.chat.updateTextInfo(helper_text_area.val().trim());
                        });

                        //init has finished
                        chat_ctrl_panel.find('.help_chat_shade').hide('middle');
                    }
                }, 350);

            },
            do        : function () {
                if (Live.chat.text.length > 0) {
                    var colorStr = $('.color-select-panel').find('a.active').attr('class').split(' ')[1];
                    $("#player_object")[0].sendMsg(Live.chat.text.substr(0, Live.chat.maxLength), Live.chat.colorValue[colorStr]);
                    Live.chat.text = Live.chat.text.substr(Live.chat.maxLength);
                    if (Live.chat.text.length > 0)setTimeout(function () {
                        Live.chat.do();
                    }, 4000);
                }
            },
            initGiftDisplay:function(state){
                if(state=="on"){
                    var l = $('document').find('#giftDisplay');
                    if(l.length)l.remove();
                    var styleElement = document.createElement("style");
                    styleElement.setAttribute("id", 'giftDisplay');
                    styleElement.setAttribute("type", "text/css");
                    styleElement.appendChild(document.createTextNode(Live.chat.giftHideStyle));
                    if (document.head) {
                        document.head.appendChild(styleElement);
                    } else {
                        document.documentElement.appendChild(styleElement);
                    }
                }else{
                    var l = $('document').find('#giftDisplay');
                    if(l.length)l.remove();
                }
            },
            updateTextInfo:function(text){
                var part = parseInt(text.length / Live.chat.maxLength);
                var rest = part>0?text.length%Live.chat.maxLength:0;
                // part_t = part>0?(rest == 0?part:part+1):1;
                Live.chat.counter.text(text.length + ' / ' + (part==0?1:part)+' + '+rest);
            }
        };

        Live.notise = {
            init: function () {
                var upInfo = {};
                Live.getRoomInfo().done(function (data) {
                    upInfo.uid        = data.data.UID;
                    upInfo.roomId     = data.data.ROOMID;
                    upInfo.roomShortI = location.pathname.substr(1);
                    upInfo.roomTitle  = data.data.ROOMTITLE;
                    upInfo.upName     = data.data.ANCHOR_NICK_NAME;
                    upInfo.url        = location.href;
                    var notiseBtn     = $('<div>').addClass('mid-part').append('<i class="live-icon-small favourite p-relative" style="top: 1px"></i><span>特别关注</span>').click(function () {
                        if ($(this).find('i').hasClass('favourited')) {
                            chrome.extension.sendMessage({
                                command: "setNotFavourite",
                                id     : upInfo.roomId
                            }, function (response) {
                                if (response.data) {
                                    notiseBtn.find('span').html('特别关注');
                                    notiseBtn.find('i').removeClass('favourited');
                                }
                            });
                        } else {
                            chrome.extension.sendMessage({
                                command: "setFavourite",
                                upInfo : upInfo
                            }, function (response) {
                                if (response.data)notiseBtn.find('span').html('已特别关注')
                                notiseBtn.find('i').addClass('favourited');
                            });
                        }
                    });
                    chrome.extension.sendMessage({
                        command: "getFavourite"
                    }, function (response) {
                        if (response.data.indexOf(Live.getRoomId()) != -1) {
                            notiseBtn.find('span').html('已特别关注');
                            notiseBtn.find('i').addClass('favourited');
                        }
                    });
                    $('.attend-button').find('.left-part').after(notiseBtn);
                });
            }
        };

        Live.init = function () {
            chrome.extension.sendMessage({
                command: "getOption",
                key    : 'version',
            }, function (response) {
                Live.version = response.value;
                $('#gift-panel').find('.control-panel').prepend("<div class=\"ctrl-item version\">哔哩哔哩助手 v" + Live.version + " by <a href=\"http://weibo.com/guguke\" target=\"_blank\">@啾咕咕www</a> <a href=\"http://weibo.com/ruo0037\" target=\"_blank\">@沒事卖萌肉</a></div>");
            });

            Live.set('helper_userInfo', 'login', false);
            Live.clearLocalStorage();
            Live.initUserInfo(function () {
                if (Live.get('helper_userInfo', 'login')) {
                    Live.bet.quiz_toggle_btn = $('<a class="bet_toggle">自动下注</a>');
                    $('#quiz-control-panel').find('.section-title').append(Live.bet.quiz_toggle_btn);
                    Live.bet.quiz_toggle_btn.click(function () {
                        if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1)Live.bet.disable();
                        else Live.bet.able();
                    });
                    if (Live.get('helper_live_autoMode', Live.getRoomId()) == 1) Live.bet.check();

                    chrome.extension.sendMessage({
                        command: "getOption",
                        key    : 'doSign',
                    }, function (response) {
                        if (response['value'] == 'on') Live.doSign.init();
                    });

                    if (location.pathname.substr(1) && !isNaN(location.pathname.substr(1))) {
                        chrome.extension.sendMessage({
                            command: "getOption",
                            key    : 'autoTreasure',
                        }, function (response) {
                            if (response['value'] == 'on') setTimeout(Live.treasure.init, 2000);
                        });
                        chrome.extension.sendMessage({
                            command: "getOption",
                            key    : 'danmu',
                        }, function (response) {
                            if (response['value'] == 'on') {
                                $('#chat-ctrl-panel').append($('<div class="room-silent-merge dp-none p-absolute p-zero help_chat_shade" style="display:block;"><p><span class="hint-text"></span>弹幕增强功能正在初始化</p></div>'));
                                setTimeout(Live.chat.init, 2000);
                            }
                        });
                        chrome.extension.sendMessage({
                            command: "getOption",
                            key    : 'giftDisplay',
                        }, function (response) {
                            if (response['value'] == 'on') {
                                Live.chat.initGiftDisplay(response['value']);
                            }
                        });
                        Live.notise.init();
                    }
                    Notification.requestPermission();
                }
            });

        };
        Live.init();
    }
})();
//$('#chat-msg-list').on('DOMSubtreeModified',function(e){
//    var dom = $(this);
//    console.log(dom)
//    //var name = dom.find('.user-name').text();
//    //var msg = dom.find('.msg-content').text();
//    //console.log(name,msg);
//})