'use babel';

import BrowserView from './browser-view';
import {
  CompositeDisposable
} from 'atom';

const configSchema = require("./config.json");

export default {

  browserView: null,
  subscriptions: null,
  config: configSchema,
  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.workspace.addOpener(url => {
      if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('file://')) {
        return this.browserView = new BrowserView(url);
      }
    }))

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'browser:open': () => this.open(),
      'browser:openFile': () => this.open('file://'+atom.workspace.getActiveTextEditor().getPath()),
      'browser:focusAddressBar': () => this.focusAddressBar()
    }));
    this.subscriptions.add(atom.commands.add('body', {
      'browser:debug': () => this.debug()
    }));
    this.listenForSave();
    this.paneObserver();
  },
  focusAddressBar() {
    this.browserView.focusAddressBar();
  },
  open(url) {
    url = url ? url : atom.config.get('browser.defaultUrl')
    atom.workspace.open(url);
  },
  debug() {
    this.browserView.debug();
  },
  listenForSave() {
    atom.workspace.observeTextEditors((editor) => {
      editor.onDidSave(() => {
        this.browserView && this.browserView.handleDidSave()
      })
    })
  },
  paneObserver() {
    const setActive = (item) => {
      if (item) {
        if (item.constructor.name != "TreeView") {
          activePane = atom.workspace.getActivePane();
          if (activePane) {
            for (const item of activePane.getItems()) {
              if (item instanceof BrowserView) {
                this.browserView = item;
              }
            }
          }
          if (item instanceof BrowserView) {
            this.browserView = item;
          }
        }
      }
    }
    atom.workspace.observePaneItems(setActive);
    atom.workspace.onDidChangeActivePaneItem(setActive)
  },
  deactivate() {
    this.subscriptions.dispose();
    this.browserView.destroy();
  },
  deserialize(serialized) {
    this.browserView = new BrowserView(serialized.url)
    return this.browserView;
  }
};
