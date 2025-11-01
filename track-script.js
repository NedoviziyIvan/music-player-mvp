// Загрузка деталей трека
async function loadTrackDetails() {
    const trackDetails = document.getElementById('trackDetails');
    
    const urlParams = new URLSearchParams(window.location.search);
    const trackId = urlParams.get('id');
    
    if (!trackId) {
        trackDetails.innerHTML = '<p>Трек не знайдено. <a href="index.html">Повернутися до списку</a></p>';
        return;
    }
    
    try {
        const track = await getTrackById(trackId);
        
        if (!track) {
            trackDetails.innerHTML = '<p>Трек не знайдено. <a href="index.html">Повернутися до списку</a></p>';
            return;
        }
        
        console.log('Завантажено трек:', track);
        
        trackDetails.innerHTML = `
            <img src="${track.cover}" alt="Обкладинка треку ${track.name}" class="track-cover" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7QntCx0YnQuNC5INC30LDQtNCw0YfQuDwvdGV4dD48L3N2Zz4='">
            <div class="track-info">
                <h1>${track.name}</h1>
                <p><strong>Виконавець:</strong> ${track.artist}</p>
                <p><strong>Жанр:</strong> ${track.genre}</p>
                <p><strong>Опис:</strong> ${track.description}</p>
                <p><strong>Додано:</strong> ${new Date(track.addedAt).toLocaleDateString('uk-UA')}</p>
                
                <div class="audio-player">
                    <audio controls style="width: 100%;">
                        <source src="${track.audio}" type="${track.audioType || 'audio/mpeg'}">
                        Ваш браузер не підтримує аудіо елемент.
                    </audio>
                </div>
                
                <div class="track-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <a href="index.html" class="btn">← Назад до списку</a>
                    <button class="btn btn-primary" onclick="shareTrack('${trackId}')">Поділитися</button>
                    <button class="btn delete-btn" onclick="deleteTrack('${trackId}')">🗑️ Видалити трек</button>
                </div>
            </div>
        `;
        
        // Добавляем обработчик ошибок для аудио
        const audioElement = trackDetails.querySelector('audio');
        if (audioElement) {
            audioElement.addEventListener('error', function(e) {
                console.error('Помилка завантаження аудіо:', e);
                alert('Помилка завантаження аудіо файлу. Спробуйте додати трек знову.');
            });
        }
        
    } catch (error) {
        console.error('Помилка завантаження треку:', error);
        trackDetails.innerHTML = '<p>Помилка завантаження треку. <a href="index.html">Повернутися до списку</a></p>';
    }
}

// Функция получения трека по ID
function getTrackById(trackId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MusicPlayerDB', 2);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['tracks'], 'readonly');
            const store = transaction.objectStore('tracks');
            const getRequest = store.get(trackId);
            
            getRequest.onsuccess = () => {
                console.log('Знайдено трек:', getRequest.result);
                resolve(getRequest.result);
            };
            getRequest.onerror = () => reject('Помилка завантаження треку');
        };
        
        request.onerror = () => reject('Помилка відкриття бази даних');
    });
}

// Функция удаления трека
async function deleteTrack(trackId) {
    if (!confirm('Ви впевнені, що хочете видалити цей трек? Цю дію неможливо скасувати.')) {
        return;
    }
    
    try {
        const request = indexedDB.open('MusicPlayerDB', 2);
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['tracks'], 'readwrite');
            const store = transaction.objectStore('tracks');
            const deleteRequest = store.delete(trackId);
            
            deleteRequest.onsuccess = () => {
                alert('Трек успішно видалено!');
                window.location.href = 'index.html';
            };
            
            deleteRequest.onerror = () => {
                alert('Помилка видалення треку');
            };
        };
    } catch (error) {
        console.error('Помилка видалення:', error);
        alert('Помилка видалення треку');
    }
}

// Функция поделиться треком
function shareTrack(trackId) {
    const currentUrl = window.location.href.split('?')[0] + `?id=${trackId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Слухай цей трек!',
            text: 'Послухай цей крутий трек у моєму музичному плеєрі',
            url: currentUrl
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl).then(() => {
            alert('Посилання на трек скопійовано!');
        }).catch(() => {
            alert(`Скопіюйте посилання: ${currentUrl}`);
        });
    } else {
        alert(`Скопіюйте посилання: ${currentUrl}`);
    }
}

// Загружаем детали трека при загрузке страницы
document.addEventListener('DOMContentLoaded', loadTrackDetails);