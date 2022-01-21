// useragent="Mozilla/5.0 (Windows NT 10.0; rv:74.0) Gecko/20100101 Firefox/74.0"

module.exports = ( url ) => {
   return  `
      <div class="atombrowser-webview-container">
         <webview
          id="atombrowser-webview"
          preload="file:${__dirname}/../browser-emitter.js"
          class="native-key-bindings"
          src="${url}"
         ></webview>
         <div id="atombrowser-webview-failed-load">
            <i class="icon icon-octoface"></i>
            <h4 class="message">Atom Browser</h4>
         </div>
      </div>
   `.trim()
}
