// script.js
function sendMessage() {
  const inputField = document.getElementById('chat-input');
  const chatHistory = document.getElementById('chat-history');
  const userMessage = inputField.value.trim();

  if (userMessage) {
    // Add user's message to chat history
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('message', 'user-message');
    userMessageElement.textContent = userMessage;
    chatHistory.appendChild(userMessageElement);
    
    // Clear the input field
    inputField.value = '';

    // Simulate bot response
    setTimeout(() => {
      const botMessageElement = document.createElement('div');
      botMessageElement.classList.add('message', 'bot-message');
      botMessageElement.textContent = "I’m a simple bot. I don’t have real responses yet!";
      chatHistory.appendChild(botMessageElement);

      // Scroll to the bottom of the chat history
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 1000);

    // Scroll to the bottom of the chat history
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}
