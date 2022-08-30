import { BOOL } from "../feature/r";
import { util_error } from "./log";


/** @see https://github.com/yujincheng08/BiliRoaming/blob/f689b138da7ac45d2591d375f19698c969844324/app/src/main/res/values/strings.xml#L112-L131 */
export const uposMap = {
    ali: 'upos-sz-mirrorali.bilivideo.com',
    alib: 'upos-sz-mirroralib.bilivideo.com',
    ks3: 'upos-sz-mirrorks3.bilivideo.com',
    ks3b: 'upos-sz-mirrorks3b.bilivideo.com',
    ks3c: 'upos-sz-mirrorks3c.bilivideo.com',
    ks32: 'upos-sz-mirrorks32.bilivideo.com',
    kodo: 'upos-sz-mirrorkodo.bilivideo.com',
    kodob: 'upos-sz-mirrorkodob.bilivideo.com',
    cos: 'upos-sz-mirrorcos.bilivideo.com',
    cosb: 'upos-sz-mirrorcosb.bilivideo.com',
    bos: 'upos-sz-mirrorbos.bilivideo.com',
    wcs: 'upos-sz-mirrorwcs.bilivideo.com',
    wcsb: 'upos-sz-mirrorwcsb.bilivideo.com',
    /** 不限CROS, 限制UA */
    hw: 'upos-sz-mirrorhw.bilivideo.com',
    hwb: 'upos-sz-mirrorhwb.bilivideo.com',
    upbda2: 'upos-sz-upcdnbda2.bilivideo.com',
    upws: 'upos-sz-upcdnws.bilivideo.com',
    uptx: 'upos-sz-upcdntx.bilivideo.com',
    uphw: 'upos-sz-upcdnhw.bilivideo.com',
    js: 'upos-tf-all-js.bilivideo.com',
    hk: 'cn-hk-eq-bcache-01.bilivideo.com',
    akamai: 'upos-hz-mirrorakam.akamaized.net',
}

export namespace Converters {
    // https://greasyfork.org/zh-CN/scripts/398535-bv2av/code
    const table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF';
    const tr: StringAnyObject = {};
    for (var i = 0; i < 58; ++i) {
        tr[table[i]] = i;
    }

    const s = [11, 10, 3, 8, 4, 6];
    const xor = 177451812;
    const add = 8728348608;

    export function bv2aid(bv: string) {
        let r = 0;
        for (let i = 0; i < 6; ++i) {
            r += tr[bv[s[i]]] * (58 ** i);
        }
        return String((r - add) ^ xor);
    }
    export function aid2bv(x: number) {
        x = (x ^ xor) + add
        const r = Array.from('BV1  4 1 7  ')
        for (let i = 0; i < 6; i++) {
            r[s[i]] = table[Math.trunc(x / (58 ** i)) % 58]
        }
        return r.join('')
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

    /**
     * 直接替换host大多数时候似乎不行, 即使可以视频的分辨率也很低, 原因未知
     * @param replaceAkamai 详见:`BalhConfig.upos_replace_akamai`
     */
    export function replaceUpos<T>(data: T, host: string = uposMap.uptx, replaceAkamai: BOOL) {
        var str = JSON.stringify(data);
        if (!str.includes("akamaized.net") || replaceAkamai) {
            str = str.replace(/:\\?\/\\?\/[^\/]+\\?\//g, `://${host}/`);
        }
        return JSON.parse(str)
    }
}
