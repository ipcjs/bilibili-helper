// ==UserScript==
// @name        列出S1一条帖子的所有内容
// @namespace   https://github.com/ipcjs
// @version     0.1.0
// @description 在帖子的第一页添加[显示全部]按钮, 列出帖子的所有内容
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

    const POST_PAGE_MAX_COUNT = 1000; // 一次最多拉取多少条
    const TID = group[1];

    switch (TID) {
        case '1494926': filter = f_1494926; break;
        default: filter = f_all; break;
    }

    addButton();
    GM_addStyle(`
    #list-s1-table tr {
	    border-top: 1px solid #888; 
    }
    #load-all-post {
        margin: 0px 10px;
    }
    `)

    function addButton() {
        let button = document.createElement('a');
        button.innerText = '[显示全部]';
        button.id = 'load-all-post';
        button.href = 'javascript:;';
        button.addEventListener('click', () => {
            loadAllPost();
        });
        document.querySelector('#pt > div.z').appendChild(button);
    }

    function loadAllPost() {
        (async function () {
            let json, page = 1, list = [];
            while (true) {
                let resp = await ajaxPromise({ url: `http://bbs.saraba1st.com/2b/api/mobile/index.php?module=viewthread&ppp=${POST_PAGE_MAX_COUNT}&tid=${TID}&page=${page}&version=1` });
                json = JSON.parse(resp.responseText);
                Array.prototype.push.apply(list, json.Variables.postlist);
                log('>>', page, list.length, json.Variables.thread);
                if (list.length <= +json.Variables.thread.replies) { // 总post条数为replies + 1
                    page++;
                } else {
                    break;
                }
            }
            show(list.filter(filter), [
                item => `<a href='forum.php?mod=redirect&goto=findpost&ptid=${item.ptid}&pid=${item.pid}'>${item.number}</a>`,
                'username',
                'dateline',
                'message'
            ], json.Variables.thread.subject);
        })().catch((e) => {
            show([{ error: e }], ['error'], 'Result: error');
        });
    }

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
                td.innerHTML = typeof name === 'function' ? name(item) : item[name];
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
        // document.querySelector('body').appendChild(div);
        document.getElementById('ct').insertBefore(div, document.getElementById('postlist'));
    }

    function log(...args) {
        console.log(...args);
    }

    function ajaxPromise(options) {
        return new Promise((resolve, reject) => {
            options.method = options.method || 'GET';
            options.onload = function (resp) {
                resolve(resp);
            }
            options.onerror = function (resp) {
                reject(resp);
            };
            GM_xmlhttpRequest(options);
        });
    }
})();