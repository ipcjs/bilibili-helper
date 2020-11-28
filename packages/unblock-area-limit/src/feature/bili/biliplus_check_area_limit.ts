import { BiliPlusApi } from "../../api/biliplus"
import { util_init } from "../../util/initiator"
import { log } from "../../util/log"
import { util_page } from "../page"

export function biliplus_check_area_limit() {
    if (!util_page.bangumi_md()) {
        return
    }
    // 服务器需要通过这个接口判断是否有区域限制
    // 详见: https://github.com/ipcjs/bilibili-helper/issues/385
    util_init(() => {
        const season_id = window?.__INITIAL_STATE__?.mediaInfo?.param?.season_id
        if (season_id) {
            BiliPlusApi.season(season_id)
                .then(r => log(`season${season_id}`, r))
                .catch(e => log(`season${season_id}`, e))
        }
    })
}