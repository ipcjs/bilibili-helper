// ==UserScript==
// @name         Original Google For Personal Blocklist
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  将使用Personal Blocklist (by Google)后的Google的搜索界面改成原来的样子
// @author       ipcjs
// @include      https://www.google.com/search?*
// @include      https://www.google.com/webhp?*
// @include      https://www.google.co.jp/search?*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
	let css = `.blockLink a {
		opacity: 0;
	}
	.blockLink a:hover {
		opacity: 1;
	}
	.srg div.g.pb {
		margin-bottom: 5px;
	}`;
	let style = document.createElement('style');
	style.innerHTML = css;
	document.querySelector('head').appendChild(style);
})();