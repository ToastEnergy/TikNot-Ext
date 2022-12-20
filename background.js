// const videoRegex = /https:\/\/www\.tiktok\.com\/@.*\/video\/(\d*)/g;
const videoRegex =
    /\bhttps?:\/\/(?:m|www|vm|vt)\.tiktok\.com\/\S*?\b(?:(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+)|(?=\w{7})(\w*?[A-Z\d]\w*)(?=\s|\/$))\b/;

const filter = {
    url: [
        { urlMatches: videoRegex.source }
    ]
}

async function initStorage() {
    let storage = await browser.storage.local.get()
    if (storage.deflect === undefined) {
        await browser.storage.local.set({ deflect: true })
        await browser.contextMenus.create({
            id: "deflect",
            title: "Deflect enabled",
            contexts: ["browser_action"],
            type: "checkbox",
            checked: true,
        })
    }
}

async function getVideoID(url) {
    const matches = url.match(videoRegex);
    if (!matches) {
        return null
    }
    else if (matches[1]) {
        return matches[1]
    } else if (matches[2]) {
        let response = await fetch('https://www.tikwm.com/api/?url=' + url);
        let data = await response.json();
        if (data.code === 0) {
            return data.data.id
        }
    }
}

browser.browserAction.onClicked.addListener(async (tab) => {
    const videoID = await getVideoID(tab.url);
    if (videoID) {
        const url = "https://tiknot.netlify.app/video/" + videoID;
        await browser.tabs.create({
            url: url,
        });
        await navigator.clipboard.writeText(url);
    }

});

browser.runtime.onInstalled.addListener(initStorage)


browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "deflect") {
        await browser.storage.local.set({ deflect: info.checked })
    }
})

browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
    const { deflect } = await browser.storage.local.get("deflect")
    if (!deflect) {
        return
    }
    const videoID = await getVideoID(details.url);
    console.log(videoID)
    if (videoID) {
        console.log("Tiktok video detected");
        const url = "https://tiknot.netlify.app/video/" + videoID;
        browser.tabs.update(details.tabId, {
            url: url,
        })
    }
}, filter)
