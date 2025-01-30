let last_active_tab_id = null;

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if(tabs && tabs.length) 
        last_active_tab_id = tabs[0].id;
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const current_tab_id = activeInfo.tabId;

    try {
        const tab = await chrome.tabs.get(current_tab_id);
        // Skip chrome:// or brave:// URLs
        if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("brave://")) {
            return;
        }
    } catch (error) { }

    try {
        if (last_active_tab_id) {
            await chrome.scripting.executeScript({
                func: async () => {
                    if (typeof read_file_interval !== "undefined") {
                        clearInterval(read_file_interval);
                        //console.log("Interval Cleared", getModelContent());
                    }
                },
                target: {
                    tabId: last_active_tab_id,
                },
                world: 'MAIN',
            });
        }
    } catch (error) { }

    try {
        let tabs = await chrome.tabs.query({});

        let inactiveTabs = tabs.filter(tab => !tab.active);

        for (let tab of inactiveTabs) {
            await chrome.scripting.executeScript({
                func: async () => {
                    if (typeof read_file_interval !== "undefined") {
                        clearInterval(read_file_interval);
                         //console.log("Interval Cleared 2", getModelContent());
                    }
                },
                target: { tabId: tab.id },
                world: 'MAIN',
            });
        }
    } catch (error) {
        console.error(error);
    }

    if (current_tab_id) {
        await chrome.scripting.executeScript({
            func: async () => {
                writing = true;
                // console.log("Before saving content", getModelContent());
                if (typeof read_file_interval !== "undefined") { // Handle the case where the user reloads -> switches tab and then go back to the original tab again
                    clearInterval(read_file_interval);
                    // console.log("Interval Cleared", getModelContent());
                }
                await saveContent(); // Ensure content is saved after clearing interval
                keepReadingFileForChanges(1);
            },
            target: {
                tabId: current_tab_id,
            },
            world: 'MAIN',
        });
    }

    last_active_tab_id = current_tab_id;
});
// What happens when both/all the tabs are loading? Maybe we need a central place to handle file writing but permissions don't allow it.
