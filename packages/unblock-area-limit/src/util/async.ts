import { Exception } from "./error";
import { util_debug } from "./log";
import { _ } from "./react";

// 在某些情况下, 页面中会修改window.Promise... 故我们要备份一下原始的Promise
const Promise = window.Promise
// 页面中倒是不会修改fetch, 但我们会修改(, 故也还是备份下
const fetch = window.fetch
/**
* 模仿RxJava中的compose操作符
* @param transformer 转换函数, 传入Promise, 返回Promise; 若为空, 则啥也不做
*/
Promise.prototype.compose = function (transformer: any) {
    return transformer ? transformer(this) : this
}

namespace Async {
    export function timeout(timeout: number) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, timeout);
        })
    }
    class RetryUntilTimeoutException extends Exception { }

    // 直到满足condition()为止, 才执行promiseCreator(), 创建Promise
    // https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
    export function retryUntil<T>(
        condition: () => boolean,
        promiseCreator: () => Promise<T>,
        retryCount = Number.MAX_VALUE,
        interval = 1,
    ) {
        const loop = (time: number): Promise<T> => {
            if (!condition()) {
                if (time < retryCount) {
                    return timeout(interval).then(loop.bind(null, time + 1))
                } else {
                    return Promise.reject(new RetryUntilTimeoutException(`retryUntil timeout, condition: ${condition.toString()}`))
                }
            } else {
                return promiseCreator()
            }
        }
        return loop(0)
    }


    /**
    * @param promiseCreator  创建Promise的函数
    * @param resultTransformer 用于变换result的函数, 返回新的result或Promise
    * @param errorTransformer  用于变换error的函数, 返回新的error或Promise, 返回的Promise可以做状态恢复...
    */
    export function wrapper(promiseCreator: (...args: any) => Promise<any>, resultTransformer: (r: any) => any, errorTransformer: (e: any) => any) {
        return function (...args: any) {
            return new Promise((resolve, reject) => {
                // log(promiseCreator, ...args)
                promiseCreator(...args)
                    .then(r => resultTransformer ? resultTransformer(r) : r)
                    .then(r => resolve(r))
                    .catch(e => {
                        e = errorTransformer ? errorTransformer(e) : e
                        if (!(e instanceof Promise)) {
                            // 若返回值不是Promise, 则表示是一个error
                            e = Promise.reject(e)
                        }
                        (e as Promise<any>).then(r => resolve(r)).catch(e => reject(e))
                    })
            })
        }
    }

    /** fetch没法发送cookies, 详见: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#Differences_from_jQuery */
    function requestByFetch<T>(url: string): Promise<T> {
        return fetch(url).then(it => it.json())
    }

    function requestByXhr<T>(url: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest()
            req.onreadystatechange = (event) => {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        try {
                            resolve(JSON.parse(req.responseText))
                        } catch (e) {
                            reject(req)
                        }
                    } else {
                        reject(req)
                    }
                }
            }
            req.withCredentials = true
            let authorization = ''
            // 理论上来说网页中的请求不应该带username&password, 这里直接将它们替换成authorization header...
            const originUrl = new URL(url, document.location.href)
            if (originUrl.username && originUrl.password) {
                authorization = "Basic " + btoa(`${originUrl.username}:${originUrl.password}`)
                // 清除username&password
                originUrl.username = ''
                originUrl.password = ''
                url = originUrl.href
            }
            req.open('GET', url)
            if (authorization) {
                req.setRequestHeader("Authorization", authorization);
            }
            req.send()
        });
    }


    function requestByJQuery<T>(url: string): Promise<T> {
        const creator = () => new Promise<T>((resolve, reject) => {
            let options: any = { url: url }

            const originUrl = new URL(url, document.location.href)
            // 同上
            if (originUrl.username && originUrl.password) {
                options.headers = { 'Authorization': 'Basic ' + btoa(`${originUrl.username}:${originUrl.password}`) }
                originUrl.username = ''
                originUrl.password = ''
                options.url = originUrl.href
            }


            options.async === undefined && (options.async = true);
            options.xhrFields === undefined && (options.xhrFields = { withCredentials: true });
            options.success = function (data: T) {
                resolve(data);
            };
            options.error = function (err: any) {
                reject(err);
            };
            util_debug(`ajax: ${options.url}`)
            window.$.ajax(options);
        })
        // 重试 30 * 100 = 3s
        return retryUntil(() => {
            util_debug(`retryUntil.ajaxBy$: ${window.$}`)
            return window.$;
        }, creator, 30, 100)
    }

    export function ajax<T>(url: string): Promise<T> {
        // todo: 直接用fetch实现更简单?
        return requestByJQuery<T>(url)
            .catch(e => {
                if (e instanceof RetryUntilTimeoutException) {
                    return requestByXhr<T>(url);
                } else {
                    return Promise.reject(e)
                }
            })
    }

    export function jsonp(url: string) {
        return new Promise<void>((resolve, reject) => {
            document.head.appendChild(_('script', {
                src: url,
                event: {
                    load: function () {
                        resolve()
                    },
                    error: function () {
                        reject()
                    }
                }
            }));
        })
    }
}
export { Promise, Async }