import { util_debug, util_info, util_warn } from "./log"
import { Func } from "./utils"

/** 为啥要回调个valid😵 */
type Callback = (valid: boolean) => void

interface CallbackItem {
    priority: number
    index: number
    func: Callback
    always: boolean
}

const RUN_AT = {
    // readyState = loading
    LOADING: -1,
    // readyState = interactive
    DOM_LOADED: 0,
    // readyState = interactive
    DOM_LOADED_AFTER: 1,
    // readyState = complete
    COMPLETE: 2,
} as const;
const PRIORITY = {
    FIRST: 1e6,
    HIGH: 1e5,
    BEFORE: 1e3,
    DEFAULT: 0,
    AFTER: -1e3,
    LOW: -1e5,
    LAST: -1e6,
} as const;
const callbacks = {
    [RUN_AT.LOADING]: <CallbackItem[]>[],
    [RUN_AT.DOM_LOADED]: <CallbackItem[]>[],
    [RUN_AT.DOM_LOADED_AFTER]: <CallbackItem[]>[],
    [RUN_AT.COMPLETE]: <CallbackItem[]>[],
}

function showWarn() {
    util_warn(`${GM_info.script.name} ${window.document.readyState} 加载时机不太对, 不能保证正常工作\n\n1. 尝试刷新页面, 重载脚本\n2. 若依然出现该提示, 请尝试'硬性重新加载'(快捷键一般为ctrl+f5)\n3. 若还是出现该提示, 请尝试关闭再重新打开该页面\n4. 若反复出现该提示, 那也没其他办法了_(:3」∠)_\n`)
}
let atRun: ValueOf<typeof RUN_AT> // 用来表示当前运行到什么状态
switch (unsafeWindow.document.readyState) {
    case 'loading':
        atRun = RUN_AT.LOADING
        break;
    case 'interactive':
        showWarn()
        atRun = RUN_AT.DOM_LOADED_AFTER
        break;
    case 'complete':
        showWarn()
        atRun = RUN_AT.COMPLETE
        break;
}

util_debug(`atRun: ${atRun}, ${window.document.readyState}`)

const util_page_valid = () => true // 是否要运行
const dclCreator = function (runAt: ValueOf<typeof RUN_AT>) {
    let dcl = function () {
        util_debug(`atRun: ${runAt}, ${window.document.readyState}`)
        atRun = runAt // 更新运行状态
        const valid = util_page_valid()
        // 优先级从大到小, index从小到大, 排序
        callbacks[runAt].sort((a, b) => b.priority - a.priority || a.index - b.index)
            .filter(item => valid || item.always)
            .forEach(item => item.func(valid))
    }
    return dcl
}

unsafeWindow.document.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED))
unsafeWindow.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED_AFTER))
unsafeWindow.addEventListener('load', dclCreator(RUN_AT.COMPLETE))


const util_init = function (
    func: Callback,
    priority: ValueOf<typeof PRIORITY> = PRIORITY.DEFAULT,
    runAt: ValueOf<typeof RUN_AT> = RUN_AT.DOM_LOADED,
    always = false,
): void {
    func = Func.runCatching(func)
    if (atRun < runAt) { // 若还没运行到runAt指定的状态, 则放到队列里去
        callbacks[runAt].push({
            priority,
            index: callbacks[runAt].length, // 使用callback数组的长度, 作为添加元素的index属性
            func,
            always
        })
    } else { // 否则直接运行, TODO: 这种情况下优先级得不到保证...
        let valid = util_page_valid()
        if (valid || always) {
            func(valid)
        }
    }
}
util_init.RUN_AT = RUN_AT
util_init.PRIORITY = PRIORITY

export {
    util_init
}
