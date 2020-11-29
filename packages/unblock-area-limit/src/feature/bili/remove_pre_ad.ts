import { log } from "../../util/log"
import { Strings } from "../../util/strings"
import { balh_config } from "../config"
import { util_page } from "../page"

export function remove_pre_ad() {
    if (util_page.player()) {
        // 播放页面url中的pre_ad参数, 决定是否播放广告...
        if (balh_config.remove_pre_ad && Strings.getSearchParam(location.href, 'pre_ad') === '1') {
            log('需要跳转到不含广告的url')
            location.href = location.href.replace(/&?pre_ad=1/, '')
        }
    }
}