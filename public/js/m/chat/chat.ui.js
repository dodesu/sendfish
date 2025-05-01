import { showToast } from "../toast.js";
import {
    startPM,
    generateSharedAESKey,
    sendFish as sendFishToServer,
    decryptMsg,
    importAESKey
} from "./chat.js";
import { saveFish } from "../history/chat-history.js";

const pendingList = new Set();

const UI = {
    newBtn: document.querySelector('#new-fish'),
    fishTank: document.querySelector('#fish-tank'),
    catId: document.querySelector('#cat-id'),
    basketTitle: document.querySelector('#basket-title'),
    fishInput: document.querySelector('#fish-input'),
    fishWrapper: document.querySelector('#fish-wrapper'),
    fishTank: document.querySelector('#fish-tank'),
    sendBtn: document.querySelector('#send-btn'),
    pendingFishBtn: document.querySelector('#pending-fish-btn'),
    pendingFishes: document.querySelector('#pending-fishes'),
    fishBaskets: document.querySelector('#fish-baskets'),
};

export const InitUI = () => {
    UI.newBtn.addEventListener('click', handleAddFishBasket);
    // Display the cat ID in the UI
    UI.catId.querySelector('span').textContent
        = `CAT ID: ${localStorage.getItem('catId')}` || 'Unknown Cat ID';
    UI.fishInput.addEventListener('keydown', handleSendFish);
    UI.sendBtn.addEventListener('click', handleSendFish);
    UI.pendingFishBtn.addEventListener('click', togglePendingFish);
    UI.pendingFishes.addEventListener('click', handlePendingFishClick);
}

//### UI Event Handlers
function handleAddFishBasket() {
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
                addFishList('basket', input.value.trim());
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

const handleSendFish = async (e) => {
    const type = e.type;
    if (type === "keydown" && e.key === "Enter" && !e.shiftKey
        || type === "click"
    ) {
        e.preventDefault();
        if (UI.fishInput.value.trim() === '') {
            return;
        }
        if (UI.basketTitle.textContent === '') {
            showToast('Please start a new chat', 'warning');
            return;
        }
        let fishDivId;
        try {
            fishDivId = await sendFish();
        } catch (error) {
            console.error(error);
        }
        renderFish('sent', fishDivId);
    }

}

const handlePendingFishClick = (e) => {
    const { pendingFishes } = UI;
    const clickedLink = e.target.closest("li");
    if (clickedLink && pendingFishes.contains(clickedLink)) {
        e.preventDefault();
        pendingFishes.removeChild(clickedLink);
        const title = clickedLink.querySelector("a").textContent;
        addFishList('basket', title);
    }
}

function togglePendingFish() {
    const { pendingFishes, fishBaskets } = UI;
    pendingFishes.classList.toggle("hidden");

    //response fishBaskets
    const large = 'max-h-[78%]';
    const small = 'max-h-[58%]';
    // Check current class
    const from = fishBaskets.classList.contains(large) ? large : small;
    const to = from === large ? small : large;

    fishBaskets.classList.replace(from, to);

}

//### WS Event Handlers
export const handleReceiveFish = async (fish) => {
    const { sender } = fish;
    // Ignore fish sent by the current user. Cuz the server will send to all users in the room, even the current user. 
    if (sender === localStorage.getItem('catId')) {
        //note: It is possible to update the status of the sent message, without the need for the server to send another response. 
        // Issue: Reliability. Others may not receive it because of a connection, network error, or something else.
        return;
    }

    const { roomId, fishEncrypt, id } = fish;

    let fishText = '';
    try {
        const AESkeyBase64 = localStorage.getItem(roomId);
        const AESkey = await importAESKey(AESkeyBase64);
        fishText = await decryptMsg(AESkey, fishEncrypt);
    } catch (error) {
        console.error("Error decrypting message", error);
    }

    try {
        await saveFish(fish);
    } catch (error) {
        console.error("Error saving message to the database: ", error);
    }
    const fishDivId = `${roomId}${id}`;
    renderFish('received', fishDivId, fishText);
}

export const handlePendingFish = async (fish) => {
    const { sender } = fish;
    if (!pendingList.has(sender)) {
        pendingList.add(sender);
        addFishList('pending', sender);
    }

    try {
        await saveFish(fish);
    } catch (error) {
        console.error("Error saving message to the database: ", error);
    }
}

export const handleStartPMStatus = (res) => {
    history.pushState({}, '', `/c/${res.roomId}`);
    // Update the URL without reloading the page
    try {
        generateSharedAESKey(res);
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Error generating shared AES key:', error);
        return;
    }

    UI.fishTank.innerHTML = '';
    UI.basketTitle.textContent = res.receiver;
    UI.fishInput.focus();
    showToast('New chat started!', 'success');
}

//### UI Functions
const renderFish = (type, fishDivId, message = '') => {
    // Validate the message type
    if (type !== 'sent' && type !== 'received') {
        throw new Error(`Invalid message type: ${type}. It should be 'sent' or 'received'.`);
    }

    const poisition = type === 'sent' ? 'right' : 'left';
    const { fishInput, fishTank, fishWrapper } = UI;
    const fish_text = fishInput.value;

    // Create a new div for fish message
    const fishDiv = document.createElement('div');
    fishDiv.className = `fish-${poisition}`;
    fishDiv.id = fishDivId;

    const bubble = document.createElement('div');
    bubble.className = `bubble-${poisition}`;


    const fishText = document.createElement('p');
    fishText.className = "fish-text";

    if (type === 'sent') {
        fishText.innerText = fish_text.trimEnd();
        const status = document.createElement('span');
        status.className = "bubble-status";
        status.textContent = "Delivered";
        fishDiv.appendChild(status);
        // Clear the input field
        fishInput.value = '';
    } else {
        fishText.innerText = message.trimEnd();
    }

    bubble.appendChild(fishText);
    fishDiv.prepend(bubble);

    // Add the new fish message to the chat box
    fishTank.appendChild(fishDiv);
    // Scroll to the bottom of the chat box
    fishWrapper.scrollTop = fishWrapper.scrollHeight;
}

/**
 * Prepare and send fish to the server.
 * @returns Key of messages in the database
 */
const sendFish = async () => {
    const sender = localStorage.getItem('catId');
    const receiver = UI.basketTitle.textContent;
    const fishInfo = {
        text: UI.fishInput.value,
        sender: sender,
        receiver: receiver,
        roomId: `${[sender, receiver].sort().join('-')}`
    }
    return await sendFishToServer(fishInfo);
}

const addFishList = async (type, title) => {
    if (type !== 'pending' && type !== 'basket') {
        throw new Error(`Invalid message list type: ${type}. It should be 'pending' or 'basket'.`);
    }

    const { pendingFishes, fishBaskets } = UI;

    const li = document.createElement("li");
    li.className = "w-full rounded-md hover:bg-gray-700 p-1";

    const a = document.createElement("a");
    a.href = "#";
    a.className = "w-full px-2 py-1 block";
    a.textContent = title;

    li.appendChild(a);
    if (type === 'pending') {
        pendingFishes.prepend(li);
    } else {
        fishBaskets.prepend(li);
    }

}