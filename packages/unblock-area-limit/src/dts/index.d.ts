import { StringObject } from "../util/types";

declare global {
    interface Window {
        $: any
        __INITIAL_STATE__?: StringObject
    }
    interface Promise<T> {
        compose: any
    }
}
export { }