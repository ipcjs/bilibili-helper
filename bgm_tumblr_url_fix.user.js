// ==UserScript==
// @name         Fix image url from Tumblr for BGM
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  修复BGM中@vince19发布的来自Tumblr的外链图片的URL(-_-#)
// @author       ipcjs
// @include      http://bgm.tv/ep/*
// @include      http://bangumi.tv/ep/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    var
        NEW_SERVER_NUM = '68',
        REG = /^(https?:\/\/)(\d+)(\.media\.tumblr\.com\/.*)$/,
        imgList = document.querySelectorAll('img.code');
    imgList.forEach(function (item, index) {
        item.src = item.src.replace(REG, '$1' + NEW_SERVER_NUM + '$3');
    });
    // console.log(imgList);
})();