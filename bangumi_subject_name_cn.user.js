// ==UserScript==
// @name         番组计划主页观看进度中文标题
// @namespace    https://github.com/ipcjs
// @version      0.0.3
// @description  番组计划主页观看进度中文标题
// @author       ipcjs
// @include      https://bgm.tv/
// @include      https://bangumi.tv/
// @require      https://raw.githubusercontent.com/ipcjs/bilibili-helper/user.js/ipcjs.lib.js
// @grant        none
// ==/UserScript==

ipcjs.installInto(({ log, _, html }) => {
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


