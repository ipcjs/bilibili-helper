// ==UserScript==
// @name         episode evaluation
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  give evaluation to episode
// @author       xdy
// @include       /http:\/\/(bgm\.tv|bangumi\.tv|chii\.in)/ep/\d+$
// @grant        none
// ==/UserScript==

function addCSS(cssText) {

    var style = document.createElement('style'), //创建一个style元素
        head = document.head || document.getElementsByTagName('head')[0]; //获取head元素
    style.type = 'text/css'; //这里必须显示设置style元素的type属性为text/css，否则在ie中不起作用

    if (style.styleSheet) { //IE
        var func = function () {
            try { //防止IE中stylesheet数量超过限制而发生错误

                style.styleSheet.cssText = cssText;

            } catch (e) {

            }
        };
        //如果当前styleSheet还不能用，则放到异步中则行
        if (style.styleSheet.disabled) {

            setTimeout(func, 10);
        } else {
            func();
        }
    } else { //w3c
        //w3c浏览器中只要创建文本节点插入到style元素中就行了
        var textNode = document.createTextNode(cssText);

        style.appendChild(textNode);

    }

    head.appendChild(style); //把创建的style元素插入到head中
}

mycss = '.inputButton {background-color: #F09199;color: #fff; cursor: pointer;font-family: lucida grande,tahoma,verdana,arial,sans-serif;font-size: 11px;padding: 1px 3px;text-decoration: none;}' +
    '.forum_category{background-color:#F09199;color:#fff;font-weight:700;padding:3px;}' +
    '.vote_container{background-color:#e1e7f5}' +
    '.forum_boardrow1{background-color:#fff;border-color:#ebebeb;border-style:solid;border-width:0;padding:6px 4px;vertical-align:top}';

(function () {
    var islogin = !$("div").is(".guest");
    if (islogin) {
        var url = location.pathname;
        url = url.split('/');
        var ep_id = url[2];
        var info = $('div.idBadgerNeue a.avatar').attr('href');
        info = info.split('/');
        var user_id = info[4];
        var name = $('div#headerSubject a').html();
        var ep = $('div#columnEpA h2.title').html();
        ep = ep.split(' ')[0];
        //var myurl = "http://127.0.0.1:8000/bgm/";
        var myurl = "http://39.106.26.175:8000/bgm/";
        addCSS(mycss);
        $.ajax({
            url: myurl + "user_ep",
            jsonp: "callback",
            dataType: "jsonp",
            data: {
                ep_id: ep_id,
                user_id: user_id,
            },
            success: function (ret) {

                if (!ret.res) {
                    var html = '<div id="poll_container" style="width:670px">' +
                        '<div class="forum_category">' + name + ' ' + ep + '观感</div>' +
                        '<div class="forum_boardrow1" style="border-width: 0 1px 1px 1px;">' +
                        '<div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="5"> 5/5 超棒！</label></div>' +
                        '<div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="4"> 4/5 不错</label></div>' +
                        '<div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="3"> 3/5 一般</label></div>' +
                        '<div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="2"> 2/5 不喜欢</label></div>' +
                        '<div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="1"> 1/5 厌恶</label></div>' +
                        '<br><input type="submit" name="voteButton" value="投票" class="inputButton" id="voteButton"></div></div>';
                    $("#columnEpA").find("[class='epDesc']").append(html);
                    var button = document.getElementById('voteButton');
                    button.onclick = function () {
                        var val = $('input:radio:checked').val();
                        if (val == undefined) {
                            alert("请选择后再投票！");
                            return;
                        }
                        $.ajax({
                            url: myurl + "addVote",
                            jsonp: "callback",
                            dataType: "jsonp",
                            data: {
                                ep_id: ep_id,
                                user_id: user_id,
                                rate: val
                            },
                            success: function (ret) {
                                if (ret.success) {
                                    info = getInfo(ret);
                                    $('div#poll_container').html(info);
                                    // 发送一条推广评论
                                    var score = +ret.choice - 3; // S1样式的评分
                                    $('textarea#content').val((score >= 0 ? '+' : '') + score + '  [url=http://bangumi.tv/group/topic/345087]--来自Bangumi单集评分脚本[/url]');
                                    $('#new_comment #ReplyForm').submit();
                                }
                                else {
                                    alert(ret.message);
                                }
                            }
                        });
                    };
                }

                else {
                    var html = '<div id="poll_container" style="width:670px">' + getInfo(ret) + '</div>';
                    $("#columnEpA").find("[class='epDesc']").append(html);
                }
                ;
            }
        });

    }
})();

function getInfo(ret) {
    var judge_str = ['5/5 很棒！', '4/5 不错', '3/5 一般', '2/5 不喜欢', '1/5 厌恶'];
    var html = '<div class="forum_category">投票结果</div><div class="forum_boardrow1" style="border-width: 0 1px 1px 1px;">' +
        '<table border="0" width="100%" cellpadding="" cellspacing="5">';
    for (var i = 0; i < 5; i++) {
        html = html + '<tr><td align="left">' + judge_str[i];
        if (ret.choice == 5 - i) {
            html += '<small>(your vote)</small>';
        }
        html = html + '</td><td width="35%"><div class="vote_container" style="width: ' + ret.width[i] + '%">&nbsp;</div></td><td width="25" align="center">';
        html = html + ret.count[i] + '</td><td width="40" align="right">' + ret.width[i] + '%</td></tr>';
    }
    html = html + '</table><div style="text-align: center;">Voters: ' + ret.voters + '</div></div>';
    return html;
}

