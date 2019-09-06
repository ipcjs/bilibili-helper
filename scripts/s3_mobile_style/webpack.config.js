/**
 * 废弃, 使用rollup替代, webpack输出的文件太乱了
 * 开发命令:
 * npx webpack --config webpack.config.js -w
 */
const path = require('path')
const webpack = require('webpack')

const userscriptHead = `
// ==UserScript==
// @name         S3 Mobile Style
// @namespace    https://github.com/ipcjs
// @version      1.0.0
// @description  S3简单适配手机版网页
// @author       ipcjs
// @match        *://ac.stage3rd.com/*
// @grant        GM_addStyle
// @grant        GM.addStyle
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @run-at       document-start
// ==/UserScript==
`.trim()

module.exports = {
    mode: 'none',
    entry: './index.js',
    output: {
        filename: '../s3__mobile_style.user.js',
        // path: path.resolve(__dirname, 'temp'),
        path: __dirname,
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'css-loader',
                    'sass-loader',
                ]
            }
        ]
    },
    plugins: [
        new webpack.BannerPlugin({
            entryOnly: true,
            raw: true,
            banner: userscriptHead,
        })
    ]
}