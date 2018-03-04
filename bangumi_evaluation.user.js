// ==UserScript==
// @name         Bangumi Evaluation
// @namespace    https://github.com/ipcjs/
// @version      1.0.0
// @description  Bangumi Evaluation
// @author       ipcjs
// @include      *://bgm.tv/ep/*
// @include      *://bangumi.tv/ep/*
// @include      *://chii.in/ep/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

'use strict'

// type, props, children
// type, props, innerHTML
// 'text', text
const util_ui_element_creator = (type, props, children) => {
    let elem = null;
    if (type === "text") {
        return document.createTextNode(props);
    } else {
        elem = document.createElement(type);
    }
    for (let n in props) {
        if (n === "style") {
            for (let x in props.style) {
                elem.style[x] = props.style[x];
            }
        } else if (n === "className") {
            elem.className = props[n];
        } else if (n === "event") {
            for (let x in props.event) {
                elem.addEventListener(x, props.event[x]);
            }
        } else {
            elem.setAttribute(n, props[n]);
        }
    }
    if (children) {
        if (typeof children === 'string') {
            elem.innerHTML = children;
        } else {
            for (let i = 0; i < children.length; i++) {
                if (children[i] != null)
                    elem.appendChild(children[i]);
            }
        }
    }
    return elem;
}
const _ = util_ui_element_creator

const addStyle = (css) => {
    document.head.appendChild(_('style', {}, [_('text', css)]))
}
const ajax = (...args) => new Promise((resolve, reject) => $(...args).done(resolve).fail(reject))

// language=CSS
addStyle(`
    .inputButton {
        background-color: #F09199;
        color: #fff;
        cursor: pointer;
        font-family: lucida grande, tahoma, verdana, arial, sans-serif;
        font-size: 11px;
        padding: 1px 3px;
        text-decoration: none;
    }

    .forum_category {
        background-color: #F09199;
        color: #fff;
        font-weight: 700;
        padding: 3px;
    }

    .vote_container {
        background-color: #e1e7f5
    }

    .forum_boardrow1 {
        background-color: #fff;
        border-color: #ebebeb;
        border-style: solid;
        border-width: 0;
        padding: 6px 4px;
        vertical-align: top
    }
`)
const is_login = !document.querySelector('div.guest')
const getUserId = () => {
    const $avatar = document.querySelector('div.idBadgerNeue a.avatar')
    return $avatar && $avatar.href.split('/')[4] || ''
}


if (is_login) {
    const ep_id = location.pathname.split('/')[2]
    const user_id = getUserId()
    const name = document.querySelector('div#headerSubject a').innerText
    const ep = document.querySelector('div#columnEpA h2.title').innerText.split(' ')[0]
    const myurl = "http://39.106.26.175:8000/bgm/";
    $.ajax({
        url: myurl + "user_ep",
        jsonp: "callback",
        dataType: "jsonp",
        data: {
            ep_id: ep_id,
            user_id: user_id,
        },
        success: function (ret) {
            const $poll_container = _('div', { id: 'poll_container', style: { width: '670px' } })
            document.querySelector('#columnEpA .epDesc').appendChild($poll_container)
            if (!ret.res) {
                $poll_container.innerHTML = createInfo(name, ep)
                $poll_container.querySelector('#voteButton').onclick = () => {
                    const $checked = $poll_container.querySelector('.forum_boardrow1 input[type=radio]:checked')
                    const val = $checked ? $checked.value : undefined
                    if (val === undefined) {
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
                                let score = ret.choice - 3
                                $poll_container.innerHTML = getInfo(ret.count, score)
                                vote_to_bgm(score)
                            } else {
                                alert(ret.message);
                            }
                        }
                    });
                }
            } else {
                $poll_container.innerHTML = getInfo(ret.count, ret.choice - 3)
            }
        }
    });

}
const vote_to_bgm = (score, comment) => new Promise((resolve, reject) => {
    // 发送一条推广评论
    let needMask = localStorage.beuj_need_mask || false
    let needSuffix = localStorage.beuj_need_suffix || true
    comment = (comment || '').trim()

    let text = ''
    let scoreText = `${score >= 0 ? '+' : ''}${score} `
    text += needMask ? `[mask]${scoreText}[/mask]` : scoreText
    comment && (text += '\n' + comment)
    needSuffix && (text += '\n[url=http://bangumi.tv/group/topic/345087]--来自Bangumi评分脚本・改[/url]')

    document.querySelector('textarea#content').value = text
    document.querySelector('#new_comment #ReplyForm [type=submit]').click()
    resolve('ok')
})


function createInfo(name, ep) {
    return `
<div class="forum_category">${name} ${ep}观感</div>
<div class="forum_boardrow1" style="border-width: 0 1px 1px 1px;">
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="+2"> +2 超棒！</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="+1"> +1 不错</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="+0"> +0 一般</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="-1"> -1 不喜欢</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="-2"> -2 厌恶</label></div>
    <br>
    <input type="submit" name="voteButton" value="投票" class="inputButton" id="voteButton">
</div>
    `
}

function getInfo(counts, score) {
    const judge_str = ['+2 很棒！', '+1 不错', '+0 一般', '-1 不喜欢', '-2 厌恶']
    let voters = counts.reduce((a, b) => a + b, 0)
    let html = '';
    for (var i = 0; i < 5; i++) {
        let width = (counts[i] / voters * 100).toFixed(1)
        let your_vote = 5 - i - 3 === score
        html += `
            <tr>
                <td align="left">${judge_str[i]}${your_vote ? '<small>(your vote)</small>' : ''}</td>
                <td width="35%"><div class="vote_container" style="width: ${width}%">&nbsp;</div></td>
                <td width="25" align="center">${counts[i]}</td>
                <td width="40" align="right">${width}%</td>
            </tr>`
    }
    return `
<div class="forum_category">投票结果</div><div class="forum_boardrow1" style="border-width: 0 1px 1px 1px;">
    <table border="0" width="100%" cellpadding="" cellspacing="5">
        ${html}
    </table>
    <div style="text-align: center;">Voters: ${voters}</div>
</div>`
}

