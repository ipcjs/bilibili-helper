// ==UserScript==
// @name         Anitama Visited Link Color
// @namespace    https://github.com/ipcjs
// @version      0.0.2
// @description  阿尼他妈访问过的链接变成灰色
// @author       ipcjs
// @match        *://m.anitama.cn/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

'use strict'
GM_addStyle(`
#list-index a.item:visited > *, 
#lightbox-index a.area-title:visited > *, 
.list-mini a.item:visited > *,
#list-search a.item:visited > *
{
    color: #bbb;
}
`)
