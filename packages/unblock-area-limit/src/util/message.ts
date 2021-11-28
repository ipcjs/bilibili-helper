// @ts-check-off
import { util_init } from './initiator'
import { util_log } from './log'
import { util_notify } from './notification'
import { ui } from './ui'
import { Func } from './utils'
/**
 * {@link BiliMessageBox}
 * MessageBox -> from base.core.js
 * MessageBox.show(referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback)
 * MessageBox.close()
 */
let popMessage: BiliMessageBox | null = null
let mockPopMessage: BiliMessageBox = {
    show: (...args) => util_log('MockMessageBox', 'show', args),
    close: (...args) => util_log('MockMessageBox', 'close', args),
}
let notifyPopMessage: BiliMessageBox = {
    _current_notify: null,
    show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
        this.close()
        this._current_notify = util_notify.show(message, buttonTypeConfirmCallback, closeTime)
    },
    close: function () {
        if (this._current_notify) {
            util_notify.hideNotification(this._current_notify)
            this._current_notify = null
        }
    }
}
let alertPopMessage: BiliMessageBox = {
    show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
        ui.alert(message, buttonTypeConfirmCallback)
    },
    close: Func.noop
}

util_init(() => {
    if (!popMessage && unsafeWindow.MessageBox) {
        popMessage = new unsafeWindow.MessageBox()
        let orignShow = popMessage.show
        popMessage.show = function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
            // 这个窗，有一定机率弹不出来。。。不知道为什么
            orignShow.call(this, referenceElement, message.replace('\n', '<br>'), closeTime, boxType, buttonTypeConfirmCallback)
        }
        popMessage.close = function () {
            // 若没调用过show, 就调用close, msgbox会为null, 导致报错
            this.msgbox != null && unsafeWindow.MessageBox!.prototype.close.apply(this, [])
        }
    }
}, util_init.PRIORITY.FIRST, util_init.RUN_AT.DOM_LOADED_AFTER)

export const util_ui_msg: BiliMessageBox = {
    _impl: function () {
        return popMessage || alertPopMessage
    },
    show: function (referenceElement, message, closeTime, boxType, buttonTypeConfirmCallback) {
        let pop = this._impl()
        return pop.show.apply(pop, arguments)
    },
    close: function () {
        let pop = this._impl()
        return pop.close.apply(pop, arguments)
    },
    setMsgBoxFixed: function (fixed: boolean) {
        if (popMessage) {
            popMessage.msgbox[0].style.position = fixed ? 'fixed' : ''
        } else {
            util_log('MockMessageBox', 'setMsgBoxFixed', fixed)
        }
    },
    showOnNetError: function (e: any) {
        if (e.readyState === 0) {
            this.show(unsafeWindow.$('.balh_settings'), '哎呀，服务器连不上了，进入设置窗口，换个服务器试试？', 0, 'button', unsafeWindow.bangumi_area_limit_hack.showSettings);
        }
    },
    showOnNetErrorInPromise: function () {
        return (p: any) => p
            .catch((e: any) => {
                this.showOnNetError(e)
                return Promise.reject(e)
            })
    }
}
