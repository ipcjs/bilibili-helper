
/** https://static.hdslb.com/js/md5.js */
declare var hex_md5: (hex: string) => string

/** {@link NonNullable} 的反义词 */
type Nullable<T> = T | null | undefined

/**
 * 非空的值
 * @see https://github.com/microsoft/TypeScript/issues/7648#issuecomment-541625573
 */
type Thing = string | number | boolean | bigint | object | symbol

/**
 * `any`表示关闭类型检查, `any | null | undefined`, 无意义, 
 * 使用`StringObject | null | undefined`可以近似表示这种状态
 */
type StringAnyObject = { [k: string]: any }

type StringStringObject = { [k: string]: string }

type SegmentBaseMapObject = { [k: string]: [initialization: string, indexRange: string] }

type ResolutionMapObject = { [k: string]: [w: number, h: number] }

/** T的所有value的联合类型 */
type ValueOf<T> = T[keyof T]

/** rollup-plugin-html插件导入的html文件 */
declare module '*.html' {
    const str: string
    export default str
}

/** rollup-plugin-scss插件导入的scss文件 */
declare module '*.scss' {
    const str: string
    export default str
}