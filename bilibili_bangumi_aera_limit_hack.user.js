// ==UserScript==
// @name         解除B站区域限制
// @namespace    http://tampermonkey.net/
// @version      2.2.2
// @description  把获取视频地址相关接口的返回值替换成我的反向代理服务器的返回值; 因为替换值的操作是同步的, 所有会卡几下..., 普通视频不受影响; 我的服务器有点渣, 没获取成功请多刷新几下; 当前只支持bangumi.bilibili.com域名下的番剧视频;
// @author       ipcjs
// @include      *://bangumi.bilibili.com/anime/*
// @include      *://bangumi.bilibili.com/anime/v/*
// @include      *://www.bilibili.com/html/html5player.html*
// @include      *://www.bilibili.com/blackboard/html5player.html*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * 把获取视频地址相关接口的返回值替换成biliplus的接口的返回值,
 * 因为替换值的操作是同步的, 所有会卡几下..., 又因为biliplus的接口不支持跨域请求, 所以使用了我自己的服务器做反向代理(-_-#);
 * 源码仓库: https://github.com/ipcjs/bilibili-helper/tree/user.js
 */

(function () {
    'use strict';
    var biliplusHost = getCookie('bangumi_aera_limit_hack_server'); // 优先从cookie中读取服务器地址
    var i_am_a_big_member_who_is_permanently_banned = getCookie('bangumi_aera_limit_hack_blocked_forever'); // "我是一位被永久封号的大会员"(by Google翻译)
    if (!biliplusHost) {
        biliplusHost = 'http://biliplus.ipcjsdev.tk'; // 我的反向代理服务器
        // biliplusHost = 'https://www.biliplus.com'; // 支持https的服务器
    }

    console.log('[' + GM_info.script.name + '] run on: ' + window.location.href);
    if (!window.jQuery) { // 若还未加载jQuery, 则监听
        var jQuery;
        Object.defineProperty(window, 'jQuery', {
            configurable: true, enumerable: true, set: function (v) {
                jQuery = v;
                injectDataFilter();// 设置jQuery后, 立即注入
            }, get: function () {
                return jQuery;
            }
        });
    } else {
        injectDataFilter();
    }

    function injectDataFilter() {
        window.jQuery.ajaxSetup({
            dataFilter: function (data, type) {
                var json, obj, group, params, curIndex, aid;
                // console.log(arguments, this);
                if (this.url.startsWith(window.location.protocol + '//bangumi.bilibili.com/web_api/season_area')) {
                    // 番剧页面是否要隐藏番剧列表 API
                    console.log(data);
                    json = JSON.parse(data);
                    // 限制区域时的data为:
                    // {"code":0,"message":"success","result":{"play":0}}
                    if (json.code === 0 && json.result && json.result.play === 0) {
                        json.result.play = 1; // 改成1就能够显示
                        data = JSON.stringify(json);
                        console.log('==>', data);
                    }
                }
                return data;
            }
        });
        /*
        {"code":0,"message":"success","result":{"aid":9854952,"cid":16292628,"episode_status":2,"payment":{"price":"0"},"player":"vupload","pre_ad":0,"season_status":2}}
        */
        var originalAjax = $.ajax;
        $.ajax = function(param){
        	if( param.url.match('/web_api/get_source') ){
        		param.url=biliplusHost+'/api/bangumi?season=' + window.season_id;
        		param.type='GET';
        		delete param.data;
        		var oriSuccess=param.success;
        		param.success = function(data){
        			var found=null;
        			for(var i=0;i < data.result.episodes.length;i++){
        				if(data.result.episodes[i].episode_id == window.episode_id){
        					found=data.result.episodes[i];
        				}
        			}
        			var returnVal = found!=null ? {
	        			"code":0,
	        			"message":"success",
	        			"result":{
	        				"aid":found.av_id,
	        				"cid":found.danmaku,
	        				"episode_status":found.episode_status,
	        				"payment":{"price":"0"},
	        				"player":"vupload",
	        				"pre_ad":0,
	        				"season_status":data.result.season_status
	        			}
	        		} : {
        				code:-404,
        				message:'不存在该剧集'
        			};
        			console.log('[' + GM_info.script.name + '] Replaced request: get_source',returnVal);
        			oriSuccess(returnVal);
        		}
        		return originalAjax.apply(this,[param])
        	}else if( param.url.match('/player/web_api/playurl') ){
        		param.url = biliplusHost+'/BPplayurl.php?'+param.url.split('?')[1].replace(/cid=\d+/,function(s){return s+'|bangumii'});
        		console.log('[' + GM_info.script.name + '] Redirected request: bangumi playurl -> ',param.url);
        		return originalAjax.apply(this,[param]);
        	}else{
        		return originalAjax.apply(this,arguments);
        	}
        }
    }

    function isAeraLimit(json){
        return json.durl && json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627;
    }

    function getParam(url, key) {
        return (url.match(new RegExp('[?|&]' + key + '=(\\w+)')) || ['', ''])[1];
    }
    function getCookie(key) {
        var map = document.cookie.split('; ').reduce(function (obj, item) {
            var entry = item.split('=');
            obj[entry[0]] = entry[1];
            return obj;
        }, {});
        return map[key];
    }
    // document.cookie=`bangumi_aera_limit_hack_server=https://www.biliplus.com; domain=.bilibili.com; path=/; expires=${new Date("2020-01-01").toUTCString()}`;
    function setCookie(key, value, options) {
        options || (options = { domain: '.bilibili.com', path: '/', expires: new Date('2020-01-01').toUTCString() });
        var c = Object.keys(options).reduce(function (str, key) {
            return str + '; ' + key + '=' + options[key];
        }, key + '=' + value);
        document.cookie = c;
        return c;
    }
    window.bangumi_aera_limit_hack = {
        setCookie: setCookie,
        getCookie: getCookie
    };
})();