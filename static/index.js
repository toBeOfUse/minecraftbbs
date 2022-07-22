// Set up socket.io
const socket = io("http://localhost:3030");
// Initialize a Feathers app
const app = feathers();

// Register socket.io to talk to our server
app.configure(feathers.socketio(socket));

// Form submission handler that sends a new message
async function sendMessage() {
  const messageInput = document.getElementById("message-text");
  const senderInput = document.getElementById("sender-name");

  // Create a new message with the input field value
  await app.service("messages").create({
    text: messageInput.value,
    sender: senderInput.value,
  });

  messageInput.value = "";
}

// Renders a single message on the page
// TODO: security!
function addMessage(message) {
  document.getElementById("bbs-container").innerHTML +=
    `<li class="my-4">${message.text.replace("\n", "<br>")} - ` +
    `<span class="italic">${message.sender}</span></li>`;
}

const main = async () => {
  // Find all existing messages
  const messages = await app.service("messages").find();

  // Add existing messages to the list
  messages.forEach(addMessage);

  // Add any newly created message to the list in real-time
  app.service("messages").on("created", addMessage);
};

main();
