// ==UserScript==
// @name         Fuck ZhiHu Mobile Style
// @namespace    https://github.com/ipcjs
// @version      2.0.1
// @description  日他娘的逼乎手机网页版 样式ver
// @author       ipcjs
// @include      https://www.zhihu.com/*
// @include      https://zhuanlan.zhihu.com/*
// @require      https://greasyfork.org/scripts/373283-ipcjs-lib-js/code/ipcjslibjs.js?version=647820
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
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
                if (btn.innerText.includes('感谢')) {
                    btn.style.display = 'none'
                    count++
                }
            })
        if (count > 0) {
            log(`remove: ${count}`)
        }
    }
})
