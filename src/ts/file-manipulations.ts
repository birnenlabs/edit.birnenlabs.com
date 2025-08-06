import { combine } from "./lib/promise";

export interface DirectoryWithHandles {
  handle: FileSystemDirectoryHandle;
  directories: DirectoryWithHandles[];
  files: FileSystemFileHandle[];
}


export function supportsFileSystemAccess(): boolean {
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

export function openFilePicker():Promise<FileSystemFileHandle[]> {
  return window.showOpenFilePicker({multiple: true});
}

export function openDirectoryPicker():Promise<DirectoryWithHandles> {
  return window.showDirectoryPicker()
      .then((dirHandle) => listDirectory(dirHandle));
}

function listDirectory(handle: FileSystemDirectoryHandle):Promise<DirectoryWithHandles> {
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

  const filesPromise:Promise<FileSystemFileHandle[]> = filesAndDirectoriesPromise.then((p) => p.files);

  const directoriesPromise: Promise<DirectoryWithHandles[]> = filesAndDirectoriesPromise.then((p) => p.directories)
      .then((directories) => Promise.all(directories.map((dir) => listDirectory(dir))));

  return combine(filesPromise, directoriesPromise,
      (files:FileSystemFileHandle[], directories: DirectoryWithHandles[]) => ({handle, files, directories}));
}

function fromAsync<K>(asyncIterator: AsyncIterator<K>): Promise<K[]> {
  // @ts-ignore
  return Array.fromAsync(asyncIterator);
}

export function saveFile(fileHandle: FileSystemFileHandle, contents: string):Promise<FileSystemFileHandle> {
  return fileHandle.createWritable()
      .then((writable) => writable.write(contents).then(() => writable.close()))
      .then(() => fileHandle);
}

export function saveFileAs(fileName: string, contents: string):Promise<FileSystemFileHandle> {
  return window.showSaveFilePicker({suggestedName: fileName})
      .then((fileHandle) => saveFile(fileHandle, contents));
}

/**
 * Will compare files using its metadata and if the files are the same.
 */
export function compareFiles(file1: File, file2: File):Promise<boolean> {
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

function compareContent(file1: File, file2: File): Promise<boolean> {
  console.log('Comparing content of files', file1, file2);
  return combine(file1.text(), file2.text(), (a1: string, a2: string) => a1 === a2);
}
