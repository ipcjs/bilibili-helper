// ==UserScript==
// @name         S3 Mobile Style
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  S3 Mobile Style
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

    const c_detail_item_head = (num) => `.TopicBg${num}>tbody>tr>td:first-child`
    const c_detail_item_time = (num) => `.TopicBg${num}>tbody>tr>td:nth-child(2) tr:first-child>td:first-child`
    const c_list_item_title = (num) => `.rowbg${num}>td:nth-child(2)`
    const c_list_item_title_width = '250px'

    GM.addStyle(`
        ///// 全局 /////
        #main {
            width: 100%!important;
        }

        td {
            white-space: nowrap;
        }

        ///// 列表页面 /////
        ${c_list_item_title(1)},
        ${c_list_item_title(2)}
        {
            // background:green;
            // width:${c_list_item_title_width};
        }
        ${c_list_item_title(1)} a:first-child,
        ${c_list_item_title(2)} a:first-child
        {
            width:${c_list_item_title_width};
            text-overflow: ellipsis;
            overflow:hidden;
            display: inline-block;
        }

        ///// 详细页面 /////
        ${c_detail_item_head(1)},
        ${c_detail_item_head(2)},
        ${c_detail_item_head(1)}>div,
        ${c_detail_item_head(2)}>div
        {
            width: 50px!important;
            font-size: 0;
        }
        ${c_detail_item_head(1)} img,
        ${c_detail_item_head(2)} img
        {
            width: 40px;
        }

        .TopicBg1 div[align=right],
        .TopicBg2 div[align=right]
        {
            display: none;
        }
    `)
}

setupMeta()
setupStyle()