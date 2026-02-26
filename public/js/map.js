export const displayMap = () => {
  // Ждем готовности API Яндекс.Карт
  if (typeof ymaps === 'undefined') {
    console.warn(
      '⚠️ Yandex Maps API not found. Check script inclusion and API key.'
    );
    return null;
  } else {
    ymaps.ready(function() {
      // =================================================================
      // 1. ПОЛУЧЕНИЕ ДАННЫХ И КОНТЕЙНЕРА
      // =================================================================
      const mapEl = document.getElementById('map');
      if (!mapEl) return;

      // Извлекаем массив локаций из data-атрибута HTML (приходит из базы данных)
      const locations = JSON.parse(mapEl.dataset.locations);

      // Переворачиваем координаты: MongoDB хранит [lng, lat], Яндекс требует [lat, lng]
      const yandexCoords = locations.map(loc => [
        loc.coordinates[1],
        loc.coordinates[0]
      ]);

      // =================================================================
      // 2. ИНИЦИАЛИЗАЦИЯ КАРТЫ
      // =================================================================
      const myMap = new ymaps.Map('map', {
        center: yandexCoords[0], // Центрируем по первой точке
        zoom: 8,
        controls: [] // ВАЖНО: Убираем ВСЕ стандартные кнопки (в т.ч. стандартный зум)
      });

      // Настройки интерфейса: убираем скролл, лишние панели и уведомления
      myMap.options.set({
        suppressMapOpenBlock: true,
        suppressObsoleteBrowserNotifier: true
      });
      myMap.behaviors.disable('scrollZoom');

      // =================================================================
      // 3. НАСТРОЙКА ВСПЛЫВАЮЩЕЙ ПОДСКАЗКИ (HINT)
      // =================================================================
      // Создаем HTML-макет для подсказки при наведении на маркер
      const HintLayout = ymaps.templateLayoutFactory.createClass(
        `
    <div class="map-hint-container">
      <div class="map-hint-header">Day {{ properties.day }}</div>
      <div class="map-hint-body">{{ properties.desc }}</div>
      <div class="map-hint-tail"></div> <!-- Декоративный хвостик снизу -->
    </div>
    `
      );

      // =================================================================
      // 4. ДОБАВЛЕНИЕ МАРКЕРОВ НА КАРТУ
      // =================================================================
      yandexCoords.forEach((coord, i) => {
        myMap.geoObjects.add(
          new ymaps.Placemark(
            coord,
            {
              // ДАННЫЕ МАРКЕРА:
              // Свойства для нашей подсказки (Hint)
              day: locations[i].day,
              desc: locations[i].description,
              // Контент для клика (Popup/Balloon) - стандартный
              balloonContent: `<strong>${locations[i].description}</strong><br>Day ${locations[i].day}`
            },
            {
              // СТИЛИ МАРКЕРА:
              preset: 'islands#icon', // Базовая иконка
              iconColor: '#55c57a', // Наш зеленый цвет

              // Подключаем наш кастомный макет подсказки
              hintLayout: HintLayout,
              // Сдвигаем подсказку, чтобы она была ровно НАД маркером
              hintOffset: [-37, -70]
            }
          )
        );
      });

      // =================================================================
      // 5. АВТО-МАСШТАБИРОВАНИЕ (FIT BOUNDS) С КОНТРОЛЕМ ОТДАЛЕНИЯ
      // =================================================================

      // 1) Получаем bounds (границы всех маркеров)
      const bounds = myMap.geoObjects.getBounds();
      if (!bounds) return;

      // 2) Динамический верхний отступ под скос блока выше:
      // --section-rotate так как ~ 9vw, поэтому берём 9% ширины экрана + запас под маркер/хинт.
      const topMargin = Math.max(
        40,
        Math.min(260, Math.round(window.innerWidth * 0.09) - 70)
      );

      // 3) “Не отдаляться слишком сильно”
      const MIN_ZOOM = 4; // подбераем: 3-5 обычно норм (чем больше число — тем ближе карта)

      // 4) Фитим bounds с адекватными отступами
      myMap
        .setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: [topMargin, 50, 60, 50] // [верх, право, низ, лево]
        })
        .then(() => {
          // Если setBounds “уплыл” слишком далеко — поднимаем зум.
          // ВАЖНО: тогда часть точек может не влезть — это осознанный компромисс.
          if (myMap.getZoom() < MIN_ZOOM) {
            myMap.setZoom(MIN_ZOOM, { duration: 300 });
          }
        });

      // =================================================================
      // 6. КАСТОМНЫЕ КНОПКИ ЗУМА
      // =================================================================

      // Создаем Макет (Layout) для контрола зума.
      // Мы берем стандартный ZoomControl, но полностью подменяем его HTML своим.
      const ZoomLayout = ymaps.templateLayoutFactory.createClass(
        `
    <div class="map-controls">
        <button id="zoom-in" class="map-btn" type="button" aria-label="Увеличить">+</button>
        <button id="zoom-out" class="map-btn" type="button" aria-label="Уменьшить">−</button>
    </div>
    `,
        {
          // Метод build вызывается при создании контрола
          build: function() {
            // 1. Вызываем родительский метод build (даем Яндексу построить наш HTML (вставить div и button в карту))
            ZoomLayout.superclass.build.call(this);

            // 2. А теперь, когда кнопки уже в DOM, мы можем их найти и повесить клики
            const element = this.getElement(); // DOM-элемент именно этого контрола
            this.zoomInBtn = element?.querySelector('#zoom-in');
            this.zoomOutBtn = element?.querySelector('#zoom-out');

            // 3. Привязываем события клика (используем bind, чтобы не потерять контекст this)
            // При клике вызываем методы zoomIn/zoomOut, описанные ниже
            this.zoomInBtn.addEventListener(
              'click',
              ymaps.util.bind(this.zoomIn, this)
            );
            this.zoomOutBtn.addEventListener(
              'click',
              ymaps.util.bind(this.zoomOut, this)
            );
          },

          // Метод clear вызывается при удалении контрола
          clear: function() {
            // Обязательно удаляем обработчики событий во избежание утечек памяти
            this.zoomInBtn.removeEventListener('click', this.zoomIn);
            this.zoomOutBtn.removeEventListener('click', this.zoomOut);
            ZoomLayout.superclass.clear.call(this);
          },

          // Логика увеличения
          zoomIn: function() {
            const map = this.getData().control.getMap(); // Получаем ссылку на карту
            map.setZoom(map.getZoom() + 1, {
              duration: 300
            }); // Плавно увеличиваем зум
          },

          // Логика уменьшения
          zoomOut: function() {
            const map = this.getData().control.getMap();
            map.setZoom(map.getZoom() - 1, {
              duration: 300
            });
          }
        }
      );

      // Создаем сам контрол Зума с нашим макетом
      const zoomControl = new ymaps.control.ZoomControl({
        options: {
          layout: ZoomLayout, // Подключаем наш макет
          position: { right: 30, top: 100 } // Позиция кнопок (от правого верхнего угла)
        }
      });

      // Добавляем контрол на карту
      myMap.controls.add(zoomControl);
    });
  }
};
