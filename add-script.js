// Элементы модального окна
const openModalBtn = document.getElementById('openModalBtn');
const modalOverlay = document.getElementById('modalOverlay');
const cancelBtn = document.getElementById('cancelBtn');
const trackForm = document.getElementById('trackForm');
const errorMessage = document.getElementById('errorMessage');

// Настройки размера файлов
const FILE_SIZE_LIMITS = {
    audio: 10, // MB для аудио файлов (уменьшил для надежности)
    image: 1   // MB для изображений
};

// Инициализация IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MusicPlayerDB', 2); // Увеличиваем версию
        
        request.onerror = () => reject('Помилка відкриття бази даних');
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tracks')) {
                const store = db.createObjectStore('tracks', { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: false });
            }
        };
    });
}

// Открытие модального окна
function openModal() {
    modalOverlay.classList.add('is-open');
    document.body.classList.add('no-scroll');
}

// Закрытие модального окна
function closeModal() {
    modalOverlay.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    trackForm.reset();
    errorMessage.textContent = '';
}

// Проверка размера файла
function checkFileSize(file, maxSizeMB, fileType) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        throw new Error(`${fileType} занадто великий. Максимальний розмір: ${maxSizeMB}MB. Ваш файл: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }
    return true;
}

// Конвертация файла в Base64
function fileToBase64(file, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            if (options.maxSizeMB) {
                checkFileSize(file, options.maxSizeMB, options.fileType || 'Файл');
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(new Error('Помилка читання файлу: ' + error));
        } catch (error) {
            reject(error);
        }
    });
}

// Сохранение трека в IndexedDB
async function saveTrack(trackData) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        
        trackData.id = Date.now().toString();
        trackData.addedAt = new Date().toISOString();
        
        const request = store.add(trackData);
        
        request.onsuccess = () => resolve(trackData.id);
        request.onerror = () => reject('Помилка збереження треку');
    });
}

// Обработка отправки формы
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const trackName = document.getElementById('trackName').value.trim();
    const trackArtist = document.getElementById('trackArtist').value.trim();
    const trackGenre = document.getElementById('trackGenre').value.trim();
    const trackDescription = document.getElementById('trackDescription').value.trim();
    const trackFile = document.getElementById('trackFile').files[0];
    const trackCover = document.getElementById('trackCover').files[0];

    if (!trackName || !trackArtist || !trackFile) {
        errorMessage.textContent = 'Будь ласка, заповніть обов\'язкові поля: назва, виконавець та файл треку';
        return;
    }

    errorMessage.textContent = 'Обробка файлів...';
    errorMessage.style.color = '#3366ff';

    try {
        // Конвертируем аудио файл в Base64
        const audioBase64 = await fileToBase64(trackFile, {
            maxSizeMB: FILE_SIZE_LIMITS.audio,
            fileType: 'Аудіо файл'
        });

        // Конвертируем обложку если есть
        let coverBase64 = null;
        if (trackCover) {
            coverBase64 = await fileToBase64(trackCover, {
                maxSizeMB: FILE_SIZE_LIMITS.image,
                fileType: 'Зображення'
            });
        }

        // Дефолтная обложка
        const defaultCover = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7QntCx0YnQuNC5INC30LDQtNCw0YfQuDwvdGV4dD48L3N2Zz4=';

        const trackData = {
            name: trackName,
            artist: trackArtist,
            genre: trackGenre || 'Не вказано',
            description: trackDescription || 'Опис відсутній',
            cover: coverBase64 || defaultCover,
            audio: audioBase64,
            audioType: trackFile.type || 'audio/mpeg'
        };

        await saveTrack(trackData);
        
        errorMessage.textContent = `Трек "${trackName}" успішно додано!`;
        errorMessage.style.color = 'green';
        
        setTimeout(() => {
            closeModal();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = error.message || 'Помилка при обробці файлів. Спробуйте ще раз.';
        errorMessage.style.color = '#ff4444';
    }
}

// Обработчики событий
openModalBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
trackForm.addEventListener('submit', handleFormSubmit);

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
        closeModal();
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initDB();
        console.log('IndexedDB ініціалізовано');
    } catch (error) {
        console.error('Помилка ініціалізації IndexedDB:', error);
    }
});