// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      if (res === false) {
        return {};
      }
      // Synthesize a module to follow re-exports.
      if (Array.isArray(res)) {
        var m = {__esModule: true};
        res.forEach(function (v) {
          var key = v[0];
          var id = v[1];
          var exp = v[2] || v[0];
          var x = newRequire(id);
          if (key === '*') {
            Object.keys(x).forEach(function (key) {
              if (
                key === 'default' ||
                key === '__esModule' ||
                Object.prototype.hasOwnProperty.call(m, key)
              ) {
                return;
              }

              Object.defineProperty(m, key, {
                enumerable: true,
                get: function () {
                  return x[key];
                },
              });
            });
          } else if (exp === '*') {
            Object.defineProperty(m, key, {
              enumerable: true,
              value: x,
            });
          } else {
            Object.defineProperty(m, key, {
              enumerable: true,
              get: function () {
                if (exp === 'default') {
                  return x.__esModule ? x.default : x;
                }
                return x[exp];
              },
            });
          }
        });
        return m;
      }
      return newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  // INSERT_LOAD_HERE

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"i7Ffa":[function(require,module,exports,__globalThis) {
var _mapJs = require("./map.js");
document.addEventListener('DOMContentLoaded', ()=>{
    if (document.getElementById('map')) (0, _mapJs.displayMap)();
}); // console.log('Tour bundle loaded');

},{"./map.js":"3LfOV"}],"3LfOV":[function(require,module,exports,__globalThis) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "displayMap", ()=>displayMap);
const displayMap = ()=>{
    // Ждем готовности API Яндекс.Карт
    if (typeof ymaps === 'undefined') {
        console.warn("\u26A0\uFE0F Yandex Maps API not found. Check script inclusion and API key.");
        return null;
    } else ymaps.ready(function() {
        // =================================================================
        // 1. ПОЛУЧЕНИЕ ДАННЫХ И КОНТЕЙНЕРА
        // =================================================================
        const mapEl = document.getElementById('map');
        if (!mapEl) return;
        // Извлекаем массив локаций из data-атрибута HTML (приходит из базы данных)
        const locations = JSON.parse(mapEl.dataset.locations);
        // Переворачиваем координаты: MongoDB хранит [lng, lat], Яндекс требует [lat, lng]
        const yandexCoords = locations.map((loc)=>[
                loc.coordinates[1],
                loc.coordinates[0]
            ]);
        // =================================================================
        // 2. ИНИЦИАЛИЗАЦИЯ КАРТЫ
        // =================================================================
        const myMap = new ymaps.Map('map', {
            center: yandexCoords[0],
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
        const HintLayout = ymaps.templateLayoutFactory.createClass(`
    <div class="map-hint-container">
      <div class="map-hint-header">Day {{ properties.day }}</div>
      <div class="map-hint-body">{{ properties.desc }}</div>
      <div class="map-hint-tail"></div> <!-- \u{414}\u{435}\u{43A}\u{43E}\u{440}\u{430}\u{442}\u{438}\u{432}\u{43D}\u{44B}\u{439} \u{445}\u{432}\u{43E}\u{441}\u{442}\u{438}\u{43A} \u{441}\u{43D}\u{438}\u{437}\u{443} -->
    </div>
    `);
        // =================================================================
        // 4. ДОБАВЛЕНИЕ МАРКЕРОВ НА КАРТУ
        // =================================================================
        yandexCoords.forEach((coord, i)=>{
            myMap.geoObjects.add(new ymaps.Placemark(coord, {
                // ДАННЫЕ МАРКЕРА:
                // Свойства для нашей подсказки (Hint)
                day: locations[i].day,
                desc: locations[i].description,
                // Контент для клика (Popup/Balloon) - стандартный
                balloonContent: `<strong>${locations[i].description}</strong><br>Day ${locations[i].day}`
            }, {
                // СТИЛИ МАРКЕРА:
                preset: 'islands#icon',
                iconColor: '#55c57a',
                // Подключаем наш кастомный макет подсказки
                hintLayout: HintLayout,
                // Сдвигаем подсказку, чтобы она была ровно НАД маркером
                hintOffset: [
                    -37,
                    -70
                ]
            }));
        });
        // =================================================================
        // 5. АВТО-МАСШТАБИРОВАНИЕ (FIT BOUNDS) С КОНТРОЛЕМ ОТДАЛЕНИЯ
        // =================================================================
        // 1) Получаем bounds (границы всех маркеров)
        const bounds = myMap.geoObjects.getBounds();
        if (!bounds) return;
        // 2) Динамический верхний отступ под скос блока выше:
        // --section-rotate так как ~ 9vw, поэтому берём 9% ширины экрана + запас под маркер/хинт.
        const topMargin = Math.max(40, Math.min(260, Math.round(window.innerWidth * 0.09) - 70));
        // 3) “Не отдаляться слишком сильно”
        const MIN_ZOOM = 4; // подбераем: 3-5 обычно норм (чем больше число — тем ближе карта)
        // 4) Фитим bounds с адекватными отступами
        myMap.setBounds(bounds, {
            checkZoomRange: true,
            zoomMargin: [
                topMargin,
                50,
                60,
                50
            ] // [верх, право, низ, лево]
        }).then(()=>{
            // Если setBounds “уплыл” слишком далеко — поднимаем зум.
            // ВАЖНО: тогда часть точек может не влезть — это осознанный компромисс.
            if (myMap.getZoom() < MIN_ZOOM) myMap.setZoom(MIN_ZOOM, {
                duration: 300
            });
        });
        // =================================================================
        // 6. КАСТОМНЫЕ КНОПКИ ЗУМА
        // =================================================================
        // Создаем Макет (Layout) для контрола зума.
        // Мы берем стандартный ZoomControl, но полностью подменяем его HTML своим.
        const ZoomLayout = ymaps.templateLayoutFactory.createClass(`
    <div class="map-controls">
        <button id="zoom-in" class="map-btn" type="button" aria-label="\u{423}\u{432}\u{435}\u{43B}\u{438}\u{447}\u{438}\u{442}\u{44C}">+</button>
        <button id="zoom-out" class="map-btn" type="button" aria-label="\u{423}\u{43C}\u{435}\u{43D}\u{44C}\u{448}\u{438}\u{442}\u{44C}">\u{2212}</button>
    </div>
    `, {
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
                this.zoomInBtn.addEventListener('click', ymaps.util.bind(this.zoomIn, this));
                this.zoomOutBtn.addEventListener('click', ymaps.util.bind(this.zoomOut, this));
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
        });
        // Создаем сам контрол Зума с нашим макетом
        const zoomControl = new ymaps.control.ZoomControl({
            options: {
                layout: ZoomLayout,
                position: {
                    right: 30,
                    top: 100
                } // Позиция кнопок (от правого верхнего угла)
            }
        });
        // Добавляем контрол на карту
        myMap.controls.add(zoomControl);
    });
};

},{"@parcel/transformer-js/src/esmodule-helpers.js":"cGvcY"}],"cGvcY":[function(require,module,exports,__globalThis) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || Object.prototype.hasOwnProperty.call(dest, key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}]},["i7Ffa"], "i7Ffa", "parcelRequire2b78", {})

//# sourceMappingURL=tour.js.map
