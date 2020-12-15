import { util_init } from "../../util/initiator"
import { log, logHub, util_debug } from "../../util/log"
import { _ } from "../../util/react"
import { ui } from "../../util/ui"
import { balh_config } from "../config"
import { util_page } from "../page"
import { r } from "../r"
import { util_ui_msg } from '../../util/message'
import { biliplus_login } from "./biliplus_login"

const balh_feature_runPing = function () {
    const pingOutput = document.getElementById('balh_server_ping');
    if (!pingOutput) {
        return
    }

    let xhr = new XMLHttpRequest()
    let testUrl = [r.const.server.S0, r.const.server.S1]
    let testUrlIndex = 0
    let isReused = false
    let prevNow: number
    let outputArr: string[] = []

    if (balh_config.server_custom) {
        testUrl.push(balh_config.server_custom)
    }
    pingOutput.textContent = '正在进行服务器测速…';
    pingOutput.style.height = '100px';
    xhr.open('GET', '', true);
    xhr.onreadystatechange = function () {
        this.readyState == 4 && pingResult();
    };
    var pingLoop = function () {
        prevNow = performance.now();
        xhr.open('GET', testUrl[testUrlIndex] + '/api/bangumi', true);
        xhr.send();
    };
    var pingResult = function () {
        var duration = (performance.now() - prevNow) | 0;
        if (isReused)
            outputArr.push('\t复用连接：' + duration + 'ms'), isReused = false, testUrlIndex++;
        else
            outputArr.push(testUrl[testUrlIndex] + ':'), outputArr.push('\t初次连接：' + duration + 'ms'), isReused = true;
        pingOutput.textContent = outputArr.join('\n');
        testUrlIndex < testUrl.length ? pingLoop() : pingOutput.appendChild(_('a', { href: 'javascript:', event: { click: balh_feature_runPing } }, [_('text', '\n再测一次？')]));
    };
    pingLoop();
}

export function settings() {
    function addSettingsButton() {
        let indexNav = document.querySelector<HTMLElement>('.bangumi-nav-right, #index_nav, #fixnav_report')
        let settingBtnSvgContainer: HTMLElement | undefined
        const createBtnStyle = (size: string, diffCss?: string) => {
            diffCss = diffCss || `
                    #balh-settings-btn {
                        bottom: 110px;
                        border: 1px solid #e5e9ef;
                        border-radius: 4px;
                        background: #f6f9fa;
                        margin-top: 4px;
                    }
                    #balh-settings-btn .btn-gotop {
                        text-align: center;
                    }
                `
            return _('style', {}, [_('text', `
                    ${diffCss}
                    #balh-settings-btn {
                        width: ${size};
                        height: ${size};
                        cursor: pointer;
                    }
                    #balh-settings-btn:hover {
                        background: #00a1d6;
                        border-color: #00a1d6;
                    }
                    #balh-settings-btn .icon-saturn {
                        width: 30px;
                        height: ${size};
                        fill: rgb(153,162,170);
                    }
                    #balh-settings-btn:hover .icon-saturn {
                        fill: white;
                    }
            `)])
        }
        if (indexNav == null) {
            // 信息页添加到按钮右侧
            if (util_page.bangumi_md()) {
                indexNav = document.querySelector('.media-info-btns');
                indexNav?.appendChild(createBtnStyle('44px', `
                        #balh-settings-btn {
                            float: left;
                            margin: 3px 0 0 20px;
                            background: #FFF;
                            border-radius: 10px;
                        }
                        #balh-settings-btn>:first-child {
                            text-align: center;
                            height: 100%;
                        }
                    `))
            } else {
                // 新版视频页面的“返回页面顶部”按钮, 由Vue控制, 对内部html的修改会被重置, 故只能重新创建新的indexNav
                let navTools = document.querySelector('.nav-tools, .float-nav')
                if (navTools) {
                    let bottom = navTools.className.includes('float-nav') ? '53px' : '45px'
                    const _indexNav = indexNav = document.body.appendChild(_('div', { style: { position: 'fixed', right: '6px', bottom: bottom, zIndex: '129', textAlign: 'center', display: 'none' } }))
                    indexNav.appendChild(createBtnStyle('45px'))
                    window.addEventListener('scroll', (event) => {
                        _indexNav.style.display = window.scrollY < 600 ? 'none' : ''
                    })
                }
            }
            if (indexNav) {
                settingBtnSvgContainer = indexNav.appendChild(_('div', { id: 'balh-settings-btn', title: GM_info.script.name + ' 设置', event: { click: showSettings } }, [_('div', {})])).firstChild as HTMLElement;
            }
        } else {
            // 视频页添加到回顶部下方
            window.dispatchEvent(new Event('resize'));
            indexNav.style.display = 'block';
            indexNav.appendChild(createBtnStyle('46px'))
            settingBtnSvgContainer = indexNav.appendChild(_('div', { id: 'balh-settings-btn', title: GM_info.script.name + ' 设置', event: { click: showSettings } }, [_('div', { className: 'btn-gotop' })])).firstChild as HTMLElement;
        }
        settingBtnSvgContainer && (settingBtnSvgContainer.innerHTML = `<!-- https://www.flaticon.com/free-icon/saturn_53515 --><svg class="icon-saturn" viewBox="0 0 612.017 612.017"><path d="M596.275,15.708C561.978-18.59,478.268,5.149,380.364,68.696c-23.51-7.384-48.473-11.382-74.375-11.382c-137.118,0-248.679,111.562-248.679,248.679c0,25.902,3.998,50.865,11.382,74.375C5.145,478.253-18.575,561.981,15.724,596.279c34.318,34.318,118.084,10.655,216.045-52.949c23.453,7.365,48.378,11.344,74.241,11.344c137.137,0,248.679-111.562,248.679-248.68c0-25.862-3.979-50.769-11.324-74.24C606.931,133.793,630.574,50.026,596.275,15.708zM66.435,545.53c-18.345-18.345-7.919-61.845,23.338-117.147c22.266,39.177,54.824,71.716,94.02,93.943C128.337,553.717,84.837,563.933,66.435,545.53z M114.698,305.994c0-105.478,85.813-191.292,191.292-191.292c82.524,0,152.766,52.605,179.566,125.965c-29.918,41.816-68.214,87.057-113.015,131.839c-44.801,44.819-90.061,83.116-131.877,113.034C167.303,458.76,114.698,388.479,114.698,305.994z M305.99,497.286c-3.156,0-6.236-0.325-9.354-0.459c35.064-27.432,70.894-58.822,106.11-94.059c35.235-35.235,66.646-71.046,94.058-106.129c0.153,3.118,0.479,6.198,0.479,9.354C497.282,411.473,411.469,497.286,305.99,497.286z M428.379,89.777c55.303-31.238,98.803-41.683,117.147-23.338c18.402,18.383,8.187,61.902-23.204,117.377C500.095,144.62,467.574,112.043,428.379,89.777z"/></svg>`);
    }

    function _showSettings() {
        document.body.appendChild(settingsDOM);
        var form = settingsDOM.querySelector('form')!;
        // elements包含index的属性, 和以name命名的属性, 其中以name命名的属性是不可枚举的, 只能通过这种方式获取出来
        Object.getOwnPropertyNames(form.elements).forEach(function (name) {
            if (name.startsWith('balh_')) {
                var key = name.replace('balh_', '')
                var ele = (form.elements as any)[name]
                if (ele.type === 'checkbox') {
                    ele.checked = balh_config[key];
                } else {
                    ele.value = balh_config[key];
                }
            }
        })
        document.body.style.overflow = 'hidden';
    }

    // 往顶层窗口发显示设置的请求
    function showSettings() {
        window.top.postMessage('balh-show-setting', '*')
    }

    // 只有顶层窗口才接收请求
    if (window === window.top) {
        window.addEventListener('message', (event) => {
            if (event.data === 'balh-show-setting') {
                _showSettings();
                window.$('#upos-server')[0].value = balh_config.upos_server || '';
            }
        })
    }

    function onSignClick(event: Event) {
        settingsDOM.click();
        switch ((event.target as any).attributes['data-sign'].value) {
            default:
            case 'in':
                biliplus_login.showLogin();
                break;
            case 'out':
                biliplus_login.showLogout();
                break;
        }
    }

    function onSettingsFormChange(e: Event) {
        const target = e.target as HTMLInputElement
        var name = target.name;
        var value = target.type === 'checkbox' ? (target.checked ? r.const.TRUE : r.const.FALSE) : target.value.trim()
        balh_config[name.replace('balh_', '')] = value
        log(name, ' => ', value);
    }

    // 第一次点击时:
    // 1. '复制日志&问题反馈' => '复制日志'
    // 2. 显示'问题反馈'
    // 3. 复制成功后请求跳转到GitHub
    // 之后的点击, 只是正常的复制功能~~
    function onCopyClick(this: {}, event: Event) {
        let issueLink = document.getElementById('balh-issue-link')
        if (!issueLink) {
            return
        }
        let continueToIssue = issueLink.style.display === 'none'
        if (continueToIssue) {
            issueLink.style.display = 'inline'
            let copyBtn = document.getElementById('balh-copy-log')!
            copyBtn.innerText = '复制日志'
        }

        let textarea = document.getElementById('balh-textarea-copy') as HTMLTextAreaElement
        textarea.style.display = 'inline-block'
        if (ui.copy(logHub.getAllMsg(), textarea)) {
            textarea.style.display = 'none'
            util_ui_msg.show(window.$(this),
                continueToIssue ? '复制日志成功; 点击确定, 继续提交问题(需要GitHub帐号)\n请把日志粘贴到问题描述中' : '复制成功',
                continueToIssue ? 0 : 3e3,
                continueToIssue ? 'button' : undefined,
                continueToIssue ? openIssuePage : undefined)
        } else {
            util_ui_msg.show(window.$(this), '复制失败, 请从下面的文本框手动复制', 5e3)
        }
    }

    function openIssuePage() {
        // window.open(r.url.issue)
        window.open(r.url.readme)
    }

    let printSystemInfoOk = false

    // 鼠标移入设置底部的时候, 打印一些系统信息, 方便问题反馈
    function onMouseEnterSettingBottom(event: Event) {
        if (!printSystemInfoOk) {
            printSystemInfoOk = true
            util_debug('userAgent', navigator.userAgent)
        }
    }

    let customServerCheckText: HTMLElement
    var settingsDOM = _('div', { id: 'balh-settings', style: { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.7)', animationName: 'balh-settings-bg', animationDuration: '.5s', zIndex: 10000, cursor: 'pointer' }, event: { click: function (e: any) { if (e.target === this) util_ui_msg.close(), document.body.style.overflow = '', (this as any).remove(); } } }, [
        _('style', {}, [_('text', r.css.settings)]),
        _('div', { style: { position: 'absolute', background: '#FFF', borderRadius: '10px', padding: '20px', top: '50%', left: '50%', width: '600px', transform: 'translate(-50%,-50%)', cursor: 'default' } }, [
            _('h1', {}, [_('text', `${GM_info.script.name} v${GM_info.script.version} 参数设置`)]),
            _('br'),
            _('form', { id: 'balh-settings-form', event: { change: onSettingsFormChange } }, [
                _('text', '代理服务器：'), _('a', { href: 'javascript:', event: { click: balh_feature_runPing } }, [_('text', '测速')]), _('br'),
                _('div', { style: { display: 'flex' } }, [
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_server_inner', value: r.const.server.S0 }), _('text', '土豆服')]),
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_server_inner', value: r.const.server.S1 }), _('text', 'BiliPlus'), _('a', { href: 'https://www.biliplus.com/?about' }, [_('text', '（捐赠）')]),
                    ]),
                    _('label', { style: { flex: 2 } }, [
                        _('input', { type: 'radio', name: 'balh_server_inner', value: r.const.server.CUSTOM }), _('text', `自定义: `),
                        _('input', {
                            type: 'text', name: 'balh_server_custom', placeholder: '形如：https://hd.pilipili.com', event: {
                                input: (event: Event) => {
                                    customServerCheckText.innerText = /^https?:\/\/[\w.]+$/.test((event.target as any).value.trim()) ? '✔️' : '❌'
                                    onSettingsFormChange(event)
                                }
                            }
                        }),
                        customServerCheckText = _('span'),
                    ]),
                ]), _('br'),
                _('div', { id: 'balh_server_ping', style: { whiteSpace: 'pre-wrap', overflow: 'auto' } }, []),
                _('div', { style: { display: '' } }, [ // 这个功能貌似没作用了...隐藏掉 => 貌似还有用...重新显示
                    _('text', 'upos服务器：'), _('br'),
                    _('div', { title: '变更后 切换清晰度 或 刷新 生效' }, [
                        _('input', { style: { visibility: 'hidden' }, type: 'checkbox' }),
                        _('text', '替换upos视频服务器：'),
                        _('select', {
                            id: 'upos-server',
                            event: {
                                change: function (this: HTMLSelectElement) {
                                    let server = this.value;
                                    let message = window.$('#upos-server-message');
                                    let clearMsg = function () { message.text('') }
                                    message.text('保存中...')
                                    window.$.ajax(balh_config.server + '/api/setUposServer?server=' + server, {
                                        xhrFields: { withCredentials: true },
                                        dataType: 'json',
                                        success: function (json: any) {
                                            if (json.code == 0) {
                                                message.text('已保存');
                                                setTimeout(clearMsg, 3e3);
                                                balh_config.upos_server = server;
                                            }
                                        },
                                        error: function () {
                                            message.text('保存出错');
                                            setTimeout(clearMsg, 3e3);
                                        }
                                    })
                                }
                            }
                        }, [
                            _('option', { value: "" }, [_('text', '不替换')]),
                            _('option', { value: "ks3u" }, [_('text', 'ks3（金山）')]),
                            _('option', { value: "kodou" }, [_('text', 'kodo（七牛）')]),
                            _('option', { value: "cosu" }, [_('text', 'cos（腾讯）')]),
                            _('option', { value: "bosu" }, [_('text', 'bos（百度）')]),
                            _('option', { value: "wcsu" }, [_('text', 'wcs（网宿）')]),
                            _('option', { value: "xycdn" }, [_('text', 'xycdn（迅雷）')]),
                            _('option', { value: "hw" }, [_('text', 'hw（251）')]),
                        ]),
                        _('span', { 'id': 'upos-server-message' })
                    ]), _('br'),
                ]),
                _('text', '脚本工作模式：'), _('br'),
                _('div', { style: { display: 'flex' } }, [
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.DEFAULT }), _('text', '默认：自动判断')]),
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.REPLACE }), _('text', '替换：在需要时处理番剧')]),
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'radio', name: 'balh_mode', value: r.const.mode.REDIRECT }), _('text', '重定向：完全代理所有番剧')])
                ]), _('br'),
                _('text', '其他：'), _('br'),
                _('div', { style: { display: 'flex' } }, [
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_blocked_vip' }), _('text', '被永封的大会员'), _('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md#大会员账号被b站永封了', target: '_blank' }, [_('text', '(？)')])]),
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_enable_in_av' }), _('text', '在AV页面启用'), _('a', { href: 'https://github.com/ipcjs/bilibili-helper/issues/172', target: '_blank' }, [_('text', '(？)')])]),
                    _('div', { style: { flex: 1, display: 'flex' } }, [
                        _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_remove_pre_ad' }), _('text', '去前置广告')]),
                        // _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_flv_prefer_ws' }), _('text', '优先使用ws')]),
                    ])
                ]), _('br'),
                _('div', { style: { display: 'flex' } }, [
                    _('label', { style: { flex: 1 } }, [_('input', { type: 'checkbox', name: 'balh_is_closed' }), _('text', '关闭脚本'), _('a', { href: 'https://github.com/ipcjs/bilibili-helper/issues/710', target: '_blank' }, [_('text', '(？)')])]),
                ]), _('br'),
                _('a', { href: 'javascript:', 'data-sign': 'in', event: { click: onSignClick } }, [_('text', '帐号授权')]),
                _('text', '　'),
                _('a', { href: 'javascript:', 'data-sign': 'out', event: { click: onSignClick } }, [_('text', '取消授权')]),
                _('text', '　　'),
                _('a', { href: 'javascript:', event: { click: function () { util_ui_msg.show(window.$(this), '如果你的帐号进行了付费，不论是大会员还是承包，\n进行授权之后将可以在解除限制时正常享有这些权益\n\n你可以随时在这里授权或取消授权\n\n不进行授权不会影响脚本的正常使用，但可能会缺失1080P', 1e4); } } }, [_('text', '（这是什么？）')]),
                _('br'), _('br'),
                _('div', { style: { whiteSpace: 'pre-wrap' }, event: { mouseenter: onMouseEnterSettingBottom } }, [
                    _('a', { href: 'https://greasyfork.org/zh-CN/scripts/25718-%E8%A7%A3%E9%99%A4b%E7%AB%99%E5%8C%BA%E5%9F%9F%E9%99%90%E5%88%B6', target: '_blank' }, [_('text', '脚本主页')]),
                    _('text', '　'),
                    _('a', { href: 'https://github.com/ipcjs/bilibili-helper/blob/user.js/packages/unblock-area-limit/README.md', target: '_blank' }, [_('text', '帮助说明')]),
                    _('text', '　'),
                    _('a', { id: 'balh-copy-log', href: 'javascript:;', event: { click: onCopyClick } }, [_('text', '复制日志&问题反馈')]),
                    _('text', '　'),
                    _('a', { id: 'balh-issue-link', href: 'javascript:;', event: { click: openIssuePage }, style: { display: 'none' } }, [_('text', '问题反馈')]),
                    _('a', { href: 'https://github.com/ipcjs/bilibili-helper/graphs/contributors' }, [_('text', '贡献者')]),
                    _('text', ' 接口：'),
                    _('a', { href: 'https://www.biliplus.com/' }, [_('text', 'BiliPlus ')]),
                    _('a', { href: 'https://github.com/kghost/bilibili-area-limit' }, [_('text', 'kghost ')]),
                    _('a', { href: 'https://github.com/yujincheng08/BiliRoaming' }, [_('text', 'BiliRoaming ')]),
                ]),
                _('textarea', { id: 'balh-textarea-copy', style: { display: 'none' } })
            ])
        ])
    ]);

    util_init(() => {
        if (!(util_page.player() || (util_page.av() && !balh_config.enable_in_av))) {
            addSettingsButton()
        }
    }, util_init.PRIORITY.DEFAULT, util_init.RUN_AT.DOM_LOADED_AFTER)
    return {
        dom: settingsDOM,
        show: showSettings,
    }
}