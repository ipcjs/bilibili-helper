// ==UserScript==
// @name        Evernote Web Mobile
// @namespace   https://github.com/ipcjs
// @version     0.0.1
// @description Evernote Web Mobile
// @author      ipcjs
// @include     https://www.evernote.com/Home.action*
// @grant       GM_addStyle
// @grant       unsafeWindow
// ==/UserScript==

// type, props, children
// type, props, innerHTML
// 'text', text
// html
const util_ui_element_creator = (type, props, children) => {
    let elem = null;
    if (type === "text") {
        return document.createTextNode(props);
    } else if (/^\w+$/.test(type)) {
        elem = document.createElement(type);
    } else {
        let template = util_ui_element_creator('template');
        template.innerHTML = type.trim()
        return template.content.firstChild;
    }
    for (let n in props) {
        if (n === "style") {
            for (let x in props.style) {
                elem.style[x] = props.style[x];
            }
        } else if (n === "className") {
            elem.className = props[n];
        } else if (n === "event") {
            for (let x in props.event) {
                elem.addEventListener(x, props.event[x]);
            }
        } else {
            elem.setAttribute(n, props[n]);
        }
    }
    if (children) {
        if (typeof children === 'string') {
            elem.innerHTML = children;
        } else {
            for (let i = 0; i < children.length; i++) {
                if (children[i] != null)
                    elem.appendChild(children[i]);
            }
        }
    }
    return elem;
}
const _ = util_ui_element_creator

const style = `
/*
.GJDCG5CG5B, .GJDCG5CA5B {
    margin-bottom: 0px!important;
}
*/
#gwt-debug-sidebar {
    overflow-y: scroll;
    overflow-x: hidden;
}
.GJDCG5CP3B {
    position: fixed!important;
}
`

function main() {
    document.head.appendChild(_('<meta name="viewport" content="width=device-width,initial-scale=1, minimum-scale=1,maximum-scale=1,user-scalable=no" />'))
    GM_addStyle(style)
}

main()
