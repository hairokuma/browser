# [Browser](https://github.com/hairokuma/browser)

Open Browser-Tabs in [Atom-Editor](https://atom.io/) Powerd by Electron's [`<webview>`](https://www.electronjs.org/de/docs/latest/api/webview-tag).
Markdown Preview support by [Showdown](https://github.com/showdownjs/showdown) with Dark Github README Style

## Search Engines
Choose Your favourite Search Engine
- DuckDuckGo
- Google
- Ecosia
- Brave

## Live Update
Activate the <img alt="Eye" width="20px" src="https://user-images.githubusercontent.com/73652611/151678421-c64d315a-dc44-4ffc-be9c-cee90c635065.svg" /> to Enable **Live Update**. This reloads the page on every Text-Editor-Save

|Browse the Internet|Search Web-Contents|
|--|--|
|![Browser](https://user-images.githubusercontent.com/73652611/151677278-6a7919da-32a6-43e5-bd8e-971b577b1120.png)|![search](https://user-images.githubusercontent.com/73652611/151677522-41adbf74-f97a-4c78-882a-b1136328c4b8.png)|

|Autocomplete & History URL|
|--|
|![History](https://user-images.githubusercontent.com/73652611/151677791-2af4e4a3-e795-4a4b-b0bd-2c955416bace.png)|

## Atom-Keybindngs
|Keystroke|Command|
|--|--|
|ctrl-t|Open new Browser-Tab(Default-Url)|
|ctrl-shift+H|Open Text-Editor File in new Browser-Tab(URL: "file:///full/path/to/file.ext", Split: right)|
|ctrl-l|set Focus to Addressbar|
## Browser-Keybindngs
|Keystroke|Command|
|--|--|
|ctrl-t|Open new Browser-Tab(Default-Url)|
|ctrl-l|set Focus to Addressbar|
|ctrl-f|Find in Browser-Tab|
|ctrl-p|Print Browser-Tab|
|alt-left|Back|
|ctrl-r / F5|Reload|
|ctrl-alt-i / F12|Toggle Dev-Tools|
|ctrl-tab|Atom Activate Next Item|
|ctrl-shift-tab|Atom Activate Previous Item|
|ctrl-(1/9)|Atom Activate Item by Number|
|ctrl-+|Browser Zoom + 10%|
|ctrl--|Browser Zoom - 10%|
|ctrl-0|Browser Zoom 100%|



## Override Atom Keymap
ctrl+shift+P -> Application: Open Your Keymap

```
'.platform-win32, .platform-linux':
  'ctrl-f': 'unset!'

'atom-text-editor':
  'ctrl-f': 'find-and-replace:show'
```
<!--
'body .native-key-bindings':
  'alt-down': 'window:focus-pane-below'
  'alt-left': 'window:focus-pane-on-left'
  'alt-right': 'window:focus-pane-on-right'
  'alt-up': 'window:focus-pane-above'

  'alt-shift-right': 'move-tab-or-split:right'
  'alt-shift-left': 'move-tab-or-split:left'
  'alt-shift-down': 'move-tab-or-split:down'
  'alt-shift-up': 'move-tab-or-split:up'
-->

## ToDo
- [Missing Webview Relation on deserialize as Active Pane-Item](https://github.com/hairokuma/browser/issues/1)
- add browser-Menue
- add Context-Menue support
- open dev-tool in as panel
