// ==UserScript==
// @name         Fuck ZhiHu Mobile Style
// @namespace    https://github.com/ipcjs
// @version      2.1.3
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

// @template-content
var css = "@charset \"UTF-8\";\n/* Header */\n.AppHeader {\n  min-width: inherit; }\n  .AppHeader .ZhihuLogoLink,\n  .AppHeader .SearchBar {\n    display: none; }\n  .AppHeader-inner {\n    width: 100%;\n    min-width: inherit; }\n  .AppHeader-Tabs {\n    margin-left: 0px;\n    margin-right: 4px; }\n  .AppHeader-Tab {\n    padding: 0 4px !important; }\n  .AppHeader-messages, .AppHeader-notifications {\n    margin-right: 16px; }\n  .AppHeader-userInfo {\n    margin-left: 0px !important;\n    margin-right: 32px; }\n  .AppHeader-navItem {\n    padding: 0 5px; }\n  .AppHeader-nav {\n    margin-left: 16px;\n    margin-right: 16px; }\n\n.TopstoryPageHeader-main {\n  margin-left: 16px; }\n\n/* 通用列表 */\n.Topstory-container,\n.Question-main,\n.Profile-main {\n  display: block;\n  width: 100%;\n  padding: 0px; }\n\n.Topstory-mainColumn,\n.Question-mainColumn,\n.Profile-mainColumn {\n  width: 100%; }\n\n.Question-sideColumn,\n.Profile-sideColumn {\n  width: 100%; }\n\n/* 回答页面的Header */\n.QuestionHeader .QuestionHeader-content {\n  width: 100%;\n  display: block;\n  padding: 0px; }\n\n.QuestionHeader .QuestionHeader-main {\n  width: 100%; }\n\n.QuestionHeader .QuestionHeader-side {\n  width: 100%; }\n\n.QuestionHeader .NumberBoard {\n  margin: auto; }\n\n.QuestionHeader {\n  min-width: inherit; }\n\n.PageHeader .QuestionHeader-content {\n  width: 100%; }\n\n.PageHeader .QuestionHeader-main {\n  width: 100%;\n  padding: 0px; }\n\n.PageHeader .QuestionHeader-side {\n  display: none; }\n\n/* 个人主页 */\n.ProfileHeader {\n  width: 100%;\n  padding: 0px; }\n  .ProfileHeader-buttons {\n    position: static; }\n  .ProfileHeader-contentHead {\n    padding-right: 0px; }\n\n.ProfileMain-tabs {\n  overflow: scroll; }\n  .ProfileMain-tabs::-webkit-scrollbar {\n    display: none; }\n\n/* 列表Item上的按钮 */\n.ShareMenu {\n  display: none; }\n\n.ContentItem-action {\n  margin-left: 8px; }\n\n/* 专栏页面 */\n.Post-NormalMain .Post-Header,\n.Post-NormalMain > div {\n  width: 100%; }\n\n.ColumnPageHeader-content {\n  width: 100%; }\n\n/* 弹窗 */\n.Modal-closeButton {\n  position: static;\n  margin-left: auto;\n  margin-right: auto; }\n\n.Modal {\n  width: 100%; }\n";

GM.addStyle(css);

ipcjs.installInto(({ log, html, $ }) => {
    log = GM_info.script.name.endsWith('.dev') ? log : () => { };
    removeThankButton(document);
    new MutationObserver((mutations, observer) => {
        // log(mutations)
        for (let m of mutations) {
            for (let node of m.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    removeThankButton(node);
                }
            }
        }
    }).observe(document.body, {
        childList: true,
        subtree: true
    });
    function removeThankButton(node) {
        let count = 0;
        node.querySelectorAll('button.ContentItem-action')
            .forEach(btn => {
                let $text = btn.childNodes[1];
                let group;
                if ($text && $text.nodeType === Node.TEXT_NODE) {
                    let text = $text.textContent;
                    count++;
                    if (text === '感谢' || text === '取消感谢') {
                        btn.style.display = 'none';
                    } else if (text === '举报' || text === '收藏') {
                        $text.textContent = '';
                    } else if ((group = text.match(/(\d+) 条评论/))) {
                        $text.textContent = `${group[1]}`;
                    } else {
                        count--;
                    }
                }
            });
        if (count > 0) {
            log(`modify: ${count}`);
        }
    }
});

