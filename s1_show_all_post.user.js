// ==UserScript==
// @name        列出S1一条帖子的所有内容
// @namespace   https://github.com/ipcjs
// @version     0.0.3
// @description 在帖子的第一页尾部, 列出帖子的所有内容, 省得翻页
// @author       ipcjs
// @include     http://bbs.saraba1st.com/2b/thread-*-1-1.html
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       unsafeWindow
// @connect     bbs.saraba1st.com
// ==/UserScript==

(function () {
    let group, filter;
    if (!(group = /thread-(\d+)-1-1/.exec(location.pathname))) return; // 不匹配则返回

    const POST_PAGE_MAX_COUNT = 10000; // 一次最多拉取多少条
    let tid = group[1];

    switch (tid) {
        case '1494926': filter = f_1494926; break;
        default: filter = f_all; break;
    }
    GM_xmlhttpRequest({
        method: 'GET',
        url: `http://bbs.saraba1st.com/2b/api/mobile/index.php?module=viewthread&ppp=${POST_PAGE_MAX_COUNT}&tid=${tid}&page=1&version=1`,
        onload(resp) {
            log(arguments);
            if (resp.status === 200) {
                let json = JSON.parse(resp.responseText);
                show(
                    json.Variables.postlist.filter(filter),
                    ['number', 'username', 'dateline', 'message'],
                    json.Variables.thread.subject
                );
                // log(json.Variables.thread.subject);                
                // json.Variables.postlist.forEach(item => {
                //     log(item.number, item.username, item.dateline, item.message);
                // });
            }

        },
        onerror(error) {
            log(arguments);
        }
    });
    GM_addStyle(`
    #list-s1-table tr {
	    border-top: 1px solid #888; 
    }
    `)

    function f_1494926(item) {
        if (item.username === 'ipcjs') {
            return true;
        } else if (['SUNSUN', '蒹葭公子', '木水风铃'].includes(item.username) && item.message.includes('ipcjs 发表于')) {
            return true;
        }
        return false;
    }
    function f_all() {
        return true;
    }
    // show([{ name: 'ipcjs', age: 17 }, { name: 'fuck', age: 1 }], ['name', 'age']);
    function show(list, colNames, title) {
        let table = document.createElement('table');

        list.forEach(item => {
            let tr = document.createElement('tr');
            colNames.forEach(name => {
                let td = document.createElement('td');
                td.innerHTML = item[name];
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        table.id = 'list-s1-table';
        let div = document.createElement('div');
        let h1 = document.createElement('h1');
        h1.innerText = (title ? title : 'Title') + `(${list.length})`;
        div.appendChild(h1);
        div.appendChild(table);
        document.querySelector('body').appendChild(div);
    }

    function log(...args) {
        console.log(...args);
    }
})();