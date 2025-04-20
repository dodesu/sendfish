import { showToast } from "../toast.js";
import { startPM, generateSharedAESKey } from "./chat.js";


const UI = {
    newBtn: document.querySelector('#new-fish'),
    chatBox: document.querySelector('#chat-box'),
    catId: document.querySelector('#cat-id'),
    basketTitle: document.querySelector('#basket-title'),
    fishInput: document.querySelector('#fish-input'),
};

export const InitUI = () => {
    UI.newBtn.addEventListener('click', newFishBasket);
    UI.catId.querySelector('span').textContent =
        `CAT ID: ${localStorage.getItem('catId')}` || 'Unknown Cat ID';
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

    UI.chatBox.innerHTML = '';
    UI.basketTitle.textContent = res.receiveCat;
    UI.fishInput.focus();
    showToast('New chat started!', 'success');
}