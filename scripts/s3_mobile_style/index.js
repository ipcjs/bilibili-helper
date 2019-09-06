const log = console.log.bind(console, `[${GM_info.script.name}]`)
import css from './index.scss'

function setupMeta() {
    //<meta name="viewport" content="initial-scale=1.0, user-scalable=no" /> 
    const $meta = document.createElement('meta')
    $meta.name = 'viewport'
    $meta.content = 'initial-scale=1.0, user-scalable=no'
    document.head.appendChild($meta)
}

function setupStyle() {
    // 设置rootClass, 方便对具体页面设置css
    const rootClass = location.pathname.replace(/[\/.]/g, '_')
    document.documentElement.className += ` ${rootClass}`
    log('rootClass:', rootClass)
    GM.addStyle(css.toString())
}

setupMeta()
setupStyle()