import { cookieStorage } from "../../util/cookie"
import { util_init } from "../../util/initiator"
import { _ } from "../../util/react"
import { ui } from "../../util/ui"
import { r } from "../r"

export function jump_to_baipiao() {
    util_init(() => {
        for (let bp of r.baipiao) {
            const cookie_key = `balh_baipao_${bp.key}`
            if (bp.match() && !cookieStorage[cookie_key]) {
                ui.pop({
                    content: [
                        _('text', '发现白嫖地址: '), _('a', { href: bp.link }, bp.link),
                        _('div', {}, bp.message),
                    ],
                    confirmBtn: '一键跳转',
                    onConfirm: () => { location.href = bp.link },
                    onClose: () => { cookieStorage.set(cookie_key, r.const.TRUE, '') }
                })
                break
            }
        }
    }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER)
}