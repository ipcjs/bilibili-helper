import { util_init } from "../../util/initiator"
import { ui } from "../../util/ui"
import { util_page } from "../page"
import { _t } from "../r"

export function version_remind() {
    if (!util_page.new_bangumi()) return

    util_init(() => {
        if ((localStorage.balh_version || '0') < GM_info.script.version) {
            localStorage.balh_version = GM_info.script.version
            let version_remind = _t('version_remind')
            if (version_remind) {
                ui.pop({ content: `<h3>${GM_info.script.name} v${GM_info.script.version} 更新日志</h3>${version_remind}` })
            }
        }
    })
}