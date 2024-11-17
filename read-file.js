async function startReadingFile() {
    try {
        const res = await fetch(chrome.runtime.getURL('index.html'));
        const content = await res.text();
        console.log("content", content);
    } catch (error) {
        console.log('Error reading file: ', error);
    }
}

(async () => {
    try {
        const data = await chrome.runtime.sendMessage({ type: "gimmeHTML", url: "tmp.cpp" });
    } catch (error) {
        console.error('Error: ', error);
    }
})();
