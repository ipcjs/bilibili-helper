
export namespace RegExps {
    const _raw = (str: string) => str.replace(/(\.|\?)/g, '\\$1')
    export const url = (url: string) => new RegExp(`^(https?:)?//${_raw(url)}`)
    export const urlPath = (path: string) => new RegExp(`^(https?:)?//[\\w\\-\\.]+${_raw(path)}`)
}
