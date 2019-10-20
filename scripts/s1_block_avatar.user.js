// ==UserScript==
// @name        S1屏蔽头像
// @namespace   https://github.com/ipcjs
// @version     0.0.1
// @description 有些头像实在是太晃眼了（
// @author       ipcjs
// @include     *://bbs.saraba1st.com/2b/thread-*-*-*.html
// @include     *://bbs.saraba1st.com/2b/forum.php*
// @grant       GM_addStyle
// @grant       unsafeWindow
// @require  https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// ==/UserScript==

/** uid列表, 点到用户信息里面可以看到 */
const uids = [
    '511411',
]
uids.forEach(uid=>{
    /** @type {HTMLElement[]} */
    const $avatarList = document.querySelectorAll(`.avatar > a[href="space-uid-${uid}.html"] > img`)
    Array.from($avatarList).forEach($avatar=>{
        $avatar.src = 'https://avatar.saraba1st.com/images/noavatar_middle.gif'
    })
})