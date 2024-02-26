import path from 'path'
import scss from 'rollup-plugin-scss'
import typescript from '@rollup/plugin-typescript'
import template from '../rollup-plugin-output-template/index'
import html from 'rollup-plugin-html'
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: path.resolve(__dirname, 'src/main.ts'),
    output: {
        file: path.resolve(__dirname, '../../scripts/bilibili_bangumi_area_limit_hack.user.js'),
        format: 'es',
    },
    plugins: [
        scss({
            output: false
        }),
        typescript({
            // 支持BigInt, async等
            target: 'ES2020',
        }),
        template({
            filePath: path.resolve(__dirname, 'src/main.user.js'),
        }),
        html({
            include: '**/*.html',
        }),
        commonjs(),
    ]
}
