import { Exception } from "./error";
import { util_debug } from "./log";

// 在某些情况下, 页面中会修改window.Promise... 故我们要备份一下原始的Promise
const Promise = window.Promise
// 页面中倒是不会修改fetch, 但我们会修改(, 故也还是备份下
const fetch = window.fetch
/**
* 模仿RxJava中的compose操作符
* @param transformer 转换函数, 传入Promise, 返回Promise; 若为空, 则啥也不做
*/
Promise.prototype.compose = function (transformer) {
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
        const loop = (time): Promise<T> => {
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
    * @param promiseCeator  创建Promise的函数
    * @param resultTranformer 用于变换result的函数, 返回新的result或Promise
    * @param errorTranformer  用于变换error的函数, 返回新的error或Promise, 返回的Promise可以做状态恢复...
    */
    export function wrapper(promiseCeator, resultTranformer, errorTranformer) {
        return function (...args) {
            return new Promise((resolve, reject) => {
                // log(promiseCeator, ...args)
                promiseCeator(...args)
                    .then(r => resultTranformer ? resultTranformer(r) : r)
                    .then(r => resolve(r))
                    .catch(e => {
                        e = errorTranformer ? errorTranformer(e) : e
                        if (!(e instanceof Promise)) {
                            // 若返回值不是Promise, 则表示是一个error
                            e = Promise.reject(e)
                        }
                        e.then(r => resolve(r)).catch(e => reject(e))
                    })
            })
        }
    }

    function ajaxByFetch<T>(url: string): Promise<T> {
        return fetch(url).then(it => it.json())
    }


    function ajaxBy$<T>(url: string): Promise<T> {
        const creator = (): Promise<T> => new Promise((resolve, reject) => {
            let options: any = { url: url }

            options.async === undefined && (options.async = true);
            options.xhrFields === undefined && (options.xhrFields = { withCredentials: true });
            options.success = function (data) {
                resolve(data);
            };
            options.error = function (err) {
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
        return ajaxBy$<T>(url)
            .catch(e => {
                if (e instanceof RetryUntilTimeoutException) {
                    return ajaxByFetch<T>(url);
                } else {
                    return Promise.reject(e)
                }
            })
    }
}
export { Promise, Async }