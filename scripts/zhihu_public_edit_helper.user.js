// ==UserScript==
// @name        知乎公共编辑助手
// @description 功能: 全部标记为已读;
// @namespace   https://github.com/ipcjs
// @include     https://www.zhihu.com/watch
// @version     0.0.1
// @grant       none
// ==/UserScript==
(function () {
    function addReadAllButtion() {
        var a = document.createElement('a');
        a.innerText = '（全部标记为已读）';
        a.href = 'javascript:;';
        a.addEventListener('click', function () {
            readAll();
        });
        document.querySelector('div.zu-main-content-inner > h2').appendChild(a);
    }
    function readAll() {
        var btmList = document.querySelectorAll('button.read-button');
        btmList.forEach(function (ele) {
            ele.click();
        });
        // console.log('readAll');
    }
    addReadAllButtion();
})();