import { BiliPlusApi } from "../../api/biliplus";
import { Converters } from "../../util/converters";
import { util_init } from "../../util/initiator";
import { log } from "../../util/log";
import { _ } from "../../util/react";
import { util_page } from "../page";

export function redirect_to_bangumi_or_insert_player() {
    // 重定向到Bangumi页面， 或者在当前页面直接插入播放页面
    function tryRedirectToBangumiOrInsertPlayer() {
        let $errorPanel;
        $errorPanel = document.querySelector('.error-container > .error-panel')
        if (!$errorPanel && !window.__INITIAL_STATE__) {
            // 新版视频不见了页面, 错误面板也是用Vue写的, 只能通过是否存在__INITIAL_STATE__来判断是不是错误页面
            // eg: https://www.bilibili.com/video/BV1ja411X7Ba
            $errorPanel = _('div', { style: { position: 'fixed', top: '100px', left: '100px' } });
            document.body.appendChild($errorPanel);
        }
        if (!$errorPanel) {
            return;
        }
        // 自动点击"取消跳转按钮"
        let $goHomeBtn = document.querySelector<HTMLElement>(".big-btn.go-home");
        $goHomeBtn?.click();
        let msg = document.createElement('a');
        $errorPanel.insertBefore(msg, $errorPanel.firstChild);
        msg.innerText = '获取番剧页Url中...';
        let aid = (location.pathname.match(/\/video\/av(\d+)/) || ['', ''])[1],
            page = (location.pathname.match(/\/index_(\d+).html/) || ['', '1'])[1],
            cid: string,
            season_id: string,
            episode_id: string | undefined;
        let avData: any;
        if (!aid) {
            let bv = (location.pathname.match(/\/video\/(BV\w+)/) || ['', ''])[1]
            if (bv) {
                aid = Converters.bv2aid(bv)
            }
        }
        BiliPlusApi.view(aid)
            .then(function (data) {
                avData = data;
                if (data.code) {
                    return Promise.reject(JSON.stringify(data));
                }
                // 计算当前页面的cid
                for (let i = 0; i < data.list.length; i++) {
                    if (data.list[i].page == page) {
                        cid = data.list[i].cid;
                        break;
                    }
                }
                if (!data.bangumi) {
                    generatePlayer(data, aid, page, cid)
                    // return Promise.reject('该AV号不属于任何番剧页');//No bangumi in api response
                } else {
                    // 当前av属于番剧页面, 继续处理
                    if (data.bangumi.ogv_play_url) {
                        // 有url直接跳转，不再请求一次了，顺带解决集数定位不对的问题
                        msg.innerText = '即将跳转到：' + data.bangumi.ogv_play_url
                        location.href = data.bangumi.ogv_play_url
                    } else {
                        season_id = data.bangumi.season_id;
                        return BiliPlusApi.season(season_id);
                    }
                }
            })
            .then(function (result) {
                if (result === undefined) return // 上一个then不返回内容时, 不需要处理
                if (result.code === 10) { // av属于番剧页面, 通过接口却未能找到番剧信息
                    let ep_id_newest = avData && avData.bangumi && avData.bangumi.newest_ep_id
                    if (ep_id_newest) {
                        episode_id = ep_id_newest // 此时, 若avData中有最新的ep_id, 则直接使用它
                    } else {
                        log(`av${aid}属于番剧${season_id}, 但却不能找到番剧页的信息, 试图直接创建播放器`)
                        generatePlayer(avData, aid, page, cid)
                        return
                    }
                } else if (result.code) {
                    return Promise.reject(JSON.stringify(result))
                } else {
                    let ep_id_by_cid, ep_id_by_aid_page, ep_id_by_aid,
                        episodes = result.result.episodes,
                        ep
                    // 为何要用三种不同方式匹配, 详见: https://greasyfork.org/zh-CN/forum/discussion/22379/x#Comment_34127
                    for (let i = 0; i < episodes.length; i++) {
                        ep = episodes[i]
                        if (ep.danmaku == cid) {
                            ep_id_by_cid = ep.episode_id
                        }
                        if (ep.av_id == aid && ep.page == page) {
                            ep_id_by_aid_page = ep.episode_id
                        }
                        if (ep.av_id == aid) {
                            ep_id_by_aid = ep.episode_id
                        }
                    }
                    episode_id = ep_id_by_cid || ep_id_by_aid_page || ep_id_by_aid
                }
                if (episode_id) {
                    // FIXME: 这种地址有可能不能定位到正确的集数
                    let bangumi_url = `//www.bilibili.com/bangumi/play/ss${season_id}#${episode_id}`
                    log('Redirect', 'aid:', aid, 'page:', page, 'cid:', cid, '==>', bangumi_url, 'season_id:', season_id, 'ep_id:', episode_id)
                    msg.innerText = '即将跳转到：' + bangumi_url
                    location.href = bangumi_url
                } else {
                    return Promise.reject('查询episode_id失败')
                }
            })
            .catch(function (e) {
                log('error:', arguments);
                msg.innerText = 'error:' + e;
            });
    }

    function generatePlayer(data: BiliPlusApi.ViewResult, aid: string, page: string, cid: string) {
        let generateSrc = function (aid: string, cid: string) {
            return `//www.bilibili.com/blackboard/html5player.html?cid=${cid}&aid=${aid}&player_type=1`;
        }
        let generatePageList = function (pages: [{ cid: string, page: string, part: string }]) {
            let $curPage: HTMLElement | null = null;
            function onPageBtnClick(e: Event) {
                (e.target as HTMLElement).className = 'curPage'
                $curPage && ($curPage.className = '')

                let index = (e.target as any).attributes['data-index'].value;
                iframe.src = generateSrc(aid, pages[index].cid);
            }

            return pages.map(function (item, index) {
                let isCurPage = item.page == page
                let $item = _('a', { 'data-index': index, className: isCurPage ? 'curPage' : '', event: { click: onPageBtnClick } }, [_('text', item.page + ': ' + item.part)])
                if (isCurPage) $curPage = $item
                return $item
            });
        }
        // 当前av不属于番剧页面, 直接在当前页面插入一个播放器的iframe
        let $pageBody = document.querySelector<HTMLElement>('.b-page-body');
        if (!$pageBody) { // 若不存在, 则创建
            $pageBody = _('div', { className: '.b-page-body' });
            document.querySelector('body')!.insertBefore($pageBody, document.querySelector('#app'))
            // 添加相关样式
            document.head.appendChild(_('link', { type: 'text/css', rel: 'stylesheet', href: '//static.hdslb.com/css/core-v5/page-core.css' }))
        }
        let iframe = _('iframe', { className: 'player bilibiliHtml5Player', style: { position: 'relative' }, src: generateSrc(aid, cid) })

        // 添加播放器
        $pageBody.appendChild(_('div', { className: 'player-wrapper' }, [
            _('div', { className: 'main-inner' }, [
                _('div', { className: 'v-plist' }, [
                    _('div', { id: 'plist', className: 'plist-content open' }, generatePageList(data.list))
                ])
            ]),
            _('div', { id: 'bofqi', className: 'scontent' }, [iframe])
        ]));
        // 添加评论区
        $pageBody.appendChild(_('div', { className: 'main-inner' }, [
            _('div', { className: 'common report-scroll-module report-wrap-module', id: 'common_report' }, [
                _('div', { className: 'b-head' }, [
                    _('span', { className: 'b-head-t results' }),
                    _('span', { className: 'b-head-t' }, [_('text', '评论')]),
                    _('a', { className: 'del-log', href: `//www.bilibili.com/replydeletelog?aid=${aid}&title=${data.title}`, target: '_blank' }, [_('text', '查看删除日志')])
                ]),
                _('div', { className: 'comm', id: 'bbComment' }, [
                    _('div', { id: 'load_comment', className: 'comm_open_btn', onclick: "var fb = new bbFeedback('.comm', 'arc');fb.show(" + aid + ", 1);", style: { cursor: 'pointer' } })
                ])
            ])
        ]));
        // 添加包含bbFeedback的js
        document.head.appendChild(_('script', { type: 'text/javascript', src: '//static.hdslb.com/js/core-v5/base.core.js' }))

        document.title = data.title;
        (document.querySelector('.error-body') || document.querySelector('.error-container'))?.remove(); // 移除错误信息面板
    }

    util_init(() => {
        if (util_page.av()) {
            tryRedirectToBangumiOrInsertPlayer()
        }
    }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.COMPLETE)
}
