import { balh_config } from "../feature/config"

export const access_key_param_if_exist = function (isKghost = false) {
    // access_key是由B站验证的, B站帐号和BP帐号不同时, access_key无效
    // kghost的服务器使用的B站帐号, access_key有效
    return (localStorage.access_key && (!balh_config.blocked_vip || isKghost)) ? `&access_key=${localStorage.access_key}` : ''
}