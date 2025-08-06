import {combine2} from '/jslib/js/promise.js';

/**
 * @typedef {Object} DirectoryWithHandles
 *
 * @property {FileSystemDirectoryHandle} handle
 * @property {DirectoryWithHandles[]} directories
 * @property {FileSystemFileHandle[]} files
 *
 */

/**
 * @return {boolean}
 */
export function supportsFileSystemAccess() {
  if (window.hasOwnProperty('showOpenFilePicker') &&
        window.hasOwnProperty('showSaveFilePicker') &&
        window.hasOwnProperty('showDirectoryPicker')) {
    try {
      return window.self === window.top;
    } catch {
      console.warn('cannot access files inside an iframe');
      return false;
    }
  } else {
    console.warn('showOpenFilePicker, showSaveFilePicker or showDirectoryPicker not supported');
    return false;
  }
}

/**
 * @return {Promise<FileSystemFileHandle[]>}
 */
export function openFilePicker() {
  return window.showOpenFilePicker({multiple: true});
}

/**
 * @return {Promise<DirectoryWithHandles>}
 */
export function openDirectoryPicker() {
  return window.showDirectoryPicker()
      .then((dirHandle) => listDirectory(dirHandle));
}

/**
 * @param {FileSystemDirectoryHandle} handle
 * @return {Promise<DirectoryWithHandles>}
 */
function listDirectory(handle) {
  // List directory and split files and directories.
  const filesAndDirectoriesPromise = fromAsync(handle.values())
      .then((values) => {
        /** @type {FileSystemFileHandle[]} */
        const files = [];
        /** @type {FileSystemDirectoryHandle[]} */
        const directories = [];
        for (const value of values) {
          if (value instanceof FileSystemFileHandle) {
            files.push(value);
          } else if (value instanceof FileSystemDirectoryHandle) {
            directories.push(value);
          } else {
            console.error('Unexpected entry in directory', value);
          }
        }


        files.sort((f1, f2) => f1.name.localeCompare(f2.name));
        directories.sort((d1, d2) => d1.name.localeCompare(d2.name));

        return {files, directories};
      });

  /** @type {Promise<FileSystemFileHandle[]>} */
  const filesPromise = filesAndDirectoriesPromise.then((p) => p.files);

  /** @type {Promise<DirectoryWithHandles[]>} */
  const directoriesPromise = filesAndDirectoriesPromise.then((p) => p.directories)
      .then((directories) => Promise.all(directories.map((dir) => listDirectory(dir))));

  return combine2(filesPromise, directoriesPromise,
      (files, directories) => ({handle, files, directories}));
}

/**
 * @template K
 *
 * @param {AsyncIterator<K>} asyncIterator
 * @return {Promise<K[]>}
 */
function fromAsync(asyncIterator) {
  // @ts-ignore
  return Array.fromAsync(asyncIterator);
}

/**
 * @param {FileSystemFileHandle} fileHandle
 * @param {string} contents
 * @return {Promise<FileSystemFileHandle>}
 */
export function saveFile(fileHandle, contents) {
  return fileHandle.createWritable()
      .then((writable) => writable.write(contents).then(() => writable.close()))
      .then(() => fileHandle);
}

/**
 * @param {string} fileName
 * @param {string} contents
 * @return {Promise<FileSystemFileHandle>}
 */
export function saveFileAs(fileName, contents) {
  return window.showSaveFilePicker({suggestedName: fileName})
      .then((fileHandle) => saveFile(fileHandle, contents));
}

/**
 * Will compare files using its metadata and if the files are the same.
 *
 *
 * @param {File} file1
 * @param {File} file2
 * @return {Promise<boolean>}
 */
export function compareFiles(file1, file2) {
  const metadataEquals =
    (file1.lastModified === file2.lastModified &&
  file1.name === file2.name &&
  file1.size === file2.size &&
  file1.type === file2.type);
  if (metadataEquals) {
    return compareContent(file1, file2);
  } else {
    return Promise.resolve(false);
  }
}

/**
 * @param {File} file1
 * @param {File} file2
 * @return {Promise<boolean>}
 */
function compareContent(file1, file2) {
  console.log('Comparing content of files', file1, file2);
  return combine2(file1.text(), file2.text(), (a1, a2) => a1 === a2);
}
