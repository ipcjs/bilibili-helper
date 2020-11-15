// 继承系统的[Error]在ES5下可能不生效, 使用这个类替代
// 详见: https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
export class Exception {
    message?: string

    constructor(message?: string) {
        this.message = message
    }
    toString() {
        return `Exception: ${this.message}`
    }
}