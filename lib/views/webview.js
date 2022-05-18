
module.exports = (zoomFactor, url) => {
  return `
    <atom-panel class="browser-navbar">
      <!-- back / reload / refresh-on-save -->
      <button class="btn-back"></button>
      <button class="btn-reload"></button>
      <button class="btn-live-reload"></button>

      <!-- addressbar -->
      <div class="addressbar-container">
        <input type="search" class="input-text addressbar native-key-bindings" placeholder="Search, File, Url" value="${url}" />
        <div class="addressbar-history"></div>
      </div>


      <!-- search bar -->
      <div class="search-bar" style="display:none">
        <button class="btn-search-prev"></button>
        <button class="btn-search-next"></button>
        <input type="text" class="input-text input-search native-key-bindings " placeholder="Text">
        <span class="search-result">0/0</span>
      </div>
      <button class="btn-search"></button>

      <!-- zoom bar -->
      <div class="zoom-bar" style="display:none">
        <button class="btn-zoom-out"></button>
        <input type="text" class="input-text input-zoom" placeholder="Text" value="${Math.round(zoomFactor * 100)}" readonly>
        <button class="btn-zoom-in"></button>
      </div>
      <button class="btn-zoom"></button>

      <!-- open devtools -->
      <button class="btn-devtools"></button>
    </atom-panel>
    <div class="webview-container">
      <webview
      id="webview"
      preload="file:${__dirname}/emitter.js"
      class="native-key-bindings"
      useragent="Mozilla/5.0 (Windows NT 10.0; rv:74.0) Gecko/20100101 Firefox/74.0"
      src="${url}"
      ></webview>
    </div>

   `.trim()
}
// <div class="webview-container">
//  <webview id="devtools" src="about:blank"></webview>
// </div>
