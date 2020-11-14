
// todo: 居然是纯粹的类型声明的话, 应该可以写到d.ts文件里去

/** {@link NonNullable} 的反义词 */
export type Nullable<T> = T | null | undefined

/**
 * 非空的值
 * @see https://github.com/microsoft/TypeScript/issues/7648#issuecomment-541625573
 */
export type Thing = string | number | boolean | bigint | object | symbol

/**
 * `any`表示关闭类型检查, `any | null | undefined`, 无意义, 
 * 使用`StringObject | null | undefined`可以近似表示这种状态
 */
export type StringObject = { [k: string]: any }