import { balh_config } from "../feature/config";
import { Async } from "../util/async";
import { Converters } from "../util/converters";
import { access_key_param_if_exist } from "./bilibili";

function convertPlayUrl(originUrl: string) {
    let params = new URLSearchParams(originUrl.split('?')[1])
    let queryMap: StringStringObject = {
        appKey: '1d8b6e7d45233436',
        build: '6080000',
        device: 'android',
        mobi_app: 'android',
        platform: 'android',
    }
    params.forEach((value, key) => {
        if (['t', 'sign'].indexOf(key) === -1) {
            queryMap[key] = value
        }
    })
    const result = Converters.generateSign(queryMap, '9b288147e5474dd2aa67085f716c560d')

    let url = new URL(`${balh_config.server}/BPplayurl.php`)
    url.search = result.params
    url.searchParams.append('sign', result.sign)
    url.searchParams.append('module', 'pgc')
    url.searchParams.append('otype', 'json')
    url.searchParams.append('platform', 'android')
    return url.href
}


/**
 * 构建 mobi api 解析链接
 * host 举例: 'https://example.com'
 * 
 * 参考：https://github.com/kghost/bilibili-area-limit/issues/16
 */
export function getMobiPlayUrl(originUrl: String, host: String) {
    // 合成完整 mobi api url
    return `${host}/pgc/player/api/playurl?${generateMobiPlayUrlParams(originUrl)}`
}

export function generateMobiPlayUrlParams(originUrl: String) {
    // 提取参数为数组
    let a = originUrl.split('?')[1].split('&');
    // 参数数组转换为对象
    let theRequest: StringStringObject = {};
    for (let i = 0; i < a.length; i++) {
        let key = a[i].split("=")[0];
        let value = a[i].split("=")[1];
        // 给对象赋值
        theRequest[key] = value;
    }
    // 追加 mobi api 需要的参数
    theRequest.access_key = localStorage.access_key;
    theRequest.appkey = '07da50c9a0bf829f';
    theRequest.build = '5380700';
    theRequest.buvid = 'XY418E94B89774E201E22C5B709861B7712DD';
    theRequest.device = 'android';
    theRequest.force_host = '2';
    theRequest.mobi_app = 'android_b';
    theRequest.platform = 'android_b';
    theRequest.track_path = '0';
    theRequest.device = 'android';
    theRequest.fnval = '0'; // 强制 FLV
    theRequest.ts = `${~~(Date.now() / 1000)}`;
    // 所需参数数组
    let param_wanted = ['access_key', 'appkey', 'build', 'buvid', 'cid', 'device', 'ep_id', 'fnval', 'fnver', 'force_host', 'fourk', 'mobi_app', 'platform', 'qn', 'track_path', 'ts'];
    // 生成 mobi api 参数字符串
    let mobi_api_params = '';
    for (let i = 0; i < param_wanted.length; i++) {
        mobi_api_params += param_wanted[i] + `=` + theRequest[param_wanted[i]] + `&`;
    }
    // 准备明文
    let plaintext = mobi_api_params.slice(0, -1) + `25bdede4e1581c836cab73a48790ca6e`;
    // 生成 sign
    let ciphertext = hex_md5(plaintext);
    return `${mobi_api_params}sign=${ciphertext}`;
}


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
                /** epInfo.cid */
                danmaku: string
                /** epInfo.aid */
                av_id: string
                page: string
                /** epInfo.id */
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