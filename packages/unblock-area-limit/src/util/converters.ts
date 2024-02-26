import { BOOL } from "../feature/r";
import { util_error } from "./log";


/** @see https://github.com/yujincheng08/BiliRoaming/blob/f689b138da7ac45d2591d375f19698c969844324/app/src/main/res/values/strings.xml#L112-L131 */
const rawUposMap = {
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

export const uposMap: Record<string, string | undefined> & typeof rawUposMap = rawUposMap

export namespace Converters {
    // https://socialsisteryi.github.io/bilibili-API-collect/docs/misc/bvid_desc.html#javascript-typescript
    const XOR_CODE = 23442827791579n;
    const MASK_CODE = 2251799813685247n;
    const MAX_AID = 1n << 51n;
    const BASE = 58n;

    const data = 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf';

    export function bv2aid(bvid: string) {
        const bvidArr = Array.from(bvid);
        [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
        [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
        bvidArr.splice(0, 3);
        const tmp = bvidArr.reduce((pre, bvidChar) => pre * BASE + BigInt(data.indexOf(bvidChar)), 0n);
        return String((tmp & MASK_CODE) ^ XOR_CODE);
    }

    export function aid2bv(aid: number) {
        const bytes = ['B', 'V', '1', '0', '0', '0', '0', '0', '0', '0', '0', '0'];
        let bvIndex = bytes.length - 1;
        let tmp = (MAX_AID | BigInt(aid)) ^ XOR_CODE;
        while (tmp > 0) {
            bytes[bvIndex] = data[Number(tmp % BigInt(BASE))];
            tmp = tmp / BASE;
            bvIndex -= 1;
        }
        [bytes[3], bytes[9]] = [bytes[9], bytes[3]];
        [bytes[4], bytes[7]] = [bytes[7], bytes[4]];
        return bytes.join('')
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
            if (i != '')
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
