// ==UserScript==
// @name         解除B站区域限制.dev
// @namespace    http://tampermonkey.net/
// @version      8.3.7
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
// @include      *://www.bilibili.com/watchroom/*
// @include      *://space.bilibili.com/*
// @include      https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png*
// @run-at       document-start
// @grant        none
// @require      file:///C:/GitHub/bilibili-helper/scripts/bilibili_bangumi_area_limit_hack.user.js
// ==/UserScript==

`使用@require的方式执行本地磁盘中的脚本, 达到使用外部编辑器编辑脚本的目的`;
console.log(`${GM_info.script.name} running`);