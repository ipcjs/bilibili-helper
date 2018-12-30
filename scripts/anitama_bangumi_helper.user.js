// ==UserScript==
// @name        Anitama追番助手
// @description 添加显示/隐藏未关注的条目的功能
// @namespace   https://github.com/ipcjs
// @include     http://www.anitama.cn/bangumi
// @version     0.0.1
// @grant       GM_addStyle
// @grant       unsafeWindow
// @run-at      document-idle
// ==/UserScript==
'use strict';
function log(...args) {
    console.log(...args);
}

function $$(ele) {
    return new ElePlus(ele);
}

class ElePlus {
    constructor(ele) {
        this.ele = ele;
    }
    hasClass(name) {
        return this.ele.className.includes(name);
    }
    removeClass(name) {
        let list = this.ele.className.split(/ +/);
        let index = list.indexOf(name);
        if (index != -1) {
            list.splice(index, 1);
            this.ele.className = list.join(' ');
        }
        return this;
    }
    addClass(name) {
        this.ele.className = `${this.ele.className} ${name}`;
        return this;
    }
    toggleClass(name) {
        this.hasClass(name) ? this.removeClass(name) : this.addClass(name);
        return this;
    }
    on(eventName, listener) {
        this.ele.addEventListener(eventName, (...args) => {
            listener.apply(this.ele, args);
        });
        return this;
    }
    text(value) {
        if (value === undefined) {
            return this.ele.innerText;
        } else {
            this.ele.innerText = value;
            return this;
        }
    }
    html(value) {
        if (value === undefined) {
            return this.ele.innerHTML;
        } else {
            this.ele.innerHTML = value;
            return this;
        }
    }
}

function main() {
    log('main()', document.readyState);
    GM_addStyle(`
        #area-bottom-bangumi .inner > .no-watch {
            display: none;
        }
        #area-bottom-bangumi.show-no-watch .inner > .no-watch {
            display: inline-block;
        }
        #btn-toggle-bangumi.toggle-no-watch:after {
            content: '显示所有';
        }
        #btn-toggle-bangumi.toggle-no-watch.active:after {
            content: '隐藏未关注';
        }
    `);

    // 当前Anitama[关注]和[已看]显示反了, 却[已看]功能有问题
    // 故当前查找的btm-mark-bangumi是[已看]按钮, [关注]按钮的class是btn-listen-bangumi
    [...document.querySelectorAll('.btn-mark-bangumi')]
        .filter(ele => !(ele.className.includes('active')))
        .map(ele => ele.parentElement.parentElement.parentElement)
        .forEach(ele => {
            $$(ele).addClass('no-watch');
        });

    // 添加[显/隐未关注]按钮
    let toggle = document.querySelector('#btn-toggle-bangumi');
    let toggleNoWatch = toggle.cloneNode();
    $$(toggleNoWatch).addClass('toggle-no-watch').on('click', function () {
        $$(this).toggleClass('active');
        $$(document.getElementById('area-bottom-bangumi')).toggleClass('show-no-watch');
    });
    toggle.parentElement.insertBefore(toggleNoWatch, toggle);
}

log(`run: [${GM_info.script.name}]`, document.readyState, navigator.userAgent);
if (navigator.userAgent.includes('Firefox/')) {
    // main();
    window.onload = main;
} else {// Chrome And Other
    unsafeWindow.onload = main;
}