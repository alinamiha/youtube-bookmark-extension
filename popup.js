import { getActiveTabURL } from "./utils.js";

const addNewBookmark = (bookmarks, bookmark) => {
    const bookmarkTitleElement = document.createElement("div");
    const bookmarkInputTitleElement = document.createElement("input");

    const controlsElement = document.createElement("div");
    const newBookmarkElement = document.createElement("div");


    bookmarkInputTitleElement.value = bookmark.desc;
    bookmarkInputTitleElement.className = "bookmark-input";
    bookmarkInputTitleElement.readOnly = true;


    bookmarkTitleElement.className = "bookmark-title-container"
    controlsElement.className = "bookmark-controls";

    setBookmarkAttributes("play", onPlay, controlsElement);
    setBookmarkAttributes("delete", onDelete, controlsElement);
    setBookmarkAttributes("edit", onEdit, controlsElement);

    newBookmarkElement.id = "bookmark-" + bookmark.time;
    newBookmarkElement.className = "bookmark";
    newBookmarkElement.setAttribute("timestamp", bookmark.time);

    newBookmarkElement.appendChild(bookmarkTitleElement);
    bookmarkTitleElement.appendChild(bookmarkInputTitleElement);
    newBookmarkElement.appendChild(controlsElement);
    bookmarks.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = []) => {
    const bookmarksElement = document.getElementById("bookmarks");
    bookmarksElement.innerHTML = "";

    if (currentBookmarks.length > 0) {
        for (let i = 0; i < currentBookmarks.length; i++) {
            const bookmark = currentBookmarks[i];
            addNewBookmark(bookmarksElement, bookmark);
        }
    } else {
        bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
    }

    return;
};

const onEdit = async e => {
    const titleContainerElement = document.getElementsByClassName("bookmark-title-container")[0]
    const inputTitleElement = document.getElementsByClassName("bookmark-input")[0]
    const btnSaveInputExists = document.getElementsByClassName("bookmark-input-save")[0]

    if (!btnSaveInputExists) {
        const btnSaveInputElement = document.createElement("button");
        btnSaveInputElement.className = "bookmark-input-save"
        const inputValue = inputTitleElement.value
        btnSaveInputElement.addEventListener('click', editInput)
        titleContainerElement.appendChild(btnSaveInputElement);
    }


    inputTitleElement.readOnly = false
    inputTitleElement.focus()

}

const editInput = async e => {
    const activeTab = await getActiveTabURL();

    const inputValue = document.getElementsByClassName("bookmark-input")[0].value
    const btnEditInputElement = document.getElementsByClassName('bookmark-input-save')[0]

    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");


    chrome.tabs.sendMessage(activeTab.id, {
        type: "EDIT",
        value: { inputValue, bookmarkTime },
    });
    btnEditInputElement.remove()
}

const onPlay = async e => {
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const activeTab = await getActiveTabURL();

    chrome.tabs.sendMessage(activeTab.id, {
        type: "PLAY",
        value: bookmarkTime,
    }, viewBookmarks);
};

const onDelete = async e => {
    const activeTab = await getActiveTabURL();
    const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
    const bookmarkElementToDelete = document.getElementById(
        "bookmark-" + bookmarkTime
    );

    bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

    chrome.tabs.sendMessage(activeTab.id, {
        type: "DELETE",
        value: bookmarkTime,
    }, viewBookmarks);
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
    const controlElement = document.createElement("img");

    controlElement.src = "assets/" + src + ".png";
    controlElement.title = src;
    controlElement.addEventListener("click", eventListener);
    controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async() => {
    const activeTab = await getActiveTabURL();
    const queryParameters = activeTab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    const currentVideo = urlParameters.get("v");

    if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
        chrome.storage.sync.get([currentVideo], (data) => {
            const currentVideoBookmarks = data[currentVideo] ? JSON.parse(data[currentVideo]) : [];

            viewBookmarks(currentVideoBookmarks);
        });
    } else {
        const container = document.getElementsByClassName("container")[0];

        container.innerHTML = '<div class="title">This is not a youtube video page.</div>';
    }
});