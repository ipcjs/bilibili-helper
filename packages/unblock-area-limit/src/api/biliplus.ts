import { balh_config } from "../feature/config";
import { Async } from "../util/async";
import { access_key_param_if_exist } from "./bilibili";

export namespace BiliPlusApi {
    export interface ViewResult {
        code?: number
        title: string
        list: [{ page: string, cid: string, part: string }]
        bangumi?: { season_id: string }
    }
    export const view = function (aid: string, update = true) {
        return Async.ajax<ViewResult>(`${balh_config.server}/api/view?id=${aid}&update=${update}${access_key_param_if_exist()}`);
    }

    export interface SeasonResult {
        code?: number
        result: {
            title: string
            evaluate: string
            cover: string
            play_count: number
            favorites: number
            danmaku_count: number
            episodes: [{
                index: number
                index_title: string
                danmaku: string
                av_id: string
                page: string
                episode_id: string
                cover: string
            }],
            seasons: [{
                season_id: string
                title: string
            }]
        }
    }
    export const season = function (season_id: string) {
        return Async.ajax<SeasonResult>(`${balh_config.server}/api/bangumi?season=${season_id}${access_key_param_if_exist()}`);
    }
    export interface PlayUrlResult {
        code: number,
        durl: { url: string }[],
        timelength: number,
    }
    // https://www.biliplus.com/BPplayurl.php?otype=json&cid=30188339&module=bangumi&qn=16&src=vupload&vid=vupload_30188339
    // qn = 16, 能看
    export const playurl = function (cid: string, qn = 16, bangumi = true) {
        return Async.ajax<PlayUrlResult>(`${balh_config.server}/BPplayurl.php?otype=json&cid=${cid}${bangumi ? '&module=bangumi' : ''}&qn=${qn}&src=vupload&vid=vupload_${cid}${access_key_param_if_exist()}`);
    }
    // https://www.biliplus.com/api/h5play.php?tid=33&cid=31166258&type=vupload&vid=vupload_31166258&bangumi=1
    export const playurl_for_mp4 = (cid: string, bangumi = true) => Async.ajax(`${balh_config.server}/api/h5play.php?tid=33&cid=${cid}&type=vupload&vid=vupload_${cid}&bangumi=${bangumi ? 1 : 0}${access_key_param_if_exist()}`)
        .then(text => ((text as string).match(/srcUrl=\{"mp4":"(https?.*)"\};/) || ['', ''])[1]); // 提取mp4的url

}