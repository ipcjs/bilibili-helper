// ==UserScript==
// @name         Gray Filter Cleaner
// @namespace    https://github.com/ipcjs/
// @version      0.0.1
// @description  Gray Filter Cleaner
// @author       ipcjs
// @include      *://*/*
// @exclude      https://*.google.com/*
// @exclude      https://twitter.com/*
// @exclude      https://*.facebook.com/*
// @exclude      https://*.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

GM_addStyle(`
* {
    filter: none!important;
}
`)