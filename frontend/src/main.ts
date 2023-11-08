import './style.css';

import { OpenDir, GenFiles } from '../wailsjs/go/main/App';
import { BrowserOpenURL, EventsOff, EventsOn } from '../wailsjs/runtime';
const CACHE_KEY = 'FORM_CACHE';

enum UNIT {
  KB = 1024,
  MB = 1024 * 1024,
  GB = 1024 * 1024 * 1024,
}

interface FormValues {
  target: string;
  name: string;
  start: number;
  total: number;
  size: number;
  unit: keyof typeof UNIT;
}

const [targetElement, nameElement, startElement, totalElement, sizeElement, unitElement] = [
  'target',
  'name',
  'start',
  'total',
  'size',
  'unit',
].map((n) => document.querySelector(`#MainForm [name='${n}']`) as HTMLInputElement);
const loadingElement = document.querySelector('#MainForm .loading') as HTMLDivElement;
const resultElement = document.querySelector('#ResultContainer') as HTMLDivElement;

function loadingShow(value = '生成中...') {
  loadingElement.style.display = 'flex';
  loadingElement.querySelector('.text')!.innerHTML = value;
}
function loadingHide() {
  loadingElement.style.display = 'none';
}
loadingHide();

function resultShow() {
  resultElement.style.display = 'flex';
}
function resultHide() {
  resultElement.style.display = 'none';
}

window.openTargetDir = () => {
  const values = getFormValues();
  BrowserOpenURL(values.target);
};

resultElement.querySelector('.cancel')?.addEventListener('click', () => {
  resultHide();
});
resultHide();

function getFormValues(): FormValues {
  const values: FormValues = {
    target: targetElement.value,
    name: nameElement.value,
    start: Number(startElement.value),
    total: Number(totalElement.value),
    size: Number(sizeElement.value),
    unit: unitElement.value as keyof typeof UNIT,
  };
  return values;
}

function updateCache() {
  const values = getFormValues();
  localStorage.setItem(CACHE_KEY, JSON.stringify(values));
}
function loadCache() {
  const values = localStorage.getItem(CACHE_KEY);
  if (!values) {
    return;
  }
  const formValues = JSON.parse(values);
  targetElement.value = formValues.target;
  targetElement.title = formValues.target;
  nameElement.value = formValues.name;
  startElement.value = formValues.start;
  totalElement.value = formValues.total;
  sizeElement.value = formValues.size;
  unitElement.value = formValues.unit;
}

loadCache();

document.querySelector('#SelectDir')?.addEventListener('click', () => {
  OpenDir().then((path) => {
    if (path) {
      targetElement.value = path;
      targetElement.title = path;
    }
  });
});

document.querySelector('#MainForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  updateCache();
  const values = getFormValues();
  const size = values.size * UNIT[values.unit];

  loadingShow();
  EventsOn('progress', (e) => {
    loadingElement.querySelector('progress')!.value = e.loaded / e.total;
  });
  EventsOn('message', (e) => {
    loadingElement.querySelector('.msg')!.innerHTML = e;
  });
  GenFiles({
    target: values.target,
    name: values.name,
    start: values.start,
    total: values.total,
    size,
  })
    .then(() => {
      resultShow();
    })
    .finally(() => {
      loadingHide();
      EventsOff('message', 'progress');
    });
});

declare global {
  interface Window {
    openTargetDir: () => void;
  }
}
