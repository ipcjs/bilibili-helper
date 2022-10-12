// ==UserScript==
// @name         多邻国助手
// @namespace    https://github.com/ipcjs
// @version      0.0.1
// @description  启用时会强制切换为老版课程
// @author       ipcjs
// @supportURL   https://github.com/ipcjs/bilibili-helper
// @compatible   chrome
// @compatible   firefox
// @license      MIT
// @match        https://www.duolingo.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/// 注入Xhr
///
/// [transformRequest]:
/// {@macro xhr_transform_request}
///
/// [transformResponse]:
/// {@macro xhr_transform_response}
function injectXhrImpl({ transformRequest, transformResponse }) {
    let firstCreateXHR = true
    window.XMLHttpRequest = new Proxy(window.XMLHttpRequest, {
        construct: function (target, args) {
            // 第一次创建XHR时, 打上断点...
            if (firstCreateXHR && false) {
                firstCreateXHR = false
                // debugger
            }
            let container = {} // 用来替换responseText等变量
            const dispatchResultTransformer = p => {
                let event = {} // 伪装的event
                return p
                    .then(r => {
                        container.readyState = 4
                        container.response = r
                        container.responseText = typeof r === 'string' ? r : JSON.stringify(r)
                        container.__onreadystatechange(event) // 直接调用会不会存在this指向错误的问题? => 目前没看到, 先这样(;¬_¬)
                    })
                    .catch(e => {
                        // 失败时, 让原始的response可以交付
                        container.__block_response = false
                        if (container.__response != null) {
                            container.readyState = 4
                            container.response = container.__response
                            container.__onreadystatechange(event) // 同上
                        }
                    })
            }
            const dispatchResultTransformerCreator = () => {
                container.__block_response = true
                return dispatchResultTransformer
            }
            return new Proxy(new target(...args), {
                set: function (target, prop, value, receiver) {
                    if (prop === 'onreadystatechange') {
                        container.__onreadystatechange = value
                        let cb = value
                        value = function (event) {
                            if (target.readyState === 4) {
                                /// {@macro xhr_transform_response}
                                target.responseType
                                const response = transformResponse({
                                    url: target.responseURL,
                                    response: target.response,
                                    xhr: target,
                                    container,
                                })
                                if (response != null) {
                                    if (typeof response === 'object' && response instanceof Promise) {
                                        // 异步转换
                                        response.compose(dispatchResultTransformerCreator())
                                    } else {
                                        // 同步转换
                                        container.response = response
                                        container.responseText = typeof response === 'string' ? response : JSON.stringify(response)
                                    }
                                } else {
                                    // 不转换
                                }
                                if (container.__block_response) {
                                    // 屏蔽并保存response
                                    container.__response = target.response
                                    return
                                }
                            }
                            // 这里的this是原始的xhr, 在container.responseText设置了值时需要替换成代理对象
                            cb.apply(container.responseText ? receiver : this, arguments)
                        }
                    }
                    target[prop] = value
                    return true
                },
                get: function (target, prop, receiver) {
                    if (prop in container) return container[prop]
                    let value = target[prop]
                    if (typeof value === 'function') {
                        let func = value
                        // open等方法, 必须在原始的xhr对象上才能调用...
                        value = function () {
                            if (prop === 'open') {
                                container.__method = arguments[0]
                                container.__url = arguments[1]
                            } else if (prop === 'send') {
                                /// {@macro xhr_transform_request}
                                const promise = transformRequest({
                                    url: container.__url,
                                    container,
                                })
                                if (promise != null) {
                                    promise.compose(dispatchResultTransformerCreator())
                                }
                            }
                            return func.apply(target, arguments)
                        }
                    }
                    return value
                }
            })
        }
    })
}
const log = console.log.bind(console)
injectXhrImpl({
    transformRequest: () => null,
    transformResponse: ({ url, response }) => {
        const uri = new URL(url)
        if (uri.pathname.match(/\/[\d-]+\/users\/\d+/)) {
            if (response?.currentCourse) {
                debugger
                // 只要替换path就会出现新的界面
                // response.currentCourse.path = newJPCourse.path
                // 清空path就是老的界面
                response.currentCourse.path = []

                return response
            }
        } else if (uri.pathname.match(/\/[\d-]+\/config/)) {
            if (response?.featureFlags) {
                // 没啥效果...
                response.featureFlags.china_compliance_control = false
                response.featureFlags.disable_avatars_cn = false
                response.featureFlags.disable_ugc_cn = false
            }
            return response
        }
        return null
    },
})
const newJPCourse = {
    "authorId": "duolingo",
    "checkpointTests": [],
    "crowns": 0,
    "extraCrowns": 0,
    "finalCheckpointSession": "NONE",
    "fluency": null,
    "fromLanguage": "zh",
    "id": "DUOLINGO_JA_ZH-CN",
    "inLessonAvatars": [],
    "learningLanguage": "ja",
    "managedInHouse": true,
    "numberOfSentences": 9375,
    "numberOfWords": 3571,
    "path": [
        {
            "unitIndex": 0,
            "levels": [
                {
                    "id": "f243b3d67224b8ad5946c2b31f1e78af",
                    "state": "active",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f5bef73815a99b164424898208e0d935",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "f5bef73815a99b164424898208e0d935",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "使用简单的数字和颜色"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d7b4b49a22e636ad28ad89a87d89620a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "87800fbc22fb152f3c52de18fda787f1",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "87800fbc22fb152f3c52de18fda787f1",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "认识简单的动词和形容词"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ea59c78329cb610eca264eb635b1dd8b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "87800fbc22fb152f3c52de18fda787f1",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 1",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "9614a6d07f16b158dd35adf1df4c3335",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f5bef73815a99b164424898208e0d935",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "f5bef73815a99b164424898208e0d935",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "使用简单的数字和颜色"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "44d4bd0b259b72d7317f30664082fd4d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "87800fbc22fb152f3c52de18fda787f1",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f5bef73815a99b164424898208e0d935",
                            "87800fbc22fb152f3c52de18fda787f1",
                            "f5bef73815a99b164424898208e0d935"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 0",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/735755e44dfc49bef876fc0002a3206a18642f5c81ce162e4a5823ebb875a3acfef31901a1ead38272dc8c6adacfabb77c4767b1a7fb5fcbe5faf4b5138276b7/2.json"
            },
            "teachingObjective": "使用简单的数字和颜色",
            "cefrLevel": null
        },
        {
            "unitIndex": 1,
            "levels": [
                {
                    "id": "60e4167dc0e433ebf6fe279a75bf5a83",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 1
                    },
                    "pathLevelClientData": {
                        "unitIndex": 1,
                        "skillIds": [
                            "f5bef73815a99b164424898208e0d935",
                            "87800fbc22fb152f3c52de18fda787f1",
                            "f5bef73815a99b164424898208e0d935"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "平假名 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4999d40b8efba7166a270d9b18a5428b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "87800fbc22fb152f3c52de18fda787f1",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "87800fbc22fb152f3c52de18fda787f1",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "认识简单的动词和形容词"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f6667fb41e862a756c11070f9825a84e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b19a477b4690f5ccf98ee32d3e318ba0",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 2",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "6c1b64b3b7cd99b0197354fd313d5f00",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b19a477b4690f5ccf98ee32d3e318ba0",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f5bef73815a99b164424898208e0d935",
                            "87800fbc22fb152f3c52de18fda787f1",
                            "b19a477b4690f5ccf98ee32d3e318ba0"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 1",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a905296d7b21e17ef50d6a2713e0e81e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f5bef73815a99b164424898208e0d935",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "f5bef73815a99b164424898208e0d935",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "使用简单的数字和颜色"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3e33bacf2adfe92e3f4e4dd7a5fda4f5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "认识包含浊音的单词"
                    },
                    "totalSessions": 8,
                    "debugName": "平假名 4",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6f2e014fa7f29116292f60994832185f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b19a477b4690f5ccf98ee32d3e318ba0",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "b19a477b4690f5ccf98ee32d3e318ba0",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "使用简单的名词"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c4e91f92481858591c99424deb48cfd9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 3",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "596cc17488b90912662738bad117708d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "87800fbc22fb152f3c52de18fda787f1",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "87800fbc22fb152f3c52de18fda787f1",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "认识简单的动词和形容词"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2c6a02bdc1a0a5127ee6adc4f8913c65",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "87800fbc22fb152f3c52de18fda787f1",
                            "f5bef73815a99b164424898208e0d935",
                            "5a7f8be86104ccc6137aeeeeffea48cc",
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "87800fbc22fb152f3c52de18fda787f1"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 1",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/eee5d2d3127074f93c62c9986a9aa8d3ea64968e4ea27d26eaa6a58d2eada00f6f4556f3ed6e9a549dc652486c542834b9ad367fa9a5f4d7d629adaa62a0be30/2.json"
            },
            "teachingObjective": "使用简单的名词",
            "cefrLevel": null
        },
        {
            "unitIndex": 2,
            "levels": [
                {
                    "id": "b86f4ab3f4203ad2bcee0c0d49e91185",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 2
                    },
                    "pathLevelClientData": {
                        "unitIndex": 2,
                        "skillIds": [
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "87800fbc22fb152f3c52de18fda787f1",
                            "f5bef73815a99b164424898208e0d935",
                            "5a7f8be86104ccc6137aeeeeffea48cc",
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "87800fbc22fb152f3c52de18fda787f1"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 3,
                    "debugName": "问候",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ad2e94af220cc3200e14ee4c63952e11",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4beaf72025b23440a4577d714ab8ac88",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f5bef73815a99b164424898208e0d935",
                            "5a7f8be86104ccc6137aeeeeffea48cc",
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "87800fbc22fb152f3c52de18fda787f1",
                            "4beaf72025b23440a4577d714ab8ac88"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 6,
                    "debugName": "Practice Level 2",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f714308be9131df431218e491323cf3c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4beaf72025b23440a4577d714ab8ac88",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 4",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "f6864c4a9a73a2cb505c298399d22931",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "认识包含浊音的单词"
                    },
                    "totalSessions": 8,
                    "debugName": "平假名 4",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ce89e56de30f9fdb46a38695e3a5f97d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b19a477b4690f5ccf98ee32d3e318ba0",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "b19a477b4690f5ccf98ee32d3e318ba0",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "使用简单的名词"
                    },
                    "totalSessions": 6,
                    "debugName": "平假名 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1f41f34bfc4f64fa8bf843b2a4ea88b2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "介绍自己"
                    },
                    "totalSessions": 5,
                    "debugName": "介绍",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "44be4988d685a7e916a852da9b59dacb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4beaf72025b23440a4577d714ab8ac88",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "4beaf72025b23440a4577d714ab8ac88",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "与人打招呼"
                    },
                    "totalSessions": 3,
                    "debugName": "问候",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1971272ea0d395394b8e92ec92ca6b90",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 5",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "84f2d9433cff06e16f14c713fde13077",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "5a7f8be86104ccc6137aeeeeffea48cc",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "认识包含浊音的单词"
                    },
                    "totalSessions": 8,
                    "debugName": "平假名 4",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "56aa931e9efea2681a17c2582ef7c9f4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5a7f8be86104ccc6137aeeeeffea48cc",
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "399d6216ef8c713334baa4a927e8b9c7",
                            "4beaf72025b23440a4577d714ab8ac88"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 3",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a02cf78329a96b1bd3cce0791c89b2d2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4beaf72025b23440a4577d714ab8ac88",
                            "5a7f8be86104ccc6137aeeeeffea48cc",
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "399d6216ef8c713334baa4a927e8b9c7",
                            "4beaf72025b23440a4577d714ab8ac88",
                            "5a7f8be86104ccc6137aeeeeffea48cc"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 2",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/6c676ec4eaaca4f61aae76a3fbf1305b2ef7d7892515dac0e625b42f01fd9a9c98e6c20f73a4ec81dbfb3849a8a8d2e97ca66b55e51722e920956a93821c319b/1.json"
            },
            "teachingObjective": "与人打招呼",
            "cefrLevel": null
        },
        {
            "unitIndex": 3,
            "levels": [
                {
                    "id": "3af83a2621bfa11a124689df5184d206",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 3
                    },
                    "pathLevelClientData": {
                        "unitIndex": 3,
                        "skillIds": [
                            "4beaf72025b23440a4577d714ab8ac88",
                            "5a7f8be86104ccc6137aeeeeffea48cc",
                            "b19a477b4690f5ccf98ee32d3e318ba0",
                            "399d6216ef8c713334baa4a927e8b9c7",
                            "4beaf72025b23440a4577d714ab8ac88",
                            "5a7f8be86104ccc6137aeeeeffea48cc"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "人",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b2d544112c957705743f943a77110474",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "介绍自己"
                    },
                    "totalSessions": 5,
                    "debugName": "介绍",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "84a25fac2594692ef3125e3283cfe7d3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "63ea85e7abdccf7835312a06b2f61273",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 6",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "e0f0ba6608725d8f08d17f709772e65c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4beaf72025b23440a4577d714ab8ac88",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "4beaf72025b23440a4577d714ab8ac88",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "与人打招呼"
                    },
                    "totalSessions": 3,
                    "debugName": "问候",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c3cc8bf8f5f06e5e79ab4b45f518804b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讲述语言兴趣与爱好"
                    },
                    "totalSessions": 5,
                    "debugName": "兴趣爱好",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6fd7981ca426284bde2a5e1698f72914",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "63ea85e7abdccf7835312a06b2f61273",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "63ea85e7abdccf7835312a06b2f61273",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述国籍和身份"
                    },
                    "totalSessions": 5,
                    "debugName": "人",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6ced46ba639bc113d0458126f5bbdc30",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "63ea85e7abdccf7835312a06b2f61273",
                            "399d6216ef8c713334baa4a927e8b9c7",
                            "4beaf72025b23440a4577d714ab8ac88",
                            "58db4bbe66e21e6e5fd4221cf34a193f"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 4",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5f8d2881207d42ea5917d0072ad37a83",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 7",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "fbe0d3fe0feff687175952f6cd266786",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "399d6216ef8c713334baa4a927e8b9c7",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "介绍自己"
                    },
                    "totalSessions": 5,
                    "debugName": "介绍",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8caef74da8787ad0541bc181c76ae299",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 3
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "63ea85e7abdccf7835312a06b2f61273",
                            "399d6216ef8c713334baa4a927e8b9c7",
                            "4beaf72025b23440a4577d714ab8ac88",
                            "58db4bbe66e21e6e5fd4221cf34a193f",
                            "63ea85e7abdccf7835312a06b2f61273",
                            "399d6216ef8c713334baa4a927e8b9c7"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 3",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/3125142295248584b56d010d27df91d23e17d98d8f5d5ad1e95b3ead3f9382620ab50df37667228037e2366b58288f8af503587b2b39a473f3c221837bd7953f/2.json"
            },
            "teachingObjective": "描述国籍和身份",
            "cefrLevel": null
        },
        {
            "unitIndex": 4,
            "levels": [
                {
                    "id": "d325ec75b466911d64b34672654ad8ca",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 4
                    },
                    "pathLevelClientData": {
                        "unitIndex": 4,
                        "skillIds": [
                            "63ea85e7abdccf7835312a06b2f61273",
                            "399d6216ef8c713334baa4a927e8b9c7",
                            "4beaf72025b23440a4577d714ab8ac88",
                            "58db4bbe66e21e6e5fd4221cf34a193f",
                            "63ea85e7abdccf7835312a06b2f61273",
                            "399d6216ef8c713334baa4a927e8b9c7"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "饮食",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "990053cc9f2b9c9a520aba577a9e8476",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讲述语言兴趣与爱好"
                    },
                    "totalSessions": 5,
                    "debugName": "兴趣爱好",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "013cd5327321365d3cc308d72d8d9716",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "63ea85e7abdccf7835312a06b2f61273",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "63ea85e7abdccf7835312a06b2f61273",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述国籍和身份"
                    },
                    "totalSessions": 5,
                    "debugName": "人",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "88f7970ed70bf81791a269d5b70675fc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5474891216c4be85c701c9f69932dd27",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 8",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "f93828424a1256500bbc8f2bfa25a472",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "学习数字及时间的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "时间",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ce9ed193d880ed86c1082cee6b06030c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "399d6216ef8c713334baa4a927e8b9c7",
                            "5474891216c4be85c701c9f69932dd27",
                            "58db4bbe66e21e6e5fd4221cf34a193f",
                            "63ea85e7abdccf7835312a06b2f61273",
                            "c137d9b82a68a921b35e70247b1bfdac"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 6,
                    "debugName": "Practice Level 5",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "1b68d8693d4fdcf85d7ee75a1429d5dd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 9",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "fb844c064b4ce30a4f067ed11e586d68",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5474891216c4be85c701c9f69932dd27",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "5474891216c4be85c701c9f69932dd27",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "询问饮食相关问题"
                    },
                    "totalSessions": 5,
                    "debugName": "饮食",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "31e79e07139f7a766cc6781f1f7f02e8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "58db4bbe66e21e6e5fd4221cf34a193f",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讲述语言兴趣与爱好"
                    },
                    "totalSessions": 5,
                    "debugName": "兴趣爱好",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "af9d6c5c646bcef36e56ac82eed8a0f1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 4
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5474891216c4be85c701c9f69932dd27",
                            "58db4bbe66e21e6e5fd4221cf34a193f",
                            "63ea85e7abdccf7835312a06b2f61273",
                            "c137d9b82a68a921b35e70247b1bfdac",
                            "5474891216c4be85c701c9f69932dd27",
                            "58db4bbe66e21e6e5fd4221cf34a193f"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 4",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/752b26a5b23ee4797dc45704c9a4927af86ef734e7191ec90bf9e1678d78e73b9208f60e86a2f38b23eea526a7101c25eca785ac097080f7a2bc9f33e51e7c12/1.json"
            },
            "teachingObjective": "询问饮食相关问题",
            "cefrLevel": null
        },
        {
            "unitIndex": 5,
            "levels": [
                {
                    "id": "2a0950ea0c2287891a4d55d8ba0bb8b0",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 5
                    },
                    "pathLevelClientData": {
                        "unitIndex": 5,
                        "skillIds": [
                            "5474891216c4be85c701c9f69932dd27",
                            "58db4bbe66e21e6e5fd4221cf34a193f",
                            "63ea85e7abdccf7835312a06b2f61273",
                            "c137d9b82a68a921b35e70247b1bfdac",
                            "5474891216c4be85c701c9f69932dd27",
                            "58db4bbe66e21e6e5fd4221cf34a193f"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "时间 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8a0fcf15c39001ff8b80da3c0c9471ca",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "学习数字及时间的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "时间",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "cc719a9a227734e1b81f580b5850798c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "dd87cbf87ede0eae123270472f3d283c",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 10",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ecab09842427d23baeda6d8ffcfd3275",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5474891216c4be85c701c9f69932dd27",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "5474891216c4be85c701c9f69932dd27",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "询问饮食相关问题"
                    },
                    "totalSessions": 5,
                    "debugName": "饮食",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5d52e953371897f30fbab5ea9ff2ddb0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "dd87cbf87ede0eae123270472f3d283c",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5474891216c4be85c701c9f69932dd27",
                            "58db4bbe66e21e6e5fd4221cf34a193f",
                            "dd87cbf87ede0eae123270472f3d283c",
                            "c137d9b82a68a921b35e70247b1bfdac"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 6",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "83cb9b743d5c9d6b0a2b5bd8c43db51e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4286fcac171cf0dfdc6c978adca775de",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "4286fcac171cf0dfdc6c978adca775de",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "介绍居住环境"
                    },
                    "totalSessions": 5,
                    "debugName": "家居",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b9f2cad09a602fde00e4257089ea0b64",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "dd87cbf87ede0eae123270472f3d283c",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "dd87cbf87ede0eae123270472f3d283c",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "结合使用时间与动词"
                    },
                    "totalSessions": 5,
                    "debugName": "时间 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "22a057889f164f1a58d92f555726505d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4286fcac171cf0dfdc6c978adca775de",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 11",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "4e1f97633d9d1933b28f5c590068ffb5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "c137d9b82a68a921b35e70247b1bfdac",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "学习数字及时间的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "时间",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a052249d3ab136800eac375b7765dd9e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4286fcac171cf0dfdc6c978adca775de",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 5
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "dd87cbf87ede0eae123270472f3d283c",
                            "c137d9b82a68a921b35e70247b1bfdac",
                            "5474891216c4be85c701c9f69932dd27",
                            "4286fcac171cf0dfdc6c978adca775de",
                            "dd87cbf87ede0eae123270472f3d283c",
                            "c137d9b82a68a921b35e70247b1bfdac"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 5",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/2ced1e47e9635f9b1317251abd2f7a8575ceee4345d4137e23d7ededaa5121e5d81f062a446ac115804fa63c263dbdf6bf88cf4250128bcab3e77eb88c8d30dc/2.json"
            },
            "teachingObjective": "结合使用时间与动词",
            "cefrLevel": null
        },
        {
            "unitIndex": 6,
            "levels": [
                {
                    "id": "ff6ad2a608ab48a8345f16162514b99c",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 6
                    },
                    "pathLevelClientData": {
                        "unitIndex": 6,
                        "skillIds": [
                            "dd87cbf87ede0eae123270472f3d283c",
                            "c137d9b82a68a921b35e70247b1bfdac",
                            "5474891216c4be85c701c9f69932dd27",
                            "4286fcac171cf0dfdc6c978adca775de",
                            "dd87cbf87ede0eae123270472f3d283c",
                            "c137d9b82a68a921b35e70247b1bfdac"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "介绍 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d794e23b7068056fe30aa8d3218a2bbc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "72fdd587d09497003952e9b5e8654959",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4286fcac171cf0dfdc6c978adca775de",
                            "dd87cbf87ede0eae123270472f3d283c",
                            "c137d9b82a68a921b35e70247b1bfdac",
                            "72fdd587d09497003952e9b5e8654959"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 7",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e88f9bdd6b9792a63864de39710503ca",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4286fcac171cf0dfdc6c978adca775de",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "4286fcac171cf0dfdc6c978adca775de",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "介绍居住环境"
                    },
                    "totalSessions": 5,
                    "debugName": "家居",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3c4c1801389a4ed01dd6e61ed5cfab8f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "72fdd587d09497003952e9b5e8654959",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 12",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "27d2503dfdacdbc7f451205f963d98b8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "dd87cbf87ede0eae123270472f3d283c",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "dd87cbf87ede0eae123270472f3d283c",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "结合使用时间与动词"
                    },
                    "totalSessions": 5,
                    "debugName": "时间 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "497a063a886cc5fd9bb6ff91f799ac56",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "39f8a11f97de655329ab0034b6b62eeb",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "39f8a11f97de655329ab0034b6b62eeb",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "介绍自己的家人"
                    },
                    "totalSessions": 5,
                    "debugName": "家庭",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3bbc7301c59ed143dc2d1ce0af88f392",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "39f8a11f97de655329ab0034b6b62eeb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 13",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "dc9c721a3eae1b4bb3076407b842936a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "72fdd587d09497003952e9b5e8654959",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "72fdd587d09497003952e9b5e8654959",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述别人"
                    },
                    "totalSessions": 5,
                    "debugName": "介绍 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "28b217dc7fa28df75f80c59fa7526613",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "39f8a11f97de655329ab0034b6b62eeb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4286fcac171cf0dfdc6c978adca775de",
                            "dd87cbf87ede0eae123270472f3d283c",
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "72fdd587d09497003952e9b5e8654959"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 8",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7ecf31a627b78887e5d8b7a5d51f46ac",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "39f8a11f97de655329ab0034b6b62eeb",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 6
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "72fdd587d09497003952e9b5e8654959",
                            "4286fcac171cf0dfdc6c978adca775de",
                            "dd87cbf87ede0eae123270472f3d283c",
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "72fdd587d09497003952e9b5e8654959"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 6",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/14fa3dbd25cbab7a27d105958a3937281aed5a1dbae97b4f03cc52d118a7d7a5493d38d3109cd18949392b74eea1b10d082fb41bb2ff1ae64ae45da8368eba92/1.json"
            },
            "teachingObjective": "描述别人",
            "cefrLevel": null
        },
        {
            "unitIndex": 7,
            "levels": [
                {
                    "id": "ef59cbf75fb6c87b665a988faf8d822c",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 7
                    },
                    "pathLevelClientData": {
                        "unitIndex": 7,
                        "skillIds": [
                            "72fdd587d09497003952e9b5e8654959",
                            "4286fcac171cf0dfdc6c978adca775de",
                            "dd87cbf87ede0eae123270472f3d283c",
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "72fdd587d09497003952e9b5e8654959"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "家居",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "eeeb605c94c0f3306f29aed565288b5b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论学校环境"
                    },
                    "totalSessions": 5,
                    "debugName": "学校",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e96bf47ae8a3e187ed57a8e83150ee6d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 14",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "26e8732fae90d6fb04de82958532c70b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "39f8a11f97de655329ab0034b6b62eeb",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "39f8a11f97de655329ab0034b6b62eeb",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "介绍自己的家人"
                    },
                    "totalSessions": 5,
                    "debugName": "家庭",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "bfd4371599ae55bd99ed530c935426bf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "72fdd587d09497003952e9b5e8654959",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "72fdd587d09497003952e9b5e8654959",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述别人"
                    },
                    "totalSessions": 5,
                    "debugName": "介绍 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "0767b024627a697fa82347ed49a78207",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4286fcac171cf0dfdc6c978adca775de",
                            "bc8dc370ca93bfe2851c54989077e6fb",
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "72fdd587d09497003952e9b5e8654959"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 9",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "bef25bef5c9c5079b21d7fe51e7ce98b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "fd89922945557c61020632e2a335db19",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "fd89922945557c61020632e2a335db19",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论菜品的价格"
                    },
                    "totalSessions": 5,
                    "debugName": "餐馆",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4c616a780b7b4e45b17a515ae2cc3197",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "fd89922945557c61020632e2a335db19",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 15",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "95db1149c386c476c870ef2fb5c63621",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论学校环境"
                    },
                    "totalSessions": 5,
                    "debugName": "学校",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "60d14c429b0ea5468e0b7d917d0c37b4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "fd89922945557c61020632e2a335db19",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 7
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4286fcac171cf0dfdc6c978adca775de",
                            "bc8dc370ca93bfe2851c54989077e6fb",
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "72fdd587d09497003952e9b5e8654959",
                            "fd89922945557c61020632e2a335db19",
                            "bc8dc370ca93bfe2851c54989077e6fb"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 7",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/06e8cde15981559834c62f7751d0fe6492227a235626aae45a52503cd5b43aa1509653cf48b7f7a181d2a7bca24b5816c8885390953037c4ba42331cf8602a8d/1.json"
            },
            "teachingObjective": "谈论学校环境",
            "cefrLevel": null
        },
        {
            "unitIndex": 8,
            "levels": [
                {
                    "id": "21067b90c6919b1268ac6a8406f6c213",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 8
                    },
                    "pathLevelClientData": {
                        "unitIndex": 8,
                        "skillIds": [
                            "4286fcac171cf0dfdc6c978adca775de",
                            "bc8dc370ca93bfe2851c54989077e6fb",
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "72fdd587d09497003952e9b5e8654959",
                            "fd89922945557c61020632e2a335db19",
                            "bc8dc370ca93bfe2851c54989077e6fb"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "家庭",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "35e55d3a0f3684820b3604b18129e5d0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述家人"
                    },
                    "totalSessions": 5,
                    "debugName": "家庭 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "732ce465a381a5cb85e30053cd8d7228",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 16",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "a948622d4186728d8b4c5288228fc09a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "fd89922945557c61020632e2a335db19",
                            "bc8dc370ca93bfe2851c54989077e6fb",
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "bc657cf186c9f76908da9c1104ea2b78"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 10",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d60d0ab1fe47016978713a9e1ce1538e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "fd89922945557c61020632e2a335db19",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "fd89922945557c61020632e2a335db19",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论菜品的价格"
                    },
                    "totalSessions": 5,
                    "debugName": "餐馆",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "40c610eeb955be3f776a6531d10c3e37",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "bc8dc370ca93bfe2851c54989077e6fb",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论学校环境"
                    },
                    "totalSessions": 5,
                    "debugName": "学校",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4ec4350f637bca574728636ac7ab0edd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "967a34042c0d5ec37a9308188b26a683",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "967a34042c0d5ec37a9308188b26a683",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论过去发生的事情"
                    },
                    "totalSessions": 5,
                    "debugName": "活动",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "82dd6b0bda0639a7075b537632ddd269",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "967a34042c0d5ec37a9308188b26a683",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 17",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "626db6aad3cc145b8e5d3665812410b1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述家人"
                    },
                    "totalSessions": 5,
                    "debugName": "家庭 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6eb1eff3158675fd1a1f62d1d655a69b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "967a34042c0d5ec37a9308188b26a683",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "fd89922945557c61020632e2a335db19",
                            "bc8dc370ca93bfe2851c54989077e6fb",
                            "967a34042c0d5ec37a9308188b26a683",
                            "bc657cf186c9f76908da9c1104ea2b78"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 11",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "214d13ea30fbac05757e4422f12fb277",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "967a34042c0d5ec37a9308188b26a683",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 8
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "bc657cf186c9f76908da9c1104ea2b78",
                            "fd89922945557c61020632e2a335db19",
                            "bc8dc370ca93bfe2851c54989077e6fb",
                            "967a34042c0d5ec37a9308188b26a683",
                            "bc657cf186c9f76908da9c1104ea2b78"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 8",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/bc4f2e91ba3a589f48a9bc41b919c4bc902d5790562fd81282bd83cf2aa783fa73c64180e4b388b2c42f57020e6a13c266e8779d47a9b2bc81187c2d6b4b334d/1.json"
            },
            "teachingObjective": "描述家人",
            "cefrLevel": null
        },
        {
            "unitIndex": 9,
            "levels": [
                {
                    "id": "d68b7b9adde526fee17490ea0d38b124",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 9
                    },
                    "pathLevelClientData": {
                        "unitIndex": 9,
                        "skillIds": [
                            "39f8a11f97de655329ab0034b6b62eeb",
                            "bc657cf186c9f76908da9c1104ea2b78",
                            "fd89922945557c61020632e2a335db19",
                            "bc8dc370ca93bfe2851c54989077e6fb",
                            "967a34042c0d5ec37a9308188b26a683",
                            "bc657cf186c9f76908da9c1104ea2b78"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "餐馆",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "26a9693e3238a65cfd1fb1a4314aaf54",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "学习星期的表达"
                    },
                    "totalSessions": 5,
                    "debugName": "日程",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "180cafbd7534ec7c9d8f2c83971e2fc1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 18",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "c1bfdd961dc97fee34a0cf82cced54e3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "967a34042c0d5ec37a9308188b26a683",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "967a34042c0d5ec37a9308188b26a683",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论过去发生的事情"
                    },
                    "totalSessions": 5,
                    "debugName": "活动",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "691a8fdccb6d77913d3e577d38a8fb9b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "bc657cf186c9f76908da9c1104ea2b78",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述家人"
                    },
                    "totalSessions": 5,
                    "debugName": "家庭 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8299d2729bb72f0c4f75b152abc9166e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "fd89922945557c61020632e2a335db19",
                            "344e6f7b6b72c2acad5f5d8903bd0e66",
                            "967a34042c0d5ec37a9308188b26a683",
                            "bc657cf186c9f76908da9c1104ea2b78"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 12",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ff3bb6b7cb97e4c09b3f84ed9e282b8a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c5d0c47d96042e486c2cd5281b2eeca3",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "c5d0c47d96042e486c2cd5281b2eeca3",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "叙述位置"
                    },
                    "totalSessions": 5,
                    "debugName": "位置",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "20e6d9bc05d28f03f5442474b1a75ce7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c5d0c47d96042e486c2cd5281b2eeca3",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 19",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "c92f85433d03bec20ee334f970785e70",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "学习星期的表达"
                    },
                    "totalSessions": 5,
                    "debugName": "日程",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "be8e8ab4df8dc5578b941fba2c8d3ee7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c5d0c47d96042e486c2cd5281b2eeca3",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 9
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "fd89922945557c61020632e2a335db19",
                            "344e6f7b6b72c2acad5f5d8903bd0e66",
                            "967a34042c0d5ec37a9308188b26a683",
                            "bc657cf186c9f76908da9c1104ea2b78",
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "344e6f7b6b72c2acad5f5d8903bd0e66"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 9",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/959e64721bcf305c175bc8051f8c73ed07cf0e6a8fde00a1dcf4bde9162e06c0527df1e918edf55429990856a9e8cd1a073ed2f4143b1f763e53bbdf3be1c0f5/1.json"
            },
            "teachingObjective": "学习星期的表达",
            "cefrLevel": null
        },
        {
            "unitIndex": 10,
            "levels": [
                {
                    "id": "f284538de83d4aa879e4e33616a58ea0",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 10
                    },
                    "pathLevelClientData": {
                        "unitIndex": 10,
                        "skillIds": [
                            "fd89922945557c61020632e2a335db19",
                            "344e6f7b6b72c2acad5f5d8903bd0e66",
                            "967a34042c0d5ec37a9308188b26a683",
                            "bc657cf186c9f76908da9c1104ea2b78",
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "344e6f7b6b72c2acad5f5d8903bd0e66"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "活动",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2c8024e3324f5518d11e4bbddc6c52e4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述物品的位置和状态"
                    },
                    "totalSessions": 5,
                    "debugName": "家居 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "7e0f21c205b6288d63b4fa9780914460",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "344e6f7b6b72c2acad5f5d8903bd0e66",
                            "967a34042c0d5ec37a9308188b26a683",
                            "1fdee0b82fe3a91ec234ec5e713be133"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 13",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "0375867ed6520b7d614558e0a77a1655",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 20",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "621ae89bfad4943715634c45238f959b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c5d0c47d96042e486c2cd5281b2eeca3",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "c5d0c47d96042e486c2cd5281b2eeca3",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "叙述位置"
                    },
                    "totalSessions": 5,
                    "debugName": "位置",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "547e15a2c7141626a8ed4ff0a6d96220",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "344e6f7b6b72c2acad5f5d8903bd0e66",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "学习星期的表达"
                    },
                    "totalSessions": 5,
                    "debugName": "日程",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9e92ea1cb05814e52f0a8283e2d7d635",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "46e08feb020c05f5beb867d2de3de300",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "46e08feb020c05f5beb867d2de3de300",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论喜好"
                    },
                    "totalSessions": 5,
                    "debugName": "爱好",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "395183117cc94d9fff6aa24eb34f7acd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "46e08feb020c05f5beb867d2de3de300",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 21",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "55b98a329fed3029bbb6dcf2058a6d4a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述物品的位置和状态"
                    },
                    "totalSessions": 5,
                    "debugName": "家居 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "0c02d8b606f91d154b1cc2aa99adee64",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "46e08feb020c05f5beb867d2de3de300",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "344e6f7b6b72c2acad5f5d8903bd0e66",
                            "46e08feb020c05f5beb867d2de3de300",
                            "1fdee0b82fe3a91ec234ec5e713be133"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 14",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e2820e081fb7c3764ad9b3d0088e0330",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "46e08feb020c05f5beb867d2de3de300",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 10
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "967a34042c0d5ec37a9308188b26a683",
                            "1fdee0b82fe3a91ec234ec5e713be133",
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "344e6f7b6b72c2acad5f5d8903bd0e66",
                            "46e08feb020c05f5beb867d2de3de300",
                            "1fdee0b82fe3a91ec234ec5e713be133"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 10",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/f7aa2bc5c6d22b1f2eb88d878d31655c2b226c25fadf69456f95e80af4429639c159f074d5cafa1a303373704e2c5fff070c69c4abf02d3e6b64cb3d7cceb1bb/1.json"
            },
            "teachingObjective": "描述物品的位置和状态",
            "cefrLevel": null
        },
        {
            "unitIndex": 11,
            "levels": [
                {
                    "id": "348e1998451eeb1fdb917aeaeb9e0cf2",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 11
                    },
                    "pathLevelClientData": {
                        "unitIndex": 11,
                        "skillIds": [
                            "967a34042c0d5ec37a9308188b26a683",
                            "1fdee0b82fe3a91ec234ec5e713be133",
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "344e6f7b6b72c2acad5f5d8903bd0e66",
                            "46e08feb020c05f5beb867d2de3de300",
                            "1fdee0b82fe3a91ec234ec5e713be133"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "位置",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d9eaf40eaff722bd4db4d1cf2599a8b9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论交通工具的使用"
                    },
                    "totalSessions": 5,
                    "debugName": "交通",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4d4fbec5a09170c72807a42a4386369d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 22",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "43e750460068355d7ff0b4fcec39a18f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "46e08feb020c05f5beb867d2de3de300",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "46e08feb020c05f5beb867d2de3de300",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论喜好"
                    },
                    "totalSessions": 5,
                    "debugName": "爱好",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1a709fd7c9be45bcf4a30c902f6052de",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "1fdee0b82fe3a91ec234ec5e713be133",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述物品的位置和状态"
                    },
                    "totalSessions": 5,
                    "debugName": "家居 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2d9c7316cfba7f7c4b769cb19a06f5e8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "979b6e71b104b45f22b86bd2babf0de3",
                            "46e08feb020c05f5beb867d2de3de300",
                            "1fdee0b82fe3a91ec234ec5e713be133"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 15",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7afa259c6fadc755506984fa3cad9a83",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e788aec0cead4bcaf6ca5438e94f172b",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "e788aec0cead4bcaf6ca5438e94f172b",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "使用形容词否定形式"
                    },
                    "totalSessions": 5,
                    "debugName": "酒店",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4a9216afaeee5075b2566d3f9920737b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e788aec0cead4bcaf6ca5438e94f172b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 23",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "045b81c7ac04c2c79ed1a5d21bf91a07",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论交通工具的使用"
                    },
                    "totalSessions": 5,
                    "debugName": "交通",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b1b3005e74403fa73e111fe9128443d6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e788aec0cead4bcaf6ca5438e94f172b",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 11
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "979b6e71b104b45f22b86bd2babf0de3",
                            "46e08feb020c05f5beb867d2de3de300",
                            "1fdee0b82fe3a91ec234ec5e713be133",
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "979b6e71b104b45f22b86bd2babf0de3"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 11",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/19d022b3a5928b8b007f66c75e347992df189689d0669acec72cd67d622fc220daee2822503d0e399111e43aadd7c93cf2675cd1bb1dd0b7b7acfe59fff20466/1.json"
            },
            "teachingObjective": "谈论交通工具的使用",
            "cefrLevel": null
        },
        {
            "unitIndex": 12,
            "levels": [
                {
                    "id": "3be76ced30f1bdc17953882bd1b10e21",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 12
                    },
                    "pathLevelClientData": {
                        "unitIndex": 12,
                        "skillIds": [
                            "c5d0c47d96042e486c2cd5281b2eeca3",
                            "979b6e71b104b45f22b86bd2babf0de3",
                            "46e08feb020c05f5beb867d2de3de300",
                            "1fdee0b82fe3a91ec234ec5e713be133",
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "979b6e71b104b45f22b86bd2babf0de3"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "爱好",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "73aaa20071eff539e52e3f51f637b2ff",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "选购衣服"
                    },
                    "totalSessions": 5,
                    "debugName": "服饰",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "db8307e0476936fad9ebbcffd546c476",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "979b6e71b104b45f22b86bd2babf0de3",
                            "46e08feb020c05f5beb867d2de3de300",
                            "3135b3a7e0dbba5f3ed68ce50400e43a"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 16",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a64ffe9458f0dcf7e29f636921612609",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e788aec0cead4bcaf6ca5438e94f172b",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "e788aec0cead4bcaf6ca5438e94f172b",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "使用形容词否定形式"
                    },
                    "totalSessions": 5,
                    "debugName": "酒店",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1dff9a96c3e362dc3ed22e12574e21d7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 24",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "17de3a839e5e1586c20f995257ec538a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "979b6e71b104b45f22b86bd2babf0de3",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论交通工具的使用"
                    },
                    "totalSessions": 5,
                    "debugName": "交通",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "bb980472a68ef49686c63fc1f2c50557",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b164562e78e113b5f5000fec1cf50426",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "b164562e78e113b5f5000fec1cf50426",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "练习邀约"
                    },
                    "totalSessions": 5,
                    "debugName": "爱好 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ee91175edfbe43e75b476f47dd707b33",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b164562e78e113b5f5000fec1cf50426",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 25",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5b33ade90eca43d1777fe4115bfe7f4a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "选购衣服"
                    },
                    "totalSessions": 5,
                    "debugName": "服饰",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "929b6bcaf65f2dbc72350532cc7f2ca9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b164562e78e113b5f5000fec1cf50426",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "979b6e71b104b45f22b86bd2babf0de3",
                            "b164562e78e113b5f5000fec1cf50426",
                            "3135b3a7e0dbba5f3ed68ce50400e43a"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 17",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f0a936152b038a0b7100108a60416e71",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b164562e78e113b5f5000fec1cf50426",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 12
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "46e08feb020c05f5beb867d2de3de300",
                            "3135b3a7e0dbba5f3ed68ce50400e43a",
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "979b6e71b104b45f22b86bd2babf0de3",
                            "b164562e78e113b5f5000fec1cf50426",
                            "3135b3a7e0dbba5f3ed68ce50400e43a"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 12",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/4226d89f81b5057427ee484b9edbe3d6d7587c49b3d04b1e6f9370ae9cf19f7573ef121a87ec14f5a89f6d9218e9748519c53f6b9c39e98869ba8f6a2b1c6858/1.json"
            },
            "teachingObjective": "选购衣服",
            "cefrLevel": null
        },
        {
            "unitIndex": 13,
            "levels": [
                {
                    "id": "6387c6e05eac2f6e8d16411ea6749845",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 13
                    },
                    "pathLevelClientData": {
                        "unitIndex": 13,
                        "skillIds": [
                            "46e08feb020c05f5beb867d2de3de300",
                            "3135b3a7e0dbba5f3ed68ce50400e43a",
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "979b6e71b104b45f22b86bd2babf0de3",
                            "b164562e78e113b5f5000fec1cf50426",
                            "3135b3a7e0dbba5f3ed68ce50400e43a"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "酒店",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "08a02616f6b70791442d7a6d088345e3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4a208dfe844640982aea79affa50bdca",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "4a208dfe844640982aea79affa50bdca",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述天气"
                    },
                    "totalSessions": 5,
                    "debugName": "天气",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f572979771b8037204cca7618421e79b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4a208dfe844640982aea79affa50bdca",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 26",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "b8656747d3d9c0e364b35e448d67d1ce",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b164562e78e113b5f5000fec1cf50426",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "b164562e78e113b5f5000fec1cf50426",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "练习邀约"
                    },
                    "totalSessions": 5,
                    "debugName": "爱好 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "892f03b0893ac1cfd6551dc37f4efb97",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "3135b3a7e0dbba5f3ed68ce50400e43a",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "选购衣服"
                    },
                    "totalSessions": 5,
                    "debugName": "服饰",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "75e8724628f848a453ae64094d081be6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4a208dfe844640982aea79affa50bdca",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "4a208dfe844640982aea79affa50bdca",
                            "b164562e78e113b5f5000fec1cf50426",
                            "3135b3a7e0dbba5f3ed68ce50400e43a"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 18",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f933159e327441cd8a558e2091872552",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "23262352c8e731853117316103b3af19",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "23262352c8e731853117316103b3af19",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "述说各种兴趣与爱好"
                    },
                    "totalSessions": 5,
                    "debugName": "兴趣爱好 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6141127721c42cc45c0cf966d8cda52a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "23262352c8e731853117316103b3af19",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 27",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "e16b6ddbe3efc0911f07e8ecac17e1dd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4a208dfe844640982aea79affa50bdca",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "4a208dfe844640982aea79affa50bdca",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述天气"
                    },
                    "totalSessions": 5,
                    "debugName": "天气",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5a888b9b2f84ab8d491af0fe9f0f3f39",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "23262352c8e731853117316103b3af19",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 13
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "4a208dfe844640982aea79affa50bdca",
                            "b164562e78e113b5f5000fec1cf50426",
                            "3135b3a7e0dbba5f3ed68ce50400e43a",
                            "23262352c8e731853117316103b3af19",
                            "4a208dfe844640982aea79affa50bdca"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 13",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/eba6e0515303d2982a09a78690af9f82d69cddbc3a4a7b7845ba8e81c97dea7cf4af16d81b36ff3226983b5c0591b2b60c941ef97f6072ad9b94a8fb650fa059/1.json"
            },
            "teachingObjective": "描述天气",
            "cefrLevel": null
        },
        {
            "unitIndex": 14,
            "levels": [
                {
                    "id": "11fefe72355a69970ce0f56a79a865e0",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 14
                    },
                    "pathLevelClientData": {
                        "unitIndex": 14,
                        "skillIds": [
                            "e788aec0cead4bcaf6ca5438e94f172b",
                            "4a208dfe844640982aea79affa50bdca",
                            "b164562e78e113b5f5000fec1cf50426",
                            "3135b3a7e0dbba5f3ed68ce50400e43a",
                            "23262352c8e731853117316103b3af19",
                            "4a208dfe844640982aea79affa50bdca"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "爱好 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "30999c9a0acbafe69c86c572c6f15d94",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论天气冷暖"
                    },
                    "totalSessions": 5,
                    "debugName": "天气 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "69cdd838ba209e9faed02c12fb335840",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 28",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "f4321273850fd554d7669d336190a15d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "4a208dfe844640982aea79affa50bdca",
                            "b164562e78e113b5f5000fec1cf50426",
                            "1d97e7f4db540148fbf22a3bf0052492"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 19",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "151d76ea758489681aef700af8a01f17",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "23262352c8e731853117316103b3af19",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "23262352c8e731853117316103b3af19",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "述说各种兴趣与爱好"
                    },
                    "totalSessions": 5,
                    "debugName": "兴趣爱好 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "0841625b6be5582af0678c61eefa580a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4a208dfe844640982aea79affa50bdca",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "4a208dfe844640982aea79affa50bdca",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述天气"
                    },
                    "totalSessions": 5,
                    "debugName": "天气",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f4837d42d1a8fd4786607a46b3a8feb7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "757f9fc1dee22baff6a2696c764dfa9b",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "757f9fc1dee22baff6a2696c764dfa9b",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "指引方向"
                    },
                    "totalSessions": 5,
                    "debugName": "方向",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "07d27bfd3eeaff4b6c766efc80f825b2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "757f9fc1dee22baff6a2696c764dfa9b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 29",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "421d5629fc147bcf30dd189b78118464",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论天气冷暖"
                    },
                    "totalSessions": 5,
                    "debugName": "天气 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "356850fa6ccf707e630f2d08ebbe60fb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "757f9fc1dee22baff6a2696c764dfa9b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "4a208dfe844640982aea79affa50bdca",
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "1d97e7f4db540148fbf22a3bf0052492"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 20",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "cac8ba56a2490b7b931f54ec896d85a4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "757f9fc1dee22baff6a2696c764dfa9b",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 14
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b164562e78e113b5f5000fec1cf50426",
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "23262352c8e731853117316103b3af19",
                            "4a208dfe844640982aea79affa50bdca",
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "1d97e7f4db540148fbf22a3bf0052492"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 14",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/458473da7ec0fded27d13276611a9ef4357c043826304ae32b9e42b62ace0a7dad3a39041242ebc454dc7321a27fddbba79bda92c6de8ca6ea64cea49da50946/1.json"
            },
            "teachingObjective": "谈论天气冷暖",
            "cefrLevel": null
        },
        {
            "unitIndex": 15,
            "levels": [
                {
                    "id": "46ea7ab0871ef3832434209f52228eb5",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 15
                    },
                    "pathLevelClientData": {
                        "unitIndex": 15,
                        "skillIds": [
                            "b164562e78e113b5f5000fec1cf50426",
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "23262352c8e731853117316103b3af19",
                            "4a208dfe844640982aea79affa50bdca",
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "1d97e7f4db540148fbf22a3bf0052492"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "兴趣爱好 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c1bfbcc9e8f619eae89ea175fb16c62e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "212afba3f93b8a507d056fa193d5afe9",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "212afba3f93b8a507d056fa193d5afe9",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述食物的数量"
                    },
                    "totalSessions": 5,
                    "debugName": "饮食 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "bb26ca12f9dd68eaa5481befa77ad776",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "212afba3f93b8a507d056fa193d5afe9",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 30",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ea4ec793dfd21e4c5040990340083d91",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "757f9fc1dee22baff6a2696c764dfa9b",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "757f9fc1dee22baff6a2696c764dfa9b",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "指引方向"
                    },
                    "totalSessions": 5,
                    "debugName": "方向",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "79fcc8f01bdf92e28c76a5549fdfb50d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "1d97e7f4db540148fbf22a3bf0052492",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论天气冷暖"
                    },
                    "totalSessions": 5,
                    "debugName": "天气 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "90d77fc1ff18b4267e21ea4a50fdeeea",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "212afba3f93b8a507d056fa193d5afe9",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "212afba3f93b8a507d056fa193d5afe9",
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "1d97e7f4db540148fbf22a3bf0052492"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 21",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e8d4f3ec987631db572cc19d34363d35",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d1747e18da8f996fd21f480b8d7b8e7f",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "d1747e18da8f996fd21f480b8d7b8e7f",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "在餐馆点餐"
                    },
                    "totalSessions": 5,
                    "debugName": "餐馆 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5997e3169134618909d48a3ba1ae6f80",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "d1747e18da8f996fd21f480b8d7b8e7f",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 31",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "265d81eaa1f9159d85c47d213e632f9d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "212afba3f93b8a507d056fa193d5afe9",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "212afba3f93b8a507d056fa193d5afe9",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述食物的数量"
                    },
                    "totalSessions": 5,
                    "debugName": "饮食 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c70525ec20426dbefdb1846917f4a348",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "d1747e18da8f996fd21f480b8d7b8e7f",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 15
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "212afba3f93b8a507d056fa193d5afe9",
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "212afba3f93b8a507d056fa193d5afe9"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 15",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/a2b75ccc64c2f6fa2a88cb06d78969040f9298a633a8aeac79605d6376d13a250b785a7573e39c5036efc322d286c682f33e10e6b2a588ef94c30fbba8e8dd16/1.json"
            },
            "teachingObjective": "描述食物的数量",
            "cefrLevel": null
        },
        {
            "unitIndex": 16,
            "levels": [
                {
                    "id": "520ff20c298109d5469fd134c8f09b75",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 16
                    },
                    "pathLevelClientData": {
                        "unitIndex": 16,
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "212afba3f93b8a507d056fa193d5afe9",
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "212afba3f93b8a507d056fa193d5afe9"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "方向",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e1b7df1f020f6ea50330ced3d5c4c831",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "指路"
                    },
                    "totalSessions": 5,
                    "debugName": "向导",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "76061ba3e802bde2cefe2f7f1c2ff4be",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "212afba3f93b8a507d056fa193d5afe9",
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "e6569d6e4322beaae5b4c3a966103cc9"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 22",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "aac99878f0c82208a9b1fdca69205e56",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 32",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "afd1eda85b347f9f9533b52108634645",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d1747e18da8f996fd21f480b8d7b8e7f",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "d1747e18da8f996fd21f480b8d7b8e7f",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "在餐馆点餐"
                    },
                    "totalSessions": 5,
                    "debugName": "餐馆 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d408b3f1d103de6018ec8b03afe7e8c6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "212afba3f93b8a507d056fa193d5afe9",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "212afba3f93b8a507d056fa193d5afe9",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述食物的数量"
                    },
                    "totalSessions": 5,
                    "debugName": "饮食 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "420d42d21b2fae4e78c7e0b3174538da",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9815b5f33c50b37e54418429ecd121c9",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "9815b5f33c50b37e54418429ecd121c9",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "买东西"
                    },
                    "totalSessions": 5,
                    "debugName": "购物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c9762dc7f235adb6cfb8708148e5633e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9815b5f33c50b37e54418429ecd121c9",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 33",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "b6af95567f2fc51382379da941af3333",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "指路"
                    },
                    "totalSessions": 5,
                    "debugName": "向导",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6771dbd58b2f0985fe825a35e2e827c3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9815b5f33c50b37e54418429ecd121c9",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "212afba3f93b8a507d056fa193d5afe9",
                            "9815b5f33c50b37e54418429ecd121c9",
                            "e6569d6e4322beaae5b4c3a966103cc9"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 23",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5dc1da4137a46d0e477325116b42bc24",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9815b5f33c50b37e54418429ecd121c9",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 16
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "e6569d6e4322beaae5b4c3a966103cc9",
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "212afba3f93b8a507d056fa193d5afe9",
                            "9815b5f33c50b37e54418429ecd121c9",
                            "e6569d6e4322beaae5b4c3a966103cc9"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 16",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/f338fa9810fe8cb6a9b06ae9dc2fe0ec337cfb74b55129110f47145b334eb5df160342da09eb19032956bdd94e4cc31747200ff9d2a8c5f481a1eee4ad28f9de/1.json"
            },
            "teachingObjective": "指路",
            "cefrLevel": null
        },
        {
            "unitIndex": 17,
            "levels": [
                {
                    "id": "1e51376c90b035312e86335f133df211",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 17
                    },
                    "pathLevelClientData": {
                        "unitIndex": 17,
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "e6569d6e4322beaae5b4c3a966103cc9",
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "212afba3f93b8a507d056fa193d5afe9",
                            "9815b5f33c50b37e54418429ecd121c9",
                            "e6569d6e4322beaae5b4c3a966103cc9"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "餐馆 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "81e028ac3552de8bf43705d37a923f79",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c3a471c702bf20982b17d4e1846a5975",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "c3a471c702bf20982b17d4e1846a5975",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论日期的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "日期",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "38a9861d9394b0ca06e7b82e1e434adb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c3a471c702bf20982b17d4e1846a5975",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 34",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "020d7b44588529c53c086dbef9a17db1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9815b5f33c50b37e54418429ecd121c9",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "9815b5f33c50b37e54418429ecd121c9",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "买东西"
                    },
                    "totalSessions": 5,
                    "debugName": "购物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "47368615f8525db8148ee1fe76182f99",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "e6569d6e4322beaae5b4c3a966103cc9",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "指路"
                    },
                    "totalSessions": 5,
                    "debugName": "向导",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "33be876eca4c89e639e1419d4f1f5329",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c3a471c702bf20982b17d4e1846a5975",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "c3a471c702bf20982b17d4e1846a5975",
                            "9815b5f33c50b37e54418429ecd121c9",
                            "e6569d6e4322beaae5b4c3a966103cc9"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 24",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "77a56d96b392bb2689ff35929c7ec689",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "79ce90c245282de8e505986ee39f70fe",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "79ce90c245282de8e505986ee39f70fe",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述周围的人"
                    },
                    "totalSessions": 5,
                    "debugName": "人 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3049f46419b6f31125886d9fa6e1ab9a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "79ce90c245282de8e505986ee39f70fe",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 35",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "bc2288a6f5c4a10481cddf14b70dfcdd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c3a471c702bf20982b17d4e1846a5975",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "c3a471c702bf20982b17d4e1846a5975",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论日期的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "日期",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "00c287756fd2107db8c1a24a0c633de4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "79ce90c245282de8e505986ee39f70fe",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 17
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "c3a471c702bf20982b17d4e1846a5975",
                            "9815b5f33c50b37e54418429ecd121c9",
                            "e6569d6e4322beaae5b4c3a966103cc9",
                            "79ce90c245282de8e505986ee39f70fe",
                            "c3a471c702bf20982b17d4e1846a5975"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 17",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/9badb9017b50806c4c3a1a4c283e437d71c03cfe832f0477a7a18e6dcadc82d5e6ab3922312f30fe97711b3e0eed4342c0ef1d43126cb98f6c0291cff2b4f5af/1.json"
            },
            "teachingObjective": "谈论日期的说法",
            "cefrLevel": null
        },
        {
            "unitIndex": 18,
            "levels": [
                {
                    "id": "9e926bfaaf94738c6b04dba7bdcdcaeb",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 18
                    },
                    "pathLevelClientData": {
                        "unitIndex": 18,
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "c3a471c702bf20982b17d4e1846a5975",
                            "9815b5f33c50b37e54418429ecd121c9",
                            "e6569d6e4322beaae5b4c3a966103cc9",
                            "79ce90c245282de8e505986ee39f70fe",
                            "c3a471c702bf20982b17d4e1846a5975"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "购物",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "92c7c745958ae3f63df0f575ee92b1fc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b756ba8e8aa8451cb6595fd7d104e49b",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "b756ba8e8aa8451cb6595fd7d104e49b",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "掌握日期和时间的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "日期 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d58daacc355c3705e2944440ea478465",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b756ba8e8aa8451cb6595fd7d104e49b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "79ce90c245282de8e505986ee39f70fe",
                            "c3a471c702bf20982b17d4e1846a5975",
                            "9815b5f33c50b37e54418429ecd121c9",
                            "b756ba8e8aa8451cb6595fd7d104e49b"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 5,
                    "debugName": "Practice Level 25",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ea10220149efaafa2bf5e5cd73854515",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b756ba8e8aa8451cb6595fd7d104e49b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 36",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "2da0c567b01a4c13bfdf506a6471c66a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "79ce90c245282de8e505986ee39f70fe",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "79ce90c245282de8e505986ee39f70fe",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述周围的人"
                    },
                    "totalSessions": 5,
                    "debugName": "人 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f5602b7727b70d16430c09b18f040957",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c3a471c702bf20982b17d4e1846a5975",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "c3a471c702bf20982b17d4e1846a5975",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论日期的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "日期",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9854937cc4699683c728e1031b373a8c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b756ba8e8aa8451cb6595fd7d104e49b",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 37",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "22d9d34cad91bf213b573a0790b284c7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "叙述日常活动"
                    },
                    "totalSessions": 5,
                    "debugName": "活动 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "572bfaf0278fb89502733c0a34ec6b54",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "79ce90c245282de8e505986ee39f70fe",
                            "c3a471c702bf20982b17d4e1846a5975",
                            "54933d3c3a091aca9fe4fc87bb3ceadb"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 26",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "b31cd2c3eadc542d6b03f462d1ff9aa4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 18
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "9815b5f33c50b37e54418429ecd121c9",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "79ce90c245282de8e505986ee39f70fe",
                            "c3a471c702bf20982b17d4e1846a5975",
                            "54933d3c3a091aca9fe4fc87bb3ceadb"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 18",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/4013e2a788b1bb3fa4c133396b28b1fc200d6630e6a4941796857aa2f4995d499da38cc0c081c5429d12a320c5f14078bef0d33f1be23afc05f037bcdfb58d00/1.json"
            },
            "teachingObjective": "掌握日期和时间的说法",
            "cefrLevel": null
        },
        {
            "unitIndex": 19,
            "levels": [
                {
                    "id": "7ea0538686e765f73f938183d82d9a42",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 19
                    },
                    "pathLevelClientData": {
                        "unitIndex": 19,
                        "skillIds": [
                            "9815b5f33c50b37e54418429ecd121c9",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "79ce90c245282de8e505986ee39f70fe",
                            "c3a471c702bf20982b17d4e1846a5975",
                            "54933d3c3a091aca9fe4fc87bb3ceadb"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "日期 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "fee3164f67194eaf6322a0f23b366426",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "79ce90c245282de8e505986ee39f70fe",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "79ce90c245282de8e505986ee39f70fe",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述周围的人"
                    },
                    "totalSessions": 5,
                    "debugName": "人 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "7d4fb0dd215fc2def19bad508868339c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5166469d9473d3d711a25eeb839d46c2",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "5166469d9473d3d711a25eeb839d46c2",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论户外活动"
                    },
                    "totalSessions": 5,
                    "debugName": "自然",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9cd9fc18fb1f7e7c8265afa9a97e3e4a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5166469d9473d3d711a25eeb839d46c2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 38",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "dad582c140d33af46f6f8041634fee19",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5166469d9473d3d711a25eeb839d46c2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "79ce90c245282de8e505986ee39f70fe",
                            "5166469d9473d3d711a25eeb839d46c2"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 27",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "21d954cd622c0e8ff82ca27fe5ff285a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "叙述日常活动"
                    },
                    "totalSessions": 5,
                    "debugName": "活动 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3f5a32dc97c19843b28d5a31abd46ba6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b756ba8e8aa8451cb6595fd7d104e49b",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "b756ba8e8aa8451cb6595fd7d104e49b",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "掌握日期和时间的说法"
                    },
                    "totalSessions": 5,
                    "debugName": "日期 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "65d39480700db2fb8024173f3268003c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bcd864ad1130b7985cecbacb521211f7",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "bcd864ad1130b7985cecbacb521211f7",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "叙述学校活动"
                    },
                    "totalSessions": 5,
                    "debugName": "教室",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4b57869d8719f00a08dd5a1588a4b4aa",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bcd864ad1130b7985cecbacb521211f7",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 39",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "cb0915664dc7592eca8ea8a44676f056",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bcd864ad1130b7985cecbacb521211f7",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "bcd864ad1130b7985cecbacb521211f7"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 28",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "afae8dacd6e5f1305106658d29975acb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bcd864ad1130b7985cecbacb521211f7",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 19
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "79ce90c245282de8e505986ee39f70fe",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "bcd864ad1130b7985cecbacb521211f7"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 19",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/20258af3f620fc656f5545e3881e0300fbe96e6807d1addd0de4fc372415f2a1c16052bd3e96577efa27ccae6b1a70799df4ff6a0f7142e1cfc23ca52e9cec59/1.json"
            },
            "teachingObjective": "谈论户外活动",
            "cefrLevel": null
        },
        {
            "unitIndex": 20,
            "levels": [
                {
                    "id": "59bcd7b0124a79e65fc67be567dbcffd",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 20
                    },
                    "pathLevelClientData": {
                        "unitIndex": 20,
                        "skillIds": [
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "79ce90c245282de8e505986ee39f70fe",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "bcd864ad1130b7985cecbacb521211f7"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "自然",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ef29451ebbfb8b26c60d971c404bdfc0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "54933d3c3a091aca9fe4fc87bb3ceadb",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "叙述日常活动"
                    },
                    "totalSessions": 5,
                    "debugName": "活动 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "06da00bf78fae18452d2fa34097729dc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bcd864ad1130b7985cecbacb521211f7",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 40",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "851495ed49b48325fd5d716eff2793e5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "0064fc23d280a37aa89450bcf4d9c7d4",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "0064fc23d280a37aa89450bcf4d9c7d4",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "表达心情与感受"
                    },
                    "totalSessions": 5,
                    "debugName": "感受",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "239cbc42d538e534e4f5cefd5c59d1db",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "0064fc23d280a37aa89450bcf4d9c7d4",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5166469d9473d3d711a25eeb839d46c2",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "0064fc23d280a37aa89450bcf4d9c7d4"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 29",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7b14e38c8d7c08197d16c6043d6384fb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bcd864ad1130b7985cecbacb521211f7",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "bcd864ad1130b7985cecbacb521211f7",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "叙述学校活动"
                    },
                    "totalSessions": 5,
                    "debugName": "教室",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ef4078551c97bb37ce0bb079299a142d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5166469d9473d3d711a25eeb839d46c2",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "5166469d9473d3d711a25eeb839d46c2",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论户外活动"
                    },
                    "totalSessions": 5,
                    "debugName": "自然",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6f97a9880eb213ca31bfe667543d53a6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "0064fc23d280a37aa89450bcf4d9c7d4",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 41",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5221b82c647600e9bcec84e88cf2683b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c657a44d4bd02633dd4170a468a12abc",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "c657a44d4bd02633dd4170a468a12abc",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "形容物品"
                    },
                    "totalSessions": 5,
                    "debugName": "事物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5e1c6cef1ba34fe57d22dbc99e652343",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c657a44d4bd02633dd4170a468a12abc",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "bcd864ad1130b7985cecbacb521211f7",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "c657a44d4bd02633dd4170a468a12abc"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 30",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9963a1e090f7d67b6a5e26fed2dc5538",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c657a44d4bd02633dd4170a468a12abc",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 20
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5166469d9473d3d711a25eeb839d46c2",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "c657a44d4bd02633dd4170a468a12abc"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 20",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/e02e97a1b8cae2b913dcd1d2fc868026260fd4e1725e4b4ad3dd6d6d7924776155272b3ba24b16fc68932c917f79192e6bce82f3ad3ca1975ffabb27ebefa792/1.json"
            },
            "teachingObjective": "表达心情与感受",
            "cefrLevel": null
        },
        {
            "unitIndex": 21,
            "levels": [
                {
                    "id": "435932f2853ff62fb45027bbd1bfbb4d",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 21
                    },
                    "pathLevelClientData": {
                        "unitIndex": 21,
                        "skillIds": [
                            "5166469d9473d3d711a25eeb839d46c2",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "c657a44d4bd02633dd4170a468a12abc"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "感受",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "cd71702c7e59b711f5d8a86f8382aa0d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bcd864ad1130b7985cecbacb521211f7",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "bcd864ad1130b7985cecbacb521211f7",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "叙述学校活动"
                    },
                    "totalSessions": 5,
                    "debugName": "教室",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "408d499ece37d84932644a7f450b05e2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b5e7f9b7ea2f7adc3fe26150f2419b86",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "b5e7f9b7ea2f7adc3fe26150f2419b86",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述建筑物的位置"
                    },
                    "totalSessions": 5,
                    "debugName": "方向 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5fdfc2c97edb9d6b0d7c2b0565652272",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b5e7f9b7ea2f7adc3fe26150f2419b86",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "b5e7f9b7ea2f7adc3fe26150f2419b86"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 31",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "52d91217bfabd29ea7963b83a217722d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b5e7f9b7ea2f7adc3fe26150f2419b86",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 42",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "1c53ca98f841809e208b466bb8d56524",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c657a44d4bd02633dd4170a468a12abc",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "c657a44d4bd02633dd4170a468a12abc",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "形容物品"
                    },
                    "totalSessions": 5,
                    "debugName": "事物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4bbbbfa568e7e1d710a8b5e735264736",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "0064fc23d280a37aa89450bcf4d9c7d4",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "0064fc23d280a37aa89450bcf4d9c7d4",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "表达心情与感受"
                    },
                    "totalSessions": 5,
                    "debugName": "感受",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d7fcb0825c2fa30b0baa83792893c9e5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "535d193363180b55b666a0bf6bd2c075",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "535d193363180b55b666a0bf6bd2c075",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "使用比较级和最高级"
                    },
                    "totalSessions": 5,
                    "debugName": "购物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "138bc672b4a038981b39ff4c6fa0aa3f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "535d193363180b55b666a0bf6bd2c075",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 43",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "fc9302368cb9ca0e4e6a3d8144524452",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "535d193363180b55b666a0bf6bd2c075",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "c657a44d4bd02633dd4170a468a12abc",
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "535d193363180b55b666a0bf6bd2c075"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 32",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "1fbb0170a29d5593cb085b56401dab00",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "535d193363180b55b666a0bf6bd2c075",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 21
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "c657a44d4bd02633dd4170a468a12abc",
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "535d193363180b55b666a0bf6bd2c075"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 21",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/503afc1d8fc947a8ba2543f3aedb6a1092dca72cdb65dbf92d94ca952557cfb93aa344df8caf5a5067c4c85430f820538d599d81ef09b8711da8bd47b2a9156e/1.json"
            },
            "teachingObjective": "描述建筑物的位置",
            "cefrLevel": null
        },
        {
            "unitIndex": 22,
            "levels": [
                {
                    "id": "37089ee2c685c3b5e60bc237676191f7",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 22
                    },
                    "pathLevelClientData": {
                        "unitIndex": 22,
                        "skillIds": [
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "c657a44d4bd02633dd4170a468a12abc",
                            "0064fc23d280a37aa89450bcf4d9c7d4",
                            "535d193363180b55b666a0bf6bd2c075"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "方向 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3f038ce8b517eab07071e92d670bf889",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c657a44d4bd02633dd4170a468a12abc",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "c657a44d4bd02633dd4170a468a12abc",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "形容物品"
                    },
                    "totalSessions": 5,
                    "debugName": "事物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "28c1d03d07f456edcbac7dc8b7cdad54",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "470f54788c697f60145d1d30a95b12a1",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "470f54788c697f60145d1d30a95b12a1",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论擅长和不擅长的事情"
                    },
                    "totalSessions": 5,
                    "debugName": "爱好 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "88b253bd826dbc98681ca18174a809bc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "470f54788c697f60145d1d30a95b12a1",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 44",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "828572e6d7b9dae9cd20f1ae194e8f02",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "470f54788c697f60145d1d30a95b12a1",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "c657a44d4bd02633dd4170a468a12abc",
                            "470f54788c697f60145d1d30a95b12a1"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 33",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "2f2e0dc426b9c0fd00ec3e0bd1a27205",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "535d193363180b55b666a0bf6bd2c075",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "535d193363180b55b666a0bf6bd2c075",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "使用比较级和最高级"
                    },
                    "totalSessions": 5,
                    "debugName": "购物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c138914874898a3315fd9a7d45aec0ba",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b5e7f9b7ea2f7adc3fe26150f2419b86",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "b5e7f9b7ea2f7adc3fe26150f2419b86",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述建筑物的位置"
                    },
                    "totalSessions": 5,
                    "debugName": "方向 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "15c80622c3a00d291b19ebee60c36607",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "470f54788c697f60145d1d30a95b12a1",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 45",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "4922264bab83da602fcbd8a4343c51bc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "请求别人不做某事"
                    },
                    "totalSessions": 5,
                    "debugName": "教室 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c44ec7319719198e786a9f612883adde",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "535d193363180b55b666a0bf6bd2c075",
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 34",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "45eb39f9e27771a4bfb88d0c0db61682",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 22
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "c657a44d4bd02633dd4170a468a12abc",
                            "470f54788c697f60145d1d30a95b12a1",
                            "535d193363180b55b666a0bf6bd2c075",
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 22",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/51f456abc5010762e39009dac0a441359495508c3254b891f0a5eeb7afbfd90eec7c0ecc2b49ba0ed308eab059ce5784f432b52bccd5bf90d727f7482b14792b/1.json"
            },
            "teachingObjective": "谈论擅长和不擅长的事情",
            "cefrLevel": null
        },
        {
            "unitIndex": 23,
            "levels": [
                {
                    "id": "89a6df19445d2d58ec9a0325792e3cd9",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 23
                    },
                    "pathLevelClientData": {
                        "unitIndex": 23,
                        "skillIds": [
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "c657a44d4bd02633dd4170a468a12abc",
                            "470f54788c697f60145d1d30a95b12a1",
                            "535d193363180b55b666a0bf6bd2c075",
                            "b5e7f9b7ea2f7adc3fe26150f2419b86",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "爱好 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d1701197728b5926fe12ae1fec19bb08",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "535d193363180b55b666a0bf6bd2c075",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "535d193363180b55b666a0bf6bd2c075",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "使用比较级和最高级"
                    },
                    "totalSessions": 5,
                    "debugName": "购物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d6ebd370b0f865a043331f7289e657e2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 46",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "8dd62c64fb3922ac99c7ae2ec4bf067a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d197e1d75993ad18451acf3bb322aad8",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "d197e1d75993ad18451acf3bb322aad8",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "提出要求"
                    },
                    "totalSessions": 5,
                    "debugName": "教室 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d64afc3ebd8ed736df5b26a8178b5b96",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "d197e1d75993ad18451acf3bb322aad8",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "470f54788c697f60145d1d30a95b12a1",
                            "535d193363180b55b666a0bf6bd2c075",
                            "d197e1d75993ad18451acf3bb322aad8"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 35",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "257366f0d86646fb9cd7b52063ab0faf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "请求别人不做某事"
                    },
                    "totalSessions": 5,
                    "debugName": "教室 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8b22b33ddbb52a8dac0855a9acb4a6cc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "470f54788c697f60145d1d30a95b12a1",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "470f54788c697f60145d1d30a95b12a1",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论擅长和不擅长的事情"
                    },
                    "totalSessions": 5,
                    "debugName": "爱好 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "94244e48644a6e0c116b1ddf6478c80d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述身体健康情况"
                    },
                    "totalSessions": 5,
                    "debugName": "健康",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a2cb8e0e21f563964532bbae7cdc95af",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 47",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "c06393095ef64c9830ff73fa74d099cf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "470f54788c697f60145d1d30a95b12a1",
                            "8ac049b345b003c7f1489a0d9d2fb54a"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 36",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d911bc240f8e0eeb392245f1890dfb33",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 23
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "470f54788c697f60145d1d30a95b12a1",
                            "535d193363180b55b666a0bf6bd2c075",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "470f54788c697f60145d1d30a95b12a1",
                            "8ac049b345b003c7f1489a0d9d2fb54a"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 23",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/e2ca30a2a12f6540dc310709ec78047ada0ae886bbad1af10e4385a49b7c1aae34b556337fa74c3739d49f40be8c9b30850d2da7bed831f35e4e9abf2fbd4dbf/1.json"
            },
            "teachingObjective": "提出要求",
            "cefrLevel": null
        },
        {
            "unitIndex": 24,
            "levels": [
                {
                    "id": "61a75919b287d1e0d732e3aacb4e0546",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 24
                    },
                    "pathLevelClientData": {
                        "unitIndex": 24,
                        "skillIds": [
                            "470f54788c697f60145d1d30a95b12a1",
                            "535d193363180b55b666a0bf6bd2c075",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "470f54788c697f60145d1d30a95b12a1",
                            "8ac049b345b003c7f1489a0d9d2fb54a"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "教室 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "db611ac6d44a5371cac0ec43a523418b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "请求别人不做某事"
                    },
                    "totalSessions": 5,
                    "debugName": "教室 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "cdbafd2abb74999a5675d1885d7acb4e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "ad68c5895fe211329c481c27e69d86b4",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "ad68c5895fe211329c481c27e69d86b4",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "介绍业余生活"
                    },
                    "totalSessions": 5,
                    "debugName": "假期",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "0f180d267274013762df8cdb4f6a945d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "ad68c5895fe211329c481c27e69d86b4",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d197e1d75993ad18451acf3bb322aad8",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "ad68c5895fe211329c481c27e69d86b4"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 37",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "78d3bbe09ac6e396a12d36e73692fb1d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "ad68c5895fe211329c481c27e69d86b4",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 48",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "956e020a340f190993ab148a304a09e3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述身体健康情况"
                    },
                    "totalSessions": 5,
                    "debugName": "健康",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ae64f80f555dde1e1ae63c40e501f927",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d197e1d75993ad18451acf3bb322aad8",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "d197e1d75993ad18451acf3bb322aad8",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "提出要求"
                    },
                    "totalSessions": 5,
                    "debugName": "教室 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c55e7a800e4d9147b8c88d626832add4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "ad68c5895fe211329c481c27e69d86b4",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 49",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "484952890c43acd94b2588fc269c02b0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述周围环境"
                    },
                    "totalSessions": 5,
                    "debugName": "事物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e0c6fe74055a031107900baba9bf4df4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "f5945b45236e5f5b0cf8ac487cd8aed7"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 38",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5efd9ca20a40ec11f2a980ec2f74d455",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 24
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d197e1d75993ad18451acf3bb322aad8",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "ad68c5895fe211329c481c27e69d86b4",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "f5945b45236e5f5b0cf8ac487cd8aed7"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 24",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/9cd2d8d12977a36800ed1e91c666a3a15479a184da030d81d80ea88bd3ed65de86c31cab3d4d3ec94cb2e715667c26ec871fb6110e3533740970f57f24e8352e/1.json"
            },
            "teachingObjective": "介绍业余生活",
            "cefrLevel": null
        },
        {
            "unitIndex": 25,
            "levels": [
                {
                    "id": "8c34f4d7b3c6ba9a6a5df07ea42fc6a5",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 25
                    },
                    "pathLevelClientData": {
                        "unitIndex": 25,
                        "skillIds": [
                            "d197e1d75993ad18451acf3bb322aad8",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "ad68c5895fe211329c481c27e69d86b4",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "f5945b45236e5f5b0cf8ac487cd8aed7"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "假期",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e31d7bc16b6a7e776a03a64b426f66df",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "8ac049b345b003c7f1489a0d9d2fb54a",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述身体健康情况"
                    },
                    "totalSessions": 5,
                    "debugName": "健康",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "70841700d4de6c5c1ad7b791bc5e16be",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "6c8290bc4c546d69c6e30eae7189919b",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "6c8290bc4c546d69c6e30eae7189919b",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "使用日期表达"
                    },
                    "totalSessions": 5,
                    "debugName": "日期 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d9deb6a513d23395ed6d73bd4354db30",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "6c8290bc4c546d69c6e30eae7189919b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 50",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ee731173f18c731999b2a6fd90e04b3e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "6c8290bc4c546d69c6e30eae7189919b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "ad68c5895fe211329c481c27e69d86b4",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "6c8290bc4c546d69c6e30eae7189919b"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 39",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "fdf9ce944a7b9ba73be980ea644b7d89",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述周围环境"
                    },
                    "totalSessions": 5,
                    "debugName": "事物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "92e33c50b3d54a1df21eb9c3725c5af8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "ad68c5895fe211329c481c27e69d86b4",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "ad68c5895fe211329c481c27e69d86b4",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "介绍业余生活"
                    },
                    "totalSessions": 5,
                    "debugName": "假期",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "06cf89e789775adf7f2f5a9a9710e1bd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述亲戚"
                    },
                    "totalSessions": 5,
                    "debugName": "人 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "503b4b7c6bf72590ee8b1e773c47c418",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 51",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "d0c7933d888145920d48cd146820c965",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f5945b45236e5f5b0cf8ac487cd8aed7",
                            "ad68c5895fe211329c481c27e69d86b4",
                            "7ea1fab3c1474877880196e5370f8cb3"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 40",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c6fdd9530f5e4751e65e8b2563276544",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 25
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "ad68c5895fe211329c481c27e69d86b4",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "f5945b45236e5f5b0cf8ac487cd8aed7",
                            "ad68c5895fe211329c481c27e69d86b4",
                            "7ea1fab3c1474877880196e5370f8cb3"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 25",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/c556148edd3a8e2ff89a066536de3078ce31a074bc3f662fc3641a99fc5b1a66232ddfdf6ed30cc5cdc7f79103d90f907c3f1213facb62a92378701f4a073886/1.json"
            },
            "teachingObjective": "使用日期表达",
            "cefrLevel": null
        },
        {
            "unitIndex": 26,
            "levels": [
                {
                    "id": "4f81d622b73b6fcdcfbf573569d9a1bf",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 26
                    },
                    "pathLevelClientData": {
                        "unitIndex": 26,
                        "skillIds": [
                            "ad68c5895fe211329c481c27e69d86b4",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "f5945b45236e5f5b0cf8ac487cd8aed7",
                            "ad68c5895fe211329c481c27e69d86b4",
                            "7ea1fab3c1474877880196e5370f8cb3"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "日期 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b731c9b35a34947bde46efd6de656f1a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "f5945b45236e5f5b0cf8ac487cd8aed7",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述周围环境"
                    },
                    "totalSessions": 5,
                    "debugName": "事物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6a6dceb4d43f7bde22a0f53698371d92",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 52",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "c8703cea17e85381dcd8dc41910d3595",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "59a6083d2904f6a7fa00eb8d0f443968",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "59a6083d2904f6a7fa00eb8d0f443968",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论亚文化"
                    },
                    "totalSessions": 5,
                    "debugName": "亚文化",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "abb4010ada67cb83e8aa8f23cb163287",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "59a6083d2904f6a7fa00eb8d0f443968",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "f5945b45236e5f5b0cf8ac487cd8aed7",
                            "59a6083d2904f6a7fa00eb8d0f443968"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 41",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "1ba9d130f2e0911704f45545a10ce9e1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述亲戚"
                    },
                    "totalSessions": 5,
                    "debugName": "人 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "efb8a36c44728dd2cf49752a28b0de91",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "6c8290bc4c546d69c6e30eae7189919b",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "6c8290bc4c546d69c6e30eae7189919b",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "使用日期表达"
                    },
                    "totalSessions": 5,
                    "debugName": "日期 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "cf31f2642da8d24cffdbf4e2e4854dc7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "59a6083d2904f6a7fa00eb8d0f443968",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 53",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "84a7b84567d111abe570eb2f74e28882",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述动物"
                    },
                    "totalSessions": 5,
                    "debugName": "动物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "25059118972f32dee911db0a2fdc7c7e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "84a2dc5181b21f3b82a11a77497c8852"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 42",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "753fab463d402c1e80bc59bfb8788435",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 26
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "f5945b45236e5f5b0cf8ac487cd8aed7",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "84a2dc5181b21f3b82a11a77497c8852"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 26",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/6dc3a81a63e34c0c141edd66d8a878c0045f6d1357bc8580572ca27a19dbe011ea4973310fa779e5121ff0e863bfed565ddfe5269965ac14acf2b09afae71df5/1.json"
            },
            "teachingObjective": "谈论亚文化",
            "cefrLevel": null
        },
        {
            "unitIndex": 27,
            "levels": [
                {
                    "id": "cb8264bc3578b4b7b8386c986dae43f2",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 27
                    },
                    "pathLevelClientData": {
                        "unitIndex": 27,
                        "skillIds": [
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "f5945b45236e5f5b0cf8ac487cd8aed7",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "6c8290bc4c546d69c6e30eae7189919b",
                            "84a2dc5181b21f3b82a11a77497c8852"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "亚文化",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c1d7c0c44bc86870b8c203b05b9badd0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "7ea1fab3c1474877880196e5370f8cb3",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述亲戚"
                    },
                    "totalSessions": 5,
                    "debugName": "人 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2305fc63f73b91a25403d96a6b4b222d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "2f05c47c9e88b3d9e5c0da875c742a72",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "2f05c47c9e88b3d9e5c0da875c742a72",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论奥运会与运动"
                    },
                    "totalSessions": 5,
                    "debugName": "奥运会",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2458a1da6e028c0aff4af13390e85483",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "2f05c47c9e88b3d9e5c0da875c742a72",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "2f05c47c9e88b3d9e5c0da875c742a72"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 43",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e707c5a9a077deac4de67368dc409c7e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "2f05c47c9e88b3d9e5c0da875c742a72",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 54",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "062c5da9fd725336f2bb06f24f0f98a0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述动物"
                    },
                    "totalSessions": 5,
                    "debugName": "动物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8ccb563ab63401548080a0e21e2a4fb3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "59a6083d2904f6a7fa00eb8d0f443968",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "59a6083d2904f6a7fa00eb8d0f443968",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论亚文化"
                    },
                    "totalSessions": 5,
                    "debugName": "亚文化",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8d751209feab4fe8f64e17991f4f093b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "给出建议"
                    },
                    "totalSessions": 6,
                    "debugName": "建议",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "21ec93c7823b066bc56766ae4d02f09c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 55",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "6cc27f7c6343de5f2861a64b5062a30d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "cd44e21fd6fc7930ae089546b2b9f1ab"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 44",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "809074cfd26f83b46013e2a92def9cd9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 27
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "cd44e21fd6fc7930ae089546b2b9f1ab"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 27",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/9ce4fcf1818a77e0e4dc2467333e9b59842d76e32e27cbbb92da32bde997955944da5568c85ec595cab92b4387f37242d1ce923b50181a0e8c242d2d8968a75c/1.json"
            },
            "teachingObjective": "谈论奥运会与运动",
            "cefrLevel": null
        },
        {
            "unitIndex": 28,
            "levels": [
                {
                    "id": "160a51c238f174c2979d7aa3dde757af",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 28
                    },
                    "pathLevelClientData": {
                        "unitIndex": 28,
                        "skillIds": [
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "cd44e21fd6fc7930ae089546b2b9f1ab"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "奥运会",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "984c31a0d6f8dbb5a93da49d60b4d1d0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "84a2dc5181b21f3b82a11a77497c8852",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述动物"
                    },
                    "totalSessions": 5,
                    "debugName": "动物",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f8f2da33b0a3772fa7e27a9c6c461ec5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1362ad4c6f845469d698c1b11f774f0b",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "1362ad4c6f845469d698c1b11f774f0b",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论购物付钱"
                    },
                    "totalSessions": 6,
                    "debugName": "购物 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "7316c8fa0e6e55a5da67bc959d705900",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1362ad4c6f845469d698c1b11f774f0b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 56",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ff4d9793e4f322427da7b30ee74b2f6c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1362ad4c6f845469d698c1b11f774f0b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "1362ad4c6f845469d698c1b11f774f0b"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 45",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e6e6e7fe6ad27e8bde806e81ccd2fd77",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "给出建议"
                    },
                    "totalSessions": 6,
                    "debugName": "建议",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a0ca2c030984b08ef1c170539c77a675",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "2f05c47c9e88b3d9e5c0da875c742a72",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "2f05c47c9e88b3d9e5c0da875c742a72",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论奥运会与运动"
                    },
                    "totalSessions": 5,
                    "debugName": "奥运会",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "21b3ff795eb97d27c6598587b46f2334",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1362ad4c6f845469d698c1b11f774f0b",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 57",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "2c72232a12d2423b13bb599d21e10ef0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "020ab7c40a8b715219794aab5a6b3211",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "020ab7c40a8b715219794aab5a6b3211",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "认识动词的变形"
                    },
                    "totalSessions": 6,
                    "debugName": "娱乐",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "93cbf686c0f7a5dffcbaf2dabbfc598f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "020ab7c40a8b715219794aab5a6b3211",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "020ab7c40a8b715219794aab5a6b3211"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 46",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "4e1708e948a1c4c15ae4f49eb0b5dc7e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "020ab7c40a8b715219794aab5a6b3211",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 28
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "020ab7c40a8b715219794aab5a6b3211"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 28",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/12dc2d3045e7ada67ea71786e0ba86dee168c3170ae0f14c148ec325de8d92873410765b07326c3394b621fa5363d748d0389e34717c86a57f2dea73ab78aac2/1.json"
            },
            "teachingObjective": "谈论购物付钱",
            "cefrLevel": null
        },
        {
            "unitIndex": 29,
            "levels": [
                {
                    "id": "627f512d6b8f8c34982bf773e41e9d53",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 29
                    },
                    "pathLevelClientData": {
                        "unitIndex": 29,
                        "skillIds": [
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "020ab7c40a8b715219794aab5a6b3211"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "购物 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "eaedbfa5e1995cb5485541ff1bb32c80",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "cd44e21fd6fc7930ae089546b2b9f1ab",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "给出建议"
                    },
                    "totalSessions": 6,
                    "debugName": "建议",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d0f3a65454d01cdc8cb78afee9e1f885",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "020ab7c40a8b715219794aab5a6b3211",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 58",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "f936d18a2b5fe9c5614ee633a77e9411",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "dff7c28825b1f9518fea22da926d2dac",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "dff7c28825b1f9518fea22da926d2dac",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论搭乘交通工具出游"
                    },
                    "totalSessions": 6,
                    "debugName": "旅游",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "78fa09e2c736018f62964187a6eec397",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "dff7c28825b1f9518fea22da926d2dac",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "dff7c28825b1f9518fea22da926d2dac"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 47",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "2ad3772f2fe12a3e21562f1c06d4d1cb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "020ab7c40a8b715219794aab5a6b3211",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "020ab7c40a8b715219794aab5a6b3211",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "认识动词的变形"
                    },
                    "totalSessions": 6,
                    "debugName": "娱乐",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "90c3ea4eea4e5c24fa0d978c61e043fe",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1362ad4c6f845469d698c1b11f774f0b",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "1362ad4c6f845469d698c1b11f774f0b",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论购物付钱"
                    },
                    "totalSessions": 6,
                    "debugName": "购物 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3619c667a7e054d9331e7fd9a9944357",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "7433bca530faf7178471bc1c2944e3c6",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "7433bca530faf7178471bc1c2944e3c6",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述做得到的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "能力",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9d9f4e131252687e10af5efce431df4f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "7433bca530faf7178471bc1c2944e3c6",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 59",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "1321cf0930f03c0ca61e899341152b6b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "7433bca530faf7178471bc1c2944e3c6",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "020ab7c40a8b715219794aab5a6b3211",
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "7433bca530faf7178471bc1c2944e3c6"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 48",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "80c9d40bf297eb825ad95f732985b0ee",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "7433bca530faf7178471bc1c2944e3c6",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 29
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "dff7c28825b1f9518fea22da926d2dac",
                            "020ab7c40a8b715219794aab5a6b3211",
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "7433bca530faf7178471bc1c2944e3c6"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 29",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/7b5f90fbd40f17bdeef21cac7ea5fa896210f6b42d144a1e603faa0ee075c5e60f7fc4db6cb8fc2f86675e0b56902a01e4e8d99713323e16d266424adeb99a2b/1.json"
            },
            "teachingObjective": "谈论搭乘交通工具出游",
            "cefrLevel": null
        },
        {
            "unitIndex": 30,
            "levels": [
                {
                    "id": "d747e4d9de29ab1e8bd2e5209fc1b5d1",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 30
                    },
                    "pathLevelClientData": {
                        "unitIndex": 30,
                        "skillIds": [
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "dff7c28825b1f9518fea22da926d2dac",
                            "020ab7c40a8b715219794aab5a6b3211",
                            "1362ad4c6f845469d698c1b11f774f0b",
                            "7433bca530faf7178471bc1c2944e3c6"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "旅游",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "56eb3f1d5bb039d075a01a3830d5d3d7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "020ab7c40a8b715219794aab5a6b3211",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "020ab7c40a8b715219794aab5a6b3211",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "认识动词的变形"
                    },
                    "totalSessions": 6,
                    "debugName": "娱乐",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f3c09cf7c0dd8669d9a8db29ba1ad2a0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "19f98f631d3d0ba58de589143122466d",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "19f98f631d3d0ba58de589143122466d",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论能做的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "能力 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9ef5ed9fffc23697840afa7aa5216ff2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "19f98f631d3d0ba58de589143122466d",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "dff7c28825b1f9518fea22da926d2dac",
                            "020ab7c40a8b715219794aab5a6b3211",
                            "19f98f631d3d0ba58de589143122466d"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 49",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7fcfaeb6881c4dd4e522764edd1855c5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "19f98f631d3d0ba58de589143122466d",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 60",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "aa8b046b3d56275ad40ec5aac0250016",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "7433bca530faf7178471bc1c2944e3c6",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "7433bca530faf7178471bc1c2944e3c6",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述做得到的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "能力",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d9785fac850b2f2f45144a89a13fd41b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "dff7c28825b1f9518fea22da926d2dac",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "dff7c28825b1f9518fea22da926d2dac",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论搭乘交通工具出游"
                    },
                    "totalSessions": 6,
                    "debugName": "旅游",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8e1cb81c3963d0e4910258d7092d2d05",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "19f98f631d3d0ba58de589143122466d",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 61",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "65163dc307bf6ea6bdecf3cea5b1a523",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "25d997f16eb88f1fce74702500b395aa",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "25d997f16eb88f1fce74702500b395aa",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "叙述容易与不容易做的事"
                    },
                    "totalSessions": 6,
                    "debugName": "能力 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5babc6a09e1ed866e54a88173c369c11",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "25d997f16eb88f1fce74702500b395aa",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "7433bca530faf7178471bc1c2944e3c6",
                            "dff7c28825b1f9518fea22da926d2dac",
                            "25d997f16eb88f1fce74702500b395aa"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 50",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f1fe9a2131a06a4712e653cdb10a4aa9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "25d997f16eb88f1fce74702500b395aa",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 30
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "dff7c28825b1f9518fea22da926d2dac",
                            "020ab7c40a8b715219794aab5a6b3211",
                            "19f98f631d3d0ba58de589143122466d",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "dff7c28825b1f9518fea22da926d2dac",
                            "25d997f16eb88f1fce74702500b395aa"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 30",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/62bbd5f58ce1b84e988d74a2afb8609c231302af35fd39b8d1fe9f5415a13c60bb305dcc7b165a300dfe92d9e5240b24bb65dc3a0e7d5be5bef4b6a3b457ca11/1.json"
            },
            "teachingObjective": "谈论能做的事情",
            "cefrLevel": null
        },
        {
            "unitIndex": 31,
            "levels": [
                {
                    "id": "ac7c9e155685fe1a89027bfec3a07aed",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 31
                    },
                    "pathLevelClientData": {
                        "unitIndex": 31,
                        "skillIds": [
                            "dff7c28825b1f9518fea22da926d2dac",
                            "020ab7c40a8b715219794aab5a6b3211",
                            "19f98f631d3d0ba58de589143122466d",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "dff7c28825b1f9518fea22da926d2dac",
                            "25d997f16eb88f1fce74702500b395aa"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "能力 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "7e8c58c3169ece3a587480a5c9178284",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "7433bca530faf7178471bc1c2944e3c6",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "7433bca530faf7178471bc1c2944e3c6",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述做得到的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "能力",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "14f9a788da7b6eb5cf00ffb91ab88795",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "出门旅游"
                    },
                    "totalSessions": 6,
                    "debugName": "旅游 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "98b0d9f3221f78f43ed7040fca39351a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 62",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "982735e47639c7665623c8933a9de1d7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "19f98f631d3d0ba58de589143122466d",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "1d159716d3b2cde4ad6203341e3f3131"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 51",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e3826ef6e2d6b1e095e4a532d1920d0d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "25d997f16eb88f1fce74702500b395aa",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "25d997f16eb88f1fce74702500b395aa",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "叙述容易与不容易做的事"
                    },
                    "totalSessions": 6,
                    "debugName": "能力 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3bde4687d4bbdb36b80b3cb4d421eec4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "19f98f631d3d0ba58de589143122466d",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "19f98f631d3d0ba58de589143122466d",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论能做的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "能力 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1ffbe8b71cdabca6b4be0906c2cfdd93",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-パスポート",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-パスポート",
                        "mode": "read",
                        "storyName": "护照",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "The Passport",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "79ca7855ba725dbcde13c0731edb28df",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 63",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "b20ae97e6803177998da38f591d74dec",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "25d997f16eb88f1fce74702500b395aa",
                            "19f98f631d3d0ba58de589143122466d"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 52",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "b42ead2289ed0482f68084651867e3d5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 31
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "19f98f631d3d0ba58de589143122466d",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "25d997f16eb88f1fce74702500b395aa",
                            "19f98f631d3d0ba58de589143122466d"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 31",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/8d5a35e068e69383a5256cc89b4acc88913cae9151bbbe6003bf7b9099d9c3dc3e5e84a38699559f947173ce86d928eef82cf44c267a401b4890ea65180156b9/1.json"
            },
            "teachingObjective": "出门旅游",
            "cefrLevel": null
        },
        {
            "unitIndex": 32,
            "levels": [
                {
                    "id": "39ab1d3e9fa8de52cd4a96fcdd72ed39",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 32
                    },
                    "pathLevelClientData": {
                        "unitIndex": 32,
                        "skillIds": [
                            "19f98f631d3d0ba58de589143122466d",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "25d997f16eb88f1fce74702500b395aa",
                            "19f98f631d3d0ba58de589143122466d"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "记忆",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "65467ce8fc2b1b3bd438ad85c4a590ea",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "出门旅游"
                    },
                    "totalSessions": 6,
                    "debugName": "旅游 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e00ee046f65992f345fdb192985b9985",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4a56e89bb8eb633a5f9d35799f644ceb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 64",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "cfebdc31c291ed447b6eba66398804bd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "25d997f16eb88f1fce74702500b395aa",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "25d997f16eb88f1fce74702500b395aa",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "叙述容易与不容易做的事"
                    },
                    "totalSessions": 6,
                    "debugName": "能力 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e626fb17a55ad3690d953ac912cbaefc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "4a56e89bb8eb633a5f9d35799f644ceb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "25d997f16eb88f1fce74702500b395aa"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 53",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a9c54cca5ab72ccde1b58b1c239e3dff",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "27adefaf109428fdb05f591d6d663ce5",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "27adefaf109428fdb05f591d6d663ce5",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "使用动词的否定形式"
                    },
                    "totalSessions": 6,
                    "debugName": "活动 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e910a1fd4a6cea98914ea2a6902926a0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4a56e89bb8eb633a5f9d35799f644ceb",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "4a56e89bb8eb633a5f9d35799f644ceb",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "认识动词过去式肯定形式"
                    },
                    "totalSessions": 6,
                    "debugName": "记忆",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a50e2eaed54b3fd10a5612c202c1dc1c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "27adefaf109428fdb05f591d6d663ce5",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 65",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "abb22be07a47a14610f524f9ce722751",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "1d159716d3b2cde4ad6203341e3f3131",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "出门旅游"
                    },
                    "totalSessions": 6,
                    "debugName": "旅游 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a5aea4ea2ebd9429243ffba0bb5f20bf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "27adefaf109428fdb05f591d6d663ce5",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "27adefaf109428fdb05f591d6d663ce5",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "1d159716d3b2cde4ad6203341e3f3131"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 54",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9c41a2dcc7001712aefc16825fc57afe",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "27adefaf109428fdb05f591d6d663ce5",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 32
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "25d997f16eb88f1fce74702500b395aa",
                            "27adefaf109428fdb05f591d6d663ce5",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "1d159716d3b2cde4ad6203341e3f3131"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 32",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/52601dc1a052d5c2d55960eb9b80584c727ae7c76933e52d4831d8325c595a28327a5e9be680c11f65eba046f7bb4daeef41f43236893cea8fbc896da68d9b15/2.json"
            },
            "teachingObjective": "认识动词过去式肯定形式",
            "cefrLevel": null
        },
        {
            "unitIndex": 33,
            "levels": [
                {
                    "id": "4a7e1c073e0b483bac2b0e0ffbcb4036",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 33
                    },
                    "pathLevelClientData": {
                        "unitIndex": 33,
                        "skillIds": [
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "25d997f16eb88f1fce74702500b395aa",
                            "27adefaf109428fdb05f591d6d663ce5",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "1d159716d3b2cde4ad6203341e3f3131"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "节假日",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2b23bdff4e80f8d49bcd5b4df82bd4f6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "27adefaf109428fdb05f591d6d663ce5",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "27adefaf109428fdb05f591d6d663ce5",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "使用动词的否定形式"
                    },
                    "totalSessions": 6,
                    "debugName": "活动 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "46300daa6150dc4f80af0656f023f44f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-エディせんせい",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-エディせんせい",
                        "mode": "read",
                        "storyName": "艾迪医生",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "Doctor Eddy",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "7ba851acacc9c8f0074848f1e3966c98",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "50c7e5aaf02c66f7de1e25bb3c5efc69",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "50c7e5aaf02c66f7de1e25bb3c5efc69",
                            "27adefaf109428fdb05f591d6d663ce5"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 55",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ec4dbd377e816f943f49a2e13c984948",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "50c7e5aaf02c66f7de1e25bb3c5efc69",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 66",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "39f4aee83ae90ca22ce60b1965f0233e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "4a56e89bb8eb633a5f9d35799f644ceb",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "4a56e89bb8eb633a5f9d35799f644ceb",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "认识动词过去式肯定形式"
                    },
                    "totalSessions": 6,
                    "debugName": "记忆",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "947e37fbc8101fdeda489a89573b23c3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论帮助他人"
                    },
                    "totalSessions": 6,
                    "debugName": "恩惠",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2dc3cc9d21a33d77720dd27314939ca3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "50c7e5aaf02c66f7de1e25bb3c5efc69",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "50c7e5aaf02c66f7de1e25bb3c5efc69",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讨论节日和假期"
                    },
                    "totalSessions": 6,
                    "debugName": "节假日",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4391a583a32cc18ed5497448fbbc17d2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 67",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5e696f8e80bd4db32e3ab3d289904ba8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "50c7e5aaf02c66f7de1e25bb3c5efc69"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 56",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "cd25e9e0106cc39a4c93fa8b3c9bc536",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 33
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "50c7e5aaf02c66f7de1e25bb3c5efc69",
                            "27adefaf109428fdb05f591d6d663ce5",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "50c7e5aaf02c66f7de1e25bb3c5efc69"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 33",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/41bc35ab21f82aee1b40abf9f4857243580beec4394ed8571967ddec3bf38a7c5623aab76b69e6afe18d1ecd61c05693867c963f14be3ccadeac3173b28744dc/2.json"
            },
            "teachingObjective": "讨论节日和假期",
            "cefrLevel": null
        },
        {
            "unitIndex": 34,
            "levels": [
                {
                    "id": "3d155aaf5cd8210e97d56f4129848479",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 34
                    },
                    "pathLevelClientData": {
                        "unitIndex": 34,
                        "skillIds": [
                            "50c7e5aaf02c66f7de1e25bb3c5efc69",
                            "27adefaf109428fdb05f591d6d663ce5",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "50c7e5aaf02c66f7de1e25bb3c5efc69"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "活动 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "cdd00d8de569666e60d010d95f0fe928",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "0511f3638177aa1254a71d405f0c4e20",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "0511f3638177aa1254a71d405f0c4e20",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论大自然"
                    },
                    "totalSessions": 6,
                    "debugName": "大自然 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "19bc0e0ba1cac507ddc7f34237c9df44",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论帮助他人"
                    },
                    "totalSessions": 6,
                    "debugName": "恩惠",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a3ea3cf0fd698cffcb54c2a22df244d5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "0511f3638177aa1254a71d405f0c4e20",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 68",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "0cc01d8696cbedb43ab579a9abeec6c0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "0511f3638177aa1254a71d405f0c4e20",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "27adefaf109428fdb05f591d6d663ce5",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "2581bd574ff56e95a11ccbba1fa3f654"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 57",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "6faff522a842ac97d86a0a8d50d1bca5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "50c7e5aaf02c66f7de1e25bb3c5efc69",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "50c7e5aaf02c66f7de1e25bb3c5efc69",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讨论节日和假期"
                    },
                    "totalSessions": 6,
                    "debugName": "节假日",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4bbbd633e14e171d880b86a853a51613",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "在便利店买东西"
                    },
                    "totalSessions": 6,
                    "debugName": "便利店",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "de504bfe85b2e70896cb6b14dea61089",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 69",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "6add3598898e90636bb85663a95d07b7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-あたらしい-コート",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-あたらしい-コート",
                        "mode": "read",
                        "storyName": "新外套",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "A New Coat",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "dd7680ce3f68921e391ee775513e938a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "50c7e5aaf02c66f7de1e25bb3c5efc69",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 58",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5b481124805864cd20021ea894169275",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 34
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "27adefaf109428fdb05f591d6d663ce5",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "50c7e5aaf02c66f7de1e25bb3c5efc69",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 34",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/fab19a9a86f8099bb0f902cb4a03208c472dab6394430005f665d8634ffc4cbf07d75b6d867811b3e3054c56110661331e11a1b2550de40b8c50bf6674763923/2.json"
            },
            "teachingObjective": "谈论大自然",
            "cefrLevel": null
        },
        {
            "unitIndex": 35,
            "levels": [
                {
                    "id": "e562be64f2f596b4dec84dd4ce887030",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 35
                    },
                    "pathLevelClientData": {
                        "unitIndex": 35,
                        "skillIds": [
                            "27adefaf109428fdb05f591d6d663ce5",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "50c7e5aaf02c66f7de1e25bb3c5efc69",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "大自然 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2f7515ffcad3efb2cac2dc57171c59e9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "2581bd574ff56e95a11ccbba1fa3f654",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论帮助他人"
                    },
                    "totalSessions": 6,
                    "debugName": "恩惠",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c9babb9dcfb9e54f2cb0014885717ee0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 70",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "a17ceaba07fd4d29b16e6a059c95fc04",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "625593ea8064dace3765b74e245f6d2e",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "625593ea8064dace3765b74e245f6d2e",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "在餐厅用餐"
                    },
                    "totalSessions": 6,
                    "debugName": "餐馆 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2293ad17d2f3cfee578fa41851fe8258",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "625593ea8064dace3765b74e245f6d2e",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "0511f3638177aa1254a71d405f0c4e20",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "625593ea8064dace3765b74e245f6d2e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 59",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7ca9369b67d8325ed16afecd8307c1e8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "在便利店买东西"
                    },
                    "totalSessions": 6,
                    "debugName": "便利店",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "926aaffa0275299295aa628bff46d988",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "0511f3638177aa1254a71d405f0c4e20",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "0511f3638177aa1254a71d405f0c4e20",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论大自然"
                    },
                    "totalSessions": 6,
                    "debugName": "大自然 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c1e484cc0a43aac568b2310fe959c590",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讨论自然生态"
                    },
                    "totalSessions": 6,
                    "debugName": "生态",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "953022dfc0436d94c3ecaebc615c6fa2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 71",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "4caa5fa0978fabfeae974a8fe64a8efb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "e8d62283eeca13ff88c5ba2375eb887e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 60",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a49232099ac26ed88877fadb86989074",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 35
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "0511f3638177aa1254a71d405f0c4e20",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "625593ea8064dace3765b74e245f6d2e",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "e8d62283eeca13ff88c5ba2375eb887e"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 35",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/633b71400a348858ed1edb456e3e9ac983ea53f9c6cca036ca9cda7cbd4807a90cb0a12737f37f2e61a7cb38ec3ee0bae2057c48b4dbf6616c2df2b132a31d24/2.json"
            },
            "teachingObjective": "在餐厅用餐",
            "cefrLevel": null
        },
        {
            "unitIndex": 36,
            "levels": [
                {
                    "id": "8d056f0620ccc07101c460da4fdc8918",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 36
                    },
                    "pathLevelClientData": {
                        "unitIndex": 36,
                        "skillIds": [
                            "0511f3638177aa1254a71d405f0c4e20",
                            "2581bd574ff56e95a11ccbba1fa3f654",
                            "625593ea8064dace3765b74e245f6d2e",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "e8d62283eeca13ff88c5ba2375eb887e"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "餐馆 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4fe0c0979da4c9bf67c4c4ae34ea9a91",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "在便利店买东西"
                    },
                    "totalSessions": 6,
                    "debugName": "便利店",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d7d8684e10c9c22739066f4063352d75",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-てんこうせい",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-てんこうせい",
                        "mode": "read",
                        "storyName": "转学生",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "The New Student",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "efde3736d2408cbce4cdb534379e694e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "625593ea8064dace3765b74e245f6d2e",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 61",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e9da052b4c2981c865ffbc70636e6b5c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 72",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "3281f921a9644e29f836bc46c9c042df",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f60f066d323590cc8f182a40ba390c78",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "f60f066d323590cc8f182a40ba390c78",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论自然资源"
                    },
                    "totalSessions": 6,
                    "debugName": "资源",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6ead34ec5ac0ee2a4104b2478819af13",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讨论自然生态"
                    },
                    "totalSessions": 6,
                    "debugName": "生态",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a08c2f70b1cd98ce4f4eb71bc6b01de2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f60f066d323590cc8f182a40ba390c78",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 73",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5cacbb227703ad0d1e20df4eb9e78263",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "625593ea8064dace3765b74e245f6d2e",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "625593ea8064dace3765b74e245f6d2e",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "在餐厅用餐"
                    },
                    "totalSessions": 6,
                    "debugName": "餐馆 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1aa051147befa34dc80a9df9a655e866",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f60f066d323590cc8f182a40ba390c78",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f60f066d323590cc8f182a40ba390c78",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "625593ea8064dace3765b74e245f6d2e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 62",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "67d24999b22f4348753b8f636f851180",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f60f066d323590cc8f182a40ba390c78",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 36
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "625593ea8064dace3765b74e245f6d2e",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "f60f066d323590cc8f182a40ba390c78",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "625593ea8064dace3765b74e245f6d2e"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 36",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/472a14605b02fe0e06de2627c89a681932f60f68ea46d2f015ef4827b16b80d63340dc0e1269e15e06cca68fde41981f3974cabde09d3547aef4e1e0ae097b2d/1.json"
            },
            "teachingObjective": "谈论自然资源",
            "cefrLevel": null
        },
        {
            "unitIndex": 37,
            "levels": [
                {
                    "id": "cde9ec926f78fadb63199089ed776e3f",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 37
                    },
                    "pathLevelClientData": {
                        "unitIndex": 37,
                        "skillIds": [
                            "625593ea8064dace3765b74e245f6d2e",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "f60f066d323590cc8f182a40ba390c78",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "625593ea8064dace3765b74e245f6d2e"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "样态",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "fcbbb834a87f5c8fd0e740513d8a0a2c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f60f066d323590cc8f182a40ba390c78",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "f60f066d323590cc8f182a40ba390c78",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论自然资源"
                    },
                    "totalSessions": 6,
                    "debugName": "资源",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4a2ea7199f8a4d4d1f4f317eed4c7905",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "e8d62283eeca13ff88c5ba2375eb887e",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讨论自然生态"
                    },
                    "totalSessions": 6,
                    "debugName": "生态",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b02226904409d0889fa58ab304151f05",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "427db9f90637a60fa3d9a7c0e57daef7",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 74",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "d4d4093109f1d4689ee808de7440f27c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "427db9f90637a60fa3d9a7c0e57daef7",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "427db9f90637a60fa3d9a7c0e57daef7",
                            "f60f066d323590cc8f182a40ba390c78",
                            "e8d62283eeca13ff88c5ba2375eb887e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 63",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "1c349c3d95ad8b57f26da12d8f2f935e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "230e67eeb312530072eaee1427d054be",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "230e67eeb312530072eaee1427d054be",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "表达感受"
                    },
                    "totalSessions": 6,
                    "debugName": "感受 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8fcb17f4ec45f906e72c363a97d452cf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "427db9f90637a60fa3d9a7c0e57daef7",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "427db9f90637a60fa3d9a7c0e57daef7",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "叙述人事物的状态"
                    },
                    "totalSessions": 6,
                    "debugName": "样态",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "7ae498babee3bf1ca4da86f4abf65ccb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ジュニアの-しつもん",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ジュニアの-しつもん",
                        "mode": "read",
                        "storyName": "朱朱的问题",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "Junior's Question",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "b7986807c0b2e68c0e6ea1e531f20547",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "230e67eeb312530072eaee1427d054be",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 75",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "539c3865812f3834c9bfd7a60fe602bb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "230e67eeb312530072eaee1427d054be",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "230e67eeb312530072eaee1427d054be",
                            "427db9f90637a60fa3d9a7c0e57daef7"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 64",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "4116b27778fa368b44095e9d15d86654",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "230e67eeb312530072eaee1427d054be",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 37
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "427db9f90637a60fa3d9a7c0e57daef7",
                            "f60f066d323590cc8f182a40ba390c78",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "230e67eeb312530072eaee1427d054be",
                            "427db9f90637a60fa3d9a7c0e57daef7"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 37",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/998c56dcd124dd64252900e29925f2f01ed922187870c8c1c9b6b07fb9b49b9740b7c1baacc55d9f261d88d08e2c43eba110a57e4c6de91af60e268a86febdf1/1.json"
            },
            "teachingObjective": "叙述人事物的状态",
            "cefrLevel": null
        },
        {
            "unitIndex": 38,
            "levels": [
                {
                    "id": "83a0d3c847e900deabd0c79cb850d75a",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 38
                    },
                    "pathLevelClientData": {
                        "unitIndex": 38,
                        "skillIds": [
                            "427db9f90637a60fa3d9a7c0e57daef7",
                            "f60f066d323590cc8f182a40ba390c78",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "230e67eeb312530072eaee1427d054be",
                            "427db9f90637a60fa3d9a7c0e57daef7"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "资源",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f4f61196ed6982ea8aeb63aa8a842dda",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论可能性"
                    },
                    "totalSessions": 6,
                    "debugName": "可能性",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "23afaaea98070863cc583c0021a521ba",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 76",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "0abc662610b922f941e41ebcf4901cbc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "230e67eeb312530072eaee1427d054be",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "230e67eeb312530072eaee1427d054be",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "表达感受"
                    },
                    "totalSessions": 6,
                    "debugName": "感受 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5b55878b904619ee097b2934960297bd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f60f066d323590cc8f182a40ba390c78",
                            "b82b25ab68a12329aab3c8dd97d4cde2",
                            "230e67eeb312530072eaee1427d054be"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 65",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "728a77188ad3268a261c7d8bc4adda30",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "427db9f90637a60fa3d9a7c0e57daef7",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "427db9f90637a60fa3d9a7c0e57daef7",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "叙述人事物的状态"
                    },
                    "totalSessions": 6,
                    "debugName": "样态",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b83b574dbdb3d7a42f3209ac375f6642",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "说明可能发生的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "可能性 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6a0174dab09278a21eabeb5b6aafe7a2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 77",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "3de1e31138aca50b430e987bcdec094d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论可能性"
                    },
                    "totalSessions": 6,
                    "debugName": "可能性",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "72cd705f9d2b8758aaaad998968080ef",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "427db9f90637a60fa3d9a7c0e57daef7",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "b82b25ab68a12329aab3c8dd97d4cde2"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 66",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a918d70c537f81ee1c4246c0cc60ded5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 38
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f60f066d323590cc8f182a40ba390c78",
                            "b82b25ab68a12329aab3c8dd97d4cde2",
                            "230e67eeb312530072eaee1427d054be",
                            "427db9f90637a60fa3d9a7c0e57daef7",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "b82b25ab68a12329aab3c8dd97d4cde2"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 38",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/daf205569f2482c9d4c983e7bab1df2b9f65431d89f97009651a5e2554edb6f7c44f78693d74577d8b761a95134a4c559141ea1d84cb937cf26c9ffcea4064f8/1.json"
            },
            "teachingObjective": "谈论可能性",
            "cefrLevel": null
        },
        {
            "unitIndex": 39,
            "levels": [
                {
                    "id": "a85937e3e366df2d205b430f5d30bce5",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 39
                    },
                    "pathLevelClientData": {
                        "unitIndex": 39,
                        "skillIds": [
                            "f60f066d323590cc8f182a40ba390c78",
                            "b82b25ab68a12329aab3c8dd97d4cde2",
                            "230e67eeb312530072eaee1427d054be",
                            "427db9f90637a60fa3d9a7c0e57daef7",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "b82b25ab68a12329aab3c8dd97d4cde2"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "感受 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "375dad5f2974f15898e07b7f6e16660a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论烹饪"
                    },
                    "totalSessions": 6,
                    "debugName": "烹饪",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a181b90bc19b9f9ca30bfc86eac65380",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-えきまで",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-えきまで",
                        "mode": "read",
                        "storyName": "到车站！",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "To the Station!",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "15c1ccba37dadba4421c3844d1bda5f2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "230e67eeb312530072eaee1427d054be",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 67",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c14b7ec69f447934a787226dec163a09",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 78",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "f89333736852c9730d32c481b23127d0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "说明可能发生的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "可能性 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "cbba681bf43a527aa352a4c90d1c608e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "b82b25ab68a12329aab3c8dd97d4cde2",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论可能性"
                    },
                    "totalSessions": 6,
                    "debugName": "可能性",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "7274f17018fd5420449c5f4f8db09274",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述料理食材"
                    },
                    "totalSessions": 6,
                    "debugName": "食物 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "49f11f69cff2d995f15538ffe789fd2a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 79",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "b3c50d8f0ab47ed953d15747c0bbfa56",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "b82b25ab68a12329aab3c8dd97d4cde2",
                            "9a9c4deb63a65e2577aeec58a1d0b522"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 68",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "43b5d2515e22d4b95f73048b46fe0dc1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 39
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "230e67eeb312530072eaee1427d054be",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "b82b25ab68a12329aab3c8dd97d4cde2",
                            "9a9c4deb63a65e2577aeec58a1d0b522"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 39",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/e909b26476f2ec258f2b0da908c9e68e54572a85117564abf9d565e5b5e4b412d2a44cf197108867b6e4c2e21e6b4f9278bcf25949a4babaee9471eee903116b/1.json"
            },
            "teachingObjective": "谈论烹饪",
            "cefrLevel": null
        },
        {
            "unitIndex": 40,
            "levels": [
                {
                    "id": "240ebb1e179c822f94c5bd4ae2c1a239",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 40
                    },
                    "pathLevelClientData": {
                        "unitIndex": 40,
                        "skillIds": [
                            "230e67eeb312530072eaee1427d054be",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "b82b25ab68a12329aab3c8dd97d4cde2",
                            "9a9c4deb63a65e2577aeec58a1d0b522"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "烹饪",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "de27007f8ae35a2e5b1847eea1b3aa08",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "说明可能发生的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "可能性 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "430bfa03c927c240297f1eba7fd74dbf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讨论紧急情况"
                    },
                    "totalSessions": 6,
                    "debugName": "紧急情况",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "21ded01cd433fdf8ae6e27dec2386dc9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 80",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "28e18e962d6c50cf157cf623017f6ec8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "9d33ba466317e26b6c33f0b5df4ae975"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 69",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "cbb048aa53ec8f0a028d9cd7c559a76b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述料理食材"
                    },
                    "totalSessions": 6,
                    "debugName": "食物 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "23f5e557d07f8ae108e2bb55452bb8fd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论烹饪"
                    },
                    "totalSessions": 6,
                    "debugName": "烹饪",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8aefe4b9c3ad6944c6bb74b2704a95a3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 81",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "9a6c3e9679c23aead43d2af09d3e0f38",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ベジタリアン",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ベジタリアン",
                        "mode": "read",
                        "storyName": "素食主义者",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "The Vegetarian",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "c43ffd964b111b268246d740c7873ef0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 70",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "2038a21cbc9cb95b6b105767def4253f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 40
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 40",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/ba3c982f170159c7904b0c8d1c28adfa7bba0bd6f8419514bede91a1d0d287373e4b6f086a592f86e059ed4bbacc764b3d9c96d54c32c29e973f0ff353f3e3a9/1.json"
            },
            "teachingObjective": "讨论紧急情况",
            "cefrLevel": null
        },
        {
            "unitIndex": 41,
            "levels": [
                {
                    "id": "28a274cd07aafef53973f2a3455fdb1e",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 41
                    },
                    "pathLevelClientData": {
                        "unitIndex": 41,
                        "skillIds": [
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "交通 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "551f71e624fc246175468fb3aee893c9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讨论紧急情况"
                    },
                    "totalSessions": 6,
                    "debugName": "紧急情况",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "826a187cb716112affc9bd1aa769761a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1ede4b0d77818c0d6dcc88fd20e4a557",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 82",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "6a471394ef9d301843b72bc8a36e9ef4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "9a9c4deb63a65e2577aeec58a1d0b522",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述料理食材"
                    },
                    "totalSessions": 6,
                    "debugName": "食物 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9f8665afc68beda2aea11eeb2b4cf35f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1ede4b0d77818c0d6dcc88fd20e4a557",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "9a9c4deb63a65e2577aeec58a1d0b522"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 71",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "8919f7e30ce91651212c2c8864ece609",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5df109bc085b833999f97c494bece25b",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "5df109bc085b833999f97c494bece25b",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述灾害发生"
                    },
                    "totalSessions": 6,
                    "debugName": "灾害",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e18fc0878b1fc06bf22fd5436c0a02ac",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1ede4b0d77818c0d6dcc88fd20e4a557",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "1ede4b0d77818c0d6dcc88fd20e4a557",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "搭乘交通工具"
                    },
                    "totalSessions": 6,
                    "debugName": "交通 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "fdd64f413dc8e6f08c9fa1e81c409952",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "9d33ba466317e26b6c33f0b5df4ae975",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讨论紧急情况"
                    },
                    "totalSessions": 6,
                    "debugName": "紧急情况",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "bdfd4ca812000e66b38ed24bcef18653",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5df109bc085b833999f97c494bece25b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 83",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "fa5508462e424450a638d725db9d965e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5df109bc085b833999f97c494bece25b",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5df109bc085b833999f97c494bece25b",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "9d33ba466317e26b6c33f0b5df4ae975"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 72",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e528dfeac9be2c8dd18a2fbfbb98cc0b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5df109bc085b833999f97c494bece25b",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 41
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5df109bc085b833999f97c494bece25b",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "9d33ba466317e26b6c33f0b5df4ae975"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 41",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/9e4960f15212fc0fd4c423e57bb00fbdc5fb586f687420715b5e6693b87d8ba5b8f55666a24eeedd329f77e7842c3283a89186fe7adf3708b40a5d5edb7593f1/2.json"
            },
            "teachingObjective": "搭乘交通工具",
            "cefrLevel": null
        },
        {
            "unitIndex": 42,
            "levels": [
                {
                    "id": "cef09abb3c1ee4c4c2e55078ce32b076",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 42
                    },
                    "pathLevelClientData": {
                        "unitIndex": 42,
                        "skillIds": [
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5df109bc085b833999f97c494bece25b",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "9d33ba466317e26b6c33f0b5df4ae975"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "旅游 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6e58504fa74f268621fc7284c8934c70",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5df109bc085b833999f97c494bece25b",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "5df109bc085b833999f97c494bece25b",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述灾害发生"
                    },
                    "totalSessions": 6,
                    "debugName": "灾害",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "27f3bb012c3532de2f7b0cbaf2051686",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-バケーションの-ふく",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-バケーションの-ふく",
                        "mode": "read",
                        "storyName": "度假的衣服",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "Vacation Clothes",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "ba104b97901fefe56bcaa79cc54f5be4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "a03d99668b6114d5d098d6bb6e6da8f8",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "a03d99668b6114d5d098d6bb6e6da8f8",
                            "5df109bc085b833999f97c494bece25b"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 73",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "8d7c88dcb0a04d923d1ac7417ed98b13",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "a03d99668b6114d5d098d6bb6e6da8f8",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 84",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "4f88edb1fb8240fe4c580c93b9bc7f65",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1ede4b0d77818c0d6dcc88fd20e4a557",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "1ede4b0d77818c0d6dcc88fd20e4a557",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "搭乘交通工具"
                    },
                    "totalSessions": 6,
                    "debugName": "交通 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "dee9dea2918cf6ec35250adc2c3a35c1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "186e55d4504350aea665de77c54ae858",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "186e55d4504350aea665de77c54ae858",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讨论教育"
                    },
                    "totalSessions": 6,
                    "debugName": "教育",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ab5cc019d13c0df3c319310a80b08c46",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "186e55d4504350aea665de77c54ae858",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 85",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "60713673143556a2cbffcefae99760fa",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "a03d99668b6114d5d098d6bb6e6da8f8",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "a03d99668b6114d5d098d6bb6e6da8f8",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "在旅行时与人交流"
                    },
                    "totalSessions": 6,
                    "debugName": "旅游 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f4e001dd9d5a96188495b6622248524d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "186e55d4504350aea665de77c54ae858",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "186e55d4504350aea665de77c54ae858",
                            "a03d99668b6114d5d098d6bb6e6da8f8"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 74",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e64a9ff4e86a3ada568491a1c2a38eb8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "186e55d4504350aea665de77c54ae858",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 42
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "a03d99668b6114d5d098d6bb6e6da8f8",
                            "5df109bc085b833999f97c494bece25b",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "186e55d4504350aea665de77c54ae858",
                            "a03d99668b6114d5d098d6bb6e6da8f8"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 42",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/1015c3705758f139807c60d4dc641b181490d8200d00ca415cca97751cf76bb9f8f6ef82c51f5490c1665c228389eb0d62a70fc62832201de98699cb9228a7a8/2.json"
            },
            "teachingObjective": "在旅行时与人交流",
            "cefrLevel": null
        },
        {
            "unitIndex": 43,
            "levels": [
                {
                    "id": "42c18cf12acb2403a750434f6272287f",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 43
                    },
                    "pathLevelClientData": {
                        "unitIndex": 43,
                        "skillIds": [
                            "a03d99668b6114d5d098d6bb6e6da8f8",
                            "5df109bc085b833999f97c494bece25b",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "186e55d4504350aea665de77c54ae858",
                            "a03d99668b6114d5d098d6bb6e6da8f8"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "灾害",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "206fc5ef4d4f65b8c5c3f7efa7e630c6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "44083ba1c83af29901b1c508da98a282",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "44083ba1c83af29901b1c508da98a282",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述动物的数量"
                    },
                    "totalSessions": 6,
                    "debugName": "动物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "298ec917d32da25328e1660a20210097",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "186e55d4504350aea665de77c54ae858",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "186e55d4504350aea665de77c54ae858",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讨论教育"
                    },
                    "totalSessions": 6,
                    "debugName": "教育",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "dd7c8ecfda939102db736976ea7e6604",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "44083ba1c83af29901b1c508da98a282",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 86",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "2b9bdcd85fcc0199033bb5da8601f504",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "44083ba1c83af29901b1c508da98a282",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5df109bc085b833999f97c494bece25b",
                            "44083ba1c83af29901b1c508da98a282",
                            "186e55d4504350aea665de77c54ae858"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 75",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c6823d7b859261aaf8cf14c7ad433adc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "a03d99668b6114d5d098d6bb6e6da8f8",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "a03d99668b6114d5d098d6bb6e6da8f8",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "在旅行时与人交流"
                    },
                    "totalSessions": 6,
                    "debugName": "旅游 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ca6c83b468ee471bbd1a6722e0a816bb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "述说学校课业"
                    },
                    "totalSessions": 6,
                    "debugName": "教育 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "989021a72fec589de2065a1bae3d5907",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-よやく",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-よやく",
                        "mode": "read",
                        "storyName": "预订",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "The Reservation",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "52f6a578d11e981b5f0277a71b9c0f4a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 87",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "1442d64b920688352a8ca674d1fcadf5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "a03d99668b6114d5d098d6bb6e6da8f8",
                            "f3a24433f9a9d51aecbec2cd3d5462fe"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 76",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "53af8a53052bd0004aaeb4afc2042c5c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 43
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5df109bc085b833999f97c494bece25b",
                            "44083ba1c83af29901b1c508da98a282",
                            "186e55d4504350aea665de77c54ae858",
                            "a03d99668b6114d5d098d6bb6e6da8f8",
                            "f3a24433f9a9d51aecbec2cd3d5462fe"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 43",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/c82febc2dab5aa59cc67dcbfd8c9a99a733da60b16cccce2886cc3e5a8501ad48fb3e4a6a0a1907b1fcf7d853ea1922bd8f1365b910cf8084a55fc94ccc5f171/2.json"
            },
            "teachingObjective": "描述动物的数量",
            "cefrLevel": null
        },
        {
            "unitIndex": 44,
            "levels": [
                {
                    "id": "e96f76e33d84d87650b3b22b765c2e84",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 44
                    },
                    "pathLevelClientData": {
                        "unitIndex": 44,
                        "skillIds": [
                            "5df109bc085b833999f97c494bece25b",
                            "44083ba1c83af29901b1c508da98a282",
                            "186e55d4504350aea665de77c54ae858",
                            "a03d99668b6114d5d098d6bb6e6da8f8",
                            "f3a24433f9a9d51aecbec2cd3d5462fe"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "动物 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ed39929076b9d6f2e9252ecf8199c903",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "186e55d4504350aea665de77c54ae858",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "186e55d4504350aea665de77c54ae858",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讨论教育"
                    },
                    "totalSessions": 6,
                    "debugName": "教育",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "adef767188b8b4453d760eae7c430db5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 88",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ee02c7e0875c5cef8925e34efc374edd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5baae422dac3202f9ea22011b348437e",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "5baae422dac3202f9ea22011b348437e",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论工作"
                    },
                    "totalSessions": 6,
                    "debugName": "工作",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d2b50c84419a13d7bf197f949c99b9a9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5baae422dac3202f9ea22011b348437e",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "44083ba1c83af29901b1c508da98a282",
                            "186e55d4504350aea665de77c54ae858",
                            "5baae422dac3202f9ea22011b348437e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 77",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "956cb6986dd1b162f2d074b8c73ce26e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "述说学校课业"
                    },
                    "totalSessions": 6,
                    "debugName": "教育 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ca62a7d7d8d243367efa971f0ecb74eb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "44083ba1c83af29901b1c508da98a282",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "44083ba1c83af29901b1c508da98a282",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述动物的数量"
                    },
                    "totalSessions": 6,
                    "debugName": "动物 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e482b4aa1f1e005fe503a9c4e99fee5a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "5baae422dac3202f9ea22011b348437e",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 89",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "860e2b5450660ab9fc58e9919f5591cb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讲述工作细节"
                    },
                    "totalSessions": 6,
                    "debugName": "工作 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "0cdbe249327a96ad29720d854cd2122f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "44083ba1c83af29901b1c508da98a282",
                            "b99c224c4dd829652e0695810ba4d5aa"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 78",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d87bbdc956bffb5cfbad4e94bfb0024b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 44
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "44083ba1c83af29901b1c508da98a282",
                            "186e55d4504350aea665de77c54ae858",
                            "5baae422dac3202f9ea22011b348437e",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "44083ba1c83af29901b1c508da98a282",
                            "b99c224c4dd829652e0695810ba4d5aa"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 44",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/84603aecfe90e2b48a3b0a68a263e00dfa91af2191278d8549f6ea3d4ceb1fd8ec1659e233fb3d36d75ff755b41fed58d5c5ad168b71783b072b37044e8f934c/2.json"
            },
            "teachingObjective": "谈论工作",
            "cefrLevel": null
        },
        {
            "unitIndex": 45,
            "levels": [
                {
                    "id": "949477da9cf1bc2e0e1c873b2c743f9a",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 45
                    },
                    "pathLevelClientData": {
                        "unitIndex": 45,
                        "skillIds": [
                            "44083ba1c83af29901b1c508da98a282",
                            "186e55d4504350aea665de77c54ae858",
                            "5baae422dac3202f9ea22011b348437e",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "44083ba1c83af29901b1c508da98a282",
                            "b99c224c4dd829652e0695810ba4d5aa"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "工作",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9facd21ae3400dc1b98e0334f6ec4b97",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "f3a24433f9a9d51aecbec2cd3d5462fe",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "述说学校课业"
                    },
                    "totalSessions": 6,
                    "debugName": "教育 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "40d46311cdc8c5b8cd1a014963daf41d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-なにが-ほしいですか",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-なにが-ほしいですか",
                        "mode": "read",
                        "storyName": "你想要什么？",
                        "fixedXpAward": 14
                    },
                    "totalSessions": 1,
                    "debugName": "What Do You Want?",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "fb53f62a7524d99f9c3293e650d19823",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5baae422dac3202f9ea22011b348437e",
                            "f3a24433f9a9d51aecbec2cd3d5462fe"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 79",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "6001c566f6b6632157f2cc90f07cdc07",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 90",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "475c18a9b54ccdaa440a892ea909aeaf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1461c842b8dbf4ab3e877d4f6198a6b3",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "1461c842b8dbf4ab3e877d4f6198a6b3",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论责任义务"
                    },
                    "totalSessions": 6,
                    "debugName": "义务",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "bd656f40a25dfabc4f73ffa4d6b61a16",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讲述工作细节"
                    },
                    "totalSessions": 6,
                    "debugName": "工作 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1cb97b7adea423ff5afac60eb7f5c51c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "5baae422dac3202f9ea22011b348437e",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "5baae422dac3202f9ea22011b348437e",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论工作"
                    },
                    "totalSessions": 6,
                    "debugName": "工作",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "60a4a9da088ae998293d5356c2b6f48a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1461c842b8dbf4ab3e877d4f6198a6b3",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 91",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ed4e01d1439313814d4bba821b0b96fd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1461c842b8dbf4ab3e877d4f6198a6b3",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "5baae422dac3202f9ea22011b348437e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 80",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ed6522bcc0ca295481722f3eaffb372b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "1461c842b8dbf4ab3e877d4f6198a6b3",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 45
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "5baae422dac3202f9ea22011b348437e",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "5baae422dac3202f9ea22011b348437e"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 45",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/fa403950cd23c1fedb7603ae32f2a1f54627f20fd1b5c4cd35d1f52846e686c46b4a7b508fae1ed470631f844881743bb7d1a112a566310c8a70bba854f89a45/1.json"
            },
            "teachingObjective": "谈论责任义务",
            "cefrLevel": null
        },
        {
            "unitIndex": 46,
            "levels": [
                {
                    "id": "186e5732959643e3d69211d13abd5894",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 46
                    },
                    "pathLevelClientData": {
                        "unitIndex": 46,
                        "skillIds": [
                            "5baae422dac3202f9ea22011b348437e",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "5baae422dac3202f9ea22011b348437e"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "欲望",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "394c9f42b12c0c685aeca9bd6e5426fd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-かってくれる",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-かってくれる",
                        "mode": "read",
                        "storyName": "可以买给我吗？",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Can I Have It?",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "55b4e066351120ec82865724427db44b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "1461c842b8dbf4ab3e877d4f6198a6b3",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "1461c842b8dbf4ab3e877d4f6198a6b3",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论责任义务"
                    },
                    "totalSessions": 6,
                    "debugName": "义务",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "be7f843dab85e992b9be5d71e40d9b39",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "d30a427553b2bed5767c5301319c1287",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 92",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "387789651252d5718423bbb1e12fd1b9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "d30a427553b2bed5767c5301319c1287",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d30a427553b2bed5767c5301319c1287",
                            "1461c842b8dbf4ab3e877d4f6198a6b3"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 81",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "90345a443eac3d3ba4ad47b011fe27ad",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "b99c224c4dd829652e0695810ba4d5aa",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讲述工作细节"
                    },
                    "totalSessions": 6,
                    "debugName": "工作 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "faf3c1ea60d53ae6bedefbb7260792b8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f4bdfc39a46fc01052510545eacfc227",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "f4bdfc39a46fc01052510545eacfc227",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "给出说明或指令"
                    },
                    "totalSessions": 6,
                    "debugName": "义务 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6c7f674a6c962905b1bbab92360114a7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f4bdfc39a46fc01052510545eacfc227",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 93",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "a9033eb9bee5ef7c933690c65474d443",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d30a427553b2bed5767c5301319c1287",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "d30a427553b2bed5767c5301319c1287",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "述说想做的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "欲望",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "453d9cd2b5afcf4e377df3d1dd53e9f6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f4bdfc39a46fc01052510545eacfc227",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "f4bdfc39a46fc01052510545eacfc227",
                            "d30a427553b2bed5767c5301319c1287"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 82",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "6ebf441e9e97535dabda8c733aa20930",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-かのじょを-さがしてくれませんか",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-かのじょを-さがしてくれませんか",
                        "mode": "read",
                        "storyName": "能帮我找女朋友吗？",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Find My Girlfriend",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "0cb5964ed0694437121689bf4cff0746",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f4bdfc39a46fc01052510545eacfc227",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 46
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d30a427553b2bed5767c5301319c1287",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "f4bdfc39a46fc01052510545eacfc227",
                            "d30a427553b2bed5767c5301319c1287"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 46",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/004f9c35521bd4b361ed9f2c85ec067962ddc7e935256dada279dd6b3890529a4b7de2130d05e20c7498e5147b5cb81810d4fc73c5dc30863b8b10b509aaca68/1.json"
            },
            "teachingObjective": "述说想做的事情",
            "cefrLevel": null
        },
        {
            "unitIndex": 47,
            "levels": [
                {
                    "id": "f2d3800010de44d78b6097127961fdca",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 47
                    },
                    "pathLevelClientData": {
                        "unitIndex": 47,
                        "skillIds": [
                            "d30a427553b2bed5767c5301319c1287",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "f4bdfc39a46fc01052510545eacfc227",
                            "d30a427553b2bed5767c5301319c1287"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "义务",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9376090ece9de3f35c2c3becf2756a0d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "表达想法"
                    },
                    "totalSessions": 6,
                    "debugName": "想法",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "095fab8b60c24d654526cd765c61d2ae",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 94",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "78b1df43e120633719c54654c334f394",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "eaa3e53641f1aa1d44031d9ae380e362"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 83",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ae652401d812dd19eb2672e218143647",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f4bdfc39a46fc01052510545eacfc227",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "f4bdfc39a46fc01052510545eacfc227",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "给出说明或指令"
                    },
                    "totalSessions": 6,
                    "debugName": "义务 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3abc6e9d3972d3676e3276207018ff5b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d30a427553b2bed5767c5301319c1287",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "d30a427553b2bed5767c5301319c1287",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "述说想做的事情"
                    },
                    "totalSessions": 6,
                    "debugName": "欲望",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "567d0fce63b0f7e5040a7f5337589b94",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-バスケットボール-せんしゅ",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-バスケットボール-せんしゅ",
                        "mode": "read",
                        "storyName": "篮球运动员",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "The Basketball Player",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "786418a7ae7060a57f3f307177be5b64",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 95",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "e97d2b082a76b579941a1c605bdbf02d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f4bdfc39a46fc01052510545eacfc227",
                            "d30a427553b2bed5767c5301319c1287"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 84",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d42a83828ae49fb163e5ad175fc5df3b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 47
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "f4bdfc39a46fc01052510545eacfc227",
                            "d30a427553b2bed5767c5301319c1287"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 47",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/dc7e52ca2e6a040a8cd8dd5f7f2b8fffd908ea1eb60fe17e0503ea318f6ce04fea5694ab2aabde316e11503d4c6e4cce077564dff8cbf025e32dbe17f818baaa/1.json"
            },
            "teachingObjective": "表达想法",
            "cefrLevel": null
        },
        {
            "unitIndex": 48,
            "levels": [
                {
                    "id": "3a0e18a02d5237447cf679972074ea50",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 48
                    },
                    "pathLevelClientData": {
                        "unitIndex": 48,
                        "skillIds": [
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "f4bdfc39a46fc01052510545eacfc227",
                            "d30a427553b2bed5767c5301319c1287"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "研究",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8ff1dc259b9c900b2cda811ac476a983",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "eaa3e53641f1aa1d44031d9ae380e362",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "表达想法"
                    },
                    "totalSessions": 6,
                    "debugName": "想法",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "da8f02fa3a4b7485e98cab1752fd7b2a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f4bdfc39a46fc01052510545eacfc227",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "f4bdfc39a46fc01052510545eacfc227",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "给出说明或指令"
                    },
                    "totalSessions": 6,
                    "debugName": "义务 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "0a88bfc7844074456141a6e98726c919",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f875c00ce25ea352aeb0f59e74b2a0a2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "f4bdfc39a46fc01052510545eacfc227"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 85",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "fdc951c7b0a71652d5138b082eb79489",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f875c00ce25ea352aeb0f59e74b2a0a2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 96",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "4745c671ab370337a8bb20416a2e7362",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讲述学校"
                    },
                    "totalSessions": 6,
                    "debugName": "学校 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "45e1f86a5ad81c45db949d970e062d2b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-チケットを-にまい-ください",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-チケットを-にまい-ください",
                        "mode": "read",
                        "storyName": "请给我两张票！",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Two Tickets Please!",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "75391b3e8f21b054fb0c6f947ecab804",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 97",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "c3525a14b185d66b4bb44729d403112f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f875c00ce25ea352aeb0f59e74b2a0a2",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "f875c00ce25ea352aeb0f59e74b2a0a2",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论学术研究"
                    },
                    "totalSessions": 6,
                    "debugName": "研究",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "17dcc1e260e256840f4e85d03306a56f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "f875c00ce25ea352aeb0f59e74b2a0a2"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 86",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "376c8b20076aa8b7f4c042429ddcc72b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 48
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "f4bdfc39a46fc01052510545eacfc227",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "f875c00ce25ea352aeb0f59e74b2a0a2"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 48",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/eeb4551c51d7e026895e74b4af461d4ba4b3b23961da413a78c0b96d2bb83ab9c13077198bfedcc07a28adfe47f895c692aa5ee304c0007e94d9a0ade470b961/2.json"
            },
            "teachingObjective": "谈论学术研究",
            "cefrLevel": null
        },
        {
            "unitIndex": 49,
            "levels": [
                {
                    "id": "961906ae5ee50ead4c0263e3a20e960e",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 49
                    },
                    "pathLevelClientData": {
                        "unitIndex": 49,
                        "skillIds": [
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "f4bdfc39a46fc01052510545eacfc227",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "f875c00ce25ea352aeb0f59e74b2a0a2"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "想法",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "bd616fcf83b40899daaace134731cc0e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d7cc577ae6b6a35af633a6c7134d91d8",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "d7cc577ae6b6a35af633a6c7134d91d8",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论宗教"
                    },
                    "totalSessions": 6,
                    "debugName": "宗教",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3c632ea76a963e468ee28814ec47ba91",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讲述学校"
                    },
                    "totalSessions": 6,
                    "debugName": "学校 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "14f8c240c987e39e0c3cfd7cc9d9c7ac",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "d7cc577ae6b6a35af633a6c7134d91d8",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 98",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "a259df2d69fd52ce5dbc6a9c7c6076e2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "d7cc577ae6b6a35af633a6c7134d91d8",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "34c8a1146c32e6a636fff6bb32966f49"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 87",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "604f93685eaabc930dac21efe47a4d79",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ありがとう",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ありがとう",
                        "mode": "read",
                        "storyName": "谢谢？",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Thanks?",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "350f1898a2efa467d5cc857030fda1c5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f875c00ce25ea352aeb0f59e74b2a0a2",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "f875c00ce25ea352aeb0f59e74b2a0a2",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论学术研究"
                    },
                    "totalSessions": 6,
                    "debugName": "研究",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3e3d747789afae12dfaf3d997ec22c4d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "表达身体的疼痛"
                    },
                    "totalSessions": 6,
                    "debugName": "健康 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9a0f7168425b0c6c836f31276af42a1f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 99",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5df96a7b0e4b148c46543d09bd16c8d9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 88",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d08f8283c3dfa41034e35ed8f8c5a0a2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 49
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 49",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/1882ff2a0ddd8eaab7a073456aad54d10449dcd84f27df48e8885d157f372a16dd4f2198f1f618d22a4a9d3e156e75702d8b65d5826efec51952d4c9cb081c7f/2.json"
            },
            "teachingObjective": "谈论宗教",
            "cefrLevel": null
        },
        {
            "unitIndex": 50,
            "levels": [
                {
                    "id": "06ed74860816d3f29afc0de40aba7b3e",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 50
                    },
                    "pathLevelClientData": {
                        "unitIndex": 50,
                        "skillIds": [
                            "eaa3e53641f1aa1d44031d9ae380e362",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "宗教",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "21a9014f609d7f641cb41e3d525f75ab",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "34c8a1146c32e6a636fff6bb32966f49",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讲述学校"
                    },
                    "totalSessions": 6,
                    "debugName": "学校 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4c665a70bac639776ace8827dd910858",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 100",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "185796765ce5f7f08ce20ae769a74aff",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ダンスの-クラス",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ダンスの-クラス",
                        "mode": "read",
                        "storyName": "舞蹈课",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "The Dance Class",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "bf7a33734086708e2614ad51abb7eaac",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "34c8a1146c32e6a636fff6bb32966f49"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 89",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c45c76db208e9c6b6e90280ec4911d93",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "3afe6b0251f552303737a3a8ca8896a2",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "3afe6b0251f552303737a3a8ca8896a2",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论生病看医生"
                    },
                    "totalSessions": 6,
                    "debugName": "健康 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3ffef577b52a7c9c00c824092cb3aeb5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "表达身体的疼痛"
                    },
                    "totalSessions": 6,
                    "debugName": "健康 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "3d26721fa050138f7fd9a0e91b2a61f6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3afe6b0251f552303737a3a8ca8896a2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 101",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "8f86a1d9de964a55f2adc21ffdafee6b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "d7cc577ae6b6a35af633a6c7134d91d8",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "d7cc577ae6b6a35af633a6c7134d91d8",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论宗教"
                    },
                    "totalSessions": 6,
                    "debugName": "宗教",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4c5c3038ccf8ed9e3ea712a2b5fbe86f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3afe6b0251f552303737a3a8ca8896a2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "d7cc577ae6b6a35af633a6c7134d91d8"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 90",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "89473fcfc41e77249a0440777beea3d6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3afe6b0251f552303737a3a8ca8896a2",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 50
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "d7cc577ae6b6a35af633a6c7134d91d8"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 50",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/1ca5ae84129cb77ecc4e3b445d7a44257f38a2ecf5c99f239bb08ee051fe19e5f81516ea0846f2fa129b8274d9df64e282ce0f1647cce2d0a2d9ffc3f55fed91/1.json"
            },
            "teachingObjective": "谈论生病看医生",
            "cefrLevel": null
        },
        {
            "unitIndex": 51,
            "levels": [
                {
                    "id": "18a6570bea3d820bc7446c63acf895a1",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 51
                    },
                    "pathLevelClientData": {
                        "unitIndex": 51,
                        "skillIds": [
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "d7cc577ae6b6a35af633a6c7134d91d8"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "海鲜",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "588d1687e7d1d9364111961f65f2751f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-メアリー-じゃない",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-メアリー-じゃない",
                        "mode": "read",
                        "storyName": "你不是玛丽",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "You're Not Mary",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "30b4f769540c629864e85af968164473",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "3afe6b0251f552303737a3a8ca8896a2",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "3afe6b0251f552303737a3a8ca8896a2",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论生病看医生"
                    },
                    "totalSessions": 6,
                    "debugName": "健康 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "a5ef7fdffff984ca0626d3df551e60e5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "698711aabf82927df96e41dd956a3e28",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "698711aabf82927df96e41dd956a3e28",
                            "3afe6b0251f552303737a3a8ca8896a2"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 91",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "388920292467a22605e8ca6b3416cf9a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "698711aabf82927df96e41dd956a3e28",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 102",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "dd8c404caa431702fa53dca5b58294b6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "表达身体的疼痛"
                    },
                    "totalSessions": 6,
                    "debugName": "健康 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "eb163308a7a03f03b6475ef5a22f400c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讲述日本社会生活"
                    },
                    "totalSessions": 6,
                    "debugName": "社会",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d0974aff10274b33debc76706f0bd2da",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "698711aabf82927df96e41dd956a3e28",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "698711aabf82927df96e41dd956a3e28",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述日本海鲜料理"
                    },
                    "totalSessions": 6,
                    "debugName": "海鲜",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "93c3b3a6432338c413ec463a746c3dae",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 103",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "9b813786818d18a05f7d51ddba6d9568",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "698711aabf82927df96e41dd956a3e28"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 92",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "430322dbdc20242e5fefcf45354f9764",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 51
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "698711aabf82927df96e41dd956a3e28",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "698711aabf82927df96e41dd956a3e28"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 51",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/858ee555548d851a7cf85ff35cb221f6bc282c55e21f97a1b10efe160e328546b95e07ec25a4ae66c830f486bba191f80c7c5b97ba2a5219525784722f5b9fcb/1.json"
            },
            "teachingObjective": "描述日本海鲜料理",
            "cefrLevel": null
        },
        {
            "unitIndex": 52,
            "levels": [
                {
                    "id": "583993aa63e76f68b86cc135c3220d94",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 52
                    },
                    "pathLevelClientData": {
                        "unitIndex": 52,
                        "skillIds": [
                            "698711aabf82927df96e41dd956a3e28",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "698711aabf82927df96e41dd956a3e28"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "健康 3",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c0d521087a5925ab8e5f74f6fc1ac60a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "755735f779a394170e02302235e324cb",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "755735f779a394170e02302235e324cb",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论政府"
                    },
                    "totalSessions": 6,
                    "debugName": "政府",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "af24bd2ac81370d5757e6c74cb7f186e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "755735f779a394170e02302235e324cb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "755735f779a394170e02302235e324cb"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 93",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "557f3d546776342fc852063cee89f416",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "755735f779a394170e02302235e324cb",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 104",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "852541df57a25c2768d678b98ba8c043",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讲述日本社会生活"
                    },
                    "totalSessions": 6,
                    "debugName": "社会",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "e9c5258dc01b050cf515f01a525d8d39",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "698711aabf82927df96e41dd956a3e28",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "698711aabf82927df96e41dd956a3e28",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述日本海鲜料理"
                    },
                    "totalSessions": 6,
                    "debugName": "海鲜",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "98ab1fbb6c4f73a92247deb8597ebeb1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "755735f779a394170e02302235e324cb",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 105",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "0e50a463a8c05f22ae4be191e69427c5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ジュニアの-うんどう",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ジュニアの-うんどう",
                        "mode": "read",
                        "storyName": "朱朱的运动",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Junior's Exercise",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "47595931d376becf93bbb34ef76035ce",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "755735f779a394170e02302235e324cb",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "698711aabf82927df96e41dd956a3e28"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 94",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "2b6608bc54200e83b38255ebfdb3a781",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "755735f779a394170e02302235e324cb",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 52
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "755735f779a394170e02302235e324cb",
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "698711aabf82927df96e41dd956a3e28"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 52",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/210e7189f93aa17f44cce17e7eee0aa60705e5f14cd008520f2c5d1f7f0534541a26bd0ed8561e9a54d942c3b2a66b0a2502a797a6409d0c8a23a3e1521886b3/1.json"
            },
            "teachingObjective": "谈论政府",
            "cefrLevel": null
        },
        {
            "unitIndex": 53,
            "levels": [
                {
                    "id": "51d91fab40fb3623ca6aab34cbeb8806",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 53
                    },
                    "pathLevelClientData": {
                        "unitIndex": 53,
                        "skillIds": [
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "755735f779a394170e02302235e324cb",
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "698711aabf82927df96e41dd956a3e28"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "活动 4",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "f3cb301a83647099783c18b7b0207226",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "755735f779a394170e02302235e324cb",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "755735f779a394170e02302235e324cb",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论政府"
                    },
                    "totalSessions": 6,
                    "debugName": "政府",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "305070abf644046d8f4891dc99136019",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "251f0c9ce3f0c9d834116dc9c2067529",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 106",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "e1fe77d5e719108e4b3184d5370bf55e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "f3880299e78fd87cf4c48e6813414c0c",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讲述日本社会生活"
                    },
                    "totalSessions": 6,
                    "debugName": "社会",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6327b1d49fb2bb342b51d7eba0d9a383",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "251f0c9ce3f0c9d834116dc9c2067529",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "755735f779a394170e02302235e324cb",
                            "f3880299e78fd87cf4c48e6813414c0c"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 95",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "53ec2900ba367318b2de85a208635989",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e653c9899db60b9fae807fec232fed3e",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "e653c9899db60b9fae807fec232fed3e",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "表达心里的感受"
                    },
                    "totalSessions": 6,
                    "debugName": "感受 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "96150c0bf1d00d4ef32271b29b2be3d0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-にわ",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-にわ",
                        "mode": "read",
                        "storyName": "花园",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "The Garden",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "c68e1a054ad535469e73ed72009c7b72",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "251f0c9ce3f0c9d834116dc9c2067529",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "251f0c9ce3f0c9d834116dc9c2067529",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "提出建议"
                    },
                    "totalSessions": 6,
                    "debugName": "活动 4",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "579bdd8a43a48701972b926a0c4ace71",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e653c9899db60b9fae807fec232fed3e",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 107",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "f7e1938e6de1ae8b0b4b383120ac1b3b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e653c9899db60b9fae807fec232fed3e",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "e653c9899db60b9fae807fec232fed3e",
                            "251f0c9ce3f0c9d834116dc9c2067529"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 96",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9d850bef7ad8ad4bcbb84b3165cab727",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "e653c9899db60b9fae807fec232fed3e",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 53
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "755735f779a394170e02302235e324cb",
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "e653c9899db60b9fae807fec232fed3e",
                            "251f0c9ce3f0c9d834116dc9c2067529"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 53",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/e72a36c0f4dd9056d30b329cab8a7a8b5abd92014f161c9523d3bb08bffe726a844690222123c68a0d9c4bca9b3fc0bd57e18553ac74eb50128f58d77a54328c/2.json"
            },
            "teachingObjective": "提出建议",
            "cefrLevel": null
        },
        {
            "unitIndex": 54,
            "levels": [
                {
                    "id": "238b6b76664db74a81ac531a4721a70c",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 54
                    },
                    "pathLevelClientData": {
                        "unitIndex": 54,
                        "skillIds": [
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "755735f779a394170e02302235e324cb",
                            "f3880299e78fd87cf4c48e6813414c0c",
                            "e653c9899db60b9fae807fec232fed3e",
                            "251f0c9ce3f0c9d834116dc9c2067529"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "政府",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "8263c3fab44bc8e51d5041f357accc68",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9cf44664998be3bda362f64cb1e050ab",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "9cf44664998be3bda362f64cb1e050ab",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论各种社会问题"
                    },
                    "totalSessions": 6,
                    "debugName": "社会 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "c41ee80e605cfe6b25796d373fde35ea",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e653c9899db60b9fae807fec232fed3e",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "e653c9899db60b9fae807fec232fed3e",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "表达心里的感受"
                    },
                    "totalSessions": 6,
                    "debugName": "感受 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b4fd275d25b55d8c47ed9c747b66a9aa",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9cf44664998be3bda362f64cb1e050ab",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "755735f779a394170e02302235e324cb",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "e653c9899db60b9fae807fec232fed3e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 97",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "401913cbbf86751abab9aaf8689fc3f8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9cf44664998be3bda362f64cb1e050ab",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 108",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "18fcdf66d0748ff3eaad7fd8adea1946",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ぴったりな-ひと",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ぴったりな-ひと",
                        "mode": "read",
                        "storyName": "最合适的人选",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "The Perfect Person",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "93a8dd176cbd88e85ce577e1da4a9a5a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "251f0c9ce3f0c9d834116dc9c2067529",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "251f0c9ce3f0c9d834116dc9c2067529",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "提出建议"
                    },
                    "totalSessions": 6,
                    "debugName": "活动 4",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4fc42b400ac4af9f27022b4eeb8d3248",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "9cf44664998be3bda362f64cb1e050ab",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 109",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "9e316dff95c8250b0a5c2e3d4da55f91",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c7995f016b476ff68c57530843d2fbfc",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "c7995f016b476ff68c57530843d2fbfc",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "使用被动语态"
                    },
                    "totalSessions": 6,
                    "debugName": "记忆 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "9eb77ae85820d60c7f0a53c6f1dd7179",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c7995f016b476ff68c57530843d2fbfc",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 98",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c4628909e04437d00ebe920efe7c068b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c7995f016b476ff68c57530843d2fbfc",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 54
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "755735f779a394170e02302235e324cb",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "e653c9899db60b9fae807fec232fed3e",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 54",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/de85e43c6dd330ff56e5698ea37588d2cf400d53248cf61f4d7749aadcf47fa6d20e02b2004117cf5737bc02172be7b2b3507260a7d0ce72e37ea9612c5cd28e/2.json"
            },
            "teachingObjective": "谈论各种社会问题",
            "cefrLevel": null
        },
        {
            "unitIndex": 55,
            "levels": [
                {
                    "id": "6b4f3bb6300173fa44f776e7b0472448",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 55
                    },
                    "pathLevelClientData": {
                        "unitIndex": 55,
                        "skillIds": [
                            "755735f779a394170e02302235e324cb",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "e653c9899db60b9fae807fec232fed3e",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "社会 2",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d3234669fbb8746b01d7955b843f8b33",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "e653c9899db60b9fae807fec232fed3e",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "e653c9899db60b9fae807fec232fed3e",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "表达心里的感受"
                    },
                    "totalSessions": 6,
                    "debugName": "感受 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "274dfdcdd12c1db6d139fc92d275f8ae",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-おてつだい-しましょうか",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-おてつだい-しましょうか",
                        "mode": "read",
                        "storyName": "需要帮助吗？",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Need Help?",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "e4cabcdb7a13a6a54917d488ed1af38e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c7995f016b476ff68c57530843d2fbfc",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 110",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "0a8b958d8665df7efec11bd0edb150c1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "c7995f016b476ff68c57530843d2fbfc",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "9cf44664998be3bda362f64cb1e050ab",
                            "e653c9899db60b9fae807fec232fed3e"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 99",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "030e7a7fddb6039bff08bb25eb322d78",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论艺术"
                    },
                    "totalSessions": 6,
                    "debugName": "艺术",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5e543f5ab7686fb6e27c893aa40122df",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c7995f016b476ff68c57530843d2fbfc",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "c7995f016b476ff68c57530843d2fbfc",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "使用被动语态"
                    },
                    "totalSessions": 6,
                    "debugName": "记忆 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "41105097edfee85e8ce57db5bda44a25",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 111",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "51a12e60f5e45c76de495c7d29d55b64",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "9cf44664998be3bda362f64cb1e050ab",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "9cf44664998be3bda362f64cb1e050ab",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论各种社会问题"
                    },
                    "totalSessions": 6,
                    "debugName": "社会 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "eab79d393894e3ec5a6912c94724235e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "cc04a59957a5af3b54a12b78699dee1d",
                            "c7995f016b476ff68c57530843d2fbfc",
                            "9cf44664998be3bda362f64cb1e050ab"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 100",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "0a611bc47dc21b396b99903a297adada",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ジュニアの-せんたく",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ジュニアの-せんたく",
                        "mode": "read",
                        "storyName": "朱朱的选择",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Junior's Choice",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "d688648c2793940beafca351d7c664a4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 55
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "9cf44664998be3bda362f64cb1e050ab",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cc04a59957a5af3b54a12b78699dee1d",
                            "c7995f016b476ff68c57530843d2fbfc",
                            "9cf44664998be3bda362f64cb1e050ab"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 55",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/37f6e1dbffd86945d57b5475aa8b227113cc375c6a538761d4feb54e059268730bce6ae42492fb16014cb09267426c7d9f3adbdcdf98b997e483b5284347d36c/1.json"
            },
            "teachingObjective": "谈论艺术",
            "cefrLevel": null
        },
        {
            "unitIndex": 56,
            "levels": [
                {
                    "id": "2ad3596d093db4970cab449b21159d16",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 56
                    },
                    "pathLevelClientData": {
                        "unitIndex": 56,
                        "skillIds": [
                            "9cf44664998be3bda362f64cb1e050ab",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cc04a59957a5af3b54a12b78699dee1d",
                            "c7995f016b476ff68c57530843d2fbfc",
                            "9cf44664998be3bda362f64cb1e050ab"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "人 4",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6aeee6b4016a1629e995b6829136310c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论艺术"
                    },
                    "totalSessions": 6,
                    "debugName": "艺术",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "de91946de1436ede050dc6b8d774ca64",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "daae8c2b0dad997361037245ca71d01f",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "daae8c2b0dad997361037245ca71d01f",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 101",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "354f37c014bad4c2e3320297b80d9401",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "daae8c2b0dad997361037245ca71d01f",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 112",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "0b794c761ca4729804e1a1fb4e483a9b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "c7995f016b476ff68c57530843d2fbfc",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "c7995f016b476ff68c57530843d2fbfc",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "使用被动语态"
                    },
                    "totalSessions": 6,
                    "debugName": "记忆 2",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "44d20eb993d6ce9dfb598698990761d4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-いぬが-ほしいんだ",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-いぬが-ほしいんだ",
                        "mode": "read",
                        "storyName": "我想养条狗",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "I Really Want a Dog",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "5d431fc094eaf6ffa3d765ace149b328",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "daae8c2b0dad997361037245ca71d01f",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 113",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ae8cca66d0b9e46660d62c45fe52ec99",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "讨论不同的工作内容"
                    },
                    "totalSessions": 6,
                    "debugName": "工作 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "538be163d620250e27fc378aec2af02e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "c7995f016b476ff68c57530843d2fbfc",
                            "ef1b59bcdd2b05d25d8c95460a4423d2"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 102",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "467993437a2aa6dcf90c1a12dce3121a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 56
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "daae8c2b0dad997361037245ca71d01f",
                            "cc04a59957a5af3b54a12b78699dee1d",
                            "c7995f016b476ff68c57530843d2fbfc",
                            "ef1b59bcdd2b05d25d8c95460a4423d2"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 56",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/66beb944cabd44dfc78328f1b4438e92a8cc843f01e86c64284daa83718ba8d8b9ce55e6c3d0cee64b8e196f08c7a8315c7fecd54f390eccb10eed8990e8c782/1.json"
            },
            "teachingObjective": "描述和他人的关系",
            "cefrLevel": null
        },
        {
            "unitIndex": 57,
            "levels": [
                {
                    "id": "e78299588dd36ebeab1bc7c0d2869acb",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 57
                    },
                    "pathLevelClientData": {
                        "unitIndex": 57,
                        "skillIds": [
                            "daae8c2b0dad997361037245ca71d01f",
                            "cc04a59957a5af3b54a12b78699dee1d",
                            "c7995f016b476ff68c57530843d2fbfc",
                            "ef1b59bcdd2b05d25d8c95460a4423d2"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "人 4",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "5b4effced5d1078be86360bdaf8856d1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "cc04a59957a5af3b54a12b78699dee1d",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论艺术"
                    },
                    "totalSessions": 6,
                    "debugName": "艺术",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1f636ff47e2ccef3864f9f1a7f203a08",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-モデル",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-モデル",
                        "mode": "read",
                        "storyName": "模特儿",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "The Model",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "6169d3f71069e2e923503d73a5e99d51",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "daae8c2b0dad997361037245ca71d01f",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 103",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "87d8d55e1d3c97c8c36c96755ebf0cd2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 114",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "0db3fe41a5ff984ec577c5886ecc7167",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "beccb50a0103b00f300ff502cedb6f95",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "beccb50a0103b00f300ff502cedb6f95",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "谈论气候"
                    },
                    "totalSessions": 6,
                    "debugName": "天气 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d7a368fc8dbf99d9e6d8c99dced95317",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "讨论不同的工作内容"
                    },
                    "totalSessions": 6,
                    "debugName": "工作 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "81b0984e5fab3db4105e42869e874d92",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "daae8c2b0dad997361037245ca71d01f",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "daae8c2b0dad997361037245ca71d01f",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述和他人的关系"
                    },
                    "totalSessions": 6,
                    "debugName": "人 4",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "17f9860384f873acd43c2d6ed9be6dd4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "beccb50a0103b00f300ff502cedb6f95",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 115",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "cdf6d4833a2074db372c3919b3ba245e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "beccb50a0103b00f300ff502cedb6f95",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "beccb50a0103b00f300ff502cedb6f95",
                            "ef1b59bcdd2b05d25d8c95460a4423d2",
                            "daae8c2b0dad997361037245ca71d01f"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 104",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f5ce969c5e1071b4593d79153eae0ed2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ひどい-え",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ひどい-え",
                        "mode": "read",
                        "storyName": "糟糕的画",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Bad Painting",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "c9541647797e054f4b453a867fb09d98",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "beccb50a0103b00f300ff502cedb6f95",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 57
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "daae8c2b0dad997361037245ca71d01f",
                            "cc04a59957a5af3b54a12b78699dee1d",
                            "beccb50a0103b00f300ff502cedb6f95",
                            "ef1b59bcdd2b05d25d8c95460a4423d2",
                            "daae8c2b0dad997361037245ca71d01f"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 57",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/64df1237594e938eb06bcbeb5e9db7dc89770bf8f8d08913d472f01a1a6ff4309d85d04755e7d853af997aaba70599943217f4e7d6de1ae0d14cfd0d9dbfa292/1.json"
            },
            "teachingObjective": "谈论气候",
            "cefrLevel": null
        },
        {
            "unitIndex": 58,
            "levels": [
                {
                    "id": "f756719f333882b23a3ee1cd52d1bad9",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 58
                    },
                    "pathLevelClientData": {
                        "unitIndex": 58,
                        "skillIds": [
                            "daae8c2b0dad997361037245ca71d01f",
                            "cc04a59957a5af3b54a12b78699dee1d",
                            "beccb50a0103b00f300ff502cedb6f95",
                            "ef1b59bcdd2b05d25d8c95460a4423d2",
                            "daae8c2b0dad997361037245ca71d01f"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "法律",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1f73127d3a25ee10d65a49907e21685e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "beccb50a0103b00f300ff502cedb6f95",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "beccb50a0103b00f300ff502cedb6f95",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "谈论气候"
                    },
                    "totalSessions": 6,
                    "debugName": "天气 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "67cd5a6279987d83a90edb5606fd5ef6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3485b42823b179b12fb5f8442c10f019",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "3485b42823b179b12fb5f8442c10f019",
                            "beccb50a0103b00f300ff502cedb6f95"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 105",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "0d5abfbc2fde0d4a1f14897561d53b5b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3485b42823b179b12fb5f8442c10f019",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 116",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "4c7547fcdfa6aab4590fc3e332de8dbc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "ef1b59bcdd2b05d25d8c95460a4423d2",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讨论不同的工作内容"
                    },
                    "totalSessions": 6,
                    "debugName": "工作 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "ba27f75ab9fd80779e395abc1f8da3e1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-しゃしんを-とって",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-しゃしんを-とって",
                        "mode": "read",
                        "storyName": "给我拍照",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Take My Photo",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "e65330f7a3305ccc522b89282b0e5e54",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "3485b42823b179b12fb5f8442c10f019",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 117",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "de71a92c85dce886cea74801800316b8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cfaf434786d96e7b6854455806cbb34f",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "cfaf434786d96e7b6854455806cbb34f",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "描述犯罪和刑罚"
                    },
                    "totalSessions": 6,
                    "debugName": "社会 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "b4b4b325a5cacc527d8d941a92411459",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cfaf434786d96e7b6854455806cbb34f",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "ef1b59bcdd2b05d25d8c95460a4423d2",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 106",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9da280b8eb8748222df203147670c3a4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cfaf434786d96e7b6854455806cbb34f",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 58
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "3485b42823b179b12fb5f8442c10f019",
                            "beccb50a0103b00f300ff502cedb6f95",
                            "ef1b59bcdd2b05d25d8c95460a4423d2",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 58",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/6d5beaf886be4d5169c33ff3d260280a31eb72ed23277356a44d4fe80c51dc00e839fc98ad7b0c64502fc76005f583ec6a06005c303f03f647d702d95d857f26/2.json"
            },
            "teachingObjective": "讨论有关法律的问题",
            "cefrLevel": null
        },
        {
            "unitIndex": 59,
            "levels": [
                {
                    "id": "e0931d829aa8a94a5a3251531c31aa2a",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 59
                    },
                    "pathLevelClientData": {
                        "unitIndex": 59,
                        "skillIds": [
                            "3485b42823b179b12fb5f8442c10f019",
                            "beccb50a0103b00f300ff502cedb6f95",
                            "ef1b59bcdd2b05d25d8c95460a4423d2",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "法律",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "458306cd257ae92a128ab224a468cb7d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "beccb50a0103b00f300ff502cedb6f95",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "beccb50a0103b00f300ff502cedb6f95",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "谈论气候"
                    },
                    "totalSessions": 6,
                    "debugName": "天气 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "db2cf6cd65918be6987fcde1f18052f2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cfaf434786d96e7b6854455806cbb34f",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 118",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "1fd1f2424d9a5d883f6bc6012246d3b6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-あたらしい-スポーツ",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-あたらしい-スポーツ",
                        "mode": "read",
                        "storyName": "一项新运动",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "A New Sport",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "24df03600228a59df5097ab86d0885a3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "cfaf434786d96e7b6854455806cbb34f",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "3485b42823b179b12fb5f8442c10f019",
                            "beccb50a0103b00f300ff502cedb6f95"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 107",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7f8a82df7ec1c8dd19085bc475f81e80",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bd50cad7dd54507405df8d44667956d2",
                        "crownLevelIndex": 0
                    },
                    "pathLevelClientData": {
                        "skillId": "bd50cad7dd54507405df8d44667956d2",
                        "crownLevelIndex": 0,
                        "hardModeLevelIndex": 1,
                        "teachingObjective": "叙述计划"
                    },
                    "totalSessions": 6,
                    "debugName": "计划",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "76c01d35ebac016c947bef414708784a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cfaf434786d96e7b6854455806cbb34f",
                        "crownLevelIndex": 1
                    },
                    "pathLevelClientData": {
                        "skillId": "cfaf434786d96e7b6854455806cbb34f",
                        "crownLevelIndex": 1,
                        "hardModeLevelIndex": 3,
                        "teachingObjective": "描述犯罪和刑罚"
                    },
                    "totalSessions": 6,
                    "debugName": "社会 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "d6c6cace40554ca3c1cebbbc75d8e729",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "3485b42823b179b12fb5f8442c10f019",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "3485b42823b179b12fb5f8442c10f019",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "讨论有关法律的问题"
                    },
                    "totalSessions": 6,
                    "debugName": "法律",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "2758338870a12e379f04ce2f8c650e18",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "bd50cad7dd54507405df8d44667956d2",
                            "cfaf434786d96e7b6854455806cbb34f",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 4,
                    "debugName": "Practice Level 108",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "3d69d43556ce690fdda908ac6cbf2e89",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 0,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 119",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "70a1d88dd7557d0bcd87204a902456d0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-ルーシーと-きょうりゅう",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-ルーシーと-きょうりゅう",
                        "mode": "read",
                        "storyName": "露西和恐龙",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Lucy and the Dinosaurs",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "73aa05e01327dbdd2865b0431180eebb",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 0,
                        "unitIndex": 59
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "3485b42823b179b12fb5f8442c10f019",
                            "beccb50a0103b00f300ff502cedb6f95",
                            "bd50cad7dd54507405df8d44667956d2",
                            "cfaf434786d96e7b6854455806cbb34f",
                            "3485b42823b179b12fb5f8442c10f019"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 59",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": {
                "url": "https://d1btvuu4dwu627.cloudfront.net/guidebook/compiled/ja/zh-CN/iOS/1/f6be30aa6daa6a45b7fe517300438959fa82c72a2f6cc0148b47257a76d170eb0bb2521be628ac8a694c6b1a60651e9ce1f63cdc4a19e8e47785ae6be1a2fb38/2.json"
            },
            "teachingObjective": "叙述计划",
            "cefrLevel": null
        },
        {
            "unitIndex": 60,
            "levels": [
                {
                    "id": "a58225ff5d91dc079cd6cef78b46a402",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 60
                    },
                    "pathLevelClientData": {
                        "unitIndex": 60,
                        "skillIds": [
                            "3485b42823b179b12fb5f8442c10f019",
                            "beccb50a0103b00f300ff502cedb6f95",
                            "bd50cad7dd54507405df8d44667956d2",
                            "cfaf434786d96e7b6854455806cbb34f",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 6,
                    "debugName": "计划",
                    "hasLevelReview": false,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "6eae6dd7e32a4927768e525405e09f63",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "cfaf434786d96e7b6854455806cbb34f",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "cfaf434786d96e7b6854455806cbb34f",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "描述犯罪和刑罚"
                    },
                    "totalSessions": 6,
                    "debugName": "社会 3",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "4d53a3ca156e9be3d37edececb901dcf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "bd50cad7dd54507405df8d44667956d2",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": false
                    },
                    "totalSessions": 3,
                    "debugName": "Practice Level 109",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "069f649d1416db1ee212f1cb7e06fe5f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 1,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 120",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "8805674a5ec9f5e05ab532521aa5e31e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "skillId": "bd50cad7dd54507405df8d44667956d2",
                        "crownLevelIndex": 2
                    },
                    "pathLevelClientData": {
                        "skillId": "bd50cad7dd54507405df8d44667956d2",
                        "crownLevelIndex": 2,
                        "hardModeLevelIndex": 4,
                        "teachingObjective": "叙述计划"
                    },
                    "totalSessions": 6,
                    "debugName": "计划",
                    "hasLevelReview": true,
                    "type": "skill",
                    "subtype": "regular"
                },
                {
                    "id": "1f5e9a08f5b7c26055f9d18a7cc4330a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "storyId": "ja-zh-かぎは-どこ",
                        "mode": "read",
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "storyId": "ja-zh-かぎは-どこ",
                        "mode": "read",
                        "storyName": "我的钥匙在哪里？",
                        "fixedXpAward": 16
                    },
                    "totalSessions": 1,
                    "debugName": "Where Are My Keys?",
                    "hasLevelReview": false,
                    "type": "story",
                    "subtype": "read"
                },
                {
                    "id": "a9a0e6d49e049db3d6954c7028fb8419",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 2,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 121",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "711f4bced80215710287545b17299113",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 2,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 0",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9e2bb3ac2748d2fc39d494cae4b043db",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 3,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 1",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "b00fc3b9afa84ffe72e1c45482a4ff0b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 1,
                        "unitIndex": 60
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "bd50cad7dd54507405df8d44667956d2",
                            "cfaf434786d96e7b6854455806cbb34f",
                            "bd50cad7dd54507405df8d44667956d2"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 60",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "在餐馆点餐",
            "cefrLevel": null
        },
        {
            "unitIndex": 61,
            "levels": [
                {
                    "id": "14288841e35c504977170360ee857c62",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 61
                    },
                    "pathLevelClientData": {
                        "unitIndex": 61,
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 2",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c4628b041b7576424503ef627ad26b0e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 5,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 3",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a490eba9af255d8db90b37b8b70c22e9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 3,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 122",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "adfa623ec5e1c99ad7465cbabe4b6eca",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 6,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 4",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5012f24517cf35161c9a22e3ee4781e3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 7,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 5",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "049d2a94a03839c9ab60c797d9da1256",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 8,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 6",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c9823305f6c51ef2972b2795ed01760c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 9,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 7",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "432a6773a61fb1c615a1ff6e2f82e461",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 4,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 123",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "58faa7c51b9fee5a65bbb7f46fa59663",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 10,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 8",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "160e4d12812d8a14cf941bff5e5d6d76",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 2,
                        "unitIndex": 61
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 61",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "指引方向",
            "cefrLevel": null
        },
        {
            "unitIndex": 62,
            "levels": [
                {
                    "id": "0166a587e0a6e3e56572bf4325bc7ac0",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 62
                    },
                    "pathLevelClientData": {
                        "unitIndex": 62,
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 9",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "207e360d02f680f8fe250e3e6016896f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 12,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 10",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c9fb1ff5b9c306e6b330f5eebffdd09f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 13,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 11",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "708aeba951d5a623c6eff630544521e1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 5,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 124",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "686d1d8586f2c58057af46c0aee976d2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 14,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 12",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "37ec625bed6b8b74d417411fee428f05",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 15,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 13",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d2707a70358e6da6398a201878f2ffdf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 6,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 125",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "29dc3ebf91cd65a52771ab0b431f2ec7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 16,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 14",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "fa53e2d02b93d0059ab13aa83040fc10",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 17,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 15",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "87585508928c12fa947fe493b4c01aa6",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 3,
                        "unitIndex": 62
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 62",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "叙述学校活动",
            "cefrLevel": null
        },
        {
            "unitIndex": 63,
            "levels": [
                {
                    "id": "757e2e400fd6cbe44fcce26127d9d84c",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 63
                    },
                    "pathLevelClientData": {
                        "unitIndex": 63,
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 16",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "8939132a535cd0d6b5e17fb2058d8b28",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 19,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 17",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "dc00d2b36ee5cf09b1573b460a26cdd2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 7,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 126",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "350ce8225b8fb872508a7989358d30dd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 20,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 18",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "61ed9549e7c573a66b53f305be217245",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 21,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 19",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a90f7366bec27cec86561a3f4c16d5f9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 22,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 20",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9f28d1e0dcfd77fd176d2a763f3124d2",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 23,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 21",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "bcdb75cdc5ae43bd024e3cc5b69a83a9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 8,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 127",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5ddfc52fc5a61e2f3397b1150fe06cdd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 24,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 22",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ea9ef408de5382fc734eaa6396c3fc04",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 4,
                        "unitIndex": 63
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 63",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "在便利店买东西",
            "cefrLevel": null
        },
        {
            "unitIndex": 64,
            "levels": [
                {
                    "id": "886f9ad99fe3d37f78bc71ca403e2c6d",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 64
                    },
                    "pathLevelClientData": {
                        "unitIndex": 64,
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 23",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "72ad67098d9bbecd79b3af44adddca1f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 26,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 24",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5105981392540e644685aec79219eeaf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 27,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 25",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5e9c00aa7b659489eb0a1f1817accae3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 9,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 128",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "d2643a6120e79dfcefe82b6c3d9d4bf9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 28,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 26",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "22e07d6966799bfb016dcc31de747757",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 29,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 27",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "27bb992c1883d5c520e4b095edafdbc0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 10,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 129",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "d737be842cd85c3e2509377b77675e1f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 30,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 28",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "79ecca61d68f7737768ba6d61d6e3442",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 31,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 29",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "98c0b701eef6fc56ef2d540121281cce",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 5,
                        "unitIndex": 64
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 64",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "述说学校课业",
            "cefrLevel": null
        },
        {
            "unitIndex": 65,
            "levels": [
                {
                    "id": "f0789c7b6979b16aaf0628e13dbbb6ed",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 65
                    },
                    "pathLevelClientData": {
                        "unitIndex": 65,
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 30",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f51ef282207ded47749adfc4063c7b89",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 33,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 31",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "69b8ceb362e24b589e1b491926635868",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 11,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 130",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "a3bacd52e5eb44025b3a42c998b859d8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 34,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 32",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "956fb8964810b2fe27dcdf0afaec732d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 35,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 33",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5f5f540c284bdc9b73d10613b1ec9b5e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 36,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 34",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "741f074cab924ffa267b00c564f6f4a8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 37,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 35",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c334021961b393bd95dcaf7e86e4a554",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 12,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 131",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "519b6fb6e969c7a967af8b6ce63cd74b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 38,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 36",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "966093647c8a755d793bab3708ce8a2d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 6,
                        "unitIndex": 65
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 65",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "描述身体健康情况",
            "cefrLevel": null
        },
        {
            "unitIndex": 66,
            "levels": [
                {
                    "id": "49d620762bc4df25bbb52c9d54b6409f",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 66
                    },
                    "pathLevelClientData": {
                        "unitIndex": 66,
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 37",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "b982bbfc567961277c9dc37edc9e26dd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 40,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 38",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "58d831eb3253a0b9557a200d82d35746",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 41,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 39",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "afc331696f1962d0279c1bc008214290",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 13,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 132",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "c48ae2be1d69f7617d11a536fc412ecc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 42,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 40",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "884a84a270393a45405a4f998f6218a4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 43,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 41",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "64111b02a6d8cc42d2ce1f0591beb116",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 14,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 133",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "788d19f8d810a4aa5ece311d54cb7d0b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 44,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 42",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "4fd53b326078399d0bcc2c97d4520213",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 45,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 43",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "99a3de2bfa79bf4fbe7ad5dde4bfd695",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 7,
                        "unitIndex": 66
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 66",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "叙述日常活动",
            "cefrLevel": null
        },
        {
            "unitIndex": 67,
            "levels": [
                {
                    "id": "e4d0d38e50787e793b641012760aebd3",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 67
                    },
                    "pathLevelClientData": {
                        "unitIndex": 67,
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 44",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "0ec06f0675d3b5aefbcd7d0284d35524",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 47,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 45",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9d8a290d4034215c2c3bc709230580da",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 15,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 134",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "cf1946b3285b97f09866a4adf1719603",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 48,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 46",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "82ac45e5675ac6cee7e9ef594925b755",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 49,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 47",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "6345c0b4591ed92821cf4675a024a075",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 50,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 48",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ad0373460ce5d1cd5ab19fea5744c554",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 51,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 49",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "fc27b72fa38f8daf83cb89d637572bb8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 16,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 135",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "7f92cdb0e57b1a2af5def9c2bf8ad1ac",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 52,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 50",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "303599cdc42e562de8b0eaeff5c06908",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 8,
                        "unitIndex": 67
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 67",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "述说各种兴趣与爱好",
            "cefrLevel": null
        },
        {
            "unitIndex": 68,
            "levels": [
                {
                    "id": "e7f30e7086364fe71c8b391a97e1a069",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 68
                    },
                    "pathLevelClientData": {
                        "unitIndex": 68,
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 51",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f0e3ed841282afe1b4e41142db63e74c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 54,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 52",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c1e1fdd626e92082278e1d2beaf8eb97",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 55,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 53",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "0b74347d46129de45e0df94d6a8e0a98",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 17,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 136",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "1d53163781decfb30a83e3a034813ebf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 56,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 54",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "6108e96aabf792838ba59b987794ab19",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 57,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 55",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5bc2178a8daac3ebebfaa477088d063e",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 18,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 137",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "0a5018761d7945275dd2bef35cc1bac4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 58,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 56",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "4a1eac864ccc626173b6b04d98f9f62d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 59,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 57",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a8dd3d7bad7773c313aa67e178bf54ec",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 9,
                        "unitIndex": 68
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 68",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "讨论自然生态",
            "cefrLevel": null
        },
        {
            "unitIndex": 69,
            "levels": [
                {
                    "id": "823274be3e87057a1838cac228c7f2af",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 69
                    },
                    "pathLevelClientData": {
                        "unitIndex": 69,
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 58",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e4281b0b9a6d44d141f810b1eef46079",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 61,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 59",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "65ed3fc3487388344e25457883fb27a4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 19,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 138",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5000d67f980ff4497fde834f80350ffc",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 62,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 60",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "44e5528a9f56f74cd2a0836805d0e67f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 63,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 61",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "30249c2f6a11d1453280a2f85f74b62b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 64,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 62",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "69ed8503b20dc11665b6e0d158f04fb3",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 65,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 63",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "62850b6b0d01156b12cded27590caad7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 20,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 139",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "9877e6ecf22b2ba6d1872b0722795889",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 66,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 64",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d4146c4f98965eeb8c7835cbfb2b95b0",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 10,
                        "unitIndex": 69
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 69",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "讲述工作细节",
            "cefrLevel": null
        },
        {
            "unitIndex": 70,
            "levels": [
                {
                    "id": "e35a0644314490d500c10102086730db",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 70
                    },
                    "pathLevelClientData": {
                        "unitIndex": 70,
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 65",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5127f4b81412ff4f6c99b48e923944f7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 68,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 66",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "3a4880da07f6d01877bee114f2b314ce",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 69,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 67",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "04d6b85b456f1f1642fcb73aa7a3e589",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 21,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 140",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "11d9abb7d8fdb54967ae07f9fcefbdaa",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 70,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 68",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "50482c0b4912e1dca5f0230cb1237dd8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 71,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 69",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d7f23a282d2ad60087d0f72bbe4cd892",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 22,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 141",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "97c2207b35c8a69e0adfbc175e2c65b4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 72,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 70",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ccdce17e8ec93885c3076efa547dd0f9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 73,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 71",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "32357f3b2796d8401daa3e97f8d9dde4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 11,
                        "unitIndex": 70
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 70",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "描述周围的人",
            "cefrLevel": null
        },
        {
            "unitIndex": 71,
            "levels": [
                {
                    "id": "0f63636a111f6b770227c6dab4595ad1",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 71
                    },
                    "pathLevelClientData": {
                        "unitIndex": 71,
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 72",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "3a9600d572bb1b5d8742a4a9baa6a070",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 75,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 73",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f144a1d4ea892b5db8071224c22d2c51",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 23,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 142",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "94e3cc32447376c086c5aa92ad9df96b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 76,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 74",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c65b0396a861852d4aee1824ccd43c68",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 77,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 75",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "97c7eb3e525a13454e8465ce06ad3481",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 78,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 76",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7cc4fbec39b580eb850d1aa03d06d6b4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 79,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 77",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "8069cb5137695c653557ea6fdc73fe02",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 24,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 143",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "a11351facd21fdeb00dfb35bf267adb8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 80,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 78",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "7a173fd3501c634e34cc9d3cb8598f72",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 12,
                        "unitIndex": 71
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 71",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "请求别人不做某事",
            "cefrLevel": null
        },
        {
            "unitIndex": 72,
            "levels": [
                {
                    "id": "f45be3307e3c38c76ab0e239e69ce88c",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 72
                    },
                    "pathLevelClientData": {
                        "unitIndex": 72,
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 79",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ed0af111543b9f0380e27befa565e442",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 82,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 80",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a2d82364e822e28f044354aae20e85e5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 83,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 81",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "8b3d1c5ca761516ee13c7305e9031fcd",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 25,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 144",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "87c3c42c72bf8a6973cc587fb3ddaa47",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 84,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 82",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c4f1d527ca434d819501c2d4f871254f",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 85,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 83",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d4f5b3c6693af807e443526549a4ad26",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 26,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 145",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ec88ff2a7c115201986e8f795054369a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 86,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 84",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e5d6dac7d9ffe83a8585c2769f7556ea",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 87,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 85",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "843ea170d0375c2bab8586a44d27793b",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 13,
                        "unitIndex": 72
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 72",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "给出建议",
            "cefrLevel": null
        },
        {
            "unitIndex": 73,
            "levels": [
                {
                    "id": "74cc163099d1165100dcddef0c515651",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 73
                    },
                    "pathLevelClientData": {
                        "unitIndex": 73,
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 86",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "a809627311b172dbe7b5b401c1865c7a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 89,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 87",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5b49cf05e260e17d33c178cb0540e96a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 27,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 146",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "90b0824bd38cb968fe0ff1ae637490db",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 90,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 88",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "61aab949de65713f71e8ccb1c92ab6e7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 91,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 89",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "149736c36e8359be805d4a3077a1c373",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 92,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 90",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "2a7518a1d9116f9ff0f42a5c0a64f5ff",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 93,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 91",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "f6675c913ed03283d782626b4afa8199",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 28,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 147",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "ea5a6ffe893e1f9899b3168fd1864493",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 94,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 92",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "b8024f952bdaa57872f3a11ec02fc8e7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 14,
                        "unitIndex": 73
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 73",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "讲述学校",
            "cefrLevel": null
        },
        {
            "unitIndex": 74,
            "levels": [
                {
                    "id": "f872d76688485f22534fbe200936b4cf",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 74
                    },
                    "pathLevelClientData": {
                        "unitIndex": 74,
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 93",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "98a7138ef629959ed87bd39a25ef4261",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 96,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 94",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "e507c5b699247496f3a320f07c844116",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 29,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 148",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "16942869db9ad1db6de53419f6d2c5d8",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 97,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 95",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "ace17e343f24ed603ac87594aa8c170d",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 98,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 96",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "21c785d66f929a7b4a895731773e66af",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 99,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 97",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "9c55c64a6e4c66ab84989f90856190a9",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 100,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 98",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "3b5688aaa4fbfcfe791f82eac9ecfbd5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 30,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 149",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "5d27727611be0f3b4dd359fec609f0a5",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 101,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 99",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "61f9ab71ee9a3e819863932fb945aa23",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 102,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 100",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "8c4ab871efc38c662dd5c785ee8bac4c",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 15,
                        "unitIndex": 74
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 74",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "表达心里的感受",
            "cefrLevel": null
        },
        {
            "unitIndex": 75,
            "levels": [
                {
                    "id": "9f36484e9df9c6bd7a682e0b30aa68b2",
                    "state": "unit_test",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "unitIndex": 75
                    },
                    "pathLevelClientData": {
                        "unitIndex": 75,
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "numberOfLegendarySessions": 8
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 101",
                    "hasLevelReview": false,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c8ca5a836adcb1a6a6a63dd2553a0187",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 104,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 102",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "b8fba596f4bddeb1a56f09b22c1929e1",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 105,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 103",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5772dbf504a0c9b13ceecc8f25a384cf",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 106,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 104",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "5aa0eae88052504fe90050a8884489ac",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 31,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 150",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "c06babab0a0adde2d6ec4982131f3483",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 107,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "23262352c8e731853117316103b3af19",
                            "79ce90c245282de8e505986ee39f70fe",
                            "535d193363180b55b666a0bf6bd2c075",
                            "7ea1fab3c1474877880196e5370f8cb3",
                            "7433bca530faf7178471bc1c2944e3c6",
                            "0511f3638177aa1254a71d405f0c4e20",
                            "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                            "44083ba1c83af29901b1c508da98a282",
                            "f875c00ce25ea352aeb0f59e74b2a0a2",
                            "251f0c9ce3f0c9d834116dc9c2067529",
                            "3485b42823b179b12fb5f8442c10f019"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 105",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "d0a548095d91b5651d2f54f8e2bf47f7",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 108,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "1d97e7f4db540148fbf22a3bf0052492",
                            "b756ba8e8aa8451cb6595fd7d104e49b",
                            "470f54788c697f60145d1d30a95b12a1",
                            "59a6083d2904f6a7fa00eb8d0f443968",
                            "19f98f631d3d0ba58de589143122466d",
                            "64a04bd0db62b0d5fedd5b5f0bfa5160",
                            "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                            "f3a24433f9a9d51aecbec2cd3d5462fe",
                            "34c8a1146c32e6a636fff6bb32966f49",
                            "e653c9899db60b9fae807fec232fed3e",
                            "cfaf434786d96e7b6854455806cbb34f"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 106",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "572a01eaa8885c697058491ff7076f3a",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 109,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "757f9fc1dee22baff6a2696c764dfa9b",
                            "54933d3c3a091aca9fe4fc87bb3ceadb",
                            "6a07a31f9c8b111d0a1b413bf3f14ba0",
                            "84a2dc5181b21f3b82a11a77497c8852",
                            "25d997f16eb88f1fce74702500b395aa",
                            "625593ea8064dace3765b74e245f6d2e",
                            "9a9c4deb63a65e2577aeec58a1d0b522",
                            "5baae422dac3202f9ea22011b348437e",
                            "d7cc577ae6b6a35af633a6c7134d91d8",
                            "9cf44664998be3bda362f64cb1e050ab",
                            "bd50cad7dd54507405df8d44667956d2"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 107",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "c4219516deb5ff4be3264cd930d77cda",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 32,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {},
                    "totalSessions": 1,
                    "debugName": "Chest 151",
                    "hasLevelReview": false,
                    "type": "chest",
                    "subtype": "chest"
                },
                {
                    "id": "be904d18a895d3e32dafbb9d788a2dac",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 110,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 108",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "44849eceba0d20a90345ed83b1e87ae4",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 111,
                        "treeId": "dd7b1d897391354c54f8247569824f14"
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "d1747e18da8f996fd21f480b8d7b8e7f",
                            "bcd864ad1130b7985cecbacb521211f7",
                            "8ac049b345b003c7f1489a0d9d2fb54a",
                            "cd44e21fd6fc7930ae089546b2b9f1ab",
                            "4a56e89bb8eb633a5f9d35799f644ceb",
                            "f60f066d323590cc8f182a40ba390c78",
                            "1ede4b0d77818c0d6dcc88fd20e4a557",
                            "1461c842b8dbf4ab3e877d4f6198a6b3",
                            "3afe6b0251f552303737a3a8ca8896a2",
                            "cc04a59957a5af3b54a12b78699dee1d"
                        ],
                        "isPathExtension": true
                    },
                    "totalSessions": 5,
                    "debugName": "Path Extension Practice Level 109",
                    "hasLevelReview": true,
                    "type": "practice",
                    "subtype": "practice"
                },
                {
                    "id": "50b25f5af02b2d8f4899a54af6db76db",
                    "state": "locked",
                    "finishedSessions": 0,
                    "pathLevelMetadata": {
                        "anchorSkillId": "bd50cad7dd54507405df8d44667956d2",
                        "indexSinceAnchorSkill": 16,
                        "unitIndex": 75
                    },
                    "pathLevelClientData": {
                        "skillIds": [
                            "212afba3f93b8a507d056fa193d5afe9",
                            "5166469d9473d3d711a25eeb839d46c2",
                            "d197e1d75993ad18451acf3bb322aad8",
                            "2f05c47c9e88b3d9e5c0da875c742a72",
                            "1d159716d3b2cde4ad6203341e3f3131",
                            "e8d62283eeca13ff88c5ba2375eb887e",
                            "9d33ba466317e26b6c33f0b5df4ae975",
                            "b99c224c4dd829652e0695810ba4d5aa",
                            "b3fa3e60a13b9a0cd48c8a776bffdf04",
                            "c7995f016b476ff68c57530843d2fbfc"
                        ]
                    },
                    "totalSessions": 1,
                    "debugName": "Unit Review 75",
                    "hasLevelReview": false,
                    "type": "unit_review",
                    "subtype": "unit_review"
                }
            ],
            "guidebook": null,
            "teachingObjective": "表达身体的疼痛",
            "cefrLevel": null
        }
    ],
    "placementDepth": null,
    "placementTestAvailable": true,
    "preload": false,
    "progressVersion": 0,
    "sections": [
        {
            "checkpointAccessible": true,
            "checkpointFinished": false,
            "checkpointSessionType": "CHECKPOINT_TEST",
            "masteryScore": null,
            "name": "关卡 1",
            "numRows": 7,
            "summary": null,
            "cefrLevel": null
        },
        {
            "checkpointAccessible": true,
            "checkpointFinished": false,
            "checkpointSessionType": "CHECKPOINT_TEST",
            "masteryScore": null,
            "name": "关卡 2",
            "numRows": 14,
            "summary": null,
            "cefrLevel": null
        },
        {
            "checkpointAccessible": true,
            "checkpointFinished": false,
            "checkpointSessionType": "CHECKPOINT_TEST",
            "masteryScore": null,
            "name": "关卡 3",
            "numRows": 15,
            "summary": null,
            "cefrLevel": null
        },
        {
            "checkpointAccessible": true,
            "checkpointFinished": false,
            "checkpointSessionType": "CHECKPOINT_TEST",
            "masteryScore": null,
            "name": "关卡 4",
            "numRows": 14,
            "summary": null,
            "cefrLevel": null
        },
        {
            "checkpointAccessible": true,
            "checkpointFinished": false,
            "checkpointSessionType": "CHECKPOINT_TEST",
            "masteryScore": null,
            "name": "关卡 5",
            "numRows": 13,
            "summary": null,
            "cefrLevel": null
        }
    ],
    "skills": [
        [
            {
                "accessible": true,
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 1,
                "id": "f5bef73815a99b164424898208e0d935",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "平假名",
                "perfectLessonStreak": 0,
                "shortName": "平假名",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "pingjiaming"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 1,
                "id": "87800fbc22fb152f3c52de18fda787f1",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "平假名 2",
                "perfectLessonStreak": 0,
                "shortName": "平假名 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "pingjiaming2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 1,
                "id": "b19a477b4690f5ccf98ee32d3e318ba0",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "平假名 3",
                "perfectLessonStreak": 0,
                "shortName": "平假名 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "pingjiaming3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 1,
                "id": "5a7f8be86104ccc6137aeeeeffea48cc",
                "lastLessonPerfect": false,
                "lessons": 7,
                "levels": 6,
                "name": "平假名 4",
                "perfectLessonStreak": 0,
                "shortName": "平假名 4",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "pingjiaming4"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 24,
                "id": "4beaf72025b23440a4577d714ab8ac88",
                "lastLessonPerfect": false,
                "lessons": 2,
                "levels": 6,
                "name": "问候",
                "perfectLessonStreak": 0,
                "shortName": "问候",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "wenhou"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 43,
                "id": "399d6216ef8c713334baa4a927e8b9c7",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "介绍",
                "perfectLessonStreak": 0,
                "shortName": "介绍",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jieshao"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 49,
                "id": "63ea85e7abdccf7835312a06b2f61273",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "人",
                "perfectLessonStreak": 0,
                "shortName": "人",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "ren"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 52,
                "id": "58db4bbe66e21e6e5fd4221cf34a193f",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "兴趣爱好",
                "perfectLessonStreak": 0,
                "shortName": "兴趣爱好",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "xingquaihao"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 3,
                "id": "5474891216c4be85c701c9f69932dd27",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "饮食",
                "perfectLessonStreak": 0,
                "shortName": "饮食",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "yinshi"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 27,
                "id": "c137d9b82a68a921b35e70247b1bfdac",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "时间",
                "perfectLessonStreak": 0,
                "shortName": "时间",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "shijian"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 140,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 27,
                "id": "dd87cbf87ede0eae123270472f3d283c",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "时间 2",
                "perfectLessonStreak": 0,
                "shortName": "时间 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "shijian2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 28,
                "id": "4286fcac171cf0dfdc6c978adca775de",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "家居",
                "perfectLessonStreak": 0,
                "shortName": "家居",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiaju"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 43,
                "id": "72fdd587d09497003952e9b5e8654959",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "介绍 2",
                "perfectLessonStreak": 0,
                "shortName": "介绍 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jieshao2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 35,
                "id": "39f8a11f97de655329ab0034b6b62eeb",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "家庭",
                "perfectLessonStreak": 0,
                "shortName": "家庭",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiating"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 16,
                "id": "bc8dc370ca93bfe2851c54989077e6fb",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "学校",
                "perfectLessonStreak": 0,
                "shortName": "学校",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "xuexiao"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 46,
                "id": "fd89922945557c61020632e2a335db19",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "餐馆",
                "perfectLessonStreak": 0,
                "shortName": "餐馆",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "canguan"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 35,
                "id": "bc657cf186c9f76908da9c1104ea2b78",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "家庭 2",
                "perfectLessonStreak": 0,
                "shortName": "家庭 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiating2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 23,
                "id": "967a34042c0d5ec37a9308188b26a683",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "活动",
                "perfectLessonStreak": 0,
                "shortName": "活动",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "huodong"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 27,
                "id": "344e6f7b6b72c2acad5f5d8903bd0e66",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "日程",
                "perfectLessonStreak": 0,
                "shortName": "日程",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "richeng"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 12,
                "id": "c5d0c47d96042e486c2cd5281b2eeca3",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "位置",
                "perfectLessonStreak": 0,
                "shortName": "位置",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "weizhi"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 28,
                "id": "1fdee0b82fe3a91ec234ec5e713be133",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "家居 2",
                "perfectLessonStreak": 0,
                "shortName": "家居 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiaju2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 170,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 39,
                "id": "46e08feb020c05f5beb867d2de3de300",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "爱好",
                "perfectLessonStreak": 0,
                "shortName": "爱好",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "aihao"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 36,
                "id": "979b6e71b104b45f22b86bd2babf0de3",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "交通",
                "perfectLessonStreak": 0,
                "shortName": "交通",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiaotong"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 44,
                "id": "e788aec0cead4bcaf6ca5438e94f172b",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "酒店",
                "perfectLessonStreak": 0,
                "shortName": "酒店",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiudian"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 34,
                "id": "3135b3a7e0dbba5f3ed68ce50400e43a",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "服饰",
                "perfectLessonStreak": 0,
                "shortName": "服饰",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "fushi"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 52,
                "id": "b164562e78e113b5f5000fec1cf50426",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "爱好 2",
                "perfectLessonStreak": 0,
                "shortName": "爱好 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "aihao2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 50,
                "id": "4a208dfe844640982aea79affa50bdca",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "天气",
                "perfectLessonStreak": 0,
                "shortName": "天气",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "tianqi"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 33,
                "id": "23262352c8e731853117316103b3af19",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "兴趣爱好 2",
                "perfectLessonStreak": 0,
                "shortName": "兴趣爱好 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "xingquaihao2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 14,
                "id": "1d97e7f4db540148fbf22a3bf0052492",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "天气 2",
                "perfectLessonStreak": 0,
                "shortName": "天气 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "tianqi2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 12,
                "id": "757f9fc1dee22baff6a2696c764dfa9b",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "方向",
                "perfectLessonStreak": 0,
                "shortName": "方向",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "fangxiang"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 3,
                "id": "212afba3f93b8a507d056fa193d5afe9",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "饮食 2",
                "perfectLessonStreak": 0,
                "shortName": "饮食 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "yinshi2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 46,
                "id": "d1747e18da8f996fd21f480b8d7b8e7f",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "餐馆 2",
                "perfectLessonStreak": 0,
                "shortName": "餐馆 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "canguan2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 200,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 18,
                "id": "e6569d6e4322beaae5b4c3a966103cc9",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "向导",
                "perfectLessonStreak": 0,
                "shortName": "向导",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "xiangdao"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 26,
                "id": "9815b5f33c50b37e54418429ecd121c9",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "购物",
                "perfectLessonStreak": 0,
                "shortName": "购物",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "gouwu"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 27,
                "id": "c3a471c702bf20982b17d4e1846a5975",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "日期",
                "perfectLessonStreak": 0,
                "shortName": "日期",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "riqi"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 35,
                "id": "79ce90c245282de8e505986ee39f70fe",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "人 2",
                "perfectLessonStreak": 0,
                "shortName": "人 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "ren2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 27,
                "id": "b756ba8e8aa8451cb6595fd7d104e49b",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "日期 2",
                "perfectLessonStreak": 0,
                "shortName": "日期 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "riqi2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 9,
                "id": "54933d3c3a091aca9fe4fc87bb3ceadb",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "活动 2",
                "perfectLessonStreak": 0,
                "shortName": "活动 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "huodong2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 15,
                "id": "5166469d9473d3d711a25eeb839d46c2",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "自然",
                "perfectLessonStreak": 0,
                "shortName": "自然",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "ziran"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 22,
                "id": "bcd864ad1130b7985cecbacb521211f7",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "教室",
                "perfectLessonStreak": 0,
                "shortName": "教室",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiaoshi"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 33,
                "id": "0064fc23d280a37aa89450bcf4d9c7d4",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "感受",
                "perfectLessonStreak": 0,
                "shortName": "感受",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "ganshou"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 15,
                "id": "c657a44d4bd02633dd4170a468a12abc",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "事物",
                "perfectLessonStreak": 0,
                "shortName": "事物",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "shiwu"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 12,
                "id": "b5e7f9b7ea2f7adc3fe26150f2419b86",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "方向 2",
                "perfectLessonStreak": 0,
                "shortName": "方向 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "fangxiang2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 230,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 34,
                "id": "535d193363180b55b666a0bf6bd2c075",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "购物 2",
                "perfectLessonStreak": 0,
                "shortName": "购物 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "gouwu2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 52,
                "id": "470f54788c697f60145d1d30a95b12a1",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "爱好 3",
                "perfectLessonStreak": 0,
                "shortName": "爱好 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "aihao3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 22,
                "id": "6a07a31f9c8b111d0a1b413bf3f14ba0",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "教室 2",
                "perfectLessonStreak": 0,
                "shortName": "教室 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiaoshi2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 22,
                "id": "d197e1d75993ad18451acf3bb322aad8",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "教室 3",
                "perfectLessonStreak": 0,
                "shortName": "教室 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiaoshi3"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 10,
                "id": "8ac049b345b003c7f1489a0d9d2fb54a",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "健康",
                "perfectLessonStreak": 0,
                "shortName": "健康",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiankang"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 36,
                "id": "ad68c5895fe211329c481c27e69d86b4",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "假期",
                "perfectLessonStreak": 0,
                "shortName": "假期",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiaqi"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 7,
                "id": "f5945b45236e5f5b0cf8ac487cd8aed7",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "事物 2",
                "perfectLessonStreak": 0,
                "shortName": "事物 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "shiwu2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 27,
                "id": "6c8290bc4c546d69c6e30eae7189919b",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "日期 3",
                "perfectLessonStreak": 0,
                "shortName": "日期 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "riqi3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 35,
                "id": "7ea1fab3c1474877880196e5370f8cb3",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "人 3",
                "perfectLessonStreak": 0,
                "shortName": "人 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "ren3"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 37,
                "id": "59a6083d2904f6a7fa00eb8d0f443968",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "亚文化",
                "perfectLessonStreak": 0,
                "shortName": "亚文化",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "yawenhua"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 2,
                "id": "84a2dc5181b21f3b82a11a77497c8852",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "动物",
                "perfectLessonStreak": 0,
                "shortName": "动物",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "dongwu"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 260,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 53,
                "id": "2f05c47c9e88b3d9e5c0da875c742a72",
                "lastLessonPerfect": false,
                "lessons": 4,
                "levels": 6,
                "name": "奥运会",
                "perfectLessonStreak": 0,
                "shortName": "奥运会",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "aoyunhui"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 30,
                "id": "cd44e21fd6fc7930ae089546b2b9f1ab",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "建议",
                "perfectLessonStreak": 0,
                "shortName": "建议",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jianyi"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 51,
                "id": "1362ad4c6f845469d698c1b11f774f0b",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "购物 3",
                "perfectLessonStreak": 0,
                "shortName": "购物 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "gouwu3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 29,
                "id": "020ab7c40a8b715219794aab5a6b3211",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "娱乐",
                "perfectLessonStreak": 0,
                "shortName": "娱乐",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "yule"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 36,
                "id": "dff7c28825b1f9518fea22da926d2dac",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "旅游",
                "perfectLessonStreak": 0,
                "shortName": "旅游",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "lvyou"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 16,
                "id": "7433bca530faf7178471bc1c2944e3c6",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "能力",
                "perfectLessonStreak": 0,
                "shortName": "能力",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "nengli"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 23,
                "id": "19f98f631d3d0ba58de589143122466d",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "能力 2",
                "perfectLessonStreak": 0,
                "shortName": "能力 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "nengli2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 40,
                "id": "25d997f16eb88f1fce74702500b395aa",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "能力 3",
                "perfectLessonStreak": 0,
                "shortName": "能力 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "nengli3"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 15,
                "id": "1d159716d3b2cde4ad6203341e3f3131",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "旅游 2",
                "perfectLessonStreak": 0,
                "shortName": "旅游 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "lvyou2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 21,
                "id": "4a56e89bb8eb633a5f9d35799f644ceb",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "记忆",
                "perfectLessonStreak": 0,
                "shortName": "记忆",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiyi"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 5,
                "id": "27adefaf109428fdb05f591d6d663ce5",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "活动 3",
                "perfectLessonStreak": 0,
                "shortName": "活动 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "huodong3"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 290,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 44,
                "id": "50c7e5aaf02c66f7de1e25bb3c5efc69",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "节假日",
                "perfectLessonStreak": 0,
                "shortName": "节假日",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "jiejiari"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 33,
                "id": "2581bd574ff56e95a11ccbba1fa3f654",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "恩惠",
                "perfectLessonStreak": 0,
                "shortName": "恩惠",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "enhui"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 14,
                "id": "0511f3638177aa1254a71d405f0c4e20",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "大自然 2",
                "perfectLessonStreak": 0,
                "shortName": "大自然 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "daziran2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 3,
                "id": "64a04bd0db62b0d5fedd5b5f0bfa5160",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "便利店",
                "perfectLessonStreak": 0,
                "shortName": "便利店",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "便利店"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 46,
                "id": "625593ea8064dace3765b74e245f6d2e",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "餐馆 3",
                "perfectLessonStreak": 0,
                "shortName": "餐馆 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "canguan3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 15,
                "id": "e8d62283eeca13ff88c5ba2375eb887e",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "生态",
                "perfectLessonStreak": 0,
                "shortName": "生态",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "shengtai"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 14,
                "id": "f60f066d323590cc8f182a40ba390c78",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "资源",
                "perfectLessonStreak": 0,
                "shortName": "资源",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "ziyuan"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 24,
                "id": "427db9f90637a60fa3d9a7c0e57daef7",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "样态",
                "perfectLessonStreak": 0,
                "shortName": "样态",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "yangtai"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 33,
                "id": "230e67eeb312530072eaee1427d054be",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "感受 2",
                "perfectLessonStreak": 0,
                "shortName": "感受 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "ganshou2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 24,
                "id": "b82b25ab68a12329aab3c8dd97d4cde2",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "可能性",
                "perfectLessonStreak": 0,
                "shortName": "可能性",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "kenengxing"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 43,
                "id": "fefaaa3c0a69b8cdc7614a4b5d8bdcd2",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "可能性 2",
                "perfectLessonStreak": 0,
                "shortName": "可能性 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "可能性-2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 320,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 46,
                "id": "73a3f3175a8ecd47f4c7f2f9b4cab7da",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "烹饪",
                "perfectLessonStreak": 0,
                "shortName": "烹饪",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "烹饪"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 3,
                "id": "9a9c4deb63a65e2577aeec58a1d0b522",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "食物 3",
                "perfectLessonStreak": 0,
                "shortName": "食物 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "食物-3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 38,
                "id": "9d33ba466317e26b6c33f0b5df4ae975",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "紧急情况",
                "perfectLessonStreak": 0,
                "shortName": "紧急情况",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "紧急情况"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 19,
                "id": "1ede4b0d77818c0d6dcc88fd20e4a557",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "交通 2",
                "perfectLessonStreak": 0,
                "shortName": "交通 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "交通-2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 10,
                "id": "5df109bc085b833999f97c494bece25b",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "灾害",
                "perfectLessonStreak": 0,
                "shortName": "灾害",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "灾害"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 36,
                "id": "a03d99668b6114d5d098d6bb6e6da8f8",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "旅游 3",
                "perfectLessonStreak": 0,
                "shortName": "旅游 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "旅游-3"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 22,
                "id": "186e55d4504350aea665de77c54ae858",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "教育",
                "perfectLessonStreak": 0,
                "shortName": "教育",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "教育"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 47,
                "id": "44083ba1c83af29901b1c508da98a282",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "动物 2",
                "perfectLessonStreak": 0,
                "shortName": "动物 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "动物-2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 16,
                "id": "f3a24433f9a9d51aecbec2cd3d5462fe",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "教育 2",
                "perfectLessonStreak": 0,
                "shortName": "教育 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "教育-2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 31,
                "id": "5baae422dac3202f9ea22011b348437e",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "工作",
                "perfectLessonStreak": 0,
                "shortName": "工作",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "工作"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 40,
                "id": "b99c224c4dd829652e0695810ba4d5aa",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "工作 2",
                "perfectLessonStreak": 0,
                "shortName": "工作 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "工作-2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 350,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 22,
                "id": "1461c842b8dbf4ab3e877d4f6198a6b3",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "义务",
                "perfectLessonStreak": 0,
                "shortName": "义务",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "义务"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 33,
                "id": "d30a427553b2bed5767c5301319c1287",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "欲望",
                "perfectLessonStreak": 0,
                "shortName": "欲望",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "欲望"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 43,
                "id": "f4bdfc39a46fc01052510545eacfc227",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "义务 2",
                "perfectLessonStreak": 0,
                "shortName": "义务 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "义务-2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 24,
                "id": "eaa3e53641f1aa1d44031d9ae380e362",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "想法",
                "perfectLessonStreak": 0,
                "shortName": "想法",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "想法"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 16,
                "id": "f875c00ce25ea352aeb0f59e74b2a0a2",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "研究",
                "perfectLessonStreak": 0,
                "shortName": "研究",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "研究"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 22,
                "id": "34c8a1146c32e6a636fff6bb32966f49",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "学校 2",
                "perfectLessonStreak": 0,
                "shortName": "学校 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "学校-2"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 33,
                "id": "d7cc577ae6b6a35af633a6c7134d91d8",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "宗教",
                "perfectLessonStreak": 0,
                "shortName": "宗教",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "宗教"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 53,
                "id": "b3fa3e60a13b9a0cd48c8a776bffdf04",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "健康 2",
                "perfectLessonStreak": 0,
                "shortName": "健康 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "健康-2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 52,
                "id": "3afe6b0251f552303737a3a8ca8896a2",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "健康 3",
                "perfectLessonStreak": 0,
                "shortName": "健康 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "健康-3"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 6,
                "id": "698711aabf82927df96e41dd956a3e28",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "海鲜",
                "perfectLessonStreak": 0,
                "shortName": "海鲜",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "海鲜"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 30,
                "id": "f3880299e78fd87cf4c48e6813414c0c",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "社会",
                "perfectLessonStreak": 0,
                "shortName": "社会",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "社会"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 380,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 31,
                "id": "755735f779a394170e02302235e324cb",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "政府",
                "perfectLessonStreak": 0,
                "shortName": "政府",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "政府"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 45,
                "id": "251f0c9ce3f0c9d834116dc9c2067529",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "活动 4",
                "perfectLessonStreak": 0,
                "shortName": "活动 4",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "活动-4"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 33,
                "id": "e653c9899db60b9fae807fec232fed3e",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "感受 3",
                "perfectLessonStreak": 0,
                "shortName": "感受 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "感受-3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 43,
                "id": "9cf44664998be3bda362f64cb1e050ab",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "社会 2",
                "perfectLessonStreak": 0,
                "shortName": "社会 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "社会-2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 21,
                "id": "c7995f016b476ff68c57530843d2fbfc",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "记忆 2",
                "perfectLessonStreak": 0,
                "shortName": "记忆 2",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "记忆-2"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 44,
                "id": "cc04a59957a5af3b54a12b78699dee1d",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "艺术",
                "perfectLessonStreak": 0,
                "shortName": "艺术",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "艺术"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 49,
                "id": "daae8c2b0dad997361037245ca71d01f",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "人 4",
                "perfectLessonStreak": 0,
                "shortName": "人 4",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "人-4"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 17,
                "id": "ef1b59bcdd2b05d25d8c95460a4423d2",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "工作 3",
                "perfectLessonStreak": 0,
                "shortName": "工作 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "工作-3"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 50,
                "id": "beccb50a0103b00f300ff502cedb6f95",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "天气 3",
                "perfectLessonStreak": 0,
                "shortName": "天气 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "天气-3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 16,
                "id": "3485b42823b179b12fb5f8442c10f019",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "法律",
                "perfectLessonStreak": 0,
                "shortName": "法律",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "法律"
            }
        ],
        [
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 30,
                "id": "cfaf434786d96e7b6854455806cbb34f",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "社会 3",
                "perfectLessonStreak": 0,
                "shortName": "社会 3",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "社会-3"
            },
            {
                "experimentIds": [],
                "experimentalLessons": [],
                "finalLevelTimeLimit": 410,
                "finishedLessons": 0,
                "finishedLevels": 0,
                "hasLevelReview": true,
                "hasFinalLevel": true,
                "iconId": 22,
                "id": "bd50cad7dd54507405df8d44667956d2",
                "lastLessonPerfect": false,
                "lessons": 5,
                "levels": 6,
                "name": "计划",
                "perfectLessonStreak": 0,
                "shortName": "计划",
                "skillType": "NORMAL",
                "strength": null,
                "tipsAndNotes": null,
                "urlName": "计划"
            }
        ]
    ],
    "status": "RELEASED",
    "storiesTabPromotionLocation": null,
    "title": "日语",
    "trackingProperties": {
        "direction": "ja<-zs",
        "took_placementtest": false,
        "max_cefr_level": null,
        "max_section_index": null,
        "final_level_skill_count": 0,
        "gold_tree_percent": 0.0,
        "final_level_tree_percent": 0.0,
        "total_crowns": 0,
        "max_completed_skill_y_coord": null,
        "learning_language": "ja",
        "gold_skill_count": 0,
        "gold_level_skill_count": 0,
        "num_skills_newly_decayed": 0,
        "gold_level_tree_percent": 0.0,
        "num_skills_decayed": 0,
        "ui_language": "zs",
        "max_tree_level": 1
    },
    "ttsAccents": null,
    "wordsLearned": 0,
    "healthEnabled": true,
    "progressQuizHistory": [],
    "xp": 0,
    "smartTips": []
}