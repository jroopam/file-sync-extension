import { get, set } from 'https://unpkg.com/idb-keyval@5.0.2/dist/esm/index.js';
let fileHandle;
let content = '';
window.writing = false;
window.read_file_interval = null;

async function saveToFile(contents) {
    try{
        writing = true;
        const writable = await fileHandle.createWritable();
        await writable.write(contents);
        await writable.close();
        writing = false;
    } catch (error) {
        console.log("Error:", error);
    }
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
    return null;
}

window.getModelContent = function () {
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

window.saveContent = async function () {
    let localFileHandle = await get('file');
    [fileHandle] = localFileHandle;
    if(!fileHandle) {
        return;
    }
    const initial_save = getModelContent();
    saveToFile(initial_save);
}

async function initialize() {
    let localFileHandle  = await window.showOpenFilePicker({id: 'saveContent'}); 
    await set('file', localFileHandle);
    saveContent();
}

function waitForModel() {
    return new Promise((resolve) => {
        const wait_for_model = setInterval(() => {
            const model = getModel();
            if (model) {
                clearInterval(wait_for_model);
                resolve(model); // Resolve the promise when the model is available
            }
        }, 200);
    });
}

window.keepReadingFileForChanges = function (loc) {
    read_file_interval = setInterval(async () => {
        if(fileHandle && !writing) {
            let file_content = await readFile();
            file_content = file_content.trim();
            //console.log("Location", loc, writing, file_content);
            if(content != file_content) {
                content = file_content;
                saveModelContent(file_content);
            }
        }
    }, 1000);
}

window.addEventListener('load', async () => {
    console.log("Trying to insert button");
    const button = document.createElement("button");
    button.textContent = "Select File";
    button.onclick = initialize;
    if(document.querySelector('.z-nav-1')) {
        document.querySelector('.z-nav-1').appendChild(button);
    } else {
        document.querySelector('nav').appendChild(button);
    }
    console.log("Button Inserted");

    await waitForModel();

    await saveContent(); //await here so that when the user goes to a new problem, it first writes to the file

    const model = getModel();
    model.onDidChangeContent(async () => {
        const contents = getModelContent();
        if(content != contents) 
            await saveToFile(contents);
        content = contents;
    })
    
    keepReadingFileForChanges(0);
});
