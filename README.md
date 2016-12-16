B站相关增强功能
===

## 定位评论[书签ver]

B站的跳转到评论功能经常失效，看了下源码，发现原来接口是有的，但只在avxxx结尾的页面里才启用了，于是整了这个小工具。

使用方法：

新建一个书签，名字随意，网址填如下内容：

```
javascript:(function(){ let s = document.createElement('script'); s.src = 'https://rawgit.com/ipcjs/bilibili-helper/jslet/bilibili_comment_search.js'; document.querySelector('head').appendChild(s); })();
```
点击消息中心的评论时，如果没有自动跳转到评论，点一下这个书签就会跳转了。

## 定位评论[油猴脚本ver]

用油猴脚本可以做到打开页面直接跳转，省得去点书签，但要装个扩展：

1. 安装扩展：[Tampermonkey](http://tampermonkey.net/)
2. [安装脚本](https://greasyfork.org/zh-CN/scripts/25660-bilibili%E8%AF%84%E8%AE%BA%E5%AE%9A%E4%BD%8D)[(备用)](https://github.com/ipcjs/bilibili-helper/raw/user.js/bilibili_comment_search.user.js)

## B萌无需投票查看数据

[安装脚本](https://greasyfork.org/zh-CN/scripts/25661-b%E8%90%8C%E6%97%A0%E9%9C%80%E6%8A%95%E7%A5%A8%E6%9F%A5%E7%9C%8B%E6%95%B0%E6%8D%AE)[(备用)](https://github.com/ipcjs/bilibili-helper/raw/user.js/bilibili_meo_vote_data_hack.user.js)

## 解除番剧区域限制

把获取视频地址相关接口的返回值替换成[biliplus](https://www.biliplus.com)的接口的返回值

1. 因为替换值的操作是同步的，所有会卡几下...
2. 因为biliplus的接口不支持跨域请求，所以使用了我自己的服务器做反向代理(-_-#)
3. 因为反向代理服务器太渣，经常会加载不出来_(:3」∠)_，多刷新几次就好了

[安装脚本](https://greasyfork.org/zh-CN/scripts/25718-%E8%A7%A3%E9%99%A4b%E7%AB%99%E5%8C%BA%E5%9F%9F%E9%99%90%E5%88%B6)[(备用)](https://github.com/ipcjs/bilibili-helper/raw/user.js/bilibili_bangumi_aera_limit_hack.user.js)
