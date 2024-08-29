const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const clearButton = document.createElement('button');
const API_URL = 'http://43.153.65.171:5000/api/chat';

clearButton.textContent = '清除历史';
clearButton.id = 'clear-button';
document.querySelector('.container').insertBefore(clearButton, document.querySelector('main'));

const modelSelect = document.getElementById('model-select');
let selectedModel = modelSelect.value;
let isChatStarted = false;

sendButton.addEventListener('click', sendMessage);
clearButton.addEventListener('click', clearChat);
messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

modelSelect.addEventListener('change', function() {
    if (!isChatStarted) {
        selectedModel = this.value;
    } else {
        alert('聊天已经开始，无法更改模型。');
        this.value = selectedModel;
    }
});

async function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        isChatStarted = true;
        modelSelect.disabled = true;
        addMessage('user', message);
        messageInput.value = '';
        sendButton.disabled = true;
        sendButton.textContent = '发送中...';
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, model: selectedModel }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            addMessage('ai', data.reply);
        } catch (error) {
            console.error('Error:', error);
            addMessage('ai', 'Sorry, an error occurred while processing your request.');
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = '发送';
        }
    }
}

function addMessage(sender, content) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    saveChat();
}

function clearChat() {
    chatMessages.innerHTML = '';
    localStorage.removeItem('chatHistory');
    isChatStarted = false;
    modelSelect.disabled = false;
}

function saveChat() {
    const chatHistory = chatMessages.innerHTML;
    localStorage.setItem('chatHistory', chatHistory);
    localStorage.setItem('selectedModel', selectedModel);
}

function loadChat() {
    const chatHistory = localStorage.getItem('chatHistory');
    if (chatHistory) {
        chatMessages.innerHTML = chatHistory;
        isChatStarted = true;
        modelSelect.disabled = true;
    }
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
        selectedModel = savedModel;
        modelSelect.value = savedModel;
    }
}

loadChat();