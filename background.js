chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        if (message.type === "gimmeHTML") {
            const data = await fetch(chrome.runtime.getURL(message.url));
            const content = await data.text();
            console.log(content);
            sendResponse(content);
            await getPageVar('foo', content);
        }
    })();

    // this is needed for async listeners be able to use `sendResponse` function
    return true;
});


async function getPageVar(name, code, tabId) {
    console.log("Hi")
    const [{result}] = await chrome.scripting.executeScript({
        func: (name, code) => {
            console.log("Hello")
            setTimeout(() => {
                console.log(monaco)
                if(monaco) {
                    const editors = monaco.editor.getEditors();
                    let editor = null;
                    if(editors && editors.length) {
                        editor = editors[0];
                    }
                    if (editor) {
                        const model = editor.getModel();
                        if (model) {
                            const fullRange = model.getFullModelRange();
                            console.log(code)
                            const code_to_insert = JSON.stringify(code);
                            editor.executeEdits('extension', [{
                                range: fullRange,
                                text: code,
                                forceMoveMarkers: true
                            }]);
                            editor.pushUndoStop();
                            editor.focus();
                        }
                    }

                }
            }, 5000)
            window[name]
            console.log("Bye]")
        },
        args: [name, code],
        target: {
            tabId: (await chrome.tabs.query({active: true, currentWindow: true}))[0].id
        },
        world: 'MAIN',
    });
    console.log(result);
    return result;
}

//(async () => {
//    const v = await getPageVar('foo');
//    console.log(v);
//})();
