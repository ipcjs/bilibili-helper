import { Async, Promise } from "../util/async"
import { generateMobiPlayUrlParams } from "./biliplus"
import { Converters } from "../util/converters"
import { BalhDb } from "../util/balh-db"

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

export interface AppSeasonInfo {
    result?: {
        actor?: {
            info: string
            title: string
        }
        alias: string
        all_buttons?: {
            watch_fornal: string
        }
        all_up_infos?: any
        areas: [{
            id: number
            name: string
        }]
        badge?: string
        badge_info?: {
            bg_color: string
            bg_color_night: string
            text: string
        }
        cover: string
        detail?: string
        dialog?: {
            code: number
            config: any
            image: {
                url: string
            }
            msg: string
            style_type: string
            title: {
                text: string
                text_color: string
            }
            type: string
        }
        dynamic_subtitle?: string
        earphone_conf?: {
            sp_phones: any[]
        }
        enable_vt?: boolean
        evaluate: string
        icon_font?: {
            name: string
            text: string
        }
        link?: string
        media_badge_info?: any
        media_id?: number
        mode: number
        modules?: any[]
        new_ep?: {
            desc?: string
            id: number
            is_new?: number
            more?: string
            title: string
        }
        new_keep_activity_material?: {
            activityId: number
        }
        origin_name: string
        payment?: {
            dialog: any
            pay_type: {
                allow_ticket: number
            }
            price: string
            report_type: number
            tv_price: string
            vip_discount_price: string
            vip_promotion: string
        } | undefined
        play_strategy?: {
            auto_play_toast: string
            recommend_show_strategy: number
            strategies: any[]
        }
        premieres?: any[]
        publish: {
            is_finish: number
            is_started: number
            pub_time?: string
            pub_time_show?: string
            release_date_show: string
            time_length_show: string
            unknow_pub_date?: number
            update_info_desc?: string
            weekday?: number
        }
        record?: string
        refine_cover?: string
        reserve?: {
            episodes: any[]
            tip: string
        }
        rights: {
            allow_bp: number
            allow_bp_rank: number
            allow_download?: number
            allow_review: number
            area_limit?: number
            ban_area_show?: number
            can_watch: number
            copyright: string
            forbid_pre?: number
            freya_white?: number
            is_cover_show?: number
            is_preview?: number
            only_vip_download?: number
            resource?: string
            watch_platform?: number
        }
        season_id: number
        season_title?: string
        series?: {
            display_type: number
            series_id: number
            series_title: string
        }
        share_copy?: string
        share_url?: string
        short_link?: string
        show_season_type?: number
        square_cover?: string
        staff: {
            info: string
            title: string
        }
        stat: {
            coins?: number
            danmakus: number
            favorite?: number
            favorites: number
            followers?: string
            likes?: number
            play?: string
            reply?: number
            share?: number
            views: number
            vt?: number
        }
        status?: number
        jp_title?: string | undefined
        styles: [{
            name: string
        }]
        subtitle?: string
        test_switch?: {
            channel_entrance_exp_action: number
            enable_ep_vt: boolean
            hide_ep_vv_vt_dm: number
            is_merge_preview_section: boolean
            is_ogv_fav_exp: boolean
            mergeSeasonEpUpperExp: number
            movie_mark_action: number
            optimize_display_info_exp: number
            player_ip_community_exp: number
            short_space_title_exp: number
            was_freya_double: number
            was_hit_four_crowd: number
            was_ios_pip_exp: boolean
            was_merge_exp: boolean
            was_pugv_style_optimize: boolean
        }
        title: string
        total?: number
        type: number
        type_desc?: string
        type_name: string
        user_status?: {
            follow: number
            follow_bubble: number
            follow_status: number
            pay: number
            pay_for: number
            progress: {
                last_ep_id: number
                last_ep_index: string
                last_time: number
            }
            review: {
                article_url: string
                is_open: number
                score: number
            }
            sponsor: number
            vip: number
            vip_frozen: number
        }
        season_status?: number | undefined
        is_paster_ads?: number
        user_thumbup?: {
            url_image_ani: string
            url_image_ani_cut: string
            url_image_bright: string
            url_image_dim: string
        }
        seasons?: any[]
        episodes?: any[]
        section?: any[]
        positive?: any
        up_info?: {
            attribute: number
            avatar: string
            is_follow: number
            mid: number
            uname: number
        }
    }
    code: number
    data: {
        actor?: {
            info: string
            title: string
        }
        alias: string
        all_buttons?: { watch_fornal: string }
        all_up_infos?: any
        areas: [{ id: number, name: string }]
        badge?: string
        badge_info?: {
            bg_color: string
            bg_color_night: string
            text: string
        }
        cover: string
        detail?: string
        dialog?: {
            code: number
            config: any
            image: {
                url: string
            }
            msg: string
            style_type: string
            title: {
                text: string
                text_color: string
            }
            type: string
        }
        dynamic_subtitle?: string
        earphone_conf?: { sp_phones: any[] }
        enable_vt?: boolean
        evaluate: string
        icon_font?: {
            name: string
            text: string
        }
        link?: string
        media_badge_info?: any
        media_id?: number
        mode: number
        modules?: any[]
        new_ep?: {
            desc?: string
            id: number
            is_new?: number
            more?: string
            title: string
        }
        new_keep_activity_material?: { activityId: number }
        origin_name: string
        payment?: {
            dialog: any
            pay_type: { allow_ticket: number }
            price: string
            report_type: number
            tv_price: string
            vip_discount_price: string
            vip_promotion: string
        }
        play_strategy?: {
            auto_play_toast: string
            recommend_show_strategy: number
            strategies: any[]
        }
        premieres?: any[]
        publish: {
            is_finish: number
            is_started: number
            pub_time?: string
            pub_time_show?: string
            release_date_show: string
            time_length_show: string
            unknow_pub_date?: number
            update_info_desc?: string
            weekday?: number
        }
        record?: string
        refine_cover?: string
        reserve?: {
            episodes: any[]
            tip: string
        }
        rights: {
            allow_bp: number
            allow_bp_rank: number
            allow_download?: number
            allow_review: number
            area_limit?: number
            ban_area_show?: number
            can_watch: number
            copyright: string
            forbid_pre?: number
            freya_white?: number
            is_cover_show?: number
            is_preview?: number
            only_vip_download?: number
            resource?: string
            watch_platform?: number
        }
        season_id: number
        season_title?: string
        series?: {
            display_type: number
            series_id: number
            series_title: string
        }
        share_copy?: string
        share_url?: string
        short_link?: string
        show_season_type?: number
        square_cover?: string
        staff: {
            info: string
            title: string
        }
        stat: {
            coins?: number
            danmakus: number
            favorite?: number
            favorites: number
            followers?: string
            likes?: number
            play?: string
            reply?: number
            share?: number
            views: number
            vt?: number
        }
        status?: number
        jp_title?: string
        styles: [{
            name: string
        }]
        subtitle?: string
        test_switch?: {
            channel_entrance_exp_action: number
            enable_ep_vt: boolean
            hide_ep_vv_vt_dm: number
            is_merge_preview_section: boolean
            is_ogv_fav_exp: boolean
            mergeSeasonEpUpperExp: number
            movie_mark_action: number
            optimize_display_info_exp: number
            player_ip_community_exp: number
            short_space_title_exp: number
            was_freya_double: number
            was_hit_four_crowd: number
            was_ios_pip_exp: boolean
            was_merge_exp: boolean
            was_pugv_style_optimize: boolean
        }
        title: string
        total?: number
        type: number
        type_desc?: string
        type_name: string
        user_status?: {
            follow: number
            follow_bubble: number
            follow_status: number
            pay: number
            pay_for: number
            progress: {
                last_ep_id: number
                last_ep_index: string
                last_time: number
            }
            review: {
                article_url: string
                is_open: number
                score: number
            }
            sponsor: number
            vip: number
            vip_frozen: number
        }
        season_status?: number
        is_paster_ads?: number
        user_thumbup?: {
            url_image_ani: string
            url_image_ani_cut: string
            url_image_bright: string
            url_image_dim: string
        }
        // seasons?: any[]
    }
    message: string
}

export interface SectionInfo {
    code: number
    message: string
    result: {
        main_section: {
            title: any
            id: any
            episodes: [{
                aid: number
                badge: string
                badge_info: {
                    bg_color: string
                    bg_color_night: string
                    text: string
                }
                badge_type: string
                cid: number
                cover: string
                from: string
                id: number
                is_premiere: number
                long_title: string
                share_url: string
                status: number
                title: string
                vid: string
            }]
        }
        section: any[]
    }
}

export interface EpisodeInfo {
    code: number
    data: {
        episode_id: number
        related_up: [{
            attribute: number
            avatar: string
            is_follow: number
            mid: number
            uname: number
        }]
        stat: {
            coin: number
            dm: number
            like: number
            reply: number
            view: number
        }
        user_community: {
            coin_number: number
            favorite: number
            is_original: number
            like: number
        }
    }
    message: string
}

interface SeasonInfoOnThailand {
    code: number
    message: string
    result: {
        actor: {
            info: string
            title: string
        }
        alias: string
        areas: [{ id: number, name: string }]
        cover: string
        detail: string
        dynamic_subtitle: string
        evaluate: string
        link: string
        mode: number
        publish: {
            is_finish: number
            is_started: number
            pub_time: string
            pub_time_show: string
            release_date_show: string
            time_length_show: string
            unknow_pub_date: number
            weekday: number
        }
        refine_cover: string
        series: any
        share_copy: string
        share_url: string
        short_link: string
        square_cover: string
        staff: any
        stat: {
            coins: number
            danmakus: number
            favorites: number
            followers: string
            hot: number
            likes: number
            play: string
            reply: number
            series_play: string
            share: number
            views: number
        }
        subtitle: string
        total: number
        type: number
        type_name: string
        actors?: string
        origin_name: string
        jp_title?: string
        new_ep: {
            id: number
            new_ep_display: string
            title: string
        }
        newest_ep?: {
            id: number
            title: string
        }
        status: number
        season_status?: number
        title: string
        season_title?: string
        season_id: number
        rights: {
            watch_platform?: number
            allow_bp: number
            allow_bp_rank: number
            allow_review: number
            area_limit: number
            ban_area_show: number
            can_watch: number
            copyright: string
            forbidPre: number
            is_preview: number
            onlyVipDownload: number
        }
        is_paster_ads: number
        total_ep: number
        modules: [{
            data: {
                episodes: [{
                    status: number
                    id: number
                    title: string
                    long_title: string
                    episode_status?: number
                    ep_id?: number
                    index?: string
                    index_title?: string
                }]
            }
        }]
        episodes?: any[]
        styles: [{
            name: string
        }]
        style: string[]
    }
}

interface MediaInfo {
    activity: {
        head_bg_url: string
        id: number
        title: string
    },
    actors: string
    alias: string
    areas: [{ id: number, name: string }],
    copyright: {
        is_finish: number
        is_started: number
    },
    cover: string
    refine_cover?: string
    enable_vt: boolean
    episode_index: {
        id: number
        index: string
        index_show: string
        is_new: number
        play_index_show: string
    },
    evaluate: string
    icon_font: {
        name: string
        text: string
    },
    long_review: {
        next: number
        normal: number
        total: number
        count: number
        list: [{
            review_id: number
            stat: {
                likes: number
            },
            author: {
                uname: string
                level: number
                mid: number
                avatar: string
                label: {
                    bg_color: string
                    bg_style: number
                },
                vip: {
                    vipType: number
                    nickname_color: string
                    vipStatus: number
                }
            },
            mid: number
            push_time_str: string
            title: string
            mtime: number
            content: string
            url: string
            article_id: number
            score: number
            is_origin: number
            media_id: number
            ctime: number
            progress: string
        }]
    },
    media_id: number
    mode: number
    origin_name: string
    publish: {
        is_finish: number
        is_started: number
        pub_date: string
        pub_date_show: string
        release_date_show: string
        time_length_show: string
    },
    rating: {
        count: number
        score: number
    },
    rights: {
        allow_bp: number
        allow_bp_rank: number
        allow_review: number
        can_watch: number
        copyright: string
        area_limit?: number
        ban_area_show?: number
        is_preview?: number
    }
    season_id: number
    season_status: number
    status?: number
    seasons: [{
        is_new: number
        media_id: number
        season_id: number
        season_title: string
        title: string
        type: number
    }]
    share_copy?: string
    share_url?: string
    short_link?: string
    short_review: {
        next: number
        total: number
        list: [{
            review_id: number
            score: number
            stat: {
                likes: number
            },
            author: {
                uname: string
                level: number
                mid: number
                avatar: string
                label: {
                    bg_color: string
                    bg_style: number
                },
                vip: {
                    vipType: number
                    nickname_color: string
                    vipStatus: number
                }
            },
            media_id: number
            mid: number
            ctime: number
            progress: string
            push_time_str: string
            mtime: number
            content: string
        }]
    },
    show_season_type: number
    staff: any
    stat: {
        danmakus: number
        favorites: number
        series_follow: number
        views: number
        vt: number
    },
    styles: [{
        id: number
        name: string
    }],
    time_length: number
    title: string
    type: number
    type_name: string
    param: {
        season_id: number
        season_type: number
        show_season_type: number
    }
}

export class BiliBiliApi {
    private server: string
    constructor(server: string = '//api.bilibili.com') {
        this.server = server
    }

    getSeasonInfoByEpSsId(ep_id: string | number | undefined, season_id: string | number | undefined) {
        return Async.ajax<SeasonInfo>(`${this.server}/pgc/view/web/season?` + (ep_id ? `ep_id=${ep_id}` : `season_id=${season_id}`))
    }
    getSeasonInfoById(season_id: string, ep_id: string) {
        let paramDict = {
            access_key: localStorage.access_key,
            appkey: '27eb53fc9058f8c3',
            season_id: '',
            ep_id: ''
        }

        if (ep_id) paramDict.ep_id = ep_id
        else if (season_id) paramDict.season_id = season_id
        const { sign, params } = Converters.generateSign(paramDict, 'c2ed53a74eeefe3cf99fbd01d8c9c375')
        return Async.ajax<AppSeasonInfo>('//api.bilibili.com/pgc/view/v2/app/season?' + params + '&sign=' + sign)
    }
    getSeasonSectionBySsId(season_id: string) {
        return Async.ajax<SectionInfo>('//api.bilibili.com/pgc/web/season/section?' + `season_id=${season_id}`)
    }
    getEpisodeInfoByEpId(ep_id: string) {
        return Async.ajax<EpisodeInfo>('//api.bilibili.com/pgc/season/episode/web/info?' + `ep_id=${ep_id}`)
    }
    async getSeasonInfoByEpSsIdOnThailand(ep_id: string | undefined, season_id: string | undefined) {
        if (ep_id) {
            const ssid = await BalhDb.getSsId(parseInt(ep_id))
            if (ssid) {
                season_id = ssid
                ep_id = ''
            }
        }
        const params = '?' + (ep_id ? `ep_id=${ep_id}` : `season_id=${season_id}`) + `&mobi_app=bstar_a&s_locale=zh_SG`
        const newParams = generateMobiPlayUrlParams(params, 'th')
        return Async.ajax<SeasonInfoOnThailand>(`${this.server}/intl/gateway/v2/ogv/view/app/season?` + newParams)
    }

    async getMediaInfoBySeasonId(season_id: string): Promise<MediaInfo> {
        return Async.ajax(`//www.bilibili.com/bangumi/media/md${season_id}`)
            .then(resp => {
                const matchResult = (resp as string).match(/window\.__INITIAL_STATE__=(.*);\(function\(\)/)
                if (matchResult) {
                    const initialState = JSON.parse(matchResult[1])
                    return initialState.mediaInfo as MediaInfo
                }
                return Promise.reject(new Error('__INITIAL_STATE__ is not found.'))
            })

    }
}
