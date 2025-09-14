// Chatbot functionality
class SimpleChatbot {
    constructor() {
        this.isOpen = true;
        this.isTyping = false;
        this.messageCount = 0;
        this.conversationHistory = [];
        this.apiBaseUrl = 'https://ngrok.com/r/http-request';
        this.ollamaConnected = false;
        
        // Initialize the chatbot
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateNotificationBadge();
        this.checkOllamaConnection();
    }
    
    setupEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.querySelector('.send-btn');
        
        // Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Send message on button click
        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Auto-resize input
        messageInput.addEventListener('input', () => {
            this.autoResizeInput(messageInput);
        });
    }
    
    autoResizeInput(input) {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    }
    
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (message === '') return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: message });
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send message to Ollama backend
            const response = await this.sendToOllama(message);
            
            this.hideTypingIndicator();
            
            if (response.success) {
                this.addMessage(response.response, 'bot');
                this.conversationHistory.push({ role: 'bot', content: response.response });
            } else {
                // Fallback to local responses if Ollama fails
                const fallbackResponse = this.generateResponse(message);
                this.addMessage(fallbackResponse, 'bot');
                this.conversationHistory.push({ role: 'bot', content: fallbackResponse });
                
                // Show error message
                this.addMessage(`⚠️ ${response.response}`, 'bot');
            }
        } catch (error) {
            this.hideTypingIndicator();
            console.error('Error sending message to Ollama:', error);
            
            // Fallback to local responses
            const fallbackResponse = this.generateResponse(message);
            this.addMessage(fallbackResponse, 'bot');
            this.conversationHistory.push({ role: 'bot', content: fallbackResponse });
            
            // Show connection error
            this.addMessage('⚠️ Cannot connect to Ollama. Using fallback responses.', 'bot');
        }
    }
    
    sendQuickReply(message) {
        const messageInput = document.getElementById('messageInput');
        messageInput.value = message;
        this.sendMessage();
    }
    
    async checkOllamaConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            
            this.ollamaConnected = data.ollama_connected;
            
            if (this.ollamaConnected) {
                this.addMessage(`🤖 Connected to Ollama! Using model: ${data.current_model}`, 'bot');
                console.log('Available models:', data.available_models);
            } else {
                this.addMessage('⚠️ Ollama not detected. Using fallback responses.', 'bot');
            }
        } catch (error) {
            console.error('Error checking Ollama connection:', error);
            this.ollamaConnected = false;
            this.addMessage('⚠️ Backend server not running. Using fallback responses.', 'bot');
        }
    }
    
    async sendToOllama(message) {
        const response = await fetch(`${this.apiBaseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/models`);
            const data = await response.json();
            return data.models;
        } catch (error) {
            console.error('Error getting models:', error);
            return [];
        }
    }
    
    async setModel(modelName) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/model`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model: modelName })
            });
            
            const data = await response.json();
            if (data.success) {
                this.addMessage(`✅ Switched to model: ${modelName}`, 'bot');
            } else {
                this.addMessage(`❌ Failed to switch model: ${data.error}`, 'bot');
            }
            return data;
        } catch (error) {
            console.error('Error setting model:', error);
            this.addMessage('❌ Error switching model', 'bot');
            return { success: false, error: error.message };
        }
    }
    
    async clearConversation() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/clear`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                this.conversationHistory = [];
                const chatMessages = document.getElementById('chatMessages');
                chatMessages.innerHTML = `
                    <div class="message bot-message">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <p>Conversation cleared! How can I help you today?</p>
                            <span class="message-time">Just now</span>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error clearing conversation:', error);
        }
    }
    
    async handleModelsCommand() {
        try {
            const models = await this.getAvailableModels();
            if (models.length > 0) {
                const modelsList = models.map(model => `• ${model}`).join('\n');
                this.addMessage(`📦 Available models:\n${modelsList}\n\nUse /model <name> to switch models.`, 'bot');
            } else {
                this.addMessage('❌ No models found. Make sure Ollama is running and has models installed.', 'bot');
            }
        } catch (error) {
            console.error('Error getting models:', error);
            this.addMessage('❌ Error retrieving models list.', 'bot');
        }
    }
    
    addMessage(content, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const currentTime = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'bot' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <p>${this.formatMessage(content)}</p>
                <span class="message-time">${currentTime}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Update notification count if chat is minimized
        if (!this.isOpen) {
            this.messageCount++;
            this.updateNotificationBadge();
        }
    }
    
    formatMessage(content) {
        // Simple formatting for links and basic text
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    }
    
    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.classList.add('show');
        this.isTyping = true;
        
        // Scroll to bottom
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.classList.remove('show');
        this.isTyping = false;
    }
    
    generateResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Special commands for Ollama management
        if (message.startsWith('/models')) {
            this.handleModelsCommand();
            return '';
        }
        
        if (message.startsWith('/model ')) {
            const modelName = userMessage.substring(7).trim();
            this.setModel(modelName);
            return '';
        }
        
        if (message.startsWith('/clear')) {
            this.clearConversation();
            return '';
        }
        
        if (message.startsWith('/status')) {
            this.checkOllamaConnection();
            return '';
        }
        
        // Greeting responses
        if (this.containsAny(message, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
            return this.getRandomResponse([
                "Hello! How can I help you today?",
                "Hi there! What can I do for you?",
                "Hey! Nice to meet you. How may I assist you?",
                "Hello! I'm here to help. What do you need?"
            ]);
        }
        
        // Help responses
        if (this.containsAny(message, ['help', 'support', 'assist'])) {
            return this.getRandomResponse([
                "I'm here to help! You can ask me about various topics, get information, or just have a conversation. What would you like to know?",
                "I can help you with questions, provide information, or just chat! What do you need assistance with?",
                "Sure! I can help with general questions, provide explanations, or just have a friendly conversation. What's on your mind?"
            ]);
        }
        
        // Capability questions
        if (this.containsAny(message, ['what can you do', 'what do you do', 'capabilities', 'features'])) {
            return "I can help you with various tasks like answering questions, providing information, having conversations, helping with problem-solving, and more! Just ask me anything you'd like to know.";
        }
        
        // Weather questions
        if (this.containsAny(message, ['weather', 'temperature', 'rain', 'sunny', 'cloudy'])) {
            return "I don't have access to real-time weather data, but I'd recommend checking a weather app or website for current conditions in your area!";
        }
        
        // Time questions
        if (this.containsAny(message, ['time', 'date', 'what time', 'current time'])) {
            const now = new Date();
            return `The current time is ${now.toLocaleTimeString()} and the date is ${now.toLocaleDateString()}.`;
        }
        
        // Thank you responses
        if (this.containsAny(message, ['thank you', 'thanks', 'appreciate'])) {
            return this.getRandomResponse([
                "You're welcome! Happy to help!",
                "My pleasure! Is there anything else I can help you with?",
                "You're very welcome! Feel free to ask if you need anything else.",
                "Glad I could help! Let me know if you have more questions."
            ]);
        }
        
        // Goodbye responses
        if (this.containsAny(message, ['bye', 'goodbye', 'see you', 'farewell', 'exit', 'quit'])) {
            return this.getRandomResponse([
                "Goodbye! Have a great day!",
                "See you later! Take care!",
                "Bye! Feel free to come back anytime!",
                "Farewell! It was nice chatting with you!"
            ]);
        }
        
        // How are you responses
        if (this.containsAny(message, ['how are you', 'how do you do', 'how\'s it going'])) {
            return this.getRandomResponse([
                "I'm doing great, thank you for asking! How are you doing today?",
                "I'm functioning perfectly! How can I help you today?",
                "I'm doing well! Ready to assist you with whatever you need.",
                "All systems are running smoothly! How are you doing?"
            ]);
        }
        
        // Name questions
        if (this.containsAny(message, ['what is your name', 'who are you', 'what\'s your name'])) {
            return "I'm ChatBot Assistant, your friendly AI helper! I'm here to assist you with questions, conversations, and provide helpful information.";
        }
        
        // Age questions
        if (this.containsAny(message, ['how old are you', 'what\'s your age', 'age'])) {
            return "I'm an AI assistant, so I don't have an age in the traditional sense! I was created to help and assist users like you.";
        }
        
        // Joke requests
        if (this.containsAny(message, ['joke', 'funny', 'humor', 'laugh'])) {
            return this.getRandomResponse([
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                "What do you call a fake noodle? An impasta! 🍝",
                "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
                "What do you call a bear with no teeth? A gummy bear! 🐻"
            ]);
        }
        
        // Math questions (simple)
        if (message.includes('+') || message.includes('-') || message.includes('*') || message.includes('/') || message.includes('=')) {
            try {
                // Simple math evaluation (be careful with eval in production)
                const mathExpression = message.replace(/[^0-9+\-*/().\s]/g, '');
                if (mathExpression && /^[0-9+\-*/().\s]+$/.test(mathExpression)) {
                    const result = eval(mathExpression);
                    return `The answer is: ${result}`;
                }
            } catch (e) {
                return "I can help with basic math! Try asking something like 'What is 5 + 3?' or 'Calculate 10 * 2'";
            }
        }
        
        // Default responses
        return this.getRandomResponse([
            "That's interesting! Can you tell me more about that?",
            "I understand. How can I help you with that?",
            "That's a great question! Let me think about that...",
            "I see what you mean. What would you like to know more about?",
            "Thanks for sharing that with me! Is there anything specific you'd like help with?",
            "I'm here to help! Could you provide a bit more detail about what you're looking for?",
            "That sounds interesting! What would you like to explore further?",
            "I'm listening! How can I assist you with this topic?"
        ]);
    }
    
    containsAny(str, keywords) {
        return keywords.some(keyword => str.includes(keyword));
    }
    
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    toggleChat() {
        const chatbotContainer = document.querySelector('.chatbot-container');
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            chatbotContainer.classList.remove('minimized');
            chatToggleBtn.classList.add('hidden');
            this.messageCount = 0;
            this.updateNotificationBadge();
        } else {
            chatbotContainer.classList.add('minimized');
            chatToggleBtn.classList.remove('hidden');
        }
    }
    
    closeChat() {
        const chatbotContainer = document.querySelector('.chatbot-container');
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        
        this.isOpen = false;
        chatbotContainer.classList.add('minimized');
        chatToggleBtn.classList.remove('hidden');
    }
    
    updateNotificationBadge() {
        const notificationBadge = document.getElementById('notificationBadge');
        if (this.messageCount > 0) {
            notificationBadge.textContent = this.messageCount;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
}

// Global functions for HTML onclick events
let chatbot;

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', function() {
    chatbot = new SimpleChatbot();
});

// Global functions
function sendMessage() {
    if (chatbot) {
        chatbot.sendMessage();
    }
}

function sendQuickReply(message) {
    if (chatbot) {
        chatbot.sendQuickReply(message);
    }
}

function toggleChat() {
    if (chatbot) {
        chatbot.toggleChat();
    }
}

function closeChat() {
    if (chatbot) {
        chatbot.closeChat();
    }
}

// Add some fun features
document.addEventListener('DOMContentLoaded', function() {
    // Add click animation to send button
    const sendBtn = document.querySelector('.send-btn');
    sendBtn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
    
    // Add focus effect to input
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    messageInput.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
    
    // Add some personality with random tips
    const tips = [
        "💡 Tip: You can ask me about anything!",
        "🤖 Fun fact: I love helping people!",
        "✨ Did you know? I can help with math problems!",
        "🎯 Pro tip: Try asking me for a joke!",
        "🌟 I'm always here to chat and help!"
    ];
    
    // Show a random tip after 30 seconds of inactivity
    let tipTimer;
    const showRandomTip = () => {
        if (chatbot && chatbot.isOpen && !chatbot.isTyping) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            chatbot.addMessage(randomTip, 'bot');
        }
    };
    
    // Reset timer on any user activity
    const resetTipTimer = () => {
        clearTimeout(tipTimer);
        tipTimer = setTimeout(showRandomTip, 30000); // 30 seconds
    };
    
    messageInput.addEventListener('input', resetTipTimer);
    document.addEventListener('click', resetTipTimer);
    
    // Start the timer
    resetTipTimer();
});

