// ==UserScript==
// @name         Anitama Visited Link Color
// @namespace    https://github.com/ipcjs
// @version      0.0.2
// @description  阿尼他妈访问过的链接变成灰色
// @author       ipcjs
// @match        *://m.anitama.cn/*
// @grant        GM_addStyle
// @grant        GM.addStyle
// @run-at       document-start
// @require  https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

'use strict'
GM.addStyle(`
#list-index a.item:visited > *, 
#lightbox-index a.area-title:visited > *, 
.list-mini a.item:visited > *,
#list-search a.item:visited > *
{
    color: #bbb;
}
`)
