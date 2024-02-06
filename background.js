// const videoRegex = /https:\/\/www\.tiktok\.com\/@.*\/video\/(\d*)/g;
const videoRegex =
    /\bhttps?:\/\/(?:m|www|vm|vt)\.tiktok\.com\/\S*?\b(?:(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+)|(?=\w{7})(\w*?[A-Z\d]\w*)(?=\s|\/$))\b/;

const filter = {
    url: [{ urlMatches: videoRegex.source }],
};

const TIKNOT_URL = "https://tiknot.netlify.app";

const sleep = () => new Promise((resolve) => setTimeout(resolve, 1000));

if (browser.contextMenus) {
    // context menus are not supported in firefox for android atm, so the whole deflect toggle is disabled
    browser.contextMenus.create({
        id: "deflect",
        title: "Deflect enabled",
        contexts: ["browser_action"],
        type: "checkbox",
    });

    browser.storage.local.get("deflect").then((data) => {
        browser.contextMenus.update("deflect", {
            checked: data.deflect,
        });
    });

    browser.storage.onChanged.addListener(async (changes) => {
        if (changes.deflect) {
            browser.contextMenus.update("deflect", {
                checked: changes.deflect.newValue,
            });
        }
    });
    browser.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === "deflect") {
            await browser.storage.local.set({ deflect: info.checked });
        }
    });
}

browser.runtime.onInstalled.addListener(initStorage);

async function initStorage() {
    let storage = await browser.storage.local.get();
    if (storage.deflect === undefined) {
        await browser.storage.local.set({ deflect: true });
    }
}

async function getVideoID(url) {
    const matches = url.match(videoRegex);
    if (!matches) {
        const urlObj = new URL(url);
        if (urlObj.pathname !== "/login") {
            return null;
        }
        const redirectUrl = urlObj.searchParams.get("redirect_url");
        if (redirectUrl) {
            return await getVideoID(redirectUrl);
        }
    } else if (matches[1]) {
        return matches[1];
    } else if (matches[2]) {
        let response = await fetch("https://www.tikwm.com/api/?url=" + url);
        await sleep(); // sleeping for 1 second to avoid rate limiting, tiknot would fail to refetch
        let data = await response.json();
        if (data.code === 0) {
            return data.data.id;
        }
    }
}

browser.browserAction.onClicked.addListener(async (tab) => {
    const videoID = await getVideoID(tab.url);
    if (videoID) {
        const url = TIKNOT_URL + "/video/" + videoID;
        await browser.tabs.create({
            url: url,
        });
        await navigator.clipboard.writeText(url);
    }
});

browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
    const { deflect } = await browser.storage.local.get("deflect");
    if (!deflect) {
        return;
    }
    const videoID = await getVideoID(details.url);
    console.log(videoID);
    if (videoID) {
        console.log("Tiktok video detected");
        const url = TIKNOT_URL + "/video/" + videoID;
        browser.tabs.update(details.tabId, {
            url: url,
        });
    }
}, filter);
