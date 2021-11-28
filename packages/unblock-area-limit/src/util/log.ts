import { r } from "../feature/r"
import { Objects } from "./objects"
import { Strings } from "./strings"

const tag = GM_info.script.name + '.msg'

// 计算"楼层", 若当前window就是顶层的window, 则floor为0, 以此类推
function computeFloor(w: Window = unsafeWindow, floor = 0): number {
    if (w === unsafeWindow.top) {
        return floor
    } else {
        return computeFloor(w.parent, floor + 1)
    }
}

let floor = computeFloor()
let msgList: string[] = []
if (floor === 0) { // 只有顶层的Window才需要收集日志
    unsafeWindow.addEventListener('message', (event) => {
        if (event.data instanceof Array && event.data[0] === tag) {
            let [/*tag*/, fromFloor, msg] = event.data
            msgList.push(Strings.multiply('    ', fromFloor) + msg)
        }
    })
}

const logHub = {
    msg: function (msg: string) {
        unsafeWindow.top.postMessage([tag, floor, msg], '*')
    },
    getAllMsg: function () {
        return msgList.join('\n')
    }
}

function logImpl(type: keyof Console): (...args: any) => void {
    if (r.script.is_dev) {
        // 直接打印, 会显示行数
        return unsafeWindow.console[type].bind(unsafeWindow.console, type + ':');
    } else {
        // 将log收集到util_log_hub中, 显示的行数是错误的...
        return function (...args: any) {
            args.unshift(type + ':')
            unsafeWindow.console[type].apply(unsafeWindow.console, args)
            logHub.msg(Objects.stringifyArray(args))
        }
    }
}
const util_log = logImpl('log')
const util_info = logImpl('info')
const util_debug = logImpl('debug')
const util_warn = logImpl('warn')
const util_error = logImpl('error')

// todo: log相关方法用的地方太多了, 暂时不改名
export {
    util_log,
    util_info,
    util_warn,
    util_error,
    util_debug,
    util_debug as log,
    logHub,
}
