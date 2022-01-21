'use babel';
import {
  CompositeDisposable,
  Disposable
} from 'atom'
const {
  remote
} = require('electron')

const ViewNavbar = require('./views/Navbar')
const ViewWebview = require('./views/Webview')
const fs = require('fs');

export default class BrowserView {

  constructor(url) {
    this.subscriptions = new CompositeDisposable();
    this.reloading = false;
    this.url = url;
    this.id = 'id-' + this.uuidv4();
    this.zoomFactor = 1;
    this.title = this.url;
    this.iframeInfo = {};
    this.webviewInit = false;
    this.webContents = null;
    this.tab = null;
    this.selected = null;
    this.history = null;
    this.getHistory();

    this.element = document.createElement('div');
    this.element.setAttribute('class', 'browser-view');
    this.element.innerHTML += ViewNavbar(this.zoomFactor, this.url);
    this.element.innerHTML += ViewWebview(this.url);

    this.html = this.selectHtml();
    this.setListeners();
    this.focusAddressBar();
  }
  debug() {
    console.log("### [BROWSER] - DEBUG ###");
  }
  uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  selectHtml() {
    return {
      webview: this.element.querySelector('#atombrowser-webview'),
      webviewError: this.element.querySelector('#atombrowser-webview-failed-load'),
      webviewErrorMessage: this.element.querySelector('#atombrowser-webview-failed-load .message'),
      webviewErrorIcon: this.element.querySelector('#atombrowser-webview-failed-load i'),
      //Navbar
      address: this.element.querySelector('.addressbar'),
      addressbar: this.element.querySelector('.browser-addressbar'),
      addressbarHistory: this.element.querySelector('.addressbar-history'),
      zoom: {
        bar: this.element.querySelector('.zoom-bar'),
        toggle: this.element.querySelector('.btn-zoom'),
        out: this.element.querySelector('.btn-zoom-out'),
        in: this.element.querySelector('.btn-zoom-in'),
        input: this.element.querySelector('.input-zoom'),
      },
      btn: {
        back: this.element.querySelector('.btn-back'),
        reload: this.element.querySelector('.btn-reload'),
        livereload: this.element.querySelector('.btn-live-reload'),
        devtools: this.element.querySelector('.btn-devtools')
      },
      search: {
        toggle: this.element.querySelector('.btn-search'),
        bar: this.element.querySelector('.search-bar'),
        input: this.element.querySelector('.input-search'),
        prev: this.element.querySelector('.btn-search-prev'),
        next: this.element.querySelector('.btn-search-next'),
        result: this.element.querySelector('.search-result'),
      }
    }
  }
  setListeners() {
    this.html.webview.addEventListener('did-start-loading', () => {
      this.html.webviewError.style.display = 'none';
      this.html.btn.reload.classList.add('loading');
      if (!this.webviewInit) {
        this.focusAddressBar();
      }
      this.ipcConnect();
      this.html.btn.back.disabled = !this.html.webview.canGoBack();
    })

    this.html.webview.addEventListener('ipc-message', (event) => {
      this.iframeInfo = JSON.parse(event.channel);
      // console.log(this.iframeInfo);
      if (this.iframeInfo.favicon !== undefined) {
        this.setFavicon(this.iframeInfo.favicon);
        this.addHistoryEntry();
      }
      if (this.iframeInfo.selected) {
        this.selected = this.iframeInfo.selected;
      }
    })

    this.html.webview.addEventListener('did-stop-loading', () => {
      this.html.btn.reload.classList.remove('loading');
      this.setTitle(this.html.webview.getTitle());
      this.url = this.html.webview.getURL();
      if (document.activeElement != this.html.addressbar) {
        this.html.addressbar.value = this.url;
      }
      if (!this.webviewInit) {
        this.focusAddressBar();
        this.webviewInit = true;
      }
      if (this.webContents != this.getWebContents()) {
        this.webContents = this.getWebContents();
        this.webviewHandler();
      }
      this.zoomUpdate();
    })

    this.html.webview.addEventListener('did-fail-load', (error) => {
      const ERROR_CODE_ABORTED = -3;
      if (error.errorCode === ERROR_CODE_ABORTED) return;
      this.html.webviewErrorMessage.innerHTML = error.errorDescription;
      this.html.webviewErrorMessage.style.textAlign = 'center';
      this.html.webviewErrorIcon.setAttribute('class', 'icon icon-alert');
      this.html.webviewError.style.display = 'block';
    })

    this.html.webview.addEventListener('new-window', async (e) => {
      atom.workspace.open(e.url);
    })

    this.html.webview.addEventListener('context-menu', async (e) => {
      console.log(e);
    })

    // ADDRESSBAR
    this.html.addressbar.addEventListener('keyup', (e) => {
      if (e.key == 'Enter') {
        this.setURL(this.html.addressbar.value)
      }
      if (e.key == 'Enter' || e.key == 'Tab') {
        this.html.webview.focus();
      }
    })
    this.html.addressbar.addEventListener('keydown', (e) => {
      if (e.key == "ArrowDown") {
        this.currentFocus++;
        this.setActiveHistoryEntry();
      }
      if (e.key == "ArrowUp") {
        this.currentFocus--;
        this.setActiveHistoryEntry();
      }
      if (e.key == "Backspace") {
        if (this.html.addressbar.value.includes(window.getSelection().toString())) {
          this.html.addressbar.value = this.html.addressbar.value.replace(window.getSelection().toString(), '')
        }
      }
    })
    this.html.addressbar.addEventListener('input', (e) => {
      this.html.addressbarHistory.innerHTML = ''
      var val = this.html.addressbar.value;
      if (!val) {
        return false;
      }
      this.currentFocus = -1;
      var count = 0;
      var first = true;
      for (var i = 0; i < this.history.length; i++) {
        var found = this.history[i].title.toUpperCase().indexOf(val.toUpperCase());
        if (found != -1 || this.history[i].title.toUpperCase().includes(val.toUpperCase())) {
          var titleEq = this.history[i].title.substring(found, found + val.length);
          this.html.addressbarHistory.innerHTML += `
              <div class="history-entry" data-url="${this.history[i].url}">
              <img src="${this.history[i].favicon?this.history[i].favicon:"atom://browser/styles/icons/globe.svg"}" alt="">
              <span class="title">${this.history[i].title.replace(titleEq,'<strong>'+titleEq+'</strong>')}</span>
              <span class="url">${this.history[i].url.replace(val,'<strong>'+val+'</strong>')}</span>
              <span class="times"></span>
              </div>
          `;
          if (this.history[i].hostname.substr(0, val.length).toUpperCase() == val.toUpperCase() && first) {
            first = false;
            this.html.addressbar.value = this.history[i].hostname;
            this.html.addressbar.selectionStart = val.length;
            this.html.addressbar.selectionEnd = this.history[i].hostname.length;
            this.html.addressbar.focus();
            document.querySelector('[data-url="' + this.history[i].url + '"]').classList.add('active');
          }
          if (count > 4) break;
          count++;
        }
      }
    })

    this.html.addressbar.addEventListener('focus', (e) => {
      this.html.addressbar.select();
    })
    this.html.webview.addEventListener("focus", (e) => {
      this.html.addressbarHistory.innerHTML = ''
    });

    this.html.addressbarHistory.addEventListener('click', (e) => {
      if (e.target.className == "times") {
        this.removeHistoryEntry(e.target.parentNode);
      }
      if (e.target.dataset.url) {
        this.setURL(e.target.dataset.url)
        this.html.addressbarHistory.innerHTML = ''
      }
    });

    this.html.btn.reload.addEventListener('click', () => this.reload())
    this.html.btn.back.addEventListener('click', () => this.back())
    this.html.btn.devtools.addEventListener('click', () => this.devtools())
    this.html.btn.livereload.addEventListener('click', () => {
      this.html.btn.livereload.classList.toggle('active', this.liveReload)
    })

    // zoombar
    this.html.zoom.toggle.addEventListener('click', () => this.toggleZoomBar());
    this.html.zoom.out.addEventListener('click', () => this.zoomOut());
    this.html.zoom.in.addEventListener('click', () => this.zoomIn());

    // search
    this.html.webview.addEventListener('found-in-page', (e) => {
      this.html.search.result.innerHTML = e.result.activeMatchOrdinal + '/' + e.result.matches
    })
    this.html.search.toggle.addEventListener('click', () => this.toggleSearchBar(true));
    this.html.search.prev.addEventListener('click', () => this.findInPage(false));
    this.html.search.next.addEventListener('click', () => this.findInPage());
    this.html.search.input.addEventListener('keyup', (e) => {
      if (e.key == 'Tab') {
        this.html.webview.focus();
      } else {
        this.findInPage();
      }
    })
  }

  // addressbar
  focusAddressBar() {
    this.html.addressbar.focus();
  }
  setURL(url) {
    if (url.length === 0) return

    if (!url.includes('://') && !url.startsWith('localhost')) // search google
      if (url.indexOf(' ') >= 0 || !url.includes(' ') && !url.includes('.'))
        url = 'https://www.google.com/search?q=' + url

    if (!url.includes('://')) // add http://
      if (!url.includes('https://') && !url.includes('file://'))
        url = "http://" + url

    this.url = url
    this.html.webview.src = url
    if (document.activeElement != this.html.addressbar) {
      this.html.addressbar.value = url
    }
  }
  reload() {
    if (this.isInDom() && this.getWebContents()) {
      this.ipcDisconnect()
      this.html.webview.reloadIgnoringCache()
    }
  }
  back() {
    if (this.getWebContents() && this.html.webview.canGoBack())
      this.html.webview.goBack()
  }
  handleDidSave() {
    if (this.isInDom() && this.html.btn.livereload.classList.contains('active')) {
      if (this.reloading) return
      this.reloading = true
      setTimeout(() => {
        this.reload()
        this.reloading = false
      }, 250)
      this.reloading = false
    }
  }
  setActiveHistoryEntry() {
    var active = this.html.addressbarHistory.querySelector('.active')
    var list = this.html.addressbarHistory.getElementsByClassName("history-entry");
    if (active) {
      active.classList.remove("active");
    }
    if (this.currentFocus >= list.length) this.currentFocus = 0;
    if (this.currentFocus < 0) this.currentFocus = list.length - 1;
    list[this.currentFocus].classList.add('active');
    this.html.addressbar.value = list[this.currentFocus].dataset.url;
  }

  getHistory() {
    this.history = JSON.parse(fs.readFileSync(__dirname + '/history.json'));
  }
  addHistoryEntry(entry) {
    entry = entry ? entry : {
      title: this.title,
      url: this.url,
      favicon: this.iframeInfo.favicon,
      hostname: this.iframeInfo.hostname,
    };
    let index = this.history.findIndex(object => object.url === entry.url);
    if (index === -1) {
      this.history.push(entry);
    }
    this.saveHistory();
  }
  removeHistoryEntry(entry) {
    let index = this.history.findIndex(object => object.url === entry.url);
    if (index != -1) {
      this.history.splice(index, 1);
    }
    this.saveHistory();
  }
  saveHistory() {
    let data = JSON.stringify(this.history);
    fs.writeFileSync(__dirname + '/history.json', data);
    this.getHistory();
  }

  // emitter
  ipcConnect() {
    this.html.webview.executeJavaScript(`
           window.atomBrowserConnectEmitter.setup(
              ${JSON.stringify(this.iframeInfo)}
           )`);
  }
  ipcDisconnect() {
    this.html.webview.executeJavaScript(`
           window.atomBrowserConnectEmitter.disconnect(
              ${JSON.stringify(this.iframeInfo)}
           )`);
  }

  // webview
  webviewHandler() {
    this.getWebContents().on('before-input-event', (event, input) => {
      // console.log(input);
      // console.log(input.key);
      if (input.type !== 'keyDown') {
        return;
      }
      if (input.control && input.key == 't') {
        atom.workspace.open(atom.config.get('browser.defaultUrl'));
      }
      if (input.control && input.key == 'l') {
        this.focusAddressBar();
      }
      if (input.control && input.key == 'f') {
        this.toggleSearchBar(false);
      }
      if (input.alt && input.key == "ArrowLeft") {
        this.back()
      }
      if ((input.control && input.key == 'r') || input.key == "F5") {
        this.reload()
      }
      if ((input.control && input.alt && input.key == 'i') || input.key == "F12") {
        this.devtools()
      }
      if (!input.shift && input.control && input.key == 'Tab') {
        atom.workspace.getActivePane().activateNextItem()
      }
      if (input.shift && input.control && input.key == 'Tab') {
        atom.workspace.getActivePane().activatePreviousItem()
      }
      if (input.control && parseInt(input.key) > 0) {
        atom.workspace.getActivePane().activateItemAtIndex(parseInt(input.key) - 1);
      }
    });
  }
  getWebContents() {
    return this.html.webview && remote.webContents.fromId(this.html.webview.getWebContentsId())
  }
  isInDom() {
    return document.body.contains(this.element)
  }

  // devtools
  devtools() {
    if (!this.getWebContents()) return
    this.html.webview.isDevToolsOpened() ?
      this.devtoolsHide() :
      this.devtoolsShow()
  }
  devtoolsShow() {
    this.html.webview.openDevTools()
  }
  devtoolsHide() {
    this.html.webview.closeDevTools()
  }

  // search
  findInPage(forward = true) {
    if (this.html.search.input.value) {
      this.html.webview.findInPage(this.html.search.input.value, {
        forward: forward
      })
    }
  }
  toggleSearchBar(toggle) {
    this.html.webview.stopFindInPage('keepSelection')
    if (toggle) {
      this.html.search.bar.style.display = this.html.search.bar.style.display === 'none' ? '' : 'none';
    } else {
      this.html.search.bar.style.display = '';
    }
    this.html.search.input.focus();
    if (this.html.search.bar.style.display != 'none' && this.selected) {
      this.html.search.input.value = this.selected;
      this.findInPage(this.selected);
    }
  }

  // zoom
  toggleZoomBar() {
    this.html.zoom.bar.style.display = this.html.zoom.bar.style.display === 'none' ? '' : 'none';
  }
  zoomOut() {
    this.zoomFactor -= 0.1
    this.zoomUpdate()
  }
  zoomIn() {
    this.zoomFactor += 0.1
    this.zoomUpdate()
  }
  zoomUpdate() {
    this.zoomFactor = Math.round(this.zoomFactor * 100) / 100
    this.html.zoom.input.value = Math.round(this.zoomFactor * 100)
    if (this.getWebContents()) {
      this.html.webview.setZoomFactor(this.zoomFactor)
    }
  }
  // Atom-panel
  setTitle(title) {
    this.tab = document.querySelector('.icon-' + this.id);
    this.title = title
    document.title = title;
    if (this.tab) {
      this.tab.innerHTML = title;
    }
  }
  setFavicon(src) {
    src = src ? src : "atom://browser/styles/icons/globe.svg"
    if (this.tab.style.backgroundImage != 'url("' + src + '")') {
      this.tab.style.backgroundImage = "url(" + src + ")";
    }
  }
  // panel
  getTitle() {
    return this.title;
  }
  getIconName() {
    return this.id;
  }
  getDefaultLocation() {
    return atom.config.get('browser.defaultLocation');
  }
  getAllowedLocations() {
    return ['left', 'right', 'bottom', 'center'];
  }
  getURI() {
    return this.url;
  }
  serialize() {
    return {
      url: this.url,
      deserializer: this.constructor.name
    }
  }
  destroy() {
    this.element.remove();
  }
  getElement() {
    return this.element;
  }
}
