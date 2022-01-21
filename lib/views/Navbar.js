module.exports = (zoomFactor, url) => {
  return `
  <atom-panel class="browser-navbar">

    <!-- back / reload / refresh-on-save -->
    <button class="btn-back"></button>
    <button class="btn-reload"></button>
    <button class="btn-live-reload"></button>

    <!-- addressbar -->
    <div class="addressbar">
      <input type="search" class="input-text browser-addressbar native-key-bindings" placeholder="Search, File, Url" value="${url}" />
      <div class="addressbar-history">
      </div>
    </div>


    <!-- search bar -->
    <button class="btn-search"></button>
    <div class="search-bar" style="display:none">
      <button class="btn-search-prev"></button>
      <button class="btn-search-next"></button>
      <input type="text" class="input-text input-search native-key-bindings " placeholder="Text">
      <span class="search-result">0/0</span>
    </div>

    <!-- zoom bar -->
    <button class="btn-zoom"></button>
    <div class="zoom-bar" style="display:none">
      <button class="btn-zoom-out"></button>
      <input type="text" class="input-text input-zoom" placeholder="Text" value="${Math.round(zoomFactor * 100)}" readonly>
      <button class="btn-zoom-in"></button>
    </div>

    <!-- open devtools -->
    <button class="btn-devtools"></button>
  </atom-panel>

   `.trim()
}
