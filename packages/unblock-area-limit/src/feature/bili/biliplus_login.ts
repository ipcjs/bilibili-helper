import { Async } from "../../util/async"
import { Converters } from "../../util/converters"
import { cookieStorage } from "../../util/cookie"
import { util_init } from "../../util/initiator"
import { _ } from "../../util/react"
import { ui } from "../../util/ui"
import { balh_config } from "../config"
import { util_page } from "../page"
import { r } from "../r"


function isLogin() {
    return localStorage.oauthexpires_at !== undefined
}
function clearLoginFlag() {
    delete localStorage.oauthexpires_at
}

function updateLoginFlag(loadCallback: (success: boolean) => void) {
    Async.jsonp(balh_config.server + '/login?act=expiretime')
        .then(() => loadCallback && loadCallback(true))
    // .catch(() => loadCallback && loadCallback(false)) // 请求失败不需要回调
}
function isLoginBiliBili() {
    return cookieStorage['DedeUserID'] !== undefined
}
// 当前在如下情况才会弹一次登录提示框:
// 1. 第一次使用
// 2. 主站+服务器都退出登录后, 再重新登录主站
function checkLoginState() {
    // 给一些状态，设置初始值
    localStorage.balh_must_remind_login_v3 === undefined && (localStorage.balh_must_remind_login_v3 = r.const.TRUE)

    if (isLoginBiliBili()) {
        if (!localStorage.balh_old_isLoginBiliBili // 主站 不登录 => 登录
            || localStorage.balh_pre_server !== balh_config.server // 代理服务器改变了
            || localStorage.balh_must_remind_login_v3) { // 设置了"必须提醒"flag
            clearLoginFlag()
            updateLoginFlag(() => {
                if (!isLogin() || !localStorage.access_key) {
                    localStorage.balh_must_remind_login_v3 = r.const.FALSE;
                    ui.pop({
                        content: [
                            _('text', `${GM_info.script.name}\n要不要考虑进行一下授权？\n\n授权后可以观看区域限定番剧的1080P\n（如果你是大会员或承包过这部番的话）\n\n你可以随时在设置中打开授权页面`)
                        ],
                        onConfirm: () => {
                            biliplus_login.showLogin();
                            document.querySelector('#AHP_Notice')?.remove()
                        }
                    })
                }
            })
        } else if ((isLogin() && Date.now() >= parseInt(localStorage.oauthexpires_at)) // 已登录，每天为周期检测key有效期，过期前五天会自动续期
            || localStorage.balh_must_updateLoginFlag) {// 某些情况下，必须更新一次
            updateLoginFlag(() => localStorage.balh_must_updateLoginFlag = r.const.FALSE);
        }
    }
    localStorage.balh_old_isLoginBiliBili = isLoginBiliBili() ? r.const.TRUE : r.const.FALSE
    localStorage.balh_pre_server = balh_config.server
}

function showLogin() {
    const balh_auth_window = window.open('about:blank')!;
    balh_auth_window.document.title = 'BALH - 授权';
    balh_auth_window.document.body.innerHTML = '<meta charset="UTF-8" name="viewport" content="width=device-width">正在获取授权，请稍候……';
    window.balh_auth_window = balh_auth_window;
    const paramDict = {
        appkey: '27eb53fc9058f8c3',
        local_id: "0",
        ts: (Date.now() / 1000).toFixed(0)
    }
    const { sign, params } = Converters.generateSign(paramDict, 'c2ed53a74eeefe3cf99fbd01d8c9c375')
    window.$.ajax('https://passport.bilibili.com/x/passport-tv-login/qrcode/auth_code?' + params + '&sign=' + sign, {
        xhrFields: { withCredentials: true },
        type: 'POST',
        dataType: 'json',
        success: (data: any) => {
            if (data.code === 0 && data.data.auth_code) {
                let authCode = data.data.auth_code
                balh_auth_window.document.body.innerHTML += '<br/>正在确认…… auth_code=' + authCode;
                const bili_jct = cookieStorage.get('bili_jct')
                const paramDict = {
                    auth_code: authCode,
                    build: "7082000",
                    csrf: bili_jct
                }
                const { params } = Converters.generateSign(paramDict, 'c2ed53a74eeefe3cf99fbd01d8c9c375')
                const url = 'https://passport.bilibili.com/x/passport-tv-login/h5/qrcode/confirm?' + params
                fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }).then(res => res.json()).then(data => {
                    if (data.code === 0 && data.message === "0") {
                        balh_auth_window.document.body.innerHTML += '<br/>授权成功，正在获取token……';
                        const paramDict = {
                            appkey: '27eb53fc9058f8c3',
                            local_id: "0",
                            auth_code: authCode,
                            ts: (Date.now() / 1000).toFixed(0)
                        }
                        const { sign, params } = Converters.generateSign(paramDict, 'c2ed53a74eeefe3cf99fbd01d8c9c375')
                        fetch('https://passport.bilibili.com/x/passport-tv-login/qrcode/poll?' + params + '&sign=' + sign, {
                            method: "POST",
                        }).then(res => res.json()).then(data => {
                            const access_token = data.data.token_info.access_token
                            const oauthexpires_at = (Date.now() / 1000 + data.data.token_info.expires_in) * 1000
                            balh_auth_window.document.body.innerHTML += '<br/>正在保存…… access_token=' + access_token + '， 过期于 ' + new Date(oauthexpires_at).toLocaleString();
                            if (data.code === 0 && data.message === "0") {
                                localStorage.access_key = access_token
                                localStorage.refresh_token = data.data.token_info.refresh_token
                                localStorage.oauthexpires_at = oauthexpires_at
                                balh_auth_window.document.body.innerHTML += '<br/>保存成功！5秒后关闭';
                                setTimeout(() => {
                                    window.balh_auth_window?.close();
                                }, 5000)
                            }
                        })
                    } else {
                        balh_auth_window.close()
                        ui.alert(data.message, () => {
                            location.href = 'https://passport.bilibili.com/login'
                        })
                    }
                })
            } else {
                balh_auth_window.close()
                ui.alert('必须登录B站才能正常授权', () => {
                    location.href = 'https://passport.bilibili.com/login'
                })
            }
        },
        error: (e: any) => {
            alert('error');
        }
    })
}

function showLoginByPassword() {
    const loginUrl = balh_config.server + '/login'
    ui.pop({
        content: `B站当前关闭了第三方登录的接口<br>目前只能使用帐号密码的方式<a href="${loginUrl}">登录代理服务器</a><br><br>登录完成后, 请手动刷新当前页面`,
        confirmBtn: '前往登录页面',
        onConfirm: () => {
            window.open(loginUrl)
        }
    })
}

function showLogout() {
    ui.popFrame(balh_config.server + '/login?act=logout')
}

// 监听登录message
window.addEventListener('message', function (e) {
    if (typeof e.data !== 'string') return // 只处理e.data为string的情况
    switch (e.data.split(':')[0]) {
        case 'BiliPlus-Login-Success': {
            //登入
            localStorage.balh_must_updateLoginFlag = r.const.TRUE
            Promise.resolve('start')
                .then(() => Async.jsonp(balh_config.server + '/login?act=getlevel'))
                .then(() => location.reload())
                .catch(() => location.reload())
            break;
        }
        case 'BiliPlus-Logout-Success': {
            //登出
            clearLoginFlag()
            location.reload()
            break;
        }
        case 'balh-login-credentials': {
            window.balh_auth_window?.close();
            let url = e.data.split(': ')[1];
            const access_key = new URL(url).searchParams.get('access_key');
            localStorage.access_key = access_key
            ui.popFrame(url.replace('https://www.mcbbs.net/template/mcbbs/image/special_photo_bg.png', balh_config.server + '/login'));
            break;
        }
    }
})


util_init(() => {
    if (!(util_page.player() || util_page.av())) {
        checkLoginState()
    }
}, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER)

export const biliplus_login = {
    showLogin,
    showLogout,
    isLogin,
    isLoginBiliBili,
}
