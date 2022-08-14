// ==UserScript==
// @name         Disable WakeLock for Twitter
// @namespace    https://github.com/ipcjs
// @version      0.1
// @description  Prevent Twitter from blocking system hibernation by preventing videos from looping. (Translated by DeepL)
// @author       ipcjs
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

new MutationObserver((mutations, observer) => {
    for (const m of mutations) {
        for (const node of m.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                /** @type {HTMLVideoElement[]} */
                const videos = Array.from((node).querySelectorAll('video'))
                for (const video of videos) {
                    // console.log('video', m.type, video)
                    video.addEventListener('seeked', function (ev) {
                        // console.log('seeked', ev, this.currentTime)
                        // Twitter的自动循环播放功能, seek的位置一般在0.02以下
                        if (this.currentTime < 0.02) {
                            console.debug('prevent looping', this)
                            this.pause()
                        }
                    })
                }
            }
        }
    }
}).observe(document.documentElement, {
    childList: true,
    subtree: true,
})
