'use strict';

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// 230 Project Overview
// 231 How to Plan a Web Project
// 232 Using the Geolocation API // Использование API геолокации
// 233 Displaying a Map Using Leaflet Library
// console.log(9 + 1 + 5 + 18 + 8 + 14 + 20); // 30.01.22
// 235 Rendering Workout Input Form // Рендеринг формы ввода тренировки
// 236 Project Architecture // Архитектура проекта
// 237 Refactoring for Project Architecture // Рефакторинг для архитектуры проекта
// 238 Managing Workout Data_ Creating Classes // Управление данными тренировки и создание классов
// 239 Creating a New Workout // Создание новой тренировки
// 240 Rendering Workouts // Рендеринг тренировок
// 241 Move to Marker On Click // Перейти к маркеру по щелчку

class Workout {
  date = new Date();
  id = (Date.now() + ``).slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

// Ключевое слово extends используется в объявлении класса или в выражениях класса для создания дочернего класса.
class Running extends Workout {
  type = `running`;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence; // cadence - шаг в минуту
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = `cycling`;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 27, 95, 523);
console.log(run1, cycling1);

////////////////////////////////////////////////////////////
// архитектура приложения
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  // Частные свойства экземпляра
  #map;
  #mapZoomLevel = 14;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition(); // Код будет выполнен в этой точке, когда прилодение будет загруженно.

    // Метод HTMLFormElement.submit() позволяет отправить форму <form>.
    form.addEventListener(`submit`, this._newWorkout.bind(this));

    // Событие changeзапускается для элементов <input>, <select>и , <textarea>когда пользователь изменяет значение элемента. В отличие от inputсобытия, changeсобытие не обязательно запускается при каждом изменении элемента value.
    inputType.addEventListener(`change`, this._toggleElevationField);
    containerWorkouts.addEventListener(`click`, this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your position`);
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.ru/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // переназначаем, в уже существующую переменную
    // console.log(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // обработка кликов на карте
    this.#map.on(`click`, this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE; // глобальная переменная равна mapE
    form.classList.remove(`hidden`); // убрать клас // после нажатия появляется форма, слева
    inputDistance.focus(); // добовляет курсов в поля для ввода inputDistance
  }

  // очистка формы, после заполнения и нажатия вход
  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        ``;
    form.style.distance = `none`;
    form.classList.add(`hidden`);
    //  вызывает определённую функцию обратного вызова, через определённое время
    setTimeout(() => (form.style.display = `grid`), 1000);
  }

  _toggleElevationField() {
    // Метод Element.closest() возвращает ближайший родительский элемент (или сам элемент), который соответствует заданному CSS-селектору или null, если таковых элементов вообще нет.
    // переключая один и тот же класс на двух полях, убеждемся что всегда скрыт один, а другой видимый.
    inputElevation.closest(`.form__row`).classList.toggle(`form__row--hidden`);
    inputCadence.closest(`.form__row`).classList.toggle(`form__row--hidden`);
  }

  _newWorkout(e) {
    // вспомогательные функции
    // Цикл по массиву, проверяется является ли число (Number.isFinite(inp)) конечным или нет,
    // метод every будет возвращать истинный(true), если конечное значение было истинно для всех них,
    // если хоть одно число было не конечным, результат будет ложным(false)
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Получение данных из формы
    const type = inputType.value;
    const distance = +inputDistance.value; // всегда приходит ввиде строки, поэтому преобразуем в число при помощи +
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // Если тренировка запущена, создайте запущенный объект
    if (type === `running`) {
      const cadence = +inputCadence.value;
      // Проверьте, верны ли данные
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence) // если не все положительные
      )
        // если одно из этих трёх чисел не является числом, то вернуть немедленно
        return alert(`вход-ые данные должны быть положительным числом`);

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // Если тренируетесь на велосипеде, создайте объект cycling
    if (type === `cycling`) {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert(`вход-ые данные должны быть положительным числом`);

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // И новый объект в массив тренировки
    this.#workouts.push(workout);
    console.log(workout);

    // Визуализировать тренировку на карте в виде маркеров
    this._renderWorkoutMarker(workout);

    // Отобразить тренировку в списке
    this._renderWorkout(workout);

    // Скрыть форму + очистить поля ввода
    // Очистка поля ввода после установки метки
    this._hideForm();
  }
  _renderWorkoutMarker(workout) {
    // Display marker
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === `running` ? `🏃‍♂️` : `🚴‍♀️`} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === `running` ? `🏃‍♂️` : `🚴‍♀️`
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === `running`)
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    if (workout.type === `cycling`)
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;

    form.insertAdjacentHTML(`afterend`, html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(`.workout`);
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // использование общедоступного интерфейса
    workout.click();
  }
}

const app = new App();

// console.log(17 + 9 + 24 + 16); // 31.01.22

console.log(34 + 24 + 17); // 01.02.22
