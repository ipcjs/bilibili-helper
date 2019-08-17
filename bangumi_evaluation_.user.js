// ==UserScript==
// @name         Bangumi Evaluation
// @name:zh-CN   Bangumi评分脚本・改
// @namespace    https://github.com/ipcjs/
// @version      2.0.1
// @description  Bangumi Evaluation Script
// @description:zh-CN 改造自 http://bangumi.tv/group/topic/345087; 不需要服务器, 评分数据使用三个零宽字符表示, 存在你发出的评论中~~;
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
const script = {
    name: '评论区投票助手',
    handler: window.GM_info ? window.GM_info.scriptHandler : '组件'
}
if (!window.beuj_running) {
    window.beuj_running = true
} else {
    console.log(`${script.name}(${script.handler})已经在运行了~~`)
    return
}

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
const util_stringify = (item) => {
    if (typeof item === 'object') {
        try {
            return JSON.stringify(item)
        } catch (e) {
            console.debug(e)
            return item.toString()
        }
    } else {
        return item
    }
}
const util_ui_alert = function (message, callback, delay) {
    delay === undefined && (delay = 500)
    setTimeout(() => {
        if (callback) {
            if (window.confirm(message)) {
                callback()
            }
        } else {
            alert(message)
        }
    }, delay)
}
const addStyle = (css) => {
    document.head.appendChild(_('style', {}, [_('text', css)]))
}
const ajax = (...args) => new Promise((resolve, reject) => $.ajax(...args).done(resolve).fail(reject))

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
        border-width: 0 1px 1px 1px;
        border-color: #ebebeb;
        border-style: solid;
        padding: 6px 4px;
        vertical-align: top
    }
    html[data-theme='dark'] .forum_boardrow1 {
        border-color: rgba(255,255,255,0.1);
    }
    html[data-theme='dark'] .forum_category {
        background-color: #37393b;
    }
    .form-option {
        float: right;
        color: #AAA;
        font-size: 12px;
    }
    .beuj-hidden {
        display: none;
    }
    .beuj-float-right {
        float: right;
    }
`)
const TRUE = 'Y'
const FALSE = ''
const HOME_URL_PATH = '/group/topic/345237'
const HOME_URL = 'https://bgm.tv' + HOME_URL_PATH
const INSTALL_URL = 'https://greasyfork.org/zh-CN/scripts/39144'
const SCORE_REGEX = /^\s*([+-]\d+)(\W[^]*)?$/ // 以数字开头的评论
const SCORE_REGEX_ZERO = /^([\u200c\u200d]{3})([^\u200c\u200d].*)?$/
localStorage.beuj_add_suffix === undefined && (localStorage.beuj_add_suffix = FALSE)
localStorage.beuj_flag_to_watched === undefined && (localStorage.beuj_flag_to_watched = TRUE)
localStorage.beuj_show_form_in_ep === undefined && (localStorage.beuj_show_form_in_ep = TRUE)
localStorage.beuj_show_form_in_other === undefined && (localStorage.beuj_show_form_in_other = FALSE)
let beuj_only_one_suffix = TRUE // 一个页面最多放一个小尾巴
const COMMENTS_DEFAULT = '力荐 不错 一般 不喜欢 垃圾'
let commentTemplates = (localStorage.beuj_comment_templates || COMMENTS_DEFAULT).split(' ')

const is_login = !document.querySelector('div.guest')
const getUserId = () => {
    const $avatar = document.querySelector('div.idBadgerNeue a.avatar')
    return $avatar && $avatar.href.split('/')[4] || ''
}
const getGh = () => {
    let $formhash = document.querySelector('#new_comment #ReplyForm > input[name=formhash]')
    return $formhash.value
}
const util_page = {
    ep: () => location.pathname.match(/^\/ep\/\d+$/),
    group_topic: () => location.pathname.match(/^\/group\/topic\/\d+$/)
}
const isShowForm = () => localStorage['beuj_show_form_in_' + (util_page.ep() ? 'ep' : 'other')]
const setShowForm = (show) => localStorage['beuj_show_form_in_' + (util_page.ep() ? 'ep' : 'other')] = show ? TRUE : FALSE
const getShowFormActionText = () => isShowForm() ? '隐藏' : '显示'
class ClassHelper {
    constructor(ele) {
        this.ele = ele;
    }
    hasClass(name) {
        return this.ele.className.includes(name);
    }
    removeClass(name) {
        let list = this.ele.className.split(/ +/);
        let index = list.indexOf(name);
        if (index != -1) {
            list.splice(index, 1);
            this.ele.className = list.join(' ');
        }
        return this;
    }
    addClass(name) {
        this.ele.className = `${this.ele.className} ${name}`;
        return this;
    }
    toggleClass(name) {
        this.hasClass(name) ? this.removeClass(name) : this.addClass(name);
        return this;
    }
}
const array_last = (arr) => arr[arr.length - 1]
const safe_prop = (obj, prop, defaultValue) => obj ? obj[prop] : defaultValue
const score_to_index = (score) => 5 - (score + 3)
const index_to_score = (index) => 5 - index - 3
const score_to_str = (score) => `${score >= 0 ? '+' : ''}${score}`
const score_to_commit_str = (score) => {
    // 用零宽字符转换成二进制, 表示评分
    const binaryStr = `000${(score + 3).toString(2)}`.substr(-3)
    let str = ''
    for (let c of binaryStr) {
        str += c === '0' ? '\u200c' : '\u200d'
    }
    return str
}

function readVoteData() {
    const voteData = {
        voters: {},
        myScore: undefined,
        myReplyId: undefined,
        myUserId: getUserId(),
        hasSuffix: false,
        clearMyScore: function () {
            this.myScore = undefined
            this.myReplyId = undefined
            delete this.voters[this.myUserId]
        },
        parseReply: function ($reply) {
            let $message = this.getMessageInReply($reply)
            let score
            if ((score = this.getScoreInMessage($message)) !== undefined) {
                let userId = this.getUserIdInReply($reply)
                this.voters[userId] = score
                if (this.myUserId === userId) {
                    this.myScore = score
                    this.myReplyId = $reply.id
                }
                if (!this.hasSuffix && (
                    $message.innerHTML.includes(HOME_URL_PATH) // 老的推广链接, 删了.
                    || $message.innerHTML.includes(INSTALL_URL) // 新的推广链接
                )) {
                    this.hasSuffix = true
                }
                return true // 找到了新的评分时, 返回true
            }
            return false
        },
        getUserIdInReply: ($reply) => array_last($reply.querySelector(':scope > a.avatar').href.split('/')),
        getMessageInReply: ($reply) => $reply.querySelector('.message'),
        getScoreInMessage: function ($message) {
            const text = $message.innerText
            // console.log(text)
            if (this._group = text.match(SCORE_REGEX)) {
                let score = Math.min(Math.max(-2, +this._group[1]), 2)
                return score
            } else if (this._group = text.match(SCORE_REGEX_ZERO)) {
                let binaryStr = ''
                for (let c of this._group[1]) {
                    binaryStr += c === '\u200c' ? '0' : '1'
                }
                return Number.parseInt(binaryStr, 2) - 3
            }
            return undefined
        },
        getScoreInReply: function ($reply) { return this.getScoreInMessage(this.getMessageInReply($reply)) }
    }
    const replys = document.querySelectorAll('.row_reply')
    for (let $reply of replys) {
        voteData.parseReply($reply)
    }
    console.log('投票数据:', voteData)
    return voteData
}

const vote_to_bgm = (score, comment, hasSuffix) => new Promise((resolve, reject) => {
    // 发送一条推广评论
    comment = (comment || '').trim()

    let text = ''
    let scoreText = score_to_commit_str(score)
    text += scoreText
    comment && (text += comment)
    if (localStorage.beuj_add_suffix && !(beuj_only_one_suffix && hasSuffix)) {
        (text += `\n[align=right][url=${INSTALL_URL}]--来自${script.name}[/url][/align]`)
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
    new MutationObserver((mutations) => {
        let toRefreshShow = false;
        // console.log(mutations)
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                for (let node of mutation.addedNodes) {
                    // 当前在评论区删除回复时, 只是display: none, 并不会触发DOM树改变
                    // 故这里只处理增加了一条回复的情况
                    if (node.className.split(' ').includes('row_reply')) {
                        toRefreshShow |= voteData.parseReply(node)

                        // 给新增的评论添加 删除/编辑 按钮
                        let delPath, editPath;
                        const replyIdValue = array_last(node.id.split('_'))
                        if (util_page.ep()) { // 适配ep页面
                            delPath = `/erase/reply/ep/${replyIdValue}?gh=${getGh()}`
                            editPath = `/subject/ep/edit_reply/${replyIdValue}`
                        } else if (util_page.group_topic()) { // 适配小组讨论页面
                            delPath = `/erase/group/reply/${replyIdValue}?gh=${getGh()}`
                            editPath = `/group/reply/${replyIdValue}/edit`
                        }
                        if (delPath && editPath) {
                            const onDelClick = (e) => {
                                util_ui_alert('确定删除这条回复？', () => {
                                    ajax({ method: 'GET', dataType: 'json', url: `//${location.hostname}${delPath}&ajax=1` })
                                        .then(r => r.status === 'ok' ? r : Promise.reject(r))
                                        .then(r => {
                                            node.parentElement.removeChild(node)
                                            return r
                                        })
                                        .catch(e => {
                                            alert('删除失败\n' + util_stringify(e))
                                        })
                                }, 0)
                            }
                            let $replyInfo = node.querySelector(':scope > .re_info > small')
                            $replyInfo.appendChild(_('text', ' '))
                            $replyInfo.appendChild(_('a', { href: 'javascript:;', event: { click: onDelClick } }, [_('text', 'del')]))
                            $replyInfo.appendChild(_('text', ' / '))
                            $replyInfo.appendChild(_('a', { href: editPath }, [_('text', 'edit')]))
                        }
                    }
                }
                for (let node of mutation.removedNodes) {
                    // 处理移除reply的情况, 由脚本执行的删除, 会触发移除reply
                    if (node.className.split(' ').includes('row_reply')) {
                        // 移除reply时要做的处理其实比较复杂, 这里做简单化处理, 够用:
                        // 当移除的是自己的包含评分的reply时, 清除自己的评分
                        if (voteData.getScoreInReply(node) !== undefined
                            && voteData.getUserIdInReply(node) === voteData.myUserId) {
                            voteData.clearMyScore()
                            toRefreshShow = true
                        }
                    }
                }
            }
        }
        if (toRefreshShow) {
            show()
        }
    }).observe($comment_list, {
        childList: true,
        attributes: false,
    })
    show()
    function show() {
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
                vote_to_bgm(score, $voteForm.elements.comment.value, voteData.hasSuffix)
                    .then((r) => {
                        // 发出评论后, 会触发DOM树改变, 前面的代码监听了DOM树改变, 在必要的时刻会更新投票区域, 故这里不需要手动更新
                        // voteData.voters[voteData.myUserId] = score
                        // voteData.myScore = score
                        // voteData.myReplyId = safe_prop(array_last(document.querySelectorAll('#comment_list > .row_reply')), 'id', 'no_id') // 评论列表的最后一条
                        // showVoteResult(voteData)
                        // 在ep页面, 有一个"标记为看过功能"
                        if (util_page.ep() && localStorage.beuj_flag_to_watched) {
                            let epId = array_last(location.pathname.split('/'))
                            return ajax({ method: 'POST', dataType: 'json', url: `//${location.hostname}/subject/ep/${epId}/status/watched?gh=${getGh()}&ajax=1`, })
                                .then(r => r.status === 'ok' ? r : Promise.reject(r))
                                .catch(e => {
                                    alert(`标记为看过 失败:\n${util_stringify(e)}`)
                                    return Promise.reject(e) // 继续抛出异常
                                })
                        } else {
                            return 'ok'
                        }
                    })
                    .then(r => console.log('result:', r))
                    .catch(e => console.error('error:', e))
            })
        } else {
            showVoteResult(voteData)
        }
    }

    function showVoteResult(voteData) {
        $poll_container.innerHTML = createVoteResultHtml(voteData.voters, voteData.myScore, voteData.myReplyId)
    }

    function showVote(title, onSubmit) {
        $poll_container.innerHTML = createVoteHtml(title)
        let $formContainer = $poll_container.querySelector('#form-container')
        let $actionShowForm = $poll_container.querySelector('#action-show-form')
        let $voteForm = $poll_container.querySelector('#vote-form')
        $actionShowForm.addEventListener('click', (e) => {
            setShowForm(!isShowForm())
            $actionShowForm.innerText = getShowFormActionText()
            new ClassHelper($formContainer).toggleClass('beuj-hidden')
        })
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
        $voteForm.elements.comment.addEventListener('keydown', (e) => {
            if (e.ctrlKey && (e.keyCode === 13 || e.keyCode === 10)) { // ctrl + enter
                $voteForm.elements.voteButton.click() // 直接form.submit()貌似有问题, 只能模拟提交
            }
        })
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
                    $voteForm.elements.comment.select() // 全选简评区
                }
            } else if (name === 'modify_comment_template') {
                $voteForm.elements.comment_template.type = value ? 'text' : 'hidden'
            }
        })
        $voteForm.elements.beuj_add_suffix.checked = localStorage.beuj_add_suffix
        if ($voteForm.elements.beuj_flag_to_watched) {
            $voteForm.elements.beuj_flag_to_watched.checked = localStorage.beuj_flag_to_watched
        }
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
<div class="forum_category">${title} 投票
    <a id="action-show-form" class="beuj-float-right">${getShowFormActionText()}</a>
</div>
<div id="form-container" class="forum_boardrow1 ${isShowForm() ? '' : 'beuj-hidden'}">
<form id="vote-form">
    ${rows}
    <textarea name="comment" id="vote-comment" class="reply" rows="1" placeholder="简短评价(Ctrl+Enter 快速提交)"></textarea>
    <input type="hidden" name="comment_template" class="inputtext" style="margin-bottom: 6px;" placeholder="短评模板; +2 +1 +0 -1 -2 分别对应的短评;使用空格分隔;">
    <br/>
    <input type="submit" name="voteButton" value="投票" class="inputButton" id="voteButton">
    <label class="form-option" title="没错, 短评模板时可以修改的"><input type="checkbox" name="modify_comment_template" > 修改短评模板 </input></label>
    ${util_page.ep() ? '<label class="form-option" title="同时将当前ep标记为看过"><input type="checkbox" name="beuj_flag_to_watched" > 标记为看过 </input></label>' : ''}
    <label class="form-option" title="会在评分的结尾追加'来自xxx脚本'的小尾巴, 为了防止刷屏, 只有当前页没有出现过小尾巴时才会追加." ><input type="checkbox" name="beuj_add_suffix" > 推荐脚本 </input></label>
</form>
</div>
    `
}

function createVoteResultHtml(voters, myScore, myReplyId) {
    const counts = new Array(commentTemplates.length).fill(0) // 投+2->-2分的人数的数组
    const voterUserIds = Object.keys(voters)
    for (let userId of voterUserIds) {
        let score = voters[userId]
        counts[score_to_index(score)]++
    }

    let voterCount = voterUserIds.length
    let html = '';
    const myIndex = score_to_index(myScore)
    for (let i = 0; i < commentTemplates.length; i++) {
        let width = (counts[i] / voterCount * 100).toFixed(1)
        let isMyVote = myIndex === i
        html += `
            <tr>
                <td align="left">${score_to_str(index_to_score(i))} ${commentTemplates[i]}${isMyVote ? `<a href="#${myReplyId}" class="l">(your vote)</a>` : ''}</td>
                <td width="35%"><div class="vote_container" style="width: ${width}%">&nbsp;</div></td>
                <td width="25" align="center">${counts[i]}</td>
                <td width="40" align="right">${width}%</td>
            </tr>`
    }
    return `
<div class="forum_category">投票结果</div><div class="forum_boardrow1">
    <table border="0" width="100%" cellpadding="" cellspacing="5">
        ${html}
    </table>
    <div style="text-align: center;">Voters: ${voterCount}</div>
</div>`
}

main()
