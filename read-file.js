function injectScript (src) {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = chrome.runtime.getURL(src);
    s.onload = () => s.remove();
    (document.head || document.documentElement).append(s);
}

injectScript('script.js')
