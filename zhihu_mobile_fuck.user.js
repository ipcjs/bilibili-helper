// ==UserScript==
// @name         Fuck ZhiHu Mobile
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  让逼乎更美好
// @author       ipcjs
// @match        https://www.zhihu.com/*
// @grant        GM_addStyle
// @require https://greasyfork.org/scripts/373283-ipcjs-lib-js/code/ipcjslibjs.js?version=647820
// ==/UserScript==

ipcjs.installInto(({ log, $ }) => {
    GM_addStyle(`
    .DownloadGuide {
        display: none;
    }
    .MobileAppHeader-downloadLink {
        display: none;
    }
    /*
    button.ContentItem-more {
        position: absolute;
    }
    */
    `)

    function expandItem(item) {
        if (!item.querySelectorAll) {
            return
        }
        item.querySelectorAll('.RichContent.is-collapsed').forEach((item) => {
            $(item).removeClass('is-collapsed')
        })
    }

    expandItem(document)

    new MutationObserver((mutations, observer) => {
        for (let m of mutations) {
            for (let node of m.addedNodes) {
                expandItem(node)
            }
        }
    }).observe(document.body, {
        childList: true,
        subtree: true
    })
})
