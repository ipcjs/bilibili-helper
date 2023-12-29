// ==UserScript==
// @name         Fuck ZhiHu Mobile Style
// @namespace    https://github.com/ipcjs
// @version      2.2.0
// @description  日他娘的逼乎手机网页版 样式ver; 针对电脑版进行修改，适配手机屏幕;
// @author       ipcjs
// @compatible   chrome
// @compatible   firefox
// @include      https://www.zhihu.com/*
// @include      https://zhuanlan.zhihu.com/*
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @grant        GM_addStyle
// @grant        GM.addStyle
// @run-at       document-start
// ==/UserScript==

// @template-content

var css = "@charset \"UTF-8\";\n/* Header */\n.AppHeader {\n  min-width: inherit;\n}\n.AppHeader .ZhihuLogoLink,\n.AppHeader .SearchBar {\n  display: none;\n}\n.AppHeader .AppHeader-inner {\n  width: 100%;\n  min-width: inherit;\n}\n.AppHeader .AppHeader-Tabs {\n  margin-left: 0px;\n  margin-right: 4px;\n}\n.AppHeader-Tab {\n  padding: 0 4px !important;\n}\n.AppHeader-messages, .AppHeader-notifications {\n  margin-right: 16px;\n}\n.AppHeader-userInfo {\n  margin-left: 0px !important;\n  margin-right: 32px;\n}\n.AppHeader-navItem {\n  padding: 0 5px;\n}\n.AppHeader-nav {\n  margin-left: 16px;\n  margin-right: 16px;\n}\n\n/* 往下滚动后显示的顶栏 */\n.TopstoryPageHeader {\n  min-width: inherit !important;\n  width: 100% !important;\n}\n.TopstoryPageHeader > div {\n  flex: none;\n}\n.TopstoryPageHeader > .TopstoryPageHeader-main {\n  flex: 0 0 64px;\n}\n.TopstoryPageHeader > .TopstoryPageHeader-aside {\n  margin: 0 30px 0 12px;\n  flex: auto;\n}\n.TopstoryPageHeader-main .TopstoryPageHeader-tabs {\n  display: none;\n}\n\n.Topstory .css-11h6utu {\n  width: 100%;\n}\n\n/* 通用列表 */\n.Topstory-container,\n.Search-container,\n.Question-main,\n.Profile-main {\n  display: block;\n  width: 100%;\n  padding: 0px;\n}\n\n.Topstory-mainColumn,\n.SearchMain,\n.Question-mainColumn,\n.Profile-mainColumn {\n  width: 100%;\n}\n\n.Question-sideColumn,\n.Profile-sideColumn {\n  width: 100%;\n}\n\n/* 回答页面的Header */\n.QuestionHeader .QuestionHeader-content {\n  width: 100%;\n  display: block;\n  padding: 0px;\n}\n\n.QuestionHeader .QuestionHeader-main {\n  width: 100%;\n}\n\n.QuestionHeader .QuestionHeader-side {\n  width: 100%;\n}\n\n.QuestionHeader .NumberBoard {\n  margin: auto;\n}\n\n.QuestionHeader {\n  min-width: inherit;\n}\n\n.PageHeader .QuestionHeader-content {\n  width: 100%;\n}\n\n.PageHeader .QuestionHeader-main {\n  width: 100%;\n  padding: 0px;\n}\n\n.PageHeader .QuestionHeader-side {\n  display: none;\n}\n\n.AuthorInfo {\n  overflow-x: hidden;\n}\n\n/* 个人主页 */\n.ProfileHeader {\n  width: 100%;\n  padding: 0px;\n}\n.ProfileHeader-buttons {\n  position: static;\n}\n.ProfileHeader-contentHead {\n  padding-right: 0px;\n}\n\n.SearchTabs-inner {\n  width: 100%;\n}\n\n.SearchTabs-inner,\n.ProfileMain-tabs {\n  overflow: scroll;\n}\n.SearchTabs-inner::-webkit-scrollbar,\n.ProfileMain-tabs::-webkit-scrollbar {\n  display: none;\n}\n\n/* 列表Item上的按钮 */\n.ContentItem-action {\n  margin-left: 8px;\n}\n\n/*\n// 测试按钮的选择器\n.ContentItem-actions button.Button--withLabel,\nbutton.ContentItem-action {\n    color: red;\n}\n*/\n/* 专栏页面 */\n.Post-content {\n  min-width: unset;\n}\n.Post-Main {\n  padding: 0px 16px;\n}\n.Post-NormalSub > div, .Post-NormalMain > .Post-Header, .Post-NormalMain > div {\n  width: 100%;\n}\n\n/* 专栏主页的Header */\n.ColumnPageHeader-content {\n  width: calc(100% - 32px);\n  padding: 0px 16px;\n}\n.ColumnPageHeader-profile {\n  display: none;\n}\n.ColumnPageHeader-WriteButton {\n  font-size: 0px;\n}\n\n/* 弹窗 */\nbutton.Button.css-1x9te0t,\n.Modal-closeButton {\n  position: static;\n  margin-left: auto;\n  margin-right: auto;\n}\n\ndiv.css-1bkecgh,\n.Modal {\n  width: 100%;\n}\n\n/* 追踪水印, https://twitter.com/undef_i/status/1566315374765031424 */\n#root > div > div[class^=css-] {\n  display: none;\n}";

function main ({ log }) {
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
    }).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    function removeThankButton(node) {
        let count = 0;
        node.querySelectorAll('button.ContentItem-action, .ContentItem-actions button.Button--withLabel')
            .forEach(btn => {
                let $text = btn.childNodes[1];
                let group;
                if ($text && $text.nodeType === Node.TEXT_NODE) {
                    let text = $text.textContent;
                    console.log(text);
                    count++;
                    if (text === '感谢' || text === '取消感谢') {
                        btn.style.display = 'none';
                    } else if (text === ' 举报' || text === '分享' || text === '收藏' || text === '喜欢') {
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
}

log = GM_info.script.name.endsWith('.dev') ? console.debug.bind(console) : () => { };

GM.addStyle(css);
main({ log });

