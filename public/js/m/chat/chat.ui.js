import { showToast } from "../../utils/toast.js";

const UI = {
    newBtn: document.querySelector('#new-fish'),
    fishTank: document.querySelector('#fish-tank'),
    catId: document.querySelector('#cat-id').querySelector('span'),
    basketTitle: document.querySelector('#basket-title'),
    fishInput: document.querySelector('#fish-input'),
    fishWrapper: document.querySelector('#fish-wrapper'),
    fishTank: document.querySelector('#fish-tank'),
    sendBtn: document.querySelector('#send-btn'),

    pendingFishBtn: document.querySelector('#pending-fish-btn'),
    pendingFishes: document.querySelector('#pending-fishes'),
    pendingBadge: document.querySelector('#pending-badge'),

    fishBaskets: document.querySelector('#fish-baskets'),
};

/**
 * Initializes the chat UI components.
 * 
 * - Displays the cat ID.
 * - Toggles showing pending list on click.
 * Called by the controller.
 */
export const InitUI = () => {
    UI.catId.textContent
        = localStorage.getItem('catId') || 'Unknown Cat ID';
    UI.pendingFishBtn.addEventListener('click', togglePendingFish);

}

/**
 * Controller event binding to set up the UI event handlers
 * Called by the controller
 * @param {*} handlers from controller
 */
export const bindEventUI = (handlers) => {
    UI.newBtn.addEventListener('click', () => handleAddFishBasket(handlers.startPM));

    UI.fishInput.addEventListener('keydown',
        event => handleSendFish(event, handlers.sendFish));
    UI.sendBtn.addEventListener('click',
        event => handleSendFish(event, handlers.sendFish));

    UI.pendingFishes.addEventListener('click',
        event => handlePendingFishClick(event, handlers.updateRoom));
}

export const loadActiveChats = async (activeChats) => {
    activeChats?.forEach(chat => {
        addFishList('active', chat.partner);
    });
}

//#### High-level, handler functions

/**
 * Handles the new fish basket button click, which shows an input text field instead of the button.
 * The input field is given focus and the user can type in a cat ID.
 * If the user presses enter, call the startPM function with the input value.
 * If the user clicks outside the input field or presses escape, the input field is replaced with the button again.
 * @param {function} startPM function is injected via controller
*/
function handleAddFishBasket(startPM) {
    const currentSpan = document.querySelector('#span-new-fish');
    if (!currentSpan) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = '';
    input.className = 'bg-gray-800 text-white px-2 py-1 rounded w-full focus:outline-none';
    input.id = 'input-new-fish';

    const reset = () => {
        const newSpan = document.createElement('span');
        newSpan.id = 'span-new-fish';
        newSpan.className = 'px-2 py-1 w-full';
        newSpan.textContent = "New Fish Basket";
        UI.newBtn.replaceChild(newSpan, input);
    };

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            if (input.value.trim() === '') {
                showToast('Please enter a valid ID', 'warning');
            } else {
                startPM(input.value.trim());
            }
            reset();
        }
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (UI.newBtn.contains(input)) {
                reset();
            }
        }, 0);
        //When entering the input, it will call the blur event immediately, so we need to delay it a bit
    });
    UI.newBtn.replaceChild(input, currentSpan);
    input.focus();
}

/**
 * Handles the send fish action triggered by either pressing 'Enter' or clicking the send button.
 * Validates input and ensures a chat session is active before sending the fish message.
 * 
 * @param {Event} e
 * @param {Function} sendFish - Send message to server. Injected via controller
 */
const handleSendFish = async (e, sendFish) => {
    const { fishInput, basketTitle, catId } = UI;
    const type = e.type;
    if (type === "keydown" && e.key === "Enter" && !e.shiftKey
        || type === "click"
    ) {
        e.preventDefault();
        if (fishInput.value.trim() === '') {
            return;
        }
        if (basketTitle.textContent === '') {
            showToast('Please start a new chat', 'warning');
            return;
        }

        const sender = catId.textContent;
        const receiver = basketTitle.textContent;
        const fishInfo = {
            text: fishInput.value,
            sender: sender,
            receiver: receiver,
            roomId: `${[sender, receiver].sort().join('-')}`
        }

        let fishKey;

        try {
            fishKey = await sendFish(fishInfo);
        } catch (error) {
            console.error(error);
        }
        renderFish('sent', fishKey);
    }

}

/**
 * Handles a click on a pending fish link. Removes the link from the pending list, adds it to the active list. Updates the room type.
 * @param {Event} e
 * @param {Function} updateRoom - ChatModel.updateRoom injected via controller, updates the room type (pending -> active)
 */
const handlePendingFishClick = (e, updateRoom) => {
    const { pendingFishes, pendingBadge, catId } = UI;
    const clickedLink = e.target.closest("li");
    if (clickedLink && pendingFishes.contains(clickedLink)) {
        e.preventDefault();
        if (pendingFishes.querySelectorAll('li').length === 1) {
            togglePendingFish();
        }
        pendingFishes.removeChild(clickedLink);
        togglePendingBadge();

        const partner = clickedLink.querySelector("a").textContent;
        addFishList('active', partner);

        // Update the room
        const currentId = catId.textContent;
        const roomId = `${[currentId, partner].sort().join('-')}`;
        updateRoom(roomId, 'active', partner);
    }
}

//####  Export Functions called by controller
/**
 * Check if the message sent by the current user should be ignored.
 * Called by controller when handling Websocket event 'sendFish'
 * @param {*} sender 
 * @returns 
 */
export const shouldIgnoreOwnMessage = (sender) => {
    // Ignore fish sent by the current user. Cuz the server will send to all users in the room, even the current user. 
    if (sender === UI.catId.textContent) {
        //note: It is possible to update the status of the sent message, without the need for the server to send another response. 
        // Issue: Reliability. Others may not receive it because of a connection, network error, or something else.
        return true;
    }
    return false;
}
export const renderFish = (type, fishKey, message = '') => {
    // Validate the message type
    if (type !== 'sent' && type !== 'received') {
        throw new Error(`Invalid message type: ${type}. It should be 'sent' or 'received'.`);
    }

    const poisition = type === 'sent' ? 'right' : 'left';
    const { fishInput, fishTank, fishWrapper } = UI;

    // Create a new div for fish message
    const fishItem = document.createElement('div');
    fishItem.className = `fish-${poisition}`;
    fishItem.id = fishKey;

    const bubble = document.createElement('div');
    bubble.className = `bubble-${poisition}`;


    const fishText = document.createElement('p');
    fishText.className = "fish-text";

    if (type === 'sent') {
        const fish_text = fishInput.value;
        fishText.innerText = fish_text.trimEnd();
        const status = document.createElement('span');
        status.className = "bubble-status";
        status.textContent = "Delivered";
        fishItem.appendChild(status);
        // Clear the input field
        fishInput.value = '';
    } else {
        fishText.innerText = message.trimEnd();
    }

    bubble.appendChild(fishText);
    fishItem.prepend(bubble);

    // Add the new fish message to the chat box
    fishTank.appendChild(fishItem);
    // Scroll to the bottom of the chat box
    fishWrapper.scrollTop = fishWrapper.scrollHeight;
}

export const addFishList = async (type, title) => {
    if (type !== 'pending' && type !== 'active') {
        throw new Error(`Invalid message list type: ${type}. It should be 'pending' or 'active'.`);
    }
    // Check if the fish is already in the list
    if (isDuplicate(type, title)) {
        return;
    }

    const { pendingFishes, fishBaskets, pendingBadge } = UI;

    const li = document.createElement("li");
    li.className = "w-full rounded-md hover:bg-gray-700 p-1";

    const a = document.createElement("a");
    a.href = "#";
    a.className = "w-full px-2 py-1 block";
    a.textContent = title;

    li.appendChild(a);

    const Add = {
        pending: () => {
            pendingFishes.prepend(li);
            togglePendingBadge();
        },
        active: () => fishBaskets.prepend(li)
    };

    Add[type]();

}

/**
 * Update the UI for a new chat. Clear the chat box, set the title, and focus on the input field
 * Called by: ChatService.handleStartPMStatus (injected via Controller)
 * Triggered indirectly by: WebSocket event 'startPMStatus'
 * @param {*} receiver set the title
 */
export const newChat = (receiver) => {
    UI.fishTank.innerHTML = '';
    UI.basketTitle.textContent = receiver;
    UI.fishInput.focus();
    addFishList('active', receiver);
}

//### UI Helper Functions
/**
 * Toggle the pending badge based on the number of pending chats
 * @description
 *  - If there are no pending chats, hide the badge
 *  - If there are pending chats, show the badge and update the text content
 * Called by: addFishList, handlePendingFishClick
 */
const togglePendingBadge = () => {
    const size = UI.pendingFishes.querySelectorAll('li').length;
    UI.pendingBadge.textContent = size;
    if (size === 0) {
        UI.pendingBadge.classList.add('hidden');
    } else {
        UI.pendingBadge.classList.remove('hidden');
    }
};

/**
 * Check if the chat is already in the list.
 * Called by: addFishList
 * @param {string} type pending | active
 * @param {string} title partner id
 * @returns 
 */
const isDuplicate = (type, title) => {
    const listEl = type === 'pending' ? UI.pendingFishes : UI.fishBaskets;
    const list = Array.from(listEl.querySelectorAll('li'));

    return list.some(item => item.querySelector('a').textContent === title);
}

/**
 * Toggles the visibility of the pending fish list and adjusts the size of the fish baskets.
 * 
 * - If there is at least one pending fish, toggles the hidden class on the pending fish list.
 * - If there are fewer than three pending fish, exits early without adjusting the fish baskets.
 * - Otherwise, switches the fish baskets between a large and small maximum height class.
 */
function togglePendingFish() {
    const { pendingFishes, fishBaskets } = UI;

    const sizeList = pendingFishes.querySelectorAll('li').length;
    if (sizeList >= 1) {
        pendingFishes.classList.toggle("hidden");
    }
    if (sizeList < 3) {
        return;
    }


    //response fishBaskets
    const large = 'max-h-[78%]';
    const small = 'max-h-[58%]';
    // Check current class
    const from = fishBaskets.classList.contains(large) ? large : small;
    const to = from === large ? small : large;

    fishBaskets.classList.replace(from, to);

}

export const loadingCompleted = () => {
    const loader = document.querySelector('#loader');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const diagonal = Math.sqrt(width ** 2 + height ** 2);
    const circle = document.querySelector('.circle');

    const deriveScale = diagonal / circle.scrollWidth;
    circle.style.transform = `scale(${deriveScale})`;
    setTimeout(() => { loader.remove() }, 700);
}