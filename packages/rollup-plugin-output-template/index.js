import MagicString from 'magic-string'
import { readFileSync } from 'fs'

/**
 * @param options {{path: string, contentTag: string}}
 */
export default function ({ filePath, contentTag = 'template-content' } = {}) {
    return {
        name: 'output-template',
        buildStart() {
            this.addWatchFile(filePath)
        },
        renderChunk(code, renderedChunk, outputOptions) {
            const magicString = new MagicString(code)
            const template = readFileSync(filePath, { encoding: 'utf8' })
            // 坑点: \s在多行模式下可能会匹配到\n (╯°口°)╯(┴—┴) 
            // 匹配出内容标签所在行
            const group = template.match(new RegExp(`[\\r\\n]+(\\s*)\\/\\/.*@${contentTag}.*([\\r\\n]+)`))
            if (group) {
                const lastIndex = group.index + group[0].length
                magicString.indent(group[1]) // group[1], 是标签所在行的缩进部分
                    .prepend(template.substring(0, lastIndex))
                    .append(group[2]) // group[2], 当前平台的换行符
                    .append(template.substring(lastIndex))
            } else {
                magicString.prepend(template)
            }

            // 参考: https://github.com/FlandreDaisuki/rollup-plugin-userscript-metablock/blob/master/src/index.js/#L113
            const result = { code: magicString.toString() }
            if (outputOptions.sourcemap !== false) {
                result.map = magicString.generateMap({ hires: true })
            }
            return result
        },
    }
}