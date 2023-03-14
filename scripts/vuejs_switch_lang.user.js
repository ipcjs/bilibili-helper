// ==UserScript==
// @name         Language Switch for vuejs.org
// @namespace    https://github.com/ipcjs
// @version      0.2
// @description  try to take over the world!
// @author       ipcjs
// @match        https://*.vuejs.org/*
// @match        https://*.vitejs.dev/*
// @grant        GM_registerMenuCommand
// ==/UserScript==
// @ts-check

/** @param {string} selector */
function generateMenuFromHrefAttribute(selector) {
    return Array.from(document.querySelectorAll(selector)).map(it => ({
        title: it.textContent,
        host: new URL(
            /**@type {any}*/(it).href
            ?? /**@type {any}*/(it.attributes).href.value
        ).host,
    }))
}

/**
 * @typedef {object} MenuItem
 * @property {string|null} title
 * @property {string|function=} host
 * @property {string|function=} pathname
 * @property {function=} onClick
 */

/** @type {Object.<string, (()=>MenuItem[]) | null>} */
const hosts = {
    '^v2(\\.\\w+)?\\.vuejs\\.org$': () => generateMenuFromHrefAttribute('.nav-dropdown-container.language > ul > li > a'),
    'v3-migration.vuejs.org': () => {
        const items = /**@type {HTMLLinkElement[]} */(Array.from(document.querySelectorAll('.VPNavBarExtra a.VPLink'))).map((it) => ({
            title: it.textContent,
            prefix: new URL(it.href).pathname,
            element: it,
        }))
        return items.map(item => ({
            title: item.title,
            onClick: () => {
                const url = new URL(location.href)
                let realPathname = items
                    // 尝试用每个prefix去截取当前pathname
                    .map(it => location.pathname.indexOf(it.prefix) === 0 ? location.pathname.substring(it.prefix.length) : null)
                    // 取出里面最短的, 就是真是的pathname
                    .reduce((prev, curr) => curr == null || (prev != null && curr.length > prev.length) ? prev : curr, null)
                if (realPathname) {
                    // 实际使用的pathname前面还要拼接上prefix
                    url.pathname = item.prefix + realPathname
                }
                // 修改元素的href, 触发点击后, 就会路由到指定url
                item.element.href = url.href
                return item.element.click()
            },
        }))
    },
    'vuejs.org': () => generateMenuFromHrefAttribute('.vt-locales-menu-item-text[href]'),
    'vitejs.dev': null, // 使用默认策略
    // 默认策略
    '': () => generateMenuFromHrefAttribute('.VPNavBarExtra a.VPLink')
}
for (const host in hosts) {
    const currentHost = document.location.host
    if (host.startsWith('^') //
        ? new RegExp(host).test(currentHost)//
        : currentHost.endsWith(host)) {
        const items = hosts[host]?.()
        if (items) {
            console.log('menus:', host, items)
            items.forEach((it) => {
                GM_registerMenuCommand(it.title ?? '', () => {
                    if (it.onClick) {
                        it.onClick()
                        return
                    }
                    if (it.host) {
                        location.host = typeof it.host === 'function' ? it.host() : it.host
                    }
                    if (it.pathname) {
                        location.pathname = typeof it.pathname === 'function' ? it.pathname() : it.pathname
                    }
                })
            })
            break;
        }

    }
}
