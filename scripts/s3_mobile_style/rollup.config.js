/**
 * 开发命令:
 * npx rollup --config rollup.config.js -w
 */
const path = require('path')
const scssToString = require('rollup-plugin-scss-string')

const userscriptHead = `
// ==UserScript==
// @name         S3 Mobile Style
// @namespace    https://github.com/ipcjs
// @version      1.0.1
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
    input: './index.js',
    output: {
        banner: userscriptHead,
        file: path.resolve(__dirname, '../s3__mobile_style.user.js'),
        format: 'esm',
    },
    plugins: [
        scssToString({
            include: '**/*.scss'
        })
    ]
}
