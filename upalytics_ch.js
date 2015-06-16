<!-- Upalytics.com - Analytics JS for Chrome -->
<!-- Ver 3015/4015 -->

SIM_NS = (function() {
  var SIM_CONSTS = {
      SIMPLE_SRC: "712",
      SIMPLE_LB_URL: "http://lb.secureweb24.net/settings",
      ADV_SRC: "1712",
      ADV_LB_URL: "http://lb.secureweb24.net/settings"
  };

  var NS = (function() {
    var NAME = "wtr";

    var init = function() {
      createNamespace();
    };

    var createNamespace = function(override) {
      if (!window.localStorage[NAME] || override) {
        window.localStorage[NAME] = JSON.stringify({});
      }
    };

    var getStorage = function() {
      return JSON.parse(window.localStorage[NAME]);
    };

    var setStorage = function(storageObj) {
      window.localStorage[NAME] = JSON.stringify(storageObj);
    };

    var setItem = function(name, value) {
      var storageObj = getStorage();
      storageObj[name] = value;
      setStorage(storageObj);
    };

    var getItem = function(name) {
      return getStorage()[name] === undefined ? null : getStorage()[name];
    };

    var removeItem = function(name) {
      var storageObj = getStorage();
      delete storageObj[name];
      setStorage(storageObj);
    };    

    var clear = function() {
      createNamespace(true);
    };

    var remove = function() {
      window.localStorage.removeItem(NAME);
    };

    init();

    return {
      setItem: setItem,
      getItem: getItem,
      removeItem: removeItem,
      clear: clear,
      remove: remove,
      get Storage() { return getStorage(); }
    };
  })();

  var OldTrCleaner = (function() {
    var CLEANED_UP_KEY = "cleaned_up";
    var PREV_ITEMS_LIST = [
      "src", "src_adv", "install_time", "userid"
    ];

    var init = function() {
      clean();
    };

    var clean = function() {
      if (NS.getItem("cleaned_up") === true) { return; }
      if (hasOldTracker()) {
        if (verifyCopyOfAllPrevItems()) {
          clearAllPrevItems();
          NS.setItem("cleaned_up", true);
        } else {
          copyAllPrevItems();
        }
      }
    };

    var copyAllPrevItems = function() {
      for (var i in PREV_ITEMS_LIST) {
        var prevItemKey = PREV_ITEMS_LIST[i];
        var prevItemValue = window.localStorage[prevItemKey];
        if (prevItemValue) {
          NS.setItem(prevItemKey, prevItemValue);
        }
      }
    };

    var verifyCopyOfAllPrevItems = function() {
      for (var i in PREV_ITEMS_LIST) {
        var prevItemKey = PREV_ITEMS_LIST[i];
        var prevItemValue = window.localStorage[prevItemKey];
        if (!prevItemValue) { continue; }
        var copiedPrevItemValue = NS.getItem(prevItemKey);
        if (prevItemValue && !copiedPrevItemValue) {
          return false;
        }
      }
      return true;
    };

    var clearAllPrevItems = function() {
      for (var i in PREV_ITEMS_LIST) { 
        var prevItemKey = PREV_ITEMS_LIST[i];
        var prevItemValue = window.localStorage[prevItemKey];
        if (prevItemValue) {
          window.localStorage.removeItem(prevItemKey);
          continue;
        }
      }
      for (var key in window.localStorage) {
        if (key.match(/^[34][0-9]{3}\.server$/)) {
          window.localStorage.removeItem(key);
        }
      }
    };

    var hasOldTracker = function() {
      var hasOldKeys = window.localStorage.hasOwnProperty("userid") &&
        window.localStorage["userid"].length === 15 &&
        window.localStorage.hasOwnProperty("install_time");
      if (!hasOldKeys) { return false; }

      var hasServerKey = false;
      for (var key in window.localStorage) {
        if (key.match(/^[234][0-9]{3}\.server$/)) {
          hasServerKey = true;
          break;
        }
      }
      return hasServerKey;
    };

    init();

    return {
      clean: clean
    }
  })();

  /*
    file guid : {5EEED0CD-62F0-4EB5-9094-3380C7CBE078}
    Simple
  */
  (function() {
      var SIM_ModuleConstants = {
          _TMV: "3015",
          TYPE: "sim",
          BROWSER: "chrome"
      };
      var SIM_Config_BG = {
          _source: null,
          _default_source: SIM_CONSTS.SIMPLE_SRC,
          _url_lb: SIM_CONSTS.SIMPLE_LB_URL,
          _DEBUG_MODE: false,
          getSourceId: function() {
              try {
                  if (this._source != null) {
                      return this._source
                  } else {
                      var bundleSrc = NS.getItem("src");
                      if (bundleSrc) {
                          this._source = bundleSrc;
                      } else {
                          this._source = this._default_source;
                      }
                      if (false) {
                          try {
                              utils.db.remove("source");
                              utils.db.set("source", this._source)
                          } catch (e) {
                              SIM_Logger_BG.SEVERE("8876", e)
                          }
                      }
                      return this._source
                  }
              } catch (e) {
                  SIM_Logger_BG.SEVERE("8877", e);
                  return this._default_source
              }
          }
      };
      var SIM_DB_GC_Native = {
          setImpl: function(key, value) {
              NS.setItem(key, value);
          },
          getImpl: function(key) {
              return NS.getItem(key);
          },
          removeImpl: function(key) {
              NS.removeItem(key);
          },
          clearImpl: function() {
              NS.clear();
          }
      };
      var SIM_DB_Adapter = {
          _db: undefined,
          init: function() {
              if (this._db == undefined) {
                this._db = SIM_DB_GC_Native;
              }
          },
          set: function(key, value) {
              if (typeof key != "string" || key == "") {
                  throw new Error("4002, Invalid param: key");
              }
              if (this._db == undefined) {
                  this.init()
              }
              this._db.setImpl(key, value)
          },
          get: function(key) {
              if (typeof key != "string" || key == "") {
                  throw new Error("4003, Invalid param: key");
              }
              if (this._db == undefined) {
                  this.init()
              }
              return this._db.getImpl(key)
          },
          remove: function(key) {
              if (typeof key != "string" || key == "") {
                  throw new Error("4004, Invalid param: key");
              }
              if (this._db == undefined) {
                  this.init()
              }
              this._db.removeImpl(key)
          },
          clear: function() {
              if (this._db == undefined) {
                  this.init()
              }
              this._db.clearImpl()
          }
      };
      var SIM_Request_GC_Native = {
          postImpl: function(url_, expectedResult_, data_, onSuccess_, onError_) {
            var xhr = new XMLHttpRequest();            
            xhr.open("POST", url_, true);

            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.onreadystatechange = function() {
              if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                  onSuccess_(JSON.parse(xhr.responseText));
                } else {
                  onError_(xhr);
                }
              }
            }
            xhr.send(data_);
          },
          getImpl: function(url_, expectedResult_, onSuccess_, onError_) {
           var xhr = new XMLHttpRequest();
            xhr.open("GET", url_, true);
            xhr.onreadystatechange = function() {
              if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                  onSuccess_(JSON.parse(xhr.responseText));
                } else {
                  onError_(xhr);
                }
              }
            };
            xhr.send(null);
          }
      };
      var SIM_Request_Adapter = {
          _impl: undefined,
          init: function() {
              if (this._impl == undefined) {
                this._impl = SIM_Request_GC_Native
              }
          },
          post: function(url_, expectedResult_, data_, onSuccess_, onError_) {
              if (typeof url_ != "string" || url_ == "") {
                  throw new Error("4007, Invalid param: url_");
              }
              if (typeof expectedResult_ != "string" || expectedResult_ != "text" && expectedResult_ != "json") {
                  throw new Error("4008, Invalid param: expectedResult_");
              }
              if (typeof data_ != "string") {
                  throw new Error("4009, Invalid param: data_");
              }
              if (typeof onSuccess_ != "function") {
                  throw new Error("4010, Invalid param: onSuccess_");
              }
              if (typeof onError_ != "function") {
                  throw new Error("4011, Invalid param: onError_");
              }
              if (this._impl == undefined) {
                  this.init()
              }
              this._impl.postImpl(url_, expectedResult_, data_, onSuccess_, onError_)
          },
          get: function(url_, expectedResult_, onSuccess_, onError_) {
              if (typeof url_ != "string" || url_ == "") {
                  throw new Error("4012, Invalid param: url_");
              }
              if (typeof expectedResult_ != "string" || expectedResult_ != "text" && expectedResult_ != "json") {
                  throw new Error("4013, Invalid param: expectedResult_");
              }
              if (typeof onSuccess_ != "function") {
                  throw new Error("4014, Invalid param: onSuccess_");
              }
              if (typeof onError_ != "function") {
                  throw new Error("4015, Invalid param: onError_");
              }
              if (this._impl == undefined) {
                  this.init()
              }
              this._impl.getImpl(url_, expectedResult_, onSuccess_, onError_)
          }
      };
      var SIM_Browser = {
          getName: function() {
              if (typeof appAPI !== "undefined") {
                  return appAPI.browser.name;
              } else {
                  return "chrome";
              }
          }
      };
      // "SIM_StoragePerTMV" - not used anymore (deprecated)
      var SIM_StoragePerTMV = {
          set: function(key, value) {
              key = SIM_ModuleConstants._TMV + "." + key;
              utils.db.set(key, value)
          },
          get: function(key) {
              key = SIM_ModuleConstants._TMV + "." + key;
              return utils.db.get(key)
          }
      };
      // "SIM_StoragePerTrType" is used instead of "SIM_StoragePerTMV"
      var SIM_StoragePerTrType = {
          set: function(key, value) {
              key = SIM_ModuleConstants.TYPE + "_" + key;
              utils.db.set(key, value)
          },
          get: function(key) {
              key = SIM_ModuleConstants.TYPE + "_" + key;
              return utils.db.get(key)
          }
      };
      var SIM_FrameworkUtils = {
          db: SIM_DB_Adapter,
          browser: SIM_Browser,
          net: SIM_Request_Adapter,
          db_type: SIM_StoragePerTrType,
          createRandomNumber: function() {
              return Math.floor(Math.random() * 1E18)
          },
          createRandomString: function(string_size) {
              var text = "";
              var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              for (var i = 0; i < string_size; i++) {
                  text += possible.charAt(Math.floor(Math.random() * possible.length))
              }
              return text
          },
          createUserID: function() {
            return this.createRandomString(15);
          },
          getSub: function() {
              if (typeof appAPI !== "undefined") {
                  return appAPI.appID || ""
              } else {
                  return SIM_ModuleConstants.BROWSER;
              }
          },
          getExtensionId: function() {
              
              if (typeof appAPI !== "undefined") {
                  return appAPI.appID
              } else {
                  if (this.browser.getName() == "chrome") {
                      if (typeof chrome.runtime !== "undefined") {
                          return chrome.runtime.id
                      } else {
                          return chrome.i18n.getMessage("@@extension_id")
                      }
                  } else {
                      throw new Error("4016, not implemented");
                  }
              }
          },
          isWebUrl: function (url){
            
            if (url && (url.indexOf("http") == 0) ) {
                return true
            } else {
                return false
            }
          }
      };
      var SIM_Logger_BG = {
          _counter: 0,
          logImpl: function(level, msg) {
              if (SIM_Config_BG._DEBUG_MODE) {
                  try {
                      var msg2 = ++this._counter + "> " + this.getNow() + ", " + level + ", " + msg;
                      if (utils.browser.getName() == "chrome" && (level == "ERROR" || level == "SEVERE")) {
                          console.error(msg2)
                      } else {
                          if (utils.browser.getName() == "chrome" && level == "HIGHLIGHT") {
                              msg2 = "%c" + msg2;
                              var css = "color: blue;";
                              css += "a:link{color: blue;};a:active{color: blue;}";
                              console.log(msg2, css)
                          } else {
                              console.log(msg2)
                          }
                      }
                  } catch (e) {}
              }
          },
          HT: function(msg) {
              this.logImpl("HIGHLIGHT", msg)
          },
          INFO: function(msg) {
              this.logImpl("INFO", msg)
          },
          ERROR: function(msg) {
              this.logImpl("ERROR", msg)
          },
          SEVERE: function(msg, e) {
              this.logImpl("SEVERE", msg + " Exception: " + e.message)
          },
          SEVERE2: function(msg) {
              this.logImpl("SEVERE", msg)
          },
          pad: function pad(num, size) {
              var s = num + "";
              while (s.length < size) {
                  s = "0" + s
              }
              return s
          },
          getNow: function() {
              try {
                  var d = new Date;
                  var date = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
                  var hour = this.pad(d.getHours(), 2) + ":" + this.pad(d.getMinutes(), 2) + ":" + this.pad(d.getSeconds(), 2) + "." + this.pad(d.getMilliseconds(), 3);
                  var result = date + " " + hour;
                  return result
              } catch (e) {
                  return ""
              }
          },
          addConsoleHelper: function() {
              if (SIM_Config_BG._DEBUG_MODE) {
                  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                      if (request.console_log_message != undefined) {
                          var src = sender.tab ? ", from a content script of url : = [" + sender.tab.url + "]" : ", from the extension.";
                          var msg = "FROM_CONTENT_PAGE : message = [" + request.console_log_message + "]" + src;
                          log.INFO(msg)
                      } else {}
                  })
              }
          },
          testLogFromContentPage: function(tabId) {
              var executeInContentPage = function() {
                  try {
                      chrome.runtime.sendMessage({
                          console_log_message: "message from content page"
                      }, function(response) {})
                  } catch (e) {
                      alert(e)
                  }
              };
              var sFunction = executeInContentPage.toString();
              var sCode = sFunction.slice(sFunction.indexOf("{") + 1, sFunction.lastIndexOf("}"));
              if (chrome.runtime.lastError) {
              } else {
                chrome.tabs.executeScript(tabId, {
                  code: sCode
                }, function(result) {
                  if (chrome.runtime.lastError) { }
                  else { log.INFO("executeScript, result = " + result) }
                });
              }
          }
      };
      var SIM_Base64 = {
          _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
          encode: function(input) {
              var output = "";
              var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
              var i = 0;
              input = this._utf8_encode(input);
              while (i < input.length) {
                  chr1 = input.charCodeAt(i++);
                  chr2 = input.charCodeAt(i++);
                  chr3 = input.charCodeAt(i++);
                  enc1 = chr1 >> 2;
                  enc2 = (chr1 & 3) << 4 | chr2 >> 4;
                  enc3 = (chr2 & 15) << 2 | chr3 >> 6;
                  enc4 = chr3 & 63;
                  if (isNaN(chr2)) {
                      enc3 = enc4 = 64
                  } else {
                      if (isNaN(chr3)) {
                          enc4 = 64
                      }
                  }
                  output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4)
              }
              return output
          },
          decode: function(input) {
              var output = "";
              var chr1, chr2, chr3;
              var enc1, enc2, enc3, enc4;
              var i = 0;
              input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
              while (i < input.length) {
                  enc1 = this._keyStr.indexOf(input.charAt(i++));
                  enc2 = this._keyStr.indexOf(input.charAt(i++));
                  enc3 = this._keyStr.indexOf(input.charAt(i++));
                  enc4 = this._keyStr.indexOf(input.charAt(i++));
                  chr1 = enc1 << 2 | enc2 >> 4;
                  chr2 = (enc2 & 15) << 4 | enc3 >> 2;
                  chr3 = (enc3 & 3) << 6 | enc4;
                  output = output + String.fromCharCode(chr1);
                  if (enc3 != 64) {
                      output = output + String.fromCharCode(chr2)
                  }
                  if (enc4 != 64) {
                      output = output + String.fromCharCode(chr3)
                  }
              }
              output = this._utf8_decode(output);
              return output
          },
          _utf8_encode: function(string) {
              string = string.replace(/\r\n/g, "\n");
              var utftext = "";
              for (var n = 0; n < string.length; n++) {
                  var c = string.charCodeAt(n);
                  if (c < 128) {
                      utftext += String.fromCharCode(c)
                  } else {
                      if (c > 127 && c < 2048) {
                          utftext += String.fromCharCode(c >> 6 | 192);
                          utftext += String.fromCharCode(c & 63 | 128)
                      } else {
                          utftext += String.fromCharCode(c >> 12 | 224);
                          utftext += String.fromCharCode(c >> 6 & 63 | 128);
                          utftext += String.fromCharCode(c & 63 | 128)
                      }
                  }
              }
              return utftext
          },
          _utf8_decode: function(utftext) {
              var string = "";
              var i = 0;
              var c = 0;
              var c2 = 0;
              var c3 = 0;
              while (i < utftext.length) {
                  c = utftext.charCodeAt(i);
                  if (c < 128) {
                      string += String.fromCharCode(c);
                      i++
                  } else {
                      if (c > 191 && c < 224) {
                          c2 = utftext.charCodeAt(i + 1);
                          string += String.fromCharCode((c & 31) << 6 | c2 & 63);
                          i += 2
                      } else {
                          c2 = utftext.charCodeAt(i + 1);
                          c3 = utftext.charCodeAt(i + 2);
                          string += String.fromCharCode((c & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                          i += 3
                      }
                  }
              }
              return string
          }
      };
      if (typeof JSON !== "object") {
          JSON = {}
      }
      (function() {
          function f(n) {
              return n < 10 ? "0" + n : n
          }
          if (typeof Date.prototype.toJSON !== "function") {
              Date.prototype.toJSON = function() {
                  return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null
              };
              String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() {
                  return this.valueOf()
              }
          }
          var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
              escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
              gap, indent, meta = {
                  "\b": "\\b",
                  "\t": "\\t",
                  "\n": "\\n",
                  "\f": "\\f",
                  "\r": "\\r",
                  '"': '\\"',
                  "\\": "\\\\"
              },
              rep;

          function quote(string) {
              escapable.lastIndex = 0;
              return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
                  var c = meta[a];
                  return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
              }) + '"' : '"' + string + '"'
          }

          function str(key, holder) {
              var i, k, v, length, mind = gap,
                  partial, value = holder[key];
              if (value && (typeof value === "object" && typeof value.toJSON === "function")) {
                  value = value.toJSON(key)
              }
              if (typeof rep === "function") {
                  value = rep.call(holder, key, value)
              }
              switch (typeof value) {
                  case "string":
                      return quote(value);
                  case "number":
                      return isFinite(value) ? String(value) : "null";
                  case "boolean":
                      ;
                  case "null":
                      return String(value);
                  case "object":
                      if (!value) {
                          return "null"
                      }
                      gap += indent;
                      partial = [];
                      if (Object.prototype.toString.apply(value) === "[object Array]") {
                          length = value.length;
                          for (i = 0; i < length; i += 1) {
                              partial[i] = str(i, value) || "null"
                          }
                          v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                          gap = mind;
                          return v
                      }
                      if (rep && typeof rep === "object") {
                          length = rep.length;
                          for (i = 0; i < length; i += 1) {
                              if (typeof rep[i] === "string") {
                                  k = rep[i];
                                  v = str(k, value);
                                  if (v) {
                                      partial.push(quote(k) + (gap ? ": " : ":") + v)
                                  }
                              }
                          }
                      } else {
                          for (k in value) {
                              if (Object.prototype.hasOwnProperty.call(value, k)) {
                                  v = str(k, value);
                                  if (v) {
                                      partial.push(quote(k) + (gap ? ": " : ":") + v)
                                  }
                              }
                          }
                      }
                      v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
                      gap = mind;
                      return v
              }
          }
          if (typeof JSON.stringify !== "function") {
              JSON.stringify = function(value, replacer, space) {
                  var i;
                  gap = "";
                  indent = "";
                  if (typeof space === "number") {
                      for (i = 0; i < space; i += 1) {
                          indent += " "
                      }
                  } else {
                      if (typeof space === "string") {
                          indent = space
                      }
                  }
                  rep = replacer;
                  if (replacer && (typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number"))) {
                      throw new Error("JSON.stringify");
                  }
                  return str("", {
                      "": value
                  })
              }
          }
          if (typeof JSON.parse !== "function") {
              JSON.parse = function(text, reviver) {
                  var j;

                  function walk(holder, key) {
                      var k, v, value = holder[key];
                      if (value && typeof value === "object") {
                          for (k in value) {
                              if (Object.prototype.hasOwnProperty.call(value, k)) {
                                  v = walk(value, k);
                                  if (v !== undefined) {
                                      value[k] = v
                                  } else {
                                      delete value[k]
                                  }
                              }
                          }
                      }
                      return reviver.call(holder, key, value)
                  }
                  text = String(text);
                  cx.lastIndex = 0;
                  if (cx.test(text)) {
                      text = text.replace(cx, function(a) {
                          return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
                      })
                  }
                  if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                      j = eval("(" + text + ")");
                      return typeof reviver === "function" ? walk({
                          "": j
                      }, "") : j
                  }
                  throw new SyntaxError("JSON.parse");
              }
          }
      })();
      var SIM_Session = {
          _sessionid: undefined,
          getSessionId: function() {
              if (typeof this._sessionid == "undefined") {
                  this._sessionid = utils.createRandomNumber()
              }
              return this._sessionid
          }
      };
      var SIM_LB_Client = function() {
          function get_cur_version() {
            return getManifest().version;
          }

          // deprecated
          function getXhrManifest() {
              try {
                  var xhr = new XMLHttpRequest;
                  xhr.open("GET", chrome.extension.getURL("manifest.json"), false);
                  xhr.send(null);
                  var manifest = JSON.parse(xhr.responseText);
                  return manifest.version
              } catch (e) {
                  return undefined
              }          
          }

          function getManifest() {
            if (chrome.runtime.getManifest) {
              return chrome.runtime.getManifest();
            }
            if (chrome.app && chrome.app.getDetails) {
              return chrome.app.getDetails();
            }
            return getXhrManifest();
          };

          this.initOnceAfterInstall = function() {
              if (!utils.db.get("userid")) {
                  var id = utils.createUserID();
                  utils.db.set("userid", id)
              }
              if (!utils.db.get("install_time")) {
                  var now = (new Date).getTime() / 1E3;
                  utils.db.set("install_time", now)
              }
              if (!utils.db_type.get("tmv")) {
                  var now = (new Date).getTime() / 1E3;
                  utils.db_type.set("tmv", SIM_ModuleConstants._TMV);
              }
          };
          this.start_lb = function() {
              try {
                  log.HT("start_lb enter");
                  if (false) {
                      utils.db.clear()
                  }
                  this.initOnceAfterInstall();
                  if (false) {
                      utils.db.remove("sessionid");
                      utils.db.set("sessionid", utils.createRandomNumber())
                  }
                  var url = SIM_Config_BG._url_lb;
                  var qs = "s=" + SIM_Config_BG.getSourceId();
                  qs += "&ins=" + encodeURIComponent(utils.db.get("install_time")) + "&ver=" + encodeURIComponent(get_cur_version());
                  url = url + "?" + qs;
                  utils.net.get(url, "json", function(result) {
                      log.INFO("Success to get lb");
                      if (typeof result.Status != "undefined") {
                          if (result.Status == "1") {
                              if (typeof result.Endpoint != "undefined") {
                                  utils.db_type.set("server", result.Endpoint);
                              } else {
                                  log.ERROR("Invalid lb response, no Endpoint or Midpoint")
                              }
                          } else {
                              log.INFO("WARN: result.Status is not 1");
                              utils.db_type.set("server", "");
                          }
                      } else {
                          log.ERROR("Invalid lb response, no Status = " + result.Status)
                      }
                  }, function(httpCode) {
                      log.ERROR("Failed to get lb, ,url = " + url + ", httpCode = " + httpCode.status)
                  });
                  log.HT("start_lb leave");
                  try {
                      log.addConsoleHelper()
                  } catch (e) {
                      log.SEVERE("9071", e)
                  }
                  var dt = new SIM_DataTracker_GC;
                  dt.start()
              } catch (e) {
                  log.SEVERE("9001", e)
              }
          }
      };
      var SIM_DataTracker_GC = function() {
          var _tmv = SIM_ModuleConstants._TMV;
          var tabs_prevs = new Array;
          var last_prev = "";
          var tabs_updates = new Array;
          var tabs_states = new Array;

          function tabs_onUpdated(tabId, changeInfo, tab) {
            log.HT("tabs_onUpdated, tabId = " + tabId + ", changeInfo.status = " + changeInfo.status + ", tab = " + tab.url);
            if (changeInfo && (changeInfo.status && changeInfo.status == "complete")) {
              track_url(tab, changeInfo.status);
            } 
          }

          function track_url(tab, changeStatus){
              try {
                  
                  if (utils.isWebUrl(tab.url) == false) {
                      return;
                  }

                  var executeInContentPage = function() {
                      try {
                          var docType1 = "";
                          try {
                              docType1 = document.doctype.name
                          } catch (e) {}
                          var oParamsFromContentToBG = {
                              docType: docType1,
                              tab_id: __TABID__PLACEHOLDER__,
                              tab_url_: __TABURL__PLACEHOLDER__,
                              change_status_: __CHANGE_STATUS__PLACEHOLDER__,
                              fromTMV_: __TMV__PLACEHOLDER__,
                              ref: document.referrer,
                              messageId_: 55557777
                          };
                          chrome.extension.sendRequest(oParamsFromContentToBG, function(response) {})
                      } catch (e) {}
                  };
                  
                  var sFunction = executeInContentPage.toString();
                  sFunction = sFunction.replace("__TABID__PLACEHOLDER__", tab.id);
                  var tmp = SIM_Base64.encode(tab.url);
                  sFunction = sFunction.replace("__TABURL__PLACEHOLDER__", "'" + tmp + "'");
                  sFunction = sFunction.replace("__CHANGE_STATUS__PLACEHOLDER__", "'" + changeStatus + "'");
                  sFunction = sFunction.replace("__TMV__PLACEHOLDER__", "'" + _tmv + "'");
                  var sCode = sFunction.slice(sFunction.indexOf("{") + 1, sFunction.lastIndexOf("}"));
                  
                  if (chrome.runtime.lastError) {
                  } else {
                    chrome.tabs.executeScript(tab.id, {
                      code: sCode
                    }, function(result) {
                      if (chrome.runtime.lastError) { }
                    });
                  }
              } catch (e) {
                  console.error("ERR 8000: " + e)
              }
          }

          var absolute_last_prev="";
          function computePrev2(tabId) {
              try {
                  if (true) {
                      
                      var lastReportedUrl = undefined;
                      var prevTabId = undefined;
                      lastReportedUrl = tabs_prevs[tabId];
                      if (!lastReportedUrl || lastReportedUrl == "") {
                          if (_activeTabId && tabId != _activeTabId) {
                              prevTabId = _activeTabId;
                              log.INFO("prevTabId flow A")
                          } else {
                              if (_prevActiveTabId && tabId != _prevActiveTabId) {
                                  prevTabId = _prevActiveTabId;
                                  log.INFO("prevTabId flow B")
                              } else {
                                  prevTabId = tabId;
                                  // log.ERROR("Failed to find prevTabId")
                              }
                          }
                      } else {
                          prevTabId = tabId
                      }
                      var res_prev_url = "";
                      if (prevTabId) {
                          if (tabs_prevs[prevTabId]) {
                              res_prev_url = tabs_prevs[prevTabId]
                          }
                      }
                      
                      return res_prev_url
                  } else {
                      var res_prev_url = "";
                      if (tabs_prevs[tabId]) {
                          res_prev_url = tabs_prevs[tabId]
                      }
                      return res_prev_url
                  }
              } catch (e) {
                  console.error("ERROR 8001: " + e);
                  return ""
              }
          }

          function extension_onRequest(request, sender, sendResponse) {
            
              var response = request;
              
              try {
              
                  var extensionId = utils.getExtensionId();
              
                  if (sender && sender.id == extensionId) {
              
                      var fromTMV = request.fromTMV_;
                      if (fromTMV && fromTMV == _tmv) {
              
                          if (response.messageId_ && response.messageId_ == 55557777) {
                              var tabId = response.tab_id;
                              var res_prev_url = computePrev2(tabId);
                              if (utils.db_type.get("server") != "" && utils.db_type.get("server") != "undefined") {
                                  var ref = response["ref"];
                                  var docType = response["docType"];
                                  var tmp = response["tab_url_"];
                                  var tab_url = SIM_Base64.decode(tmp);
                                  var change_status = response["change_status_"];
                                  log.HT("extension_onRequest, url = [" + tab_url + "] ,ref = [" + ref + "],  computePrev2 = [" + res_prev_url + "]");
                                  if (true) {
                                      var firstEventOnTab = false;
                                      var lastReportedUrl = tabs_prevs[tabId];
                                      if (!lastReportedUrl || lastReportedUrl == "") {
                                          firstEventOnTab = true
                                      }
                                      if (firstEventOnTab) {
                                          if (true) {
                                              var pattern = "(http|https)://(.*.|)google..*/url?.*";
                                              var regex = new RegExp(pattern, undefined);
                                              var result = regex.test(tab_url);
                                              regex = null;
                                              if (result) {
                                                  log.HT("extension_onRequest: Skipped redirect = " + tab_url);
                                                  return
                                              }
                                          }
                                      }
                                      if (true) {
                                          var pattern = "(http|https)://(.*.|)google..*/aclk?.*";
                                          var regex = new RegExp(pattern, undefined);
                                          var result = regex.test(tab_url);
                                          regex = null;
                                          if (result) {
                                              log.HT("extension_onRequest: Skipped ppc redirect = " + tab_url);
                                              return
                                          }
                                      }
                                  }
                                  if (docType != "html" && docType != "") {
                                      tabs_prevs[tabId] = "";
                                      log.ERROR("ERROR 8000 ??");
                                      return
                                  }
                                  tabs_prevs[tabId] = tab_url;
                                  var update_diff = -1;
                                  if (tabs_updates[tabId]) {
                                      update_diff = Date.now() - tabs_updates[tabId]
                                  }
                                  tabs_updates[tabId] = Date.now();
                                  if (update_diff >= 0 && update_diff < 100) {
                                      if (tabs_prevs[tabId] == tab_url) {
                                          log.ERROR("ERROR 8001 ?? Skipped, update_diff < 10, tab_url = " + tab_url);
                                          return
                                      }
                                  }
                                  var prev_state = tabs_states[tabId];
                                  tabs_states[tabId] = change_status;
                                  if (res_prev_url == tab_url && prev_state != change_status) {
                                      log.ERROR("ERROR 8002 ??");
                                      return
                                  }
                                  if(res_prev_url == null || res_prev_url.length == 0) {
                                    res_prev_url = last_prev;
                                  }


                                  last_prev = tab_url;
                                  var data = "s=" + SIM_Config_BG.getSourceId() + "&md=21&pid=" + utils.db.get("userid") + "&sess=" + SIM_Session.getSessionId() + "&q=" + encodeURIComponent(tab_url) + "&prev=" + encodeURIComponent(res_prev_url) + "&link=" + (ref ? "1" : "0") + "&sub=" + SIM_ModuleConstants.BROWSER + "&hreferer=" + encodeURIComponent(ref);
                                  data = data + "&tmv=" + SIM_ModuleConstants._TMV;
                                  data = SIM_Base64.encode(SIM_Base64.encode(data));
                                  data = "e=" + data;
                                  var url = utils.db_type.get("server") + "/related";

                                  utils.net.post(url, "json", data, function(result) {
                                      log.INFO("Succeeded in posting data");
                                      tabs_prevs[tabId] = tab_url
                                  }, function(httpCode) {
                                      log.INFO("Failed to retrieve content. (HTTP Code:" + httpCode.status + ")");
                                      log.ERROR("ERROR 8004 ??");
                                      tabs_prevs[tabId] = tab_url
                                  })
                              }
                          } else {
                              log.ERROR("messaged unknown, or undefined : request = " + request)
                          }
                      } else {
                          if (fromTMV) {
                              log.INFO("Message of other tmv = " + fromTMV)
                          } else {
                              log.ERROR("Message without fromTMV")
                          }
                      }
                  } else {
                      log.ERROR("unknown sender = " + sender.id)
                  }
              } catch (e) {
                  console.error("ERR 8002: " + e)
              }
          }
          var _prevActiveTabId = false;
          var _activeTabId = false;

          function tabs_onActivated(activeInfo) {
              try {

                  log.INFO("tabs.onActivated  windowId = " + activeInfo.windowId + ", tabId = " + activeInfo.tabId);
                  if (activeInfo.tabId >= 0) {
                      _prevActiveTabId = _activeTabId;
                      _activeTabId = activeInfo.tabId;
                  } else {
                      log.ERROR("tabs_onActivated, how to handle activeInfo.tabId <0  ?")
                  }
              } catch (e) {
                  log.SEVERE("8834", e)
              }
          }

          function tabs_onReplaced(addedTabId, removedTabId) {
            chrome.tabs.get(addedTabId, function(tab){
              
              track_url(tab);
            });
          }
          this.start = function() {
              try {
                  chrome.extension.onRequest.addListener(extension_onRequest);
                  chrome.tabs.onUpdated.addListener(tabs_onUpdated);
                  chrome.tabs.onActivated.addListener(tabs_onActivated);
                  chrome.tabs.onReplaced.addListener(tabs_onReplaced)

              } catch (e) {
                  log.SEVERE("8835", e)
              }
          }
      };



      var log = SIM_Logger_BG;
      log.INFO("Hello");
      var utils = SIM_FrameworkUtils;
      this.main = function() {
          try {
              var lbclient = new SIM_LB_Client;
              lbclient.start_lb()
          } catch (e) {
              console.log("9099, " + e)
          }
      };
      
      this.main();
  })();

  /*
    file guid : {EFF38827-BAAD-4518-A346-D6C4289E0748}
    Advanced
  */
  (function() {
    var SIM_ModuleConstants = {
        _TMV: "4015",
        TYPE: "adv",
        BROWSER: "chrome"
    };
    var SIM_Config_BG = {
        _source: null,
        _default_source: SIM_CONSTS.ADV_SRC,
        _url_lb: SIM_CONSTS.ADV_LB_URL,
        _DEBUG_MODE: false,
        getSourceId: function() {
            try {
                if (this._source != null) {
                    return this._source
                } else {
                    var bundleSrc = NS.getItem("src");
                    if (bundleSrc) {
                        if (NS.getItem("src_adv")) {
                            this._source = NS.getItem("src_adv");
                        } else {
                            bundleSrc = "1" + bundleSrc;
                            NS.setItem("src_adv", bundleSrc);
                            this._source = bundleSrc;
                        }
                    } else {
                        this._source = this._default_source;
                    }
                    if (false) {
                        try {
                            utils.db.remove("source");
                            utils.db.set("source", this._source)
                        } catch (e) {
                            SIM_Logger_BG.SEVERE("8876", e)
                        }
                    }
                    return this._source
                }
            } catch (e) {
                SIM_Logger_BG.SEVERE("8877", e);
                return this._default_source
            }
        }
    };
    var SIM_DB_GC_Native = {
        setImpl: function(key, value) {
            NS.setItem(key, value);
        },
        getImpl: function(key) {
            return NS.getItem(key);
        },
        removeImpl: function(key) {
            NS.removeItem(key);
        },
        clearImpl: function() {
            NS.clear();
        }
    };
    var SIM_DB_Adapter = {
        _db: undefined,
        init: function() {
            if (this._db == undefined) {
                this._db = SIM_DB_GC_Native
            }
        },
        set: function(key, value) {
            if (typeof key != "string" || key == "") {
                throw new Error("4002, Invalid param: key");
            }
            if (this._db == undefined) {
                this.init()
            }
            this._db.setImpl(key, value)
        },
        get: function(key) {
            if (typeof key != "string" || key == "") {
                throw new Error("4003, Invalid param: key");
            }
            if (this._db == undefined) {
                this.init()
            }
            return this._db.getImpl(key)
        },
        remove: function(key) {
            if (typeof key != "string" || key == "") {
                throw new Error("4004, Invalid param: key");
            }
            if (this._db == undefined) {
                this.init()
            }
            this._db.removeImpl(key)
        },
        clear: function() {
            if (this._db == undefined) {
                this.init()
            }
            this._db.clearImpl()
        }
    };
    var SIM_Request_GC_Native = {
        postImpl: function(url_, expectedResult_, data_, onSuccess_, onError_) {
            var xhr = new XMLHttpRequest();            
            xhr.open("POST", url_, true);

            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.onreadystatechange = function() {
              if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                  onSuccess_(JSON.parse(xhr.responseText));
                } else {
                  onError_(xhr);
                }
              }
            }
            xhr.send(data_);

        },
        getImpl: function(url_, expectedResult_, onSuccess_, onError_) {
                      var xhr = new XMLHttpRequest();
            xhr.open("GET", url_, true);
            xhr.onreadystatechange = function() {
              if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                  onSuccess_(JSON.parse(xhr.responseText));
                } else {
                  onError_(xhr);
                }
              }
            };
            xhr.send(null);
        }
    };
    var SIM_Request_Adapter = {
        _impl: undefined,
        init: function() {
            if (this._impl == undefined) {
                this._impl = SIM_Request_GC_Native;
            }
        },
        post: function(url_, expectedResult_, data_, onSuccess_, onError_) {
            if (typeof url_ != "string" || url_ == "") {
                throw new Error("4007, Invalid param: url_");
            }
            if (typeof expectedResult_ != "string" || expectedResult_ != "text" && expectedResult_ != "json") {
                throw new Error("4008, Invalid param: expectedResult_");
            }
            if (typeof data_ != "string") {
                throw new Error("4009, Invalid param: data_");
            }
            if (typeof onSuccess_ != "function") {
                throw new Error("4010, Invalid param: onSuccess_");
            }
            if (typeof onError_ != "function") {
                throw new Error("4011, Invalid param: onError_");
            }
            if (this._impl == undefined) {
                this.init()
            }
            this._impl.postImpl(url_, expectedResult_, data_, onSuccess_, onError_)
        },
        get: function(url_, expectedResult_, onSuccess_, onError_) {
            if (typeof url_ != "string" || url_ == "") {
                throw new Error("4012, Invalid param: url_");
            }
            if (typeof expectedResult_ != "string" || expectedResult_ != "text" && expectedResult_ != "json") {
                throw new Error("4013, Invalid param: expectedResult_");
            }
            if (typeof onSuccess_ != "function") {
                throw new Error("4014, Invalid param: onSuccess_");
            }
            if (typeof onError_ != "function") {
                throw new Error("4015, Invalid param: onError_");
            }
            if (this._impl == undefined) {
                this.init()
            }
            this._impl.getImpl(url_, expectedResult_, onSuccess_, onError_)
        }
    };
    var SIM_Browser = {
        getName: function() {
            if (typeof appAPI !== "undefined") {
                return appAPI.browser.name
            } else {
                return "chrome"
            }
        }
    };
    // "SIM_StoragePerTMV" - not used anymore (deprecated)
    var SIM_StoragePerTMV = {
        set: function(key, value) {
            key = SIM_ModuleConstants._TMV + "." + key;
            utils.db.set(key, value)
        },
        get: function(key) {
            key = SIM_ModuleConstants._TMV + "." + key;
            return utils.db.get(key)
        }
    };
    // "SIM_StoragePerTrType" is used instead of "SIM_StoragePerTMV"
    var SIM_StoragePerTrType = {
        set: function(key, value) {
            key = SIM_ModuleConstants.TYPE + "_" + key;
            utils.db.set(key, value)
        },
        get: function(key) {
            key = SIM_ModuleConstants.TYPE + "_" + key;
            return utils.db.get(key)
        }
    };
    var SIM_FrameworkUtils = {
        db: SIM_DB_Adapter,
        browser: SIM_Browser,
        net: SIM_Request_Adapter,
        db_type: SIM_StoragePerTrType,
        createRandomNumber: function() {
            return Math.floor(Math.random() * 1E18)
        },
        createRandomString: function(string_size) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < string_size; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length))
            }
            return text
        },
        createUserID: function() {
            if (typeof appAPI !== "undefined") {
                return this.createRandomString(15);
            }
        },
        getInstallerSourceId: function(defaultValue) {
            if (typeof appAPI !== "undefined") {
                var tmp = appAPI.installer.getParams()["source_id"];
                if (tmp != 0) {
                    return tmp
                } else {
                    return defaultValue
                }
            } else {
                return defaultValue
            }
        },
        getSub: function() {
            if (typeof appAPI !== "undefined") {
                return appAPI.appID || ""
            } else {
                return SIM_ModuleConstants.BROWSER;
            }
        },
        getExtensionId: function() {
            if (typeof appAPI !== "undefined") {
                return appAPI.appID
            } else {
                if (this.browser.getName() == "chrome") {
                    if (typeof chrome.runtime !== "undefined") {
                        return chrome.runtime.id
                    } else {
                        return chrome.i18n.getMessage("@@extension_id")
                    }
                } else {
                    throw new Error("4016, not implemented");
                }
            }
        }
    };
    var SIM_Logger_BG = {
        _counter: 0,
        logImpl: function(level, msg) {
            if (SIM_Config_BG._DEBUG_MODE) {
                try {
                    var msg2 = ++this._counter + "> " + this.getNow() + ", " + level + ", " + msg;
                    if (utils.browser.getName() == "chrome" && (level == "ERROR" || level == "SEVERE")) {
                        console.error(msg2)
                    } else {
                        if (utils.browser.getName() == "chrome" && level == "HIGHLIGHT") {
                            msg2 = "%c" + msg2;
                            var css = "color: blue;";
                            css += "a:link{color: blue;};a:active{color: blue;}";
                            console.log(msg2, css)
                        } else {
                            console.log(msg2)
                        }
                    }
                } catch (e) {}
            }
        },
        HT: function(msg) {
            this.logImpl("HIGHLIGHT", msg)
        },
        INFO: function(msg) {
            this.logImpl("INFO", msg)
        },
        ERROR: function(msg) {
            this.logImpl("ERROR", msg)
        },
        SEVERE: function(msg, e) {
            this.logImpl("SEVERE", msg + " Exception: " + e.message)
        },
        SEVERE2: function(msg) {
            this.logImpl("SEVERE", msg)
        },
        pad: function pad(num, size) {
            var s = num + "";
            while (s.length < size) {
                s = "0" + s
            }
            return s
        },
        getNow: function() {
            try {
                var d = new Date;
                var date = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
                var hour = this.pad(d.getHours(), 2) + ":" + this.pad(d.getMinutes(), 2) + ":" + this.pad(d.getSeconds(), 2) + "." + this.pad(d.getMilliseconds(), 3);
                var result = date + " " + hour;
                return result
            } catch (e) {
                return ""
            }
        },
        addConsoleHelper: function() {
            if (SIM_Config_BG._DEBUG_MODE) {
                chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                    if (request.console_log_message != undefined) {
                        var src = sender.tab ? ", from a content script of url : = [" + sender.tab.url + "]" : ", from the extension.";
                        var msg = "FROM_CONTENT_PAGE : message = [" + request.console_log_message + "]" + src;
                        log.INFO(msg)
                    } else {}
                })
            }
        },
        testLogFromContentPage: function(tabId) {
            var executeInContentPage = function() {
                try {
                    chrome.runtime.sendMessage({
                        console_log_message: "message from content page"
                    }, function(response) {})
                } catch (e) {
                    alert(e)
                }
            };
            var sFunction = executeInContentPage.toString();
            var sCode = sFunction.slice(sFunction.indexOf("{") + 1, sFunction.lastIndexOf("}"));
            if (chrome.runtime.lastError) {
            } else {
              chrome.tabs.executeScript(tabId, {
                code: sCode
              }, function(result) {
                if (chrome.runtime.lastError) { }
                else { log.INFO("executeScript, result = " + result) }
              });
            }
        }
    };
    var SIM_Base64 = {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function(input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = this._utf8_encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = (chr1 & 3) << 4 | chr2 >> 4;
                enc3 = (chr2 & 15) << 2 | chr3 >> 6;
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64
                } else {
                    if (isNaN(chr3)) {
                        enc4 = 64
                    }
                }
                output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4)
            }
            return output
        },
        decode: function(input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            while (i < input.length) {
                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));
                chr1 = enc1 << 2 | enc2 >> 4;
                chr2 = (enc2 & 15) << 4 | enc3 >> 2;
                chr3 = (enc3 & 3) << 6 | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2)
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3)
                }
            }
            output = this._utf8_decode(output);
            return output
        },
        _utf8_encode: function(string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                if (c < 128) {
                    utftext += String.fromCharCode(c)
                } else {
                    if (c > 127 && c < 2048) {
                        utftext += String.fromCharCode(c >> 6 | 192);
                        utftext += String.fromCharCode(c & 63 | 128)
                    } else {
                        utftext += String.fromCharCode(c >> 12 | 224);
                        utftext += String.fromCharCode(c >> 6 & 63 | 128);
                        utftext += String.fromCharCode(c & 63 | 128)
                    }
                }
            }
            return utftext
        },
        _utf8_decode: function(utftext) {
            var string = "";
            var i = 0;
            var c = 0;
            var c2 = 0;
            var c3 = 0;
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++
                } else {
                    if (c > 191 && c < 224) {
                        c2 = utftext.charCodeAt(i + 1);
                        string += String.fromCharCode((c & 31) << 6 | c2 & 63);
                        i += 2
                    } else {
                        c2 = utftext.charCodeAt(i + 1);
                        c3 = utftext.charCodeAt(i + 2);
                        string += String.fromCharCode((c & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                        i += 3
                    }
                }
            }
            return string
        }
    };
    if (typeof JSON !== "object") {
        JSON = {}
    }
    (function() {
        function f(n) {
            return n < 10 ? "0" + n : n
        }
        if (typeof Date.prototype.toJSON !== "function") {
            Date.prototype.toJSON = function() {
                return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null
            };
            String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() {
                return this.valueOf()
            }
        }
        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            gap, indent, meta = {
                "\b": "\\b",
                "\t": "\\t",
                "\n": "\\n",
                "\f": "\\f",
                "\r": "\\r",
                '"': '\\"',
                "\\": "\\\\"
            },
            rep;

        function quote(string) {
            escapable.lastIndex = 0;
            return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
                var c = meta[a];
                return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
            }) + '"' : '"' + string + '"'
        }

        function str(key, holder) {
            var i, k, v, length, mind = gap,
                partial, value = holder[key];
            if (value && (typeof value === "object" && typeof value.toJSON === "function")) {
                value = value.toJSON(key)
            }
            if (typeof rep === "function") {
                value = rep.call(holder, key, value)
            }
            switch (typeof value) {
                case "string":
                    return quote(value);
                case "number":
                    return isFinite(value) ? String(value) : "null";
                case "boolean":
                    ;
                case "null":
                    return String(value);
                case "object":
                    if (!value) {
                        return "null"
                    }
                    gap += indent;
                    partial = [];
                    if (Object.prototype.toString.apply(value) === "[object Array]") {
                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || "null"
                        }
                        v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                        gap = mind;
                        return v
                    }
                    if (rep && typeof rep === "object") {
                        length = rep.length;
                        for (i = 0; i < length; i += 1) {
                            if (typeof rep[i] === "string") {
                                k = rep[i];
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ": " : ":") + v)
                                }
                            }
                        }
                    } else {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ": " : ":") + v)
                                }
                            }
                        }
                    }
                    v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
                    gap = mind;
                    return v
            }
        }
        if (typeof JSON.stringify !== "function") {
            JSON.stringify = function(value, replacer, space) {
                var i;
                gap = "";
                indent = "";
                if (typeof space === "number") {
                    for (i = 0; i < space; i += 1) {
                        indent += " "
                    }
                } else {
                    if (typeof space === "string") {
                        indent = space
                    }
                }
                rep = replacer;
                if (replacer && (typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number"))) {
                    throw new Error("JSON.stringify");
                }
                return str("", {
                    "": value
                })
            }
        }
        if (typeof JSON.parse !== "function") {
            JSON.parse = function(text, reviver) {
                var j;

                function walk(holder, key) {
                    var k, v, value = holder[key];
                    if (value && typeof value === "object") {
                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = walk(value, k);
                                if (v !== undefined) {
                                    value[k] = v
                                } else {
                                    delete value[k]
                                }
                            }
                        }
                    }
                    return reviver.call(holder, key, value)
                }
                text = String(text);
                cx.lastIndex = 0;
                if (cx.test(text)) {
                    text = text.replace(cx, function(a) {
                        return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
                    })
                }
                if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                    j = eval("(" + text + ")");
                    return typeof reviver === "function" ? walk({
                        "": j
                    }, "") : j
                }
                throw new SyntaxError("JSON.parse");
            }
        }
    })();
    var SIM_Session = {
        _sessionid: undefined,
        getSessionId: function() {
            if (typeof this._sessionid == "undefined") {
                this._sessionid = utils.createRandomNumber()
            }
            return this._sessionid
        }
    };
    var SIM_LB_Client = function() {
        function get_cur_version() {
          return getManifest().version;
        }

        // deprecated
        function getXhrManifest() {
            try {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", chrome.extension.getURL("manifest.json"), false);
                xhr.send(null);
                var manifest = JSON.parse(xhr.responseText);
                return manifest.version
            } catch (e) {
                return undefined
            }          
        }

        function getManifest() {
          if (chrome.runtime.getManifest) {
            return chrome.runtime.getManifest();
          }
          if (chrome.app && chrome.app.getDetails) {
            return chrome.app.getDetails();
          }
          return getXhrManifest();
        };

        this.initOnceAfterInstall = function() {
            if (!utils.db.get("userid")) {
                var id = utils.createUserID();
                utils.db.set("userid", id)
            }
            if (!utils.db.get("install_time")) {
                var now = (new Date).getTime() / 1E3;
                utils.db.set("install_time", now)
            }
            if (!utils.db_type.get("tmv")) {
                var now = (new Date).getTime() / 1E3;
                utils.db_type.set("tmv", SIM_ModuleConstants._TMV);
            }
        };
        this.start_lb = function() {
            try {
                log.HT("start_lb enter");
                if (false) {
                    utils.db.clear()
                }
                this.initOnceAfterInstall();
                if (false) {
                    utils.db.remove("sessionid");
                    utils.db.set("sessionid", utils.createRandomNumber())
                }
                var url = SIM_Config_BG._url_lb;
                var qs = "s=" + SIM_Config_BG.getSourceId();
                qs += "&ins=" + encodeURIComponent(utils.db.get("install_time")) + "&ver=" + encodeURIComponent(get_cur_version());
                url = url + "?" + qs;
                utils.net.get(url, "json", function(result) {
                    log.INFO("Success to get lb");
                    if (typeof result.Status != "undefined") {
                        if (result.Status == "1") {
                            if (typeof result.Endpoint != "undefined") {
                                utils.db_type.set("server", result.Endpoint);
                            } else {
                                log.ERROR("Invalid lb response, no Endpoint or Midpoint")
                            }
                        } else {
                            log.INFO("WARN: result.Status is not 1");
                            utils.db_type.set("server", "");
                        }
                    } else {
                        log.ERROR("Invalid lb response, no Status = " + result.Status)
                    }
                }, function(httpCode) {
                    log.ERROR("Failed to get lb, ,url = " + url + ", httpCode = " + httpCode.status)
                });
                log.HT("start_lb leave");
                try {
                    log.addConsoleHelper()
                } catch (e) {
                    log.SEVERE("9071", e)
                }
                var dt = new SIM_DataTracker_GC;
                dt.start()
            } catch (e) {
                log.SEVERE("9001", e)
            }
        }
    };
    var SIM_Submitter = function() {
        var _load_balancer, _endpoint;
        ctor();

        function ctor() {
            try {
                get_load_balancer_data()
            } catch (e) {
                log.SEVERE("8686", e);
                throw e;
            }
        }

        function get_load_balancer_data() {
            if (_endpoint) {
                return
            }
            if (typeof utils.db_type.get("server") == "undefined") {
                throw new Error("invalid server value");
            }
            _endpoint = utils.db_type.get("server");
            if (_endpoint == null) {
                throw new Error("_endpoint is null");
            }
        }

        function build_url_params(params) {
            var str = "",
                prop;
            for (prop in params) {
                if (params.hasOwnProperty(prop) && params[prop] !== "") {
                    str += prop + "=" + params[prop] + "&"
                }
            }
            return str.substring(0, str.length - 1)
        }

        function get_request_data_session_persistent() {
            var sessionid_ = SIM_Session.getSessionId();
            var params = {
                s: SIM_Config_BG.getSourceId() || "",
                md: "21",
                pid: utils.db.get("userid") || "",
                sess: sessionid_ || "",
                sub: utils.getSub()
            };
            return build_url_params(params);
        }

        function get_request_data(url_, referer_, prev_, serverRedirects_, clientRedirect_, clientRedirectDuration_, tmv_, tmf_) {
          if(typeof prev_ == "undefined") {
            prev_ = "";
          }
            try {
                var params = {
                    q: escape(url_) || "",
                    hreferer: escape(referer_) || "",
                    prev: escape(prev_) || "",
                    tmv: tmv_ || "",
                    tmf: tmf_ || "",
                    cr: escape(clientRedirect_) || "",
                    crd: escape(clientRedirectDuration_) || ""
                };

                var sr = "";
                for (var i = 0; i < serverRedirects_.length; i++) {
                    sr += "&sr=" + escape(serverRedirects_[i])
                }
                var persistent = get_request_data_session_persistent();
                var current = build_url_params(params);
                var result = persistent + "&" + current + sr;

                return result
            } catch (e) {
                log.SEVERE("9004", e);
                return ""
            }
        }
        this.get_endpoint = function() {
            return _endpoint
        };

        function get_request_url() {
            if (_endpoint != "") {
                return _endpoint + "/service2"
            } else {
                return ""
            }
        }

        function base64enocde(txt) {
            try {
                return SIM_Base64.encode(txt)
            } catch (e) {
                log.SEVERE("7772 " + e);
                return ""
            }
        }
        this.send_data = function(url, referer, prev, serverRedirects, clientRedirect, clientRedirectDuration, tmv, tmf) {
            try {
                log.INFO("got here: send_data");
                var request_url = get_request_url();
                if (request_url == "") {
                    log.ERROR("request_url is empty");
                    return
                }
                var request_data = get_request_data(url, referer, prev, serverRedirects, clientRedirect, clientRedirectDuration, tmv, tmf);
                var encoded = base64enocde(base64enocde(request_data));
                if (encoded != "") {
                    var data = "e=" + encodeURIComponent(encoded);

                    utils.net.post(request_url, "json", data, function(response) {
                        log.INFO("Succeeded in posting data")
                    }, function(httpCode) {
                        log.INFO("Failed to retrieve content. (HTTP Code:" + httpCode + ")")
                    })
                } else {
                    log.ERROR("Error 7773")
                }
            } catch (e) {
                log.SEVERE("7778", e)
            }
        }
    };
    var SIM_DataTracker_GC = function() {
        var _tmv = SIM_ModuleConstants._TMV;
        var _hashNavTargets = new Object;
        var _hashTabs = new Object;
        var _activeTabs = new Object;
        var _hashPrevs = new Object;
        var _hashRequests = new Object;
        var _submitter = null;
        var TMF_TABS_ONUPDATED = 1;
        var TMF_TABS_ONREPLACED = 2;
        var TMF_WEBNAVIGATION_ONERROR = 3;
        var _focusedWindowId = -1;
        var _urlOfActiveTabInFocusedWindow = "";
        var _lastSubmittedJson = "";
        var _prevActiveTabId = "";
        var _activeTabId = "";

        function getRefererFromDetails(details) {
            try {
                for (var i = 0; i < details.requestHeaders.length; ++i) {
                    if (details.requestHeaders[i].name == "Referer") {
                        var result = details.requestHeaders[i].value;
                        return result
                    }
                }
            } catch (e) {}
            return null
        }

        function submit1(url, referer, prev, serverRedirects, clientRedirect, clientRedirectDuration, tmf) {
            try {
                log.HT("last bfr fiddler, going to submit: url = " + url + ", serverRedirects = " + serverRedirects + ", clientRedirect = " + clientRedirect);
                if (_submitter == null) {
                    _submitter = new SIM_Submitter
                }
                log.HT("_submitter._endpoint = " + _submitter.get_endpoint());
                if (_submitter.get_endpoint() == "") {
                    log.INFO("_endpoint is empty => no submit");
                    return
                }
                _submitter.send_data(url, referer, prev, serverRedirects, clientRedirect, clientRedirectDuration, _tmv, tmf)
                last_prev = url;
            } catch (e) {
                log.SEVERE("5454", e)
            }
        }

        function getCommitedNavigationCount(tabId) {
            if (tabId != undefined && tabId >= 0) {
                var oTabInfo = _hashTabs[tabId];
                var length = oTabInfo._arrCommittedNavigations.length;
                return length
            } else {
                throw new Error("inavlid tabId");
            }
        }

        function getFirstCommitedNavigationUrl(tabId) {
            if (tabId != undefined && tabId >= 0) {
                var oTabInfo = _hashTabs[tabId];
                var length = getCommitedNavigationCount(tabId);
                if (length > 0) {
                    return oTabInfo._arrCommittedNavigations[0]._url
                }
                return undefined
            } else {
                throw new Error("inavlid tabId");
            }
        }

        function getIndexOfCommittedNavigation(url, tabId) {
            try {
                if (tabId != undefined && tabId >= 0) {
                    var oTabInfo = _hashTabs[tabId];
                    var length = oTabInfo._arrCommittedNavigations.length;
                    var result = undefined;
                    var found = 0;
                    for (var k = 0; k < length; k++) {
                        var tempNavInfo = oTabInfo._arrCommittedNavigations[k];
                        if (tempNavInfo._url == url) {
                            found++;
                            result = k
                        }
                    }
                    if (found == 1) {
                        return result
                    } else {
                        if (found == 0) {
                            log.INFO("Not always error, for ajax its ok. error should be determined by caller. getIndexOfCommittedNavigation : found == 0")
                        } else {
                            if (found > 1) {
                                log.ERROR("getIndexOfCommittedNavigation : found > 1")
                            }
                        }
                    }
                } else {
                    log.ERROR("getIndexOfCommittedNavigation : Inavlid tabId")
                }
            } catch (e) {
                log.SEVERE("2003", e)
            }
            return undefined
        }

        function getRequestIdOfTabUrl(url, tabId) {
            try {
                if (tabId >= 0) {
                    var oTabInfo = _hashTabs[tabId];
                    var length = oTabInfo._arrRequestsIds.length;
                    var indexLastRequest = undefined;
                    if (length == 0) {
                        var sourceTabId = _hashNavTargets[tabId];
                        if (sourceTabId && sourceTabId >= 0) {
                            log.ERROR("TODOZ - need to compute data from sourceTabId. tabId = " + tabId + ", sourceTabId = " + sourceTabId)
                        } else {
                            log.ERROR("_arrRequestsIds.length == 0 => how to handle it ?, tabId = " + tabId)
                        }
                    } else {
                        if (length == 1) {
                            indexLastRequest = 0
                        } else {
                            var found = 0;
                            for (var k = 0; k < length; k++) {
                                var tempRequestId = oTabInfo._arrRequestsIds[k];
                                var oTempRequestInfo = getRequestInfo(tempRequestId);
                                if (oTempRequestInfo != null) {
                                    if (oTempRequestInfo._completedUrl == url) {
                                        indexLastRequest = k;
                                        found++
                                    }
                                } else {
                                    log.ERROR("(is this error ?) getRequestInfo returned null for tempRequestId = " + tempRequestId)
                                }
                            }
                            if (found == 0) {
                                log.ERROR("getRequestIdOfTabUrl: url not found");
                                indexLastRequest = undefined
                            } else {
                                if (found == 1) {} else {
                                    log.ERROR("getRequestIdOfTabUrl: found > 1");
                                    indexLastRequest = undefined
                                }
                            }
                        }
                    }
                    if (indexLastRequest != undefined) {
                        var requestId = oTabInfo._arrRequestsIds[indexLastRequest];
                        return requestId
                    } else {
                        return undefined
                    }
                } else {
                    log.ERROR("invalid tabId");
                    return undefined
                }
            } catch (e) {
                log.SEVERE("2001", e);
                return null
            }
            return undefined
        }

        function computeClientRedirect(url, tabId) {
            try {
                var oTabInfo = _hashTabs[tabId];
                var result = undefined;
                var result_url = undefined;
                var result_duration = undefined;
                var index = undefined;
                var indexClientRedirect = undefined;
                index = getIndexOfCommittedNavigation(url, tabId);
                if (index == undefined) {
                    log.ERROR("getIndexOfCommittedNavigation failed #1")
                } else {
                    var oNavInfo = oTabInfo._arrCommittedNavigations[index];
                    if (oNavInfo._transitionQualifiers.indexOf("client_redirect") > -1) {
                        if (index > 0) {
                            indexClientRedirect = index - 1;
                            var oNavInfoClientRedirect = oTabInfo._arrCommittedNavigations[indexClientRedirect];
                            result_url = oNavInfoClientRedirect._url;
                            try {
                                var durationOnCRSiteBeforeTheClientRedirect = 0;
                                var timestampBeforeRequest = 0;
                                try {
                                    var length = oTabInfo._arrRequestsIds.length;
                                    for (var k = 0; k < length; k++) {
                                        var tempRequestId = oTabInfo._arrRequestsIds[k];
                                        var oTempRequestInfo = getRequestInfo(tempRequestId);
                                        if (oTempRequestInfo != null) {
                                            if (oTempRequestInfo._urlBeforeRequest == url) {
                                                timestampBeforeRequest = oTempRequestInfo._timestampBeforeRequest;
                                                break
                                            }
                                        } else {
                                            log.ERROR("getRequestInfo return null for tempRequestId = " + tempRequestId)
                                        }
                                    }
                                } catch (e) {
                                    log.SEVERE("9023", e)
                                }
                                if (timestampBeforeRequest != 0) {
                                    durationOnCRSiteBeforeTheClientRedirect = timestampBeforeRequest - oNavInfoClientRedirect._timeStamp;
                                    log.HT("durationOnCRSiteBeforeTheClientRedirect (crd) = " + durationOnCRSiteBeforeTheClientRedirect);
                                    result_duration = durationOnCRSiteBeforeTheClientRedirect
                                }
                            } catch (e) {
                                log.SEVERE("9024", e)
                            }
                        } else {
                            log.ERROR("client_redirect but no previous nav")
                        }
                    } else {}
                }
                if (false) {
                    if (index) {
                        var temp = oTabInfo._arrCommittedNavigations.splice(index, 1);
                        delete temp
                    }
                }
                if (indexClientRedirect) {
                    var temp = oTabInfo._arrCommittedNavigations.splice(indexClientRedirect, 1);
                    delete temp
                }
                if (typeof result_url != "undefined") {
                    result = new Object;
                    result.url = result_url;
                    result.duration = result_duration
                }
                return result
            } catch (e) {
                log.SEVERE("2005", e);
                return undefined
            }
        }

        var last_prev = "";
        var last_focused_url = "";
        function computePrev2(tabId) {
            try {
                var result = "";
                var prevTabId = undefined;
                var sourceTabId = _hashNavTargets[tabId];
                if (sourceTabId && sourceTabId >= 0) {
                    prevTabId = sourceTabId
                } else {
                    var oTabInfo = _hashTabs[tabId];
                    if(typeof oTabInfo == "undefined") {
                      prevTabId = _prevActiveTabId;
                    }
                    else if (!oTabInfo._lastReportedUrl || oTabInfo._lastReportedUrl == "") {
                        if (tabId != _activeTabId) {
                            prevTabId = _activeTabId;
                            log.INFO("prevTabId flow A")
                        } else {
                            if (tabId != _prevActiveTabId) {
                                prevTabId = _prevActiveTabId;
                                log.INFO("prevTabId flow B")
                            } else {
                                log.ERROR("Failed to find prevTabId")
                            }
                        }
                    } else {
                        prevTabId = tabId
                    }
                }
                var oPrevTabInfo = _hashTabs[prevTabId];
                if (oPrevTabInfo) {
                    result = oPrevTabInfo._lastReportedUrl
                } else {
                    if(last_focused_url != null && last_focused_url.length > 0) {
                        log.INFO("****** ast_focused_url is " + last_focused_url);
                        result = last_focused_url;
                    }
                    else if(last_prev != null && last_prev.length > 0) {
                        log.INFO("****** last_prev is " + last_prev);
                        result = last_prev;
                    }
                    else {
                        log.ERROR("failed to compute prev");
                    }
                }
                return result
            } catch (e) {
                log.SEVERE("2008", e);
                
                return ""
            }
        }

        function getRefererFromDomAndSubmit(tabId, url, prev, arrServerRedirectUrls, clientRedirectUrl, tmf) {
            try {
                if (isWebUrl(url) == false) {
                      return;
                  }

                var paramsToSubmit = {
                    _url: url,
                    _prev: prev,
                    _arrServerRedirectUrls: arrServerRedirectUrls,
                    _clientRedirectUrl: clientRedirectUrl,
                    _tmf: tmf
                };
                var json = JSON.stringify(paramsToSubmit);
                var executeInContentPage = function() {
                    try {
                        var oParamsFromContentToBG = {
                            params_: __JSON__PLACEHOLDER__,
                            tabId_: __TABID__PLACEHOLDER__,
                            fromTMV_: __TMV__PLACEHOLDER__,
                            messageId_: 55558888,
                            referrer_: document.referrer,
                            location_: document.location
                        };
                        chrome.extension.sendRequest(oParamsFromContentToBG, function(response) {})
                    } catch (e) {}
                };
                var sFunction = executeInContentPage.toString();
                sFunction = sFunction.replace("__JSON__PLACEHOLDER__", json);
                sFunction = sFunction.replace("__TABID__PLACEHOLDER__", tabId);
                sFunction = sFunction.replace("__TMV__PLACEHOLDER__", "'" + _tmv + "'");
                var sCode = sFunction.slice(sFunction.indexOf("{") + 1, sFunction.lastIndexOf("}"));
                if (chrome.runtime.lastError) {
                } else {
                  chrome.tabs.executeScript(tabId, {
                    code: sCode
                  }, function(result) {
                    if (chrome.runtime.lastError) { }
                    else { log.INFO("executeScript, result = " + result) }
                  });
                }
            } catch (e) {
                log.SEVERE("2007", e)
            }
        }

        function submit2(url, tabId, tmf) {
            try {
                var arrServerRedirectUrls = "";
                var referer = "";
                var prev = "";
                var clientRedirectUrl = "";
                var clientRedirectDuration = "";
                try {
                    if (tabId && tabId >= 0) {
                        var oTabInfo = _hashTabs[tabId];
                        if (oTabInfo) {
                            if (oTabInfo._lastReportedUrl) {
                                if (url == oTabInfo._lastReportedUrl) {
                                    //log.ERROR("we already reported this url as last, how come ? , url = " + url + ", tabId = " + tabId);
                                    
                                } else {}
                            }
                        } else {
                            log.ERROR("invalid oTabInfo")
                        }
                    } else {
                        log.ERROR("invalid tabId")
                    }
                } catch (e) {
                    log.SEVERE("5459", e)
                }
                try {
                    var oTabInfo = _hashTabs[tabId];
                    var requestId = getRequestIdOfTabUrl(url, tabId);
                    if (requestId != undefined) {
                        var oRequestInfo = getRequestInfo(requestId);
                        if (oRequestInfo._completedUrl == url) {
                            arrServerRedirectUrls = oRequestInfo.getRedirectUrls();
                            referer = oRequestInfo.getReferer();
                            var o = computeClientRedirect(url, tabId);
                            if (typeof o != "undefind" && o != null) {
                                if (typeof o.url != "undefined") {
                                    clientRedirectUrl = o.url
                                }
                                if (typeof o.duration != "undefined") {
                                    if (o.duration != 0) {
                                        clientRedirectDuration = Math.round(o.duration)
                                    }
                                }
                                delete o
                            }
                            oTabInfo._arrRequestsIds.splice(0, 1);
                            delete _hashRequests[requestId]
                        } else {
                            log.ERROR("oRequestInfo._completedUrl == url, tabId = " + tabId + ", _completedUrl = " + oRequestInfo._completedUrl + ", url = " + url)
                        }
                    } else {
                        log.ERROR("submit2, requestId is undefined, for url = " + url + ", tabId = " + tabId)
                    }
                } catch (e) {
                    log.SEVERE("5453", e)
                }
                
                prev = computePrev2(tabId);
                
                try {
                    if (_hashNavTargets[tabId]) {
                        delete _hashNavTargets[tabId]
                    }
                } catch (e) {
                    log.SEVERE("5457", e)
                }
                if (referer == undefined || referer == "") {
                  if(typeof prev == "undefined") {
                    
                  }
                    getRefererFromDomAndSubmit(tabId, url, prev, arrServerRedirectUrls, clientRedirectUrl, tmf);
                    
                } else {
                    submit1(url, referer, prev, arrServerRedirectUrls, clientRedirectUrl, clientRedirectDuration, tmf)
                }
            } catch (e) {
                log.SEVERE("5454", e)
            }
        }

        function logRequestHeadrs(tag, requestHeaders) {
            return;
            try {
                for (var j = 0; j < requestHeaders.length; ++j) {
                    var name = requestHeaders[j].name;
                    var value = requestHeaders[j].value;
                    log.INFO(tag + " " + j + "] name = " + name + ", value =" + value)
                }
            } catch (e) {
                log.SEVERE("8849", e)
            }
        }

        function logObject(tag, o) {
            try {
                var k = 0;
                for (var prop in o) {
                    log.INFO(tag + " " + k+++"] prop = " + prop + ", value =" + o[prop])
                }
            } catch (e) {
                log.SEVERE("8841", e)
            }
        }

        function logArray(tag, arr) {
            try {
                for (var idx = 0; idx < arr.length; idx++) {
                    log.INFO(tag + " " + idx+++"] = " + arr[idx])
                }
            } catch (e) {
                log.SEVERE("8841", e)
            }
        }

        function SIMTabInfo(tab, fromOnCreateEvent) {
            this._tab = tab;
            this._fromOnCreateEvent = fromOnCreateEvent;
            this._lastReportedUrl = "";
            this._tabsOnUpdatedUrl = "";
            this._marked = false;
            this._oldTabId = undefined;
            this._arrRequestsIds = new Array;
            this._arrCommittedNavigations = new Array
        }

        function SIMRequestInfo(tabId) {
            this._tabId = tabId;
            this._arrServerRedirectUrls = new Array;
            this._referer = "";
            this._transitionQualifiers = "";
            this._completedUrl = "";
            this._urlBeforeRequest = undefined;
            this._timestampBeforeRequest = 0;
            this.appendRedirectUrl = function(url) {
                this._arrServerRedirectUrls.push(url)
            };
            this.getRedirectUrls = function() {
                return this._arrServerRedirectUrls
            };
            this.setReferer = function(url) {
                if (this._referer.length == 0) {
                    this._referer = url
                } else {
                    log.INFO("setReferer already have a value. old = " + this._referer + ", new = " + url)
                }
            };
            this.getReferer = function() {
                return this._referer
            };
            this.setUrlBeforeRequest = function(url, timestamp) {
                this._urlBeforeRequest = url;
                this._timestampBeforeRequest = timestamp
            }
        }

        function SIMNavigationInfo(details) {
            this._frameId = details.frameId;
            this._processId = details.processId;
            this._tabId = details.tabId;
            this._timeStamp = details.timeStamp;
            this._transitionQualifiers = details.transitionQualifiers;
            this._transitionType = details.transitionType;
            this._url = details.url;
            this._prevWhenCommited = undefined
        }

        function logTabs() {
            return;
            try {
                var k = 0;
                for (var key in _hashTabs) {
                    var oSIMTabInfo = _hashTabs[key];
                    var intKey = parseInt(key, 10);
                    if (intKey >= 0) {
                        chrome.tabs.get(intKey, function(tab) {
                            if (tab != undefined) {
                                log.INFO("" + k+++" ) _hashTabs[" + tab.id + "] ,url = " + tab.url)
                            } else {
                                log.ERROR("9000, chrome.tabs.get failed for tabId = " + key)
                            }
                        })
                    } else {
                        log.ERROR("9001, chrome.tabs.get failed for key (!>=0) = " + key + ", oSIMTabInfo.url = " + oSIMTabInfo.tab.url)
                    }
                }
            } catch (e) {
                log.SEVERE("8700", e)
            }
        }

        function getTabInfo(tabId) {
            var oTabInfo = null;
            if (false) {
                var kk = 0;
                for (var prop in _hashTabs) {
                    log.INFO("aaaaaaa 1111111111     " + kk+++"] prop = " + prop + ", value =" + _hashTabs[prop])
                }
                log.INFO("a WTF aaaaaaaaaaaaaaaaa " + _hashTabs.hasOwnProperty(tabId));
                log.INFO("a WTF aaaaaaaaaaaaaaaaa " + _hashTabs.hasOwnProperty("" + tabId + ""))
            }
            oTabInfo = _hashTabs[tabId];
            if (oTabInfo == undefined) {
                if (false) {
                    chrome.tabs.get(tabId, function(tab) {
                        if (tab != undefined) {} else {
                            log.ERROR("9002, chrome.tabs.get failed for tabId = " + tabId)
                        }
                    });
                }
                oTabInfo = null
            }
            return oTabInfo
        }

        function addRequestInfo(requestId, tabId) {
            if (requestId == undefined) {
                throw new Error("addRequestInfo, requestId == undefined");
            }
            if (_hashRequests.hasOwnProperty(requestId) == false) {
                _hashRequests[requestId] = new SIMRequestInfo(tabId);
                log.INFO("_hashRequests.length = " + Object.keys(_hashRequests).length);
                return _hashRequests[requestId]
            } else {
                throw new Error("addRequestInfo, already exists, requestId = " + requestId);
            }
        }

        function getRequestInfo(requestId) {
            if (requestId == undefined) {
                throw new Error("getRequestInfo, requestId == undefined");
            }
            if (_hashRequests.hasOwnProperty(requestId) == false) {
                return null
            } else {
                return _hashRequests[requestId]
            }
        }

        function startsWith(str, what) {
            return str.substring(0, what.length) === what
        }

        function isWebUrl(url) {
            if (url && (url.indexOf("http") == 0) ) {
                return true
            } else {
                return false
            }
        }

        function updateActiveUrl(oDataTracker, callback) {
            log.INFO("updateActiveUrl : got here");
            chrome.windows.getAll({
                populate: true
            }, function(windows) {
                loop: for (var w = 0; w < windows.length; w++) {
                    var oWin = windows[w];
                    var winId = oWin.id;
                    if (winId == oDataTracker._focusedWindowId) {
                        var activeTabId = _activeTabs[winId];
                        for (var t = 0; t < windows[w].tabs.length; t++) {
                            var tab = windows[w].tabs[t];
                            var tabId = tab.id;
                            var url = tab.url;
                            if (tabId == activeTabId) {
                                if (isWebUrl(url)) {
                                    oDataTracker._urlOfActiveTabInFocusedWindow = url;
                                    _hashPrevs[tabId] = url;
                                    log.INFO("updateActiveUrl : winId = " + winId + ", tabId = " + tabId + ", url = " + url)
                                } else {
                                    log.INFO("updateActiveUrl : SKIPPED : winId = " + winId + ", tabId = " + tabId + ", url = " + url)
                                }
                                break loop
                            }
                        }
                    }
                }
                if (callback) {
                    callback()
                }
            })
        }
        this.webRequest_onBeforeRequest = function(details) {

            try {
                var url = details.url;
                var tabId = details.tabId;
                var requestId = details.requestId;
                var timestamp = details.timeStamp;
                log.HT("webRequest.onBeforeRequest tabId = " + tabId + ",requestId = " + requestId + ", url = " + url);
                if (tabId >= 0) {
                    var oRequestInfo = null;
                    oRequestInfo = getRequestInfo(requestId);
                    if (oRequestInfo == null) {
                        oRequestInfo = addRequestInfo(requestId, tabId)
                    }
                    oRequestInfo.setUrlBeforeRequest(url, timestamp);
                    var oTabInfo = null;
                    oTabInfo = getTabInfo(tabId);
                    if (oTabInfo == null) {
                        log.HT("oTabInfo is null, added myself, tabId = " + tabId);
                        var oTabInfo = new SIMTabInfo(null, false);
                        _hashTabs[tabId] = oTabInfo
                    }
                    var index = oTabInfo._arrRequestsIds.indexOf(requestId);
                    if (index == -1) {
                        oTabInfo._arrRequestsIds.push(requestId)
                    } else {
                        log.ERROR("requestId already exists in array: tabId = " + tabId + ", requestId = " + requestId + ", index = " + index + ", TODOZ maybe bcz of server redirect ?")
                    }
                } else {
                    log.ERROR("TODOZ how to handle tabId of -1, which is for new tab ?")
                }
            } catch (e) {
                log.SEVERE("8836", e)
            }
        };
        this.webRequest_onSendHeaders = function(details) {
          
            try {
                var url = details.url;
                var tabId = details.tabId;
                var requestId = details.requestId;
                logRequestHeadrs("JXJX  onSendHeaders", details.requestHeaders);
                var refererFromHeaders = getRefererFromDetails(details);
                var refererFromAddressBar = null;
                if (refererFromHeaders != null && refererFromHeaders != undefined) {
                    if (tabId >= 0) {
                        if (true) {
                            var oRequestInfo = null;
                            oRequestInfo = getRequestInfo(requestId);
                            if (oRequestInfo == null) {
                                oRequestInfo = addRequestInfo(requestId, tabId)
                            }
                            oRequestInfo.setReferer(refererFromHeaders)
                        }
                    } else {
                        log.ERROR("9002, tabId < 0 = " + tabId)
                    }
                } else {
                    log.HT("webRequest.onSendHeaders, refererFromHeaders undfined or null : tabId = " + tabId + ",requestId = " + requestId + ", url= " + url)
                }
            } catch (e) {
                log.SEVERE("8800", e)
            }
        };
        this.webRequest_onHeadersReceived = function(details) {
          
            try {
                var url = details.url;
                var tabId = details.tabId;
                var requestId = details.requestId;
                var statusLine = details.statusLine;
                log.INFO("webRequest.onHeadersReceived tabId = " + tabId + ",requestId = " + requestId + ", url = " + url + ", statusLine = " + statusLine)
            } catch (e) {
                log.SEVERE("8839", e)
            }
        };
        this.webRequest_onBeforeRedirect = function(details) {
          
            try {
                var url = details.url;
                var tabId = details.tabId;
                var requestId = details.requestId;
                var oRequestInfo = null;
                oRequestInfo = getRequestInfo(requestId);
                if (oRequestInfo == null) {
                    oRequestInfo = addRequestInfo(requestId, tabId)
                }
                oRequestInfo.appendRedirectUrl(url);
                log.INFO("webRequest.onBeforeRedirect tabId = " + tabId + ",requestId = " + requestId + ", url = " + url)
            } catch (e) {
                log.SEVERE("8835", e)
            }
        };
        this.webRequest_onResponseStarted = function(details) {
          
            try {
                var url = details.url;
                var tabId = details.tabId;
                var requestId = details.requestId;
                log.INFO("webRequest.onResponseStarted tabId = " + tabId + ",requestId = " + requestId + ", url = " + url)
            } catch (e) {
                log.SEVERE("8839", e)
            }
        };
        this.webRequest_onCompleted = function(details) {
          
            try {
                var url = details.url;
                var tabId = details.tabId;
                var requestId = details.requestId;
                log.INFO("webRequest.onCompleted tabId = " + tabId + ",requestId = " + requestId + ", url = " + url);
                var oRequestInfo = getRequestInfo(requestId);
                if (oRequestInfo == null) {
                    oRequestInfo = addRequestInfo(requestId, tabId)
                }
                oRequestInfo._completedUrl = url
            } catch (e) {
                log.SEVERE("8837", e)
            }
        };
        this.webRequest_onErrorOccurred = function(details) {
          
            try {
                var url = details.url;
                var tabId = details.tabId;
                var requestId = details.requestId;
                log.INFO("webRequest.onErrorOccurred tabId = " + tabId + ",requestId = " + requestId + ", url = " + url)
            } catch (e) {
                log.SEVERE("8896", e)
            }
        };
        this.webNavigation_onCreatedNavigationTarget = function(details) {
          
            try {
                if (details != undefined) {
                    var tabId = details.tabId;
                    if (tabId >= 0) {
                        if (_hashNavTargets[tabId] == undefined) {
                            _hashNavTargets[tabId] = details.sourceTabId;
                            log.HT("Added nav target: tabId = " + tabId + ", sourceTabId = " + details.sourceTabId)
                        } else {
                            log.ERROR("_hashNavTargets[tabId] == undefined")
                        }
                    }
                }
            } catch (e) {
                log.SEVERE("8997", e)
            }
        };
        this.webNavigation_onBeforeNavigate = function(details) {
          
            try {
                if (details != undefined && details.frameId == 0) {
                    if (details.tabId >= 0) {
                        updateActiveUrl(this, null)
                    } else {
                        log.ERROR("webNavigation_onBeforeNavigate : how to handle tabId < 0 ? ")
                    }
                }
            } catch (e) {
                log.SEVERE("8897", e)
            }
        };
        this.webNavigation_onCommitted = function(details) {
          
            try {
                if (details != undefined && details.frameId == 0) {
                    var tabId = details.tabId;
                    if (tabId >= 0) {
                        var oTabInfo = _hashTabs[tabId];
                        if (oTabInfo) {
                            var oNavInfo = new SIMNavigationInfo(details);
                            oNavInfo._prevWhenCommited = _urlOfActiveTabInFocusedWindow;
                            oTabInfo._arrCommittedNavigations.push(oNavInfo)
                        } else {
                            log.ERROR("webNavigation_onCommitted, oTabInfo is null, for tabId = " + tabId + ", url = " + details.url)
                        }
                    } else {
                        log.ERROR("TODOZ - webNavigation_onCommitted, how to handle tabId < 0 (newtab) ? -> attach to processId ??")
                    }
                }
            } catch (e) {
                log.SEVERE("8898", e)
            }
        };
        this.webNavigation_onDOMContentLoaded = function(details) {
          
            try {} catch (e) {
                log.SEVERE("8862", e)
            }
        };
        this.webNavigation_onCompleted = function(details) {
          
            try {
                if (details != undefined && details.frameId == 0) {
                    var tabId = details.tabId;
                    if (tabId >= 0) {
                      
                        var oTabInfo = _hashTabs[tabId];
                        
                        if (oTabInfo) {

                            var lastReportedUrl = oTabInfo._lastReportedUrl;
                            
                            if (oTabInfo._marked == true) {
                              
                                if (details.url != lastReportedUrl) {
                                  
                                    log.HT("CCCC 3, sumbit = " + details.url + " , (lastReportedUrl = " + lastReportedUrl + ")")
                                } else {
                                    log.HT("CCCC 4, already sumbitted = " + details.url + " , (lastReportedUrl = " + lastReportedUrl + ")")
                                }
                            } else {
                                var timeout = 5E3;
                                var timerId = window.setTimeout(function(tabId_) {
                                    try {
                                        var msg = "TIMER, tabId_ =  " + tabId_;
                                        log.HT(msg)
                                    } catch (e1) {}
                                    try {} catch (e1) {}
                                }, timeout, tabId);
                                log.HT("XZXZXZ  IMHERE : pre-loaded ford.com arrives here... TOODZ ? webNavigation_onCompleted : add to popups/boxes = " + details.url + " , (_tabsOnUpdatedUrl = " + oTabInfo._tabsOnUpdatedUrl + ")")
                            }
                        } else {
                            log.ERROR("webNavigation_onCompleted, oTabInfo null/undefined for tabId = " + tabId + ", url = " + details.url)
                        }
                    } else {
                        if (tabId == -1) {
                            log.HT("webNavigation_onCompleted, TODOZ - how to handle it ? tabId == -1 =>  new tab/ else ? = " + details.url)
                        } else {
                            log.ERROR("webNavigation_onCompleted, Invalid tabId = " + tabId)
                        }
                    }
                }
            } catch (e) {
                log.SEVERE("8891", e)
            }
        };
        this.webNavigation_onErrorOccurred = function(details) {
          
            try {
                if (details != undefined && details.frameId == 0) {
                    var error = details.error;
                    var frameId = details.frameId;
                    var processId = details.processId;
                    var tabId = details.tabId;
                    var timeStamp = details.timeStamp;
                    var url = details.url;
                    if (isWebUrl(url)) {
                        if (tabId >= 0) {
                            var oTabInfo = _hashTabs[tabId];
                            if (url != oTabInfo._lastReportedUrl) {
                                submit2(url, tabId, TMF_WEBNAVIGATION_ONERROR);
                                oTabInfo._lastReportedUrl = url
                            } else {
                                log.HT("webNavigation_onErrorOccurred, already reported = " + url + ", tabId = " + tabId)
                            }
                        } else {
                            log.ERROR("webNavigation_onErrorOccurred, invalid tabId = " + tabId)
                        }
                    } else {
                        log.HT("webNavigation_onErrorOccurred, skipped no-web url = " + url + ", tabId = " + tabId)
                    }
                }
            } catch (e) {
                log.SEVERE("8893", e)
            }
        };
        this.webNavigation_onTabRep = function(details) {

            try {
                if (details != undefined) {
                    var replacedTabId = details.replacedTabId;
                    var tabId = details.tabId;
                    var timeStamp = details.timeStamp
                }
            } catch (e) {
                log.SEVERE("8861", e)
            }
        };
        this.webNavigation_onHistoryStateUpdated = function(details) {
          
            try {} catch (e) {
                log.SEVERE("8839", e)
            }
        };
        this.windows_onFocusChanged = function(windowId) {
          
            try {
                // log.INFO("windows.onFocusChanged windowId = " + windowId);
                _focusedWindowId = windowId
            } catch (e) {
                log.SEVERE("8892", e)
            }
        };
        this.extension_onRequest = function(request, sender, sendResponse) {
            try {
              
                var extensionId = utils.getExtensionId();
                if (sender && sender.id == extensionId) {
                  
                    var fromTMV = request.fromTMV_;
                    if (fromTMV && fromTMV == _tmv) {
                      
                        var messageId = request.messageId_;
                        if (messageId && messageId == 55558888) {
                          
                            log.INFO("extension_onRequest: received message");
                            var tabId_ = request.tabId_;
                            var location_ = request.location_;
                            var dom_url = location_.href;
                            var url = request.params_._url;
                            var prev = request.params_._prev;
                            var arrServerRedirectUrls = request.params_._arrServerRedirectUrls;
                            var clientRedirectUrl = request.params_._clientRedirectUrl;
                            var tmf = request.params_._tmf;
                            if (url == dom_url) {
                              
                                var referer = request.referrer_;
                                if (referer == url) {
                                  
                                    log.ERROR("train missed # 1?");
                                    referer = ""
                                }
                                if (referer && referer != "") {
                                    tmf += ".1";
                                    
                                }
                            } else {
                              
                                log.ERROR("train missed # 2?");
                                referer = ""
                            }
                            submit1(url, referer, prev, arrServerRedirectUrls, clientRedirectUrl, "", tmf)
                        } else {
                          
                            log.ERROR("messaged unknown, or undefined : request = " + request)
                        }
                    } else {
                      
                        if (fromTMV) {
                          
                            log.INFO("Message of other tmv = " + fromTMV)
                        } else {
                          
                            log.ERROR("Message without fromTMV")
                        }
                    }
                } else {
                  
                    log.ERROR("unknown sender = " + sender.id)
                }
            } catch (e) {
              
                log.SEVERE("2020", e)
            }
            
        };
        this.tabs_onCreated = function(tab) {
            try {
                log.INFO("tabs.onCreated, tab.id = " + tab.id);
                var oTabInfo = new SIMTabInfo(tab, true);
                _hashTabs[tab.id] = oTabInfo;
                log.INFO("Count of tabs after onCreated = " + Object.keys(_hashTabs).length);
                logTabs()
            } catch (e) {
                log.SEVERE("8831", e)
            }
        };
        this.tabs_onActivated = function(activeInfo) {
            try {
                log.INFO("tabs.onActivated  windowId = " + activeInfo.windowId + ", tabId = " + activeInfo.tabId);
                _activeTabs[activeInfo.windowId] = activeInfo.tabId;
                if (activeInfo.tabId >= 0) {
                    _prevActiveTabId = _activeTabId;
                    _activeTabId = activeInfo.tabId;
                    chrome.tabs.get(activeInfo.tabId, function(tab) {
                        log.INFO("***** tabs.onActivated got tab");
                        if (tab != undefined) {
                            if(isWebUrl(tab.url)) {
                                log.INFO("***** tabs.onActivated got tab Inside...");
                                last_focused_url = tab.url;
                            }
                        }
                    });
                } else {
                    log.ERROR("tabs_onActivated, how to handle activeInfo.tabId <0  ?")
                }
                log.INFO("tabs_onActivated, total count of active tabs (0 or 1, for each window) = " + Object.keys(_activeTabs).length)
            } catch (e) {
                log.SEVERE("8834", e)
            }
        };
        this.tabs_onRemoved = function(tabId, removeInfo) {
            try {
                log.INFO("tabs.onRemoved, tabId = " + tabId);
                delete _hashTabs[tabId];
                if (_hashNavTargets[tabId]) {
                    delete _hashNavTargets[tabId]
                }
                log.INFO("Count of tabs after onRemoved = " + Object.keys(_hashTabs).length);
                logTabs()
            } catch (e) {
                log.SEVERE("8832", e)
            }
        };
        this.tabs_onReplaced = function(addedTabId, removedTabId) {
            try {
                if (addedTabId >= 0 && removedTabId >= 0) {
                    var oAddTabInfo = _hashTabs[addedTabId];
                    var oRemoveTabInfo = _hashTabs[removedTabId];
                    if (oAddTabInfo && oRemoveTabInfo) {
                        var removedUrl = oRemoveTabInfo._lastReportedUrl;
                        var addedUrl = undefined;
                        var count = getCommitedNavigationCount(addedTabId);
                        if (count > 0) {
                            addedUrl = getFirstCommitedNavigationUrl(addedTabId)
                        }
                        log.HT("tabs.onReplaced, addedTabId = " + addedTabId + ", removedTabId = " + removedTabId + ", removedUrl = " + removedUrl + ", addedUrl = " + addedUrl);
                        if (addedUrl == oAddTabInfo._lastReportedUrl) {
                        } else {
                            if (isWebUrl(addedUrl)) {
                                if (_hashPrevs[removedTabId]) {
                                    _hashPrevs[addedTabId] = _hashPrevs[removedTabId];
                                    delete _hashPrevs[removedTabId]
                                }
                                oAddTabInfo._lastReportedUrl = oRemoveTabInfo._lastReportedUrl;
                                submit2(addedUrl, addedTabId, TMF_TABS_ONREPLACED);
                                oAddTabInfo._lastReportedUrl = addedUrl
                            } else {
                                log.HT("skipped non web url = " + addedUrl + "tabId = " + addedTabId)
                            }
                        }
                        delete _hashTabs[removedTabId];
                        oAddTabInfo._oldTabId = removedTabId;
                        if (_hashNavTargets[removedTabId]) {
                            _hashNavTargets[addedTabId] = _hashNavTargets[removedTabId];
                            delete _hashNavTargets[removedTabId]
                        }
                    } else {
                        if (!oAddTabInfo) {
                            log.ERROR("tabs_onReplaced, oAddTabInfo udefined for addedTabId = " + addedTabId)
                        }
                        if (!oRemoveTabInfo) {
                            log.ERROR("tabs_onReplaced, oRemoveTabInfo udefined for removedTabId = " + removedTabId)
                        }
                    }
                } else {
                    log.ERROR("webNavigation_onTabRep : addedTabId >= 0 && removedTabId >=0")
                }
            } catch (e) {
                log.SEVERE("8847", e)
            }
        };
        this.tabs_onUpdated = function(tabId, changeInfo, tab) {

            try {
              
                if (changeInfo.status == "complete") {
                  
                    var url = tab.url;
                    var lastReportedUrl = "";
                    log.HT("tabs.onUpdated, status = " + changeInfo.status + ", tabId = " + tabId + ", url = " + url);
                    var oTabInfo = _hashTabs[tabId];
                    if (oTabInfo) {
                        lastReportedUrl = oTabInfo._lastReportedUrl
                    } else {
                        log.ERROR("oTabInfo null/undefined for tabId = " + tabId)
                    }
                    if (isWebUrl(url)) {
                        
                        log.HT("tabs.onUpdated going to submit, tabId = " + tabId + ", url = " + url);
                        submit2(url, tabId, TMF_TABS_ONUPDATED);
                        if (oTabInfo) {
                            oTabInfo._lastReportedUrl = url
                        }
                        updateActiveUrl(this, null);
                        
                    } else {
                        log.HT("skipped non-web url = " + url + ", tabId = " + tabId)
                    }
                } else {}
            } catch (e) {
                log.SEVERE("8833", e)
            }
        };
        this.addListners_webRequest = function() {
            try {
                if (typeof chrome.webRequest == "undefined") {
                    log.ERROR("permission missing: webRequest")
                } else {
                    var filter = {
                        types: ["main_frame"],
                        urls: ["<all_urls>"]
                    };
                    var extraInfoSpec = ["requestHeaders"];
                    if (true) {
                        chrome.webRequest.onBeforeRequest.addListener(this.webRequest_onBeforeRequest, filter)
                    }
                    chrome.webRequest.onSendHeaders.addListener(this.webRequest_onSendHeaders, filter, extraInfoSpec);
                    if (true) {
                        chrome.webRequest.onHeadersReceived.addListener(this.webRequest_onHeadersReceived, filter)
                    }
                    chrome.webRequest.onBeforeRedirect.addListener(this.webRequest_onBeforeRedirect, filter);
                    if (true) {
                        chrome.webRequest.onResponseStarted.addListener(this.webRequest_onResponseStarted, filter)
                    }
                    chrome.webRequest.onCompleted.addListener(this.webRequest_onCompleted, filter);
                    chrome.webRequest.onErrorOccurred.addListener(this.webRequest_onErrorOccurred, filter)
                }
            } catch (e) {
                log.SEVERE("8888", e)
            }
        };
        this.addListners_webNavigation = function() {
            try {
                if (typeof chrome.webNavigation == "undefined") {
                    log.ERROR("permission missing: webNavigation")
                } else {
                    if (chrome.webNavigation.onCreatedNavigationTarget) {
                        chrome.webNavigation.onCreatedNavigationTarget.addListener(this.webNavigation_onCreatedNavigationTarget)
                    } else {
                        log.ERROR("chrome.webNavigation.onCreatedNavigationTarget undefined")
                    }
                    if (chrome.webNavigation.onBeforeNavigate) {
                        chrome.webNavigation.onBeforeNavigate.addListener(this.webNavigation_onBeforeNavigate)
                    } else {
                        log.ERROR("chrome.webNavigation.onBeforeNavigate undefined")
                    }
                    if (chrome.webNavigation.onCommitted) {
                        chrome.webNavigation.onCommitted.addListener(this.webNavigation_onCommitted)
                    } else {
                        log.ERROR("chrome.webNavigation.onCommitted undefined")
                    }
                    if (chrome.webNavigation.onDOMContentLoaded) {
                        chrome.webNavigation.onDOMContentLoaded.addListener(this.webNavigation_onDOMContentLoaded)
                    } else {
                        log.ERROR("chrome.webNavigation.onDOMContentLoaded undefined")
                    }
                    if (chrome.webNavigation.onCompleted) {
                        chrome.webNavigation.onCompleted.addListener(this.webNavigation_onCompleted)
                    } else {
                        log.ERROR("chrome.webNavigation.onCompleted undefined")
                    }
                    if (chrome.webNavigation.onErrorOccurred) {
                        chrome.webNavigation.onErrorOccurred.addListener(this.webNavigation_onErrorOccurred)
                    } else {
                        log.ERROR("chrome.webNavigation.onErrorOccurred undefined")
                    }
                    if (chrome.webNavigation.onTabReplaced) {
                        chrome.webNavigation.onTabReplaced.addListener(this.webNavigation_onTabRep)
                    } else {
                        log.ERROR("chrome.webNavigation.onTabReplaced undefined")
                    }
                    if (chrome.webNavigation.onHistoryStateUpdated) {
                        chrome.webNavigation.onHistoryStateUpdated.addListener(this.webNavigation_onHistoryStateUpdated)
                    } else {
                        log.ERROR("chrome.webNavigation.onHistoryStateUpdated undefined")
                    }
                }
            } catch (e) {
                log.SEVERE("8887", e)
            }
        };
        this.addListners_tabs = function() {
            try {
                chrome.tabs.onCreated.addListener(this.tabs_onCreated);
                chrome.tabs.onRemoved.addListener(this.tabs_onRemoved);
                chrome.tabs.onUpdated.addListener(this.tabs_onUpdated);
                chrome.tabs.onActivated.addListener(this.tabs_onActivated);
                chrome.tabs.onReplaced.addListener(this.tabs_onReplaced)
            } catch (e) {
                log.SEVERE("8889", e)
            }
        };
        this.addListners = function() {
            try {
                this.addListners_webRequest();
                this.addListners_tabs();
                this.addListners_webNavigation();
                chrome.windows.onFocusChanged.addListener(this.windows_onFocusChanged);
                chrome.extension.onRequest.addListener(this.extension_onRequest)
            } catch (e) {
                log.SEVERE("8844", e)
            }
        };
        this.start = function() {
            try {
                log.INFO("bg start: got here");
                this.addListners()
            } catch (e) {
                log.SEVERE("8801", e)
            }
        }
    };
    this.main = function() {
        try {
            var lbclient = new SIM_LB_Client;
            lbclient.start_lb()
        } catch (e) {
            console.log("9099, " + e)
        }
    };
    var log = SIM_Logger_BG;
    var utils = SIM_FrameworkUtils;
    this.main()
  })();

  return {
    get Storage() { return NS.Storage; },
    remove: NS.remove
  };
}());