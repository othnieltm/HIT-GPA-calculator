const weights = [0.15, 0.20, 0.30, 0.45];
const yearNames = ['Year 1', 'Year 2', 'Year 3', 'Final year'];
const firstClassTarget = 7.5;

const currentYearSelect = document.querySelector('#currentYear');
const previousGpas = document.querySelector('#previousGpas');
const modules = document.querySelector('#modules');
const calculateButton = document.querySelector('#calculate');
const resetButton = document.querySelector('#reset');
const addModuleButton = document.querySelector('#addModule');

function createPreviousGpaFields() {
  const currentYear = Number(currentYearSelect.value);
  previousGpas.innerHTML = '';

  for (let index = 0; index < 3; index += 1) {
    const row = document.createElement('div');
    row.className = 'previous-row';
    const disabled = index >= currentYear - 1;
    row.innerHTML = `
      <label for="previous-${index}">${yearNames[index]} annual GPA</label>
      <input id="previous-${index}" class="previous-gpa" type="number" min="1" max="10" step="0.1" placeholder="e.g. 6.8" ${disabled ? 'disabled' : ''}>
    `;
    previousGpas.appendChild(row);
  }
}

function addModule(name = '', score = '') {
  const row = document.createElement('div');
  row.className = 'module-row';
  row.innerHTML = `
    <input class="module-name" type="text" placeholder="Module name" value="${name}" aria-label="Module name">
    <input class="module-score" type="number" min="1" max="10" step="0.1" placeholder="Points / 10" value="${score}" aria-label="Module points out of 10">
    <button class="remove-module" type="button" aria-label="Remove module">&times;</button>
  `;
  row.querySelector('.remove-module').addEventListener('click', () => {
    row.remove();
    calculate();
  });
  modules.appendChild(row);
}

function getNumber(input) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) ? Math.min(10, Math.max(1, value)) : null;
}

function formatScore(value) {
  return value === null || !Number.isFinite(value) ? '--' : value.toFixed(1);
}

function getClassification(gpa) {
  if (gpa >= 7.5) return 'First Class';
  if (gpa >= 6.5) return 'Upper Second';
  if (gpa >= 5.5) return 'Lower Second';
  if (gpa > 4.5) return 'Simple Pass';
  return 'Below pass';
}

function calculate() {
  const currentYear = Number(currentYearSelect.value);
  const target = firstClassTarget;
  const priorGpas = [...document.querySelectorAll('.previous-gpa')].map(getNumber);
  const scores = [...document.querySelectorAll('.module-score')].map(getNumber).filter((score) => score !== null);
  const annualGpa = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
  const completed = priorGpas.slice(0, currentYear - 1);
  const annualValues = [...completed, annualGpa];
  const completedWeight = weights.slice(0, currentYear).reduce((sum, weight) => sum + weight, 0);
  const currentGpa = annualValues.every((value) => value !== null)
    ? annualValues.reduce((sum, value, index) => sum + value * weights[index], 0) / completedWeight
    : null;
  const earnedBeforeCurrent = completed.reduce((sum, value, index) => sum + (value ?? 0) * weights[index], 0);
  const futureWeight = weights.slice(currentYear).reduce((sum, weight) => sum + weight, 0);
  const neededForFirst = annualGpa !== null && futureWeight > 0
    ? (target - earnedBeforeCurrent - annualGpa * weights[currentYear - 1]) / futureWeight
    : null;

  document.querySelector('#annualGpa').textContent = formatScore(annualGpa);
  document.querySelector('#currentGpa').textContent = formatScore(currentGpa);
  document.querySelector('#neededGpa').textContent = neededForFirst === null ? '--' : neededForFirst <= 0 ? '0.0' : formatScore(neededForFirst);
  document.querySelector('#currentMeter').style.width = `${Math.min(100, Math.max(0, (currentGpa ?? 0) * 10))}%`;
  document.querySelector('#resultNote').innerHTML = `First Class begins at <strong>${formatScore(target)} / 10</strong>. Your classification is based on your current weighted GPA.`;

  const status = document.querySelector('#statusBadge');
  const description = document.querySelector('#currentDescription');
  const neededDescription = document.querySelector('#neededDescription');
  status.className = 'status-badge';

  if (currentGpa === null) {
    status.textContent = 'Awaiting scores';
    description.textContent = 'Enter your scores to see your standing.';
    neededDescription.textContent = 'Complete your current-year scores to calculate this.';
    return;
  }

  const onTrack = currentGpa >= target;
  status.textContent = getClassification(currentGpa);
  status.classList.add(onTrack ? 'on-track' : 'needs-work');
  description.textContent = `${getClassification(currentGpa)} standing based on your completed years.`;

  if (currentYear === 4) {
    neededDescription.textContent = neededForFirst <= 0 ? 'You have already reached the target.' : 'The target was not reached with the entered final-year scores.';
  } else if (neededForFirst <= 0) {
    neededDescription.textContent = 'You have already built enough points for First Class.';
  } else if (neededForFirst > 10) {
    neededDescription.textContent = 'This target requires more than 10.0 in future years.';
  } else {
    neededDescription.textContent = `Average needed across the remaining ${4 - currentYear} year${4 - currentYear === 1 ? '' : 's'}.`;
  }
}

function reset() {
  currentYearSelect.value = '1';
  createPreviousGpaFields();
  modules.innerHTML = '';
  addModule();
  addModule();
  calculate();
}

currentYearSelect.addEventListener('change', () => {
  createPreviousGpaFields();
  calculate();
});
calculateButton.addEventListener('click', calculate);
resetButton.addEventListener('click', reset);
addModuleButton.addEventListener('click', () => {
  addModule();
  calculate();
});
modules.addEventListener('input', calculate);
previousGpas.addEventListener('input', calculate);

createPreviousGpaFields();
addModule('Module 1');
addModule('Module 2');
calculate();
