
declare global {
    interface Window {
        $: any
        $$: any
    }
    interface Promise<T> {
        compose: any
    }
}
export { }