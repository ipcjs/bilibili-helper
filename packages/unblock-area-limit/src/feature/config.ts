import { cookieStorage } from "../util/cookie"
import { StringStringObject } from "../util/types"
import { util_page } from "./page"
import { r } from "./r"

interface BalhConfig {
    server: string
    server_inner: string
    server_custom: string
    mode: string
    flv_prefer_ws: string
    blocked_vip: boolean
}

const cookies = cookieStorage.all() // 缓存的cookies
export const balh_config: BalhConfig = new Proxy({ /*保存config的对象*/ } as BalhConfig, {
    get: function (target, prop) {
        if (typeof prop !== 'string') throw new TypeError(`unsupported prop: ${String(prop)}`)
        if (prop === 'server') {
            // const server_inner = balh_config.server_inner
            // const server = server_inner === r.const.server.CUSTOM ? balh_config.server_custom : server_inner
            // return server
            return balh_config.server_inner
        }
        if (prop in target) {
            return (target as any)[prop]
        } else { // 若target中不存在指定的属性, 则从缓存的cookies中读取, 并保存到target中
            let value = cookies['balh_' + prop]
            switch (prop) {
                case 'server_inner':
                    value = value || r.const.server.defaultServer()
                    // 迁移回biliplus, 只会执行一次
                    if (util_page.new_bangumi() && !localStorage.balh_migrate_to_1) {
                        localStorage.balh_migrate_to_1 = r.const.TRUE
                        if (value.includes('biliplus.ipcjs.top')) {
                            value = r.const.server.defaultServer()
                            balh_config.server = value
                        }
                    }
                    break
                case 'server_custom':
                    value = value || ''
                    break
                case 'mode':
                    value = value || (balh_config.blocked_vip ? r.const.mode.REDIRECT : r.const.mode.DEFAULT)
                    break
                case 'flv_prefer_ws':
                    value = r.const.FALSE // 关闭该选项
                    break
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
