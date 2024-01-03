import { Async } from "../../util/async"
import { Converters } from "../../util/converters"
import { cookieStorage } from "../../util/cookie"
import { util_init } from "../../util/initiator"
import { _ } from "../../util/react"
import { ui } from "../../util/ui"
import { balh_config } from "../config"
import { util_page } from "../page"
import { FALSE, TRUE, r } from "../r"


function isLogin() {
    return localStorage.access_key && localStorage.oauth_expires_at && Date.now() < +localStorage.oauth_expires_at
}

function clearLoginFlag() {
    // 只要清除过期时间, isLogin()就会返回false
    delete localStorage.oauth_expires_at
}

function showLogout() {
    ui.alert('确定取消授权登出?', () => {
        // 登出, 则应该清除所有授权相关的字段
        delete localStorage.oauth_expires_at
        delete localStorage.access_key
        delete localStorage.refresh_token
    })
}

function isLoginBiliBili() {
    return cookieStorage['DedeUserID'] !== undefined
}
// 当前在如下情况才会弹一次登录提示框:
// 1. 第一次使用
// 2. 主站+服务器都退出登录后, 再重新登录主站
function checkLoginState() {
    // 给一些状态，设置初始值
    localStorage.balh_must_remind_login_v3 === undefined && (localStorage.balh_must_remind_login_v3 = TRUE)

    if (isLoginBiliBili()) {
        if (!localStorage.balh_old_isLoginBiliBili // 主站 不登录 => 登录
            || localStorage.balh_pre_server !== balh_config.server // 代理服务器改变了
            || localStorage.balh_must_remind_login_v3) { // 设置了"必须提醒"flag
            if (!isLogin()) {
                // 保证一定要交互一次, 才不提醒
                localStorage.balh_must_remind_login_v3 = TRUE;
                ui.pop({
                    content: [
                        _('text', `${GM_info.script.name}\n要不要考虑进行一下授权？\n\n授权后可以观看区域限定番剧的1080P\n（如果你是大会员或承包过这部番的话）\n\n你可以随时在设置中打开授权页面`)
                    ],
                    onConfirm: () => {
                        localStorage.balh_must_remind_login_v3 = FALSE;
                        showLogin();
                        document.querySelector('#AHP_Notice')?.remove()
                    },
                    closeBtn: '不再提醒',
                    onClose: () => {
                        localStorage.balh_must_remind_login_v3 = FALSE;
                    }
                })
            }
        }
    }
    localStorage.balh_old_isLoginBiliBili = isLoginBiliBili() ? TRUE : FALSE
    localStorage.balh_pre_server = balh_config.server
}

async function showLogin() {
    const balh_auth_window = window.open('about:blank')!;
    balh_auth_window.document.title = 'BALH - 授权';
    balh_auth_window.document.body.innerHTML = '<meta charset="UTF-8" name="viewport" content="width=device-width">正在获取授权，请稍候……';
    window.balh_auth_window = balh_auth_window;

    try {
        const { sign, params } = Converters.generateSign({
            appkey: '27eb53fc9058f8c3',
            local_id: "0",
            ts: (Date.now() / 1000).toFixed(0)
        }, 'c2ed53a74eeefe3cf99fbd01d8c9c375')
        const data1 = await (await fetch('https://passport.bilibili.com/x/passport-tv-login/qrcode/auth_code?' + params + '&sign=' + sign, {
            method: 'POST'
        })).json()

        if (data1.code === 0 && data1.data.auth_code) {
            let authCode = data1.data.auth_code
            balh_auth_window.document.body.innerHTML += '<br/>正在确认…… auth_code=' + authCode;
            const bili_jct = cookieStorage.get('bili_jct')
            const { params } = Converters.generateSign({
                auth_code: authCode,
                build: "7082000",
                csrf: bili_jct
            }, 'c2ed53a74eeefe3cf99fbd01d8c9c375')
            const data2 = await (await fetch(('https://passport.bilibili.com/x/passport-tv-login/h5/qrcode/confirm?' + params), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            })).json()

            if (data2.code === 0 && data2.message === "0") {
                balh_auth_window.document.body.innerHTML += '<br/>授权成功，正在获取token……';
                const { sign, params } = Converters.generateSign({
                    appkey: '27eb53fc9058f8c3',
                    local_id: "0",
                    auth_code: authCode,
                    ts: (Date.now() / 1000).toFixed(0)
                }, 'c2ed53a74eeefe3cf99fbd01d8c9c375')
                const data3 = await (await fetch('https://passport.bilibili.com/x/passport-tv-login/qrcode/poll?' + params + '&sign=' + sign, {
                    method: "POST",
                })).json()

                const access_token = data3.data.token_info.access_token
                const oauth_expires_at = (Date.now() / 1000 + data3.data.token_info.expires_in) * 1000
                balh_auth_window.document.body.innerHTML += '<br/>正在保存…… access_token=' + access_token + '， 过期于 ' + new Date(oauth_expires_at).toLocaleString();
                if (data3.code === 0 && data3.message === "0") {
                    localStorage.access_key = access_token
                    localStorage.refresh_token = data3.data.token_info.refresh_token
                    localStorage.oauth_expires_at = oauth_expires_at
                    balh_auth_window.document.body.innerHTML += '<br/>保存成功！3秒后关闭';
                    await Async.timeout(3000)
                }
            } else {
                ui.alert(data2.message, () => {
                    location.href = 'https://passport.bilibili.com/login'
                })
            }
        } else {
            ui.alert('必须登录B站才能正常授权', () => {
                location.href = 'https://passport.bilibili.com/login'
            })
        }
    } catch (e: any) {
        ui.alert(e.message ?? '授权出错')
    } finally {
        balh_auth_window.close()
    }
}

util_init(() => {
    if (!(util_page.player() || util_page.av())) {
        checkLoginState()
    }
}, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER)

export const bilibili_login = {
    showLogin,
    showLogout,
    isLogin,
    isLoginBiliBili,
    clearLoginFlag,
}
