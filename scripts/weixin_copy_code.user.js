// ==UserScript==
// @name         Copy Code in WeiXin
// @namespace    https://github.com/ipcjs/
// @version      0.0.1
// @description  RT
// @author       ipcjs
// @match        https://mp.weixin.qq.com/s?*
// @require https://greasyfork.org/scripts/373283-ipcjs-lib-js/code/ipcjslibjs.js?version=647820
// @grant        none
// ==/UserScript==

const util_ui_copy = function (text, textarea) {
    textarea.value = text
    textarea.select()
    try {
        return document.execCommand('copy')
    } catch (e) {
        util_error('复制文本出错', e)
    }
    return false
}

function main({ _, log }) {
    log('mp weixin')
    document.head.appendChild(_('style', {}, [_('text', `
        pre::before {
            content: "copy";
            pointer-events: auto;
            position: absolute;
            right: 4px;
        }
        pre {
            pointer-events: none;
        }
    `)]))
    const $textarea = document.body.appendChild(_('textarea', { style: { display: 'none' } }))
    const $pre = Array.from(document.querySelectorAll('pre'))
    $pre.forEach((el) => {
        el.addEventListener('click', (event) => {
            $textarea.style.display = ''
            const text = Array.from(el.querySelectorAll('li')).map(el => el.innerText.replace(/\n/g, '')).join('\n')
            util_ui_copy(text, $textarea)
            $textarea.style.display = 'none'
        })
    })
}

window.ipcjs.installInto(main)
