// Версия базы данных - ДОЛЖНА СОВПАДАТЬ с add-script.js
const DB_VERSION = 3;
const DB_NAME = 'MusicPlayerDB';

// Инициализация IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject('Помилка відкриття бази даних: ' + event.target.error);
        };
        
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

// Загрузка и отображение треков
async function loadTracks() {
    const tracksList = document.getElementById('tracksList');
    
    try {
        // Инициализируем базу перед загрузкой
        await initDB();
        const tracks = await getAllTracks();
        
        if (tracks.length === 0) {
            tracksList.innerHTML = `
                <div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
                    <p style="font-size: 1.2rem; margin-bottom: 1rem;">Ще немає доданих треків.</p>
                    <a href="add.html" class="btn btn-primary">Додати перший трек!</a>
                </div>
            `;
            return;
        }

        tracksList.innerHTML = '';

        tracks.forEach(track => {
            const trackCard = document.createElement('li');
            trackCard.className = 'card';
            trackCard.innerHTML = `
                <img src="${track.cover}" alt="Обкладинка треку ${track.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJмаiddlZSIgZHk9Ii4zZW0iPtCe0LHRidC40Lkg0LfQsNC00LDRh9C4PC90ZXh0Pjwvc3ZnPg=='">
                <div class="card-info">
                    <h2>${track.name}</h2>
                    <p>${track.artist}</p>
                    <p><small>Жанр: ${track.genre}</small></p>
                    <div class="card-buttons">
                        <button class="btn" onclick="addToPlaylist('${track.id}')">Додати</button>
                        <a href="track.html?id=${track.id}" class="btn btn-primary">Прослухати</a>
                        <button class="btn delete-btn" onclick="deleteTrackFromList('${track.id}')">
                            🗑️ Видалити
                        </button>
                    </div>
                </div>
            `;
            tracksList.appendChild(trackCard);
        });
    } catch (error) {
        console.error('Помилка завантаження треків:', error);
        tracksList.innerHTML = '<p>Помилка завантаження треків. Оновіть сторінку.</p>';
    }
}

// Функция для получения всех треков из IndexedDB
function getAllTracks() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            try {
                const transaction = db.transaction(['tracks'], 'readonly');
                const store = transaction.objectStore('tracks');
                const tracksRequest = store.getAll();
                
                tracksRequest.onsuccess = () => {
                    console.log('Завантажено треків:', tracksRequest.result.length);
                    resolve(tracksRequest.result);
                };
                tracksRequest.onerror = (event) => {
                    console.error('Ошибка получения треков:', event.target.error);
                    reject('Помилка завантаження треків: ' + event.target.error);
                };
            } catch (error) {
                reject('Помилка транзакції: ' + error);
            }
        };
        
        request.onerror = (event) => {
            console.error('Ошибка открытия базы:', event.target.error);
            reject('Помилка відкриття бази даних: ' + event.target.error);
        };
    });
}

// Функция удаления трека из списка на главной странице
async function deleteTrackFromList(trackId) {
    if (!confirm('Ви впевнені, що хочете видалити цей трек?')) {
        return;
    }
    
    try {
        await deleteTrack(trackId);
        await loadTracks();
        alert('Трек успішно видалено!');
    } catch (error) {
        console.error('Помилка видалення:', error);
        alert('Помилка видалення треку: ' + error);
    }
}

// Функция удаления трека (общая)
async function deleteTrack(trackId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            try {
                const transaction = db.transaction(['tracks'], 'readwrite');
                const store = transaction.objectStore('tracks');
                const deleteRequest = store.delete(trackId);
                
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = (event) => reject('Помилка видалення треку: ' + event.target.error);
            } catch (error) {
                reject('Помилка транзакції: ' + error);
            }
        };
        
        request.onerror = (event) => reject('Помилка відкриття бази даних: ' + event.target.error);
    });
}

// Функция для очистки всех треков
async function clearAllTracks() {
    if (!confirm('Ви впевнені, що хочете видалити всі треки? Цю дію неможливо скасувати.')) {
        return;
    }
    
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject('Помилка відкриття бази даних: ' + event.target.error);
        });

        const transaction = db.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
            loadTracks();
            alert('Всі треки успішно видалено!');
        };
        
        clearRequest.onerror = (event) => {
            alert('Помилка видалення треків: ' + event.target.error);
        };
    } catch (error) {
        console.error('Помилка очистки:', error);
        alert('Помилка видалення треків: ' + error);
    }
}

// Функция добавления в плейлист (заглушка)
function addToPlaylist(trackId) {
    alert('Трек додано до плейлисту!');
}

// Загружаем треки при загрузке страницы
document.addEventListener('DOMContentLoaded', loadTracks);