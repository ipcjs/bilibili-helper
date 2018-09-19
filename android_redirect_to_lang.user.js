// ==UserScript==
// @name         developer.android.com redirect to lang
// @namespace    https://github.com/ipcjs/
// @version      1.0.0
// @description  Android开发者官网重定向到特定语言
// @author       ipcjs
// @include      https://developer.android.com/*
// @include      https://firebase.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==

'use strict';
const OptionEnum = Object.freeze({
    DISABLE: {
        value: 0, name: 'disable: 禁用脚本',
        processUrl: null
    },
    DEFAULT: {
        value: 2, name: 'default: 若不指定则英文',
        processUrl: function (item, url) {
            if (!url.searchParams.get('hl')) {
                url.searchParams.set('hl', 'en')
                item.href = url.href
            }
        }
    },
    NONE: {
        value: 1, name: 'none: 强制不指定语言',
        processUrl: function (item, url) {
            if (url.searchParams.get('hl')) {
                url.searchParams.delete('hl')
                item.href = url.href
            }
        }
    },
    EN: {
        value: 3, name: 'en: 强制英文',
        processUrl: function (item, url) {
            if (url.searchParams.get('hl') !== 'en') {
                url.searchParams.set('hl', 'en')
                item.href = url.href
            }
        }
    },
    ZH: {
        value: 4, name: 'zh: 强制中文',
        processUrl: function (item, url) {
            if (url.searchParams.get('hl') !== 'zh-CN') {
                url.searchParams.set('hl', 'zh-CN')
                item.href = url.href
            }
        }
    },
    values: function () {
        return Object.values(this).filter(it => it.value !== undefined)
    },
    valueOf: function (value) {
        for (let option of this.values()) {
            if (option.value === +value) {
                return option
            }
        }
        return null
    }
})

let option = OptionEnum.valueOf(GM_getValue('key_option', OptionEnum.DEFAULT.value))

console.log(`option: ${JSON.stringify(option)}`)

OptionEnum.values().forEach(it => {
    GM_registerMenuCommand((it === option ? '=>' : '　') + it.name, () => {
        // debugger
        GM_setValue('key_option', it.value)
        location.reload()
    })
})

if (!option.processUrl) {
    return
}

const ensureHrefEndWithLang = (item) => {
    if (!item.href) return
    const url = new URL(item.href)
    option.processUrl(item, url)
}
ensureHrefEndWithLang(location)
window.addEventListener('DOMContentLoaded', (event) => {
    for (let $a of document.querySelectorAll('a')) {
        ensureHrefEndWithLang($a)
    }
})