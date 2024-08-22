// DOM elements
const content = document.getElementById('content');
const homeBtn = document.getElementById('home');
const loginBtn = document.getElementById('login');
const registerBtn = document.getElementById('register');
const createPostBtn = document.getElementById('create-post');
const mainHomeBtn = document.getElementById('main-home');

console.log('Content element:', content);

function showMessage(message, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.padding = '10px';
    messageElement.style.marginBottom = '10px';
    messageElement.style.backgroundColor = isError ? '#ffcccc' : '#ccffcc';
    content.insertBefore(messageElement, content.firstChild);
    setTimeout(() => messageElement.remove(), 5000);
}

// Event listeners
homeBtn.addEventListener('click', showPosts);
loginBtn.addEventListener('click', showLoginForm);
registerBtn.addEventListener('click', showRegisterForm);
createPostBtn.addEventListener('click', showCreatePostForm);
if (mainHomeBtn) {
    mainHomeBtn.addEventListener('click', function() {
        window.location.href = '/';
    });
}

function showPosts() {
    console.log('Showing posts');
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('请登录以查看博客', true);
        showLoginForm();
        return;
    }
    fetch('/blog-system/api/posts', {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        return response.json();
    })
    .then(posts => {
        let postHTML = '<h2>你的博客</h2>';
        if (posts.length === 0) {
            postHTML += '<p>你还没有创建任何博客。</p>';
        } else {
            posts.forEach(post => {
                postHTML += `
                    <div class="post">
                        <h3>${post.title}</h3>
                        <p>${post.content.substring(0, 150)}...</p>
                        <button onclick="showPostDetails('${post._id}')">查看详情</button>
                    </div>
                `;
            });
        }
        content.innerHTML = postHTML;
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('获取博客时出错: ' + error.message, true);
    });
}

function showPostDetails(postId) {
    console.log('Showing post details for:', postId);
    const token = localStorage.getItem('token');
    fetch(`/blog-system/api/posts/${postId}`, {
        headers: {
            'x-auth-token': token
        }
    })
    .then(response => response.json())
    .then(post => {
        content.innerHTML = `
            <h2>${post.title}</h2>
            <div id="post-content">
                ${post.content}
            </div>
            <div id="attachment-list">
                ${post.attachments.map(att => `<a href="/uploads/${att.filename}" target="_blank">${att.filename}</a>`).join('<br>')}
            </div>
            <button id="editButton">编辑博客</button>
            <button id="deleteButton">删除博客</button>
            <button onclick="showPosts()">返回列表</button>
        `;
        const editButton = document.getElementById('editButton');
        const deleteButton = document.getElementById('deleteButton');
        
        if (editButton) {
            editButton.addEventListener('click', function() {
                console.log('Edit button clicked for post:', postId);
                showEditForm(post._id, post.title, post.content);
            });
        } else {
            console.error('Edit button not found');
        }

        if (deleteButton) {
            deleteButton.addEventListener('click', function() {
                console.log('Delete button clicked for post:', postId);
                deletePost(post._id);
            });
        } else {
            console.error('Delete button not found');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred while fetching post details: ' + error.message, true);
    });
}

function showCreatePostForm() {
    console.log('Showing create post form');
    content.innerHTML = `
        <h2>创建新博客</h2>
        <form id="create-post-form">
            <input type="text" id="post-title" placeholder="标题" required>
            <div class="editor-container">
                <div class="toolbar">
                    <button type="button" onclick="formatText('bold')"><i class="fas fa-bold"></i></button>
                    <button type="button" onclick="formatText('italic')"><i class="fas fa-italic"></i></button>
                    <button type="button" onclick="formatText('strikethrough')"><i class="fas fa-strikethrough"></i></button>
                    <button type="button" onclick="formatText('link')"><i class="fas fa-link"></i></button>
                    <button type="button" onclick="formatText('unorderedList')"><i class="fas fa-list-ul"></i></button>
                    <button type="button" onclick="formatText('orderedList')"><i class="fas fa-list-ol"></i></button>
                    <button type="button" onclick="insertImage()"><i class="fas fa-image"></i></button>
                    <button type="button" onclick="formatText('horizontalRule')"><i class="fas fa-minus"></i></button>
                    <button type="button" onclick="formatText('codeBlock')"><i class="fas fa-code"></i></button>
                </div>
                <div id="editor" contenteditable="true"></div>
            </div>
            <div id="only-me-toggle">
                <input type="checkbox" id="only-me" name="only-me">
                <label for="only-me">仅自己可见</label>
            </div>
            <div id="attachment-list"></div>
            <div id="drag-drop-area">
                拖放文件到这里或者 <label for="file-input" class="file-input-label">选择文件</label>
                <input type="file" id="file-input" multiple style="display: none;">
            </div>
            <button type="submit">发布博客</button>
        </form>
    `;
    document.getElementById('create-post-form').addEventListener('submit', handleCreatePost);
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    setupDragAndDrop();
}

function formatText(format) {
    document.execCommand(format, false, null);
}

function insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.execCommand('insertImage', false, event.target.result);
            }
            reader.readAsDataURL(file);
        }
    }
    input.click();
}

function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

function setupDragAndDrop() {
    const dragDropArea = document.getElementById('drag-drop-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dragDropArea.classList.add('highlight');
    }

    function unhighlight(e) {
        dragDropArea.classList.remove('highlight');
    }

    dragDropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
}

function handleFiles(files) {
    const attachmentList = document.getElementById('attachment-list');
    [...files].forEach(file => {
        const listItem = document.createElement('div');
        listItem.className = 'attachment-item';
        listItem.innerHTML = `
            <span>${file.name}</span>
            <button onclick="removeAttachment(this)">删除</button>
        `;
        attachmentList.appendChild(listItem);
    });
}

function removeAttachment(button) {
    button.parentElement.remove();
}

function handleCreatePost(e) {
    e.preventDefault();
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('editor').innerHTML;
    const onlyMe = document.getElementById('only-me').checked;
    const token = localStorage.getItem('token');

    if (!token) {
        showMessage('请先登录再创建博客。', true);
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('onlyMe', onlyMe);

    // 添加附件
    const attachmentItems = document.querySelectorAll('.attachment-item');
    attachmentItems.forEach((item, index) => {
        const fileName = item.querySelector('span').textContent;
        const file = document.getElementById('file-input').files[fileName] || 
                     document.querySelector('#drag-drop-area input[type="file"]').files[fileName];
        if (file) {
            formData.append(`attachment${index}`, file);
        }
    });

    fetch('/blog-system/api/posts', {
        method: 'POST',
        headers: {
            'x-auth-token': token
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create post');
        }
        return response.json();
    })
    .then(data => {
        if (data._id) {
            showMessage('博客创建成功！');
            showPosts();
        } else {
            throw new Error(data.msg || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('创建博客时出错: ' + error.message, true);
    });
}

function showEditForm(postId, title, postContent) {
    console.log('showEditForm called with:', { postId, title, postContent });
    
    content.innerHTML = `
        <h2>编辑博客</h2>
        <form id="edit-post-form">
            <input type="text" id="edit-post-title" value="${title}" required>
            <div class="editor-container">
                <div class="toolbar">
                    <button type="button" onclick="formatText('bold')"><i class="fas fa-bold"></i></button>
                    <button type="button" onclick="formatText('italic')"><i class="fas fa-italic"></i></button>
                    <button type="button" onclick="formatText('strikethrough')"><i class="fas fa-strikethrough"></i></button>
                    <button type="button" onclick="formatText('link')"><i class="fas fa-link"></i></button>
                    <button type="button" onclick="formatText('unorderedList')"><i class="fas fa-list-ul"></i></button>
                    <button type="button" onclick="formatText('orderedList')"><i class="fas fa-list-ol"></i></button>
                    <button type="button" onclick="insertImage()"><i class="fas fa-image"></i></button>
                    <button type="button" onclick="formatText('horizontalRule')"><i class="fas fa-minus"></i></button>
                    <button type="button" onclick="formatText('codeBlock')"><i class="fas fa-code"></i></button>
                </div>
                <div id="editor" contenteditable="true">${postContent}</div>
            </div>
            <div id="only-me-toggle">
                <input type="checkbox" id="only-me" name="only-me">
                <label for="only-me">仅自己可见</label>
            </div>
            <div id="attachment-list"></div>
            <div id="drag-drop-area">
                拖放文件到这里或者 <label for="file-input" class="file-input-label">选择文件</label>
                <input type="file" id="file-input" multiple style="display: none;">
            </div>
            <div class="button-group">
                <button type="submit">更新博客</button>
                <button type="button" id="cancel-edit">取消</button>
            </div>
        </form>
    `;
    
    const form = document.getElementById('edit-post-form');
    const cancelButton = document.getElementById('cancel-edit');

    if (form) {
        console.log('Form element found');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Edit form submitted');
            handleEditPost(postId);
        });
        console.log('Form submit event listener added');
    } else {
        console.error('Edit form not found');
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            console.log('Edit cancelled');
            showPostDetails(postId);
        });
        console.log('Cancel button event listener added');
    } else {
        console.error('Cancel button not found');
    }

    document.getElementById('file-input').addEventListener('change', handleFileSelect);
    setupDragAndDrop();
}

function handleEditPost(postId) {
    console.log('handleEditPost called with postId:', postId);
    const title = document.getElementById('edit-post-title').value;
    const content = document.getElementById('editor').innerHTML;
    const onlyMe = document.getElementById('only-me').checked;
    const token = localStorage.getItem('token');

    if (!confirm('确定要更新这篇博客吗？')) {
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('onlyMe', onlyMe);

    // 添加附件
    const attachmentItems = document.querySelectorAll('.attachment-item');
    attachmentItems.forEach((item, index) => {
        const fileName = item.querySelector('span').textContent;
        const file = document.getElementById('file-input').files[fileName] || 
                     document.querySelector('#drag-drop-area input[type="file"]').files[fileName];
        if (file) {
formData.append(`attachment${index}`, file);
        }
    });

    fetch(`/blog-system/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
            'x-auth-token': token
        },
        body: formData
    })
    .then(response => {
        console.log('Update response received:', response);
        if (!response.ok) {
            throw new Error('Failed to update post');
        }
        return response.json();
    })
    .then(data => {
        console.log('Post updated:', data);
        showMessage('博客更新成功！');
        showPostDetails(postId);
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('更新博客时出错: ' + error.message, true);
    });
}

function deletePost(postId) {
    if (!confirm('您确定要删除这篇博客吗？')) {
        return;
    }

    const token = localStorage.getItem('token');

    fetch(`/blog-system/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
            'x-auth-token': token
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.msg === 'Post removed') {
            showMessage('博客删除成功！');
            showPosts();
        } else {
            throw new Error(data.msg || 'Failed to delete post');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('删除博客时出错: ' + error.message, true);
    });
}

function showLoginForm() {
    console.log('Showing login form');
    content.innerHTML = `
        <h2>登录</h2>
        <form id="login-form">
            <input type="email" id="login-email" placeholder="邮箱" required>
            <input type="password" id="login-password" placeholder="密码" required>
            <button type="submit">登录</button>
        </form>
    `;
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

function showRegisterForm() {
    console.log('Showing register form');
    content.innerHTML = `
        <h2>注册</h2>
        <form id="register-form">
            <input type="text" id="register-username" placeholder="用户名" required>
            <input type="email" id="register-email" placeholder="邮箱" required>
            <input type="password" id="register-password" placeholder="密码" required>
            <button type="submit">注册</button>
        </form>
    `;
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    fetch('/blog-system/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.token && data.username) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            showMessage('登录成功！');
            updateNavigation();
            showPosts();
        } else {
            throw new Error(data.msg || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('登录时出错: ' + error.message, true);
    });
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    fetch('/blog-system/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Registration failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            showMessage('注册成功！');
            updateNavigation();
            showPosts();
        } else {
            throw new Error(data.msg || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('注册时出错: ' + error.message, true);
    });
}

function updateNavigation() {
    console.log('Updating navigation');
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const nav = document.querySelector('nav');
    let userInfo = document.querySelector('.user-info');

    if (!userInfo) {
        userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        nav.parentNode.insertBefore(userInfo, nav.nextSibling);
    }

    if (token) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        createPostBtn.style.display = 'inline';
        homeBtn.style.display = 'inline';
        if (mainHomeBtn) {
            mainHomeBtn.style.display = 'inline';
        }
        
        userInfo.innerHTML = `
            <span>欢迎, ${username}!</span>
            <button id="logoutBtn">退出</button>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        loginBtn.style.display = 'inline';
        registerBtn.style.display = 'inline';
        createPostBtn.style.display = 'none';
        homeBtn.style.display = 'inline';
        if (mainHomeBtn) {
            mainHomeBtn.style.display = 'inline';
        }
        userInfo.innerHTML = '';
    }

    console.log('Navigation updated');
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    updateNavigation();
    showLoginForm();
}

// Initialize the app
function initializeApp() {
    console.log('Initializing app');
    updateNavigation();
    const token = localStorage.getItem('token');
    if (token) {
        showPosts();
    } else {
        showLoginForm();
    }
}

// Call initializeApp when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);