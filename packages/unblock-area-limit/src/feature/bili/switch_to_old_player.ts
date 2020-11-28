import { cookieStorage } from "../../util/cookie"
import { util_init } from "../../util/initiator"
import { _ } from "../../util/react"
import { ui } from "../../util/ui"
import { util_page } from "../page"
import { r } from "../r"

export function switch_to_old_player() {
    if (util_page.av() && !localStorage.balh_disable_switch_to_old_player) {
        util_init(() => {
            const $switchToOldBtn = document.querySelector<HTMLElement>('#entryOld > .old-btn > a')
            if ($switchToOldBtn) {
                ui.pop({
                    content: `${GM_info.script.name} 对新版播放器的支持还在测试阶段, 不稳定, 推荐切换回旧版`,
                    confirmBtn: '切换回旧版',
                    onConfirm: () => $switchToOldBtn.click(),
                    onClose: () => localStorage.balh_disable_switch_to_old_player = r.const.TRUE,
                })
            }
        })
    }
    if (util_page.new_bangumi()) {
        if (cookieStorage.stardustpgcv === '0606') {
            util_init(() => {
                let $panel = document.querySelector('.error-container > .server-error')
                if ($panel) {
                    $panel.insertBefore(_('text', '临时切换到旧版番剧页面中...'), $panel.firstChild)
                    cookieStorage.stardustpgcv = '0'
                    localStorage.balh_temp_switch_to_old_page = r.const.TRUE
                    location.reload()
                }
            })
        }
        if (localStorage.balh_temp_switch_to_old_page) {
            cookieStorage.stardustpgcv = '0606'
            delete localStorage.balh_temp_switch_to_old_page
        }
    }
}