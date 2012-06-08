/*global liveCss:true, alert:true, console:true*/

/**
  Automatically reload newly changed css files without reloading the page.

  Usage:

    liveCss.start(); // will reload all css files every seconds
    liveCss.stop(); // stop reloading css files
    liveCss.toggle();  // start or stop reloading css files

    liveCss.start(500); // start reloading css files every half seconds

    // start reloading css files with the address
    // "./static/css/style.css" or "./static/css/ie.css" every 2 seconds
    liveCss.start(2000, ["./static/css/style.css", "./static/css/ie.css"]);

  Because of the security policy in some browsers, liveCss may not work
  with the "file://" protocol (localfile). For these browsers, a good
  workaround is to run a small web server at the root directory of your project.

  Python (native in most Linux and Mac OS), let you do that in one command:

  python -m "SimpleHTTPServer"

  You can then access you files at the address: http:127.0.0.1:8000

*/

;(function(undefined){
"use strict";

  var log = function(){
    log.history = log.history || [];
    log.history.push(arguments);
    if(window.console){
      console.log( Array.prototype.slice.call(arguments) );
    }
  };

  if (typeof liveCss === "undefined") {

    window.liveCss = {

      defaultOptions: {
        interval: 500, // the time between 2 refreshes
        stylesheets: null, // the list of steelsheet nodes to process
        running: false, // state of the main loop
        hintPosition: 'top:0;right:0',
        lock: false
      },

      state: {},

      /**
        Start the main loop.

        Interval should be the time in miliseconds that each turn of the main
        loop will wait for before running the next turn.

        Stylesheets should be an array of css file path as you entered
        them in the HTML style tags. Only the css matching theses addresses will
        be reloaded. If none is specified, all the css files are reloaded.
      */
      start: function(options) {

        // prevent "start" to be called several times simultaneously
        if (liveCss.lock){
          return false;
        }

        liveCss.lock = true;

        // configure LiveCss.js
        var state = {},
            name;
        for (name in liveCss.defaultOptions){
          state[name] = liveCss.defaultOptions[name];
        }
        for (name in options){
          state[name] = options[name];
        }
        liveCss.state = state;

        // if we got a stylesheets list as a parameter:
        // go throught the list of all the css nodes in the page
        // and generate an ID for them. If this ID match one of the list
        // elements ID, we add the node to a new list.
        // The resulting list is the new stylesheet list are we going to
        // to monitor for reloading
        var styleDomElem = [];
        if (state.stylesheets && state.stylesheets.length) {

          // we may receive a mix of stylesheet nodes, urls and disabled url,
          // so we create list of IDs out of it
          var stylesheetsId = [];
          for (var z = state.stylesheets.length - 1; z >= 0; z--) {
            var url = state.stylesheets[z];
            if (typeof stylesheet !== typeof ''){url = url.href;}
            if (url){
              url = liveCss.cleanUrl(url);
              stylesheetsId.push(liveCss.extractId(liveCss.parseUrl(url).href));
            }
          }

          // comparing the page css nodes with
          for (var i = 0; i < document.styleSheets.length; i++) {

            var styleNode = document.styleSheets[i];

            // skip removed nodes (async edge case) and inline nodes
            if (!(styleNode && styleNode.href)){
              continue;
            }

            // some node may have been disabled
            var nodeId = liveCss.extractId(liveCss.cleanUrl(styleNode.href));

            for (var y = 0; y < stylesheetsId.length; y++) {
              if (nodeId === stylesheetsId[y]){
                styleDomElem.push(styleNode);
              }
            }

          }

          liveCss.state.stylesheets = styleDomElem;

        } else {
          liveCss.state.stylesheets = state.stylesheets || document.styleSheets;
        }

        // start the main loop
        liveCss.state.running = true;
        liveCss.run(state.interval, styleDomElem);

        // give a hint that liveCss.js is running
        // (wait for the body to be ready before doing so)
        function hint(){
          if (document.body){
            var elem = document.createElement('div');
            elem.id = 'livecss-status';
            document.body.appendChild(elem);
            document.getElementById('livecss-status').innerHTML = "<div style='background-color:green;color:white;position:absolute;" + liveCss.state.hintPosition + "'>LiveCss.js is active</div>";
          } else {
            setTimeout(hint, 500);
          }
        }
        hint();

        liveCss.lock = false;
      },

      /**
        Main loop calling "liveCss.reloadAll" every "liveCss.interval" seconds.
      */
      run: function(interval) {
        setTimeout(function(){
          if (liveCss.state.running){
            liveCss.reloadAll(function(){
              liveCss.run(interval);
            });
          }
        }, interval);
      },

      /**
        Stop the main loop.
      */
      stop: function(){
        liveCss.state.running = false;
        document.body.removeChild(document.getElementById('livecss-status'));
      },

      /**
        Start or stop the main loop. Unlike calling start / stop, it actually
        passes the previous state from the last stop to the next start.
      */
      toggle: function(options){
        if (liveCss.state.running){
          liveCss.stop();
        }
        else {
          options = liveCss.isEmtpyObject(options) ? liveCss.state : options;
          liveCss.start(options);
        }
      },

      /**
        Reload one stylesheet.

        stylesheet should be a style node, and callback the function to call
        once the stylesheet is loaded.

        The loading dump the css file content in a new inline style tag
        and disable the related stylesheet node.
      */
      reload: function(stylesheet, callback){

        var href = stylesheet.href;

        if (href) {

          // if the sheelsheet node is already disabled, extract the URL
          if (href.indexOf("###liveCss###") !== -1){
            href = href.split("###liveCss###")[1];
          }

          // ajax request to get the css file content
          liveCss.xhr(href, function(data) {

            var id = liveCss.extractId(href);
            var css = document.getElementById(id);

            // create a new inline style tag and disable the old one
            if (css === null) {
              css = document.createElement("style");
              css.type = stylesheet.type;
              if (stylesheet.ownerNode) {
                css.media = stylesheet.ownerNode.media || "screen";
              } else {
                css.media = "screen";
              }
              css.id = id;
              document.head.appendChild(css);

              stylesheet.ownerNode.href = "###liveCss###" + href;
            }

            // dump the css content into the inline css tag
            if (css.styleSheet) { // IE
              try {
                if (css.styleSheet.cssTex !== data) {
                  css.styleSheet.cssText = data;
                }
              }
              catch (e) {throw "Couldn't reassign styleSheet.cssText.";}
            } else {
              var node = document.createTextNode(data);
              if (css.childNodes.length > 0) {
                if (css.firstChild.nodeValue !== node.nodeValue) {
                  css.replaceChild(node, css.firstChild);
                }
              } else {
                css.appendChild(node);
              }
            }

            data = null;
            css = null;

          }, function (status, url) {
              throw "Couldn't load " + url + " (" + status + ")";
          });
        }

        callback();
      },

      /**
        Reload all the css files one by one and run the callback when all are
        processed. Each file loading is done in a continuation to avoid blocking
        the UI.
      */
      reloadAll: function(callback, index){

        if (index === undefined) {
          index = 0;
        }

        if (index !== liveCss.state.stylesheets.length){
          setTimeout(function(){
            liveCss.reload(liveCss.state.stylesheets[index], function(){
              liveCss.reloadAll(callback, index + 1);
            });
          }, 0);
        } else {
          callback();
        }
      },

      /**
        Utility function to create a unique ID from a URL. Used to create
        and id for the inline style tag from the related style node.
      */
      extractId: function(href) {
        return href.replace(/^#/, "")                    // remove # prefix
                   .replace(/^[a-z]+:\/\/?[^\/]+/, "" )  // Remove protocol & domain
                   .replace(/^\//,                 "" )  // Remove root /
                   .replace(/\?.*$/,               "" )  // Remove query
                   .replace(/\.[^\.\/]+$/,         "" )  // Remove file extension
                   .replace(/[^\.\w-]+/g,          "-")  // Replace illegal characters
                   .replace(/\./g,                 ":"); // Replace dots with colons(for valid id)
      },

      /**
        Utility function to perform an Ajax request.
      */
      xhr: function(url, callback, errback) {
        var xhr;
        if (window.XMLHttpRequest) {
          xhr = new XMLHttpRequest();
        } else {
          try {xhr = new ActiveXObject("MSXML2.XMLHTTP.3.0");}
          catch (e) {throw "Browser doesn't support AJAX.";}
        }

        var async = !(location.protocol === "file:" ||
                      location.protocol === "chrome:" ||
                      location.protocol === "chrome-extension:" ||
                      location.protocol === "resource:");

        function handleResponse(xhr, callback, errback) {
          if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
            callback(xhr.responseText);
          } else if (typeof(errback) === "function") {
            errback(xhr.status, url);
          }
        }

        if (typeof(xhr.overrideMimeType) === "function") {
            xhr.overrideMimeType("text/css");
        }
        xhr.open("GET", url, async);
        xhr.setRequestHeader("Accept", "text/css; q=0.9, */*; q=0.5");
        xhr.send(null);

        if (async) {
          xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
              handleResponse(xhr, callback, errback);
            }
          };
        } else {
          handleResponse(xhr, callback, errback);
        }
      },

      /** Return an link object with the URL as href so you can extract host,
          protocol, hash, etc.

          This function use a closure to store a <div> parent for the <a>
          because IE requires the link be processed by it"s HTML parser
          for the URL to be parsed. */
      parseUrl: (function(){

        var div = document.createElement("div");
        div.innerHTML = "<a></a>";

        return function(url){
          div.firstChild.href = url;
          div.innerHTML = div.innerHTML;
          return div.firstChild;
        };

      })(),

      /** Return true if an object has not any own property */
      isEmtpyObject: function(o) {
          for(var i in o){
            if(o.hasOwnProperty(i)){
              return false;
            }
          }
          return true;
      },

      /**
        Remove the ###liveCss### string from disabled URL
      */
      cleanUrl: function(url){
        if (url.indexOf('###liveCss###') !== -1){
          url = url.split('###liveCss###')[1];
        }
        return url;
      }

    };
  }

  return liveCss;

})();