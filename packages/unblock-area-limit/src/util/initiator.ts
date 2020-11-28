import { util_warn } from "./log"
import { ValueOf } from "./types"
import { Func } from "./utils"

interface CallbackItem {
    priority: number
    index: number
    func: Function
    always: boolean
}

const RUN_AT = {
    DOM_LOADED: 0,
    DOM_LOADED_AFTER: 1,
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
    [RUN_AT.DOM_LOADED]: <CallbackItem[]>[],
    [RUN_AT.DOM_LOADED_AFTER]: <CallbackItem[]>[],
    [RUN_AT.COMPLETE]: <CallbackItem[]>[],
}
const util_page_valid = () => true // 是否要运行
const dclCreator = function (runAt: ValueOf<typeof RUN_AT>) {
    let dcl = function () {
        util_init.atRun = runAt // 更新运行状态
        const valid = util_page_valid()
        // 优先级从大到小, index从小到大, 排序
        callbacks[runAt].sort((a, b) => b.priority - a.priority || a.index - b.index)
            .filter(item => valid || item.always)
            .forEach(item => item.func(valid))
    }
    return dcl
}

if (window.document.readyState !== 'loading') {
    const msg = `${GM_info.script.name} 加载时机不对, 不能保证正常工作\n\n1. 点击'确定', 刷新页面/重载脚本\n2. 若依然出现该提示, 请尝试'硬性重新加载'(快捷键一般为ctrl+f5)\n3. 若还是出现该提示, 请尝试关闭再重新打开该页面\n4. 若反复出现该提示, 请尝试换个浏览器\n`
    /*
    ui.alert(msg, () => {
        location.reload(true)
    })
    */
    // throw new Error('unit_init must run at loading, current is ' + document.readyState)
    util_warn(msg)
}

window.document.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED))
window.addEventListener('DOMContentLoaded', dclCreator(RUN_AT.DOM_LOADED_AFTER))
window.addEventListener('load', dclCreator(RUN_AT.COMPLETE))


const util_init = function (
    func: Function,
    priority: ValueOf<typeof PRIORITY> = PRIORITY.DEFAULT,
    runAt: ValueOf<typeof RUN_AT> = RUN_AT.DOM_LOADED,
    always = false,
) {
    func = Func.runCatching(func)
    if (util_init.atRun < runAt) { // 若还没运行到runAt指定的状态, 则放到队列里去
        callbacks[runAt].push({
            priority,
            index: callbacks[runAt].length, // 使用callback数组的长度, 作为添加元素的index属性
            func,
            always
        })
    } else { // 否则直接运行
        let valid = util_page_valid()
        setTimeout(() => (valid || always) && func(valid), 1)
    }
    return func
}
util_init.atRun = -1 // 用来表示当前运行到什么状态
util_init.RUN_AT = RUN_AT
util_init.PRIORITY = PRIORITY

export {
    util_init
}
