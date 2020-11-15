import { util_error } from "./log"

export namespace Func {
    export function noop() { }

    export function runCatching(func: Function, onError?: (e: any) => any) {
        let ret = function (this: any) {
            try {
                return func.apply(this, arguments)
            } catch (e) {
                if (onError) return onError(e) // onError可以处理报错时的返回值
                // 否则打印log, 并返回undefined
                util_error('Exception while run %o: %o\n%o', func, e, e.stack)
                return undefined
            }
        }
        // 函数的name属性是不可写+可配置的, 故需要如下代码实现类似这样的效果: ret.name = func.name
        // 在Edge上匿名函数的name的描述符会为undefined, 需要做特殊处理, fuck
        let funcNameDescriptor = Object.getOwnPropertyDescriptor(func, 'name') || {
            value: '',
            writable: false,
            configurable: true,
        }
        Object.defineProperty(ret, 'name', funcNameDescriptor)
        return ret
    }

    export const safeGet = (code: string) => {
        return eval(`
        (()=>{
            try{
                return ${code}
            }catch(e){
                console.warn(e.toString())
                return null
            }
        })()
        `)
    }
}
