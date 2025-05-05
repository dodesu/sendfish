export function showToast(message = "Thông điệp mặc định", type = "info") {
  const toast = document.createElement("div");
  toast.className = `
    max-w-md w-full bg-gray-900 border shadow-lg rounded-xl p-4 flex items-start gap-3 animate-slide-down-fade-in
    ${type === 'success' ? 'border-green-300 text-green-600' :
      type === 'error' ? 'border-red-300 text-red-600' :
        type === 'warning' ? 'border-yellow-700 text-yellow-500' :
          'border-blue-300 text-purple-500'}
                    `;

  toast.innerHTML = `
    <div class="mt-1">
      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="${type === 'success' ? 'M5 13l4 4L19 7' : type === 'error' ? 'M6 18L18 6M6 6l12 12' : type === 'warning' ? 'M12 9v2m0 4h.01M10.29 3.86l-7.48 13.07A1 1 0 003.76 19h16.48a1 1 0 00.86-1.48L13.71 3.86a1 1 0 00-1.72 0z' : 'M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z'}" />
      </svg>
    </div>
    <div class="text-sm flex-1">
      <p class="font-semibold capitalize">${type}</p>
      <p>${message}</p>
    </div>
    <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;

  document.getElementById("toast-container").appendChild(toast);

  // Auto remove after 4s
  setTimeout(() => {
    toast.remove();
  }, 4000);
}