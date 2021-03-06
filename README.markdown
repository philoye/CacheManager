__CacheManager__ is a script for Appcelerator Titanium Mobile. It is an extension
to __Titanium.Network.HTTPClient__ that allows you to cache remote resources.
Another advantage is retrieving the cached resource when the network connection
is unavailable.

This is a fork of @dhayab's [original](https://github.com/dhayab/CacheManager).


## Changes from the original

*  Repo no longer includes a sample app
*  Now written in coffeescript, a compiled javascript version is also provided
*  Adds support for `BasicAuth`
*  Network errors fire events instead of logging
*  `onload` fires 'ajaxLoadError' event if response.status is less than 200,
   greater than 300 (unless 304)
*  `onerror` fires 'ajaxNetworkError' event and includes the response status and
   responseText, in addition to the raw error
*  Add support for configurable network timeout
*  Add support for for an optional error callback


## Usage
Include Cache.js to your document

        Titanium.include('path/to/Cache.js');

To use CacheManager just call this function

        Cache.get();

*  **Cache.get();** # needs a parameters dictionary with the following values
*  **url:** The URL for the request
*  **callback:** The function to be called upon a successful response
*  **error (optional):** The function to be called upon an error. If not set,
   `ajaxLoadError` and `ajaxNetworkError` events are fired.
*  **data (optional):** The data to send in the request. Can either be null, dictionary or string
*  **method (optional):** The HTTP method. Defaults to GET
*  **ttl:** The time to live in seconds. Defaults to `60 seconds`.
*  **cookie:** Can be a boolean or a string containing the cookie value. Defaults to true
*  **auth:** Hash of `username` and `password`. Password will be properly encoded.
*  **timeout:** The time in seconds to wait before giving up. Defaults to 30 seconds.


## Example

        Cache.get({
          url: 'http://gdata.youtube.com/feeds/api/videos',
          data: { author: 'appcelerator', alt: 'json', orderby: 'published' },
          ttl: 300,
          timeout: 10,
          auth:
            username:  joeuser
            password:  awesomepassword
          callback: function ( result ) {
            // Some stuff..
          },
          error: function (error) {
            // Some other stuff...
          }
        });

