// ==UserScript==
// @name         B萌无需投票查看数据
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  不投票就可以查看数据; 适配2016, 2017B萌;
// @author       ipcjs
// @include      *://bangumi.bilibili.com/moe/*/schedule/*
// @include      *://bangumi.bilibili.com/moe/2017/jp/index*
// @run-at       document-start
// @grant        none
// ==/UserScript==

'use strict';

injectFetchDataFilter();

if (!window.jQuery) { // 若还未加载jQuery, 则监听
    var jQuery;
    Object.defineProperty(window, 'jQuery', {
        configurable: true, enumerable: true, set: function (v) {
            jQuery = v;
            injectJqueryDataFilter();// 设置jQuery后, 立即注入
        }, get: function () {
            return jQuery;
        }
    });
} else {
    injectJqueryDataFilter();
}

function injectJqueryDataFilter() {
    window.jQuery.ajaxSetup({
        dataFilter: jqueryDataFilter
    });
}

function jqueryDataFilter(data, type) {
    // console.log(arguments, this);
    // 2016B萌
    if (this.url.startsWith(window.location.protocol + '//bangumi.bilibili.com/moe/2016/2/api/vote/my_vote')) {
        let r = JSON.parse(data);
        if (!r.result) {
            data = '{"code":0,"message":"success","result":[{"group_id":74,"list":[' +
                '{"character":{"area":2,"character_id":1238,"chn_name":"七海小天使","cover":"http://i0.hdslb.com/bfs/bangumi/c5a6d4f355c2fe075f7b30da2dd674e03446d9c6.jpg","sex":1,"video_num":1},"type":0}' +
                '],"name":"女性角色","sex":1},{"group_id":73,"list":[' +
                '{"character":{"area":2,"character_id":1598,"chn_name":"自动填充的模拟数据","cover":"http://i0.hdslb.com/bfs/bangumi/4d560515743139837d569b86ff9f8f5bdd526002.jpg","sex":0,"video_num":4},"type":0}' +
                '],"name":"男性角色","sex":0}]}';
        }
    }
    return data;
}

function injectFetchDataFilter() {
    let fetch = window.fetch;
    window.fetch = function (...args) {
        return new Promise((resolve, reject) => {
            let response;
            fetch(...args)
                .then(resp => {
                    response = resp;
                    return resp.json()
                })
                .then(data => resolve(fetchDataFilter(response, data)))
                .catch(error => reject(error));
        });
    }
}

function fetchDataFilter(resp, data) {
    let url = resp.url;
    // 2017B萌
    if (url.startsWith(window.location.protocol + '//bangumi.bilibili.com/moe/2017/2/api/vote/my_vote')) {
        if (!data.result) {
            data = JSON.parse( // 私货~~
                '{"code":0,"message":"success","result":[{"group_id":116,"list":[' +
                '{"character":{"area":2,"bangumi_name":"","big_cover":"","character_id":1621,"chn_name":"薮猫","cover":"http://i0.hdslb.com/bfs/bangumi/2de5d63e31e549e737d454561b82e2c04ab2f677.jpg","final_cover":"","is_new":0,"sex":1,"square_cover":"","video_num":8},"type":0},' +
                '{"character":{"area":2,"bangumi_name":"","big_cover":"","character_id":1624,"chn_name":"小鞄","cover":"http://i0.hdslb.com/bfs/bangumi/f5ef8ea2bcee9177c2968271dcc89a3443351f82.jpg","final_cover":"","is_new":0,"sex":1,"square_cover":"","video_num":5},"type":0},' +
                '{"character":{"area":2,"bangumi_name":"","big_cover":"","character_id":1072,"chn_name":"伊泽塔","cover":"http://i0.hdslb.com/bfs/bangumi/b3ce931e3cfa6fce0e5b364493c36d35e7499c7a.jpg","final_cover":"","is_new":0,"sex":1,"square_cover":"","video_num":0},"type":0},' +
                '{"character":{"area":2,"bangumi_name":"","big_cover":"","character_id":1787,"chn_name":"春埼美空","cover":"http://i0.hdslb.com/bfs/bangumi/de1a745055ade5f72a92937a9dc97e1e226902f9.jpg","final_cover":"","is_new":0,"sex":1,"square_cover":"","video_num":0},"type":0},' +
                '{"character":{"area":2,"bangumi_name":"小魔女学园","big_cover":"","character_id":1582,"chn_name":"戴安娜·卡文迪什","cover":"http://i0.hdslb.com/bfs/bangumi/34979502ca044e41af222664198b7e198dd3655e.jpg","final_cover":"","is_new":0,"sex":1,"square_cover":"","video_num":7},"type":0}' +
                '],"name":"女子组","sex":1},{"group_id":115,"list":[' +
                '{"character":{"area":2,"bangumi_name":"","big_cover":"","character_id":2535,"chn_name":"桐山零","cover":"http://i0.hdslb.com/bfs/bangumi/7a8e9dbc183dba8f2082664ad8f8cdda8a239398.png","final_cover":"","is_new":0,"sex":0,"square_cover":"","video_num":1},"type":0}' +
                '],"name":"男子组","sex":0}]}'
            );
        }
    } else if (url.startsWith(window.location.protocol + '//bangumi.bilibili.com/moe/2017/2/api/vote/my_current_vote')) {
        if (data.result && !data.result.has_ticket) { // 没有取票之前才改变has_voted, 否则取票后没法投票...
            data.result.has_voted = 1;
        }
    }
    resp.json = () => Promise.resolve(data); // 代理json方法, 创建直接返回data的Promise
    // console.log(url, data, arguments);
    return resp;
}