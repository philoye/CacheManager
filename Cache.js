(function() {
  var Cache, CacheManager, root;
  root = this;
  Cache = new (CacheManager = function() {
    var DEFAULT_TIMEOUT, DEFAULT_TTL, cacheDirectory, create, dispatchError, getCookie, saveCookie;
    DEFAULT_TTL = 60;
    DEFAULT_TIMEOUT = 30;
    cacheDirectory = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator + "cache");
    if (!cacheDirectory.exists()) {
      cacheDirectory.createDirectory();
    }
    create = function(filename, parameters) {
      var key, loader, pairs;
      if (parameters.method === "GET" && (parameters.data != null)) {
        if (typeof parameters.data === "object") {
          pairs = [];
          for (key in parameters.data) {
            if (parameters.data.hasOwnProperty(key)) {
              pairs.push(key + "=" + parameters.data[key]);
            }
          }
          parameters.url += "?" + pairs.join("&");
        } else {
          if (typeof parameters.data === "string") {
            parameters.url += "?" + parameters.data;
          }
        }
        parameters.data = null;
      }
      Titanium.API.debug("CacheManager/ Creating a new connection for " + parameters.url + " (" + parameters.method + ")");
      loader = Titanium.Network.createHTTPClient();
      loader.setTimeout(parameters.timeout * 1000);
      loader.onload = function(e) {
        var error, file;
        if ((this.status >= 200 && this.status < 300) || this.status === 304) {
          if (loader.getResponseHeader("Set-Cookie") != null) {
            saveCookie(loader.getResponseHeader("Set-Cookie"));
          }
          file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator + "cache" + Titanium.Filesystem.separator + filename);
          if (file.exists()) {
            file.deleteFile();
          }
          file.write(this.responseText);
          return parameters.callback(this.responseText, this.location);
        } else {
          C.log('load error!');
          error = {
            status: this.status,
            response: this.responseText
          };
          return Ti.App.fireEvent('ajaxLoadError', error);
        }
      };
      loader.onerror = function(e) {
        var error;
        if (parameters.error != null) {
          return parameters.error(e);
        } else {
          error = {
            status: this.status,
            response: this.responseText,
            error: e.error
          };
          return Ti.App.fireEvent('ajaxNetworkError', error);
        }
      };
      loader.open(parameters.method, parameters.url);
      if (parameters.cookie === true && getCookie() !== false) {
        loader.setRequestHeader("Cookie", getCookie());
      }
      loader.setRequestHeader("User-Agent", parameters.userAgent);
      if (parameters.auth != null) {
        loader.setRequestHeader('Authorization', 'Basic ' + Ti.Utils.base64encode(parameters.auth.username + ":" + parameters.auth.password));
      }
      return loader.send(parameters.data);
    };
    dispatchError = function(message) {
      return Titanium.API.error(message);
    };
    getCookie = function() {
      if (Titanium.App.Properties.hasProperty("CacheManagerCookie")) {
        return Titanium.App.Properties.getString("CacheManagerCookie");
      } else {
        return false;
      }
    };
    saveCookie = function(value) {
      value = value.split(";")[0];
      return Titanium.App.Properties.setString("CacheManagerCookie", value);
    };
    /*
      Create an instance of Titanium.Network.HTTPClient if the URL is not cached or has expired
      @param {Object} parameters url: The URL for the request
                      callback: The function to be called upon a successful response
                      data (optional): The data to send in the request. Can either be null, dictionary or string
                      method (optional): The HTTP method. Defaults to "GET"
                      ttl: The time to live in seconds. Defaults to DEFAULT_TTL
                      cookie: Can be a boolean or a string containing the cookie value. Defaults to true
                      userAgent: Will override Titanium's default user agent in the current request.
                      auth: Hash of `username` and `password`. Password will be properly encoded.
                      timeout: The time in seconds to wait before giving up. Defaults to DEFAULT_TIMEOUT.
       */
    this.get = function(parameters) {
      var file, filename, hash;
      if (typeof parameters !== "object") {
        return dispatchError("<parameters> must be a valid Object { url, callback, [data], [method], [ttl] }");
      }
      if (typeof parameters.url !== "string") {
        return dispatchError("<url> must be a string");
      }
      if (typeof parameters.callback !== "function") {
        return dispatchError("<callback> must be a function");
      }
      if (typeof parameters.error !== 'undefined') {
        if (typeof parameters.error !== 'function') {
          return dispatchError("<error> if defined, must be a function");
        } else {
          parameters.error = null;
        }
      }
      if (typeof parameters.auth !== 'undefined') {
        if (typeof parameters.auth.username !== 'string') {
          return dispatchError("<username> must be a string");
        }
        if (typeof parameters.auth.password !== 'string') {
          return dispatchError("<password> must be a string");
        }
      }
      if (typeof parameters.data !== "object" && typeof parameters.data !== "string") {
        parameters.data = null;
      }
      if (parameters.method !== "GET" && parameters.method !== "POST") {
        parameters.method = "GET";
      }
      if (typeof parameters.ttl !== "number" || parameters.ttl < 0) {
        parameters.ttl = DEFAULT_TTL;
      }
      if (typeof parameters.timeout !== "number" || parameters.timeout < 0) {
        parameters.timeout = DEFAULT_TIMEOUT;
      }
      if (typeof parameters.cookie === "string") {
        saveCookie(parameters.cookie);
        parameters.cookie = true;
      } else {
        if (typeof parameters.cookie !== "boolean") {
          parameters.cookie = true;
        }
      }
      if (typeof parameters.userAgent !== "string") {
        parameters.userAgent = Titanium.userAgent;
      }
      hash = "-" + Titanium.Utils.md5HexDigest(parameters.url + JSON.stringify(parameters.data) + parameters.method);
      filename = parameters.url.split("/")[parameters.url.split("/").length - 1];
      filename = (filename.length === 0 ? "index" + hash : filename + hash);
      file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator + "cache" + Titanium.Filesystem.separator + filename);
      if (file.exists()) {
        if ((new Date().getTime() - file.modificationTimestamp()) / 1000 < parameters.ttl || !Titanium.Network.online) {
          Titanium.API.debug("CacheManager/ Retrieving " + filename + " from cache");
          return parameters.callback(file.read());
        } else {
          return create(filename, parameters);
        }
      } else {
        return create(filename, parameters);
      }
    };
    return Titanium.API.debug("CacheManager/ Loaded");
  });
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cache;
  } else {
    root.Cache = Cache;
  }
}).call(this);
