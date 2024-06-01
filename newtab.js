const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random?query=nature&client_id=7gxXPagzmgWatxdRxTAwlkV_yrFUEf2ve-hCLoqaZy4';
const CACHE_KEY = 'dailyWallpaper';
const CACHE_DATE_KEY = 'wallpaperDate';
const TODOS_KEY = 'todos';

function updateTime() {
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    timeElement.textContent = `${hours}:${minutes}`;
    dateElement.textContent = dateString;
}

function fetchBookmarks() {
    chrome.storage.sync.get(['selectedFolderIds'], (result) => {
        const folderIds = result.selectedFolderIds || [];
        const bookmarksElement = document.getElementById('bookmarks');
        bookmarksElement.innerHTML = '';

        if (folderIds.length > 0) {
            folderIds.forEach((folderId) => {
                chrome.bookmarks.getSubTree(folderId, (bookmarkTreeNodes) => {
                    bookmarkTreeNodes.forEach((node) => {
                        displayBookmarkNode(node, bookmarksElement);
                    });
                });
            });
        }
    });
}

function faviconURL(u) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
}

function displayBookmarkNode(node, container) {
    if (node.children && node.children.length > 0) {
        const groupElement = document.createElement('div');
        groupElement.className = 'bookmark-group';
        const title = document.createElement('h2');
        title.textContent = node.title;
        groupElement.appendChild(title);

        const list = document.createElement('ul');
        node.children.forEach((childNode) => {
            const listItem = document.createElement('li');
            if (childNode.url) {
                const link = document.createElement('a');
                link.href = childNode.url;
                link.target = '_blank';

                const icon = document.createElement('img');
                icon.className = 'bookmark-icon';
                // icon.src = `chrome://favicon/https://${new URL(childNode.url).hostname}`;
                // icon.src = `chrome-search://ntpicon/?size=48@1.500000x&url=https://${new URL(childNode.url).hostname}`;
                // icon.src = `chrome://favicon/size/16@1x/https://${new URL(childNode.url).hostname}`;
                // icon.src = `internet.png`;
                 icon.src = faviconURL(childNode.url);
                link.appendChild(icon);

                const linkText = document.createTextNode(childNode.title);
                link.appendChild(linkText);

                listItem.appendChild(link);
            } else {
                displayBookmarkNode(childNode, container);
            }
            list.appendChild(listItem);
        });

        groupElement.appendChild(list);
        container.appendChild(groupElement);
    }
}

function setDailyWallpaper() {
    const cachedImage = localStorage.getItem(CACHE_KEY);
    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (cachedImage && cachedDate === today) {
        document.body.style.backgroundImage = `url(${cachedImage})`;
    } else {
        fetch(UNSPLASH_API_URL)
            .then(response => response.json())
            .then(data => {
                if (data && data.urls && data.urls.full) {
                    const imageUrl = data.urls.full;
                    document.body.style.backgroundImage = `url(${imageUrl})`;
                    localStorage.setItem(CACHE_KEY, imageUrl);
                    localStorage.setItem(CACHE_DATE_KEY, today);
                }
            })
            .catch(error => console.error('Error fetching wallpaper:', error));
    }
}

function loadTodos() {
    chrome.storage.sync.get([TODOS_KEY], (result) => {
        const todos = result[TODOS_KEY] || [];
        const todosElement = document.getElementById('todos');
        todosElement.innerHTML = '';
        todos.forEach(todo => {
            addTodoElement(todo);
        });
    });
}

function saveTodos(todos) {
    chrome.storage.sync.set({ [TODOS_KEY]: todos });
}

function addTodoElement(todo) {
    const todosElement = document.getElementById('todos');
    const todoItem = document.createElement('li');

    const checkbox = document.createElement('label');
    checkbox.className = 'custom-checkbox';
    checkbox.innerHTML = `
    <input type="checkbox">
    <span class="checkmark"></span>
  `;
    checkbox.addEventListener('change', () => {
        todoItem.classList.add('hide');
        setTimeout(() => {
            todosElement.removeChild(todoItem);
            const todos = Array.from(todosElement.children).map(li => li.children[1].textContent);
            saveTodos(todos);
        }, 300); // match the duration of the CSS transition
    });
    todoItem.appendChild(checkbox);

    const todoText = document.createElement('span');
    todoText.textContent = todo;
    todoItem.appendChild(todoText);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => {
        todosElement.removeChild(todoItem);
        const todos = Array.from(todosElement.children).map(li => li.children[1].textContent);
        saveTodos(todos);
    });
    // todoItem.appendChild(deleteBtn);

    todosElement.appendChild(todoItem);
}


document.getElementById('new-todo').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const newTodoInput = document.getElementById('new-todo');
        const newTodo = newTodoInput.value.trim();
        if (newTodo) {
            addTodoElement(newTodo);
            const todos = Array.from(document.getElementById('todos').children).map(li => li.children[1].textContent);
            todos.push(newTodo);
            saveTodos(todos);
            newTodoInput.value = '';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
    fetchBookmarks();
    setDailyWallpaper();
    loadTodos();
});
