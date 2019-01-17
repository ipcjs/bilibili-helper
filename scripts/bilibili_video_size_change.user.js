// ==UserScript==
// @name         B站缩放视频大小
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  支持缩放B站视频大小
// @author       ipcjs
// @match        https://www.bilibili.com/bangumi/play/*
// @grant        GM_addStyle
// ==/UserScript==

// todo: 添加配置页面
GM_addStyle(`
.bilibili-player-video video {
    width: 50%!important;
    margin-left: auto;
    margin-right: auto;
}
`)
