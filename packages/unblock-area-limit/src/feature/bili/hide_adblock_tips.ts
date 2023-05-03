import { _ } from '../../util/react'
import { util_page } from '../page'
import css from './hide_adblock_tips.scss'

export function hide_adblock_tips() {
    if (util_page.home()) {
        document.head.appendChild(_('style', { id: 'balh-hide_adblock_tips' }, [_('text', css)]))
    }
}