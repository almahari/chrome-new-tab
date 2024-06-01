document.addEventListener('DOMContentLoaded', () => {
    const folderList = document.getElementById('folderList');
    const saveBtn = document.getElementById('saveBtn');

    // Fetch bookmark folders
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        bookmarkTreeNodes.forEach((node) => {
            populateBookmarkFolders(node, folderList);
        });
    });

    // Populate folder list with checkboxes
    function populateBookmarkFolders(node, container) {
        if (node.children) {
            const div = document.createElement('div');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = node.id;
            checkbox.value = node.id;
            div.appendChild(checkbox);

            const label = document.createElement('label');
            label.htmlFor = node.id;
            label.textContent = node.title || 'Root';
            div.appendChild(label);

            container.appendChild(div);

            node.children.forEach((child) => populateBookmarkFolders(child, container));
        }
    }

    // Save selected folder IDs to storage
    saveBtn.addEventListener('click', () => {
        const selectedFolderIds = Array.from(folderList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        chrome.storage.sync.set({ selectedFolderIds }, () => {
            alert('Settings saved!');
        });
    });

    // Load saved folder IDs from storage
    chrome.storage.sync.get(['selectedFolderIds'], (result) => {
        if (result.selectedFolderIds) {
            result.selectedFolderIds.forEach((id) => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    });
});
