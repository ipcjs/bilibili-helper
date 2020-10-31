import path from 'path'
import scssToString from 'rollup-plugin-scss-string'

const userscriptHead = `
// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      7.9.8
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效;
// @author       ipcjs
// @supportURL   https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md
// @compatible   chrome
// @compatible   firefox
// @license      MIT
// @require      https://static.hdslb.com/js/md5.js
// @include      *://www.bilibili.com/video/av*
// @include      *://www.bilibili.com/video/BV*
// @include      *://www.bilibili.com/bangumi/play/ep*
// @include      *://www.bilibili.com/bangumi/play/ss*
// @include      *://m.bilibili.com/bangumi/play/ep*
// @include      *://m.bilibili.com/bangumi/play/ss*
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/movie/*
// @include      *://www.bilibili.com/bangumi/media/md*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @include      https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png*
// @run-at       document-start
// @grant        none
// ==/UserScript==

'use strict';
`.trim()

export default {
    input: path.resolve(__dirname, 'src/main.js'),
    output: {
        banner: userscriptHead,
        file: path.resolve(__dirname, '../../bilibili_bangumi_area_limit_hack.user.js'),
        format: 'esm',
    },
    plugins: [
        scssToString({
            include: '**/*.scss'
        })
    ]
}
