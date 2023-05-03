const r_text = {
    ok: { en: 'OK', zh_cn: '确定', },
    close: { en: 'Close', zh_cn: '关闭' },
    welcome_to_acfun: '<p><b>缺B乐 了解下？</b></p>',
    version_remind: ``,
}

export function _t(key: keyof typeof r_text) {
    const text = r_text[key]
    const lang = 'zh_cn'
    return typeof text === 'string' ? text : text[lang]
}

export const TRUE = 'Y'
export const FALSE = ''

export type BOOL = typeof TRUE | typeof FALSE

export const r = {
    html: {},
    attr: {},
    url: {
        issue: 'https://github.com/ipcjs/bilibili-helper/issues',
        issue_new: 'https://github.com/ipcjs/bilibili-helper/issues/new',
        readme: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md#%E8%A7%A3%E9%99%A4b%E7%AB%99%E5%8C%BA%E5%9F%9F%E9%99%90%E5%88%B6',
    },
    script: {
        is_dev: GM_info.script.name.includes('.dev'),
    },
    const: {
        mode: {
            /** 默认模式, 自动判断使用何种模式, 推荐; */
            DEFAULT: 'default',
            /** 替换模式, 替换有区域限制的视频的接口的返回值; */
            REPLACE: 'replace',
            /** 重定向模式, 直接重定向所有番剧视频的接口到代理服务器; 所有番剧视频都通过代理服务器获取视频地址, 如果代理服务器不稳定, 可能加载不出视频; */
            REDIRECT: 'redirect',
        },
        server: {
            S0: 'https://biliplus.ipcjs.top',
            S1: 'https://www.biliplus.com',
            CUSTOM: '__custom__',
            defaultServer: function () {
                return this.S1
            },
        },
        TRUE: TRUE,
        FALSE: FALSE,
    },
    regex: {
        /** api.bilibili.com的全站代理 */
        bilibili_api_proxy: /^https?:\/\/(?<user_pass>[\p{L}\d:_-]+@)?(?<user_server>[\p{L}\d_-]+(\.[\p{L}\d_-]+)+(:\d+)?)$/u,
    },
    baipiao: [
        { key: 'zomble_land_saga', match: () => (window.__INITIAL_STATE__?.epInfo?.ep_id) === 251255, link: 'http://www.acfun.cn/bangumi/ab5022161_31405_278830', message: r_text.welcome_to_acfun },
        { key: 'zomble_land_saga', match: () => (window.__INITIAL_STATE__?.mediaInfo?.media_id) === 140772, link: 'http://www.acfun.cn/bangumi/aa5022161', message: r_text.welcome_to_acfun },
    ]
}