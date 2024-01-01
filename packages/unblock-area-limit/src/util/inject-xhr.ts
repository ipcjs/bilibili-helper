// @ts-nocheck
import { r } from "../feature/r"
import { util_debug } from "./log"
let noReferrerHostArray: string[] = []
/// 注入Xhr
///
/// [transformRequest]:
/// {@macro xhr_transform_request}
///
/// [transformResponse]:
/// {@macro xhr_transform_response}
export function injectXhr({ transformRequest, transformResponse }) {
    util_debug('XMLHttpRequest的描述符:', Object.getOwnPropertyDescriptor(window, 'XMLHttpRequest'))
    let firstCreateXHR = true
    window.XMLHttpRequest = new Proxy(window.XMLHttpRequest, {
        construct: function (target, args) {
            // 第一次创建XHR时, 打上断点...
            if (firstCreateXHR && r.script.is_dev) {
                firstCreateXHR = false
                // debugger
            }
            let container = {} // 用来替换responseText等变量
            const dispatchResultTransformer = p => {
                let event = {} // 伪装的event
                return p
                    .then(r => {
                        container.readyState = 4
                        container.response = r
                        container.responseText = typeof r === 'string' ? r : JSON.stringify(r)
                        container.__onreadystatechange(event) // 直接调用会不会存在this指向错误的问题? => 目前没看到, 先这样(;¬_¬)
                    })
                    .catch(e => {
                        // 失败时, 让原始的response可以交付
                        container.__block_response = false
                        if (container.__response != null) {
                            container.readyState = 4
                            container.response = container.__response
                            container.__onreadystatechange(event) // 同上
                        }
                    })
            }
            const dispatchResultTransformerCreator = () => {
                container.__block_response = true
                return dispatchResultTransformer
            }
            return new Proxy(new target(...args), {
                has: function (target, prop) {
                    if (prop === 'onloadend') {
                        // 没有onloadend时, 会回退到使用onreadystatechange处理响应, 这样就不要改已有的代码了_(:3」∠)_
                        return false
                    }
                    return prop in target
                },
                set: function (target, prop, value, receiver) {
                    if (prop === 'onreadystatechange') {
                        container.__onreadystatechange = value
                        let cb = value
                        value = function (event) {
                            if (target.readyState === 4) {
                                /// {@macro xhr_transform_response}
                                const response = transformResponse({
                                    url: target.responseURL,
                                    response: target.response,
                                    xhr: target,
                                    container,
                                })
                                if (response != null) {
                                    if (typeof response === 'object' && response instanceof Promise) {
                                        // 异步转换
                                        response.compose(dispatchResultTransformerCreator())
                                    } else {
                                        // 同步转换
                                        container.response = response
                                        container.responseText = typeof response === 'string' ? response : JSON.stringify(response)
                                    }
                                } else {
                                    // 不转换
                                }
                                if (container.__block_response) {
                                    // 屏蔽并保存response
                                    container.__response = target.response
                                    return
                                }
                            }
                            // 这里的this是原始的xhr, 在container.responseText设置了值时需要替换成代理对象
                            cb.apply(container.responseText ? receiver : this, arguments)
                        }
                    }
                    target[prop] = value
                    return true
                },
                get: function (target, prop, receiver) {
                    if (prop in container) return container[prop]
                    let value = target[prop]
                    if (typeof value === 'function') {
                        let func = value
                        // open等方法, 必须在原始的xhr对象上才能调用...
                        value = function () {
                            if (target.readyState === 1) {
                                const url = container.__url
                                const host = new URL(url, document.location.href).hostname
                                if (noReferrerHostArray.includes(host)) {
                                    setReferrer('no-referrer')
                                } else {
                                    setReferrer('no-referrer-when-downgrade')
                                }
                            }
                            if (prop === 'open') {
                                container.__method = arguments[0]
                                container.__url = arguments[1]
                            } else if (prop === 'send') {
                                /// {@macro xhr_transform_request}
                                const promise = transformRequest({
                                    url: container.__url,
                                    container,
                                })
                                if (promise != null) {
                                    promise.compose(dispatchResultTransformerCreator())
                                }
                            }
                            return func.apply(target, arguments)
                        }
                    }
                    return value
                }
            })
        }
    })
}

let referrerEle: HTMLMetaElement | null = null

/**
 * XHR请求不能修改referer头, 目前通过修改网页的meta标签实现, 当前只对脚本重建的`bangumi-play-page-template.html`网页生效
 * 
 * @see https://stackoverflow.com/questions/27218525/set-referer-for-xmlhttprequest
 */
function setReferrer(referrer: 'no-referrer-when-downgrade' | 'no-referrer') {
    referrerEle ??= window.document.getElementById('referrerMark')
    if (referrerEle) {
        referrerEle.content = referrer
    }
}

export function addNoRefererHost(url: string) {
    if (url) {
        const host = new URL(url).hostname
        if (noReferrerHostArray.indexOf(host) < 0) {
            noReferrerHostArray.push(host)
        }
    }
}
