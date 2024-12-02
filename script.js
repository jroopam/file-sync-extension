import { get, set } from 'https://unpkg.com/idb-keyval@5.0.2/dist/esm/index.js';
let fileHandle;
let content = '';
let writing = false;

async function saveToFile(contents) {
    writing = true;
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
    writing = false;
}

async function readFile() {
    if(writing) return null;
    const file = await fileHandle.getFile();
    return await file.text();
}

function getModel() {
    if(monaco && monaco.editor && monaco.editor.getEditors().length) {
        return monaco.editor.getEditors()[0].getModel();
    }
}

function getModelContent() {
    const model = getModel();
    return model.getValue();
}

function saveModelContent(contents) {
    const model = getModel();
    if(!model){
        return null;
    }
    const editors = monaco.editor.getEditors();
    if(!editors || !editors.length) {
        return null;
    }
    let editor = editors[0];
    const fullRange = model.getFullModelRange();
    editor.executeEdits('extension', [{
        range: fullRange,
        text: contents,
        forceMoveMarkers: true
    }]);
    editor.pushUndoStop();
    editor.focus();
}

async function initialSave() {
    let localFileHandle = await get('file');
    if(!localFileHandle) {
        localFileHandle = await window.showOpenFilePicker({id: 'saveContent'}); 
    }
    [fileHandle] = localFileHandle;
    await set('file', localFileHandle);
    const initial_save = getModelContent();
    saveToFile(initial_save);
}

setTimeout(() => {
    console.log("Trying to insert button");
    const button = document.createElement("button");
    button.textContent = "Select File";
    button.onclick = initialSave;
    if(document.querySelector('.z-nav-1')) {
        document.querySelector('.z-nav-1').appendChild(button);
    } else {
        document.querySelector('nav').appendChild(button);
    }
    console.log("Button Inserted");

    const model = getModel();
    model.onDidChangeContent(async () => {
        const contents = getModelContent();
        if(content != contents) 
            await saveToFile(contents);
        content = contents;
    })

    setInterval(async () => {
        if(fileHandle && !writing) {
            const file_content = await readFile();
            if(content != file_content) {
                saveModelContent(file_content);
                content = file_content;
            }
        }
    }, 1000);
}, 5000);