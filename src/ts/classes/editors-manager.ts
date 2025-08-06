import {checkNonUndefined} from '/jslib/js/preconditions.js';
import {Editor} from './editor.js';
import {Logger} from '../logger.js';
import {languages} from '@codemirror/language-data';

/** EditorsManager class */
export class EditorsManager {
  /**
   * @type {Editor[]}
   */
  static #editors = [];

  /** @type {Editor|undefined} */
  static #activeEditor;

  /** @type {boolean} */
  static #darkMode = false;

  /**
   * @return {Promise<any>}
   */
  static initializeLanguages() {
    console.log('Downloading languages support');
    return Promise.all(languages.map((lang) => lang.load()));
  }

  /**
   * @param {boolean} dark
   */
  static setMode(dark) {
    EditorsManager.#darkMode = dark;
  }

  /**
   * This method will activate editor[index].
   *
   * @param {number} index
   * @return {Promise<any>}
   */
  static activateEditor(index) {
    return Promise.resolve()
        .then(() => EditorsManager.#activateEditor(EditorsManager.#editors[index]))
        .catch((error) => Logger.error(`Could not activate editor: ${error.message}`, error));
  }

  /**
   * This method will create a new editor. If the file handler is not
   * provided new editor for an empty file will be created.
   *
   * @param {FileSystemFileHandle|undefined} fileHandler
   * @return {Promise<any>}
   */
  static createEditor(fileHandler = undefined) {
    return EditorsManager.#createEditor(fileHandler)
        .catch((error) => Logger.error(`Could not open file: ${error.message}`, error));
  }

  /**
   * @return {Promise<any>}
   */
  static saveActiveEditor() {
    if (EditorsManager.#activeEditor) {
      return EditorsManager.#activeEditor.save()
          .then(() => Logger.info(`File ${EditorsManager.#activeEditor?.getTitle()} saved.`))
          .catch((error) => Logger.error(`File ${EditorsManager.#activeEditor?.getTitle()} not saved: ${error.message}`, error));
    } else {
      Logger.warn('Not saved.');
      return Promise.resolve();
    }
  }

  /**
   * @return {Promise<any>}
   */
  static saveAsActiveEditor() {
    if (EditorsManager.#activeEditor) {
      return EditorsManager.#activeEditor.saveAs()
          .then(() => Logger.info(`File ${EditorsManager.#activeEditor?.getTitle()} saved.`))
          .catch((error) => Logger.error(`File ${EditorsManager.#activeEditor?.getTitle()} not saved: ${error.message}`, error));
    } else {
      Logger.warn('Not saved.');
      return Promise.resolve();
    }
  }

  /**
   * @return {Promise<any>}
   */
  static closeActiveEditor() {
    if (EditorsManager.#activeEditor) {
      return EditorsManager.#closeEditor(EditorsManager.#activeEditor);
    } else {
      Logger.warn('Not closed.');
      return Promise.resolve();
    }
  }

  /**
   * @return {Promise<any>}
   */
  static saveAllEditors() {
    // Save files one by one.
    let saveAllPromise = Promise.resolve();
    for (const editor of EditorsManager.#editors) {
      saveAllPromise = saveAllPromise.then(() => editor.save());
    }
    return saveAllPromise
        .then(() => Logger.info(`All files saved.`))
        .catch((error) => Logger.error(`Could not save all files: ${error.message}`, error));
  }

  /**
   * Will try to find if the file is already opened by comparing
   * metadata and file name (but not full path!) and will return
   * index of editor if the file is already opened.
   *
   * @param {FileSystemFileHandle} fileHandler
   * @return {Promise<number>}
   */
  static getFileIndex(fileHandler) {
    return fileHandler.getFile()
        .then((file) => EditorsManager.#editors.map((editor) => editor.isOpenedForFile(file)))
        .then((isOpenedForFilePromise) => Promise.all(isOpenedForFilePromise))
        .then((values) => values.findIndex((v) => v === true));
  }

  /**
   * @return {boolean}
   */
  static isAnyEditorUnsaved() {
    return EditorsManager.#editors.map((editor) => editor.isUnsaved()).some((val) => val);
  }

  /**
   * @param {FileSystemFileHandle|undefined} fileHandler
   * @return {Promise<any>}
   */
  static #createEditor(fileHandler) {
    if (fileHandler) {
      for (const openedEditor of EditorsManager.#editors) {
        if (openedEditor.hasFileHandler(fileHandler)) {
          return Promise.resolve().then(() => EditorsManager.#activateEditor(openedEditor));
        }
      }
    }

    const editor = new Editor(EditorsManager.#darkMode, fileHandler);

    EditorsManager.#editors.push(editor);

    checkNonUndefined(document.getElementById('editors-tabs')).appendChild(editor.getTabEl());
    checkNonUndefined(document.getElementById('editors-content')).appendChild(editor.getEditorEl());

    editor.setActivateCallback((event) => EditorsManager.#activateEditor(editor));
    editor.setCloseCallback(() => EditorsManager.#closeEditor(editor));

    return editor.initialize()
        .then(() => EditorsManager.#activateEditor(editor));
  }

  /**
   * Will activate given editor or deactivate when undefined
   *
   * @param {Editor|undefined} editor
   */
  static #activateEditor(editor) {
    if (EditorsManager.#activeEditor) {
      EditorsManager.#activeEditor.hide();
    }
    EditorsManager.#activeEditor = editor;
    if (EditorsManager.#activeEditor) {
      EditorsManager.#activeEditor.show();
    }
  }

  /**
   * @param {Editor} editor
   * @return {Promise<any>}
   */
  static #closeEditor(editor) {
    /** @type {Promise<any>} */
    let resultPromise = Promise.resolve();
    const editorIdx = EditorsManager.#editors.indexOf(editor);
    if (editorIdx === -1) {
      console.error(`Couldn't find editor ${editor} in the editors list.`);
    } else {
      if (EditorsManager.#editors[editorIdx].isUnsaved() &&
          window.confirm(`The ${EditorsManager.#editors[editorIdx].getTitle()} has unsaved changes. Do you want to save it before closing?`)) {
        resultPromise = resultPromise.then(() => EditorsManager.#editors[editorIdx].save());
      }

      // Maybe change active editor if we are closing it.
      if (EditorsManager.#editors[editorIdx] == EditorsManager.#activeEditor) {
        // This is state before closing - we need to have at least 2 editors to have something to activate
        if (EditorsManager.#editors.length >= 2) {
          // Activate previous editor when closing active one.
          resultPromise = resultPromise.then(() => EditorsManager.#activateEditor(EditorsManager.#editors[editorIdx == 0 ? 1 : editorIdx - 1]));
        } else {
          resultPromise = resultPromise.then(() => EditorsManager.#activateEditor(undefined));
        }
      }

      resultPromise = resultPromise
          .then(() => EditorsManager.#editors[editorIdx].close())
          .then(() => EditorsManager.#editors.splice(editorIdx, 1));
    }
    return resultPromise;
  }
}
