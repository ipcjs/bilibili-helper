## 高级设置

该脚本包含一些可设置项, 使用[解除B站區域限制輔助腳本](https://greasyfork.org/zh-TW/scripts/28907)或[BiliBili proxy setting helper](https://greasyfork.org/zh-TW/scripts/29378)可以帮助你进行一些选项的设置。

从5.6.0版开始，脚本（终于）内置了设置界面，点击[番剧页面](https://bangumi.bilibili.com/anime/5551)的右下角的图标打开。

或者直接手动设置：打开[这个番剧页面](https://bangumi.bilibili.com/anime/5551)，进入[`控制台/Console`](https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.dev.md#控制台)中，执行命令：`bangumi_area_limit_hack.setCookie(key, value);`，其中`key`和`value`分别使用下面的值：

### 代理模式

`key`为`'balh_mode'`，可选的`value`为：

1. `'default'`或`undefined`：默认模式, 自动判断使用何种模式; **推荐**;
2. `'replace'`：替换模式, 只替换有区域限制的视频的接口的返回值; 
    - 进行了两次请求, 若代理服务器不稳定, 普通番剧不受影响; (代理服务器不稳定时, 推荐该模式)
3. `'redirect'`：重定向模式, 重定向所有番剧视频的接口到代理服务器; 
    - 进行一次请求, 若代理服务器不稳定, 普通番剧也可能加载不出视频; (代理服务器足够快时, 推荐该模式)

### 自定义代理服务器

key为`'balh_server'`，可选的`value`为：

1. `undefined`：默认代理服务器
2. `'https://www.your_server.com'`：自定义的代理服务器

### 大会员账号被B站永封了？<img src="https://bbs.saraba1st.com/2b/static/image/smiley/nq/010.gif" alt="(懵逼"/>

0. 注册并登录一个小号
1. 在控制台执行命令：`bangumi_area_limit_hack.setCookie('balh_blocked_vip', 'true');`
2. 在[代理服务器](https://biliplus.ipcjs.win/login)中使用账号密码登录被永封的大会员账号
3. 就可以用小号看1080P了<img src="https://bbs.saraba1st.com/2b/static/image/smiley/nq/001.gif" alt="(扭曲"/>

### 登录/登出

在控制台执行:

1. `bangumi_area_limit_hack.login()`，弹出登录窗口
2. `bangumi_area_limit_hack.logout()`，弹出登出窗口

## 更新日志

1. 6.1.0: 通过绕过的方式兼容GM4
1. 6.0.0: 适配B站的新页面
1. 5.7.0: 尝试支持[港澳台限定的av页面](http://search.bilibili.com/all?keyword=%E4%BB%85%E9%99%90%E5%8F%B0%E6%B9%BE%E5%9C%B0%E5%8C%BA)
1. 5.6.0: 添加设置界面
1. 5.5.0: 尝试支持`/movie/`页面
1. 5.4.0: 支持新的返回403的番剧页
1. 5.2.0：默认代理服务器支持HTTPS
1. 5.1.0：由[@FlandreDaisuki](https://github.com/FlandreDaisuki)增加从AVxxx自动跳转到番剧页的功能
1. 5.0.5：[what are those idiot programmers of bilibili doing??? by esterTion · Pull Request #4 · ipcjs/bilibili-helper](https://github.com/ipcjs/bilibili-helper/pull/4)
1. 5.0.3：紧急更新，修正一个逸单位的换算错误！
1. 5.0.2：检测到区域限制番剧时显示通知提示；
1. **5.0.0**：可切换三种代理模式，任何一种模式都不会卡界面了，详见[代理模式](https://github.com/ipcjs/bilibili-helper/blob/user.js/bilibili_bangumi_area_limit_hack.dev.md#代理模式)；
2. 3.0.0：实现方式改为直接重定向请求；在第一次使用时会弹登录提示框；

## 名词解析

### 控制台

控制台可以用于运行命令，查看log等。

打开方式：Windows上，先按`F12`打开`开发者工具`，再切换到`控制台/Console`选项卡

反馈问题时，最好附上控制台截图。特别的，Edge浏览器，不会保留控制台log，需要先打开控制台，再刷新网页，才能记录下log。

## 源码&测试页

1. 源码仓库：[ipcjs/bilibili-helper at user.js](https://github.com/ipcjs/bilibili-helper/tree/user.js)
2. 代码贡献者：[@esterTion](https://github.com/esterTion)、[@FlandreDaisuki](https://github.com/FlandreDaisuki)、[@ipcjs](https://github.com/ipcjs)
3. 部分源码取自：
    - 通知相关：[Yet Another Weibo Filter - 看真正想看的微博](https://tiansh.github.io/yawf/zh-cn.html)
    - 自动跳转相关：[我就是要跳轉(B站番劇投稿頁跳轉去番劇頁)](https://greasyfork.org/zh-CN/scripts/29151)
4. 解除区域限制测试：
    - 港澳台：[吹響吧！上低音號 第二季（僅限台灣地區）_番剧](https://bangumi.bilibili.com/anime/5551)[[第1话](https://bangumi.bilibili.com/anime/5551/play#96703)]
    - 内地：[小魔女学园 TV版_番剧](https://bangumi.bilibili.com/anime/5788)[[第1话](https://bangumi.bilibili.com/anime/5788/play#101761)]
    - 内地(新): [品酒要在成为夫妻后](https://bangumi.bilibili.com/anime/6423)
    - 付费抢先看：[全职高手_国产动画](https://bangumi.bilibili.com/anime/5852)[[第3话](https://bangumi.bilibili.com/anime/5852/play#103960)][[第5话](https://bangumi.bilibili.com/anime/6012/play#103819)]
    - 一个AV下多个视频：[普通女高中生要做当地偶像_番剧](https://bangumi.bilibili.com/anime/4124)[[第13话](https://bangumi.bilibili.com/anime/4124/play#100947)]
    - 影视：
        - 付费：[声之形](https://bangumi.bilibili.com/movie/12116)
        - 免费：[哆啦A梦：新·大雄的日本诞生（国语）](https://bangumi.bilibili.com/movie/11871)
    - av页面：
        - 港澳台：[【日剧/医疗】产科医鸿鸟2 02【2017】](https://www.bilibili.com/video/av15659129/)
        - 国内：[【5月】游戏王VRAINS 24【VRAINSTORM】](https://www.bilibili.com/video/av15730139/)
5. 自动跳转到番剧页测试
    - 舊番、av_id共用、不分P：[/av4044639/](https://www.bilibili.com/video/av4044639/) → [/3398/play#84776](https://bangumi.bilibili.com/anime/3398/play#84776)
    - 舊番、av_id共用、分P：[/av2182637/index_3.html](https://www.bilibili.com/video/av2182637/index_3.html) → [/4300/play#88679](https://bangumi.bilibili.com/anime/4300/play#88679)
    - 舊番、av_id獨立：[/av2229121/](https://www.bilibili.com/video/av2229121/) → [/1559/play#29944](https://bangumi.bilibili.com/anime/1559/play#29944)
    - 連載中：[/av9910182/](https://www.bilibili.com/video/av9910182/) → [/6001/play#103883](https://bangumi.bilibili.com/anime/6001/play#103883)
    - 连载中、av_id独立：[/av10181128/](https://www.bilibili.com/video/av10181128/) → [/6078/play#105028](https://bangumi.bilibili.com/anime/6078/play#105028)
