import { util_init } from "../../util/initiator";
import { util_page } from "../page";
import { r } from "../r";

export function isHtml5Player() {
    return localStorage.defaulth5 === '1'
}
export function check_html5() {
    function checkHtml5() {
        var playerContent = document.querySelector('.player-content');
        if (!localStorage.balh_h5_not_first && !isHtml5Player() && window.GrayManager && playerContent) {
            new MutationObserver(function (mutations, observer) {
                observer.disconnect();
                localStorage.balh_h5_not_first = r.const.TRUE;
                if (window.confirm(GM_info.script.name + '只在HTML5播放器下有效，是否切换到HTML5？')) {
                    window.GrayManager?.clickMenu('change_h5');// change_flash, change_h5
                }
            }).observe(playerContent, {
                childList: true, // 监听child的增减
                attributes: false, // 监听属性的变化
            });
        }
    }

    util_init(() => {
        // 除了播放器和番剧列表页面, 其他页面都需要检测html5
        if (!(util_page.bangumi() || util_page.bangumi_md() || util_page.player())) {
            checkHtml5()
        }
    })
}