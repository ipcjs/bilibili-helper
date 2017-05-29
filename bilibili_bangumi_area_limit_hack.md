注意，该脚本**只支持HTML5版**播放器，在播放器右上角可以切换成HTML5版。

推广→_→：[B站弹幕实时刷新](https://greasyfork.org/zh-CN/scripts/30094)

## 问&答

### 如何安装脚本？

使用脚本前必须安装扩展，各浏览器对应的扩展如下：

1. Firefox浏览器：[Greasemonkey](https://addons.mozilla.org/zh-CN/firefox/addon/greasemonkey/)
2. 傲游浏览器：[Violentmonkey](http://extension.maxthon.com/detail/index.php?view_id=1680)
3. Chrome浏览器：[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * 访问不了[Chrome 网上应用店](https://chrome.google.com/webstore/category/extensions)的同鞋可以到下面的地址下载crx文件。下载下来的crx文件可能不能直接安装，需要手动拖到扩展管理界面（一般为`chrome://extensions/`）中，应该就能安装成功了：
        * [Tampermonkey各版本百度网盘](http://pan.baidu.com/s/1nuCc4Al)
        * [常用Crx离线安装包下载](https://yurl.sinaapp.com/crx2.php)
    * 国内的360极速浏览器、猎豹浏览器等其实上就是Chrome加个壳，装Tampermonkey就行了
    * 搜狗高速浏览器：[Tampermonkey Legacy](http://ie.sogou.com/app/app_4326.html)

### 安装脚本后无效？

0. 确定你使用的播放器是**HTML5**版的。Flash版请在播放器界面的右上角切换成HTML5版。
1. 确定你打开的页面的URL是`bangumi.bilibili.com/anime`开头的，当前该脚本只在这个URL下开启了。以京吹为例，在[这个页面](http://bangumi.bilibili.com/anime/5551/)下点开的链接就是`bangumi.bilibili.com/anime`开头的。  
2. 如果还是无效的话，大概是因为获取真实地址的请求失败了。。。默认代理服务器太渣的原因。。一般多刷新几下应该就可以了。。。  
4. 如果依然无效，可能确实是这个脚本的问题了，请反馈给我：[解除B站区域限制 - 反馈](https://greasyfork.org/zh-CN/scripts/25718-%E8%A7%A3%E9%99%A4b%E7%AB%99%E5%8C%BA%E5%9F%9F%E9%99%90%E5%88%B6/feedback)

### 看不了1080P画质？

1. 确定你是B站的[大会员](http://big.bilibili.com/site/big.html)
2. 确定当前视频拥有1080P画质的版本
3. 确定你登录了[代理服务器](http://biliplus.ipcjsdev.tk/login)；注意，当前默认代理服务器只支持“使用bilibili账号密码进行登录”

## 高级设置

该脚本包含一些可设置项, 使用[解除B站區域限制輔助腳本](https://greasyfork.org/zh-TW/scripts/28907)或[BiliBili proxy setting helper](https://greasyfork.org/zh-TW/scripts/29378)可以帮助你进行一些选项的设置。

或者直接手动设置：打开[这个番剧页面](http://bangumi.bilibili.com/anime/5551)，按`F12`进入`开发者工具`，在`控制台/Console`中执行命令：`bangumi_area_limit_hack.setCookie(key, value);`，其中`key`和`value`分别使用下面的值：

### 代理模式

`key`为`'balh_mode'`，可选的`value`为：

1. `'default'`或`undefined`：默认模式, 自动判断使用何种模式; **推荐**;
2. `'replace'`：替换模式, 只替换有区域限制的视频的接口的返回值; 
    - 进行了两次请求, 若代理服务器不稳定, 普通番剧不受影响; (代理服务器不稳定时, 推荐该模式)
3. `'redirect'`：重定向模式, 重定向所有番剧视频的接口到代理服务器; 
    - 进行一次请求, 若代理服务器不稳定, 普通番剧也可能加载不出视频; (代理服务器足够快时, 推荐该模式)
    - [付费抢先看番剧](http://bangumi.bilibili.com/anime/6012/play#103819)支付金额会显示`9876547210.33`：因为代理服务器的接口获取不到金额，为了防止[手抖误操作](http://bangumi.bilibili.com/anime/5852/play?aid=9815508#103960#reply238854223)，默认显示一个逸。使用支付宝/微信扫码可以看到真实金额。

### 自定义代理服务器

key为`'balh_server'`，可选的`value`为：

1. `undefined`：默认代理服务器
2. `'https://www.your_server.com'`：自定义的代理服务器

### 大会员账号被B站永封了？<img src="http://bbs.saraba1st.com/2b/static/image/smiley/nq/010.gif" alt="(懵逼"/>

0. 注册并登录一个小号
1. 在控制台执行命令：`bangumi_area_limit_hack.setCookie('balh_blocked_vip', 'true');`
2. 在[代理服务器](http://biliplus.ipcjsdev.tk/login)中使用账号密码登录被永封的大会员账号
3. 就可以用小号看1080P了<img src="http://bbs.saraba1st.com/2b/static/image/smiley/nq/001.gif" alt="(扭曲"/>

### 登录/登出

在控制台执行:

1. `bangumi_area_limit_hack.login()`，弹出登录窗口
2. `bangumi_area_limit_hack.logout()`，弹出登出窗口

## 更新日志

1. 5.2.0：默认代理服务器支持HTTPS
1. 5.1.0：由[@FlandreDaisuki](https://github.com/FlandreDaisuki)增加从AVxxx自动跳转到番剧页的功能
1. 5.0.5：[what are those idiot programmers of bilibili doing??? by esterTion · Pull Request #4 · ipcjs/bilibili-helper](https://github.com/ipcjs/bilibili-helper/pull/4)
1. 5.0.3：紧急更新，修正一个逸单位的换算错误！
1. 5.0.2：检测到区域限制番剧时显示通知提示；
1. **5.0.0**：可切换三种代理模式，任何一种模式都不会卡界面了，详见[代理模式](https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.md#代理模式)；
2. 3.0.0：实现方式改为直接重定向请求；在第一次使用时会弹登录提示框；

## 源码&测试页

1. 源码仓库：[ipcjs/bilibili-helper at user.js](https://github.com/ipcjs/bilibili-helper/tree/user.js)
2. 代码贡献者：[@esterTion](https://github.com/esterTion)、[@FlandreDaisuki](https://github.com/FlandreDaisuki)、[@ipcjs](https://github.com/ipcjs)
3. 部分源码取自：
    - 通知相关：[Yet Another Weibo Filter - 看真正想看的微博](https://tiansh.github.io/yawf/zh-cn.html)
    - 自动跳转相关：[我就是要跳轉(B站番劇投稿頁跳轉去番劇頁)](https://greasyfork.org/zh-CN/scripts/29151)
4. 解除区域限制测试：
    - 港澳台：[吹響吧！上低音號 第二季（僅限台灣地區）_番剧](http://bangumi.bilibili.com/anime/5551)[[第1话](http://bangumi.bilibili.com/anime/5551/play#96703)]
    - 内地：[小魔女学园 TV版_番剧](http://bangumi.bilibili.com/anime/5788)[[第1话](http://bangumi.bilibili.com/anime/5788/play#101761)]
    - 付费抢先看：[全职高手_国产动画](http://bangumi.bilibili.com/anime/5852)[[第3话](http://bangumi.bilibili.com/anime/5852/play#103960)][[第5话](http://bangumi.bilibili.com/anime/6012/play#103819)]
    - 一个AV下多个视频：[普通女高中生要做当地偶像_番剧](http://bangumi.bilibili.com/anime/4124)[[第13话](http://bangumi.bilibili.com/anime/4124/play#100947)]
5. 自动跳转到番剧页测试
    - 舊番、av_id共用、不分P：[/av4044639/](https://www.bilibili.com/video/av4044639/) → [/3398/play#84776](https://bangumi.bilibili.com/anime/3398/play#84776)
    - 舊番、av_id共用、分P：[/av2182637/index_3.html](https://www.bilibili.com/video/av2182637/index_3.html) → [/4300/play#88679](https://bangumi.bilibili.com/anime/4300/play#88679)
    - 舊番、av_id獨立：[/av2229121/](https://www.bilibili.com/video/av2229121/) → [/1559/play#29944](https://bangumi.bilibili.com/anime/1559/play#29944)
    - 連載中：[/av9910182/](https://www.bilibili.com/video/av9910182/) → [/6001/play#103883](https://bangumi.bilibili.com/anime/6001/play#103883)
    - 连载中、av_id独立：[/av10181128/](http://www.bilibili.com/video/av10181128/) → [/6078/play#105028](http://bangumi.bilibili.com/anime/6078/play#105028)
