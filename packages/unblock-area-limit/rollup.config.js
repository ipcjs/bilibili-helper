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
            // 这个版本不会"编译"async函数
            // 由于使用了 BigInt, 从 ES2017 升级到 ES2020
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
