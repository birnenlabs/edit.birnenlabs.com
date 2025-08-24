import {compareFiles, saveFile, saveFileAs} from '../file-manipulations';
// codemirror is installed locally. In order to work on the webpage, the module
// is mapped in the importmap.
import {basicSetup, EditorView} from 'codemirror';
import {keymap} from '@codemirror/view';
import {oneDark} from '@codemirror/theme-one-dark';
import {languages} from '@codemirror/language-data';
import {indentWithTab} from '@codemirror/commands';
import { combine } from '../lib/promise';

/** Editor class */
export class Editor {
  static #newFileCount = 1;

  #fileHandler: FileSystemFileHandle|undefined;
  #editorTabHtml: EditorTabHtml;
  #editorHtml: EditorHtml;
  #isUnsaved : boolean;

  constructor(darkMode: boolean, fileHandler: FileSystemFileHandle|undefined) {
    this.#fileHandler = fileHandler;
    this.#editorTabHtml = new EditorTabHtml();
    this.#editorHtml = new EditorHtml(darkMode, () => this.#setIsUnsaved(true));
    this.#isUnsaved = false;
  }

  initialize() : Promise<any> {
    const filePromise = this.#fileHandler === undefined ?
      Promise.resolve({
        name: `Untitled-${Editor.#newFileCount++}`,
        text: () => Promise.resolve(''),
      }) :
      this.#fileHandler.getFile();
    const textPromise = filePromise.then((file) => file.text());

    return combine(filePromise, textPromise, (file, text) => {
      this.#editorTabHtml.setTitle(file.name);
      return this.#editorHtml.initialize(file.name, text);
    });
  }

  /**
   * Will return true if this editor is opened for a given file
   * by comparing data on the disk.
   */
  isOpenedForFile(file: File): Promise<boolean> {
    if (this.#fileHandler === undefined) {
      // Then fileHandler is not defined, the editor is opened for a new file.
      return Promise.resolve(false);
    } else {
      return this.#fileHandler.getFile().then((f) => compareFiles(f, file));
    }
  }

  /**
   * Will return true if this editor is opened for a given file
   * by comparing file handler references.
   */
  hasFileHandler(handler: FileSystemFileHandle): boolean {
    return this.#fileHandler === handler;
  }

  save() :Promise<any> {
    if (this.#fileHandler === undefined) {
      return this.saveAs();
    } else {
      return saveFile(this.#fileHandler, this.#editorHtml.getContent())
          .then(() => this.#setIsUnsaved(false));
    }
  }

  saveAs() :Promise<any> {
    return saveFileAs(this.#editorTabHtml.getTitle(), this.#editorHtml.getContent())
        .then((handle) => this.#fileHandler = handle)
        .then(() => this.initialize())
        .then(() => this.#setIsUnsaved(false));
  }

  /**
   * Show the editor
   */
  show() {
    this.#editorHtml.show();
    this.#editorTabHtml.markActive(true);
  }

  /**
   * Hide the editor.
   */
  hide() {
    this.#editorHtml.hide();
    this.#editorTabHtml.markActive(false);
  }

  /**
   * Close editor, destroy the views.
   */
  close() {
    this.#editorHtml.close();
    this.#editorTabHtml.close();

    this.#fileHandler = undefined;
  }

  getTitle() :string{
    return this.#editorTabHtml.getTitle();
  }

  getTabEl() :HTMLElement {
    return this.#editorTabHtml.getEl();
  }

  getEditorEl() : HTMLElement {
    return this.#editorHtml.getEl();
  }

  isUnsaved() : boolean {
    return this.#isUnsaved;
  }

  #setIsUnsaved(isUnsaved: boolean) {
    this.#isUnsaved = isUnsaved;
    this.#editorTabHtml.setUnsavedIndicator(isUnsaved);
  }

  setActivateCallback(callback: () => any) {
    this.#editorTabHtml.setActivateCallback(callback);
  }

  /**
   * Sets function that will close this tab when called.
   */
  setCloseCallback(callback : () => any) {
    this.#editorTabHtml.setCloseCallback(callback);
  }
}

/** EditorTabHtml class */
class EditorTabHtml {
  #mainEl: HTMLButtonElement;
  #captionEl: HTMLElement;
  #closeEl: HTMLButtonElement;

  /**
   * Creates new inactive Tab
   */
  constructor() {
    this.#mainEl = document.createElement('button');
    this.#mainEl.type = 'button';
    this.#mainEl.classList.add('editor-btn');

    this.#captionEl = document.createElement('span');
    this.#captionEl.textContent = 'loading...';
    this.#captionEl.classList.add('editor-btn-caption');

    this.#closeEl = document.createElement('button');
    this.#closeEl.type = 'button';
    this.#closeEl.innerHTML = '&times;';
    this.#closeEl.classList.add('editor-btn-close');

    this.#mainEl.appendChild(this.#captionEl);
    this.#mainEl.appendChild(this.#closeEl);

    this.markActive(false);
  }

  getEl(): HTMLButtonElement {
    return this.#mainEl;
  }

  /**
   * Sets function that will activate this tab when called.
   */
  setActivateCallback(callback: () => any) {
    // Left click should activate tab
    this.#mainEl.onclick = callback;
  }

  /**
   * Sets function that will close this tab when called.
   */
  setCloseCallback(callback: () => any) {
    // Close click should close the tab and not propagate any further.
    this.#closeEl.onclick = (event) => {
      callback(); event.stopPropagation();
    };

    // Middle click should close the tab.
    this.#mainEl.onauxclick = (event) => {
      if (event.button==1) {
        callback();
      }
    };
  }

  getTitle() : string {
    return this.#captionEl.textContent || '';
  }

  setTitle(title: string) {
    this.#captionEl.textContent = title;
  }

  setUnsavedIndicator(isUnsaved: boolean) {
    if (isUnsaved) {
      this.#mainEl.classList.add('editor-btn-unsaved');
    } else {
      this.#mainEl.classList.remove('editor-btn-unsaved');
    }
  }

  /**
   * Mark button as active or inactive.
   */
  markActive(active: boolean) {
    if (active) {
      this.#mainEl.classList.add('editor-btn-active');
    } else {
      this.#mainEl.classList.remove('editor-btn-active');
    }
  }

  /**
   * Destroy the view and detach from DOM.
   */
  close() {
    this.#captionEl.remove();
    this.#closeEl.remove();
    this.#mainEl.remove();
  }
}

/** EditorHtml class */
class EditorHtml {
  #mainEl : HTMLElement;
  #editorView: EditorView|undefined;
  #darkMode : boolean;
  #docChangedCallback : () => any;

  /**
   * Creates new empty and hidden Html Editor.
   */
  constructor(darkMode: boolean, docChangedCallback: () => any) {
    this.#mainEl = document.createElement('div');
    this.#mainEl.classList.add('editor');
    this.#darkMode = darkMode;
    this.#docChangedCallback = docChangedCallback;
    this.hide();
  }

  initialize(filename: string, content: string): Promise<any> {
    this.#mainEl.innerHTML = '';
    if (this.#editorView) {
      this.#editorView.destroy();
    }

    const extension = filename.toLowerCase().split('.').pop();

    let languagePromise;
    if (extension) {
      for (const language of languages) {
        if (language.extensions.includes(extension)) {
          languagePromise = language.load();
          break;
        }
      }
    }


    return (languagePromise || Promise.resolve()).then( (language) =>
      this.#editorView = new EditorView({
        doc: content,
        parent: this.#mainEl,
        extensions: [
          basicSetup,
          EditorView.updateListener.of((view) => {
            if (view.docChanged) {
              this.#docChangedCallback();
            }
          }),
          EditorView.lineWrapping,
          ...language ? [language] : [],
          ...this.#darkMode ? [oneDark] : [],
          keymap.of([indentWithTab]),
        ],
      }),
    );
  }

  getEl() : HTMLElement{
    return this.#mainEl;
  }

  show() {
    this.#mainEl.classList.add('editor-active');
    this.#editorView!.focus();
  }

  hide() {
    this.#mainEl.classList.remove('editor-active');
  }

  getContent(): string {
    return this.#editorView!.state.doc.toString();
  }

  /**
   * Destroy the view and detach from DOM.
   */
  close() {
    this.#editorView!.destroy();
    this.#mainEl.remove();
  }
}
