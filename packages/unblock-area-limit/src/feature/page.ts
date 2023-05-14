import { log } from "../util/log"
import { Func } from '../util/utils'
export const util_page = {
    player: () => location.href.includes('www.bilibili.com/blackboard/html5player'),
    // 在av页面中的iframe标签形式的player
    player_in_av: Func.runCatching(() => util_page.player() && window.top?.location.href.includes('www.bilibili.com/video/av'), (e) => log(e)),
    av: () => location.href.includes('www.bilibili.com/video/av') || location.href.includes('www.bilibili.com/video/BV'),
    av_new: function () { return this.av() && (window.__playinfo__ || window.__playinfo__origin) },
    bangumi: () => location.href.match(new RegExp('^https?://bangumi\\.bilibili\\.com/anime/\\d+/?$')),
    bangumi_md: () => location.href.includes('www.bilibili.com/bangumi/media/md'),
    // movie页面使用window.aid, 保存当前页面av号
    movie: () => location.href.includes('bangumi.bilibili.com/movie/'),
    // anime页面使用window.season_id, 保存当前页面season号
    anime: () => location.href.match(new RegExp('^https?://bangumi\\.bilibili\\.com/anime/\\d+/play.*')),
    anime_ep: () => location.href.includes('www.bilibili.com/bangumi/play/ep'),
    anime_ss: () => location.href.includes('www.bilibili.com/bangumi/play/ss'),
    anime_ep_m: () => location.href.includes('m.bilibili.com/bangumi/play/ep'),
    anime_ss_m: () => location.href.includes('m.bilibili.com/bangumi/play/ss'),
    new_bangumi: () => location.href.includes('www.bilibili.com/bangumi'),
    watchroom: () => location.href.includes("www.bilibili.com/watchroom"),
    home: () => location.hostname === 'www.bilibili.com' && location.pathname === '/',
    get ssId(): number | null | undefined {
        return window.__INITIAL_STATE__?.mediaInfo?.ssId
    },
}