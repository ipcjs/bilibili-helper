// ==UserScript==
// @name         番组计划主页观看进度中文标题
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  番组计划主页观看进度中文标题
// @author       ipcjs
// @include      https://bgm.tv/
// @include      https://bangumi.tv/
// @grant        none
// ==/UserScript==

const log = console.log.bind(window)
const epGrids = document.querySelectorAll('.infoWrapper_tv .epGird')
// debugger
log(epGrids)
