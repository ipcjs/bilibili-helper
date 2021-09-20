import path from 'path'
import scss from 'rollup-plugin-scss'
import typescript from '@rollup/plugin-typescript'
import template from '../rollup-plugin-output-template/index'
import html from 'rollup-plugin-html'

export default {
    input: path.resolve(__dirname, 'src/main.js'),
    output: {
        file: path.resolve(__dirname, '../../scripts/bilibili_bangumi_area_limit_hack.user.js'),
        format: 'es',
    },
    plugins: [
        scss({
            output: false
        }),
        typescript({
            // 这个版本会"编译"async函数
            target: 'ES2016',
        }),
        template({
            filePath: path.resolve(__dirname, 'src/main.user.js'),
        }),
        html({
            include: '**/*.html',
        })
    ]
}
