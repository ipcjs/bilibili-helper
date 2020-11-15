import { StringAnyObject } from "../util/types";

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
    }
    interface Promise<T> {
        compose: any
    }
}
export { }