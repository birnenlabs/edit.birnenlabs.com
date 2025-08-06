import {compareFiles, saveFile, saveFileAs} from '../file-manipulations.js';
// codemirror is installed locally. In order to work on the webpage, the module
// is mapped in the importmap.
import {basicSetup, EditorView} from 'codemirror';
import {keymap} from '@codemirror/view';
import {combine2} from '/jslib/js/promise.js';
import {oneDark} from '@codemirror/theme-one-dark';
import {languages} from '@codemirror/language-data';
import {indentWithTab} from '@codemirror/commands';

/** Editor class */
export class Editor {
  static #newFileCount = 1;

  /** @type {FileSystemFileHandle|undefined} */
  #fileHandler;

  /** @type {EditorTabHtml} */
  #editorTabHtml;

  /** @type {EditorHtml} */
  #editorHtml;

  /** @type {boolean} */
  #isUnsaved;

  /**
   * @param {boolean} darkMode
   * @param {FileSystemFileHandle|undefined} fileHandler
   */
  constructor(darkMode, fileHandler) {
    this.#fileHandler = fileHandler;
    this.#editorTabHtml = new EditorTabHtml();
    this.#editorHtml = new EditorHtml(darkMode, () => this.#setIsUnsaved(true));
    this.#isUnsaved = false;
  }

  /**
   * @return {Promise<any>}
   */
  initialize() {
    const filePromise = this.#fileHandler === undefined ?
      Promise.resolve({
        name: `Untitled-${Editor.#newFileCount++}`,
        text: () => Promise.resolve(''),
      }) :
      this.#fileHandler.getFile();
    const textPromise = filePromise.then((file) => file.text());

    return combine2(filePromise, textPromise, (file, text) => {
      this.#editorTabHtml.setTitle(file.name);
      return this.#editorHtml.initialize(file.name, text);
    });
  }

  /**
   * Will return true if this editor is opened for a given file
   * by comparing data on the disk.
   *
   * @param {File} file
   * @return {Promise<boolean>}
   */
  isOpenedForFile(file) {
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
   *
   * @param {FileSystemFileHandle} handler
   * @return {boolean}
   */
  hasFileHandler(handler) {
    return this.#fileHandler === handler;
  }

  /**
   * @return {Promise<any>}
   */
  save() {
    if (this.#fileHandler === undefined) {
      return this.saveAs();
    } else {
      return saveFile(this.#fileHandler, this.#editorHtml.getContent())
          .then(() => this.#setIsUnsaved(false));
    }
  }

  /**
   * @return {Promise<any>}
   */
  saveAs() {
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

  /**
   * @return {string}
   */
  getTitle() {
    return this.#editorTabHtml.getTitle();
  }

  /**
   * @return {HTMLElement}
   */
  getTabEl() {
    return this.#editorTabHtml.getEl();
  }

  /**
   * @return {HTMLElement}
   */
  getEditorEl() {
    return this.#editorHtml.getEl();
  }

  /**
   * @return {boolean}
   */
  isUnsaved() {
    return this.#isUnsaved;
  }

  /**
   * @param {boolean} isUnsaved
   */
  #setIsUnsaved(isUnsaved) {
    this.#isUnsaved = isUnsaved;
    this.#editorTabHtml.setUnsavedIndicator(isUnsaved);
  }

  /**
   * Sets function that will activate this tab when called.
   *
   * @param {function():any} callback
   */
  setActivateCallback(callback) {
    this.#editorTabHtml.setActivateCallback(callback);
  }

  /**
   * Sets function that will close this tab when called.
   *
   * @param {function():any} callback
   */
  setCloseCallback(callback) {
    this.#editorTabHtml.setCloseCallback(callback);
  }
}

/** EditorTabHtml class */
class EditorTabHtml {
  /** @type {HTMLButtonElement} */
  #mainEl;

  /** @type {HTMLElement} */
  #captionEl;

  /** @type {HTMLButtonElement} */
  #closeEl;

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

  /**
   * @return {HTMLButtonElement}
   */
  getEl() {
    return this.#mainEl;
  }

  /**
   * Sets function that will activate this tab when called.
   *
   * @param {function():any} callback
   */
  setActivateCallback(callback) {
    // Left click should activate tab
    this.#mainEl.onclick = callback;
  }

  /**
   * Sets function that will close this tab when called.
   *
   * @param {function():any} callback
   */
  setCloseCallback(callback) {
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

  /**
   * @return {string}
   */
  getTitle() {
    return this.#captionEl.textContent || '';
  }

  /**
   * @param {string} title
   */
  setTitle(title) {
    this.#captionEl.textContent = title;
  }

  /**
   * @param {boolean} isUnsaved
   */
  setUnsavedIndicator(isUnsaved) {
    if (isUnsaved) {
      this.#mainEl.classList.add('editor-btn-unsaved');
    } else {
      this.#mainEl.classList.remove('editor-btn-unsaved');
    }
  }

  /**
   * Mark button as active or inactive.
   *
   * @param {boolean} active
   */
  markActive(active) {
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
  /** @type {HTMLElement} */
  #mainEl;

  /** @type {EditorView} */
  #editorView;

  /** @type {boolean} */
  #darkMode;

  /** @type{function():any} */
  #docChangedCallback;

  /**
   * Creates new empty and hidden Html Editor.
   *
   * @param {boolean} darkMode
   * @param {function():any} docChangedCallback
   */
  constructor(darkMode, docChangedCallback) {
    this.#mainEl = document.createElement('div');
    this.#mainEl.classList.add('editor');
    this.#darkMode = darkMode;
    this.#docChangedCallback = docChangedCallback;
    this.hide();
  }

  /**
   * @param {string} filename
   * @param {string} content
   * @return {Promise<any>}
   */
  initialize(filename, content) {
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
          ...language ? [language] : [],
          ...this.#darkMode ? [oneDark] : [],
          keymap.of([indentWithTab]),
        ],
      }),
    );
  }

  /**
   * @return {HTMLElement}
   */
  getEl() {
    return this.#mainEl;
  }

  /**
   * Show editor.
   */
  show() {
    this.#mainEl.classList.add('editor-active');
    this.#editorView.focus();
  }

  /**
   * Hide editor.
   */
  hide() {
    this.#mainEl.classList.remove('editor-active');
  }

  /**
   * @return {string}
   */
  getContent() {
    return this.#editorView.state.doc.toString();
  }

  /**
   * Destroy the view and detach from DOM.
   */
  close() {
    this.#editorView.destroy();
    this.#mainEl.remove();
  }
}
