// Загрузка и отображение треков
async function loadTracks() {
    const tracksList = document.getElementById('tracksList');
    
    try {
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
                <img src="${track.cover}" alt="Обкладинка треку ${track.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7QntCx0YnQuNC5INC30LDQtNCw0YfQuDwvdGV4dD48L3N2Zz4='">
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
        const request = indexedDB.open('MusicPlayerDB', 2);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const tracksRequest = store.getAll();
            
            tracksRequest.onsuccess = () => {
                console.log('Завантажено треків:', tracksRequest.result.length);
                resolve(tracksRequest.result);
            };
            tracksRequest.onerror = () => reject('Помилка завантаження треків');
        };
        
        request.onerror = () => reject('Помилка відкриття бази даних');
    });
}

// Функция удаления трека из списка на главной странице
async function deleteTrackFromList(trackId) {
    if (!confirm('Ви впевнені, що хочете видалити цей трек?')) {
        return;
    }
    
    try {
        await deleteTrack(trackId);
        await loadTracks(); // Перезагружаем список
        alert('Трек успішно видалено!');
    } catch (error) {
        console.error('Помилка видалення:', error);
        alert('Помилка видалення треку');
    }
}

// Функция удаления трека (общая)
async function deleteTrack(trackId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MusicPlayerDB', 2);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const deleteRequest = store.delete(trackId);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject('Помилка видалення треку');
        };
        
        request.onerror = () => reject('Помилка відкриття бази даних');
    });
}

// Функция для очистки всех треков
async function clearAllTracks() {
    if (!confirm('Ви впевнені, що хочете видалити всі треки? Цю дію неможливо скасувати.')) {
        return;
    }
    
    try {
        const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open('MusicPlayerDB', 2);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Помилка відкриття бази даних');
        });

        const transaction = db.transaction(['tracks'], 'readwrite');
        const store = transaction.objectStore('tracks');
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
            loadTracks();
            alert('Всі треки успішно видалено!');
        };
        
        clearRequest.onerror = () => {
            alert('Помилка видалення треків');
        };
    } catch (error) {
        console.error('Помилка очистки:', error);
        alert('Помилка видалення треків');
    }
}

// Функция добавления в плейлист (заглушка)
function addToPlaylist(trackId) {
    alert('Трек додано до плейлисту!');
}

// Загружаем треки при загрузке страницы
document.addEventListener('DOMContentLoaded', loadTracks);