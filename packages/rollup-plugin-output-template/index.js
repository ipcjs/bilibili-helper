import MagicString from 'magic-string'
import { readFileSync } from 'fs'

/**
 * @param options {{path: string, contentTag: string}}
 */
export default function ({ filePath, contentTag = 'template-content' } = {}) {
    return {
        renderChunk(code, renderedChunk, outputOptions) {
            const magicString = new MagicString(code)
            const template = readFileSync(filePath, { encoding: 'utf8' })
            // 匹配出内容标签所在行
            const group = template.match(new RegExp(`^(\\s*)\\/\\/.*@${contentTag}.*$`, 'm'))
            if (group) {
                const lastIndex = group.index + group[0].length
                magicString.indent(group[1]) // group[1], 是标签所在行的缩进部分
                    .prepend(template.substring(0, lastIndex + 1)) // +1, 用来包括\n
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