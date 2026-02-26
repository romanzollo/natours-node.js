import { displayMap } from './map.js';

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map')) {
    displayMap();
  }
});

// console.log('Tour bundle loaded');
