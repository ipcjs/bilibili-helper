import { bilibili_login } from "../feature/bili/bilibili_login";
import { balh_config } from "../feature/config";
import { Async } from "../util/async";
import { Converters, uposMap } from "../util/converters";
import { addNoRefererHost } from "../util/inject-xhr";
import { access_key_param_if_exist } from "./bilibili-utils";

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
export function getMobiPlayUrl(originUrl: String, host: String, area: string) {
    // 合成泰区 url
    if (area == 'th') {
        return `${host}/intl/gateway/v2/ogv/playurl?${generateMobiPlayUrlParams(originUrl, area)}`
    }
    // 合成完整 mobi api url
    return `${host}/pgc/player/api/playurl?${generateMobiPlayUrlParams(originUrl, area)}`
}

export function generateMobiPlayUrlParams(originUrl: String, area: string) {
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
    if (area === 'th') {
        theRequest.appkey = '7d089525d3611b1c';
        theRequest.area = 'th';
        theRequest.build = '1001310';
        theRequest.mobi_app = 'bstar_a';
        theRequest.platform = 'android';
    } else {
        theRequest.appkey = '07da50c9a0bf829f';
        theRequest.area = area;
        theRequest.build = '5380700';
        theRequest.device = 'android';
        theRequest.mobi_app = 'android_b';
        theRequest.platform = 'android_b';
        theRequest.buvid = 'XY418E94B89774E201E22C5B709861B7712DD';
        // theRequest.fnval = '0'; // 强制 FLV
        theRequest.track_path = '0';
    }
    theRequest.force_host = '2';  // 强制音视频返回 https
    theRequest.ts = `${~~(Date.now() / 1000)}`;
    // 所需参数数组
    let param_wanted = ['access_key', 'appkey', 'area', 'build', 'buvid', 'cid', 'device', 'ep_id', 'fnval', 'fnver', 'force_host', 'fourk', 'mobi_app', 'platform', 'qn', 's_locale', 'season_id', 'track_path', 'ts'];
    // 生成 mobi api 参数字符串
    let mobi_api_params = '';
    for (let i = 0; i < param_wanted.length; i++) {
        if (theRequest.hasOwnProperty(param_wanted[i])) {
            mobi_api_params += param_wanted[i] + `=` + theRequest[param_wanted[i]] + `&`;
        }
    }
    // 准备明文
    let plaintext = ''
    if (area === 'th') {
        plaintext = mobi_api_params.slice(0, -1) + `acd495b248ec528c2eed1e862d393126`;
    } else {
        plaintext = mobi_api_params.slice(0, -1) + `25bdede4e1581c836cab73a48790ca6e`;
    }
    // 生成 sign
    let ciphertext = hex_md5(plaintext);
    return `${mobi_api_params}sign=${ciphertext}`;
}

export async function fixMobiPlayUrlJson(originJson: object) {
    interface PlayUrlResult {
        type: string
        timelength: number
        accept_description: string[]
        accept_quality: number[]
        support_formats: [{
            quality: number
            need_login?: boolean
        }]
        format: string
        dash: {
            duration: number
            minBufferTime: number
            min_buffer_time: number
            video: [{
                backupUrl?: string[]
                baseUrl?: string
                backup_url: string[]
                base_url: string
                codecs: string
                sar: string
                startWithSAP: number
                start_with_sap: number
                mimeType: string
                mime_type: string
                frameRate: string
                frame_rate: string
                width: number
                height: number
                id: number
                segment_base?: {
                    initialization: string
                    index_range: string
                }
                SegmentBase?: {
                    Initialization: string
                    indexRange: string
                }
            }]
            audio: [{
                backupUrl?: string[]
                baseUrl?: string
                backup_url: string[]
                base_url: string
                codecs: string
                startWithSAP: number
                start_with_sap: number
                mimeType: string
                mime_type: string
                frameRate: string
                frame_rate: string
                width: number
                height: number
                id: number
                segment_base?: {
                    initialization: string
                    index_range: string
                }
                SegmentBase?: {
                    Initialization: string
                    indexRange: string
                }
            }]
        }
    }
    const codecsMap: StringStringObject = {
        30120: 'avc1.64003C',  // 4K
        30121: 'hev1.1.6.L156.90',  // HEVC 4K
        30112: 'avc1.640028',  // 1080P+
        30102: 'hev1.1.6.L120.90',  // HEVC 1080P+
        30080: 'avc1.640028',  // 1080P
        30077: 'hev1.1.6.L120.90',  // HEVC 1080P
        30064: 'avc1.64001F',  // 720P
        30066: 'hev1.1.6.L120.90',  // HEVC 720P
        30032: 'avc1.64001E',  // 480P
        30033: 'hev1.1.6.L120.90',  // HEVC 480P
        30011: 'hev1.1.6.L120.90',  // HEVC 360P
        30016: 'avc1.64001E',  // 360P
        30006: 'avc1.64001E',  // 240P
        30005: 'avc1.64001E',  // 144P
        30280: 'mp4a.40.2',  // 高码音频
        30232: 'mp4a.40.2',  // 中码音频
        30216: 'mp4a.40.2',  // 低码音频
        'nb2-1-30016': 'avc1.64001E',  // APP源 360P
        'nb2-1-30032': 'avc1.64001F',  // APP源 480P
        'nb2-1-30064': 'avc1.640028',  // APP源 720P
        'nb2-1-30080': 'avc1.640032',  // APP源 1080P
        'nb2-1-30216': 'mp4a.40.2',  // APP源 低码音频
        'nb2-1-30232': 'mp4a.40.2',  // APP源 中码音频
        'nb2-1-30280': 'mp4a.40.2'  // APP源 高码音频
    }
    const resolutionMap: ResolutionMapObject = {
        30120: [3840, 2160],  // 4K
        30121: [3840, 2160],  // HEVC 4K
        30112: [1920, 1080],  // 1080P+
        30102: [1920, 1080],  // HEVC 1080P+
        30080: [1920, 1080],  // 1080P
        30077: [1920, 1080],  // HEVC 1080P
        30064: [1280, 720],  // 720P
        30066: [1280, 720],  // HEVC 720P
        30032: [852, 480],  // 480P
        30033: [852, 480],  // HEVC 480P
        30011: [640, 360],  // HEVC 360P
        30016: [640, 360],  // 360P
        30006: [426, 240],  // 240P
        30005: [256, 144],  // 144P
    }
    const frameRateMap: StringStringObject = {
        30120: '16000/672',
        30121: '16000/672',
        30112: '16000/672',
        30102: '16000/672',
        30080: '16000/672',
        30077: '16000/656',
        30064: '16000/672',
        30066: '16000/656',
        30032: '16000/672',
        30033: '16000/656',
        30011: '16000/656',
        30016: '16000/672',
        30006: '16000/672',
        30005: '16000/672',
    }
    let segmentBaseMap: SegmentBaseMapObject = {}

    function getId(url: string, default_value: string, get_filename: boolean = false): string {
        if (get_filename) {
            // 作为SegmentBaseMap的Key，在同一个页面下切换集数不至于出错
            let path = url.split('?')[0]
            let pathArr = path.split('/')
            return pathArr[pathArr.length - 1].replace('.m4s', '') // 返回文件名
        }
        let i = /(nb2-1-)?\d{5}\.m4s/.exec(url)
        if (i !== null) {
            return i[0].replace('.m4s', '')
        } else {
            return default_value
        }
    }

    function getSegmentBase(url: string, id: string, range: string = '5000') {
        addNoRefererHost(url)
        return new Promise((resolve, reject) => {
            // 从 window 中读取已有的值
            if (window.__segment_base_map__) {
                if (window.__segment_base_map__.hasOwnProperty(id)) {
                    // console.log('SegmentBase read from cache ', window.__segment_base_map__[id], 'id=', id)
                    return resolve(window.__segment_base_map__[id]);
                }
            }

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true)
            // TV 动画 range 通常在 4000~5000，剧场版动画大概 14000+
            xhr.setRequestHeader('Range', `bytes=0-${range}`)  // 下载前 5000 字节数据用于查找 sidx 位置
            xhr.responseType = 'arraybuffer'
            let data
            xhr.onload = function (oEvent) {
                data = new Uint8Array(xhr.response)
                let hex_data = Array.prototype.map.call(data, x => ('00' + x.toString(16)).slice(-2)).join('')  // 转换成 hex
                let indexRangeStart = hex_data.indexOf('73696478') / 2 - 4  // 73696478 是 'sidx' 的 hex ，前面还有 4 个字节才是 sidx 的开始
                let indexRagneEnd = hex_data.indexOf('6d6f6f66') / 2 - 5  // 6d6f6f66 是 'moof' 的 hex，前面还有 4 个字节才是 moof 的开始，-1为sidx结束位置
                let result: [string, string] = ['0-' + String(indexRangeStart - 1), String(indexRangeStart) + '-' + String(indexRagneEnd)]

                // 储存在 window，切换清晰度不用重新解析
                if (window.__segment_base_map__) {
                    window.__segment_base_map__[id] = result
                } else {
                    window.__segment_base_map__ = {}
                    window.__segment_base_map__[id] = result
                }

                // console.log('get SegmentBase', result, 'id=', id);
                resolve(result);
            }
            xhr.send(null)  // 发送请求
        });
    }

    let result: PlayUrlResult = JSON.parse(JSON.stringify(originJson))

    result.dash.duration = Math.round(result.timelength / 1000)
    result.dash.minBufferTime = 1.5
    result.dash.min_buffer_time = 1.5

    // 异步构建 segmentBaseMap
    let taskList: Promise<any>[] = []
    // SegmentBase 最大 range 和 duration 的比值大概在 2.5~3.2，保险这里取 3.5
    let range = Math.round(result.dash.duration * 3.5);
    // 避免 太高或太低 导致 泡面番 和 剧场版 加载不了
    if (range < 1500) {
        range = 1500;
    }
    if (range > 20000) {
        range = 20000;
    }
    // 乱猜 range 导致泡面番播不出
    result.dash.video.forEach((video) => {
        taskList.push(getSegmentBase(video.base_url, getId(video.base_url, '30080', true), range.toString()))
    })
    result.dash.audio.forEach((audio) => {
        taskList.push(getSegmentBase(audio.base_url, getId(audio.base_url, '30080', true), range.toString()))
    })
    await Promise.all(taskList)
    if (window.__segment_base_map__) segmentBaseMap = window.__segment_base_map__

    // 填充视频流数据
    result.dash.video.forEach((video) => {
        let video_id = getId(video.base_url, '30280')
        if (!codecsMap.hasOwnProperty(video_id)) {
            // https://github.com/ipcjs/bilibili-helper/issues/775
            // 泰区的视频URL不包含 id 了
            video_id = (30000 + video.id).toString()
        }

        video.codecs = codecsMap[video_id]

        let segmentBaseId = getId(video.base_url, '30280', true)
        video.segment_base = {
            initialization: segmentBaseMap[segmentBaseId][0],
            index_range: segmentBaseMap[segmentBaseId][1]
        }
        video.SegmentBase = {
            Initialization: segmentBaseMap[segmentBaseId][0],
            indexRange: segmentBaseMap[segmentBaseId][1]
        }

        video_id = video_id.replace('nb2-1-', '')
        video.width = resolutionMap[video_id][0]
        video.height = resolutionMap[video_id][1]
        video.mimeType = 'video/mp4'
        video.mime_type = 'video/mp4'
        video.frameRate = frameRateMap[video_id]
        video.frame_rate = frameRateMap[video_id]
        video.sar = "1:1"
        video.startWithSAP = 1
        video.start_with_sap = 1
    });

    // 填充音频流数据
    result.dash.audio.forEach((audio) => {
        let audio_id = getId(audio.base_url, '30280')
        if (!codecsMap.hasOwnProperty(audio_id)) {
            // https://github.com/ipcjs/bilibili-helper/issues/775
            // 泰区的音频URL不包含 id 了
            audio_id = audio.id.toString()
        }

        let segmentBaseId = getId(audio.base_url, '30280', true)
        audio.segment_base = {
            initialization: segmentBaseMap[segmentBaseId][0],
            index_range: segmentBaseMap[segmentBaseId][1]
        }
        audio.SegmentBase = {
            Initialization: segmentBaseMap[segmentBaseId][0],
            indexRange: segmentBaseMap[segmentBaseId][1]
        }

        audio.codecs = codecsMap[audio_id]
        audio.mimeType = 'audio/mp4'
        audio.mime_type = 'audio/mp4'
        audio.frameRate = ''
        audio.frame_rate = ''
        audio.height = 0
        audio.width = 0
    });
    return result
}

export async function fixThailandPlayUrlJson(originJson: object) {
    interface OriginResult {  // 原始 Json 结构, ? 是原来没有需要填充的数据
        code: number
        message: string
        data: {
            video_info: {
                dash_audio: [{
                    bandwidth: number
                    base_url: string
                    id: number
                    baseUrl?: string
                    backupUrl?: string[]
                    backup_url: string[]
                }]
                quality: number
                stream_list: [{
                    stream_info: {
                        description: string
                        display_desc: string
                        new_description: string
                        quality: number
                    }
                    dash_video?: {
                        audio_id: number
                        bandwidth: number
                        base_url: string
                        codecid: number
                        id?: number
                        backupUrl?: string[]
                        backup_url: string[]
                        baseUrl?: string
                    }
                }]
                timelength: number
            }
        }
    }

    let origin: OriginResult = JSON.parse(JSON.stringify(originJson))
    if (origin.code === 401)
        bilibili_login.clearLoginFlag()
    interface LooseObject {
        [key: string]: any
    }
    let result: LooseObject = {  // 重建 Json 结构，对齐港澳台APP限定的结构
        'format': 'flv720',
        'type': 'DASH',
        'result': 'suee',
        'video_codecid': 7,
        'no_rexcode': 0,
        'code': origin.code,
        'message': +origin.message,
        'timelength': origin.data.video_info.timelength,
        'quality': origin.data.video_info.quality,
        'accept_format': 'hdflv2,flv,flv720,flv480,mp4',
    }
    let dash: LooseObject = {  // 上面三个数据会由 fixMobiPlayUrlJson 进一步处理
        'duration': 0,
        'minBufferTime': 0.0,
        'min_buffer_time': 0.0,
        'audio': <any>[]
    }

    const upos = uposMap[balh_config.upos_server || 'hw'] ?? uposMap.hw

    // 填充音频流数据
    origin.data.video_info.dash_audio.forEach((audio) => {
        const base_url = audio.base_url
        const url = new URL(base_url, document.location.href)
        const search = audio.backup_url ? new URL(audio.backup_url[0]).search : url.search
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(url.hostname)) {
            audio.base_url = new URL(url.pathname.replace(/\/v1\/resource\//g, '').replace(/\_/g, `\/`) + search, `https://${upos}`).href
        } else if (url.hostname.includes("akamaized.net")) {
            audio.base_url = new URL(url.pathname + search, `https://${upos}`).href
        }
        addNoRefererHost(audio.base_url)
        if (audio.backup_url) {
            audio.backup_url.forEach(u => {
                if (u.includes("akamaized.net")) {
                    const url = new URL(u)
                    u = new URL(url.pathname + url.search, `https://${upos}`).href
                }
                addNoRefererHost(u)
            })
        }
        if (audio.baseUrl) audio.baseUrl = audio.base_url
        if (audio.backupUrl) audio.backupUrl = audio.backup_url
        dash.audio.push(audio)
    })
    // 填充视频流数据
    let accept_quality = <any>[]
    let accept_description = <any>[]
    let support_formats = <any>[]
    let dash_video = <any>[]
    origin.data.video_info.stream_list.forEach((stream) => {
        // 只加入有视频链接的数据
        if (stream.dash_video && stream.dash_video.base_url) {
            support_formats.push(stream.stream_info)
            accept_quality.push(stream.stream_info.quality)
            accept_description.push(stream.stream_info.new_description)
            stream.dash_video.id = stream.stream_info.quality
            const base_url = stream.dash_video.base_url
            const url = new URL(base_url, document.location.href)
            const search = stream.dash_video.backup_url ? new URL(stream.dash_video.backup_url[0]).search : url.search
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(url.hostname)) {
                stream.dash_video.base_url = new URL(url.pathname.replace(/\/v1\/resource\//g, '').replace(/\_/g, `\/`) + search, `https://${upos}`).href
            } else if (url.hostname.includes("akamaized.net")) {
                stream.dash_video.base_url = new URL(url.pathname + search, `https://${upos}`).href
            }
            addNoRefererHost(stream.dash_video.base_url)
            if (stream.dash_video.backup_url) {
                stream.dash_video.backup_url.forEach(u => {
                    if (u.includes("akamaized.net")) {
                        const url = new URL(u)
                        u = new URL(url.pathname + url.search, `https://${upos}`).href
                    }
                    addNoRefererHost(u)
                })
            }
            if (stream.dash_video.baseUrl) stream.dash_video.baseUrl = stream.dash_video.base_url
            if (stream.dash_video.backupUrl) stream.dash_video.backupUrl = stream.dash_video.backup_url
            dash_video.push(stream.dash_video)
        }
    })
    dash['video'] = dash_video

    result['accept_quality'] = accept_quality
    result['accept_description'] = accept_description
    result['support_formats'] = support_formats
    result['dash'] = dash
    // 下面参数取自安达(ep359333)，总之一股脑塞进去（
    result['fnval'] = result.support_formats[0].quality
    result['fnver'] = 0
    result['status'] = 2
    result['vip_status'] = 1
    result['vip_type'] = 2
    result['seek_param'] = 'start'
    result['seek_type'] = 'offset'
    result['bp'] = 0
    result['from'] = 'local'
    result['has_paid'] = false
    result['is_preview'] = 0

    return fixMobiPlayUrlJson(result)
}

export namespace BiliPlusApi {
    export interface ViewResult {
        code?: number
        title: string
        list: [{ page: string, cid: string, part: string }]
        bangumi?: { season_id: string, ogv_play_url?: string }
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
                index: string
                index_title: string
                /** epInfo.cid */
                danmaku: string
                /** epInfo.aid */
                av_id: string
                page: string
                /** epInfo.id */
                episode_id: string
                cover: string
                episode_status: number
                episode_type: number
                i: number
                link?: string
                bvid?: string
                badge?: string
                badge_info?: any
                badge_type?: number
                title?: string
                titleFormat?: string
                id?: number
                cid?: number
                aid?: number
                loaded?: boolean
                epStatus?: number
                sectionType?: number
                rights?: any
            }],
            seasons: [{
                season_id: string
                title: string
            }],
            media?: {
                media_id: number
            }
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
