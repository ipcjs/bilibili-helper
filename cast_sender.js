(function() {var CastApiBootstrap = function() {
};
CastApiBootstrap.CAST_API_FILE_ = document.currentScript && -1 != document.currentScript.src.indexOf("?loadGamesSDK") ? "/cast_game_sender.js" : "/cast_sender.js";
CastApiBootstrap.CLANK_BASE_PATH_ = "//www.gstatic.com/eureka/clank";
CastApiBootstrap.useInternalExtensionIds_ = 0 < window.location.hash.indexOf("__CastInternalExtensionIds__");
CastApiBootstrap.CAST_PUBLIC_EXTENSION_IDS_ = ["boadgeojelhgndaghljhdicfkmllpafd", "dliochdbjfkdbacpmhlcpmleaejidimm"];
CastApiBootstrap.CAST_INTERNAL_EXTENSION_IDS_ = ["hfaagokkkhdbgiakmmlclaapfelnkoah", "fmfcbgogabcbclcofgocippekhfcmgfj", "enhhojjnijigcajfphajepfemndkmdlo", "eojlgccfgnjlphjnlopmadngcgmmdgpk"];
CastApiBootstrap.MR_PUBLIC_EXTENSION_IDS_ = ["fjhoaacokmgbjemoflkofnenfaiekifl"];
CastApiBootstrap.MR_INTERNAL_EXTENSION_IDS_ = ["ekpaaapppgpmolpcldedioblbkmijaca", "lhkfccafpkdlaodkicmokbmfapjadkij", "ibiljbkambkbohapfhoonkcpcikdglop", "enhhojjnijigcajfphajepfemndkmdlo"];
CastApiBootstrap.CAST_EXTENSION_IDS_ = CastApiBootstrap.useInternalExtensionIds_ ? CastApiBootstrap.CAST_PUBLIC_EXTENSION_IDS_.concat(CastApiBootstrap.CAST_INTERNAL_EXTENSION_IDS_) : CastApiBootstrap.CAST_PUBLIC_EXTENSION_IDS_;
CastApiBootstrap.MR_EXTENSION_IDS_ = CastApiBootstrap.useInternalExtensionIds_ ? CastApiBootstrap.MR_INTERNAL_EXTENSION_IDS_.concat(CastApiBootstrap.MR_PUBLIC_EXTENSION_IDS_) : CastApiBootstrap.MR_PUBLIC_EXTENSION_IDS_;
CastApiBootstrap.EXTENSION_IDS_ = window.navigator.presentation ? CastApiBootstrap.CAST_EXTENSION_IDS_.concat(CastApiBootstrap.MR_EXTENSION_IDS_) : CastApiBootstrap.CAST_EXTENSION_IDS_;
CastApiBootstrap.findInstalledExtensionWithCallback = function(callback) {
  window.chrome ? CastApiBootstrap.findInstalledExtensionHelper_(0, callback) : callback(null);
};
CastApiBootstrap.findInstalledExtensionHelper_ = function(index, callback) {
  index == CastApiBootstrap.EXTENSION_IDS_.length ? callback(null) : CastApiBootstrap.isExtensionInstalled_(CastApiBootstrap.EXTENSION_IDS_[index], function(installed) {
    installed ? callback(CastApiBootstrap.EXTENSION_IDS_[index]) : CastApiBootstrap.findInstalledExtensionHelper_(index + 1, callback);
  });
};
CastApiBootstrap.getCastSenderUrl_ = function(extensionId) {
  return "chrome-extension://" + extensionId + CastApiBootstrap.CAST_API_FILE_;
};
CastApiBootstrap.isExtensionInstalled_ = function(extensionId, callback) {
  var xmlhttp = new XMLHttpRequest;
  xmlhttp.onreadystatechange = function() {
    4 == xmlhttp.readyState && 200 == xmlhttp.status && callback(!0);
  };
  xmlhttp.onerror = function() {
    callback(!1);
  };
  try {
    xmlhttp.open("GET", CastApiBootstrap.getCastSenderUrl_(extensionId), !0), xmlhttp.send();
  } catch (e) {
    callback(!1);
  }
};
CastApiBootstrap.appendScript_ = function(src) {
  var apiScript = document.createElement("script");
  apiScript.src = src;
  (document.head || document.documentElement).appendChild(apiScript);
};
CastApiBootstrap.isClank_ = function() {
  var userAgent = window.navigator.userAgent;
  return 0 <= userAgent.indexOf("Android") && 0 <= userAgent.indexOf("Chrome/");
};
CastApiBootstrap.isChromeForIOS_ = function() {
  var userAgent = window.navigator.userAgent;
  return 0 <= userAgent.indexOf("CriOS");
};
CastApiBootstrap.findInstalledExtension = function() {
  if (window.navigator.presentation && CastApiBootstrap.isClank_()) {
    CastApiBootstrap.appendScript_(CastApiBootstrap.CLANK_BASE_PATH_ + CastApiBootstrap.CAST_API_FILE_);
  } else {
    if (CastApiBootstrap.isChromeForIOS_()) {
      var invokeOnHost = window.__gCrWeb && window.__gCrWeb.message && window.__gCrWeb.message.invokeOnHost;
      if (invokeOnHost) {
        invokeOnHost({command:"cast.sender.init"});
        return;
      }
    }
    CastApiBootstrap.findInstalledExtensionWithCallback(function(extensionId) {
      if (extensionId) {
        window.chrome = window.chrome || {}, window.chrome.cast = window.chrome.cast || {}, window.chrome.cast.extensionId = extensionId, CastApiBootstrap.appendScript_(CastApiBootstrap.getCastSenderUrl_(extensionId));
      } else {
        var callback = window.__onGCastApiAvailable;
        callback && "function" == typeof callback && callback(!1, "No cast extension found");
      }
    });
  }
};
CastApiBootstrap.findInstalledExtension();
})();
