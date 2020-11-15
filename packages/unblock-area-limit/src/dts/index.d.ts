import { StringAnyObject } from "../util/types";

declare global {
    interface Window {
        $: any
        __INITIAL_STATE__?: StringAnyObject
        __playinfo__?: StringAnyObject
        __playinfo__origin?: StringAnyObject
    }
    interface Promise<T> {
        compose: any
    }
}
export { }