// Элементы модального окна
const openModalBtn = document.getElementById('openModalBtn');
const modalOverlay = document.getElementById('modalOverlay');
const cancelBtn = document.getElementById('cancelBtn');
const modalForm = document.querySelector('.modal-form');
const trackNameInput = document.getElementById('trackName');
const errorMessage = document.querySelector('.error-message');

// Проверяем, существуют ли элементы на странице
if (openModalBtn && modalOverlay) {

  // Открытие модального окна
  function openModal() {
    modalOverlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
    trackNameInput.focus();
  }

  // Закрытие модального окна
  function closeModal() {
    modalOverlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    trackNameInput.value = '';
    errorMessage.textContent = '';
  }

  // Валидация и добавление трека
  function handleFormSubmit(e) {
    e.preventDefault();
    
    const trackName = trackNameInput.value.trim();
    
    if (trackName === '') {
      errorMessage.textContent = 'Будь ласка, введіть назву треку';
      return;
    }
    
    // Здесь можно добавить логику для сохранения трека
    // Например, добавить в список или отправить на сервер
    console.log('Додано новий трек:', trackName);
    
    // Показать сообщение об успехе
    alert(`Трек "${trackName}" успішно додано!`);
    
    closeModal();
  }

  // Обработчики событий
  openModalBtn.addEventListener('click', openModal);
  cancelBtn.addEventListener('click', closeModal);
  modalForm.addEventListener('submit', handleFormSubmit);

  // Закрытие по клику на оверлей
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
      closeModal();
    }
  });

}