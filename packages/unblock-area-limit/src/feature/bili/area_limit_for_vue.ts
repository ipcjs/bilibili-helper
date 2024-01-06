import { BiliBiliApi } from "../../api/bilibili"
import { BiliPlusApi } from "../../api/biliplus"
import { BalhDb } from "../../util/balh-db"
import { Converters } from "../../util/converters"
import { cookieStorage } from "../../util/cookie"
import { util_init } from "../../util/initiator"
import { log, util_warn } from "../../util/log"
import { Objects } from "../../util/objects"
import { _ } from "../../util/react"
import { Strings } from "../../util/strings"
import { ui } from "../../util/ui"
import { ifNotNull } from "../../util/utils"
import { balh_config, isClosed } from "../config"
import { util_page } from "../page"
import pageTemplate from './bangumi-play-page-template.html'
import { bilibili_login } from "./bilibili_login"

export function modifyGlobalValue<T = any>(
    name: string,
    options: {
        // onWrite可以修改写入的值
        onWrite: (value: T | undefined) => T | undefined,
        // onRead可以用来打断点...
        onRead?: (value: T | undefined) => void
    },
) {
    const _window = window as StringAnyObject
    const name_origin = `${name}_origin`
    _window[name_origin] = _window[name]
    let value: T | undefined = undefined
    Object.defineProperty(_window, name, {
        configurable: true,
        enumerable: true,
        get: () => {
            options?.onRead?.(value)
            return value
        },
        set: (val) => {
            value = options.onWrite(val)
        }
    })
    if (_window[name_origin]) {
        _window[name] = _window[name_origin]
    }
}

let callbackCount = 1000
function appendScript(
    node: Node,
    innerHTML: string,
    props: {
        type: string | '',
        src: string | '',
        crossOrigin: string | null,
    },
) {
    // log(`fuck: ${JSON.stringify(props)}`)
    return new Promise((resolve, reject) => {
        let onLoad
        if (props.src) {
            onLoad = resolve
        } else if (!props.type || props.type === 'text/javascript') {
            const anyWindow = window as any
            const key: string = `balh_appendScript_${callbackCount++}`
            anyWindow[key] = resolve
            innerHTML = `try { ${innerHTML} } finally { window['${key}'](); } `
        } else {
            setTimeout(resolve, 0)
        }
        node.appendChild(_('script', {
            // 所有属性为null/''时都替换成undefined
            type: props.type || undefined,
            src: props.src || undefined,
            crossOrigin: props.crossOrigin || undefined,
            // 无论成功失败, 都需要让异步方法继续执行下去
            event: { load: onLoad, error: onLoad },
        }, innerHTML))
    })
}
async function cloneChildNodes(fromNode: Node, toNode: Node) {
    // 坑1: 一定要倒序遍历, forEach内部使用的顺序遍历实现, 直接remove()会让顺序混乱
    for (let i = toNode.childNodes.length - 1; i >= 0; i--) {
        toNode.childNodes[i].remove()
    }

    for (let i = 0; i < fromNode.childNodes.length; i++) {
        const it = fromNode.childNodes[i]
        if (it instanceof HTMLScriptElement) {
            // 坑2: 要让script内容正常执行, 一定要重新构建script标签
            await appendScript(toNode, it.innerHTML, { type: it.type, src: it.src, crossOrigin: it.crossOrigin })
        } else {
            // 坑3: 不clone可能导致forEach方法出问题...
            toNode.appendChild(it.cloneNode(true))
        }
    }
}

interface TemplateArgs {
    id: any,
    aid: any,
    cid: any,
    bvid: any,
    title: any,
    titleFormat: any,
    htmlTitle: any,
    mediaInfoTitle: any,
    mediaInfoId: any,
    evaluate: any,
    cover: any,
    ssId: any,
    episodes?: any,
    appOnly: boolean,
}

async function fixThailandSeason(ep_id: string, season_id: string) {
    // 部分泰区番剧通过 bangumi 无法取得数据或者数据不完整
    // 通过泰区 api 补全
    // https://github.com/yujincheng08/BiliRoaming/issues/112
    const thailandApi = new BiliBiliApi(balh_config.server_custom_th)
    const origin = await thailandApi.getSeasonInfoByEpSsIdOnThailand(ep_id, season_id)
    if (origin.code === 401)
        bilibili_login.clearLoginFlag()
    origin.result.actors = origin.result.actor.info
    origin.result.is_paster_ads = 0
    origin.result.jp_title = origin.result.origin_name
    origin.result.newest_ep = origin.result.new_ep
    origin.result.season_status = origin.result.status
    origin.result.season_title = origin.result.title
    origin.result.rights.watch_platform = 1

    origin.result.episodes = []
    if (origin.result.modules.length > 0) {
        origin.result.modules[0].data.episodes.forEach((ep) => {
            ep.episode_status = ep.status
            ep.ep_id = ep.id
            ep.index = ep.title
            ep.index_title = ep.long_title
            origin.result.episodes?.push(ep)
            if (season_id !== '5551')
                BalhDb.setSsId(ep.id, season_id)//
                    .catch((e) => util_warn('setSsId failed', e))
        })
        origin.result.total = origin.result.modules[0].data.episodes.length
    }
    origin.result.total_ep = origin.result.total
    origin.result.style = []
    origin.result.styles?.forEach((it) => {
        origin.result.style.push(it.name)
    })
    return { code: origin.code, message: origin.message, data: origin.result }
}

let invalidInitialState: StringAnyObject | undefined
function fixBangumiPlayPage() {
    util_init(async () => {
        if (util_page.bangumi_md()) {
            // 临时保存当前的season_id
            cookieStorage.set('balh_curr_season_id', window?.__INITIAL_STATE__?.mediaInfo?.season_id, '')
        }
        if (util_page.anime_ep() || util_page.anime_ss()) {
            // 旧版偶尔会出现client-app，why？
            const $app = document.getElementById('app') || document.getElementById('client-app');
            if ((!$app || invalidInitialState) && !window.__NEXT_DATA__) {
                // 这个fixBangumiPlayPage()函数，本来是用来重建appOnly页面的，不过最近这样appOnly的页面基本上没有了，反而出现了一批非appOnly但页面也需要重建的情况
                // 如：https://www.bilibili.com/bangumi/media/md28235576
                // 故当前默认值改为false🤔
                let appOnly = invalidInitialState?.mediaInfo?.rights?.appOnly ?? false
                try {
                    // 读取保存的season_id
                    let season_id = (window.location.pathname.match(/\/bangumi\/play\/ss(\d+)/) || ['', cookieStorage.get('balh_curr_season_id')])[1]
                    const ep_id = (window.location.pathname.match(/\/bangumi\/play\/ep(\d+)/) || ['', ''])[1]
                    const bilibiliApi = new BiliBiliApi(balh_config.server_bilibili_api_proxy)
                    let templateArgs: TemplateArgs | null = null

                    // 不限制地区的接口，可以查询泰区番剧，该方法前置给代理服务器和BP节省点请求
                    // 如果该接口失效，自动尝试后面的方法
                    try {
                        let result = await bilibiliApi.getSeasonInfoById(season_id, ep_id)
                        if (result.code == -404) {
                            if (season_id) {
                                try {
                                    let mediaInfo = await bilibiliApi.getMediaInfoBySeasonId(season_id)
                                    if (mediaInfo.season_id) {
                                        mediaInfo.refine_cover = decodeURI(mediaInfo.cover)
                                        mediaInfo.share_copy = mediaInfo.title
                                        mediaInfo.share_url = `https://www.bilibili.com/bangumi/play/ss${mediaInfo.season_id}`
                                        mediaInfo.short_link = `https://b23.tv/ss${mediaInfo.season_id}`
                                        mediaInfo.status = mediaInfo.season_status
                                        mediaInfo.rights.area_limit = 0
                                        mediaInfo.rights.ban_area_show = 0
                                        mediaInfo.rights.is_preview = 0
                                        mediaInfo.staff = { info: mediaInfo.staff }
                                        result = { code: 0, data: mediaInfo, message: "success" }
                                    }
                                } catch (error) {
                                }
                            }
                        }
                        if (result.code != 0 && balh_config.server_custom_th) {
                            result = await fixThailandSeason(ep_id, season_id)
                            appOnly = true
                        }
                        if (result.code != 0) {
                            throw result
                        }
                        if (ep_id != '') season_id = result.data.season_id.toString()
                        result.result = result.data
                        result.result.modules?.forEach((module: { data: { [x: string]: any }; id: any }, mid: number) => {
                            if (module.data) {
                                let sid = module.id ? module.id : mid + 1
                                module.data['id'] = sid
                            }
                        })
                        let seasons: any[] = []
                        result.result.modules?.forEach((module: { data: { seasons?: any[], episodes?: any[] } }) => {
                            if (module.data.seasons) {
                                module.data.seasons.forEach(season => {
                                    seasons.push(season)
                                })
                            } else if (module.data.episodes) {
                                module.data.episodes.forEach(ep => {
                                    seasons.push(ep)
                                })
                            }
                        })
                        result.result['seasons'] = seasons
                        if (!result.result.episodes) {
                            const section = await bilibiliApi.getSeasonSectionBySsId(season_id)
                            result.result['episodes'] = section.result.main_section.episodes
                            result.result['section'] = section.result.section
                            result.result['positive'] = { id: section.result.main_section.id, title: section.result.main_section.title }
                        }

                        if (result.result.episodes.length > 0) {
                            const episodeInfo = await bilibiliApi.getEpisodeInfoByEpId(result.result.episodes[0].id)
                            if (episodeInfo.code = 0) {
                                result.result['up_info'] = episodeInfo.data.related_up[0]
                            }
                            result.result.episodes.forEach((ep: { [x: string]: any; id: any }) => {
                                ep['bvid'] = Converters.aid2bv(ep.aid)
                                ep['ep_id'] = ep.id
                                ep['link'] = `https://www.bilibili.com/bangumi/play/ep${ep.id}`
                                ep['rights'] = { allow_download: 1, area_limit: 0, allow_dm: 1 }
                                ep['short_link'] = `https://b23.tv/ep${ep.id}`
                            })
                        }
                        if (result.result.section) {
                            result.result.section.forEach(section => {
                                section.episodes.forEach((ep: { [x: string]: any; id: any }) => {
                                    ep['bvid'] = Converters.aid2bv(ep.aid)
                                    ep['ep_id'] = ep.id
                                    ep['link'] = `https://www.bilibili.com/bangumi/play/ep${ep.id}`
                                    ep['rights'] = { allow_download: 1, area_limit: 0, allow_dm: 1 }
                                    ep['short_link'] = `https://b23.tv/ep${ep.id}`
                                })
                            })
                        }
                        const ep = ep_id != '' ? result.result.episodes.find(ep => ep.ep_id === +ep_id) : result.result.episodes[0]
                        const eps = JSON.stringify(result.result.episodes.map((item, index) => {
                            // 返回的数据是有序的，不需要另外排序                                
                            if (/^\d+(\.\d+)?$/.exec(item.title)) {
                                item.titleFormat = "第" + item.title + "话 " + item.long_title
                            } else {
                                item.titleFormat = item.long_title
                            }
                            item.index_title = item.long_title
                            item.loaded = true
                            item.epStatus = item.status
                            item.sectionType = 0
                            item.id = +item.ep_id
                            item.i = index
                            item.link = 'https://www.bilibili.com/bangumi/play/ep' + item.ep_id
                            item.title = item.titleFormat
                            if (item.jump) item['skip'] = item.jump
                            return item
                        }))
                        let titleForma
                        if (ep?.index_title) {
                            titleForma = ep.index_title
                        } else {
                            titleForma = "第" + ep?.index + "话"
                        }
                        templateArgs = {
                            id: ep?.ep_id,
                            aid: ep?.aid,
                            cid: ep?.cid,
                            bvid: ep?.bvid,
                            title: ep?.index,
                            titleFormat: Strings.escapeSpecialChars(titleForma),
                            htmlTitle: result.result.title,
                            mediaInfoId: result.result.media_id,
                            mediaInfoTitle: result.result.title,
                            evaluate: Strings.escapeSpecialChars(result.result.evaluate),
                            cover: result.result.cover,
                            episodes: eps,
                            ssId: result.result.season_id,
                            appOnly: appOnly,
                        }
                    } catch (e) {
                        util_warn('通过bangumi接口获取ep信息失败', e)
                    }

                    if (balh_config.server_bilibili_api_proxy && !templateArgs) {
                        try {
                            const result = await bilibiliApi.getSeasonInfoByEpSsId(ep_id, season_id)
                            if (result.code) {
                                throw result
                            }
                            const ep = result.result.episodes.find(ep => ep.id === +ep_id)
                            if (!ep) {
                                throw `未找到${ep_id}对应的视频信息`
                            }
                            const eps = JSON.stringify(result.result.episodes.map((item, index) => {
                                item.loaded = true
                                item.epStatus = item.status
                                item.sectionType = 0
                                item.titleFormat = "第" + item.title + "话 " + item.long_title
                                item.i = index
                                return item
                            }))
                            templateArgs = {
                                id: ep.id,
                                aid: ep.aid,
                                cid: ep.cid,
                                bvid: ep.bvid,
                                title: ep.title,
                                titleFormat: ep.long_title,
                                htmlTitle: result.result.season_title,
                                mediaInfoId: result.result.media_id,
                                mediaInfoTitle: result.result.season_title,
                                evaluate: result.result.evaluate,
                                cover: result.result.cover,
                                episodes: eps,
                                ssId: result.result.season_id,
                                appOnly: appOnly,
                            }
                        } catch (e) {
                            // 很多balh_config.server_bilibili_api_proxy并不支持代理所有Api
                            // catch一下, 回退到用biliplus的api的读取ep的信息
                            util_warn('通过自定义代理服务器获取ep信息失败', e)
                        }
                    }
                    if (!templateArgs) {
                        if (!season_id) {
                            throw '无法获取season_id, 请先刷新动画对应的www.bilibili.com/bangumi/media/md页面'
                        }
                        const result = await BiliPlusApi.season(season_id)
                        if (result.code) {
                            throw result
                        }
                        const ep = result.result.episodes.find((ep) => ep.episode_id === ep_id)
                        if (!ep) {
                            throw '无法查询到ep信息, 请先刷新动画对应的www.bilibili.com/bangumi/media/md页面'
                        }
                        let pvCounter = 1
                        const ep_length = result.result.episodes.length
                        const eps = JSON.stringify(result.result.episodes.map((item) => {
                            if (/^\d+$/.exec(item.index)) {
                                item.titleFormat = "第" + item.index + "话 " + item.index_title
                                item.i = +item.index - 1
                            } else {
                                item.titleFormat = item.index
                                item.i = ep_length - pvCounter
                                pvCounter++
                                item.index_title = item.index
                            }
                            item.link = 'https://www.bilibili.com/bangumi/play/ep' + item.episode_id
                            item.bvid = Converters.aid2bv(+item.av_id)
                            item.badge = ''
                            item.badge_info = { "bg_color": "#FB7299", "bg_color_night": "#BB5B76", "text": "" }
                            item.badge_type = 0
                            item.title = item.index
                            item.id = +item.episode_id
                            item.cid = +item.danmaku
                            item.aid = +item.av_id
                            item.loaded = true
                            item.epStatus = item.episode_status
                            item.sectionType = item.episode_type
                            item.rights = { 'allow_demand': 0, 'allow_dm': 1, 'allow_download': 0, 'area_limit': 0 }
                            return item
                        }).sort((a, b) => {
                            return a.i - b.i  // BP接口返回的数据是无序的，需要排序
                        }))
                        templateArgs = {
                            id: ep.episode_id,
                            aid: ep.av_id,
                            cid: ep.danmaku,
                            bvid: Converters.aid2bv(+ep.av_id),
                            title: ep.index,
                            titleFormat: ep.index_title,
                            htmlTitle: result.result.title,
                            mediaInfoTitle: result.result.title,
                            mediaInfoId: result.result.media?.media_id ?? 28229002,
                            evaluate: result.result.evaluate,
                            cover: result.result.cover,
                            episodes: eps,
                            ssId: season_id,
                            appOnly: appOnly,
                        }
                    }
                    const pageTemplateString = Strings.replaceTemplate(pageTemplate, templateArgs)
                    const template = new DOMParser().parseFromString(pageTemplateString, 'text/html')
                    await cloneChildNodes(template.getElementsByTagName('head')[0], document.head)
                    await cloneChildNodes(template.getElementsByTagName('body')[0], document.body)
                    window.bangumi_area_limit_hack._setupSettings()
                } catch (e: any) {
                    util_warn('重建ep页面失败', e)
                    ui.alert(Objects.stringify(e as any))
                }
            }
        }
        if (util_page.new_bangumi()) {
            let $eplist_module = document.getElementById('eplist_module')
            if (!$eplist_module) {
                const $danmukuBox = document.getElementById('danmukuBox')
                if (!$danmukuBox) {
                    util_warn('danmukuBox not found!')
                    return
                }
                // 插入eplist_module的位置和内容一定要是这样... 不能改...
                // 写错了会导致Vue渲染出错, 比如视频播放窗口消失之类的(╯°口°)╯(┴—┴
                const $template = _('template', {}, `<div id="eplist_module" class="ep-list-wrapper report-wrap-module"><div class="list-title clearfix"><h4 title="正片">正片</h4> <span class="mode-change" style="position:relative"><i report-id="click_ep_switch" class="iconfont icon-ep-list-detail"></i> <!----></span> <!----> <span class="ep-list-progress">8/8</span></div> <div class="list-wrapper" style="display:none;"><ul class="clearfix" style="height:-6px;"></ul></div></div>`.trim())
                $danmukuBox.parentElement?.replaceChild($template.content.firstElementChild!, $danmukuBox.nextSibling!.nextSibling!)
            }
        }
    })
}

export function removeEpAreaLimit(ep: StringAnyObject) {
    if (ep.epRights) {
        ep.epRights.area_limit = false
        ep.epRights.allow_dm = 1
    }
    if (ep.rights) {
        ep.rights.area_limit = 0
        ep.rights.allow_dm = 1
    }
    if (ep.badge === '受限' || ep.badge_info.text === '受限') {
        ep.badge = ''
        ep.badge_info = { "bg_color": "#FB7299", "bg_color_night": "#BB5B76", "text": "" }
        ep.badge_type = 0
    }
}

export function area_limit_for_vue() {
    if (isClosed()) return

    if (!(
        (util_page.av() && balh_config.enable_in_av) || util_page.new_bangumi()
    )) {
        return
    }
    function replacePlayInfo() {
        log("window.__playinfo__", window.__playinfo__)
        window.__playinfo__origin = window.__playinfo__
        let playinfo: any = undefined
        // 将__playinfo__置空, 让播放器去重新加载它...
        Object.defineProperty(window, '__playinfo__', {
            configurable: true,
            enumerable: true,
            get: () => {
                log('__playinfo__', 'get')
                return playinfo
            },
            set: (value) => {
                // debugger
                log('__playinfo__', 'set')
                // 原始的playinfo为空, 且页面在loading状态, 说明这是html中对playinfo进行的赋值, 这个值可能是有区域限制的, 不能要
                if (!window.__playinfo__origin && window.document.readyState === 'loading') {
                    log('__playinfo__', 'init in html', value)
                    window.__playinfo__origin = value
                    return
                }
                playinfo = value
            },
        })
    }

    function processUserStatus(value: StringAnyObject | undefined) {
        if (value) {
            // 区域限制
            // todo      : 调用areaLimit(limit), 保存区域限制状态
            // 2019-08-17: 之前的接口还有用, 这里先不保存~~
            value.area_limit = 0
            // 会员状态
            if (balh_config.blocked_vip && value.vip_info) {
                value.vip_info.status = 1
                value.vip_info.type = 2
            }
        }
    }

    function replaceUserState() {
        modifyGlobalValue('__PGC_USERSTATE__', {
            onWrite: (value) => {
                processUserStatus(value)
                return value
            }
        })
    }

    /** 拦截处理新页面的初始数据 */
    function replaceNextData() {
        modifyGlobalValue('__NEXT_DATA__', {
            onWrite: (value) => {
                // 结构变了很多，新版是SSR可能一开始会取不到或者是个dom，无论如何先try一下
                try {
                    // 一开始是个dom，放里面一起try了
                    if (value instanceof Element) {
                        value = JSON.parse(value.innerHTML)
                    }
                    const queries = value.props.pageProps.dehydratedState.queries
                    if (!queries) return value
                    for (const query of queries) {
                        const data = query.state.data
                        switch (query.queryKey[0]) {
                            case 'pgc/view/web/season':
                                if (data.epMap) {
                                    // 最重要的一项数据, 直接决定页面是否可播放
                                    Object.keys(data.epMap).forEach(epId => removeEpAreaLimit(data.epMap[epId]))
                                    data.mediaInfo.episodes.forEach(removeEpAreaLimit)
                                    // 其他字段对结果似乎没有影响, 故注释掉(
                                    // data.mediaInfo.hasPlayableEp = true
                                    // data.initEpList.forEach(removeEpAreaLimit)
                                    // data.rights.area_limit = false
                                    // data.rights.allow_dm = 1
                                } else if (data.seasonInfo.mediaInfo.episodes.length > 0) {
                                    data.seasonInfo.mediaInfo.episodes.forEach(removeEpAreaLimit)
                                } else if (data.seasonInfo && !data.seasonInfo.mediaInfo.rights.can_watch) {
                                    // 新版没有Playable的是预告 PV，不能直接跳过，can_watch=false 才替换
                                    return;
                                }
                                break;
                            case 'season/user/status':
                                processUserStatus(data)
                                break;
                        }
                    }
                    return value
                } catch {
                    return
                }
            },
            onRead: (value) => {
                // debugger
                return value
            }
        })
    }

    /** 拦截处理老页面的数据 */
    function replaceInitialState() {
        modifyGlobalValue('__INITIAL_STATE__', {
            onWrite: (value) => {
                if (value?.epInfo?.id === -1 && value?.epList?.length === 0 && value?.mediaInfo?.rights?.limitNotFound === true) {
                    invalidInitialState = value
                    return undefined
                }
                if (value && value.epInfo && value.epList && balh_config.blocked_vip) {
                    for (let ep of [value.epInfo, ...value.epList]) {
                        // 13貌似表示会员视频, 2为普通视频
                        if (ep.epStatus === 13) {
                            log('epStatus 13 => 2', ep)
                            ep.epStatus = 2
                        }
                    }
                }
                if (value?.mediaInfo?.rights?.appOnly === true) {
                    value.mediaInfo.rights.appOnly = false
                    window.__balh_app_only__ = true
                }
                ifNotNull(value?.epInfo?.rights, (it) => it.area_limit = 0)
                value?.epList?.forEach((it: any) => ifNotNull(it?.rights, (it) => it.area_limit = 0))
                return value
            }
        })
    }
    replaceNextData()

    replaceInitialState()
    replaceUserState()
    replacePlayInfo()
    fixBangumiPlayPage()

    modifyGlobalValue('BilibiliPlayer', {
        onWrite: (value) => {
            return value
        },
        onRead: (value) => {

        }
    })
}