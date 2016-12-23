// ==UserScript==
// @name         Toggle Sidebar For underscorejs.org & liaoxuefeng
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  RT.
// @author       ipcjs
// @include      http://underscorejs.org/
// @include      http://learningcn.com/underscore/
// @include      http://www.liaoxuefeng.com/wiki/*
// @grant        none
// @require      https://rawgit.com/jakiestfu/Snap.js/develop/snap.min.js
// ==/UserScript==

(function() {
	'use strict';

	var  defaultConfig = {
		sidebar: '#sidebar', container: 'body > .container',
		maxPosition: 266, minPosition: -266,
		top: '0px', width: '200px',
		marginLeft: '260px',
		func: null
	}, configMap = {
		'underscorejs.org': defaultConfig,
		'learningcn.com': defaultConfig,
		'www.liaoxuefeng.com': {
			sidebar: '#main .x-sidebar-left', container: '#main .x-center', 
			maxPosition: 270, minPosition: -270,
			top: '48px', width: '216px',
			marginLeft: '216px', 
			func: function(){
				document.querySelector('#footer').style.display = 'none';
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
	snapper.on('open', function(){ // to close...
		container.style.marginLeft = '0px';
		container.style.position = 'absolute';
	});
	snapper.on('close', function(){ // to open...
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

	/* set toggleBtn attr */
	toggleBtn = document.createElement('button');
	toggleBtn.innerText = 'Toggle';
	toggleBtn.style.position = 'fixed';
	toggleBtn.style.left =  '0px';
	toggleBtn.style.top =  '0px';
	toggleBtn.style.zIndex = 1000;
	body.appendChild(toggleBtn);
	toggleBtn.addEventListener('click', function(){
		if( snapper.state().state=="right" ){
			snapper.close();
		} else {
			snapper.open('right');
		}

	});
	config.func && config.func();
})();