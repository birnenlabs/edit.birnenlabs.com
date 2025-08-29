import {Editor} from './editor';
import {Logger} from '../logger';
import {languages} from '@codemirror/language-data';
import { Settings } from './settings';

/** EditorsManager class */
export class EditorsManager {
  static #editors: Editor[] = [];
  static #activeEditor: Editor|undefined;
  static #darkMode: boolean = false;

  static initializeLanguages(): Promise<any> {
    console.log('Downloading languages support');
    return Promise.all(languages.map((lang) => lang.load()));
  }

  static setMode(dark: boolean) {
    EditorsManager.#darkMode = dark;
  }

  /**
   * This method will activate editor[index].
   */
  static activateEditor(index: number): Promise<any> {
    return Promise.resolve()
        .then(() => EditorsManager.#activateEditor(EditorsManager.#editors[index]))
        .catch((error) => Logger.error(`Could not activate editor: ${error.message}`, error));
  }

  /**
   * This method will create a new editor. If the file handler is not
   * provided new editor for an empty file will be created.
   */
  static createEditor(fileHandler: FileSystemFileHandle|undefined = undefined): Promise<any> {
    return EditorsManager.#createEditor(fileHandler)
        .catch((error: Error) => Logger.error(`Could not open file: ${error.message}`, error));
  }

  static saveActiveEditor(): Promise<any> {
    if (EditorsManager.#activeEditor) {
      return EditorsManager.#activeEditor.save()
          .then(() => Logger.info(`File ${EditorsManager.#activeEditor?.getTitle()} saved.`))
          .catch((error) => Logger.error(`File ${EditorsManager.#activeEditor?.getTitle()} not saved: ${error.message}`, error));
    } else {
      Logger.warn('Not saved.');
      return Promise.resolve();
    }
  }

  static saveAsActiveEditor(): Promise<any> {
    if (EditorsManager.#activeEditor) {
      return EditorsManager.#activeEditor.saveAs()
          .then(() => Logger.info(`File ${EditorsManager.#activeEditor?.getTitle()} saved.`))
          .catch((error) => Logger.error(`File ${EditorsManager.#activeEditor?.getTitle()} not saved: ${error.message}`, error));
    } else {
      Logger.warn('Not saved.');
      return Promise.resolve();
    }
  }

  static closeActiveEditor(): Promise<any> {
    if (EditorsManager.#activeEditor) {
      return EditorsManager.#closeEditor(EditorsManager.#activeEditor);
    } else {
      Logger.warn('Not closed.');
      return Promise.resolve();
    }
  }

  static saveAllEditors(): Promise<any> {
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
   */
  static getFileIndex(fileHandler: FileSystemFileHandle): Promise<number> {
    return fileHandler.getFile()
        .then((file) => EditorsManager.#editors.map((editor) => editor.isOpenedForFile(file)))
        .then((isOpenedForFilePromise) => Promise.all(isOpenedForFilePromise))
        .then((values) => values.findIndex((v) => v === true));
  }

  static isAnyEditorUnsaved(): boolean {
    return EditorsManager.#editors.map((editor) => editor.isUnsaved()).some((val) => val);
  }

  static #createEditor(fileHandler: FileSystemFileHandle|undefined): Promise<any> {
    if (fileHandler) {
      for (const openedEditor of EditorsManager.#editors) {
        if (openedEditor.hasFileHandler(fileHandler)) {
          return Promise.resolve().then(() => EditorsManager.#activateEditor(openedEditor));
        }
      }
    }

    const settings = new Settings();

    const editor = new Editor(settings.forceDarkMode || EditorsManager.#darkMode, fileHandler);

    EditorsManager.#editors.push(editor);

    (document.getElementById('editors-tabs') as HTMLDivElement).appendChild(editor.getTabEl());
    (document.getElementById('editors-content') as HTMLDivElement).appendChild(editor.getEditorEl());

    editor.setActivateCallback(() => EditorsManager.#activateEditor(editor));
    editor.setCloseCallback(() => EditorsManager.#closeEditor(editor));

    return editor.initialize()
        .then(() => EditorsManager.#activateEditor(editor));
  }

  /**
   * Will activate given editor or deactivate when undefined
   */
  static #activateEditor(editor: Editor|undefined) {
    if (EditorsManager.#activeEditor) {
      EditorsManager.#activeEditor.hide();
    }
    EditorsManager.#activeEditor = editor;
    if (EditorsManager.#activeEditor) {
      EditorsManager.#activeEditor.show();
    }
  }

  static #closeEditor(editor: Editor): Promise<any> {
    let resultPromise: Promise<any> = Promise.resolve();
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
