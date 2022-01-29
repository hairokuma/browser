'use babel';

import BrowserTab from './browser-tab';
import {
  CompositeDisposable
} from 'atom';

const configSchema = require("./config.json");
const fs = require('fs');

export default {

  activeTab: null,
  browserTabs: [],
  subscriptions: null,
  config: configSchema,
  history:null,
  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.addOpener(url => {
      if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('file://')) {
        this.activeTab = new BrowserTab(url);
        this.browserTabs.push(this.activeTab);
        return this.activeTab;
      }
    }))

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'browser:open': () => this.open(),
      'browser:openFile': () => this.open('file://' + atom.workspace.getActiveTextEditor().getPath(), {
        split: 'right'
      }),
      'browser:focusAddressBar': () => this.focusAddressBar()
    }));
    this.subscriptions.add(atom.commands.add('body', {
      'browser:debug': () => this.debug()
    }));
    this.listenForSave();
    this.paneObserver();
  },
  getHistory() {
    if (!this.history) {
      this.history = JSON.parse(fs.readFileSync(__dirname + '/history.json'));
    }
  },
  saveHistory() {
    let data = JSON.stringify(this.history);
    fs.writeFileSync(__dirname + '/history.json', data);
    // this.getHistory();
  },
  addHistoryEntry(entry) {
    let index = this.history.findIndex(object => object.url === entry.url);
    if (index === -1) {
      this.history.push(entry);
    }
    this.saveHistory();
  },
  removeHistoryEntry(entry) {
    let index = this.history.findIndex(object => object.url === entry.dataset.url);
    entry.remove();
    if (index != -1) {
      this.history.splice(index, 1);
    }
    this.saveHistory();
  },
  focusAddressBar() {
    this.activeTab.focusAddressBar();
  },
  open(url, options) {
    url = url ? url : atom.config.get('browser.defaultUrl')
    atom.workspace.open(url, options);
  },
  debug() {
    // this.activeTab.debug();
    // console.log(this.history);
  },
  listenForSave() {
    atom.workspace.observeTextEditors((editor) => {
      editor.onDidSave(() => {
        for (var i = 0; i < this.browserTabs.length; i++) {
          this.browserTabs[i] && this.browserTabs[i].handleDidSave();
        }
      })
    })
  },
  paneObserver() {
    const setActive = (item) => {
      if (item) {
        if (item.constructor.name != "TreeView") {
          if (item instanceof BrowserTab) {
            this.activeTab = item;
          }
        }
      }
    }
    atom.workspace.onDidChangeActivePaneItem(setActive);
  },
  deactivate() {
    console.log('deactivate');
    this.subscriptions.dispose();
    this.activeTab.destroy();
  },
  deserialize(serialized) {
    this.activeTab = new BrowserTab(serialized.url)
    this.browserTabs.push(this.activeTab);
    return this.activeTab;
  }
};
