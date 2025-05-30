// Test suite for app.js functionalities

// --- Test Helper Functions ---
let testCount = 0;
let passCount = 0;

function logTestResult(testName, passed, message = '') {
  testCount++;
  if (passed) {
    passCount++;
    console.log(`%cPASSED: ${testName}`, 'color: green;');
  } else {
    console.error(`FAILED: ${testName}. ${message}`);
  }
}

// Holds the currently active test container for cleanup
let currentTestDOMContainer = null;

function setupDOM(html) {
  cleanupDOM(); // Clean up any previous DOM
  const container = document.createElement('div');
  // Use a unique ID for each test setup to avoid potential clashes if cleanup fails
  container.id = 'test-container-' + Date.now() + Math.random().toString(36).substring(2, 7);
  container.innerHTML = html;
  document.body.appendChild(container);
  currentTestDOMContainer = container; // Store reference for cleanup
  return container;
}

function cleanupDOM() {
  if (currentTestDOMContainer) {
    currentTestDOMContainer.remove();
    currentTestDOMContainer = null;
  }
  // Fallback for any other test containers that might have been missed
  const oldContainers = document.querySelectorAll('[id^="test-container"]');
  oldContainers.forEach(c => c.remove());
}

function resetTestCounts() {
  testCount = 0;
  passCount = 0;
}

// --- Test Functions ---

function testHandleDynamicFieldRemove() {
  const testSuiteName = 'testHandleDynamicFieldRemove';
  
  // Test Case 1: Remove an entry with title prefix
  let testCase1Name = `${testSuiteName} - Case 1: Remove entry with title`;
  let localTestPass1 = true;
  let testMessages1 = [];
  const dom1ContainerId = 'fields-container-1';
  const dom1AddBtnId = 'add-btn-1';
  const entryClass1 = 'field-entry-1';
  const removeBtnClassPrefix1 = 'remove-field-1';
  const sectionTitlePrefix1 = 'Field';

  const dom1 = setupDOM(`
    <button id="${dom1AddBtnId}">Add</button>
    <div id="${dom1ContainerId}">
      <div class="${entryClass1}"><h5>${sectionTitlePrefix1} 1</h5><input type="text" value="Data 1"><button type="button" class="${removeBtnClassPrefix1}-btn">Remove</button></div>
      <div class="${entryClass1}"><h5>${sectionTitlePrefix1} 2</h5><input type="text" value="Data 2"><button type="button" class="${removeBtnClassPrefix1}-btn">Remove</button></div>
      <div class="${entryClass1}"><h5>${sectionTitlePrefix1} 3</h5><input type="text" value="Data 3"><button type="button" class="${removeBtnClassPrefix1}-btn">Remove</button></div>
    </div>
  `);
  
  if (window.setupDynamicFieldSectionListeners) {
    window.setupDynamicFieldSectionListeners(dom1AddBtnId, dom1ContainerId, entryClass1, () => {}, removeBtnClassPrefix1, sectionTitlePrefix1);
  } else {
    logTestResult(testCase1Name, false, "setupDynamicFieldSectionListeners not found on window. Ensure app.js exposes it.");
    return; // Cannot proceed with this test suite
  }
  
  const container1 = dom1.querySelector('#' + dom1ContainerId);
  const removeBtn2 = container1.querySelectorAll(`.${removeBtnClassPrefix1}-btn`)[1]; // Remove "Field 2"
  removeBtn2.click();

  const remainingEntries1 = container1.querySelectorAll('.' + entryClass1);
  if (remainingEntries1.length !== 2) {
    localTestPass1 = false;
    testMessages1.push('Entry not removed. Expected 2, got ' + remainingEntries1.length);
  }
  const firstTitle1 = remainingEntries1[0] ? remainingEntries1[0].querySelector('h5').textContent : '';
  const secondTitle1 = remainingEntries1[1] ? remainingEntries1[1].querySelector('h5').textContent : '';
  // After removing the 2nd element, the 3rd element becomes the 2nd and should be re-titled.
  if (firstTitle1 !== `${sectionTitlePrefix1} 1` || secondTitle1 !== `${sectionTitlePrefix1} 2`) {
    localTestPass1 = false;
    testMessages1.push(`Titles not re-numbered correctly. Expected "${sectionTitlePrefix1} 1", "${sectionTitlePrefix1} 2", got "${firstTitle1}", "${secondTitle1}"`);
  }
  logTestResult(testCase1Name, localTestPass1, testMessages1.join('; '));
  cleanupDOM();

  // Test Case 2: "Remove" the last entry (clear fields, reset title)
  let testCase2Name = `${testSuiteName} - Case 2: Clear last entry`;
  let localTestPass2 = true;
  let testMessages2 = [];
  const dom2ContainerId = 'fields-container-2';
  const dom2AddBtnId = 'add-btn-2';
  const entryClass2 = 'field-entry-2';
  const removeBtnClassPrefix2 = 'remove-field-2';
  const sectionTitlePrefix2 = 'Item';

  const dom2 = setupDOM(`
    <button id="${dom2AddBtnId}">Add</button>
    <div id="${dom2ContainerId}">
      <div class="${entryClass2}"><h5>${sectionTitlePrefix2} 1</h5><input type="text" value="Data 1"><button type="button" class="${removeBtnClassPrefix2}-btn">Remove</button></div>
    </div>
  `);
  window.setupDynamicFieldSectionListeners(dom2AddBtnId, dom2ContainerId, entryClass2, () => {}, removeBtnClassPrefix2, sectionTitlePrefix2);
  
  const container2 = dom2.querySelector('#' + dom2ContainerId);
  const removeBtnSingle = container2.querySelector(`.${removeBtnClassPrefix2}-btn`);
  removeBtnSingle.click();
  
  const remainingEntries2 = container2.querySelectorAll('.' + entryClass2);
  const inputField2 = container2.querySelector('input[type="text"]');
  const title2 = container2.querySelector('h5');

  if (remainingEntries2.length !== 1) {
    localTestPass2 = false;
    testMessages2.push('Entry should not be removed, but cleared. Expected 1, got ' + remainingEntries2.length);
  }
  if (inputField2.value !== '') {
    localTestPass2 = false;
    testMessages2.push('Input field not cleared. Value: ' + inputField2.value);
  }
  if (title2 && title2.textContent !== `${sectionTitlePrefix2} 1`) {
    localTestPass2 = false;
    testMessages2.push(`Title not reset correctly. Expected "${sectionTitlePrefix2} 1", got ${title2 ? title2.textContent : 'null'}`);
  }
  logTestResult(testCase2Name, localTestPass2, testMessages2.join('; '));
  cleanupDOM();

  // Test Case 3: Remove an entry without title prefix
  let testCase3Name = `${testSuiteName} - Case 3: Remove entry without title`;
  let localTestPass3 = true;
  let testMessages3 = [];
  const dom3ContainerId = 'fields-container-3';
  const dom3AddBtnId = 'add-btn-3';
  const entryClass3 = 'field-entry-3';
  const removeBtnClassPrefix3 = 'remove-field-3';

  const dom3 = setupDOM(`
    <button id="${dom3AddBtnId}">Add</button>
    <div id="${dom3ContainerId}">
      <div class="${entryClass3}"><input type="text" value="Data 1"><button type="button" class="${removeBtnClassPrefix3}-btn">Remove</button></div>
      <div class="${entryClass3}"><input type="text" value="Data 2"><button type="button" class="${removeBtnClassPrefix3}-btn">Remove</button></div>
    </div>
  `);
  window.setupDynamicFieldSectionListeners(dom3AddBtnId, dom3ContainerId, entryClass3, () => {}, removeBtnClassPrefix3, null); // No sectionTitlePrefix

  const container3 = dom3.querySelector('#' + dom3ContainerId);
  const removeBtnNt = container3.querySelectorAll(`.${removeBtnClassPrefix3}-btn`)[0];
  removeBtnNt.click();
  const remainingEntries3 = container3.querySelectorAll('.' + entryClass3);
  if (remainingEntries3.length !== 1) {
    localTestPass3 = false;
    testMessages3.push('Entry without title not removed. Expected 1, got ' + remainingEntries3.length);
  }
  if (remainingEntries3[0] && remainingEntries3[0].querySelector('h5')) {
    localTestPass3 = false;
    testMessages3.push('Titles should not exist or be processed if no prefix given.');
  }
  logTestResult(testCase3Name, localTestPass3, testMessages3.join('; '));
  cleanupDOM();
}


function testInitMenuToggles() {
  const testSuiteName = 'testInitMenuToggles';
  let localTestPass = true;
  let overallMessages = [];

  cleanupDOM(); // Ensure a clean slate before this test suite
  const dom = setupDOM(`
    <button id="client-menu-toggle-btn" aria-expanded="false" aria-controls="client-menu-container">Client Toggle</button>
    <div id="client-menu-container" style="display: none;" hidden>
      <button id="close-client-menu-btn">Close Client</button>
    </div>
    <button id="driver-menu-toggle-btn" aria-expanded="false" aria-controls="driver-menu-container">Driver Toggle</button>
    <div id="driver-menu-container" style="display: none;" hidden>
      <button id="close-driver-menu-btn">Close Driver</button>
    </div>
  `);

  // Call the actual initMenuToggles function from app.js (it's global)
  if (typeof initMenuToggles !== 'function') {
     logTestResult(testSuiteName, false, "initMenuToggles function not found. Ensure app.js is loaded and it's global.");
     cleanupDOM();
     return;
  }
  initMenuToggles(); // Initialize listeners on the test DOM

  const clientBtn = dom.querySelector('#client-menu-toggle-btn');
  const clientPanel = dom.querySelector('#client-menu-container');
  const driverBtn = dom.querySelector('#driver-menu-toggle-btn');
  const driverPanel = dom.querySelector('#driver-menu-container');
  const closeClientBtn = dom.querySelector('#close-client-menu-btn');
  const closeDriverBtn = dom.querySelector('#close-driver-menu-btn');
  
  // Test Case 1: Client menu toggle open/close
  clientBtn.click(); // Open
  if (clientPanel.style.display !== 'block' || clientPanel.hidden !== false || clientBtn.getAttribute('aria-expanded') !== 'true') {
    localTestPass = false;
    overallMessages.push('Case 1a: Client menu not opened correctly.');
  }
  clientBtn.click(); // Close
  if (clientPanel.style.display !== 'none' || clientPanel.hidden !== true || clientBtn.getAttribute('aria-expanded') !== 'false') {
    localTestPass = false;
    overallMessages.push('Case 1b: Client menu not closed correctly.');
  }

  // Test Case 2: Driver menu toggle open/close
  driverBtn.click(); // Open
  if (driverPanel.style.display !== 'block' || driverPanel.hidden !== false || driverBtn.getAttribute('aria-expanded') !== 'true') {
    localTestPass = false;
    overallMessages.push('Case 2a: Driver menu not opened correctly.');
  }
  driverBtn.click(); // Close
  if (driverPanel.style.display !== 'none' || driverPanel.hidden !== true || driverBtn.getAttribute('aria-expanded') !== 'false') {
    localTestPass = false;
    overallMessages.push('Case 2b: Driver menu not closed correctly.');
  }

  // Test Case 3: Client menu opens, ensure driver menu is closed if it was open
  driverPanel.style.display = 'block'; // Manually open driver first
  driverPanel.hidden = false;
  driverBtn.setAttribute('aria-expanded', 'true');
  clientBtn.click(); // Open client
  if (clientPanel.style.display !== 'block' || clientPanel.hidden !== false || clientBtn.getAttribute('aria-expanded') !== 'true') {
    localTestPass = false;
    overallMessages.push('Case 3a: Client menu not opened.');
  }
  if (driverPanel.style.display !== 'none' || driverPanel.hidden !== true || driverBtn.getAttribute('aria-expanded') !== 'false') {
    localTestPass = false;
    overallMessages.push('Case 3b: Driver menu not closed when client opened.');
  }
  clientBtn.click(); // Close client to reset

  // Test Case 4: Driver menu opens, ensure client menu is closed
  clientPanel.style.display = 'block'; // Manually open client first
  clientPanel.hidden = false;
  clientBtn.setAttribute('aria-expanded', 'true');
  driverBtn.click(); // Open driver
  if (driverPanel.style.display !== 'block' || driverPanel.hidden !== false || driverBtn.getAttribute('aria-expanded') !== 'true') {
    localTestPass = false;
    overallMessages.push('Case 4a: Driver menu not opened.');
  }
  if (clientPanel.style.display !== 'none' || clientPanel.hidden !== true || clientBtn.getAttribute('aria-expanded') !== 'false') {
    localTestPass = false;
    overallMessages.push('Case 4b: Client menu not closed when driver opened.');
  }
  driverBtn.click(); // Close driver

  // Test Case 5: Client menu close button
  clientBtn.click(); // Open client menu
  if (clientPanel.style.display !== 'block') { // Ensure it's open before trying to close
      localTestPass = false; overallMessages.push('Case 5 Pre-check: Client panel did not open.');
  } else {
    closeClientBtn.click(); // Click close button
    if (clientPanel.style.display !== 'none' || clientPanel.hidden !== true || clientBtn.getAttribute('aria-expanded') !== 'false') {
      localTestPass = false;
      overallMessages.push('Case 5: Client menu not closed by its close button.');
    }
  }
  

  // Test Case 6: Driver menu close button
  driverBtn.click(); // Open driver menu
  if (driverPanel.style.display !== 'block') { // Ensure it's open
      localTestPass = false; overallMessages.push('Case 6 Pre-check: Driver panel did not open.');
  } else {
    closeDriverBtn.click(); // Click close button
    if (driverPanel.style.display !== 'none' || driverPanel.hidden !== true || driverBtn.getAttribute('aria-expanded') !== 'false') {
      localTestPass = false;
      overallMessages.push('Case 6: Driver menu not closed by its close button.');
    }
  }
  
  logTestResult(testSuiteName, localTestPass, overallMessages.join('; '));
  cleanupDOM(); // Clean up the test-specific DOM
}


// --- Run All Tests ---
function runTests() {
  resetTestCounts();
  console.log('Starting tests...');

  // Check if necessary functions are exposed from app.js
  if (typeof window.setupDynamicFieldSectionListeners !== 'function' || typeof window.handleDynamicFieldRemove !== 'function') {
    console.error('FAILURE: Critical test functions (setupDynamicFieldSectionListeners or handleDynamicFieldRemove) are not exposed on the window object. Ensure app.js is loaded and correctly exposes these for testing.');
    // Log a failed test to indicate a setup problem
    logTestResult('Global Setup Check', false, 'Required functions not exposed by app.js.');
  } else {
    testHandleDynamicFieldRemove();
  }
  
  if (typeof initMenuToggles !== 'function') {
    console.error('FAILURE: initMenuToggles is not defined globally. Ensure app.js is loaded.');
    logTestResult('Global Setup Check for Menus', false, 'initMenuToggles not global.');
  } else {
    testInitMenuToggles();
  }

  console.log(`\nTests finished. ${passCount}/${testCount} passed.`);
  cleanupDOM(); // Final cleanup
}

// --- Event Listener for Run Tests Button ---
document.addEventListener('DOMContentLoaded', () => {
  const runTestsButton = document.getElementById('run-tests-btn');
  if (runTestsButton) {
    runTestsButton.addEventListener('click', runTests);
  } else {
    // If the button isn't in index.html yet, create it for easier ad-hoc testing.
    console.warn('Run Tests button not found in HTML. Creating one dynamically for convenience.');
    const button = document.createElement('button');
    button.id = 'run-tests-btn';
    button.textContent = 'Run Tests (Dynamically Added)';
    // Try to add it somewhere visible, like top of body
    if(document.body) {
        document.body.insertBefore(button, document.body.firstChild);
    } else { // Fallback if body isn't ready somehow, though DOMContentLoaded should ensure it is
        document.documentElement.appendChild(button);
    }
    button.addEventListener('click', runTests);
  }
});
