// ==UserScript==
// @name         S3 Mobile Style
// @namespace    https://github.com/ipcjs
// @version      1.0.0
// @description  S3简单适配手机版网页
// @author       ipcjs
// @match        *://ac.stage3rd.com/*
// @grant        GM_addStyle
// @grant        GM.addStyle
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @run-at       document-start
// ==/UserScript==
const log = console.log.bind(console, `[${GM_info.script.name}]`)

function setupMeta() {
    //<meta name="viewport" content="initial-scale=1.0, user-scalable=no" /> 
    const $meta = document.createElement('meta')
    $meta.name = 'viewport'
    $meta.content = 'initial-scale=1.0, user-scalable=no'
    document.head.appendChild($meta)
}

function setupStyle() {
    // 设置rootClass, 方便对具体页面设置css
    const rootClass = location.pathname.replace(/[\/.]/g, '_')
    document.documentElement.className += ` ${rootClass}`
    log('rootClass:', rootClass)

    const c_detail_item_head = (num) => `._forumTopicRead_asp form[name=topicReplys] .TopicBg${num}>tbody>tr>td:first-child`
    const c_detail_item_head_owner = `._forumTopicRead_asp #main>.TopicBg1>tbody>tr>td:first-child`
    const c_detail_item_time = (num) => `._forumTopicRead_asp .TopicBg${num}>tbody>tr>td:nth-child(2) tr:first-child>td:first-child`
    const c_detail_item_content = (num) => `._forumTopicRead_asp .TopicBg${num}>tbody>tr>td:nth-child(2) tr:nth-child(2)>td`
    const c_list_item = (col, num) => `.rowbg${num}>td:nth-child(${col})`
    const c_list_item_title_width = '300px'

    GM.addStyle(`
        /* 全局 */
        #main {
            width: 100%!important;
        }

        td {
            white-space: nowrap;
        }

        /* 列表页面 */
        ${c_list_item(1,1)},
        ${c_list_item(1,2)},
        ${c_list_item(4,1)},
        ${c_list_item(4,2)},
        ._forumTopicList_asp .PageSubject,
        ${c_list_item(2, 1)} .button_page,
        ${c_list_item(2, 2)} .button_page,
        ${c_list_item(2, 1)} img,
        ${c_list_item(2, 2)} img
        {
            display:none;
        }
        ${c_list_item(2,1)},
        ${c_list_item(2,2)}
        {
            font-size: 0px;
        }
        ${c_list_item(2,1)} a,
        ${c_list_item(2,2)} a
        {
            width:${c_list_item_title_width};
            display: inline-block;
            font-size: 16px;
            white-space: normal;
        }

        /* 详细页面 */
        ${c_detail_item_head(1)},
        ${c_detail_item_head(2)},
        ${c_detail_item_head_owner},
        ${c_detail_item_head(1)}>div,
        ${c_detail_item_head(2)}>div,
        ${c_detail_item_head_owner}>div
        {
            width: 50px!important;
            font-size: 0;
        }
        ${c_detail_item_head(1)} img,
        ${c_detail_item_head(2)} img,
        ${c_detail_item_head_owner} img
        {
            width: 40px;
        }

        ._forumTopicRead_asp #main>.TopicBg1+table.TopicBg1 
        {
            visibility: hidden;
        }
        ._forumTopicRead_asp form[name=w] tr:nth-child(1)>td:nth-child(1),
        ._forumTopicRead_asp form[name=w] tr:nth-child(2)>td:nth-child(1),
        ._forumTopicRead_asp form[name=w] tr:nth-child(4)>td:nth-child(1),
        ._forumTopicRead_asp form[name=w] tr:nth-child(5)>td:nth-child(1),
        ._forumTopicRead_asp .TopicBg1 div[align=right],
        ._forumTopicRead_asp .TopicBg2 div[align=right]
        {
            display: none;
        }
        form[name=w] td,
        ${c_detail_item_content(1)},
        ${c_detail_item_content(2)}
        {
            white-space: normal;
        }
    `)
}

setupMeta()
setupStyle()