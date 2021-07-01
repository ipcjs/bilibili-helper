import { cookieStorage } from "../util/cookie"
import { log } from "../util/log"
import { util_page } from "./page"
import { r, TRUE, FALSE, BOOL } from "./r"

interface BalhConfig {
    /** BiliPlus的地址 */
    server: string
    /** 设置中的"代理服务器"选项, 可能为{@link r.const.server.CUSTOM}, 表示需要使用自定义代理服务器 */
    server_inner: string
    /** 自定义代理服务器的地址 */
    server_custom: string
    server_custom_tw: string
    server_custom_hk: string
    server_custom_cn: string
    server_custom_th: string
    /** api.bilibili.com的代理 */
    server_bilibili_api_proxy: (k:string) => ApiServer,
    mode: string
    flv_prefer_ws: string
    upos_server?: string
    /** 开启upos替换时, 是否替换`akamaized.net` */
    upos_replace_akamai?: BOOL
    /** 值为{@link r.const.TRUE} 或 {@link r.const.FALSE}, 当成boolean看也没太大问题 */
    blocked_vip?: boolean
    /** 同上 */
    enable_in_av?: boolean
    /** 同上 */
    remove_pre_ad?: boolean
    is_closed: BOOL
    [k: string]: string | boolean | object | undefined
}

export interface ApiServer {
    server: string,
    username: string,
    password: string,
}

const cookies = cookieStorage.all() // 缓存的cookies

function execServerInfo(v:string) : ApiServer {
    if (!r.regex.bilibili_api_proxy.test(v)) return undefined;
    let { user_pass, user_server } = r.regex.bilibili_api_proxy.exec(v).groups
    let username = undefined
    let password = undefined
    if (user_pass) {
        let upsp = user_pass.substr(0, user_pass.length - 1).split(':')
        password = upsp.pop()
        username = upsp.join(':')
        // 如果无法同时匹配用户名和密码，设置为空
        if (!password || !username) {
            password = undefined
            username = undefined
        }
    }
    let resp : ApiServer = {server:`https://${user_server}`, username, password}
    return resp
}

export const balh_config: BalhConfig = new Proxy({ /*保存config的对象*/ } as BalhConfig, {
    get: function (target, prop) {
        if (typeof prop !== 'string') throw new TypeError(`unsupported prop: ${String(prop)}`)
        if (prop === 'server') {
            const server_inner = balh_config.server_inner
            // 保证balh_config.server一定指向biliplus
            const server = server_inner === r.const.server.CUSTOM ? r.const.server.defaultServer() : server_inner
            return server
        }
        if (prop in target) {
            return (target as any)[prop]
        } else { // 若target中不存在指定的属性, 则从缓存的cookies中读取, 并保存到target中
            let value = cookies['balh_' + prop]
            switch (prop) {
                case 'server_inner':
                    value = value || r.const.server.CUSTOM
                    break
                case 'server_custom':
                    value = value || ''
                    break
                case 'server_custom_tw':
                    value = value || ''
                    break
                case 'server_custom_hk':
                    value = value || ''
                    break
                case 'server_custom_cn':
                    value = value || ''
                    break
                case 'server_custom_th':
                    value = value || ''
                    break
                case 'mode':
                    value = value || (balh_config.blocked_vip ? r.const.mode.REDIRECT : r.const.mode.DEFAULT)
                    break
                case 'flv_prefer_ws':
                    value = r.const.FALSE // 关闭该选项
                    break
                case 'is_closed':
                    if (value == null) {
                        value = FALSE // 默认为false
                    }
                    break;
                default:
                    // case 'blocked_vip':
                    // case 'remove_pre_ad':
                    break
            }
            (target as any)[prop] = value
            return value
        }
    },
    set: function (target, prop, value) {
        if (typeof prop !== 'string') {
            return false
        }
        ; (target as any)[prop] = value // 更新值
        cookieStorage['balh_' + prop] = value // 更新cookie中的值
        return true
    }
})

balh_config.server_bilibili_api_proxy = (k:string) => {
    switch (k) {
        case '':
            return execServerInfo(balh_config.server_custom)
        case 'tw':
            return execServerInfo(balh_config.server_custom_tw)
        case 'hk':
            return execServerInfo(balh_config.server_custom_hk)
        case 'cn':
            return execServerInfo(balh_config.server_custom_cn)
        case 'th':
            return execServerInfo(balh_config.server_custom_th)
        default:
            return undefined
    }
}

// 迁移到自定义代理服务器, 只会执行一次
if (util_page.new_bangumi() && !localStorage.balh_migrate_to_2) {
    localStorage.balh_migrate_to_2 = r.const.TRUE
    balh_config.server_inner = r.const.server.CUSTOM
    balh_config.is_closed = FALSE
    log('迁移配置完成')
}

export function isClosed() {
    return balh_config.is_closed || !balh_config.server_custom
}