import { StringAnyObject as StringAnyObject, StringStringObject } from "./types";

function getCookies(): StringStringObject {
    var map = document.cookie.split('; ').reduce(function (obj: any, item) {
        var entry = item.split('=');
        obj[entry[0]] = entry[1];
        return obj;
    }, {});
    return map;
}

function getCookie(key: string) {
    return getCookies()[key];
}

/**
 * @param key     key
 * @param value   为undefined时, 表示删除cookie
 * @param options 为undefined时, 表示过期时间为3年
 *          为''时, 表示Session cookie
 *          为数字时, 表示指定过期时间
 *          为{}时, 表示指定所有的属性
 * */
function setCookie(key: string, value?: string, options?: string | number | object) {
    if (typeof options !== 'object') {
        options = {
            domain: '.bilibili.com',
            path: '/',
            'max-age': value === undefined ? 0 : (options === undefined ? 94608000 : options)
        };
    }

    var c = Object.keys(options).reduce(function (str, key) {
        return str + '; ' + key + '=' + (options as any)[key];
    }, key + '=' + value);
    document.cookie = c;
    return c;
}

const target = {
    set: setCookie,
    get: getCookie,
    all: getCookies,
}
/**
 * 模仿localStorage
 */
export const cookieStorage: (typeof target) & StringAnyObject = new Proxy(
    target,
    {
        get: function (target, prop) {
            if (prop in target) return (target as any)[prop]
            if (typeof prop !== 'string') throw new TypeError(`unsupported prop=${String(prop)}`)
            return getCookie(prop)
        },
        set: function (target, prop, value) {
            if (typeof prop !== 'string') return false
            setCookie(prop, value)
            return true
        }
    },
)
