// ==UserScript==
// @name         developer.android.com redirect to lang
// @namespace    https://github.com/ipcjs/
// @version      1.1.2
// @description  Android开发者官网重定向到特定语言
// @author       ipcjs
// @match        https://developer.android.com/*
// @match        https://developer.android.google.cn/*
// @include      http://localhost:8880/*
// @match        https://firebase.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==
const URL_ANDROID = 'developer.android.com'
const URL_ANDROID_CN = 'developer.android.google.cn'
const OptionEnum = Object.freeze({
    DISABLE: {
        value: 0, name: 'disable: 禁用脚本',
        processUrl: null,
        onMenuClicked: null,
    },
    DEFAULT: {
        value: 2, name: 'default: 若不指定则英文',
        processUrl: function (item, url) {
            if (!url.searchParams.get('hl')) {
                url.searchParams.set('hl', 'en')
                item.href = url.href
            }
        },
        onMenuClicked: null,
    },
    NONE: {
        value: 1, name: 'none: 强制不指定语言',
        processUrl: function (item, url) {
            if (url.searchParams.get('hl')) {
                url.searchParams.delete('hl')
                item.href = url.href
            }
        },
        onMenuClicked: createGotoLang(''),
    },
    EN: {
        value: 3, name: 'en: 强制英文',
        processUrl: function (item, url) {
            if (url.searchParams.get('hl') !== 'en') {
                url.searchParams.set('hl', 'en')
                item.href = url.href
            }
        },
        onMenuClicked: createGotoLang('en'),
    },
    ZH: {
        value: 4, name: 'zh: 强制中文',
        processUrl: function (item, url) {
            if (url.searchParams.get('hl') !== 'zh-CN') {
                url.searchParams.set('hl', 'zh-CN')
                item.href = url.href
            }
        },
        onMenuClicked: createGotoLang('zh-CN'),
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

main()

function main() {
    // 引用页面不支持切换多语言, 例如:
    // https://developer.android.com/reference/ 
    // https://firebase.google.com/docs/reference/
    const isReferencePage = location.pathname.startsWith('/reference') || location.pathname.startsWith('/docs/reference')
    if (isReferencePage) {
        GM_registerMenuCommand('(切换语言在当前页面无效)', () => { })
    }
    OptionEnum.values().forEach(it => {
        GM_registerMenuCommand((it === option ? '=>' : '　') + it.name, () => {
            // debugger
            GM_setValue('key_option', it.value)
            if (!it.onMenuClicked) {
                location.reload() // 默认直接刷新
            } else {
                it.onMenuClicked()
            }
        })
    })

    if (isReferencePage) {
        return
    }

    replaceUrlForCacheServer()

    if (option.processUrl) {
        ensureHrefEndWithLang(location)
        window.addEventListener('DOMContentLoaded', (event) => {
            for (let $a of document.querySelectorAll('a')) {
                ensureHrefEndWithLang($a)
            }
        })
    }
}

function ensureHrefEndWithLang(item) {
    if (!item.href) return
    const url = new URL(item.href)
    option.processUrl(item, url)
}

function createGotoLang(lang) {
    return () => {
        const url = new URL(location.href)
        if (lang) {
            url.searchParams.set('hl', lang)
        } else {
            url.searchParams.delete('hl')
        }
        location.href = url.href
    }
}

function replaceUrlForCacheServer() {
    const CACHE_SERVER_HOST = 'localhost:8880'
    const CACHE_SERVER_PROTOCOL = 'http:'
    const isCacheServer = location.host === CACHE_SERVER_HOST
    if (isCacheServer) {
        window.addEventListener('DOMContentLoaded', (event) => {
            for (let $a of document.querySelectorAll('a')) {
                if ($a.host === URL_ANDROID || $a.host === URL_ANDROID_CN) {
                    $a.protocol = CACHE_SERVER_PROTOCOL
                    $a.host = CACHE_SERVER_HOST
                }
            }
        })
    }
}