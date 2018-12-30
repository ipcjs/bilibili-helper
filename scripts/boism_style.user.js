// ==UserScript==
// @name         Boism Style
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  目前黑白两条Bar太丑的, 实在看不下去
// @author       ipcjs
// @match        https://boism.org/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

'use strict';

let css = `
#header > .content-wrapper {
	display: none;
}

#header {
    background: none!important;
}`;

GM_addStyle(css);