import { util_error } from "./log";

export namespace Converters {
    // https://greasyfork.org/zh-CN/scripts/398535-bv2av/code
    export function bv2aid(bv: string) {
        var table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF';
        var tr: StringAnyObject = {};
        for (var i = 0; i < 58; ++i) {
            tr[table[i]] = i;
        }

        var s = [11, 10, 3, 8, 4, 6];
        var xor = 177451812;
        var add = 8728348608;

        var r = 0;
        for (var i = 0; i < 6; ++i) {
            r += tr[bv[s[i]]] * (Math.pow(58, i));
        }
        return String((r - add) ^ xor);
    }

    export function xml2obj(xml: Element) {
        try {
            var obj: any = {}, text;
            var children = xml.children;
            if (children.length > 0) {
                for (var i = 0; i < children.length; i++) {
                    var item = children.item(i)!;
                    var nodeName = item.nodeName;

                    if (typeof (obj[nodeName]) == "undefined") { // 若是新的属性, 则往obj中添加
                        obj[nodeName] = xml2obj(item);
                    } else {
                        if (typeof (obj[nodeName].push) == "undefined") { // 若老的属性没有push方法, 则把属性改成Array
                            var old = obj[nodeName];

                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(xml2obj(item));
                    }
                }
            } else {
                text = xml.textContent!; // todo: 强转为非空是否有问题?
                if (/^\d+(\.\d+)?$/.test(text)) {
                    obj = Number(text);
                } else if (text === 'true' || text === 'false') {
                    obj = Boolean(text);
                } else {
                    obj = text;
                }
            }
            return obj;
        } catch (e) {
            util_error(e);
        }
    }

    export function generateSign(params: StringStringObject, key: string) {
        let s_keys = [];
        for (let i in params) {
            s_keys.push(i);
        }
        s_keys.sort();
        let data = "";
        for (let i = 0; i < s_keys.length; i++) {
            // encodeURIComponent 返回的转义数字必须为大写( 如 %2F )
            data += (data ? "&" : "") + s_keys[i] + "=" + encodeURIComponent(params[s_keys[i]]);
        }
        return {
            sign: hex_md5(data + key),
            params: data,
        };
    }

    /** 直接替换host大多数时候似乎不行, 即使可以视频的分辨率也很低, 原因未知 */
    export function replaceUpos<T>(data: T, host: string = 'upos-sz-upcdntx.bilivideo.com') {
        const str = JSON.stringify(data)
        return JSON.parse(str.replace(/:\/\/[^/]+\//g, `://${host}/`))
    }
}