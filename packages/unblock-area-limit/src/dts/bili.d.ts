
/** @see {@link import('../util/message')} */
interface BiliMessageBox {
    show: (referenceElement: Element, message: string, closeTime: number, boxType?: string, buttonTypeConfirmCallback?: Function) => void
    close: () => void
    [k: string]: any
}