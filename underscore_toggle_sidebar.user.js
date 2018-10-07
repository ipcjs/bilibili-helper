// ==UserScript==
// @name         Toggle Sidebar For underscorejs.org & liaoxuefeng
// @namespace    https://tampermonkey.net/
// @version      0.9.3
// @description  RT.
// @author       ipcjs
// @include      https://underscorejs.org/
// @include      http://learningcn.com/underscore/
// @include      http://www.liaoxuefeng.com/wiki/*
// @include      https://www.liaoxuefeng.com/wiki/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/snap.js/1.9.3/snap.min.js
// ==/UserScript==

(function () {
    'use strict';

    var defaultConfig = {
        sidebar: '#sidebar', container: 'body > .container', // element selector
        maxPosition: 266, minPosition: -266, // Snap setting
        top: '0px', width: '200px', // sidebar attr
        marginLeft: '260px', // container attr
        func: null // to run funcation
    }, configMap = {
        'underscorejs.org': defaultConfig,
        'learningcn.com': defaultConfig,
        'www.liaoxuefeng.com': {
            sidebar: '#main .x-sidebar-left', container: '#main .x-center',
            maxPosition: 270, minPosition: -270,
            top: '48px', width: '216px',
            marginLeft: '220px',
            func: function () {
                document.querySelector('#footer').style.display = 'none';
                var id = window.location.pathname.split('/').reverse()[0];
                $(sidebar).scrollTop($('#' + id).offset().top - $(sidebar).offset().top);
            }
        }
    }, config = configMap[location.host];

    var toggleBtn,
        sidebar = document.querySelector(config.sidebar),
        container = document.querySelector(config.container),
        snapper = new Snap({
            element: sidebar,
            maxPosition: config.maxPosition,
            minPosition: config.minPosition
        }),
        body = document.querySelector('body'),
        marginLeft = container.style.marginLeft,
        position = container.style.position;
    console.log(sidebar, container);

    /* set container attr */
    container.style.marginLeft = config.marginLeft;
    snapper.on('open', function () { // to close...
        container.style.marginLeft = '0px';
        container.style.position = 'absolute';
    });
    snapper.on('close', function () { // to open...
        // container.style.marginLeft = config.maxPosition;
        // container.style.marginLeft = marginLeft;
        container.style.marginLeft = config.marginLeft;
        container.style.position = position;
    });

    /* set sidebar attr */
    sidebar.style.display = 'block';
    sidebar.style.width = config.width;
    sidebar.style.float = 'left';
    sidebar.style.overflowY = 'auto';
    sidebar.style.top = config.top;
    sidebar.style.bottom = '0px';
    sidebar.style.position = 'fixed';
    sidebar.className += ' hide-scrollbar-ipcjs';

    /* set toggleBtn attr */
    toggleBtn = document.createElement('a');
    toggleBtn.id = 'toggle_btn';
    toggleBtn.innerText = '>';
    body.appendChild(toggleBtn);
    toggleBtn.addEventListener('click', function () {
        if (snapper.state().state == "right") {
            snapper.close();
        } else {
            snapper.open('right');
        }

    });

    /* other */
    config.func && config.func();
    let style = document.createElement('style');
    style.innerHTML = `
/* css.start */
#toggle_btn {
    position: fixed;
    left: 0px;
    top: 0px;
    z-index: 1000;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background-color: transparent;
    text-align: center;
    color: black;
    line-height: 25px;
}
#toggle_btn:hover {
    background-color: black;
    color: white;
    text-decoration: none;
}
pre .comment {
    font-style: normal;
}
.hide-scrollbar-ipcjs::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}
.hide-scrollbar-ipcjs::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 5px;
}
.hide-scrollbar-ipcjs:hover::-webkit-scrollbar-thumb {
    background: #f1f1f1;
}
/* css.end */
    `;
    document.querySelector('head').appendChild(style);

    /* auto show/hide sidebar */
    window.addEventListener('resize', resetSnap);
    resetSnap();
    function resetSnap() {
        if (window.innerWidth < 768) {
            snapper.open('right'); // open() to close...
        } else {
            snapper.close(); // close() to open...
        }
    }
})();
