LiveCss.js: refresh CSS without reloading the page
===================================================

LiveCss.js is a tiny standalone javascript library that refreshes CSS styles without reloading the entire page. It's distributed under the WTF licence.

The easiest way to use it is in the bookmarklet format. Create a new bookmark with this code instead of the URL:

```
javascript:(function(b){var a=function(){a.history=a.history||[];a.history.push(arguments);if(window.console){console.log(Array.prototype.slice.call(arguments))}};if(typeof liveCss==="undefined"){window.liveCss={defaultOptions:{interval:500,stylesheets:null,running:false,hintPosition:"top:0;right:0",lock:false},state:{},start:function(o){if(liveCss.lock){return false}liveCss.lock=true;var c={},d;for(d in liveCss.defaultOptions){c[d]=liveCss.defaultOptions[d]}for(d in o){c[d]=o[d]}liveCss.state=c;var m=[];if(c.stylesheets&&c.stylesheets.length){var n=[];for(var k=c.stylesheets.length-1;k>=0;k--){var e=c.stylesheets[k];if(typeof stylesheet!==typeof""){e=e.href}if(e){e=liveCss.cleanUrl(e);n.push(liveCss.extractId(liveCss.parseUrl(e).href))}}for(var j=0;j<document.styleSheets.length;j++){var h=document.styleSheets[j];if(!(h&&h.href)){continue}var f=liveCss.extractId(liveCss.cleanUrl(h.href));for(var l=0;l<n.length;l++){if(f===n[l]){m.push(h)}}}liveCss.state.stylesheets=m}else{liveCss.state.stylesheets=c.stylesheets||document.styleSheets}liveCss.state.running=true;liveCss.run(c.interval,m);function g(){if(document.body){var i=document.createElement("div");i.id="livecss-status";document.body.appendChild(i);document.getElementById("livecss-status").innerHTML="<div style=%27background-color:green;color:white;position:absolute;"+liveCss.state.hintPosition+"%27>LiveCss.js is active</div>"}else{setTimeout(g,500)}}g();liveCss.lock=false},run:function(c){setTimeout(function(){if(liveCss.state.running){liveCss.reloadAll(function(){liveCss.run(c)})}},c)},stop:function(){liveCss.state.running=false;document.body.removeChild(document.getElementById("livecss-status"))},toggle:function(c){if(liveCss.state.running){liveCss.stop()}else{c=liveCss.isEmtpyObject(c)?liveCss.state:c;liveCss.start(c)}},reload:function(d,e){var c=d.href;if(c){if(c.indexOf("###liveCss###")!==-1){c=c.split("###liveCss###")[1]}liveCss.xhr(c,function(h){var j=liveCss.extractId(c);var f=document.getElementById(j);if(f===null){f=document.createElement("style");f.type=d.type;if(d.ownerNode){f.media=d.ownerNode.media||"screen"}else{f.media="screen"}f.id=j;document.head.appendChild(f);d.ownerNode.href="###liveCss###"+c}if(f.styleSheet){try{if(f.styleSheet.cssTex!==h){f.styleSheet.cssText=h}}catch(i){throw"Couldn%27t reassign styleSheet.cssText."}}else{var g=document.createTextNode(h);if(f.childNodes.length>0){if(f.firstChild.nodeValue!==g.nodeValue){f.replaceChild(g,f.firstChild)}}else{f.appendChild(g)}}h=null;f=null},function(f,g){throw"Couldn%27t load "+g+" ("+f+")"})}e()},reloadAll:function(d,c){if(c===b){c=0}if(c!==liveCss.state.stylesheets.length){setTimeout(function(){liveCss.reload(liveCss.state.stylesheets[c],function(){liveCss.reloadAll(d,c+1)})},0)}else{d()}},extractId:function(c){return c.replace(/^#/,"").replace(/^[a-z]+:\/\/?[^\/]+/,"").replace(/^\//,"").replace(/\?.*$/,"").replace(/\.[^\.\/]+$/,"").replace(/[^\.\w-]+/g,"-").replace(/\./g,":")},xhr:function(d,j,c){var i;if(window.XMLHttpRequest){i=new XMLHttpRequest()}else{try{i=new ActiveXObject("MSXML2.XMLHTTP.3.0")}catch(h){throw"Browser doesn%27t support AJAX."}}var g=!(location.protocol==="file:"||location.protocol==="chrome:"||location.protocol==="chrome-extension:"||location.protocol==="resource:");function f(k,l,e){if(k.status===0||(k.status>=200&&k.status<300)){l(k.responseText)}else{if(typeof(e)==="function"){e(k.status,d)}}}if(typeof(i.overrideMimeType)==="function"){i.overrideMimeType("text/css")}i.open("GET",d,g);i.setRequestHeader("Accept","text/css; q=0.9, */*; q=0.5");i.send(null);if(g){i.onreadystatechange=function(){if(i.readyState==4){f(i,j,c)}}}else{f(i,j,c)}},parseUrl:(function(){var c=document.createElement("div");c.innerHTML="<a></a>";return function(d){c.firstChild.href=d;c.innerHTML=c.innerHTML;return c.firstChild}})(),isEmtpyObject:function(d){for(var c in d){if(d.hasOwnProperty(c)){return false}}return true},cleanUrl:function(c){if(c.indexOf("###liveCss###")!==-1){c=c.split("###liveCss###")[1]}return c}}}return liveCss})().toggle()
```

</p>

When you want to activate LiveCss.js, click on it. To deactivate LiveCss.js, click again.

You have nothing more to do. Edit your CSS as usual, and on save, your page will be updated.

WARNING:

Because of the security policy in some browsers, liveCss may not work
with the "file://" protocol (localfile). For these browsers, a good
workaround is to run a small web server at the root directory of your project.

Python (installed in most GNU/Linux and Mac OS systems), let you do that in one command:

  python -m "SimpleHTTPServer"

You can then access your pages at the address http://127.0.0.1:8000

Manual usage
============

If you want to have a bit more control on how LiveCss.js performs, includes the library itself (only during dev, remove it for production!) in the page:

    <script src="./path/to/livecss.min.js"></script>

Then below:

    <script>
      liveCss.start();
    </script>

There are several options you can fiddle with:

    liveCss.start(); // will reload all css files every half second
    liveCss.stop(); // stop reloading css files
    liveCss.toggle(); // start or stop reloading css files
    // it preserves the current state if you don't pass parameters will
    // start/stop/start doesn't

    liveCss.start({interval: 1000}); // start reloading css files every second

    // start reloading css files with the address
    // "./static/css/style.css" or "./static/css/ie.css"
    liveCss.start({stylesheets: ["./static/css/style.css", "./static/css/ie.css"]});

    // set the position for the little greenbox telling you when LiveCss.js
    // is running to the bottom right.
    // (It should be a valid CSS absolute position string)
    liveCss.start({hintPosition: 'right:0;bottom:0'});

You may want to adjust these to get a faster refresh. You can of course use several options at the same time.

Please note that using debuggers such as Firebug and LiveCss.js at the same time may be slow since they inspect the stack while LiveCss.js uses an infinite recursive loop. It's usable, but not as speedy as the usual experience.

How does it work?
=================

The library creates an infinite loop with a timer between each turn, where it loads each CSS file with an AJAX request. At every request, the css is dumped in an inline style tag and the related style node is disabled.

LiveCss.js is inspired from css_autoreload, less.js watch mode and Xrefresh, but in comparison it's pretty young, so expects bugs. Also it has been tested only with Firefox for now.

