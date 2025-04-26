import { showToast } from "../toast.js";
import { startPM, generateSharedAESKey, sendFish as sendFishToServer, decryptMsg, importAESKey } from "./chat.js";
import { base64Converter } from "../../core/ECDHkeypair.js";

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
    UI.newBtn.addEventListener('click', newFishBasket);
    // Display the cat ID in the UI
    UI.catId.querySelector('span').textContent
        = `CAT ID: ${localStorage.getItem('catId')}` || 'Unknown Cat ID';
    UI.fishInput.addEventListener('keydown', handleSendFish);
    UI.sendBtn.addEventListener('click', handleSendFish);
    UI.pendingFishBtn.addEventListener('click', togglePendingFish);
}

function newFishBasket() {
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
export const handleReceiveFish = async (fish) => {
    const { sender } = fish;
    if (sender === localStorage.getItem('catId')) {
        return;
    }

    const AESkeyBase64 = localStorage.getItem(fish.roomId);
    const AESkey = await importAESKey(AESkeyBase64);
    let fishText = '';
    try {
        fishText = await decryptMsg(AESkey, fish.fishEncrypt);
    } catch (error) {
        console.error(error);
    }

    renderFish('received', fishText);
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
        try {
            await sendFish();
        } catch (error) {
            console.error(error);
        }
        renderFish('sent');
    }

}
const renderFish = (type, message = '') => {
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

const sendFish = async () => {
    const sender = localStorage.getItem('catId');
    const receiver = UI.basketTitle.textContent;
    const fishInfo = {
        text: UI.fishInput.value,
        sender: sender,
        receiver: receiver,
        roomId: `${[sender, receiver].sort().join('-')}`
    }
    await sendFishToServer(fishInfo);
}
