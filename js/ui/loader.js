const loader = document.getElementById('loader');

export function showLoader() {
  loader.classList.remove('fade-out');
}

export function hideLoader() {
  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
  }, 500);
}

export function showError(msg) {
  loader.innerHTML = `
    <div class="error-container">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <p>${msg}</p>
      <button onclick="location.reload()">Réessayer</button>
    </div>
  `;
}
