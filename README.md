## 跳转到评论小书签
B站其实是有跳转到评论的接口的，但当前只有在以avxx结尾的网址里面才启用了，其他页面都没启用，这时点击这个小书签，就可以正常跳转了。

书签Url：
```
javascript:(function(){ let s = document.createElement('script'); s.src = 'https://rawgit.com/ipcjs/bilibili-helper/jslet/bilibili_comment_search.js'; document.querySelector('head').appendChild(s); })();
```
