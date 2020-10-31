export namespace Strings {
    export function multiply(str: string, multiplier: number) {
        let result = ''
        for (let i = 0; i < multiplier; i++) {
            result += str
        }
        return result
    }
}