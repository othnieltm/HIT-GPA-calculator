const weights = [0.15, 0.20, 0.30, 0.45];
const yearNames = ['Year 1', 'Year 2', 'Year 3', 'Final year'];
const firstClassTarget = 7.5;

const studyStatusSelect = document.querySelector('#studyStatus');
const currentYearSelect = document.querySelector('#currentYear');
const previousYears = document.querySelector('#previousGpas');
const calculateButton = document.querySelector('#calculate');
const resetButton = document.querySelector('#reset');

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

function addPreviousModule(yearIndex, name = '', score = '') {
  const moduleList = previousYears.querySelector(`.previous-modules[data-year="${yearIndex}"]`);
  const row = document.createElement('div');
  row.className = 'module-row';
  row.innerHTML = `
    <input class="module-name" type="text" placeholder="Module name" value="${name}" aria-label="Module name">
    <input class="previous-module-score" data-year="${yearIndex}" type="number" min="1" max="10" step="0.1" placeholder="Points / 10" value="${score}" aria-label="${yearNames[yearIndex]} module points out of 10">
    <button class="remove-module" type="button" aria-label="Remove module">&times;</button>
  `;
  row.querySelector('.remove-module').addEventListener('click', () => {
    row.remove();
    calculate();
  });
  moduleList.appendChild(row);
}

function createPreviousYearFields() {
  const currentYear = Number(currentYearSelect.value);
  const graduate = studyStatusSelect.value === 'graduate';
  const yearsToShow = graduate ? 4 : currentYear - 1;
  previousYears.innerHTML = '';

  for (let yearIndex = 0; yearIndex < yearsToShow; yearIndex += 1) {
    const yearBlock = document.createElement('div');
    yearBlock.className = 'previous-year';
    yearBlock.innerHTML = `
      <div class="previous-year-header">
        <h4>${yearNames[yearIndex]}</h4>
        <span>Annual average: <strong class="annual-average" data-year="${yearIndex}">--</strong></span>
      </div>
      <div class="previous-modules" data-year="${yearIndex}"></div>
      <button class="button button-add-previous add-previous-module" data-year="${yearIndex}" type="button"><span aria-hidden="true">+</span> Add module</button>
    `;
    previousYears.appendChild(yearBlock);
    addPreviousModule(yearIndex, 'Module 1');
    addPreviousModule(yearIndex, 'Module 2');
  }
}

function getCompletedAverages(currentYear) {
  const graduate = studyStatusSelect.value === 'graduate';
  const yearsToRead = graduate ? 4 : currentYear - 1;
  return Array.from({ length: yearsToRead }, (_, yearIndex) => {
    const scores = [...document.querySelectorAll(`.previous-module-score[data-year="${yearIndex}"]`)]
      .map(getNumber)
      .filter((score) => score !== null);
    return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
  });
}

function calculate() {
  const currentYear = Number(currentYearSelect.value);
  const graduate = studyStatusSelect.value === 'graduate';
  const completed = getCompletedAverages(currentYear);
  const hasAllCompletedYears = completed.length > 0 && completed.every((value) => value !== null);
  const completedCount = graduate ? 4 : currentYear - 1;
  const completedWeight = weights.slice(0, completedCount).reduce((sum, weight) => sum + weight, 0);
  const earnedBeforeCurrent = completed.reduce((sum, value, index) => sum + (value ?? 0) * weights[index], 0);
  const currentGpa = hasAllCompletedYears ? earnedBeforeCurrent / completedWeight : null;
  const remainingWeight = weights.slice(currentYear - 1).reduce((sum, weight) => sum + weight, 0);
  const neededForFirst = !graduate && (currentYear === 1 || hasAllCompletedYears)
    ? (firstClassTarget - earnedBeforeCurrent) / remainingWeight
    : null;

  completed.forEach((value, index) => {
    const annualAverage = document.querySelector(`.annual-average[data-year="${index}"]`);
    if (annualAverage) annualAverage.textContent = formatScore(value);
  });

  document.querySelector('#currentGpa').textContent = formatScore(currentGpa);
  document.querySelector('#neededGpa').textContent = graduate ? formatScore(firstClassTarget) : neededForFirst === null ? '--' : neededForFirst <= 0 ? '0.0' : formatScore(neededForFirst);
  document.querySelector('#classification').textContent = currentGpa === null ? '--' : getClassification(currentGpa);
  document.querySelector('#currentMeter').style.width = `${Math.min(100, Math.max(0, (currentGpa ?? 0) * 10))}%`;
  document.querySelector('#gpaLabel').textContent = graduate ? 'Final weighted GPA' : 'Weighted GPA so far';
  document.querySelector('#neededLabel').textContent = graduate ? 'First Class target' : 'Needed from this year';
  document.querySelector('#classificationDescription').textContent = graduate ? 'Based on all four completed academic years' : 'Based on completed academic years';
  document.querySelector('#historyTitle').textContent = graduate ? 'All four years' : 'Completed-year modules';
  document.querySelector('#historyNote').textContent = graduate ? 'Enter every module from your degree, including carried courses' : 'Enter every module, including carried courses';
  document.querySelector('#currentYearSection').classList.toggle('is-hidden', graduate);
  document.querySelector('#notYetNote').classList.toggle('is-hidden', graduate);
  currentYearSelect.disabled = graduate;

  const status = document.querySelector('#statusBadge');
  const description = document.querySelector('#currentDescription');
  const neededDescription = document.querySelector('#neededDescription');
  status.className = 'status-badge';

  if (currentGpa === null) {
    status.textContent = 'Awaiting scores';
    description.textContent = graduate ? 'Enter modules for all four years to see your final result.' : 'Enter completed-year modules to see your standing.';
    neededDescription.textContent = currentYear === 1 ? 'Your current-year target is shown above.' : 'Complete previous-year modules to calculate this.';
    return;
  }

  const onTrack = currentGpa >= firstClassTarget;
  status.textContent = getClassification(currentGpa);
  status.classList.add(onTrack ? 'on-track' : 'needs-work');
  description.textContent = graduate ? `${getClassification(currentGpa)} result across your full degree.` : `${getClassification(currentGpa)} standing based on your completed years.`;

  if (graduate) {
    neededDescription.textContent = `First Class begins at ${formatScore(firstClassTarget)} / 10.`;
    return;
  }

  if (neededForFirst <= 0) {
    neededDescription.textContent = 'You have already built enough points for First Class.';
  } else if (neededForFirst > 10) {
    neededDescription.textContent = 'This target requires more than 10.0 across the remaining years.';
  } else {
    neededDescription.textContent = 'Average GPA needed across the current and remaining years.';
  }
}

function reset() {
  studyStatusSelect.value = 'student';
  currentYearSelect.value = '1';
  createPreviousYearFields();
  calculate();
}

studyStatusSelect.addEventListener('change', () => {
  createPreviousYearFields();
  calculate();
});
currentYearSelect.addEventListener('change', () => {
  createPreviousYearFields();
  calculate();
});
calculateButton.addEventListener('click', calculate);
resetButton.addEventListener('click', reset);
previousYears.addEventListener('input', calculate);
previousYears.addEventListener('click', (event) => {
  const button = event.target.closest('.add-previous-module');
  if (!button) return;
  addPreviousModule(Number(button.dataset.year));
  calculate();
});

createPreviousYearFields();
calculate();
