const loader = document.getElementById('loader');

export function hideLoader() {
  loader.classList.add('fade-out');
  setTimeout(() => loader.classList.add('hidden'), 450);
}
