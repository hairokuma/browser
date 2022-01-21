// passed into webview preload
document.addEventListener("DOMContentLoaded", function(event) {
  var scrollStyle = document.createElement('style')
  scrollStyle.innerHTML = `
    ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    ::-webkit-scrollbar-track,
    ::-webkit-scrollbar-corner {
      background: #0f1115;
    }
    ::-webkit-scrollbar-thumb {
      background: #383f4c;
      border-radius: 5px;
      box-shadow: 0 0 1px black inset;
    }
    `;
  document.querySelector("head").appendChild(scrollStyle);
});
;
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
      console.log('[ATOM BROWSER] setup emitter')
      this.info = currentIframeInfo
      this.connect()
      this.load()
    },

    connect: function() {
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
      document.removeEventListener(this.selectEvent)
    }
  }
})();
