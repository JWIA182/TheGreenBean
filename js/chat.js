// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAVl5tdbfwCSasozYObL1kycStf3ALGL-Y",
  authDomain: "greenbeanchat-b70b5.firebaseapp.com",
  databaseURL: "https://greenbeanchat-b70b5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "greenbeanchat-b70b5",
  storageBucket: "greenbeanchat-b70b5.appspot.com",
  messagingSenderId: "638536459484",
  appId: "1:638536459484:web:256598e18b595a2431c019",
  measurementId: "G-1JSPS13LKK"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const chatMessagesRef = database.ref('chat-messages');

let currentUsername = 'Anonymous';

// Set the user's name
const nameInputElement = document.getElementById('name-input');
const nameSubmitButton = document.getElementById('name-submit');

nameSubmitButton.addEventListener('click', () => {
  const newUsername = nameInputElement.value.trim();
  if (newUsername) {
      currentUsername = newUsername;
      nameInputElement.value = '';
  }
});

// Get chat messages from the database and display them
chatMessagesRef.orderByChild('timestamp').on('child_added', (snapshot) => {
  const messageData = snapshot.val();
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  const usernameElement = document.createElement('span');
  usernameElement.classList.add('username');
  usernameElement.textContent = messageData.username + ': ';
  messageElement.appendChild(usernameElement);

  const messageTextElement = document.createElement('span');
  messageTextElement.textContent = messageData.message;
  messageElement.appendChild(messageTextElement);

  document.getElementById('chat-messages').appendChild(messageElement);

  // Scroll to the bottom of the chat messages
  const chatMessagesElement = document.getElementById('chat-messages');
  chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
});

// Send a new message
const chatInputElement = document.getElementById('chat-input');
const chatSendButton = document.getElementById('chat-send');

chatSendButton.addEventListener('click', () => {
  const message = chatInputElement.value.trim();
  if (message) {
      chatMessagesRef.push({
          username: currentUsername,
          message: message,
          timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      chatInputElement.value = '';
  }
});

// Responsive chat container width
const chatContainer = document.querySelector('.chat-container');

function updateChatContainerWidth() {
    const windowWidth = window.innerWidth;
    const maxWidth = 500; // Maximum width for the chat container
    const padding = 20; // Padding on both sides

    const newWidth = Math.min(windowWidth - 2 * padding, maxWidth);

    chatContainer.style.width = `${newWidth}px`;
}

updateChatContainerWidth();
window.addEventListener('resize', updateChatContainerWidth);