// ==UserScript==
// @name         Bangumi Domain Redirector
// @namespace    https://github.com/ipcjs
// @description  RT; Refurbished from https://greasyfork.org/en/scripts/12803
// @name:zh-CN   番组计划域名重定向
// @description:zh-CN 重定向番组计划(Bangumi)域名; 改造自 https://greasyfork.org/zh-CN/scripts/12803
// @author       ipcjs
// @compatible   chrome
// @compatible   firefox
// @license      MIT
// @version      0.1.0
// @include      *://bgm.tv/*
// @include      *://*.bgm.tv/*
// @include      *://chii.in/*
// @include      *://*.chii.in/*
// @include      *://bangumi.tv/*
// @include      *://*.bangumi.tv/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==
'use strict'
const hosts = {
    bgm: { https: true, host: 'bgm.tv' },
    bangumi: { https: false, host: 'bangumi.tv' },
    chii: { https: false, host: 'chii.in' },
}
let targetHost = hosts[GM_getValue('host-name') || 'bgm']
const menuIds = []
const rebuildMenus = () => {
    for (let menuId of menuIds) {
        GM_unregisterMenuCommand(menuId)
    }
    menuIds.length = 0
    for (let name of Object.keys(hosts)) {
        let host = hosts[name]
        menuIds.push(GM_registerMenuCommand(`${host === targetHost ? '=> ' : ''}http${host.https ? 's' : ''}://${host.host}`, () => {
            GM_setValue('host-name', name)
            // 直接刷新界面, 就没有重建菜单的必要了...
            const refresh = true
            if (refresh) {
                window.location.reload()
            } else {
                targetHost = host
                rebuildMenus()
            }
        }))
    }
}
rebuildMenus()

if (!window.location.hostname.endsWith(targetHost.host)) {
    const url = location.href.replace(/https?:\/\/(.*\.?)(bgm\.tv|bangumi\.tv|chii\.in)(.*)/, `http${targetHost.https ? 's' : ''}://$1${targetHost.host}$3`)
    console.log(`${location.href} => ${url}`)
    window.location.href = url
}
