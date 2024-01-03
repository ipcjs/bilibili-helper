import * as bili from './feature/bili/index';
import { balh_config } from './feature/config';
import { cookieStorage } from './util/cookie';
import { logHub, util_debug, util_info } from './util/log';
import { ui } from './util/ui';

// 当前文件的内容会被包裹在scriptSource函数中执行
declare function scriptSource(invokeBy: string): void
declare const invokeBy: string

function scriptContent() {
    'use strict';
    let log = console.log.bind(console, 'injector:')
    if (document.getElementById('balh-injector-source') && invokeBy === GM_info.scriptHandler) {
        // 当前, 在Firefox+GM4中, 当返回缓存的页面时, 脚本会重新执行, 并且此时XMLHttpRequest是可修改的(为什么会这样?) + 页面中存在注入的代码
        // 导致scriptSource的invokeBy直接是GM4...
        log(`页面中存在注入的代码, 但invokeBy却等于${GM_info.scriptHandler}, 这种情况不合理, 终止脚本执行`)
        return
    }
    if (document.readyState as any === 'uninitialized') { // Firefox上, 对于iframe中执行的脚本, 会出现这样的状态且获取到的href为about:blank...
        log('invokeBy:', invokeBy, 'readState:', document.readyState, 'href:', location.href, '需要等待进入loading状态')
        setTimeout(() => scriptSource(invokeBy + '.timeout'), 0) // 这里会暴力执行多次, 直到状态不为uninitialized...
        return
    }

    log = util_debug
    log(`[${GM_info.script.name} v${GM_info.script.version} (${invokeBy})] run on: ${window.location.href}`);

    bili.version_remind()
    bili.switch_to_old_player()

    bili.area_limit_for_vue()

    bili.hide_adblock_tips()

    bili.area_limit_xhr()

    bili.remove_pre_ad()

    bili.check_html5()

    bili.redirect_to_bangumi_or_insert_player()

    bili.fill_season_page()

    const settings = bili.settings()

    bili.jump_to_baipiao()
    bili.biliplus_check_area_limit()

    function main() {
        util_info(
            'mode:', balh_config.mode,
            'blocked_vip:', balh_config.blocked_vip,
            'server:', balh_config.server,
            'upos_server:', balh_config.upos_server,
            'flv_prefer_ws:', balh_config.flv_prefer_ws,
            'remove_pre_ad:', balh_config.remove_pre_ad,
            'generate_sub:', balh_config.generate_sub,
            'enable_in_av:', balh_config.enable_in_av,
            'readyState:', document.readyState,
            'isLogin:', bili.bilibili_login.isLogin(),
            'isLoginBiliBili:', bili.bilibili_login.isLoginBiliBili()
        )
        // 暴露接口
        window.bangumi_area_limit_hack = {
            setCookie: cookieStorage.set,
            getCookie: cookieStorage.get,
            login: bili.bilibili_login.showLogin,
            logout: bili.bilibili_login.showLogout,
            getLog: () => {
                return logHub.getAllMsg({ [localStorage.access_key]: '{{access_key}}' })
            },
            getAllLog: (...args: any) => {
                setTimeout(() => {
                    ui.alert('⚠️️全部日志包含access_key等敏感数据, 请不要发布到公开的网络上!!!⚠️️')
                }, 0)
                return logHub.getAllMsg.apply(null, args)
            },
            showSettings: settings.show,
            _setupSettings: settings.setup,
            set1080P: function () {
                const settings = JSON.parse(localStorage.bilibili_player_settings)
                const oldQuality = settings.setting_config.defquality
                util_debug(`defauality: ${oldQuality}`)
                settings.setting_config.defquality = 112 // 1080P
                localStorage.bilibili_player_settings = JSON.stringify(settings)
                location.reload()
            },
            _clear_local_value: function () {
                delete localStorage.oauthTime
                delete localStorage.balh_h5_not_first
                delete localStorage.balh_old_isLoginBiliBili
                delete localStorage.balh_must_remind_login_v3
            }
        }
    }

    main();
}

scriptContent();
