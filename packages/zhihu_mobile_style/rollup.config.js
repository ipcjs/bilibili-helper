import path from 'path'
import scss from 'rollup-plugin-scss'
import template from '../rollup-plugin-output-template/index'

export default {
    input: path.resolve(__dirname, 'index.js'),
    output: {
        file: path.resolve(__dirname, '../../scripts/zhihu_mobile_fuck_style.user.js'),
        format: 'es',
    },
    plugins: [
        scss({
            output: false,
        }),
        template({
            filePath: path.resolve(__dirname, 'index.user.js'),
        }),
    ]
}
