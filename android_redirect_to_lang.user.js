// ==UserScript==
// @name         developer.android.com redirect to lang
// @namespace    https://github.com/ipcjs/
// @version      0.1
// @description  Android开发者官网重定向到特定语言
// @author       ipcjs
// @match        https://developer.android.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

'use strict';

const url = new URL(location.href)
if(!url.searchParams.get('hl')){
    url.searchParams.set('hl', 'en')
    location.href = url.href
}