// ==UserScript==
// @name         解除B站区域限制.local
// @namespace    http://tampermonkey.net/
// @version      6.0.0
// @description  通过替换获取视频地址接口的方式, 实现解除B站区域限制; 只对HTML5播放器生效; 只支持番剧视频;
// @author       ipcjs
// @require      https://static.hdslb.com/js/md5.js
// @include      *://www.bilibili.com/video/av*
// @include      *://www.bilibili.com/bangumi/play/ep*
// @include      *://www.bilibili.com/bangumi/play/ss*
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/movie/*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @include      *://www.bilibili.com/blackboard/html5playerbeta.html*
// @run-at       document-start
// @grant        none
// @require      file:///C:/GitHub/bilibili-helper-ipcjs/bilibili_bangumi_area_limit_hack.user.js
// ==/UserScript==

`使用@require的方式执行本地磁盘中的脚本, 达到使用外部编辑器编辑脚本的目的`;
console.log(`${GM_info.script.name} running`);