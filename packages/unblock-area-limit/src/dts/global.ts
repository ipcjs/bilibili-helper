interface BalhInterface {
    showSettings: () => void
}

declare global {
    interface Window {
        $: any
        __INITIAL_STATE__?: StringAnyObject
        __playinfo__?: StringAnyObject
        __playinfo__origin?: StringAnyObject
        bangumi_area_limit_hack: BalhInterface
        GrayManager?: StringAnyObject
        __balh_app_only__?: boolean
        balh_auth_window?: Window
        MessageBox?: {
            new(): BiliMessageBox
            prototype: BiliMessageBox
        }
        __segment_base_map__?: { [k: string]: [initialization: string, indexRange: string] }
    }
    interface Promise<T> {
        compose: any
    }
}
export { }