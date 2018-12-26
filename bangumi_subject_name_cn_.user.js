// ==UserScript==
// @name         番组计划主页观看进度中文标题
// @namespace    https://github.com/ipcjs
// @version      0.1.4
// @description  Bangumi番组计划 主页观看进度 中文标题
// @author       ipcjs
// @include      *://bgm.tv/
// @include      *://bangumi.tv/
// @require      https://greasyfork.org/scripts/373283-ipcjs-lib-js/code/ipcjslibjs.js?version=637066
// @require-origin https://raw.githubusercontent.com/ipcjs/bilibili-helper/user.js/ipcjs.lib.js
// @grant        none
// ==/UserScript==


const css = `
.epGird > .tinyHeader {
    display: flex!important;
}
.epGird > .tinyHeader > [data-subject-name] {
    flex: auto;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.epGird > .tinyHeader > * {
    margin-right: 2px;
}
/*
small.grey a {
    font-size: 12px!important;
}
.prg_list a, .prg_list span {
    font-size: 12px!important;
}
*/
`
ipcjs.installInto(({ log, _, html }) => {
    document.head.appendChild(_('style', {}, css))
    const epGrids = document.querySelectorAll('.infoWrapper_tv .epGird')
    // log(epGrids.length, epGrids)
    epGrids.forEach((item) => {
        const $title = item.children[0].children[1]
        const $prg_list = item.children[1]
        const title_cn = $title.getAttribute('data-subject-name-cn')
        if (title_cn) {
            item.insertBefore(
                _('div', { className: 'bsnc-title-cn' }, [
                    _('small', { className: 'grey' }, [
                        _('a', { href: $title.href }, title_cn)
                    ])
                ]), $prg_list)
        }
    })
})


