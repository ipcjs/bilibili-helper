// ==UserScript==
// @name         Better CSDN
// @namespace    https://github.com/ipcjs
// @version      0.1.0
// @description  The Better CSDN
// @author       ipcjs
// @match        https://blog.csdn.net/*
// @grant        GM_addStyle
// ==/UserScript==

'use strict';
GM_addStyle(`
.tool-box > .meau-list {
    display: none;
}
`)

$("div.article_content").removeAttr("style")
$("#btn-readmore").parent().remove()
