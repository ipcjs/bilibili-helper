// ==UserScript==
// @name         Bangumi Evaluation
// @name:zh-CN   Bangumi评分脚本・改
// @namespace    https://github.com/ipcjs/
// @version      1.0.6
// @description  Bangumi Evaluation Script
// @description:zh-CN 改造自 http://bangumi.tv/group/topic/345087
// @author       ipcjs
// @include      *://bgm.tv/ep/*
// @include      *://bgm.tv/character/*
// @include      *://bgm.tv/blog/*
// @include      *://bgm.tv/*/topic/*
// @include      *://bangumi.tv/ep/*
// @include      *://bangumi.tv/character/*
// @include      *://bangumi.tv/blogep/*
// @include      *://bangumi.tv/*/topic/*
// @include      *://chii.in/ep/*
// @include      *://chii.in/characterep/*
// @include      *://chii.in/blog/*
// @include      *://chii.in/*/topic/*
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
const HOME_URL_PATH = '/group/topic/345237'
const HOME_URL = 'https://bgm.tv' + HOME_URL_PATH
localStorage.beuj_need_mask === undefined && (localStorage.beuj_need_mask = FALSE)
localStorage.beuj_need_suffix === undefined && (localStorage.beuj_need_suffix = TRUE)
let beuj_only_one_suffix = TRUE // 一个页面最多放一个小尾巴
const COMMENTS_DEFAULT = '力荐 不错 一般 不喜欢 垃圾'
let commentTemplates = (localStorage.beuj_comment_templates || COMMENTS_DEFAULT).split(' ')

const is_login = !document.querySelector('div.guest')
const getUserId = () => {
    const $avatar = document.querySelector('div.idBadgerNeue a.avatar')
    return $avatar && $avatar.href.split('/')[4] || ''
}
const array_last = (arr) => arr[arr.length - 1]
const safe_prop = (obj, prop, defaultValue) => obj ? obj[prop] : defaultValue
const score_to_index = (score) => 5 - (score + 3)
const index_to_score = (index) => 5 - index - 3
const score_to_str = (score) => `${score >= 0 ? '+' : ''}${score}`

function readVoteData() {
    const voters = {}
    const replys = document.querySelectorAll('.row_reply')
    const scoreReg = /^\s*([+-]\d+)(\W[^]*)?$/ // 以数字开头的评论
    const myUserId = getUserId()
    let myScore, myReplyId, hasSuffix = false
    let group
    for (let $reply of replys) {
        let $message = $reply.querySelector('.message')
        if (group = $message.innerText.match(scoreReg)) {
            let score = Math.min(Math.max(-2, +group[1]), 2)
            let userId = array_last($reply.querySelector(':scope > a.avatar').href.split('/'))
            voters[userId] = score
            if (myUserId === userId) {
                myScore = score
                myReplyId = $reply.id
            }
            if (!hasSuffix && $message.innerHTML.includes(HOME_URL_PATH)) {
                hasSuffix = true
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
        hasSuffix,
    }
    console.log('投票数据:', voters, result)
    return result
}

const vote_to_bgm = (score, comment, hasSuffix) => new Promise((resolve, reject) => {
    // 发送一条推广评论
    comment = (comment || '').trim()

    let text = ''
    let scoreText = score_to_str(score)
    text += localStorage.beuj_need_mask ? `[mask]${scoreText}[/mask]` : scoreText
    comment && (text += ' ' + comment)
    if (localStorage.beuj_need_suffix && !(beuj_only_one_suffix && hasSuffix)) {
        (text += `\n[url=${HOME_URL}]--来自Bangumi评分脚本・改[/url]`)
    }

    document.querySelector('textarea#content').value = text
    document.querySelector('#new_comment #ReplyForm [type=submit]').click()
    resolve('ok')
})

function main() {
    let $comment_list
    if (!($comment_list = document.getElementById('comment_list'))) {
        console.log('不存在#comment_list, 不支持投票...')
        return
    }
    // 番剧讨论页: https://bgm.tv/ep/767931
    let $container = document.querySelector('#columnEpA .epDesc')
    // 小组讨论页: https://bgm.tv/group/topic/345237
    // 条目讨论版: https://bgm.tv/subject/topic/3022
    if (!$container) $container = document.querySelector('div.topic_content')
    // 人物页: https://bgm.tv/character/77
    if (!$container) $container = document.querySelector('#columnCrtB > div.detail')
    // 日志页面: https://bgm.tv/blog/46986
    if (!$container) $container = document.querySelector('#entry_content.blog_entry')
    // 依然没有, 则创建
    if (!$container) {
        $container = _('div', { className: 'borderNeue', style: { marginTop: '10px' } })
        $comment_list.parentElement.insertBefore($container, $comment_list)
    }
    const $poll_container = _('div', { id: 'poll_container', style: {/* width: '670px'*/ } })
    $container.appendChild($poll_container)
    let voteData = readVoteData()
    if (is_login && voteData.myScore === undefined) {
        let title = document.title, $tmp
        // 番剧讨论页: https://bgm.tv/ep/767931
        // 人物页: https://bgm.tv/character/77
        if ($tmp = document.querySelector('#headerSubject .nameSingle a')) {
            title = $tmp.innerText
            if ($tmp = document.querySelector('div#columnEpA h2.title')) { // 番剧讨论页的ep
                title += ' ' + $tmp.innerText.split(' ')[0]
            }
        }
        const $voteForm = showVote(title, () => {
            const val = $voteForm.elements.pollOption.value
            if (!val) {
                alert("请选择后再投票！");
                return;
            }
            let score = +val
            vote_to_bgm(score, $poll_container.querySelector('#vote-comment').value, voteData.hasSuffix)
                .then((r) => {
                    voteData.counts[score_to_index(score)]++
                    voteData.myScore = score
                    voteData.myReplyId = safe_prop(array_last(document.querySelectorAll('#comment_list > .row_reply')), 'id', 'no_id') // 评论列表的最后一条
                    showVoteResult(voteData)
                })
                .catch(e => console.error(e))
        })
    } else {
        showVoteResult(voteData)
    }

    function showVoteResult(voteData) {
        $poll_container.innerHTML = createVoteResultHtml(voteData.counts, voteData.myScore, voteData.myReplyId)
    }

    function showVote(title, onSubmit) {
        $poll_container.innerHTML = createVoteHtml(title)
        let $voteForm = $poll_container.querySelector('#vote-form')
        $voteForm.onsubmit = function () {
            let comment_template
            let toSubmit = true
            if (comment_template = $voteForm.elements.comment_template.value) {
                toSubmit = false
                let templates = comment_template.split(' ')
                if (templates.length === commentTemplates.length) {
                    // 更新模板
                    commentTemplates = templates
                    localStorage.beuj_comment_templates = commentTemplates.join(' ')
                    toSubmit = true
                } else {
                    alert(`短评模板(${comment_template})不符合格式!\n需要用空格分隔, 例如:\n"${commentTemplates.join(' ')}"`)
                }
            }
            toSubmit && onSubmit()
            return false // no submit
        }
        $voteForm.addEventListener('change', (e) => {
            let name = e.target.name;
            let value = e.target.type === 'checkbox' ? (e.target.checked ? TRUE : FALSE) : e.target.value
            if (name.startsWith('beuj_')) {
                localStorage[name] = value
                console.log(name, ' => ', value);
            } else if (name === 'pollOption') {
                let score = +value
                let comment = $voteForm.elements.comment.value
                // 若简单评论为空, 或是评论模板中的值, 则修改简单评论为评论模板中的一个
                if (comment === '' || commentTemplates.includes(comment)) {
                    $voteForm.elements.comment.value = commentTemplates[score_to_index(score)]
                }
            } else if (name === 'modify_comment_template') {
                $voteForm.elements.comment_template.type = value ? 'text' : 'hidden'
            }
        })
        $voteForm.elements.beuj_need_mask.checked = localStorage.beuj_need_mask
        $voteForm.elements.beuj_need_suffix.checked = localStorage.beuj_need_suffix
        return $voteForm
    }
}

function createVoteHtml(title) {
    let rows = ''
    for (let i = 0; i < commentTemplates.length; i++) {
        let scoreStr = score_to_str(index_to_score(i))
        rows += `<div style="margin: 3px 0;"><label><input type="radio" name="pollOption" value="${scoreStr}"> ${scoreStr} ${commentTemplates[i]}</label></div>`
    }
    return `
<div class="forum_category">${title} 投票</div>
<div class="forum_boardrow1" style="border-width: 0 1px 1px 1px;">
<form id="vote-form">
    ${rows}
    <textarea name="comment" id="vote-comment" class="reply" rows="1" placeholder="简短评价"></textarea>
    <input type="hidden" name="comment_template" class="inputtext" style="margin-bottom: 6px;" placeholder="短评模板; +2 +1 +0 -1 -2 分别对应的短评;使用空格分隔;">
    <br/>
    <input type="submit" name="voteButton" value="投票" class="inputButton" id="voteButton">
    <label class="form-option"><input type="checkbox" name="modify_comment_template" > 修改短评模板 </input></label>
    <label class="form-option"><input type="checkbox" name="beuj_need_suffix" title="在评分的结尾追加'来自xxx脚本'的小尾巴, 为了防止刷屏, 只有当前页没有出现过小尾巴时才会追加." > 帮助推广脚本 </input></label>
    <label class="form-option"><input type="checkbox" name="beuj_need_mask" > Mask评分 </input></label>
</form>
</div>
    `
}

function createVoteResultHtml(counts, score, replyId) {
    let voters = counts.reduce((a, b) => a + b, 0)
    let html = '';
    const myIndex = score_to_index(score)
    for (let i = 0; i < commentTemplates.length; i++) {
        let width = (counts[i] / voters * 100).toFixed(1)
        let your_vote = myIndex === i
        html += `
            <tr>
                <td align="left">${score_to_str(index_to_score(i))} ${commentTemplates[i]}${your_vote ? `<a href="#${replyId}" class="l">(your vote)</a>` : ''}</td>
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
