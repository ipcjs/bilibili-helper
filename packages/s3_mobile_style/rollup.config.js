/**
 * 开发命令:
 * npx rollup --config rollup.config.js -w
 */
import path from 'path'
import scss from 'rollup-plugin-scss'

const userscriptHead = `
// ==UserScript==
// @name         S3 Mobile Style
// @namespace    https://github.com/ipcjs
// @version      1.1.1
// @description  S3适配手机版网页
// @author       ipcjs
// @match        *://ac.stage3rd.com/*
// @grant        GM_addStyle
// @grant        GM.addStyle
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @run-at       document-start
// ==/UserScript==
`.trim()

export default {
    input: path.resolve(__dirname, 'index.js'),
    output: {
        banner: userscriptHead,
        file: path.resolve(__dirname, '../../scripts/s3__mobile_style.user.js'),
        format: 'esm',
    },
    plugins: [
        scss({
            output: false
        })
    ]
}
