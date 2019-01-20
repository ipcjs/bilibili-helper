// ==UserScript==
// @name         B站缩放视频大小
// @namespace    https://github.com/ipcjs
// @version      0.0.2
// @description  支持缩放B站视频大小
// @author       ipcjs
// @match        https://www.bilibili.com/bangumi/play/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==



// todo: 添加配置页面
// https://www.bilibili.com/bangumi/media/md1239
if (safeGet('unsafeWindow.__INITIAL_STATE__.epInfo.aid') == 31216455) {
    addVideoStyle()
}

function addVideoStyle() {
    console.log(`${GM_info.script.name} addStyle`)
    GM_addStyle(`
    .bilibili-player-video video {
        width: 885px!important;
        margin-left: auto;
        margin-right: auto;
    }
    `)
}

function safeGet(code) {
    return eval(`
    (()=>{
        try{
            return ${code}
        }catch(e){
            console.warn(e.toString())
            return null
        }
    })()
    `)
}