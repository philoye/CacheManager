(function() {
  var Cache, CacheManager, root;
  root = this;
  Cache = new (CacheManager = function() {
    var DEFAULT_TTL, cacheDirectory, create, dispatchError, getCookie, saveCookie;
    DEFAULT_TTL = 60;
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
      loader.open(parameters.method, parameters.url);
      if (parameters.cookie === true && getCookie() !== false) {
        loader.setRequestHeader("Cookie", getCookie());
      }
      loader.setRequestHeader("User-Agent", parameters.userAgent);
      loader.onload = function(e) {
        var file;
        if (loader.getResponseHeader("Set-Cookie") != null) {
          saveCookie(loader.getResponseHeader("Set-Cookie"));
        }
        file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator + "cache" + Titanium.Filesystem.separator + filename);
        if (file.exists()) {
          file.deleteFile();
        }
        file.write(this.responseText);
        return parameters.callback(this.responseText, this.location);
      };
      loader.onerror = function(e) {
        return dispatchError(e.error);
      };
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
      if (typeof parameters.data !== "object" && typeof parameters.data !== "string") {
        parameters.data = null;
      }
      if (parameters.method !== "GET" && parameters.method !== "POST") {
        parameters.method = "GET";
      }
      if (typeof parameters.ttl !== "number" || parameters.ttl < 0) {
        parameters.ttl = DEFAULT_TTL;
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
