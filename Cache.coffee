root = this

Cache = new CacheManager = ->

  DEFAULT_TTL = 60 # seconds

  ## Initialization. Will create a directory named 'cache' to store cached resources
  cacheDirectory = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator + "cache")
  cacheDirectory.createDirectory()  unless cacheDirectory.exists()

  create = (filename, parameters) ->
    ## FIX 2011-03-02: Workaround for HTTPClient.connectionType forcing to "POST" when sending data
    if parameters.method == "GET" and parameters.data?
      if typeof (parameters.data) == "object"
        pairs = []
        for key of parameters.data
          pairs.push key + "=" + parameters.data[key]  if parameters.data.hasOwnProperty(key)
        parameters.url += "?" + pairs.join("&")
      else parameters.url += "?" + parameters.data  if typeof (parameters.data) == "string"
      parameters.data = null
    Titanium.API.debug "CacheManager/ Creating a new connection for " + parameters.url + " (" + parameters.method + ")"
    loader = Titanium.Network.createHTTPClient()

    loader.onload = (e) ->
      saveCookie loader.getResponseHeader("Set-Cookie")  if loader.getResponseHeader("Set-Cookie")?
      file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator + "cache" + Titanium.Filesystem.separator + filename)
      file.deleteFile()  if file.exists()
      file.write @responseText
      parameters.callback @responseText, @location

    loader.onerror = (e) ->
      dispatchError e.error

    loader.open parameters.method, parameters.url
    loader.setRequestHeader "Cookie", getCookie()  if parameters.cookie == true and getCookie() != false
    loader.setRequestHeader "User-Agent", parameters.userAgent
    loader.send parameters.data

  dispatchError = (message) ->
    Titanium.API.error message

  getCookie = ->
    if Titanium.App.Properties.hasProperty("CacheManagerCookie")
      return Titanium.App.Properties.getString("CacheManagerCookie")
    else
      return false

  saveCookie = (value) ->
    value = value.split(";")[0]
    Titanium.App.Properties.setString "CacheManagerCookie", value

  ###
  Create an instance of Titanium.Network.HTTPClient if the URL is not cached or has expired
  @param {Object} parameters url: The URL for the request
                  callback: The function to be called upon a successful response
                  data (optional): The data to send in the request. Can either be null, dictionary or string
                  method (optional): The HTTP method. Defaults to "GET"
                  ttl: The time to live in seconds. Defaults to DEFAULT_TTL
                  cookie: Can be a boolean or a string containing the cookie value. Defaults to true
                  userAgent: Will override Titanium's default user agent in the current request.
   ###
  @get = (parameters) ->
    if typeof (parameters) != "object"
      return dispatchError("<parameters> must be a valid Object { url, callback, [data], [method], [ttl] }")
    if typeof (parameters.url) != "string"
      return dispatchError("<url> must be a string")
    if typeof (parameters.callback) != "function"
      return dispatchError("<callback> must be a function")
    if typeof (parameters.data) != "object" and typeof (parameters.data) != "string"
      parameters.data = null
    if parameters.method != "GET" and parameters.method != "POST"
      parameters.method = "GET"
    if typeof (parameters.ttl) != "number" or parameters.ttl < 0
      parameters.ttl = DEFAULT_TTL
    if typeof (parameters.cookie) == "string"
      saveCookie parameters.cookie
      parameters.cookie = true
    else
      parameters.cookie = true  unless typeof (parameters.cookie) == "boolean"
    if typeof (parameters.userAgent) != "string"
      parameters.userAgent = Titanium.userAgent

    hash = "-" + Titanium.Utils.md5HexDigest(parameters.url + JSON.stringify(parameters.data) + parameters.method)
    filename = parameters.url.split("/")[parameters.url.split("/").length - 1]
    filename = (if filename.length == 0 then "index" + hash else filename + hash)
    file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory + Titanium.Filesystem.separator + "cache" + Titanium.Filesystem.separator + filename)
    if file.exists()
      if (new Date().getTime() - file.modificationTimestamp()) / 1000 < parameters.ttl or not Titanium.Network.online
        Titanium.API.debug "CacheManager/ Retrieving " + filename + " from cache"
        parameters.callback file.read()
      else
        create filename, parameters
    else
      create filename, parameters

  Titanium.API.debug "CacheManager/ Loaded"


# This should target commonJS or add Cache to the global object
if typeof module != 'undefined' and module.exports
  module.exports = Cache
else
  root.Cache = Cache

