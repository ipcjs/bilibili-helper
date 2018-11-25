// ==UserScript==
// @name         Fuck ZhiHu Mobile Style
// @namespace    https://github.com/ipcjs
// @version      2.0.0
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
.SearchBar {
    display: none;
}
.AppHeader-messages, .AppHeader-notifications, .AppHeader-userInfo {
    margin-right: 16px;
}
.AppHeader-navItem {
    padding: 0 5px;
}
.AppHeader-nav {
    margin-left: 16px;
    margin-right: 16px;
}

.Topstory-container, .Question-main, .Profile-main {
    display: block;
    width: 100%;
    padding: 0px;
}
.Topstory-mainColumn, .Question-mainColumn, .Profile-mainColumn {
    width: 100%;
}
.Question-sideColumn, .Profile-sideColumn {
    width: 100%;
}
.QuestionHeader-content {
    width: 100%;
    display: block;
}
.QuestionHeader-main {
    width: 100%;
}
.QuestionHeader-side {
    width: 100%; 
}
.NumberBoard {
    margin: auto;
}
.QuestionHeader {
    min-width: inherit;
}
.ProfileHeader {
    width: 100%;
    padding: 0px;
}
`)
