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
        }]
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
}
