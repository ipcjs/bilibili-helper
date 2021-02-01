import { balh_config } from "../feature/config"
import { Async } from "../util/async"

export const access_key_param_if_exist = function (isKghost = false) {
    // access_key是由B站验证的, B站帐号和BP帐号不同时, access_key无效
    // kghost的服务器使用的B站帐号, access_key有效
    return (localStorage.access_key && (!balh_config.blocked_vip || isKghost)) ? `&access_key=${localStorage.access_key}` : ''
}
export const platform_android_param_if_app_only = function () {
    return window.__balh_app_only__ ? '&platform=android&fnval=0' : ''
}

interface SeasonInfo {
    code: number
    result: {
        season_id: number
        season_title: string
        media_id: number
        episodes: [{
            aid: number
            bvid: string
            cid: number
            /** ep_id */
            id: number
            title: string
            long_title: string
            status: number
            titleFormat?: string
            loaded?: boolean
            epStatus?: number
            sectionType?: number
            i?: number
        }]
        evaluate: string
        cover: string
    }
}

interface SeasonInfoOnBangumi {
    code: number
    result: {
        season_id: number
        season_title: string   // 季度标题，如 “TV” “第一季”
        media_id: number
        episodes: [{
            aid: number
            bvid: string
            cid: number
            ep_id: number
            index: string  // 集数/简短名，显示在缩略集数
            index_title: string  // 分集标题，泰区番剧通常为空
            episode_status: number
            episode_type: number
            titleFormat?: string
            loaded?: boolean
            epStatus?: number
            sectionType?: number
            i?: number
            id?: number
            link?: string
            title?: string
        }]
        evaluate: string  // 简介
        cover: string
        title: string  // 番剧名
    }
}

export class BiliBiliApi {
    private server: string
    constructor(server: string = '//api.bilibili.com') {
        this.server = server
    }

    getSeasonInfoByEpId(ep_id: string | number) {
        return Async.ajax<SeasonInfo>(`${this.server}/pgc/view/web/season?ep_id=${ep_id}`)
    }
    getSeasonInfo(season_id: string | number) {
        return Async.ajax<SeasonInfo>(`${this.server}/pgc/view/web/season?season_id=${season_id}`)
    }
    getSeasonInfoByEpIdOnBangumi(ep_id: string | number) {
        return Async.ajax<SeasonInfoOnBangumi>(`//bangumi.bilibili.com/view/web_api/season?ep_id=${ep_id}`)
    }
}
