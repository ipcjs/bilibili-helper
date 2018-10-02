// ==UserScript==
// @name        列出S1一条帖子的所有内容
// @namespace   https://github.com/ipcjs
// @version     0.2.1
// @description 在帖子的导航栏添加[显示全部]按钮, 列出帖子的所有内容
// @author       ipcjs
// @include     *://bbs.saraba1st.com/2b/thread-*-*-*.html
// @include     *://bbs.saraba1st.com/2b/forum.php*
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       unsafeWindow
// @connect     bbs.saraba1st.com
// ==/UserScript==


// type, props, children
// type, props, innerHTML
// 'text', text
const util_ui_element_creator = (type, props, children) => {
    let elem = null;
    if (type === "text") {
        return document.createTextNode(props);
    } else {
        elem = document.createElement(type);
    }
    for (let n in props) {
        if (n === "style") {
            for (let x in props.style) {
                elem.style[x] = props.style[x];
            }
        } else if (n === "className") {
            elem.className = props[n];
        } else if (n === "event") {
            for (let x in props.event) {
                elem.addEventListener(x, props.event[x]);
            }
        } else {
            elem.setAttribute(n, props[n]);
        }
    }
    if (children) {
        if (typeof children === 'string') {
            elem.innerHTML = children;
        } else {
            for (let i = 0; i < children.length; i++) {
                if (children[i] != null)
                    elem.appendChild(children[i]);
            }
        }
    }
    return elem;
}
const _ = util_ui_element_creator


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

class Table {
    constructor() {
        const $postList = document.getElementById('postlist')
        $postList.innerHTML = ''
        this.listSize = 0
        this.title = ''

        document.getElementById('ct').insertBefore(_('div', {}, [
            this.$title = _('h1', {}, this.title),
            this.$table = _('table', { id: 'ssap-table' }),
            this.$msg = _('div', { id: 'ssap-msg' })
        ]), $postList)
    }

    appendPostList(list) {
        this.append(list, [
            { name: 'number', func: item => `<a href='forum.php?mod=redirect&goto=findpost&ptid=${item.ptid}&pid=${item.pid}'>${item.number}</a>` },
            'username',
            'dateline',
            'message'
        ])
    }
    // append([{ name: 'ipcjs', age: 17 }, { name: 'fuck', age: 1 }], ['name', 'age']);
    append(list, colNames) {
        this.setListSize(this.listSize + list.length)
        list.forEach(item => {
            let $tr = _('tr')
            colNames.forEach(it => {
                let name = typeof it === 'string' ? it : it.name
                let func = typeof it === 'string' ? item => item[name] : it.func
                $tr.appendChild(_('td', { className: `ssap-${name}` }, func(item)))
            })
            this.$table.appendChild($tr)
        })
    }

    setListSize(listSize) {
        this.listSize = listSize
        this._refreshTitle()
    }

    setTitle(title) {
        this.title = title
        this._refreshTitle()
    }

    showMsg(msg) {
        this.$msg.innerText = msg
    }

    _refreshTitle() {
        this.$title.innerHTML = `${this.title || 'Title'} ${this.listSize}`
    }

    _clearTable() {
        this.listSize = 0
        this.$table.innerHTML = ''
    }
}

////////////////////// main ///////////////////////////////

let group, filter;
if (!(group = /thread-(\d+)-(\d+)-(\d+)/.exec(location.pathname))
    && !(group = /tid=(\d+)/.exec(location.search))) {
    return; // 不匹配则返回
}

const POST_PAGE_MAX_COUNT = 1000; // 一次最多拉取多少条
const TID = group[1];
let table;

switch (TID) {
    case '1494926': filter = f_1494926; break;
    default: filter = f_all; break;
}

document.querySelector('#pt > div.z').appendChild(_('a', { id: 'load-all-post', href: 'javascript:;', event: { click: () => loadAllPost() } }, '[显示全部]'));
GM_addStyle(`
    #ssap-table tr {
	    border-top: 1px solid #888; 
    }
    #ssap-msg {
        text-align: center;
    }
    #load-all-post {
        margin: 0px 10px;
    }
    #ssap-table {
        width: 100%;
        table-layout: fixed;
    }
    #ssap-table .ssap-number {
        width: 2%;
    }
    #ssap-table .ssap-username {
        width: 5%;
    }
    
    #ssap-table .ssap-dateline {
        width: 5%;
    }
    
    #ssap-table .ssap-message {
        width: 88%;
    }
    #ssap-table img {
        max-width: 88%;
    }
    `)

function loadAllPost() {
    if (loadAllPost.loading) {
        return
    }
    loadAllPost.loading = true
    if (!table) {
        table = new Table()
    }
    const load = async function () {
        let page = 1;
        while (true) {
            table.showMsg(`加载第${page}页中...`)
            const resp = await ajaxPromise({ url: `http://bbs.saraba1st.com/2b/api/mobile/index.php?module=viewthread&ppp=${POST_PAGE_MAX_COUNT}&tid=${TID}&page=${page}&version=1` });
            const json = JSON.parse(resp.responseText);
            if (page === 1) {
                table.setTitle(json.Variables.thread.subject)
            }
            table.appendPostList(json.Variables.postlist.filter(filter))
            log('>>', page, table.listSize, json.Variables.thread);
            if (table.listSize <= +json.Variables.thread.replies) { // 总post条数为replies + 1
                page++;
            } else {
                break;
            }
        }
    }
    load()
        .then(r => {
            table.showMsg('')
        })
        .catch((e) => {
            table.showMsg(e)
        })
        .finally(() => {
            loadAllPost.loading = false
        })
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