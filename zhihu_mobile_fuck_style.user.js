// ==UserScript==
// @name         Fuck ZhiHu Mobile Style
// @namespace    https://github.com/ipcjs
// @version      1.0.3
// @description  日他娘的逼乎手机网页版 样式ver
// @author       ipcjs
// @include      https://www.zhihu.com/*
// @include      https://zhuanlan.zhihu.com/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
.AppHeader {
    min-width: inherit;
}
.AppHeader-inner {
    width: 100%;
}
.SearchBar-toolWrapper {
    width: 50px;
}
.SearchBar-input {
    width: 200px;
}
.SearchBar-input.SearchBar-focusedInput {
    width: 400px;
}
.AppHeader-userInfo {
    margin-right: 40px;
}

.Topstory-container {
    width: 100%;
    padding: 0px;
}
.Topstory-mainColumn {
    width: 100%;
    /*margin: 0px;*/
}

.Question-main {
    display: block;
    width: 100%;
    padding: 0px;
}
.Question-mainColumn {
    width: 100%;
}
.Question-sideColumn {
    width: 100%;
}
`)
