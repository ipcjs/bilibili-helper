该脚本**只支持HTML5版**播放器，在播放器右上角可以切换成HTML5版。

**反馈问题前，先看这篇文档！！！大多数常见的问题，这里都有说明**
**反馈问题前，先看这篇文档！！！大多数常见的问题，这里都有说明**
**反馈问题前，先看这篇文档！！！大多数常见的问题，这里都有说明**

**不要在Greasyfork中提交反馈，去[GitHub](https://github.com/ipcjs/bilibili-helper/issues)，Greasyfork问题追踪系统太弱了，不好用**

![设置截图](https://greasyfork.org/system/screenshots/screenshots/000/009/536/original/Image.png)

## 问&答

### 如何安装脚本？

使用脚本前必须安装扩展，各浏览器对应的扩展如下：

1. Firefox浏览器：[Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) 、Greasemonkey 4
3. Chrome浏览器：[Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * 访问不了[Chrome 网上应用店](https://chrome.google.com/webstore/category/extensions)的同鞋可以到下面的地址下载crx文件。下载下来的crx文件可能不能直接安装，需要手动拖到扩展管理界面（一般为`chrome://extensions/`）中，应该就能安装成功了：
        * [Tampermonkey各版本百度网盘](https://pan.baidu.com/s/1nuCc4Al)
        * [常用Crx离线安装包下载](https://yurl.sinaapp.com/crx2.php)
    * 国内的360极速浏览器、猎豹浏览器等其实上就是Chrome加个壳，装Tampermonkey就行了
    * 搜狗高速浏览器：[Tampermonkey Legacy](https://ie.sogou.com/app/app_4326.html)
    * <del>傲游浏览器：[Violentmonkey](https://extension.maxthon.com/detail/index.php?view_id=1680)</del>（实测即使是最新版，也不兼容该脚本）

### 脚本无效？

0. 如果在[番剧页面](https://bangumi.bilibili.com/anime/5551)中连设置按钮都看不到，说明你的浏览器版本太老了，请更新成最新版；如果还是不行，请换用最新版的[Firefox](https://www.mozilla.org/en-US/firefox/new/)或者[Chrome](https://www.google.com/chrome/browser/desktop/index.html)。
0. 确定你使用的播放器是**HTML5**版的。Flash版请在播放器界面的右上角切换成HTML5版。
2. 确定可以打开[代理服务器上的链接](https://biliplus.ipcjs.win/api/bangumi?season=5551)。 如果打不开，可以点开设置窗口，换个代理服务器试试
3. 对于一些已知错误，脚本会弹窗提示：（脚本第一次使用的时候，应该会向你申请弹窗权限）
    1. 提示`突破黑洞失败，需要登录`：点击弹窗，登录代理服务器就行了
    1. 提示`突破黑洞失败，我们未能穿透敌人的盔甲...当前代理服务器（...）依然有区域限制`：换个代理服务器，或者尝试登录当前代理服务器
4. 其他弹窗提示，或者没有任何提示，大概是因为获取真实地址的请求失败了。。。默认代理服务器太渣的原因。。一般多刷新几下应该就可以了。。。  
5. 如果依然无效，可能确实是这个脚本的问题了，请反馈给我：[解除B站区域限制 - 反馈](https://github.com/ipcjs/bilibili-helper/issues)， 记得带上[控制台](https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.dev.md#控制台)截图。

### 看不了1080P画质？

1. 确定你是B站的[大会员](https://big.bilibili.com/site/big.html)
2. 确定当前视频拥有1080P画质的版本
3. 确定你登录了代理服务器（点击脚本设置界面的“帐号授权”，进行登录）

### 看不了付费番剧/影视？

**观看付费番剧/影视的前提是，你登录了代理服务器（点击脚本设置界面的“帐号授权”，进行登录）！！**

相关事项说明：

1. [付费抢先看番剧](https://bangumi.bilibili.com/anime/6012/play#103819)支付金额在特定情况下会显示`9876547210.33`的问题，这是因为代理服务器的接口获取不到金额，为了防止[手抖误操作](https://bangumi.bilibili.com/anime/5852/play?aid=9815508#103960#reply238854223)，默认显示一个逸。使用支付宝/微信扫码可以看到真实金额。
2. 以前的付费接口是不会检测区域的，但最近（2017-10-12）的[一些动画电影](https://bangumi.bilibili.com/movie/12116)的付费接口也会检测区域了，所以即使使用该脚本解除了视频的区域限制，依然没办法付费，只能看前面几分钟。一个解决办法是直接冲B站的大会员，大会员看所有的视频都是不需要付费的🙄。
3. 最近也[有人反馈有些番剧能付费，但付费后依然看不了](https://greasyfork.org/zh-CN/forum/discussion/29953/x)，所以付费前请谨慎

### 大会员账号被B站永封了？<img src="https://bbs.saraba1st.com/2b/static/image/smiley/nq/010.gif" alt="(懵逼"/>

0. 注册并登录一个小号
1. 在脚本设置界面勾选“被永封的大会员？”选项
2. 在[代理服务器](https://biliplus.ipcjs.win/login)中使用账号密码登录被永封的大会员账号
3. 就可以用小号看1080P了<img src="https://bbs.saraba1st.com/2b/static/image/smiley/nq/001.gif" alt="(扭曲"/>

## [高级设置/更新日志/测试页面 等](https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.dev.md)