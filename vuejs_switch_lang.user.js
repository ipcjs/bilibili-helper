// ==UserScript==
// @name         Language Switch for vuejs.org
// @namespace    https://github.com/ipcjs
// @version      0.1
// @description  try to take over the world!
// @author       ipcjs
// @match        https://*.vuejs.org/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';
	$('.nav-dropdown-container.language > ul > li > a').click(function(event){
		event.preventDefault();
		location.host = new URL($(this).attr('href')).host;
	});
})();