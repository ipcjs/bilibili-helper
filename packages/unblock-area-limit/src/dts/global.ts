interface BalhInterface {
    [k: string]: any
    showSettings: () => void
    /** 安装设置按钮 */
    _setupSettings: () => void
}

declare global {
    interface Window {
        $: any
        /** 老的页面服务端渲染使用的初始数据 */
        __INITIAL_STATE__?: StringAnyObject
        /** 新的页面服务端渲染使用的数据 */
        __NEXT_DATA__?: StringAnyObject
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
        __segment_base_map__?: SegmentBaseMapObject
    }
    interface Promise<T> {
        compose: any
    }
}
export { }