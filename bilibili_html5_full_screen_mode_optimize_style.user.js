// ==UserScript==
// @name         Bilibili HTML5播放器网页全屏模式优化 脚本版
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  移植自：http://userstyles.org/styles/131642
// @author       ipcjs
// @include      *://www.bilibili.com/video/av*
// @include      *://www.bilibili.com/bangumi/play/*
// @include      *://www.bilibili.com/html/html5player.html*
// @include      *://www.bilibili.com/blackboard/player.html*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @include      *://www.bilibili.com/blackboard/html5playerbeta.html*
// @include      *://www.bilibili.com/watchlater/*
// @grant        none
// ==/UserScript==

'use strict'
const OLD_CSS = `
@namespace url(http://www.w3.org/1999/xhtml);
#bilibiliPlayer.mode-fullscreen .bilibili-player-video-sendbar {
    transition: 0.2s;
    opacity: 0!important;
}
#bilibiliPlayer.mode-fullscreen .bilibili-player-video-sendbar:hover {
    opacity: 1!important;
}
#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-wrap{
    height:100%!important;
    width:100%!important;
  }

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-control{
    /*display: block;*/
    opacity: 0!important;
    transition: 0.2s;
    position:absolute;
    bottom:0px;
}
#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-control:hover{
    /*opacity: 0.7!important; */
    opacity: 1!important;
}

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-sendbar{
    /*display: block;*/
    opacity: 0!important;
    transition: 0.2s;
    position:absolute;
    top:0px;
    width:100%!important;
}

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-sendbar:hover{
    /*opacity: 0.8!important; */
    opacity: 1!important;
}

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-sendbar .bilibili-player-mode-selection-container{
    height:120px;
    border-radius: 5px;
    top:100%;
}

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-sendbar .bilibili-player-color-picker-container{
    height:208px;
    border-radius: 5px;
    top:100%;
}

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-info-container{
    top:40px;
}

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-float-lastplay{
    bottom:30px;
}`

const NEW_CSS = `
#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-control-wrap,
#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-top,
#bilibiliPlayer.mode-fullscreen .bilibili-player-video-control-wrap,
#bilibiliPlayer.mode-fullscreen .bilibili-player-video-top
{
    opacity: 0!important;
    transition: 0.2s;
}

#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-control-wrap:hover,
#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-top:hover,
#bilibiliPlayer.mode-fullscreen .bilibili-player-video-control-wrap:hover,
#bilibiliPlayer.mode-fullscreen .bilibili-player-video-top:hover
{
    opacity: 1!important;
}
#bilibiliPlayer.mode-webfullscreen .bilibili-player-video-top,
#bilibiliPlayer.mode-fullscreen .bilibili-player-video-top
{
    pointer-events: inherit!important;
}

`
function addStyle(css) {
    let style = document.createElement('style')
    style.innerHTML = css
    document.querySelector('head').appendChild(style)
}

let isNewPlayer = document.querySelector('#entryOld > .old-btn > a, .entry-old > .btn-old') // 回到老版按钮
    || !document.querySelector('.new-entry > .btn') // 试用新版按钮
console.log(`isNewPlayer: ${isNewPlayer}`)
addStyle(isNewPlayer ? NEW_CSS : OLD_CSS)

