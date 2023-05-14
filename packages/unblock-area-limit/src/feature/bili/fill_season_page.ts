import { BiliPlusApi } from "../../api/biliplus";
import { util_init } from "../../util/initiator";
import { log, util_error } from "../../util/log";
import { _ } from "../../util/react";
import { util_page } from "../page";

export function fill_season_page() {
    function tryFillSeasonList() {
        const error_container = document.querySelector<HTMLElement>('div.error-container')
        if (!error_container) {
            return;
        }
        let season_id = window.location.pathname.match(/^\/anime\/(\d+)\/?$/)?.[1]
        if (!season_id) {
            return;
        }

        //尝试解决怪异模式渲染
        /*
        会造成变量丢失，等待官方重写doctype
        try{
        window.stop();
            var xhr = new XMLHttpRequest();
        xhr.open('GET',location.href,false);
        xhr.send();
        document.head.appendChild(_('script',{},[_('text',
            'document.write(unescape("'+escape(xhr.response.replace(/<!DOCTYPE.+?>/,'<!DOCTYPE HTML>'))+'"));window.stop()'
        )]));
        }catch(e){util_error(e);}
        */

        const msg = _('a', { href: '//bangumi.bilibili.com/anime/' + season_id + '/play', style: { fontSize: '20px' } }, [_('text', `【${GM_info.script.name}】尝试获取视频列表中...`)])
        const content = _('div');

        error_container.insertBefore(content, error_container.firstChild);
        content.appendChild(msg);
        log('season>:', season_id);
        BiliPlusApi.season(season_id)
            .then(function (data) {
                log('season>then:', data);
                if (data.code) {
                    return Promise.reject(data);
                }

                function generateEpisodeList(episodes: [{ episode_id: string, index: string, index_title: string, cover: string }]) {
                    const children: HTMLElement[] = [];
                    episodes.reverse().forEach(function (i) {
                        children.push(_('li', { className: 'v1-bangumi-list-part-child', 'data-episode-id': i.episode_id }, [_('a', { className: 'v1-complete-text', href: '//bangumi.bilibili.com/anime/' + season_id + '/play#' + i.episode_id, title: i.index + ' ' + i.index_title, target: '_blank', style: { height: '60px' } }, [
                            _('div', { className: 'img-wrp' }, [_('img', { src: i.cover, style: { opacity: 1 }, loaded: 'loaded', alt: i.index + ' ' + i.index_title })]),
                            _('div', { className: 'text-wrp' }, [
                                _('div', { className: 'text-wrp-num' }, [_('div', { className: 'text-wrp-num-content' }, [_('text', `第${i.index}话`)])]),
                                _('div', { className: 'text-wrp-title trunc' }, [_('text', i.index_title)])
                            ])
                        ])]));
                    });
                    return children;
                }

                function generateSeasonList(seasons: [{ season_id: string, title: string }]) {
                    function onSeasonClick(event: Event) {
                        window.location.href = '//bangumi.bilibili.com/anime/' + (event.target as any)?.attributes['data-season-id'].value;
                    }

                    return seasons.map(function (season) {
                        return _('li', { className: season.season_id == season_id ? 'cur' : '', 'data-season-id': season.season_id, event: { click: onSeasonClick } }, [_('text', season.title)]);
                    });
                }

                if (data.result) {
                    if (msg.parentNode?.parentNode != error_container) {
                        util_error('`msg.parentNode?.parentNode != error_container`, 按理来说不可能...')
                    }
                    document.title = data.result.title;
                    document.head.appendChild(_('link', { href: 'https://s3.hdslb.com/bfs/static/anime/css/tag-index.css?v=110', rel: 'stylesheet' }));
                    document.head.appendChild(_('link', { href: 'https://s1.hdslb.com/bfs/static/anime/css/bangumi-index.css?v=110', rel: 'stylesheet' }));
                    document.body.insertBefore(_('div', { className: 'main-container-wrapper' }, [_('div', { className: 'main-container' }, [
                        _('div', { className: 'page-info-wrp' }, [_('div', { className: 'bangumi-info-wrapper' }, [
                            _('div', { className: 'bangumi-info-blurbg-wrapper' }, [_('div', { className: 'bangumi-info-blurbg blur', style: { backgroundImage: 'url(' + data.result.cover + ')' } })]),
                            _('div', { className: 'main-inner' }, [_('div', { className: 'info-content' }, [
                                _('div', { className: 'bangumi-preview' }, [_('img', { alt: data.result.title, src: data.result.cover })]),
                                _('div', { className: 'bangumi-info-r' }, [
                                    _('div', { className: 'b-head' }, [_('h1', { className: 'info-title', 'data-seasonid': season_id, title: data.result.title }, [_('text', data.result.title)])]),
                                    _('div', { className: 'info-count' }, [
                                        _('span', { className: 'info-count-item info-count-item-play' }, [_('span', { className: 'info-label' }, [_('text', '总播放')]), _('em', {}, [_('text', data.result.play_count)])]),
                                        _('span', { className: 'info-count-item info-count-item-fans' }, [_('span', { className: 'info-label' }, [_('text', '追番人数')]), _('em', {}, [_('text', data.result.favorites)])]),
                                        _('span', { className: 'info-count-item info-count-item-review' }, [_('span', { className: 'info-label' }, [_('text', '弹幕总数')]), _('em', {}, [_('text', data.result.danmaku_count)])])
                                    ]),
                                    //_('div',{className:'info-row info-update'},[]),
                                    //_('div',{className:'info-row info-cv'},[]),
                                    _('div', { className: 'info-row info-desc-wrp' }, [
                                        _('div', { className: 'info-row-label' }, [_('text', '简介：')]),
                                        _('div', { className: 'info-desc' }, [_('text', data.result.evaluate)])
                                    ]),
                                ])
                            ])])
                        ])]),
                        _('div', { className: 'main-inner' }, [_('div', { className: 'v1-bangumi-list-wrapper clearfix' }, [
                            _('div', { className: 'v1-bangumi-list-season-wrapper' }, [
                                _('div', { className: 'v1-bangumi-list-season-content slider-list-content' }, [
                                    _('div', {}, [
                                        _('ul', { className: 'v1-bangumi-list-season clearfix slider-list', 'data-current-season-id': season_id, style: { opacity: 1 } }, generateSeasonList(data.result.seasons))
                                    ])
                                ])
                            ]),
                            _('div', { className: 'v1-bangumi-list-part-wrapper slider-part-wrapper' }, [_('div', { className: 'v1-bangumi-list-part clearfix', 'data-current-season-id': season_id, style: { display: 'block' } }, [
                                _('div', { className: 'complete-list', style: { display: 'block' } }, [_('div', { className: 'video-slider-list-wrapper' }, [_('div', { className: 'slider-part-wrapper' }, [_('ul', { className: 'slider-part clearfix hide', style: { display: 'block' } }, generateEpisodeList(data.result.episodes))])])])
                            ])])
                        ])])
                    ])]), error_container);
                    error_container.remove();
                }
            })
            .catch(function (error) {
                log('season>catch', error);
                msg.innerText = 'error:' + JSON.stringify(error) + '\n点击跳转到播放界面 (不一定能够正常播放...)';
            });
    }

    util_init(() => {
        if (util_page.bangumi()) {
            tryFillSeasonList()
        }
    })
}