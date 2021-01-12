export namespace Strings {
    export function multiply(str: string, multiplier: number) {
        let result = ''
        for (let i = 0; i < multiplier; i++) {
            result += str
        }
        return result
    }

    export function toSnakeCase(str: string) {
        return str.replace(/[A-Z]/g, (a) => `_${a.toLowerCase()}`).replace(/^_/, "")
    }

    export function getSearchParam(url: string, key: string) {
        return (url.match(new RegExp('[?|&]' + key + '=(\\w+)')) || ['', ''])[1];
    }
    export function replaceTemplate(template: string, values: StringAnyObject) {
        return template.replace(/___(\w+)___/g, (match, name) => {
            return values[name]
        })
    }
}