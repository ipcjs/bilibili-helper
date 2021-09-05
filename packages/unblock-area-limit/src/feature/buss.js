import {bussJson} from './bussData'

export default () => {


    const modifyResponse = function (response)  {


        if (this.readyState === 4) {
            //修改请求结果
            if(this.requestURL.indexOf('api.bilibili.com/x/space/acc/info?mid=11783021') !== -1){

                const original_response = response.target.responseText;
                if(original_response){
                    const origin = JSON.parse(original_response)

                    if(origin.code === -404){

                        Object.defineProperty(this, "responseText", {writable: true});

                        this.responseText = JSON.stringify(bussJson);
                    }
                }

            }
        }



    }

    //修改原生XMLRequest对象中的一些方法

    const openPyBass = (original) => {

        return function (method, url, async) {
            // 保存请求相关参数
            this.requestMethod = method;
            this.requestURL = url;

            this.addEventListener("readystatechange", modifyResponse);

            return original.apply(this, arguments);

        }

    }

    const sendBypass = (original) => {
        return function (data) {
            this.requestData = data;
            return original.apply(this, arguments);
        }
    }

    (function (window){
        window.XMLHttpRequest.prototype.open = openPyBass(window.XMLHttpRequest.prototype.open);
        window.XMLHttpRequest.prototype.send = sendBypass(window.XMLHttpRequest.prototype.send);
    })(unsafeWindow)


}