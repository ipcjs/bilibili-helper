// ==UserScript==
// @name               Bilibili Comment Spoiler Folder
// @name:zh-CN         B站评论区剧透折叠
// @name:zh-HK         B站評論區劇透摺疊
// @name:zh-TW         B站評論區劇透摺疊
// @namespace          https://github.com/ipcjs
// @version            1.0.3
// @description        折叠评论中包含"剧透"的楼层
// @description:zh-CN  折叠评论中包含"剧透"的楼层
// @description:zh-HK  摺疊評論中包含“劇透”的樓層
// @description:zh-TW  摺疊評論中包含“劇透”的樓層
// @author             ipcjs
// @include            *://www.bilibili.com/video/av*
// @include            *://bangumi.bilibili.com/anime/*
// @include            *://bangumi.bilibili.com/movie/*
// @include            *://www.bilibili.com/bangumi/play/ep*
// @require            https://code.jquery.com/jquery-2.2.4.min.js
// @require            https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @grant              GM_addStyle
// ==/UserScript==

'use strict'
GM_addStyle("a.ep_spoiler_fold_toggle {display:block;color:#bbb;margin-top:5px}")
const regex = /(剧透|劇透|R\.?I\.?P|走好)/i
const message = '可能有剧透！单击此处显示 / 隐藏'
$('.comm').arrive('.list-item.reply-wrap', ele => {
    // 处理剧透
    const processSpoiler = (replyCount) => {
        if ($('.ep_spoiler_fold_toggle', ele).length > 0) return // 已经添加了剧透警告, 着不需要再处理了

        const $content = $('.con', ele).find('>.text, >.reply-box, >.paging-box')
        $content.hide()
        $($content[0]).before(`<a class="ep_spoiler_fold_toggle" href="javascript:">(+${replyCount}) ${message}</a>`)
        $('.ep_spoiler_fold_toggle', ele).on('click', (event) => {
            $content.slideToggle()
        })
    }
    // 检测已有的文本
    $text = $('.text, .text-con', ele)
    if ($text.text().match(regex)) {
        processSpoiler($text.length - 1)
    }
    // 检测将来增加的文本
    ele.arrive('.text, .text-con', text => {
        if ($(text).text().match(regex)) {
            processSpoiler('x')
        }
    })

})
