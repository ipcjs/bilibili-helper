import css from './src/main.scss'
import main from './src/main'

log = GM_info.script.name.endsWith('.dev') ? console.debug.bind(console) : () => { }

GM.addStyle(css)
main({ log })
