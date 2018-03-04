// ==UserScript==
// @name         Bangumi Evaluation
// @name:zh-CN   Bangumi评分脚本・改
// @namespace    https://github.com/ipcjs/
// @version      1.0.1
// @description  Bangumi Evaluation Script
// @description:zh-CN 改造自 http://bangumi.tv/group/topic/345087
// @author       ipcjs
// @include      *://bgm.tv/ep/*
// @include      *://bangumi.tv/ep/*
// @include      *://chii.in/ep/*
// @compatible   chrome
// @compatible   firefox
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

    .form-option {
        float: right;
        color: #AAA;
        font-size: 12px;
    }
`)
const TRUE = 'Y'
const FALSE = ''
localStorage.beuj_need_mask === undefined && (localStorage.beuj_need_mask = FALSE)
localStorage.beuj_need_suffix === undefined && (localStorage.beuj_need_suffix = TRUE)

const is_login = !document.querySelector('div.guest')
const getUserId = () => {
    const $avatar = document.querySelector('div.idBadgerNeue a.avatar')
    return $avatar && $avatar.href.split('/')[4] || ''
}
const array_last = (arr) => arr[arr.length - 1]
const score_to_index = (score) => 5 - (score + 3)
const index_to_score = (inex) => 5 - index - 3

function readVoteData() {
    const voters = {}
    const replys = document.querySelectorAll('.row_reply')
    const scoreReg = /^\s*([+-]\d+)(\W[^]*)?$/ // 以数字开头的评论
    const myUserId = getUserId()
    let myScore, myReplyId
    let group
    for (let $reply of replys) {
        if (group = $reply.querySelector('.message.clearit').innerText.match(scoreReg)) {
            let score = Math.min(Math.max(-2, +group[1]), 2)
            let userId = array_last($reply.querySelector(':scope > a.avatar').href.split('/'))
            voters[userId] = score
            if (myUserId === userId) {
                myScore = score
                myReplyId = $reply.id
            }
        }
    }
    const counts = [0, 0, 0, 0, 0] // 投+2->-2分的人数的数组
    for (let userId of Object.keys(voters)) {
        let score = voters[userId]
        counts[score_to_index(score)]++
    }
    const result = {
        counts,
        myScore,
        myReplyId,
    }
    console.log('投票数据:', voters, result)
    return result
}

const vote_to_bgm = (score, comment) => new Promise((resolve, reject) => {
    // 发送一条推广评论
    comment = (comment || '').trim()

    let text = ''
    let scoreText = `${score >= 0 ? '+' : ''}${score} `
    text += localStorage.beuj_need_mask ? `[mask]${scoreText}[/mask]` : scoreText
    comment && (text += ' ' + comment)
    localStorage.beuj_need_suffix && (text += '\n[url=http://bgm.tv/group/topic/345235]--来自Bangumi评分脚本・改[/url]')

    document.querySelector('textarea#content').value = text
    document.querySelector('#new_comment #ReplyForm [type=submit]').click()
    resolve('ok')
})

function main() {
    const $poll_container = _('div', { id: 'poll_container', style: { width: '670px' } })
    document.querySelector('#columnEpA .epDesc').appendChild($poll_container)
    let voteData = readVoteData()
    if (is_login && voteData.myScore === undefined) {
        const name = document.querySelector('div#headerSubject a').innerText
        const ep = document.querySelector('div#columnEpA h2.title').innerText.split(' ')[0]
        const $voteForm = showVote(name, ep, () => {
            const val = $voteForm.elements.pollOption.value
            if (!val) {
                alert("请选择后再投票！");
                return;
            }
            let score = +val
            vote_to_bgm(score, $poll_container.querySelector('#vote-comment').value)
                .then((r) => {
                    voteData.counts[score_to_index(score)]++
                    voteData.myScore = score
                    voteData.myReplyId = document.querySelector('#comment_list > :last-child').id // 评论列表的最后一条
                    showVoteResult(voteData)
                })
        })
    } else {
        showVoteResult(voteData)
    }

    function showVoteResult(voteData) {
        $poll_container.innerHTML = createVoteResultHtml(voteData.counts, voteData.myScore, voteData.myReplyId)
    }

    function showVote(name, ep, onSubmit) {
        $poll_container.innerHTML = createVoteHtml(name, ep)
        let $voteForm = $poll_container.querySelector('#vote-form')
        $voteForm.onsubmit = function () {
            onSubmit()
            return false // no submit
        }
        $voteForm.addEventListener('change', (e) => {
            var name = e.target.name;
            var value = e.target.type === 'checkbox' ? (e.target.checked ? TRUE : FALSE) : e.target.value
            if (name.startsWith('beuj_')) {
                localStorage[name] = value
                console.log(name, ' => ', value);
            }
        })
        $voteForm.elements.beuj_need_mask.checked = localStorage.beuj_need_mask
        $voteForm.elements.beuj_need_suffix.checked = localStorage.beuj_need_suffix
        return $voteForm
    }
}

function createVoteHtml(name, ep) {
    return `
<div class="forum_category">${name} ${ep}观感</div>
<div class="forum_boardrow1" style="border-width: 0 1px 1px 1px;">
<form id="vote-form">
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="+2"> +2 超棒！</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="+1"> +1 不错</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="+0"> +0 一般</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="-1"> -1 不喜欢</label></div>
    <div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="-2"> -2 厌恶</label></div>
    <textarea name="comment" id="vote-comment" class="reply" rows="1" placeholder="简短评价"></textarea>
    <br/>
    <input type="submit" name="voteButton" value="投票" class="inputButton" id="voteButton">
    <label class="form-option"><input type="checkbox" name="beuj_need_mask" > Mask评分 </input></label>
    <label class="form-option"><input type="checkbox" name="beuj_need_suffix" > 添加小尾巴 </input></label>
</form>
</div>
    `
}

function createVoteResultHtml(counts, score, replyId) {
    const judge_str = ['+2 很棒！', '+1 不错', '+0 一般', '-1 不喜欢', '-2 厌恶']
    let voters = counts.reduce((a, b) => a + b, 0)
    let html = '';
    const myIndex = score_to_index(score)
    for (var i = 0; i < 5; i++) {
        let width = (counts[i] / voters * 100).toFixed(1)
        let your_vote = myIndex === i
        html += `
            <tr>
                <td align="left">${judge_str[i]}${your_vote ? `<a href="#${replyId}" class="l">(your vote)</a>` : ''}</td>
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

main()
