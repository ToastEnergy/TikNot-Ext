// const videoRegex = /https:\/\/www\.tiktok\.com\/@.*\/video\/(\d*)/g;
const videoRegex =
    /\bhttps?:\/\/(?:m|www|vm|vt)\.tiktok\.com\/\S*?\b(?:(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+)|(?=\w{7})(\w*?[A-Z\d]\w*)(?=\s|\/$))\b/;

function getCurrentTab() {
    return browser.tabs.query({ currentWindow: true, active: true });
}

browser.browserAction.onClicked.addListener(async (e) => {
    const url = await getCurrentTab();
    const videoID = url[0].url.split("?")[0].split("/").pop();
    browser.tabs.create({
        url: "https://tiknot.netlify.app/video/" + videoID,
    });
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tabInfo) => {
    console.log(changeInfo.url);
    if (changeInfo.url) {
        if (tabInfo.url.match(videoRegex)) {
            console.log("Tiktok video detected");
            const url = await getCurrentTab();
            const videoID = url[0].url.split("?")[0].split("/").pop();
            browser.tabs.create({
                url: "https://tiknot.netlify.app/video/" + videoID,
            });
        }
    }
});
