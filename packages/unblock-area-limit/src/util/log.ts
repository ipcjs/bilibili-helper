import { r } from "../feature/r"
import { Objects } from "./objects"
import { Strings } from "./strings"

const tag = GM_info.script.name + '.msg'

// 计算"楼层", 若当前window就是顶层的window, 则floor为0, 以此类推
function computeFloor(w: Window = window, floor = 0): number {
    if (w === window.top) {
        return floor
    } else {
        return computeFloor(w.parent, floor + 1)
    }
}

let floor = computeFloor()
let msgList: string[] = []
if (floor === 0) { // 只有顶层的Window才需要收集日志
    window.addEventListener('message', (event) => {
        if (event.data instanceof Array && event.data[0] === tag) {
            let [/*tag*/, fromFloor, msg] = event.data
            msgList.push(Strings.multiply('    ', fromFloor) + msg)
        }
    })
}

const logHub = {
    msg: function (msg: string) {
        window.top?.postMessage([tag, floor, msg], '*')
    },
    getAllMsg: function (replaces: StringStringObject = {}): string {
        let allMsg = msgList.join('\n')
        for (const k of Object.keys(replaces)) {
            allMsg = allMsg.replace(k, replaces[k])
        }
        return allMsg
    }
}

type ConsoleLogFunctions = {
    [P in keyof Console as /*由各种值组成的数组, 基本上只有any[]才能接收它*/[1, '2', {}] extends Parameters<Console[P]> ? P : never]: Console[P]
}

function logImpl(type: keyof ConsoleLogFunctions): (...args: any) => void {
    if (r.script.is_dev) {
        // 直接打印, 会显示行数
        return window.console[type].bind(window.console, type + ':');
    } else {
        // 将log收集到util_log_hub中, 显示的行数是错误的...
        return function (...args: any) {
            args.unshift(type + ':')
            window.console[type].apply(window.console, args)
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
