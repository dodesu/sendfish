// This file is part of the Chat module for the web application.
try {
    await import('/js/m/chat/chat.js');
    await import('/js/m/chat/chat.ui.js');
} catch (error) {
    console.error('Index import error:', error);
}

// This file is responsible for initializing the chat functionality and setting up event listeners.
import { newFishBasket } from "./chat.ui.js";

const newBtn = document.querySelector('#new-fish');
newBtn.addEventListener('click', () => newFishBasket(newBtn));

