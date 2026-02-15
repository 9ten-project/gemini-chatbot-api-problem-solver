document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const sendButton = chatForm.querySelector('button[type="submit"]');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // State
    let conversation = [];
    let isFetching = false;
    const sendIcon = '&#10148;'; // Arrow icon
    const loadingIcon = '...';

    // --- Theme Switcher ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    };

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Set initial button icon
    sendButton.innerHTML = sendIcon;

    /**
     * Safely creates and appends a message to the chat box.
     * @param {string} role - The role of the message sender ('user' or 'bot').
     * @param {string} content - The message content (can be plain text or HTML).
     * @param {('text'|'html')} type - The type of content being passed.
     * @returns {HTMLElement} The created message element.
     */
    const addMessageToChatBox = (role, content, type = 'text') => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}-message`;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'content';

        if (type === 'html') {
            contentWrapper.innerHTML = content;
        } else {
            contentWrapper.textContent = content;
        }
        
        messageElement.appendChild(contentWrapper);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        return messageElement;
    };

    // --- Chat Form Submission ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isFetching) return;

        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        isFetching = true;
        userInput.disabled = true;
        sendButton.disabled = true;
        sendButton.innerHTML = loadingIcon;

        addMessageToChatBox('user', userMessage, 'text');
        conversation.push({ role: 'user', text: userMessage });
        userInput.value = '';

        const thinkingMessageElement = addMessageToChatBox('bot', 'Thinking...', 'text');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation }),
            });

            const thinkingContent = thinkingMessageElement.querySelector('.content');
            let hasError = false;

            if (response.ok) {
                const data = await response.json();
                if (data && data.result) {
                    // Parse the markdown response to HTML
                    const botResponseHtml = marked.parse(data.result);
                    thinkingContent.innerHTML = botResponseHtml;
                    // Save the raw markdown text to conversation history
                    conversation.push({ role: 'model', text: data.result });
                } else {
                    thinkingContent.textContent = 'Sorry, no response received.';
                    hasError = true;
                }
            } else {
                thinkingContent.textContent = 'Failed to get response from server.';
                hasError = true;
            }
            
            if (hasError) {
                thinkingMessageElement.classList.add('error');
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            thinkingMessageElement.querySelector('.content').textContent = 'Failed to get response from server.';
            thinkingMessageElement.classList.add('error');
        } finally {
            isFetching = false;
            userInput.disabled = false;
            sendButton.disabled = false;
            sendButton.innerHTML = sendIcon;
            userInput.focus();
        }
    });
});
