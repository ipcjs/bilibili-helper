// ==UserScript==
// @name         developer.android.com redirect to lang
// @namespace    https://github.com/ipcjs/
// @version      0.1.2
// @description  Android开发者官网重定向到特定语言
// @author       ipcjs
// @match        https://developer.android.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

'use strict';
const ensureHrefEndWithLang = (item) => {
    if (!item.href) return
    const url = new URL(item.href)
    if (!url.searchParams.get('hl')) {
        url.searchParams.set('hl', 'en')
        item.href = url.href
    }
}
ensureHrefEndWithLang(location)
window.addEventListener('DOMContentLoaded', (event) => {
    for (let $a of document.querySelectorAll('a')) {
        ensureHrefEndWithLang($a)
    }
})