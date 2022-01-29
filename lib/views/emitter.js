// passed into webview preload
var scrollStyle;
document.addEventListener("DOMContentLoaded", function(event) {
  var head = document.querySelector("head")

  scrollStyle = document.createElement('style')
  scrollStyle.media  = 'screen';
  scrollStyle.innerHTML  = '::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent;}::-webkit-scrollbar-thumb{background:#383f4c;border-radius:5px;}';
  head.appendChild(scrollStyle);
  if (window.location.href.startsWith('file:/') && window.location.href.endsWith('.md')) {
    var favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = 'atom://browser/styles/icons/markdown.svg';
    head.appendChild(favicon);

    var markdownStyle  = document.createElement('link');
    markdownStyle.rel  = 'stylesheet';
    markdownStyle.href = 'atom://browser/lib/views/markdown.css';
    head.appendChild(markdownStyle);

    const showdown = require("./markdown.js")
    showdown.setFlavor('github');
    var converter = new showdown.Converter({
      openLinksInNewWindow: true
    });
    var text = document.querySelector("pre").innerHTML;
    text = text.replace(new RegExp('&lt;', 'g'), '<').replace(new RegExp('&gt;', 'g'), '>');
    html = converter.makeHtml(text);
    document.querySelector("body").innerHTML = html;
  }
});;
(() => {
  const {
    ipcRenderer
  } = require('electron')

  window.atomBrowserConnectEmitter = {
    interval: undefined,
    info: {},
    selectEvent: undefined,
    lastSelection: undefined,

    setup: function(currentIframeInfo) {
      if (currentIframeInfo.style) {
        scrollStyle.innerHTML += currentIframeInfo.style;
      }
      this.info = currentIframeInfo
      this.connect()
      this.load()
    },

    connect: function() {
      // console.log('[ATOM BROWSER] connect')
      // clearInterval(this.interval)
      // this.interval = setInterval(() => this.send(), 10000)
      this.selectEvent = document.addEventListener('selectionchange', () => {
        selection = window.getSelection().toString()
        if (selection != this.lastSelection) {
          this.lastSelection = selection;
          this.sendSelection(selection);
        }
      });
    },
    load: function() {
      if (document.readyState === "complete") this.onload()
      else window.addEventListener('load', () => this.onload())
    },

    onload: function() {
      this.sendPageData();
    },

    sendSelection: function(selection) {
      ipcRenderer.sendToHost(JSON.stringify({
        selected: selection
      }))
    },
    sendPageData: function() {
      ipcRenderer.sendToHost(JSON.stringify({
        favicon: this.getFaviconLink(),
        hostname: window.location.hostname.replace('www.', ''),
        title: document.title,
        url: window.location.href
      }))
    },


    getFaviconLink: function() {
      var favicon = document.querySelector("link[rel~='icon']");
      var faviconHref = null;
      if (favicon) {
        faviconHref = favicon.href
        if (faviconHref && !faviconHref.includes("://")) {
          faviconHref = window.location.hostname + faviconHref;
        }
      }
      if (!favicon && window.location.hostname.includes('google')) {
        faviconHref = "atom://browser/styles/icons/google.png"
      }
      return faviconHref;
    },
    disconnect: function() {
      // console.log('[ATOM BROWSER] disabling emitter')
      // clearInterval(this.interval)
      // document.removeEventListener(this.selectEvent)
    }
  }
})();
