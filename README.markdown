__CacheManager__ is a script for Appcelerator Titanium Mobile. It is an extension
to __Titanium.Network.HTTPClient__ that allows you to cache remote resources.
Another advantage is retrieving the cached resource when the network connection
is unavailable.

This is a fork of @dhayab's [original](https://github.com/dhayab/CacheManager).


## Changes from the original

*  Repo no longer includes a sample app


## Usage
Include Cache.js to your document

        Titanium.include('path/to/Cache.js');

To use CacheManager just call this function

        Cache.get();

*  **Cache.get();** # needs a parameters dictionary with the following values
*  **url:** The URL for the request
*  **callback:** The function to be called upon a successful response
*  **data (optional):** The data to send in the request. Can either be null, dictionary or string
*  **method (optional):** The HTTP method. Defaults to GET
*  **ttl:** The time to live in seconds. Defaults to `60 seconds`.
*  **cookie:** Can be a boolean or a string containing the cookie value. Defaults to true


## Example

        Cache.get({
          url: 'http://gdata.youtube.com/feeds/api/videos',
          data: { author: 'appcelerator', alt: 'json', orderby: 'published' },
          ttl: 300,
          callback: function ( result ) {
            // Some stuff..
          }
        });

