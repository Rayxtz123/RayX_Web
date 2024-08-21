// DOM elements
const content = document.getElementById('content');
const homeBtn = document.getElementById('home');
const loginBtn = document.getElementById('login');
const registerBtn = document.getElementById('register');
const createPostBtn = document.getElementById('create-post');
const mainHomeBtn = document.getElementById('main-home');
const toggleFormatBtn = document.getElementById('toggle-format');

let isMarkdownMode = false;

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
toggleFormatBtn.addEventListener('click', toggleFormat);
if (mainHomeBtn) {
    mainHomeBtn.addEventListener('click', function() {
        window.location.href = '/';
    });
}

function toggleFormat() {
    isMarkdownMode = !isMarkdownMode;
    const formatIndicator = document.getElementById('format-indicator');
    if (formatIndicator) {
        formatIndicator.textContent = isMarkdownMode ? 'Markdown 格式' : '普通文本';
    }
    const postContent = document.getElementById('post-content');
    if (postContent) {
        if (isMarkdownMode) {
            postContent.style.fontFamily = 'monospace';
        } else {
            postContent.style.fontFamily = 'inherit';
        }
    }
}

// Functions to show different views
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
        const formattedContent = post.isMarkdown ? marked(post.content) : post.content;
        content.innerHTML = `
            <h2>${post.title}</h2>
            <div id="post-content" class="${post.isMarkdown ? 'markdown-content' : ''}">
                ${formattedContent}
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
                showEditForm(post._id, post.title, post.content, post.isMarkdown);
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

function showEditForm(postId, title, postContent, isMarkdown) {
    console.log('showEditForm called with:', { postId, title, postContent, isMarkdown });
    
    const formContainer = document.createElement('div');
    formContainer.innerHTML = `
        <h2>编辑博客</h2>
        <form id="edit-post-form">
            <input type="text" id="edit-post-title" value="${title}" required>
            <textarea id="edit-post-content" required style="width: 100%; height: 200px;">${postContent}</textarea>
            <div id="format-indicator">${isMarkdown ? 'Markdown 格式' : '普通文本'}</div>
            <div class="button-group">
                <button type="submit">更新博客</button>
                <button type="button" id="cancel-edit">取消</button>
            </div>
        </form>
    `;
    
    content.innerHTML = '';
    content.appendChild(formContainer);
    
    console.log('Edit form HTML set');
    
    const form = document.getElementById('edit-post-form');
    const cancelButton = document.getElementById('cancel-edit');

    if (form) {
        console.log('Form element found');
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Edit form submitted');
            handleEditPost(postId, isMarkdown);
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

    isMarkdownMode = isMarkdown;
    toggleFormat();
}

function handleEditPost(postId, isMarkdown) {
    console.log('handleEditPost called with postId:', postId);
    const title = document.getElementById('edit-post-title').value;
    const content = document.getElementById('edit-post-content').value;
    const token = localStorage.getItem('token');

    if (!confirm('确定要更新这篇博客吗？')) {
        return;
    }

    console.log('Sending update request with:', { title, content, isMarkdown });

    fetch(`/blog-system/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
        },
        body: JSON.stringify({ title, content, isMarkdown }),
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

function showLoginForm() {
    console.log('Showing login form');
    content.innerHTML = `
        <h2>Login</h2>
        <form id="login-form">
            <input type="email" id="login-email" placeholder="Email" required>
            <input type="password" id="login-password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
    `;
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

function showRegisterForm() {
    console.log('Showing register form');
    content.innerHTML = `
        <h2>Register</h2>
        <form id="register-form">
            <input type="text" id="register-username" placeholder="Username" required>
            <input type="email" id="register-email" placeholder="Email" required>
            <input type="password" id="register-password" placeholder="Password" required>
            <button type="submit">Register</button>
        </form>
    `;
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

function showCreatePostForm() {
    console.log('Showing create post form');
    content.innerHTML = `
        <h2>Create New Post</h2>
        <form id="create-post-form">
            <input type="text" id="post-title" placeholder="Title" required>
            <textarea id="post-content" placeholder="Content" required></textarea>
            <div id="format-indicator">普通文本</div>
            <button type="submit">Create Post</button>
        </form>
    `;
    document.getElementById('create-post-form').addEventListener('submit', handleCreatePost);
    isMarkdownMode = false;
    toggleFormat();
}

// Handle form submissions
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
            showMessage('Login successful!');
            updateNavigation();
            showPosts();
        } else {
            throw new Error(data.msg || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred during login: ' + error.message, true);
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
            showMessage('Registration successful!');
            updateNavigation();
            showPosts();
        } else {
            throw new Error(data.msg || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred during registration: ' + error.message, true);
    });
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    updateNavigation();
    showLoginForm();
}

function handleCreatePost(e) {
    e.preventDefault();
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const token = localStorage.getItem('token');

    if (!token) {
        showMessage('Please login to create a post.', true);
        return;
    }

    fetch('/blog-system/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
        },
        body: JSON.stringify({ title, content, isMarkdown: isMarkdownMode }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create post');
        }
        return response.json();
    })
    .then(data => {
        if (data._id) {
            showMessage('Post created successfully!');
            showPosts();
        } else {
            throw new Error(data.msg || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred while creating the post: ' + error.message, true);
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
            showMessage('Post deleted successfully!');
            showPosts();
        } else {
            throw new Error(data.msg || 'Failed to delete post');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('An error occurred while deleting the post: ' + error.message, true);
    });
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