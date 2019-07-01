// ==UserScript==
// @name         Better CSDN
// @namespace    https://github.com/ipcjs
// @version      0.1.2
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
@media (max-width: 960px){
    aside {
        display: none!important;
    }
    .container, main {
        width: 100%!important;
    }
    body {
        min-width: 0px!important;
    }
}
`)
$("div.article_content").removeAttr("style")
$(".btn-readmore").parent().remove()