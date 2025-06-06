// Basic app logic

document.addEventListener('DOMContentLoaded', () => {

  // --- Global Drag State Variables ---
  let activeModal = null;
  let offsetX = 0, offsetY = 0;

  // --- Order Number Generation ---
  // Attempt to load lastOrderDate and orderSequence from sessionStorage.
  // Initialize to defaults if not found.
  // Note: This client-side approach to order number generation has limitations.
  // A robust, unique order number generation system typically requires a backend component
  // to ensure uniqueness across all clients and sessions, and to prevent tampering.
  let lastOrderDate = sessionStorage.getItem('lastOrderDate') || '';
  let orderSequence = parseInt(sessionStorage.getItem('orderSequence')) || 1;

  function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const currentDate = `${year}${month}${day}`;

    if (currentDate !== lastOrderDate) {
      orderSequence = 1; // Reset sequence if day has changed
      lastOrderDate = currentDate;
    }

    const sequenceStr = String(orderSequence).padStart(3, '0');
    orderSequence++;

    // Save the updated values to sessionStorage
    sessionStorage.setItem('lastOrderDate', lastOrderDate);
    sessionStorage.setItem('orderSequence', orderSequence.toString());

    return `${currentDate}-${hours}${minutes}${seconds}-${sequenceStr}`;
  }

  function populateOrderNumber() {
    const orderNumberField = document.getElementById('order-number');
    if (orderNumberField) {
      orderNumberField.value = generateOrderNumber();
    } else {
      console.error('Error: Order number field not found.');
    }
  }

  // --- Generic Dynamic Field Helper Functions ---

  /**
   * Creates and appends a new dynamic field entry.
   * @param {string} containerId - ID of the container for dynamic fields.
   * @param {string} entryClass - CSS class for the div wrapping each field group and its remove button.
   * @param {function} createEntryFieldsFn - A function that creates and returns the DOM elements for the fields within an entry. It receives `entryNumber`.
   * @param {string} removeButtonClassPrefix - A prefix for the remove button's class, to make it specific (e.g., 'remove-vehicle').
   * @param {string} sectionTitlePrefix - Prefix for the entry title, e.g. "Vehicle" for "Vehicle 1", "Vehicle 2"
   */
  function addDynamicFieldEntry(containerId, entryClass, createEntryFieldsFn, removeButtonClassPrefix, sectionTitlePrefix) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Warning: Container ${containerId} not found for dynamic fields.`);
      return;
    }

    // Number of existing dynamic entries (which have a remove button)
    const dynamicEntryCount = container.querySelectorAll(`.${entryClass} .remove-dynamic-field-btn`).length;
    // Total entries will be initial static one (if it exists and is counted by entryClass) + dynamic ones
    // A simpler way for numbering is to count all .entryClass elements if the first one also has this class.
    const entryNumber = container.querySelectorAll(`.${entryClass}`).length + 1;


    const entryDiv = document.createElement('div');
    entryDiv.classList.add(entryClass);

    // Add title like "Vehicle 2", "Certification 2"
    if (sectionTitlePrefix) {
      const titleElement = document.createElement('h5');
      titleElement.textContent = `${sectionTitlePrefix} ${entryNumber}`;
      entryDiv.appendChild(titleElement);
    }
    
    const fieldsFragment = createEntryFieldsFn(entryNumber); // Pass entryNumber for unique IDs/placeholders if needed inside
    entryDiv.appendChild(fieldsFragment);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.classList.add('remove-dynamic-field-btn', `${removeButtonClassPrefix}-btn`);

    entryDiv.appendChild(removeButton);
    container.appendChild(entryDiv);
  }

  /**
   * Handles removal of a dynamic field group and re-numbers entry titles.
   */
  function handleDynamicFieldRemove(event, entryClass, removeButtonClassPrefix, sectionTitlePrefix) {
    if (event.target.classList.contains(`${removeButtonClassPrefix}-btn`)) {
      const entryToRemove = event.target.closest(`.${entryClass}`);
      const container = entryToRemove ? entryToRemove.parentElement : null;

      if (entryToRemove && container) {
        // Prevent removing the very first entry if it's the only one left and designed to be static (e.g. has no remove button initially)
        // This logic assumes the first entry might not have a remove button or is handled differently.
        // For simplicity here, if a remove button is clicked, its entry is removed.
        // If we want to prevent the first one from being removed, that should be handled by not adding a remove button to it,
        // or disabling it. Here, we assume all entries added via addDynamicFieldEntry *will* have a remove button.
        
        // Check if this is the initial entry (which might not have the remove button initially or has it disabled)
        // This check is complex if the initial entry can also be removed.
        // Simpler: if it's the only one, clear its fields instead of removing.
        if (container.querySelectorAll(`.${entryClass}`).length === 1 && entryToRemove === container.firstElementChild) {
            // Clear fields within this last entry
            const inputs = entryToRemove.querySelectorAll('input, textarea');
            inputs.forEach(input => input.value = '');
            // Optionally reset title if it's the first one.
            if (sectionTitlePrefix && entryToRemove.querySelector('h5')) {
                 entryToRemove.querySelector('h5').textContent = `${sectionTitlePrefix} 1`;
            }
        } else {
            entryToRemove.remove();
        }

        // Re-number titles (h5) of remaining entries
        if (sectionTitlePrefix) {
            const remainingEntries = container.querySelectorAll(`.${entryClass}`);
            remainingEntries.forEach((entry, index) => {
              const titleElement = entry.querySelector('h5');
              if (titleElement) {
                titleElement.textContent = `${sectionTitlePrefix} ${index + 1}`;
              }
            });
        }
      }
    }
  }
  
  /**
   * Sets up event listeners for a dynamic field section.
   * @param {string} addButtonId - ID of the 'Add Another...' button.
   * @param {string} containerId - ID of the container for dynamic fields.
   * @param {string} entryClass - CSS class for the div wrapping each field group.
   * @param {function} createEntryFieldsFn - Function to create fields for an entry.
   * @param {string} removeButtonClassPrefix - Prefix for the remove button's class.
   * @param {string} sectionTitlePrefix - Prefix for entry titles (e.g. "Vehicle").
   */
  function setupDynamicFieldSectionListeners(addButtonId, containerId, entryClass, createEntryFieldsFn, removeButtonClassPrefix, sectionTitlePrefix) {
    const addButton = document.getElementById(addButtonId);
    if (addButton) {
      addButton.addEventListener('click', () => addDynamicFieldEntry(containerId, entryClass, createEntryFieldsFn, removeButtonClassPrefix, sectionTitlePrefix));
    } else {
      console.warn(`Warning: Add button ${addButtonId} not found.`);
    }

    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener('click', (event) => handleDynamicFieldRemove(event, entryClass, removeButtonClassPrefix, sectionTitlePrefix));
    } else {
      console.warn(`Warning: Container ${containerId} not found for event delegation.`);
    }
  }

  // --- Field Creation Functions for Dynamic Entries ---

  function createSingleField(entryNumber, fieldClass, basePlaceholderText, fieldElementType = 'input', inputElementType = 'text') {
    const fragment = document.createDocumentFragment();
    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('form-field-float-label-group');

    let fieldElement;
    if (fieldElementType === 'textarea') {
      fieldElement = document.createElement('textarea');
      fieldElement.rows = 3; // Set default rows for textarea
    } else {
      fieldElement = document.createElement('input');
      fieldElement.type = inputElementType;
    }

    const fullLabelText = `${basePlaceholderText} ${entryNumber}`;
    // Ensure a unique ID for each field for the label's 'for' attribute
    const fieldId = `${fieldClass}-${entryNumber}`;

    fieldElement.id = fieldId;
    fieldElement.name = fieldId; // Often name and id are the same or similar
    fieldElement.classList.add(fieldClass);
    fieldElement.placeholder = fullLabelText; // Label text goes into placeholder

    const labelElement = document.createElement('label');
    labelElement.htmlFor = fieldId;
    labelElement.textContent = fullLabelText;

    wrapperDiv.appendChild(fieldElement); // Input first
    wrapperDiv.appendChild(labelElement);   // Then label

    fragment.appendChild(wrapperDiv);
    return fragment;
  }

  function createVehicleFields(entryNumber) {
    const fragment = document.createDocumentFragment();
    const fields = [
      // Original placeholder from fieldInfo.placeholder is removed as label text is used.
      { labelText: 'Type:', type: 'text', class: 'vehicle-type' },
      { labelText: 'Make:', type: 'text', class: 'vehicle-make' },
      { labelText: 'Model:', type: 'text', class: 'vehicle-model' },
      { labelText: 'Plate Number:', type: 'text', class: 'vehicle-plate' }
    ];
    fields.forEach(fieldInfo => {
      const wrapperDiv = document.createElement('div');
      wrapperDiv.classList.add('form-field-float-label-group');
      // This div might also need the class that .vehicle-entry > div had for styling label/input pairs side-by-side on desktop.
      // For now, it's just a float-label group. The parent .vehicle-entry will handle overall layout.

      const fieldId = `vehicle-${fieldInfo.class}-${entryNumber}`;

      const input = document.createElement('input');
      input.type = fieldInfo.type;
      input.id = fieldId;
      input.name = fieldId; // Or a more structured name like `vehicles[${entryNumber}][${fieldInfo.class}]` if submitting as array
      input.classList.add(fieldInfo.class);
      input.placeholder = fieldInfo.labelText; // Use labelText for placeholder

      const label = document.createElement('label');
      label.htmlFor = fieldId;
      label.textContent = fieldInfo.labelText;

      wrapperDiv.appendChild(input); // Input first
      wrapperDiv.appendChild(label);   // Then label
      fragment.appendChild(wrapperDiv);
    });
    return fragment;
  }

  function createCertificationFields(entryNumber) {
    const fragment = document.createDocumentFragment();
    const fields = [
      { labelText: 'Name:', type: 'text', class: 'certification-name' },
      { labelText: 'License Number:', type: 'text', class: 'license-number' },
      { labelText: 'Expiration Date:', type: 'date', class: 'expiration-date' } // Date inputs might not show placeholder text visually in all browsers
    ];
    fields.forEach(fieldInfo => {
      const wrapperDiv = document.createElement('div');
      wrapperDiv.classList.add('form-field-float-label-group');

      const fieldId = `cert-${fieldInfo.class}-${entryNumber}`;

      const input = document.createElement('input');
      input.type = fieldInfo.type;
      input.id = fieldId;
      input.name = fieldId; // Or structured name
      input.classList.add(fieldInfo.class);
      input.placeholder = fieldInfo.labelText; // For date, placeholder might not show, but good for consistency

      const label = document.createElement('label');
      label.htmlFor = fieldId;
      label.textContent = fieldInfo.labelText;

      wrapperDiv.appendChild(input); // Input first
      wrapperDiv.appendChild(label);   // Then label
      fragment.appendChild(wrapperDiv);
    });
    return fragment;
  }
  
  // --- Initialize Dynamic Field Sections ---

  // --- Collapsible Section Logic ---
  const CollapsibleManager = {
    toggleCollapsibleSection: function(triggerElement) {
      const targetId = triggerElement.getAttribute('data-target');
      const panel = document.getElementById(targetId);

      if (panel) {
        triggerElement.classList.toggle('active');
        panel.hidden = !panel.hidden;
        const isExpanded = !panel.hidden;
        triggerElement.setAttribute('aria-expanded', isExpanded.toString());

        const icon = triggerElement.querySelector('.collapsible-icon');
        if (icon) {
          icon.classList.toggle('icon-open', isExpanded);
        }
      } else {
        console.warn(`Warning: Collapsible panel with ID ${targetId} not found.`);
      }
    },

    initCollapsibleSections: function() {
      const triggers = document.querySelectorAll('.collapsible-trigger');
      triggers.forEach(trigger => {
        const targetId = trigger.getAttribute('data-target');
        const panel = document.getElementById(targetId);
        if (panel) {
          const isExpanded = !panel.hidden;
          trigger.setAttribute('aria-expanded', isExpanded.toString());
          const icon = trigger.querySelector('.collapsible-icon');
          if (icon) {
            icon.classList.toggle('icon-open', isExpanded);
          }
        }

        trigger.addEventListener('click', (event) => {
          CollapsibleManager.toggleCollapsibleSection(event.currentTarget);
        });
      });
    }
  };

  // --- Validation Helper ---
  /**
   * Validates a single input field and displays/clears an error message.
   * @param {HTMLElement} inputElement - The input element to validate.
   * @param {function} validationFn - A function that takes the input value and returns true if valid, false otherwise.
   * @param {string} errorMessageText - The error message to display if validation fails.
   * @returns {boolean} True if valid, false otherwise.
   */
  function validateField(inputElement, validationFn, errorMessageText) {
    // Clear previous error message for this field
    let errorSpan = inputElement.nextElementSibling;
    if (errorSpan && errorSpan.classList.contains('error-message')) {
      errorSpan.remove();
    }
    inputElement.classList.remove('input-error'); // Assuming an error class for styling

    const value = inputElement.value.trim();
    if (!validationFn(value)) {
      errorSpan = document.createElement('span');
      errorSpan.classList.add('error-message');
      errorSpan.textContent = errorMessageText;
      inputElement.insertAdjacentElement('afterend', errorSpan);
      inputElement.classList.add('input-error');
      return false;
    }
    return true;
  }

  // Basic validation functions (can be expanded)
  const Validators = {
    isNotEmpty: value => value !== '',
    isPositiveNumber: value => Number(value) > 0,
    matchesPattern: (value, pattern) => pattern.test(value),
    isEmail: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    isPhoneNumber: value => /^[\d\s+\-()]+$/.test(value) // Example, adjust as needed
  };


  /**
   * Resets a dynamic field section. Removes dynamically added entries and clears/resets the first entry.
   * @param {string} containerId - ID of the container for the dynamic fields.
   * @param {string} entryClass - CSS class used for dynamically added entries.
   * @param {object} [options={}] - Options for resetting the first entry.
   * @param {string} [options.firstEntryFieldSelector=null] - CSS selector for the input/textarea in the first entry (for single fields).
   * @param {string} [options.placeholderPrefix=null] - Placeholder prefix to reset for the first single field.
   * @param {string} [options.sectionTitlePrefix=null] - Title prefix to reset for the H5 in the first grouped entry.
   * @param {boolean} [options.clearAllInputsInFirstEntry=false] - Whether to clear all input/textarea in the first entry (for grouped).
   */
  function resetDynamicSection(containerId, entryClass, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove dynamically added entries (all elements with entryClass except the first one if it also has it)
    const allEntries = container.querySelectorAll(`.${entryClass}`);
    allEntries.forEach((entry, index) => {
      if (index > 0) { // Assuming the first entry (index 0) is the one to be cleared, not removed
        entry.remove();
      }
    });

    // Handle the first entry (index 0)
    const firstEntry = container.querySelector(`.${entryClass}`); // Could also be container.firstElementChild if structure is guaranteed
    if (firstEntry) {
      if (options.clearAllInputsInFirstEntry) {
        const inputsToClear = firstEntry.querySelectorAll('input, textarea');
        inputsToClear.forEach(input => input.value = '');
      } else if (options.firstEntryFieldSelector) {
        const initialField = firstEntry.querySelector(options.firstEntryFieldSelector);
        if (initialField) {
          initialField.value = '';
          if (options.placeholderPrefix) {
            initialField.placeholder = `${options.placeholderPrefix} 1`;
          }
        }
      }

      if (options.sectionTitlePrefix && firstEntry.querySelector('h5')) {
        firstEntry.querySelector('h5').textContent = `${options.sectionTitlePrefix} 1`;
      }
       // If the first entry itself was a dynamic one and got removed, and there's a non-entryClass static first element
    } else if (!options.clearAllInputsInFirstEntry && options.firstEntryFieldSelector && container.firstElementChild) {
        // This case handles if the dynamic entries were added after a truly static first element not having `entryClass`
        const staticInitialField = container.querySelector(options.firstEntryFieldSelector);
        if (staticInitialField) {
             staticInitialField.value = '';
            if (options.placeholderPrefix) {
                staticInitialField.placeholder = `${options.placeholderPrefix} 1`;
            }
        }
    }
  }


  /**
   * Collects values from dynamic fields, supporting both single fields and grouped fields.
   * @param {string} containerId - ID of the container for the dynamic fields.
   * @param {string} itemSelector - CSS selector for individual entries (if grouped) or individual fields (if not grouped).
   * @param {boolean} isGrouped - True if fields are grouped within an entry, false otherwise.
   * @param {Object} [fieldsMap=null] - For grouped fields, an object mapping desired keys to their CSS classes within an entry.
   * @returns {Array} An array of values (for single fields) or objects (for grouped fields).
   */
  function collectDynamicValues(containerId, itemSelector, isGrouped, fieldsMap = null) {
    const container = document.getElementById(containerId);
    if (!container) return [];

    const items = container.querySelectorAll(isGrouped ? `.${itemSelector}` : itemSelector); // If not grouped, itemSelector is the field class itself
    const allEntriesData = [];

    items.forEach(itemElement => {
      if (isGrouped) {
        const entryData = {};
        let hasValue = false;
        if (fieldsMap) {
          for (const keyInMap in fieldsMap) {
            const fieldClass = fieldsMap[keyInMap];
            const field = itemElement.querySelector(`.${fieldClass}`); // itemElement is the entry div
            if (field && field.value.trim() !== '') {
              entryData[keyInMap] = field.value.trim();
              hasValue = true;
            } else {
              entryData[keyInMap] = '';
            }
          }
        }
        if (hasValue) {
          allEntriesData.push(entryData);
        }
      } else { // Single field, itemElement is the field itself
        if (itemElement.value.trim() !== '') {
          allEntriesData.push(itemElement.value.trim());
        }
      }
    });
    return allEntriesData;
  }

  // Client Menu
  setupDynamicFieldSectionListeners('add-pickup-address-btn', 'pickup-addresses-container', 'pickup-address-entry', 
    (n) => createSingleField(n, 'pickup-address', 'Pick-up Address', 'input', 'text'), 'remove-pickup-address', null); // No H5 title for these simple ones
  setupDynamicFieldSectionListeners('add-delivery-address-btn', 'delivery-addresses-container', 'delivery-address-entry',
    (n) => createSingleField(n, 'delivery-address', 'Delivery Address', 'input', 'text'), 'remove-delivery-address', null);
  setupDynamicFieldSectionListeners('add-pickup-contact-btn', 'pickup-contacts-container', 'pickup-contact-entry',
    (n) => createSingleField(n, 'pickup-contact', 'Pick-up Contact', 'input', 'tel'), 'remove-pickup-contact', null);
  setupDynamicFieldSectionListeners('add-delivery-contact-btn', 'delivery-contacts-container', 'delivery-contact-entry',
    (n) => createSingleField(n, 'delivery-contact', 'Delivery Contact', 'input', 'tel'), 'remove-delivery-contact', null);
  setupDynamicFieldSectionListeners('add-item-description-btn', 'item-descriptions-container', 'item-description-entry',
    (n) => createSingleField(n, 'item-description', 'Item Description', 'textarea'), 'remove-item-description', null);

  // Driver Menu
  setupDynamicFieldSectionListeners('add-vehicle-btn', 'driver-vehicles-container', 'vehicle-entry', 
    createVehicleFields, 'remove-vehicle', 'Vehicle');
  setupDynamicFieldSectionListeners('add-certification-btn', 'driver-certifications-container', 'certification-entry', 
    createCertificationFields, 'remove-certification', 'Certification/License');
  setupDynamicFieldSectionListeners('add-driver-contact-btn', 'driver-contacts-container', 'driver-contact-entry',
    (n) => createSingleField(n, 'driver-contact', 'Contact Number', 'input', 'tel'), 'remove-driver-contact', "Contact Number"); // H5 title might be a bit much here, but consistent for now


  // Function to handle the creation of a new order
  function handleCreateOrder() {
    const clientOrderForm = document.getElementById('client-order-form');

    if (clientOrderForm) {
      clientOrderForm.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;

        // --- Validate Static Fields ---
        const pickupNameEl = document.getElementById('pickup-name');
        if (!validateField(pickupNameEl, Validators.isNotEmpty, 'Pick-up name is required.')) isValid = false;

        const clientRefEl = document.getElementById('client-ref-number');
        if (!validateField(clientRefEl, value => Validators.isNotEmpty(value) && Validators.matchesPattern(value, /^[A-Za-z0-9\-]+$/), 'Client reference must be alphanumeric/dashes and not empty.')) isValid = false;

        // --- Validate Dynamic Fields ---
        // Example: Validate first pickup address is not empty
        const firstPickupAddressEl = document.querySelector('#pickup-addresses-container .pickup-address');
        if (firstPickupAddressEl && !validateField(firstPickupAddressEl, Validators.isNotEmpty, 'At least one pick-up address is required.')) isValid = false;

        // Example: Validate all provided pickup contacts for pattern (if any)
        const pickupContactFields = document.querySelectorAll('#pickup-contacts-container .pickup-contact');
        pickupContactFields.forEach(contactField => {
          if (contactField.value.trim() !== '') { // Only validate if not empty, as it's optional overall
            if(!validateField(contactField, Validators.isPhoneNumber, 'Invalid phone number format.')) isValid = false;
          }
        });

        // Example: Validate item quantity if an item description is filled
        const itemEntries = document.querySelectorAll('#item-descriptions-container .item-description-entry');
        itemEntries.forEach((entry, index) => {
            const descriptionEl = entry.querySelector('.item-description');
            const qtyEl = entry.querySelector('.item-qty');
            if (descriptionEl && descriptionEl.value.trim() !== '' && qtyEl) {
                if (!validateField(qtyEl, Validators.isPositiveNumber, `Quantity for item ${index + 1} must be a positive number.`)) isValid = false;
            }
        });


        if (!isValid) {
          alert('Please correct the errors in the form.');
          return;
        }

        // Get values from static form fields
        const orderNumber = document.getElementById('order-number').value;
        const pickupName = pickupNameEl.value; // Use validated element's value
        const deliveryName = document.getElementById('delivery-name').value; // Not validated yet, assuming optional or add validation

        // Collect values from dynamic fields using the new helper
        const pickupAddresses = collectDynamicValues('pickup-addresses-container', '.pickup-address', false);
        const deliveryAddresses = collectDynamicValues('delivery-addresses-container', '.delivery-address', false);
        const pickupContacts = collectDynamicValues('pickup-contacts-container', '.pickup-contact', false);
        const deliveryContacts = collectDynamicValues('delivery-contacts-container', '.delivery-contact', false);
        const itemDescriptions = collectDynamicValues('item-descriptions-container', '.item-description', false);
        
        // Log all collected values
        console.log("New Order:", {
          orderNumber,
          pickupName,
          pickupAddresses,
          pickupContacts,
          deliveryName,
          deliveryAddresses,
          deliveryContacts,
          itemDescriptions
        });

        // Clear static form fields
        // document.getElementById('order-number').value = ''; // Assuming read-only or set by system
        document.getElementById('pickup-name').value = '';
        document.getElementById('delivery-name').value = '';
        
        // Clear all dynamic fields
        resetDynamicSection('pickup-addresses-container', 'pickup-address-entry', { firstEntryFieldSelector: '.pickup-address', placeholderPrefix: 'Pick-up Address' });
        resetDynamicSection('delivery-addresses-container', 'delivery-address-entry', { firstEntryFieldSelector: '.delivery-address', placeholderPrefix: 'Delivery Address' });
        resetDynamicSection('pickup-contacts-container', 'pickup-contact-entry', { firstEntryFieldSelector: '.pickup-contact', placeholderPrefix: 'Pick-up Contact' });
        resetDynamicSection('delivery-contacts-container', 'delivery-contact-entry', { firstEntryFieldSelector: '.delivery-contact', placeholderPrefix: 'Delivery Contact' });
        resetDynamicSection('item-descriptions-container', 'item-description-entry', { firstEntryFieldSelector: '.item-description', placeholderPrefix: 'Item Description' });

        // Populate a new order number for the next order
        populateOrderNumber();
      });
    } else {
      console.error('Error: Client order form not found. Cannot attach submit listener.');
    }
  }

  // Function to handle driver profile updates
  function handleUpdateProfile() {
    const driverProfileForm = document.getElementById('driver-profile-form');

    if (driverProfileForm) {
      driverProfileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        let isValid = true;

        // --- Validate Static Fields ---
        const driverNameEl = document.getElementById('driver-name-static');
        if (!validateField(driverNameEl, Validators.isNotEmpty, 'Driver name is required.')) isValid = false;

        // --- Validate Dynamic Grouped Fields ---
        // Example: Validate vehicles - type and plate required for each
        const vehicleEntries = document.querySelectorAll('#driver-vehicles-container .vehicle-entry');
        vehicleEntries.forEach((entry, index) => {
          const typeEl = entry.querySelector('.vehicle-type');
          const plateEl = entry.querySelector('.vehicle-plate');
          // Only validate if it's not the first empty template row or if it has some data
          if (typeEl && plateEl && (typeEl.value.trim() !== '' || plateEl.value.trim() !== '')) {
            if (!validateField(typeEl, Validators.isNotEmpty, `Vehicle type for vehicle ${index + 1} is required.`)) isValid = false;
            if (!validateField(plateEl, Validators.isNotEmpty, `Plate number for vehicle ${index + 1} is required.`)) isValid = false;
          }
        });

        // Example: Validate driver contacts for pattern (if any)
        const driverContactFields = document.querySelectorAll('#driver-contacts-container .driver-contact');
        driverContactFields.forEach(contactField => {
          if (contactField.value.trim() !== '') { // Only validate if not empty
            if(!validateField(contactField, Validators.isPhoneNumber, 'Invalid phone number format.')) isValid = false;
          }
        });

        if (!isValid) {
          alert('Please correct the errors in the form.');
          return;
        }

        const driverName = driverNameEl.value; // Use validated element's value

        const vehicles = collectDynamicValues('driver-vehicles-container', 'vehicle-entry', true, {
          type: 'vehicle-type', make: 'vehicle-make', model: 'vehicle-model', plate: 'vehicle-plate'
        });
        const certifications = collectDynamicValues('driver-certifications-container', 'certification-entry', true, {
          name: 'certification-name', licenseNumber: 'license-number', expirationDate: 'expiration-date'
        });
        const driverContacts = collectDynamicValues('driver-contacts-container', '.driver-contact', false);

        console.log("Driver Profile Update:", {
          driverName,
          vehicles,
          certifications,
          driverContacts
        });

        // Clear form fields
        document.getElementById('driver-name-static').value = '';
        resetDynamicSection('driver-vehicles-container', 'vehicle-entry', { sectionTitlePrefix: 'Vehicle', clearAllInputsInFirstEntry: true });
        resetDynamicSection('driver-certifications-container', 'certification-entry', { sectionTitlePrefix: 'Certification/License', clearAllInputsInFirstEntry: true });
        resetDynamicSection('driver-contacts-container', 'driver-contact-entry', { firstEntryFieldSelector: '.driver-contact', placeholderPrefix: 'Contact Number', sectionTitlePrefix: 'Contact Number' }); // Assuming H5 for driver contacts too
      });
    } else {
      console.error('Error: Driver profile form not found. Cannot attach submit listener.');
    }
  }

  // Call the functions to attach event listeners
  handleCreateOrder();
  handleUpdateProfile();
  initMap(); // Initialize the map
  populateOrderNumber(); // Populate initial order number on load
  initMenuToggles(); // Initialize menu toggle functionality
  CollapsibleManager.initCollapsibleSections(); // Initialize collapsible sections
  initDraggableModals(); // Initialize modal dragging

  // Expose functions for testing purposes
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
    console.log('TEST MODE: Exposing functions to window object');
    window.setupDynamicFieldSectionListeners = setupDynamicFieldSectionListeners;
    window.handleDynamicFieldRemove = handleDynamicFieldRemove;
    window.validateField = validateField;
    window.Validators = Validators;
    window.CollapsibleManager = CollapsibleManager; // Expose the manager
    window.collectDynamicValues = collectDynamicValues; // Expose for testing
    window.initDraggableModals = initDraggableModals; // Expose for testing
    window.onDragStart = onDragStart; // Expose for testing (or direct test via dispatch)
    window.onDragEnd = onDragEnd;     // Expose for testing (manual cleanup if needed)
    // initMenuToggles is already global
    // addDynamicFieldEntry and other helpers could also be exposed if direct unit tests are needed
  }
});

// Function to initialize menu toggle buttons
function initMenuToggles() {
  const clientMenuToggleBtn = document.getElementById('vertical-client-toggle');
  const driverMenuToggleBtn = document.getElementById('vertical-driver-toggle');
  const clientMenuContainer = document.getElementById('client-menu-container'); // Renamed for clarity
  const driverMenuContainer = document.getElementById('driver-menu-container'); // Renamed for clarity
  const closeClientMenuBtn = document.getElementById('close-client-menu-btn');
  const closeDriverMenuBtn = document.getElementById('close-driver-menu-btn');

  if (!clientMenuToggleBtn || !driverMenuToggleBtn || !clientMenuContainer || !driverMenuContainer || !closeClientMenuBtn || !closeDriverMenuBtn) {
    console.error('Error: One or more menu elements (toggle buttons, containers, or close buttons) not found. Ensure all IDs are correct.');
    return;
  }

  function resetModalPosition(modalContentElement) {
    if (modalContentElement) {
      modalContentElement.style.left = '';
      modalContentElement.style.top = '';
      modalContentElement.style.transform = ''; // Reset transform for CSS centering
    }
  }

  function hideClientMenu() {
    if (clientMenuContainer) {
      clientMenuContainer.style.display = 'none';
      clientMenuContainer.hidden = true;
      clientMenuToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function hideDriverMenu() {
    if (driverMenuContainer) {
      driverMenuContainer.style.display = 'none';
      driverMenuContainer.hidden = true;
      driverMenuToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  clientMenuToggleBtn.addEventListener('click', () => {
    const isClientMenuVisible = clientMenuContainer.style.display === 'block';
    
    if (isClientMenuVisible) {
      hideClientMenu();
    } else {
      const modalContent = clientMenuContainer.querySelector('.menu-modal-content');
      resetModalPosition(modalContent);
      clientMenuContainer.style.display = 'block';
      clientMenuContainer.hidden = false;
      clientMenuToggleBtn.setAttribute('aria-expanded', 'true');
      hideDriverMenu();
    }
  });

  driverMenuToggleBtn.addEventListener('click', () => {
    const isDriverMenuVisible = driverMenuContainer.style.display === 'block';

    if (isDriverMenuVisible) {
      hideDriverMenu();
    } else {
      const modalContent = driverMenuContainer.querySelector('.menu-modal-content');
      resetModalPosition(modalContent);
      driverMenuContainer.style.display = 'block';
      driverMenuContainer.hidden = false;
      driverMenuToggleBtn.setAttribute('aria-expanded', 'true');
      hideClientMenu();
    }
  });

  // Event listeners for close buttons
  closeClientMenuBtn.addEventListener('click', hideClientMenu);
  closeDriverMenuBtn.addEventListener('click', hideDriverMenu);

  // Add close on overlay click
  if (clientMenuContainer) {
    clientMenuContainer.addEventListener('click', function(event) {
      // event.target is the #client-menu-container (the overlay)
      // NOT clientMenuContainer.querySelector('.menu-modal-content')
      if (event.target === clientMenuContainer) {
        hideClientMenu();
      }
    });
  }

  if (driverMenuContainer) {
    driverMenuContainer.addEventListener('click', function(event) {
      if (event.target === driverMenuContainer) {
        hideDriverMenu();
      }
    });
  }
}

// --- Modal Dragging Functions ---
function onDragStart(event) {
  const header = event.target.closest('.modal-header');
  if (!header) return;

  activeModal = header.closest('.menu-modal-content');
  if (!activeModal) return;

  if (window.innerWidth < 768) { // Check screen width *before* preventDefault and listener attachment
    // For small screens, don't initiate drag.
    return;
  }

  event.preventDefault(); // Prevent text selection, etc., *only if dragging*

  // Ensure transform is cleared so left/top work as absolute pixel values for dragging
  // The initial centering is done by CSS transform. Once dragged, we switch to top/left.
  activeModal.style.transform = 'none';

  offsetX = event.clientX - activeModal.getBoundingClientRect().left;
  offsetY = event.clientY - activeModal.getBoundingClientRect().top;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', onDragEnd);
  activeModal.classList.add('modal-dragging');
}

function onDrag(event) {
  if (!activeModal) return;

  let newLeft = event.clientX - offsetX;
  let newTop = event.clientY - offsetY;

  const header = activeModal.querySelector('.modal-header'); // For boundary check
  if(header){
    // Basic boundary check to keep modal header roughly in view
    newLeft = Math.max(-activeModal.offsetWidth + header.offsetWidth, Math.min(newLeft, window.innerWidth - header.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - header.offsetHeight));
  }


  activeModal.style.left = newLeft + 'px';
  activeModal.style.top = newTop + 'px';
}

function onDragEnd() {
  if (!activeModal) return;

  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', onDragEnd);
  activeModal.classList.remove('modal-dragging');
  activeModal = null;
}

function initDraggableModals() {
  const modalHeaders = document.querySelectorAll('.modal-header');
  modalHeaders.forEach(header => {
    header.addEventListener('mousedown', onDragStart);
  });
}

// Function to initialize the Leaflet map
function initMap() {
  const mapPlaceholder = document.getElementById('map-placeholder');

  if (!mapPlaceholder) {
    console.error('Error: Map placeholder element not found.');
    return;
  }

  // Check if map is already initialized
  if (mapPlaceholder._leaflet_id) {
    console.warn('Warning: Map already initialized.');
    return;
  }

  try {
    const map = L.map('map-placeholder').setView([51.505, -0.09], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([51.505, -0.09]).addTo(map)
      .bindPopup('A default marker at [51.505, -0.09].')
      .openPopup();
      
    console.log('Map initialized successfully.');
  } catch (error) {
    console.error('Error: Error initializing Leaflet map: ' + error.message);
    mapPlaceholder.innerHTML = '<p style="color:red; text-align:center; font-weight:bold;">Map Error: Could not initialize the map. ' + error.message + '</p>';
  }
}
