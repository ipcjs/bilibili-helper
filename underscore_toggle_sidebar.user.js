// ==UserScript==
// @name         Toggle Sidebar For underscorejs.org
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  RT.
// @author       ipcjs
// @include        http://underscorejs.org/
// @include        http://learningcn.com/underscore/
// @grant        none
// @require      https://rawgit.com/jakiestfu/Snap.js/develop/snap.min.js
// ==/UserScript==

(function() {
	'use strict';

	var toggleBtn,
		snapper = new Snap({
			element: document.getElementById('sidebar')
		}),
		container = document.querySelector('body > .container'),
		body = document.querySelector('body');
	snapper.on('open', function(){
		container.style.marginLeft = '0px';
	});
	snapper.on('close', function(){
		container.style.marginLeft = '260px';
	});
	toggleBtn = document.createElement('button');
	toggleBtn.innerText = 'Toggle';
	toggleBtn.style.position = 'fixed';
	toggleBtn.style.left =  '0px';
	toggleBtn.style.top =  '0px';

	body.appendChild(toggleBtn);
	toggleBtn.addEventListener('click', function(){
		if( snapper.state().state=="right" ){
			snapper.close();
		} else {
			snapper.open('right');
		}

	});
})();