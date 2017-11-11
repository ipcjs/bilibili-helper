// ==UserScript==
// @name         Weibo Group Manager Helper
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  微薄分组管理帮助脚本(有bug...)
// @author       ipcjs
// @include        *://weibo.com/p/*/myfollow*
// @include        *://weibo.com/*/follow*
// @grant        none
// @run-at       document-end
// ==/UserScript==

/**
 * 创建元素的快捷方法
 * @param type string, 标签名; 特殊的, 若为text, 则表示创建文字, 对应的t为文字的内容
 * @param props object, 属性; 特殊的属性名有: className, 类名; style, 样式, 值为(样式名, 值)形式的object; event, 值为(事件名, 监听函数)形式的object;
 * @param children array, 子元素;
 */
function _(type, props, children) {
    var elem = null;
    if (type === "text") {
        return document.createTextNode(props);
    } else {
        elem = document.createElement(type);
    }
    for (var n in props) {
        if (n === "style") {
            for (var x in props.style) {
                elem.style[x] = props.style[x];
            }
        } else if (n === "className") {
            elem.className = props[n];
        } else if (n === "event") {
            for (var x in props.event) {
                elem.addEventListener(x, props.event[x]);
            }
        } else {
            elem.setAttribute(n, props[n]);
        }
    }
    if (children) {
        for (var i = 0; i < children.length; i++) {
            if (children[i] != null)
                elem.appendChild(children[i]);
        }
    }
    return elem;
}

function insertInvertSelection() {
    let $menu = document.querySelector('div.opt_bar[node-type=batnavTools] > div.W_fl');
    if (!$menu) {
        log('$menu no found');
        return;
    }
    function onInvertSelectionClick() {
        document.querySelectorAll('.member_wrap').forEach(item => item.click());
    }
    $menu.insertBefore(_('a', { id: 'invert_selection', href: 'javascript:void(0);', event: { click: onInvertSelectionClick } }, [_('text', '[反选]')]), $menu.lastElementChild);
}

function main() {
    let $main = document.getElementById('plc_frame');
    if ($main) {
        new MutationObserver((mutations, observer) => {
            let $invert_selection = document.getElementById('invert_selection');
            if (!$invert_selection) {
                insertInvertSelection();
            }
        }).observe($main, {
            childList: true,
            attributes: false,
            subtree: true
        });
    }

    // window.addEventListener('load', );
}

let log = window.console.log.bind(window.console);
main();