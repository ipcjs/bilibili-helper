// ==UserScript==
// @name         Switch language button for tour.golang.org
// @namespace    https://github.com/ipcjs/
// @version      0.1
// @description  给页面添加一个切换中/英文的按钮
// @author       ipcjs
// @match        https://tour.golang.org/*
// @match        https://tour.go-zh.org/*
// @grant        none
// ==/UserScript==

const hosts = [
    "tour.golang.org",
    "tour.go-zh.org",
]


function getNextHost() {
    const index = hosts.indexOf(location.host)
    return hosts[(index + 1) % hosts.length]
}


const $div = document.createElement('div')

$div.innerHTML = `<span class="nav" title="左键当前页面打开, 右键新页面打开">
    <svg height="100%" viewBox="0 0 24 24" width="100%">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>
</span>`
$div.addEventListener('click', () => {
    location.host = getNextHost()
})
$div.addEventListener('contextmenu', () => {
    const url = new URL(location.href)
    url.host = getNextHost()
    window.open(url)
})
const $topBar = document.querySelector('.top-bar')
$topBar.appendChild($div)