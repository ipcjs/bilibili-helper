import { BiliPlusApi } from "../../api/biliplus"
import { Async } from "../../util/async"
import { log, util_debug } from "../../util/log"
import { RegExps } from "../../util/regexps"
import { Strings } from "../../util/strings"

export function injectFetch() {
    // 当前未替换任何内容...
    const originFetch = unsafeWindow.fetch;
    unsafeWindow.fetch = function (input: RequestInfo, init?: RequestInit): Promise<Response> {
        log('fetch', input, init)
        return originFetch(input, init)
            .then(r => {
                // log('then', r)
                return r
            })
    }
}
export function injectFetch4Mobile() {
    util_debug('injectFetch4Mobile')
    unsafeWindow.fetch = Async.wrapper(unsafeWindow.fetch,
        resp => new Proxy(resp, {
            get: function (target, prop, receiver) {
                if (prop === 'json') {
                    return Async.wrapper(target.json.bind(target),
                        oriResult => {
                            util_debug('injectFetch:', target.url)
                            if (target.url.match(RegExps.urlPath('/player/web_api/v2/playurl/html5'))) {
                                let cid = Strings.getSearchParam(target.url, 'cid')
                                return BiliPlusApi.playurl(cid)
                                    .then(result => {
                                        if (result.code) {
                                            return Promise.reject('error: ' + JSON.stringify(result))
                                        } else {
                                            return BiliPlusApi.playurl_for_mp4(cid)
                                                .then(url => {
                                                    util_debug(`mp4地址, 移动版: ${url}, pc版: ${result.durl[0].url}`)
                                                    return {
                                                        "code": 0,
                                                        "cid": `http://comment.bilibili.com/${cid}.xml`,
                                                        "timelength": result.timelength,
                                                        "src": url || result.durl[0].url, // 只取第一个片段的url...
                                                    }
                                                })
                                        }
                                    })
                                    .catch(e => {
                                        // 若拉取视频地址失败, 则返回原始的结果
                                        log('fetch mp4 url failed', e)
                                        return oriResult
                                    })
                            }
                            return oriResult
                        },
                        error => error)
                }
                return target[prop]
            }
        }),
        error => error,
    ) as any
}