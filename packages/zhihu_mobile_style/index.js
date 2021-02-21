// ==UserScript==
// @name         Fuck ZhiHu Mobile Style
// @namespace    https://github.com/ipcjs
// @version      2.1.2
// @description  日他娘的逼乎手机网页版 样式ver; 针对电脑版进行修改，适配手机屏幕;
// @author       ipcjs
// @compatible   chrome
// @compatible   firefox
// @include      https://www.zhihu.com/*
// @include      https://zhuanlan.zhihu.com/*
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require      https://greasyfork.org/scripts/373283-ipcjs-lib-js/code/ipcjslibjs.js?version=647820
// @grant        GM_addStyle
// @grant        GM.addStyle
// ==/UserScript==

GM.addStyle(`
/* Header */
.AppHeader {
    min-width: inherit;
}
.AppHeader-inner {
    width: 100%;
}
.SearchBar {
    display: none;
}
.AppHeader-messages, .AppHeader-notifications {
    margin-right: 16px;
}
.AppHeader-userInfo {
    margin-right: 32px;
}
.AppHeader-navItem {
    padding: 0 5px;
}
.AppHeader-nav {
    margin-left: 16px;
    margin-right: 16px;
}
.TopstoryPageHeader-main {
    margin-left: 16px;
}

/* 通用列表 */
.Topstory-container, .Question-main, .Profile-main {
    display: block;
    width: 100%;
    padding: 0px;
}
.Topstory-mainColumn, .Question-mainColumn, .Profile-mainColumn {
    width: 100%;
}
.Question-sideColumn, .Profile-sideColumn {
    width: 100%;
}

/* 回答页面的Header */
.QuestionHeader .QuestionHeader-content {
    width: 100%;
    display: block;
    padding: 0px;
}
.QuestionHeader .QuestionHeader-main {
    width: 100%;
}
.QuestionHeader .QuestionHeader-side {
    width: 100%; 
}
.QuestionHeader .NumberBoard {
    margin: auto;
}
.QuestionHeader {
    min-width: inherit;
}
.PageHeader .QuestionHeader-content {
    width: 100%;
}
.PageHeader .QuestionHeader-main {
    width: 100%;
    padding: 0px;
}
.PageHeader .QuestionHeader-side {
    display: none;
}

/* 个人主页的Header */
.ProfileHeader {
    width: 100%;
    padding: 0px;
}

/* 列表Item上的按钮 */
.ShareMenu {
    display: none;
}
.ContentItem-action {
    margin-left: 8px;
}

/* 专栏页面 */
.Post-NormalMain .Post-Header, .Post-NormalMain>div {
    width: 100%;
}
.ColumnPageHeader-content {
    width: 100%;
}
/* 弹窗 */
.Modal-closeButton {
    position: static;
    margin-left: auto;
    margin-right: auto;
}
.Modal {
    width: 100%;
}
`)

ipcjs.installInto(({ log, html, $ }) => {
    log = GM_info.script.name.endsWith('.dev') ? log : () => { }
    removeThankButton(document)
    new MutationObserver((mutations, observer) => {
        // log(mutations)
        for (let m of mutations) {
            for (let node of m.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    removeThankButton(node)
                }
            }
        }
    }).observe(document.body, {
        childList: true,
        subtree: true
    })
    function removeThankButton(node) {
        let count = 0
        node.querySelectorAll('button.ContentItem-action')
            .forEach(btn => {
                let $text = btn.childNodes[1]
                let group
                if ($text && $text.nodeType === Node.TEXT_NODE) {
                    let text = $text.textContent
                    count++
                    if (text === '感谢' || text === '取消感谢') {
                        btn.style.display = 'none'
                    } else if (text === '举报' || text === '收藏') {
                        $text.textContent = ''
                    } else if ((group = text.match(/(\d+) 条评论/))) {
                        $text.textContent = `${group[1]}`
                    } else {
                        count--
                    }
                }
            })
        if (count > 0) {
            log(`modify: ${count}`)
        }
    }
})
