// @ts-nocheck
import { Objects } from '../../util/objects'
import { Converters, uposMap } from '../../util/converters';
import { _ } from '../../util/react'
import { Async, Promise } from '../../util/async';
import { r, _t } from '../../feature/r'
import { util_error, util_warn, log } from '../../util/log'
import { cookieStorage } from '../../util/cookie'
import { balh_config, isClosed } from '../../feature/config'
import { util_page } from '../../feature/page'
import { access_key_param_if_exist, platform_android_param_if_app_only } from '../../api/bilibili-utils'
import { generateMobiPlayUrlParams, getMobiPlayUrl, fixMobiPlayUrlJson, fixThailandPlayUrlJson } from '../../api/biliplus'
import { ui } from '../../util/ui'
import { Strings } from '../../util/strings'
import { util_init } from '../../util/initiator'
import { util_ui_msg } from '../../util/message'
import { RegExps } from '../../util/regexps'
import { bilibili_login } from './bilibili_login';
import { injectFetch, injectFetch4Mobile } from '../../feature/bili/area_limit_fetch'
import space_account_info_map from '../../feature/bili/space_account_info_map'
import * as OpenCC from 'opencc-js'
import { removeEpAreaLimit } from '../../feature/bili/area_limit_for_vue'
import { injectXhr as injectXhrImpl } from '../../util/inject-xhr';

export const area_limit_xhr = (() => {
    return function () {
        if (isClosed()) return
        injectFetch()
        function injectXhr() {
            injectXhrImpl({
                /// {@template xhr_transform_response}
                /// 转换响应数据, 处理简单的情况
                /// - url: 响应的url
                /// - response: 响应内容
                /// - xhr: xhr对象
                /// - container, 一个xhr对象, 对应一个container, 可以用来复写xhr对象本身的属性, 或者设置一些临时的属性, 方便其他地方访问
                /// 
                /// 返回值可以是如下值:
                /// - null, 表示不转换
                /// - Promise, 异步转换
                /// - object|string, 同步转换
                /// {@endtemplate}
                transformResponse: ({ url, response, xhr, container }) => {
                    if (url.match(RegExps.url('api.bilibili.com/pgc/view/web/season?'))) {
                        let json = JSON.parse(xhr.responseText)
                        if (json.code === 0 && json.result) {
                            // processSeasonInfo(json.result)
                            json.result.episodes.forEach(removeEpAreaLimit)
                            json.result.rights.area_limit = 0
                            json.result.rights.ban_area_show = 0
                            return json
                        }
                    } else if (url.match(RegExps.url('bangumi.bilibili.com/view/web_api/season/user/status'))
                        || url.match(RegExps.url('api.bilibili.com/pgc/view/web/season/user/status'))) {
                        let json = JSON.parse(xhr.responseText)
                        let rewriteResult = false
                        if (json.code === 0 && json.result) {
                            areaLimit(json.result.area_limit !== 0)
                            if (json.result.area_limit !== 0) {
                                json.result.area_limit = 0 // 取消区域限制
                                json.result.ban_area_show = 0
                                rewriteResult = true
                            }
                            if (balh_config.blocked_vip) {
                                json.result.pay = 1
                                rewriteResult = true
                            }
                            if (rewriteResult) {
                                return json
                            }
                        }
                    } else if (url.match(RegExps.url('bangumi.bilibili.com/web_api/season_area'))) {
                        log('/season_area', url)
                        let json = JSON.parse(xhr.responseText)
                        if (json.code === 0 && json.result) {
                            areaLimit(json.result.play === 0)
                            if (json.result.play === 0) {
                                json.result.play = 1
                                return json
                            }
                        }
                    } else if (url.match(RegExps.url('api.bilibili.com/x/web-interface/nav'))) {
                        const isFromReport = Strings.getSearchParam(url, 'from') === 'report'
                        let json = JSON.parse(xhr.responseText)
                        log('/x/web-interface/nav', (json.data && json.data.isLogin)
                            ? { uname: json.data.uname, isLogin: json.data.isLogin, level: json.data.level_info.current_level, vipType: json.data.vipType, vipStatus: json.data.vipStatus, isFromReport: isFromReport }
                            : xhr.responseText)
                        if (json.code === 0 && json.data && balh_config.blocked_vip
                            && !isFromReport // report时, 还是不伪装了...
                        ) {
                            json.data.vipType = 2; // 类型, 年度大会员
                            json.data.vipStatus = 1; // 状态, 启用
                            return json
                        }
                    } else if (url.match(RegExps.url('api.bilibili.com/x/player.so'))) {
                        // 这个接口的返回数据貌似并不会影响界面...
                        if (balh_config.blocked_vip) {
                            log('/x/player.so')
                            const xml = new DOMParser().parseFromString(`<root>${xhr.responseText.replace(/\&/g, "&amp;")}</root>`, 'text/xml')
                            const vipXml = xml.querySelector('vip')
                            if (vipXml) {
                                const vip = JSON.parse(vipXml.innerHTML)
                                vip.vipType = 2 // 同上
                                vip.vipStatus = 1
                                vipXml.innerHTML = JSON.stringify(vip)
                                return xml.documentElement.innerHTML
                            }
                        }
                    } else if (url.match(RegExps.url('api.bilibili.com/x/player/v2'))) {
                        // 上一个接口的新版本
                        let json = JSON.parse(xhr.responseText);
                        // 生成简体字幕
                        if (balh_config.generate_sub && json.code == 0 && json.data.subtitle?.subtitles?.length) {
                            const subtitles = json.data.subtitle.subtitles;
                            const lans = subtitles.map((item) => item.lan);
                            const genHans = lans.includes('zh-Hant') && !lans.includes('zh-Hans');
                            const genHant = lans.includes('zh-Hans') && !lans.includes('zh-Hant');
                            if (genHans || genHant) {
                                const origin = genHans ? 'zh-Hant' : 'zh-Hans';
                                const target = genHans ? 'zh-Hans' : 'zh-Hant';
                                const targetDoc = genHans ? '中文（简体）生成' : '中文（繁体）生成'
                                if (origin && target && targetDoc) {
                                    const from = origin == 'zh-Hant' ? 'tw' : 'cn';
                                    const to = target == 'zh-Hans' ? 'cn' : 'tw';
                                    const origSub = subtitles.find((item) => item.lan == origin);
                                    const origSubUrl = 'https:' + origSub.subtitle_url;
                                    const origSubId = origSub.id;
                                    const origSubRealId = BigInt(origSub.id_str);
                                    const translateUrl = new URL(origSubUrl);
                                    translateUrl.searchParams.set('translate', '1');
                                    translateUrl.searchParams.set('from', from);
                                    translateUrl.searchParams.set('to', to);
                                    const targetSub = {
                                        lan: target,
                                        lan_doc: targetDoc,
                                        is_lock: false,
                                        subtitle_url: translateUrl.href,
                                        type: 0,
                                        id: origSubId + 1,
                                        id_str: (origSubRealId + 1n).toString(),
                                    };
                                    json.data.subtitle.subtitles.push(targetSub);
                                }
                            }
                        }
                        if ((json.code === -400 || json.code === -404 || (json.code == 0 && window.__balh_app_only__ && json.data.subtitle.subtitles.length == 0)) && balh_config.server_custom_th) {
                            // 泰区番剧返回的字幕为 null，需要使用泰区服务器字幕接口填充数据
                            // https://www.bilibili.com/bangumi/play/ep10649765
                            // 2022-09-17 ipcjs: 为什么这里用的是请求url, 而不是响应url?...
                            let requestUrl = container.__url
                            let thailand_sub_url = requestUrl.replace('https://api.bilibili.com/x/player/v2', `${balh_config.server_custom_th}/intl/gateway/v2/app/subtitle`);
                            return Async.ajax(thailand_sub_url)
                                .then(async thailand_data => {
                                    let subtitle = { subtitles: [] };
                                    thailand_data.data.subtitles.forEach((item) => {
                                        let sub = {
                                            'id': item.id,
                                            'id_str': item.id.toString(),
                                            'lan': item.key,
                                            'lan_doc': item.title,
                                            'subtitle_url': item.url.replace(/https?:\/\//, '//')
                                        }
                                        subtitle.subtitles.push(sub);
                                    })
                                    if (json.code === 0) {
                                        json.data.subtitle = subtitle
                                    } else {
                                        json = { code: 0, "message": "0", data: { subtitle: subtitle } }
                                    }
                                    // todo: json.data中有许多字段, 需要想办法填充
                                    if (balh_config.blocked_vip) {
                                        json.data.vip = {
                                            type: 2, //年费大会员
                                            status: 1 //启用
                                        };
                                    }
                                    return json
                                })
                        } else if (!json.code && json.data && balh_config.blocked_vip) {
                            log('/x/player/v2', 'vip');
                            const vip = json.data.vip;
                            if (vip) {
                                vip.type = 2; // 同上
                                vip.status = 1;
                            }
                        }
                        return json
                    } else if (url.match(RegExps.urlPath('/bfs/subtitle/'))) {
                        log('/bfs/subtitle', url);
                        const parsedUrl = new URL(url);
                        const translate = parsedUrl.searchParams.get('translate') == '1';
                        if (!translate) {
                            return null;
                        }
                        const from = parsedUrl.searchParams.get('from');
                        const to = parsedUrl.searchParams.get('to');
                        const translator = OpenCC.Converter({ from: from, to: to });
                        const json = JSON.parse(xhr.responseText);

                        // 参考 https://github.com/Kr328/bilibili-subtitle-tweaks
                        json.body.forEach((value) => {
                            const original = value.content;

                            let result = original.replace(/\s[-—－]/, s => `\n${s.substring(1)}`);
                            result = translator(result);
                            value.content = result;
                        });
                        return json;
                    } else if (url.match(RegExps.url('api.bilibili.com/x/player/playurl'))) {
                        log('/x/player/playurl', 'origin', `block: ${container.__block_response}`, xhr.response)
                        // todo      : 当前只实现了r.const.mode.REPLACE, 需要支持其他模式
                        // 2018-10-14: 等B站全面启用新版再说(;¬_¬)
                    } else if (url.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl')) || url.match(RegExps.url('api.bilibili.com/pgc/player/web/v2/playurl'))
                        && !Strings.getSearchParam(url, 'balh_ajax')) {
                        const reqUrl = new URL(url, document.location.href)
                        const isV1 = reqUrl.pathname === '/pgc/player/web/playurl'
                        let json = typeof xhr.response === 'object' ? xhr.response : JSON.parse(xhr.responseText)
                        if (!container.__redirect || (!isV1 && isAreaLimitForPlayUrl(json.result))) { // 请求没有被重定向, 则需要检测结果是否有区域限制
                            if (balh_config.blocked_vip || json.code || isAreaLimitForPlayUrl(json.result)) {
                                areaLimit(true)
                                // 2022-09-17 ipcjs: 为什么这里用的是请求url, 而不是响应url?...
                                let requestUrl = isV1 ? container.__url : `//api.bilibili.com/pgc/player/web/playurl${reqUrl.search}`
                                if (isBangumiPage()) {
                                    requestUrl += `&module=bangumi`
                                }
                                return bilibiliApis._playurl.asyncAjax(requestUrl)
                                    .then(data => {
                                        if (!data.code) {
                                            data = isV1
                                                ? { code: 0, result: data, message: "0" }
                                                : { code: 0, message: "success", result: { video_info: data } }
                                        }
                                        return data
                                    })
                            } else {
                                areaLimit(false)
                            }
                        }
                        // 同上
                    } else if (url.match(RegExps.url('api.bilibili.com/pgc/view/web/freya/season'))) {
                        /* 一起看放映室用这个api来识别区域限制 */
                        let json = JSON.parse(xhr.response)
                        log('/pgc/view/web/freya/season', 'origin', `area_limit`, json.data.viewUserStatus.area_limit)
                        if (json.code == 0 && json.data.viewUserStatus.area_limit == 1) {
                            areaLimit(true)
                            json.data.viewUserStatus.area_limit = 0
                            return json
                        } else {
                            areaLimit(false)
                        }
                    } else if (url.match(RegExps.url('api.bilibili.com/x/space/acc/info?')) || url.match(RegExps.url('api.bilibili.com/x/space/wbi/acc/info?'))) {
                        const json = JSON.parse(xhr.responseText)
                        if (json.code === -404) {
                            const mid = new URL(url).searchParams.get('mid')
                            if (space_account_info_map[mid]) {
                                return space_account_info_map[mid]
                            }
                        }
                    }
                    return null
                },
                /// {@template xhr_transform_request}
                /// 转换请求
                /// - url, 请求链接
                /// - container, 一个xhr对象, 对应一个container, 可以用来复写xhr对象本身的属性, 或者设置一些临时的属性, 方便其他地方访问
                /// 
                /// 返回值可以是如下值:
                /// - null, 表示不处理
                /// - Promise, 表示需要替换成异步请求, Promise的结果会替换xhr.response
                /// {@endtemplate}
                transformRequest: ({ url, container }) => {
                    if (url.match(RegExps.url('api.bilibili.com/x/player/playurl')) && balh_config.enable_in_av) {
                        log('/x/player/playurl')
                        // debugger
                        return bilibiliApis._playurl.asyncAjax(url)
                            .then(data => {
                                if (!data.code) {
                                    data = {
                                        code: 0,
                                        data: data,
                                        message: "0",
                                        ttl: 1
                                    }
                                }
                                log('/x/player/playurl', 'proxy', data)
                                return data
                            })

                    } else if (url.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl'))
                        && !Strings.getSearchParam(url, 'balh_ajax')
                        && needRedirect()) {
                        // debugger
                        container.__redirect = true // 标记该请求被重定向
                        if (isBangumiPage()) {
                            url += `&module=bangumi`
                        }
                        return bilibiliApis._playurl.asyncAjax(url)
                            .then(data => {
                                if (!data.code) {
                                    data = { code: 0, result: data, message: "0" }
                                }
                                return data
                            })
                    }
                    return null
                }
            })
        }

        function injectAjax() {
            log('injectAjax at:', window.jQuery)
            let originalAjax = $.ajax;
            $.ajax = function (arg0, arg1) {
                let param;
                if (arg1 === undefined) {
                    param = arg0;
                } else {
                    arg0 && (arg1.url = arg0);
                    param = arg1;
                }
                let oriSuccess = param.success;
                let oriError = param.error;
                let mySuccess, myError;
                // 投递结果的transformer, 结果通过oriSuccess/Error投递
                let dispatchResultTransformer = p => p
                    .then(r => {
                        // debugger
                        oriSuccess(r)
                    })
                    .catch(e => oriError(e))
                // 转换原始请求的结果的transformer
                let oriResultTransformer
                let oriResultTransformerWhenProxyError
                let one_api;
                if (param.url.match(RegExps.urlPath('/web_api/get_source'))) {
                    one_api = bilibiliApis._get_source;
                    oriResultTransformer = p => p
                        .then(json => {
                            log(json);
                            if (json.code === -40301 // 区域限制
                                || json.result.payment && json.result.payment.price != 0 && balh_config.blocked_vip) { // 需要付费的视频, 此时B站返回的cid是错了, 故需要使用代理服务器的接口
                                areaLimit(true);
                                return one_api.asyncAjax(param.url)
                                    .catch(e => json)// 新的请求报错, 也应该返回原来的数据
                            } else {
                                areaLimit(false);
                                if ((balh_config.blocked_vip || balh_config.remove_pre_ad) && json.code === 0 && json.result.pre_ad) {
                                    json.result.pre_ad = 0; // 去除前置广告
                                }
                                return json;
                            }
                        })
                } else if (param.url.match(RegExps.urlPath('/player/web_api/playurl')) // 老的番剧页面playurl接口
                    || param.url.match(RegExps.urlPath('/player/web_api/v2/playurl')) // 新的番剧页面playurl接口
                    || param.url.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl')) // 新的番剧页面playurl接口
                    || (balh_config.enable_in_av && param.url.match(RegExps.url('interface.bilibili.com/v2/playurl'))) // 普通的av页面playurl接口
                ) {
                    // 新playrul:
                    // 1. 部分页面参数放在param.data中
                    // 2. 成功时, 返回的结果放到了result中: {"code":0,"message":"success","result":{}}
                    // 3. 失败时, 返回的结果没变
                    let isNewPlayurl
                    if (isNewPlayurl = param.url.match(RegExps.url('api.bilibili.com/pgc/player/web/playurl'))) {
                        if (param.data) {
                            param.url += `?${Object.keys(param.data).map(key => `${key}=${param.data[key]}`).join('&')}`
                            param.data = undefined
                        }
                        if (isBangumiPage()) {
                            param.url += `&module=bangumi`
                        }
                        // 加上这个参数, 防止重复拦截这个url
                        param.url += `&balh_ajax=1`
                    }
                    one_api = bilibiliApis._playurl;
                    if (isNewPlayurl) {
                        oriResultTransformerWhenProxyError = p => p
                            .then(json => !json.code ? json.result : json)
                    }
                    oriResultTransformer = p => p
                        .then(json => {
                            if (isNewPlayurl && !json.code) {
                                json = json.result
                            }
                            if (balh_config.blocked_vip || json.code || isAreaLimitForPlayUrl(json)) {
                                areaLimit(true)
                                return one_api.asyncAjax(param.url)
                                    .catch(e => json)
                            } else {
                                areaLimit(false)
                                return json
                            }
                        })
                    const oriDispatchResultTransformer = dispatchResultTransformer
                    dispatchResultTransformer = p => p
                        .then(r => {
                            if (!r.code && !r.from && !r.result && !r.accept_description) {
                                util_warn('playurl的result缺少必要的字段:', r)
                                r.from = 'local'
                                r.result = 'suee'
                                r.accept_description = ['未知 3P']
                                // r.timelength = r.durl.map(it => it.length).reduce((a, b) => a + b, 0)
                                if (r.durl && r.durl[0] && r.durl[0].url.includes('video-sg.biliplus.com')) {
                                    const aid = window.__INITIAL_STATE__ && window.__INITIAL_STATE__.aid || window.__INITIAL_STATE__.epInfo && window.__INITIAL_STATE__.epInfo.aid || 'fuck'
                                    ui.pop({
                                        content: `原视频已被删除, 当前播放的是<a href="https://video-sg.biliplus.com/">转存服务器</a>中的视频, 速度较慢<br>被删的原因可能是:<br>1. 视频违规<br>2. 视频被归类到番剧页面 => 试下<a href="https://search.bilibili.com/bangumi?keyword=${aid}">搜索av${aid}</a>`
                                    })
                                }
                            }
                            if (isNewPlayurl && !r.code) {
                                r = {
                                    code: 0,
                                    message: 'success',
                                    result: r
                                }
                            }
                            return r
                        })
                        .compose(oriDispatchResultTransformer)
                } else if (param.url.match(RegExps.url('interface.bilibili.com/player?'))) {
                    if (balh_config.blocked_vip) {
                        mySuccess = function (data) {
                            try {
                                let xml = new window.DOMParser().parseFromString(`<userstatus>${data.replace(/\&/g, '&amp;')}</userstatus>`, 'text/xml');
                                let vipTag = xml.querySelector('vip');
                                if (vipTag) {
                                    let vip = JSON.parse(vipTag.innerHTML);
                                    vip.vipType = 2; // 类型, 年度大会员
                                    vip.vipStatus = 1; // 状态, 启用
                                    vipTag.innerHTML = JSON.stringify(vip);
                                    data = xml.documentElement.innerHTML;
                                }
                            } catch (e) {
                                log('parse xml error: ', e);
                            }
                            oriSuccess(data);
                        };
                    }
                } else if (param.url.match(RegExps.url('api.bilibili.com/x/ad/video?'))) {
                    if (balh_config.remove_pre_ad) {
                        mySuccess = function (data) {
                            log('/ad/video', data)
                            if (data && data.code === 0 && data.data) {
                                data.data = [] // 移除广告接口返回的数据
                            }
                            oriSuccess(data)
                        }
                    }
                }

                if (one_api && oriResultTransformer) {
                    // 请求结果通过mySuccess/Error获取, 将其包装成Promise, 方便处理
                    let oriResultPromise = new Promise((resolve, reject) => {
                        mySuccess = resolve
                        myError = reject
                    })
                    if (needRedirect()) {
                        // 通过proxy, 执行请求
                        one_api.asyncAjax(param.url)
                            // proxy报错时, 返回原始请求的结果
                            .catch(e => oriResultPromise.compose(oriResultTransformerWhenProxyError))
                            .compose(dispatchResultTransformer)
                    } else {
                        oriResultPromise
                            .compose(oriResultTransformer)
                            .compose(dispatchResultTransformer)
                    }
                }

                // 若外部使用param.success处理结果, 则替换param.success
                if (oriSuccess && mySuccess) {
                    param.success = mySuccess;
                }
                // 处理替换error
                if (oriError && myError) {
                    param.error = myError;
                }
                // default
                let xhr = originalAjax.apply(this, [param]);

                // 若外部使用xhr.done()处理结果, 则替换xhr.done()
                if (!oriSuccess && mySuccess) {
                    xhr.done(mySuccess);
                    xhr.done = function (success) {
                        oriSuccess = success; // 保存外部设置的success函数
                        return xhr;
                    };
                }
                // 处理替换error
                if (!oriError && myError) {
                    xhr.fail(myError);
                    xhr.fail = function (error) {
                        oriError = error;
                        return xhr;
                    }
                }
                return xhr;
            };
        }



        function isAreaLimitSeason() {
            return cookieStorage['balh_season_' + getSeasonId()];
        }

        function needRedirect() {
            return balh_config.mode === r.const.mode.REDIRECT || (balh_config.mode === r.const.mode.DEFAULT && isAreaLimitSeason())
        }

        function areaLimit(limit) {
            balh_config.mode === r.const.mode.DEFAULT && setAreaLimitSeason(limit)
        }

        function setAreaLimitSeason(limit) {
            var season_id = getSeasonId();
            cookieStorage.set('balh_season_' + season_id, limit ? '1' : undefined, ''); // 第三个参数为'', 表示时Session类型的cookie
            log('setAreaLimitSeason', season_id, limit);
        }
        /** 使用该方法判断是否需要添加module=bangumi参数, 并不准确... */
        function isBangumi(season_type) {
            log(`season_type: ${season_type}`)
            // 1: 动画
            // 2: 电影
            // 3: 纪录片
            // 4: 国创
            // 5: 电视剧
            return season_type != null // 存在season_type就是bangumi?
        }

        function isBangumiPage() {
            const mediaInfo = window.__INITIAL_STATE__?.mediaInfo || window.__NEXT_DATA__?.props.pageProps.dehydratedState?.queries[0]?.state.data.seasonInfo?.mediaInfo
            return isBangumi(mediaInfo?.season_type || mediaInfo?.ssType)
        }

        function getSeasonId() {
            var seasonId;
            // 取anime页面的seasonId
            try {
                // 若w, 是其frame的window, 则有可能没有权限, 而抛异常
                seasonId = window.season_id || window.top.season_id;
            } catch (e) {
                log(e);
            }
            if (!seasonId) {
                try {
                    seasonId = (window.top.location.pathname.match(/\/anime\/(\d+)/) || ['', ''])[1];
                } catch (e) {
                    log(e);
                }
            }

            // 若没取到, 则取movie页面的seasonId, 以m开头
            if (!seasonId) {
                try {
                    seasonId = (window.top.location.pathname.match(/\/movie\/(\d+)/) || ['', ''])[1];
                    if (seasonId) {
                        seasonId = 'm' + seasonId;
                    }
                } catch (e) {
                    log(e);
                }
            }

            // 若没取到, 则去新的番剧播放页面的ep或ss
            if (!seasonId) {
                try {
                    seasonId = (window.top.location.pathname.match(/\/bangumi\/play\/((ep|ss)\d+)/) || ['', ''])[1];
                } catch (e) {
                    log(e);
                }
            }

            // 若没取到, 则从search params获取（比如放映室）
            if (!seasonId) {
                try {
                    seasonId = Strings.getSearchParam(window.location.href, 'seasonid');
                } catch (e) {
                    log(e);
                }
            }

            // 若没取到, 则去取av页面的av号
            if (!seasonId) {
                try {
                    seasonId = (window.top.location.pathname.match(/\/video\/((av|BV)\w+)/) || ['', ''])[1]
                } catch (e) {
                    log(e);
                }
            }
            // 最后, 若没取到, 则试图取出当前页面url中的aid
            if (!seasonId) {
                seasonId = Strings.getSearchParam(window.location.href, 'aid');
                if (seasonId) {
                    seasonId = 'aid' + seasonId;
                }
            }
            return seasonId || '000';
        }

        function isAreaLimitForPlayUrl(json) {
            return (json.errorcid && json.errorcid == '8986943') || (json.durl && json.durl.length === 1 && json.durl[0].length === 15126 && json.durl[0].size === 124627) || !json.video_info;
        }

        var bilibiliApis = (function () {
            function AjaxException(message, code = 0/*用0表示未知错误*/) {
                this.name = 'AjaxException'
                this.message = message
                this.code = code
            }
            AjaxException.prototype.toString = function () {
                return `${this.name}: ${this.message}(${this.code})`
            }
            function BilibiliApi(props) {
                Object.assign(this, props);
            }

            BilibiliApi.prototype.asyncAjaxByProxy = function (originUrl, success, error) {
                var one_api = this;
                $.ajax({
                    url: one_api.transToProxyUrl(originUrl),
                    async: true,
                    xhrFields: { withCredentials: true },
                    success: function (result) {
                        log('==>', result);
                        success(one_api.processProxySuccess(result));
                        // log('success', arguments, this);
                    },
                    error: function (e) {
                        log('error', arguments, this);
                        error(e);
                    }
                });
            };
            BilibiliApi.prototype.asyncAjax = function (originUrl) {
                return Async.ajax(this.transToProxyUrl(originUrl))
                    .then(r => this.processProxySuccess(r))
                    .compose(util_ui_msg.showOnNetErrorInPromise()) // 出错时, 提示服务器连不上
            }
            var get_source_by_aid = new BilibiliApi({
                transToProxyUrl: function (url) {
                    return balh_config.server + '/api/view?id=' + window.aid + `&update=true${access_key_param_if_exist()}`;
                },
                processProxySuccess: function (data) {
                    if (data && data.list && data.list[0] && data.movie) {
                        return {
                            code: 0,
                            message: 'success',
                            result: {
                                cid: data.list[0].cid,
                                formal_aid: data.aid,
                                movie_status: balh_config.blocked_vip ? 2 : data.movie.movie_status, // 2, 大概是免费的意思?
                                pay_begin_time: 1507708800,
                                pay_timestamp: 0,
                                pay_user_status: data.movie.pay_user.status, // 一般都是0
                                player: data.list[0].type, // 一般为movie
                                vid: data.list[0].vid,
                                vip: { // 2+1, 表示年度大会员; 0+0, 表示普通会员
                                    vipType: balh_config.blocked_vip ? 2 : 0,
                                    vipStatus: balh_config.blocked_vip ? 1 : 0,
                                }
                            }
                        };
                    } else {
                        return {
                            code: -404,
                            message: '不存在该剧集'
                        };
                    }
                }
            });
            var get_source_by_season_id = new BilibiliApi({
                transToProxyUrl: function (url) {
                    return balh_config.server + '/api/bangumi?season=' + window.season_id + access_key_param_if_exist();
                },
                processProxySuccess: function (data) {
                    var found = null;
                    if (!data.code) {
                        for (var i = 0; i < data.result.episodes.length; i++) {
                            if (data.result.episodes[i].episode_id == window.episode_id) {
                                found = data.result.episodes[i];
                            }
                        }
                    } else {
                        ui.alert('代理服务器错误:' + JSON.stringify(data) + '\n点击刷新界面.', window.location.reload.bind(window.location));
                    }
                    var returnVal = found !== null
                        ? {
                            "code": 0,
                            "message": "success",
                            "result": {
                                "aid": found.av_id,
                                "cid": found.danmaku,
                                "episode_status": balh_config.blocked_vip ? 2 : found.episode_status,
                                "payment": { "price": "9876547210.33" },
                                "pay_user": {
                                    "status": balh_config.blocked_vip ? 1 : 0 // 是否已经支付过
                                },
                                "player": "vupload",
                                "pre_ad": 0,
                                "season_status": balh_config.blocked_vip ? 2 : data.result.season_status
                            }
                        }
                        : { code: -404, message: '不存在该剧集' };
                    return returnVal;
                }
            });
            var playurl_by_bilibili = new BilibiliApi({
                dataType: 'xml',
                transToProxyUrl: function (originUrl) {
                    const api_url = 'https://interface.bilibili.com/playurl?'
                    const bangumi_api_url = 'https://bangumi.bilibili.com/player/web_api/playurl?'
                    const SEC_NORMAL = '1c15888dc316e05a15fdd0a02ed6584f'
                    const SEC_BANGUMI = '9b288147e5474dd2aa67085f716c560d'

                    // 不设置module; 带module的接口都是有区域限制的...
                    let module = undefined /*Strings.getSearchParam(originUrl, 'module')*/
                    // 不使用json; 让服务器直接返回json时, 获取的视频url不能直接播放...天知道为什么
                    let useJson = false
                    let paramDict = {
                        cid: Strings.getSearchParam(originUrl, 'cid'),
                        quality: Strings.getSearchParam(originUrl, 'quality'),
                        qn: Strings.getSearchParam(originUrl, 'qn'), // 增加这个参数, 返回的清晰度更多
                        player: 1,
                        ts: Math.floor(Date.now() / 1000),
                    }
                    if (localStorage.access_key) {
                        paramDict.access_key = localStorage.access_key
                    }
                    if (module) paramDict.module = module
                    if (useJson) paramDict.otype = 'json'
                    let { sign, params } = Converters.generateSign(paramDict, module ? SEC_BANGUMI : SEC_NORMAL)
                    let url = module ? bangumi_api_url : api_url + params + '&sign=' + sign
                    return url
                },
                processProxySuccess: function (result, alertWhenError = true) {
                    // 将xml解析成json
                    let obj = Converters.xml2obj(result.documentElement)
                    if (!obj || obj.code) {
                        if (alertWhenError) {
                            ui.alert(`从B站接口获取视频地址失败\nresult: ${JSON.stringify(obj)}\n\n点击确定, 进入设置页面关闭'使用B站接口获取视频地址'功能`, settings.show)
                        } else {
                            return Promise.reject(`服务器错误: ${JSON.stringify(obj)}`)
                        }
                    } else {
                        obj.accept_quality && (obj.accept_quality = obj.accept_quality.split(',').map(n => +n))
                        if (!obj.durl.push) {
                            obj.durl = [obj.durl]
                        }
                        obj.durl.forEach((item) => {
                            if (item.backup_url === '') {
                                item.backup_url = undefined
                            } else if (item.backup_url && item.backup_url.url) {
                                item.backup_url = item.backup_url.url
                            }
                        })
                    }
                    log('xml2obj', result, '=>', obj)
                    return obj
                },
                _asyncAjax: function (originUrl) {
                    return Async.ajax(this.transToProxyUrl(originUrl))
                        .then(r => this.processProxySuccess(r, false))
                }
            })
            var playurl_by_proxy = new BilibiliApi({
                _asyncAjax: function (originUrl, bangumi) {
                    return Async.ajax(this.transToProxyUrl(originUrl, bangumi))
                        .then(r => this.processProxySuccess(r, false))
                },
                transToProxyUrl: function (url, bangumi) {
                    let params = url.split('?')[1];
                    if (bangumi === undefined) { // 自动判断
                        // av页面中的iframe标签形式的player, 不是番剧视频
                        bangumi = !util_page.player_in_av()
                        // url中存在season_type的情况
                        let season_type_param = Strings.getSearchParam(url, 'season_type')
                        if (season_type_param && !isBangumi(+season_type_param)) {
                            bangumi = false
                        }
                        if (!bangumi) {
                            params = params.replace(/&?module=(\w+)/, '') // 移除可能存在的module参数
                        }
                    } else if (bangumi === true) { // 保证添加module=bangumi参数
                        params = params.replace(/&?module=(\w+)/, '')
                        params += '&module=bangumi'
                    } else if (bangumi === false) { // 移除可能存在的module参数
                        params = params.replace(/&?module=(\w+)/, '')
                    }
                    // 管他三七二十一, 强行将module=bangumi替换成module=pgc _(:3」∠)_
                    params = params.replace(/(&?module)=bangumi/, '$1=pgc')
                    return `${balh_config.server}/BPplayurl.php?${params}${access_key_param_if_exist()}${platform_android_param_if_app_only()}`;
                },
                processProxySuccess: function (data, alertWhenError = true) {
                    // data有可能为null
                    if (data && data.code === -403) {
                        ui.pop({
                            content: `<b>code-403</b>: <i style="font-size:4px;white-space:nowrap;">${JSON.stringify(data)}</i>\n\n当前代理服务器（${balh_config.server}）依然有区域限制\n\n可以考虑进行如下尝试:\n1. 进行“帐号授权”\n2. 换个代理服务器\n3. 耐心等待服务端修复问题\n\n点击确定, 打开设置页面`,
                            onConfirm: settings.show,
                        })
                    } else if (data === null || data.code) {
                        util_error(data);
                        if (alertWhenError) {
                            ui.alert(`突破黑洞失败\n${JSON.stringify(data)}\n点击确定刷新界面`, window.location.reload.bind(window.location));
                        } else {
                            return Promise.reject(new AjaxException(`服务器错误: ${JSON.stringify(data)}`, data ? data.code : 0))
                        }
                    } else if (isAreaLimitForPlayUrl(data) || data.code === 401) {
                        util_error('>>area limit');
                        ui.pop({
                            content: `突破黑洞失败\n${data.message}\n需要登录\n点此确定进行登录`,
                            onConfirm: bilibili_login.showLogin
                        })
                    } else {
                        if (balh_config.flv_prefer_ws) {
                            data.durl.forEach(function (seg) {
                                var t, url, i;
                                if (!seg.url.includes('ws.acgvideo.com')) {
                                    for (i in seg.backup_url) {
                                        url = seg.backup_url[i];
                                        if (url.includes('ws.acgvideo.com')) {
                                            log('flv prefer use:', url);
                                            t = seg.url;
                                            seg.url = url;
                                            url = t;
                                            break;
                                        }
                                    }

                                }
                            });
                        }
                    }
                    return data;
                }
            })
            // https://github.com/kghost/bilibili-area-limit/issues/3
            const playurl_by_kghost = new BilibiliApi({
                _asyncAjax: function (originUrl) {
                    const proxyHostMap = [
                        [/僅.*台.*地區/, '//bilibili-tw-api.kghost.info/', []],
                        [/僅.*港.*地區/, '//bilibili-hk-api.kghost.info/', [
                            34680, // 安达与岛村
                            36297,
                        ]],
                        [/仅限东南亚/, '//bilibili-sg-api.kghost.info/', []],
                        [/.*/, '//bilibili-cn-api.kghost.info/', []],
                    ];
                    let proxyHost
                    for (const [regex, host, ssIds] of proxyHostMap) {
                        if (document.title.match(regex) || ssIds.includes(util_page.ssId)) {
                            proxyHost = host
                            break;
                        }
                    }
                    if (proxyHost) {
                        return Async.ajax(this.transToProxyUrl(originUrl, proxyHost))
                            .then(r => this.processProxySuccess(r))
                    } else {
                        return Promise.reject("没有支持的服务器")
                    }
                },
                transToProxyUrl: function (originUrl, proxyHost) {
                    return originUrl.replace(/^(https:)?(\/\/api\.bilibili\.com\/)/, `$1${proxyHost}`) + access_key_param_if_exist(true);
                },
                processProxySuccess: function (result) {
                    if (result.code) {
                        return Promise.reject(result)
                    }
                    return result.result
                },
            })
            const playurl_by_custom = new BilibiliApi({
                _asyncAjax: function (originUrl) {
                    return this.selectServer(originUrl).then(r => this.processProxySuccess(r))
                },
                selectServer: async function (originUrl) {
                    let result
                    // 对应this.transToProxyUrl的参数, 用`/`分隔, 形如: `${proxyHost}/${area}`
                    let tried_server_args = []
                    const isTriedServerArg = (proxyHost, area) => tried_server_args.includes(`${proxyHost}/*`) || tried_server_args.includes(`${proxyHost}/${area}`)
                    /**
                     * @param {string} proxyHost 代理地址
                     * @param {"cn"|"hk"|"th"|"cn"|""} area 区域
                     */
                    const requestPlayUrl = (proxyHost, area) => {
                        tried_server_args.push(`${proxyHost}/${area}`)
                        return Async.ajax(this.transToProxyUrl(originUrl, proxyHost, area))
                            // 捕获错误, 防止依次尝试各各服务器的流程中止
                            .catch((e) => {
                                // proxyHost临时不可用, 将它添加到tried_server_args中, 防止重复请求
                                tried_server_args.push(`${proxyHost}/*`)
                                return ({ code: -1, error: e });
                            })
                    }

                    // 标题有明确说明优先尝试，通常准确率最高
                    if (/(僅|仅)限?(臺|台)(灣|湾)/.test(document.title) && balh_config.server_custom_tw) {
                        ui.playerMsg('捕获标题提示，使用台湾代理服务器拉取视频地址...')
                        result = await requestPlayUrl(balh_config.server_custom_tw, 'tw')
                        if (!result.code) {
                            return Promise.resolve(result)
                        }
                    }
                    if (/(僅|仅)限?港澳/.test(document.title) && balh_config.server_custom_hk) {
                        ui.playerMsg('捕获标题提示，使用香港代理服务器拉取视频地址...')
                        result = await requestPlayUrl(balh_config.server_custom_hk, 'hk')
                        if (!result.code) {
                            return Promise.resolve(result)
                        }
                    }

                    // 服务器列表, 按顺序解析
                    const server_list = [
                        // 大陆, 通过标题没法区分
                        [balh_config.server_custom_cn, '大陆', 'cn'],
                        // 泰, 通过标题没法区分
                        [balh_config.server_custom_th, '泰国（东南亚）', 'th'],
                        // 港台, 一般能够从标题中匹配到, 因而优先级可以低一点
                        [balh_config.server_custom_hk, '香港', 'hk'],
                        [balh_config.server_custom_tw, '台湾', 'tw'],
                    ]

                    // 尝试读取番剧区域缓存判断番剧区域进行解析
                    let bangumi_area_cache = {}
                    if (localStorage.getItem('balh_bangumi_area_cache')) {
                        bangumi_area_cache = JSON.parse(localStorage.getItem('balh_bangumi_area_cache'))
                        if (util_page.ssId && bangumi_area_cache.hasOwnProperty(util_page.ssId)) {
                            // 缓存存在
                            let server_list_map = {}
                            server_list.forEach((item) => {
                                server_list_map[item[2]] = item
                            })
                            let area_code = bangumi_area_cache[util_page.ssId]
                            let cache_host = server_list_map[area_code][0]
                            let cache_host_name = server_list_map[area_code][1]
                            ui.playerMsg(`读取番剧地区缓存，使用${cache_host_name}代理服务器拉取视频地址...`)
                            if (cache_host) {
                                result = await requestPlayUrl(cache_host, area_code)
                                if (!result.code) {
                                    return Promise.resolve(result)
                                }
                            }
                        }
                    }

                    // 首选服务器解析
                    if (balh_config.server_custom) {
                        ui.playerMsg('使用首选代理服务器拉取视频地址...')
                        // 首选代理服务器的area参数需要为空
                        result = await requestPlayUrl(balh_config.server_custom, '')
                        if (!result.code) {
                            return Promise.resolve(result)
                        }
                    }


                    // 首选服务器失败后开始尝试服务器列表, 按顺序解析
                    for (let server_info of server_list) {
                        const host = server_info[0]
                        const host_name = server_info[1]
                        const host_code = server_info[2]
                        // 请求过的服务器, 不应该重复请求
                        if (host && (!isTriedServerArg(host, host_code))) {
                            ui.playerMsg(`使用${host_name}代理服务器拉取视频地址...`)
                            result = await requestPlayUrl(host, host_code)
                            if (!result.code) {
                                // 解析成功，将结果存入番剧区域缓存
                                if (util_page.ssId) {
                                    bangumi_area_cache[util_page.ssId] = host_code
                                    localStorage.setItem('balh_bangumi_area_cache', JSON.stringify(bangumi_area_cache))
                                }
                                return Promise.resolve(result)
                            }
                        }
                    }
                    return Promise.resolve(result)  // 都失败了，返回最后一次数据
                },
                transToProxyUrl: function (originUrl, proxyHost, area) {
                    if (r.regex.bilibili_api_proxy.test(proxyHost)) {
                        if (area === 'th') {
                            // 泰区番剧解析
                            return getMobiPlayUrl(originUrl, proxyHost, area)
                        }
                        if (window.__balh_app_only__) {
                            // APP 限定用 mobi api
                            return getMobiPlayUrl(originUrl, proxyHost, area)
                        }
                        return originUrl.replace(/^(https:)?(\/\/api\.bilibili\.com\/)/, `$1${proxyHost}/`) + '&area=' + area + access_key_param_if_exist(true);
                    } else {
                        if (window.__balh_app_only__) {
                            return `${proxyHost}?${generateMobiPlayUrlParams(originUrl)}`
                        }
                        // 将proxyHost当成接口的完整路径进行拼接
                        const params = originUrl.split('?')[1]
                        return `${proxyHost}?${params}${access_key_param_if_exist(true)}`

                    }
                },
                processProxySuccess: function (result) {
                    if (result.code) {
                        return Promise.reject(result)
                    }
                    // 在APP限定情况启用 mobi api 解析
                    if (window.__balh_app_only__) {
                        // 泰区番也是 APP 限定
                        if (result.hasOwnProperty('data')) {
                            return fixThailandPlayUrlJson(result)
                        }
                        if (result['type'] == "DASH") {
                            return fixMobiPlayUrlJson(result)
                        }
                        return result;
                    }
                    return result.result
                },
            })
            const playurl = new BilibiliApi({
                asyncAjax: function (originUrl) {
                    ui.playerMsg(`从${r.const.server.CUSTOM === balh_config.server_inner ? '自定义' : '代理'}服务器拉取视频地址中...`)
                    return (r.const.server.CUSTOM === balh_config.server_inner ? playurl_by_custom._asyncAjax(originUrl) : (playurl_by_proxy._asyncAjax(originUrl) // 优先从代理服务器获取
                        .catch(e => {
                            if (e instanceof AjaxException) {
                                ui.playerMsg(e)
                                if (e.code === 1 // code: 1 表示非番剧视频, 不能使用番剧视频参数
                                    || (Strings.getSearchParam(originUrl, 'module') === 'bangumi' && e.code === -404)) { // 某些番剧视频又不需要加module=bangumi, 详见: https://github.com/ipcjs/bilibili-helper/issues/494
                                    ui.playerMsg('尝试使用非番剧视频接口拉取视频地址...')
                                    return playurl_by_proxy._asyncAjax(originUrl, false)
                                        .catch(e2 => Promise.reject(e)) // 忽略e2, 返回原始错误e
                                } else if (e.code === 10004) { // code: 10004, 表示视频被隐藏, 一般添加module=bangumi参数可以拉取到视频
                                    ui.playerMsg('尝试使用番剧视频接口拉取视频地址...')
                                    return playurl_by_proxy._asyncAjax(originUrl, true)
                                        .catch(e2 => Promise.reject(e))
                                }
                            }
                            return Promise.reject(e)
                        })))
                        .catch(e => {
                            if ((typeof e === 'object' && e.statusText == 'error')
                                || (e instanceof AjaxException && (e.code === -502 || e.code === -412/*请求被拦截*/ || e.code === -500/*已爆炸*/))
                                || (typeof e === 'object' && e.code === -10403)
                            ) {
                                ui.playerMsg('尝试使用kghost的服务器拉取视频地址...')
                                return playurl_by_kghost._asyncAjax(originUrl)
                                    .catch(e2 => Promise.reject(e))
                            }
                            return Promise.reject(e)
                        })
                        // 报错时, 延时1秒再发送错误信息
                        .catch(e => Async.timeout(1000).then(r => Promise.reject(e)))
                        .catch(e => {
                            let msg
                            if (typeof e === 'object' && e.statusText == 'error') {
                                msg = '代理服务器临时不可用'
                                ui.playerMsg(msg)
                            } else {
                                msg = Objects.stringify(e)
                            }
                            ui.pop({
                                content: `## 拉取视频地址失败\n原因: ${msg}\n\n可以考虑进行如下尝试:\n1. 多<a href="">刷新</a>几下页面\n2. 进入<a href="javascript:bangumi_area_limit_hack.showSettings();">设置页面</a>更换代理服务器\n3. 耐心等待代理服务器端修复问题`,
                                onConfirm: window.location.reload.bind(window.location),
                                confirmBtn: '刷新页面'
                            })
                            return Promise.reject(e)
                        })
                        .then(data => {
                            if (data.dash) {
                                // dash中的字段全部变成了类似C语言的下划线风格...
                                Objects.convertKeyToSnakeCase(data.dash)
                            }
                            // 替换后大多数bangumi下的视频都会报CROS错误
                            if (!window.__balh_app_only__ && balh_config.upos_server) {
                                return Converters.replaceUpos(data, uposMap[balh_config.upos_server], balh_config.upos_replace_akamai)
                            }
                            return data
                        })
                }
            })
            return {
                _get_source: util_page.movie() ? get_source_by_aid : get_source_by_season_id,
                _playurl: playurl,
            };
        })();

        if (util_page.anime_ep_m() || util_page.anime_ss_m()) {
            // BiliPlusApi.playurl_for_mp4返回的url能在移动设备上播放的前提是, 请求头不包含Referer...
            // 故这里设置meta, 使页面不发送Referer
            // 注意动态改变引用策略的方式并不是标准行为, 目前在Chrome上测试是有用的
            document.head.appendChild(_('meta', { name: "referrer", content: "no-referrer" }))
            injectFetch4Mobile()
            util_init(() => {
                const $wrapper = document.querySelector('.player-wrapper')
                new MutationObserver(function (mutations, observer) {
                    for (let mutation of mutations) {
                        if (mutation.type === 'childList') {
                            for (let node of mutation.addedNodes) {
                                if (node.tagName === 'DIV' && node.className.split(' ').includes('player-mask')) {
                                    log('隐藏添加的mask')
                                    node.style.display = 'none'
                                }
                            }
                        }
                    }
                }).observe($wrapper, {
                    childList: true,
                    attributes: false,
                });
            })
        }
        injectXhr()
        if (true) {
            let jQuery = window.jQuery;
            if (jQuery) { // 若已加载jQuery, 则注入
                injectAjax()
            }
            // 需要监听jQuery变化, 因为有时会被设置多次...
            Object.defineProperty(window, 'jQuery', {
                configurable: true, enumerable: true, set: function (v) {
                    // debugger
                    log('set jQuery', jQuery, '->', v)
                    // 临时规避这个问题：https://github.com/ipcjs/bilibili-helper/issues/297
                    // 新的av页面中, 运行脚本的 injectXHR() 后, 页面会往该方法先后设置两个jQuery...原因未知
                    // 一个从jquery.min.js中设置, 一个从player.js中设置
                    // 并且点击/载入等事件会从两个jQuery中向下分发...导致很多功能失常
                    // 这里我们屏蔽掉jquery.min.js分发的一些事件, 避免一些问题
                    if (util_page.av_new() && balh_config.enable_in_av) {
                        try { // 获取调用栈的方法不是标准方法, 需要try-catch
                            const stack = (new Error()).stack.split('\n')
                            if (stack[stack.length - 1].includes('jquery')) { // 若从jquery.min.js中调用
                                log('set jQueury by jquery.min.js', v)
                                v.fn.balh_on = v.fn.on
                                v.fn.on = function (arg0, arg1) {
                                    if (arg0 === 'click.reply' && arg1 === '.reply') {
                                        // 屏蔽掉"回复"按钮的点击事件
                                        log('block click.reply', arguments)
                                        return
                                    }
                                    return v.fn.balh_on.apply(this, arguments)
                                }
                            }
                            // jQuery.fn.paging方法用于创建评论区的页标, 需要迁移到新的jQuery上
                            if (jQuery != null && jQuery.fn.paging != null
                                && v != null && v.fn.paging == null) {
                                log('迁移jQuery.fn.paging')
                                v.fn.paging = jQuery.fn.paging
                            }
                        } catch (e) {
                            util_error(e)
                        }
                    }

                    jQuery = v;
                    injectAjax();// 设置jQuery后, 立即注入
                }, get: function () {
                    return jQuery;
                }
            });
        }
    }
})()