// Basic app logic

document.addEventListener('DOMContentLoaded', () => {

  // --- Global Data Storage ---
  let orders = [];
  let drivers = [];
  let leafletMap = null; // Map instance, accessible within DCL scope

  // Shared city coordinates for placeholder geocoding
  const cityCoordinates = {
    "New York": [40.7128, -74.0060],
    "Los Angeles": [34.0522, -118.2437],
    "Chicago": [41.8781, -87.6298],
    "Houston": [29.7604, -95.3698],
    "Phoenix": [33.4484, -112.0740],
    "Philadelphia": [39.9526, -75.1652],
    "London": [51.5074, -0.1278], 
    // Add more cities as needed
  };

  // --- Order Number Generation ---
  let lastOrderDate = '';
  let orderSequence = 1;

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

    return `${currentDate}-${hours}${minutes}${seconds}-${sequenceStr}`;
  }

  function populateOrderNumber() {
    const orderNumberField = document.getElementById('order-number');
    if (orderNumberField) {
      orderNumberField.value = generateOrderNumber();
    } else {
      console.error('Order number field not found.');
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
      console.error(`Container ${containerId} not found.`);
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
      console.warn(`Add button ${addButtonId} not found.`);
    }

    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener('click', (event) => handleDynamicFieldRemove(event, fieldClass, entryClass, placeholderPrefix));
    } else {
      console.warn(`Container ${containerId} not found for event delegation.`);
    }
  }

  // --- Field Creation Functions for Dynamic Entries ---

// Global Helper to clear/reset dynamic fields
function clearDynamicFields(containerId, entryClass, sectionTitlePrefix, fieldDefinitions) {
    // fieldDefinitions: For simple entries, it's { class: 'field-class', placeholder: 'Placeholder Prefix' }
    //                    For complex entries, it's an array of { class: 'field-class', placeholder: 'Specific Placeholder' (optional for complex) }
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`clearDynamicFields: Container ${containerId} not found.`);
      return;
    }

    const allEntries = container.querySelectorAll(`.${entryClass}`);
    allEntries.forEach((entry, index) => {
    if (index === 0) { // This is the initial entry, clear its fields
        if (Array.isArray(fieldDefinitions)) { // Complex entry
        fieldDefinitions.forEach(fieldDef => {
            const input = entry.querySelector(`.${fieldDef.class}`);
            if (input) {
            input.value = '';
            // Placeholder for complex fields is usually static, set in HTML/JS create function
            }
        });
        } else { // Simple entry (fieldDefinitions is an object)
          if (fieldDefinitions && fieldDefinitions.class) {
            const input = entry.querySelector(`.${fieldDefinitions.class}`);
            if (input) {
                input.value = '';
                if (fieldDefinitions.placeholder) { // Check if placeholder exists
                    input.placeholder = `${fieldDefinitions.placeholder} 1`;
                }
            } else {
                 console.warn(`clearDynamicFields: Initial field .${fieldDefinitions.class} not found in .${entryClass} within ${containerId}`);
            }
          } else {
             console.warn(`clearDynamicFields: fieldDefinitions object or its 'class' property is missing for simple entry in ${containerId}`);
          }
        }
        // Reset H5 title if it exists for the first entry
        const titleElement = entry.querySelector('h5');
        if (titleElement && sectionTitlePrefix) {
        titleElement.textContent = `${sectionTitlePrefix} 1`;
        }
    } else { // These are dynamically added entries, remove them
        entry.remove();
    }
    });

    // If the first entry was removed because it didn't have the entryClass initially (not current setup)
    // or if the container is now empty but should have an initial entry structure (less likely with current HTML)
    if (allEntries.length === 0 && container.firstElementChild && !container.querySelector(`.${entryClass}`)) {
        // This case might need specific handling if the initial entry is ever set up without entryClass.
        // For current setup, this block is unlikely to be hit as initial entries have entryClass.
        console.warn(`clearDynamicFields: Container ${containerId} is empty after processing, initial entry structure might need review if it was not part of 'allEntries'.`);
    }
}


  function createSingleField(entryNumber, fieldClass, placeholderPrefix, fieldElementType = 'input', inputElementType = 'text') {
    const fragment = document.createDocumentFragment();
    let fieldElement;
    if (fieldElementType === 'textarea') {
      fieldElement = document.createElement('textarea');
    } else {
      fieldElement = document.createElement('input');
      fieldElement.type = inputElementType;
    }
    fieldElement.classList.add(fieldClass);
    // Placeholder for single fields already includes the number via addDynamicFieldEntry's old logic.
    // The new addDynamicFieldEntry doesn't directly handle placeholder for single fields,
    // so the create function or the call site must adapt.
    // For single fields, the 'sectionTitlePrefix' in addDynamicFieldEntry can be the placeholderPrefix.
    // And the h5 title might not be needed.
    // Let's adjust: the placeholder is now set here.
    fieldElement.placeholder = `${placeholderPrefix} ${entryNumber}`;
    fragment.appendChild(fieldElement);
    return fragment;
  }

  function createItemEntryFields(entryNumber) {
    const fragment = document.createDocumentFragment();

    // No H5 title here, addDynamicFieldEntry will add it based on sectionTitlePrefix ("Item")

    const descriptionTextarea = document.createElement('textarea');
    descriptionTextarea.classList.add('item-description');
    descriptionTextarea.placeholder = 'Item Description'; // Placeholder is generic for each item
    fragment.appendChild(descriptionTextarea);

    const line1Div = document.createElement('div');
    line1Div.classList.add('item-details-line-1'); // For styling Qty and Weight together

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.classList.add('item-qty');
    qtyInput.placeholder = 'Qty';
    qtyInput.min = '1';
    qtyInput.title = 'Quantity';
    line1Div.appendChild(qtyInput);

    const weightInput = document.createElement('input');
    weightInput.type = 'text'; // Changed to text to allow units like 'kg' or 'lbs'
    weightInput.classList.add('item-weight');
    weightInput.placeholder = 'Weight (e.g., 5kg)';
    weightInput.title = 'Weight';
    line1Div.appendChild(weightInput);
    fragment.appendChild(line1Div);

    const line2Div = document.createElement('div');
    line2Div.classList.add('item-details-line-2'); // For styling dimensions together
    
    // Adding a label for the dimensions group within the JS-created part might be redundant if placeholders are clear
    // Or, it can be added for clarity, matching the initial HTML structure.
    // For now, omitting the explicit "Dimensions (LxWxH):" label in dynamic entries for simplicity, relying on placeholders.

    const lengthInput = document.createElement('input');
    lengthInput.type = 'text';
    lengthInput.classList.add('item-length');
    lengthInput.placeholder = 'L';
    lengthInput.title = 'Length';
    line2Div.appendChild(lengthInput);

    const widthInput = document.createElement('input');
    widthInput.type = 'text';
    widthInput.classList.add('item-width');
    widthInput.placeholder = 'W';
    widthInput.title = 'Width';
    line2Div.appendChild(widthInput);

    const heightInput = document.createElement('input');
    heightInput.type = 'text';
    heightInput.classList.add('item-height');
    heightInput.placeholder = 'H';
    heightInput.title = 'Height';
    line2Div.appendChild(heightInput);
    fragment.appendChild(line2Div);

    return fragment;
  }

  function createDriverAddressFields(entryNumber) {
    const fragment = document.createDocumentFragment();
    const fields = [
      { type: 'text', class: 'driver-address-street', placeholder: 'Street Address' },
      { type: 'text', class: 'driver-address-city', placeholder: 'City' },
      { type: 'text', class: 'driver-address-state', placeholder: 'State' },
      { type: 'text', class: 'driver-address-zip', placeholder: 'Zip Code' },
      { type: 'text', class: 'driver-address-country', placeholder: 'Country' }
    ];
    fields.forEach(fieldInfo => {
      const input = document.createElement('input');
      input.type = fieldInfo.type;
      input.classList.add(fieldInfo.class);
      input.placeholder = fieldInfo.placeholder;
      // Each input will be on its own line by default block behavior, or styled with CSS
      fragment.appendChild(input);
    });
    return fragment;
  }

  function createVehicleFields(entryNumber) {
    const fragment = document.createDocumentFragment();
    const fields = [
      { label: 'Type:', type: 'text', class: 'vehicle-type', placeholder: 'e.g., Sedan, Truck' },
      { label: 'Make:', type: 'text', class: 'vehicle-make', placeholder: 'e.g., Toyota' },
      { label: 'Model:', type: 'text', class: 'vehicle-model', placeholder: 'e.g., Camry' },
      { label: 'Plate Number:', type: 'text', class: 'vehicle-plate', placeholder: 'e.g., ABC-123' }
    ];
    fields.forEach(fieldInfo => {
      const div = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = fieldInfo.label;
      const input = document.createElement('input');
      input.type = fieldInfo.type;
      input.classList.add(fieldInfo.class);
      input.placeholder = fieldInfo.placeholder;
      div.appendChild(label);
      div.appendChild(input);
      fragment.appendChild(div);
    });
    return fragment;
  }

  function createCertificationFields(entryNumber) {
    const fragment = document.createDocumentFragment();
    const fields = [
      { label: 'Name:', type: 'text', class: 'certification-name', placeholder: 'e.g., Driver\'s License' },
      { label: 'License Number:', type: 'text', class: 'license-number', placeholder: 'e.g., DL12345' },
      { label: 'Expiration Date:', type: 'date', class: 'expiration-date', placeholder: '' }
    ];
    fields.forEach(fieldInfo => {
      const div = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = fieldInfo.label;
      const input = document.createElement('input');
      input.type = fieldInfo.type;
      input.classList.add(fieldInfo.class);
      if (fieldInfo.placeholder) input.placeholder = fieldInfo.placeholder;
      div.appendChild(label);
      div.appendChild(input);
      fragment.appendChild(div);
    });
    return fragment;
  }
  
  // --- Initialize Dynamic Field Sections ---

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
    createItemEntryFields, 'remove-item-description', 'Item'); // Use new create function and title prefix
  setupDynamicFieldSectionListeners('add-tracking-email-btn', 'tracking-emails-container', 'tracking-email-entry',
    (n) => createSingleField(n, 'tracking-email', 'Tracking Email', 'input', 'email'), 'remove-tracking-email', null);

  // Driver Menu
  setupDynamicFieldSectionListeners('add-vehicle-btn', 'driver-vehicles-container', 'vehicle-entry', 
    createVehicleFields, 'remove-vehicle', 'Vehicle');
  setupDynamicFieldSectionListeners('add-certification-btn', 'driver-certifications-container', 'certification-entry', 
    createCertificationFields, 'remove-certification', 'Certification/License');
  setupDynamicFieldSectionListeners('add-driver-contact-btn', 'driver-contacts-container', 'driver-contact-entry',
    (n) => createSingleField(n, 'driver-contact', 'Contact Number', 'input', 'tel'), 'remove-driver-contact', "Contact Number"); 
  setupDynamicFieldSectionListeners('add-driver-address-btn', 'driver-addresses-container', 'driver-address-entry',
    createDriverAddressFields, 'remove-driver-address', 'Address');


  // Function to handle the creation of a new order
  function handleCreateOrder() {
    const clientOrderForm = document.getElementById('client-order-form');

    // Helper to collect values from dynamic fields
    function collectDynamicFieldValues(containerId, fieldClass) {
      const container = document.getElementById(containerId);
      if (!container) return [];
      const fields = container.querySelectorAll(`.${fieldClass}`);
      const values = [];
      fields.forEach(field => {
        if (field.value.trim() !== '') {
          values.push(field.value.trim());
        }
      });
      return values;
    }

    // clearDynamicFields is now a global helper function. Its definition is outside.

    if (clientOrderForm) {
      clientOrderForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get values from static form fields
        const orderNumber = document.getElementById('order-number').value; // Assuming it might be populated by JS later
        const pickupName = document.getElementById('pickup-name').value;
        const clientRefNumber = document.getElementById('client-ref-number').value;
        const pickupState = document.getElementById('pickup-state').value;
        const pickupZip = document.getElementById('pickup-zip').value;
        const pickupCountry = document.getElementById('pickup-country').value;
        
        const deliveryName = document.getElementById('delivery-name').value;
        const deliveryState = document.getElementById('delivery-state').value;
        const deliveryZip = document.getElementById('delivery-zip').value;
        const deliveryCountry = document.getElementById('delivery-country').value;

        // const itemCount = document.getElementById('item-count').value; // Removed
        const specialInstructions = document.getElementById('special-instructions').value;

        // Collect values from dynamic fields
        const pickupAddresses = collectDynamicFieldValues('pickup-addresses-container', 'pickup-address');
        const deliveryAddresses = collectDynamicFieldValues('delivery-addresses-container', 'delivery-address');
        const pickupContacts = collectDynamicFieldValues('pickup-contacts-container', 'pickup-contact');
        const deliveryContacts = collectDynamicFieldValues('delivery-contacts-container', 'delivery-contact');
        const trackingEmails = collectDynamicFieldValues('tracking-emails-container', 'tracking-email');
        
        // Updated item collection logic
        const items = [];
        const itemEntries = document.querySelectorAll('#item-descriptions-container .item-description-entry');
        itemEntries.forEach(entry => {
          const description = entry.querySelector('.item-description')?.value.trim();
          const quantity = entry.querySelector('.item-qty')?.value.trim();
          const weight = entry.querySelector('.item-weight')?.value.trim();
          const length = entry.querySelector('.item-length')?.value.trim();
          const width = entry.querySelector('.item-width')?.value.trim();
          const height = entry.querySelector('.item-height')?.value.trim();

          // Add item if at least description or quantity is present, or any other field has data
          const hasSomeData = [description, quantity, weight, length, width, height].some(val => val && val !== '');
          if (hasSomeData) {
            items.push({
              description: description || '',
              quantity: quantity || '',
              weight: weight || '',
              length: length || '',
              width: width || '',
              height: height || ''
            });
          }
        });
        
        // Log all collected values
        const newOrderData = {
          orderNumber,
          clientRefNumber,
          pickupName,
          pickupAddresses,
          pickupState,
          pickupZip,
          pickupCountry,
          pickupContacts,
          deliveryName,
          deliveryAddresses,
          deliveryState,
          deliveryZip,
          deliveryCountry,
          deliveryContacts,
          trackingEmails,
          items, // Replaces itemDescriptions
          specialInstructions
        };
        orders.push(newOrderData);
        console.log("New Order Added:", newOrderData);
        console.log("Current Orders Array:", orders);

        // Plot the new order on the map
        plotOrderOnMap(newOrderData);

        // Clear static form fields
        // document.getElementById('order-number').value = ''; // Assuming read-only or set by system
        document.getElementById('client-ref-number').value = '';
        document.getElementById('pickup-name').value = '';
        document.getElementById('pickup-state').value = '';
        document.getElementById('pickup-zip').value = '';
        document.getElementById('pickup-country').value = '';
        document.getElementById('delivery-name').value = '';
        document.getElementById('delivery-state').value = '';
        document.getElementById('delivery-zip').value = '';
        document.getElementById('delivery-country').value = '';
        // document.getElementById('item-count').value = ''; // Removed
        document.getElementById('special-instructions').value = '';
        
        // Clear all dynamic fields
        clearDynamicFields('pickup-addresses-container', 'pickup-address-entry', null, { class: 'pickup-address', placeholder: 'Pick-up Address' });
        clearDynamicFields('delivery-addresses-container', 'delivery-address-entry', null, { class: 'delivery-address', placeholder: 'Delivery Address' });
        clearDynamicFields('pickup-contacts-container', 'pickup-contact-entry', null, { class: 'pickup-contact', placeholder: 'Pick-up Contact' });
        clearDynamicFields('delivery-contacts-container', 'delivery-contact-entry', null, { class: 'delivery-contact', placeholder: 'Delivery Contact' });
        clearDynamicFields('tracking-emails-container', 'tracking-email-entry', null, { class: 'tracking-email', placeholder: 'Tracking Email' });
        
        // For item descriptions (complex entry)
        clearDynamicFields('item-descriptions-container', 'item-description-entry', 'Item', [
          { class: 'item-description' }, // Placeholder is static
          { class: 'item-qty' },
          { class: 'item-weight' },
          { class: 'item-length' },
          { class: 'item-width' },
          { class: 'item-height' }
        ]);

        // Populate a new order number for the next order
        populateOrderNumber();
      });
    } else {
      console.error('Client order form not found.');
    }
  }

  // Function to handle driver profile updates
  function handleUpdateProfile() {
    const driverProfileForm = document.getElementById('driver-profile-form');

    // Helper to collect values from dynamic grouped fields
    function collectDynamicGroupedValues(containerId, entryClass, fieldClassesMap) {
      const container = document.getElementById(containerId);
      if (!container) return [];
      const entries = container.querySelectorAll(`.${entryClass}`);
      const allEntriesData = [];
      entries.forEach(entryDiv => {
        const entryData = {};
        let hasValue = false;
        for (const keyInMap in fieldClassesMap) {
          const fieldClass = fieldClassesMap[keyInMap];
          const field = entryDiv.querySelector(`.${fieldClass}`);
          if (field && field.value.trim() !== '') {
            entryData[keyInMap] = field.value.trim();
            hasValue = true;
          } else {
            entryData[keyInMap] = ''; // Store empty if not found or no value
          }
        }
        if (hasValue) { // Only add entry if at least one field in it has a value
          allEntriesData.push(entryData);
        }
      });
      return allEntriesData;
    }
    
    // Local version of collectSingleDynamicFieldValues for handleUpdateProfile
    // This can remain local if only used here, or be globalized if handleCreateOrder needs identical functionality.
    // For now, keeping it local to handleUpdateProfile.
    function collectSingleDynamicFieldValues(containerId, fieldClass) {
      const container = document.getElementById(containerId);
      if (!container) return [];
      const fields = container.querySelectorAll(`.${fieldClass}`);
      const values = [];
      fields.forEach(field => {
        if (field.value.trim() !== '') {
          values.push(field.value.trim());
        }
      });
      return values;
    }

    // Local clearing helpers (clearDynamicGroupedFields, clearSingleDynamicFields) were removed in a previous step.
    // This function will now use the global clearDynamicFields.

    if (driverProfileForm) {
      driverProfileForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const driverName = document.getElementById('driver-name-static').value;
        const driverPhotoInput = document.getElementById('driver-photo');
        const driverPhotoFile = driverPhotoInput.files.length > 0 ? driverPhotoInput.files[0] : null;
        const driverPhotoInfo = driverPhotoFile ? { name: driverPhotoFile.name, size: driverPhotoFile.size, type: driverPhotoFile.type } : null;

        const vehiclesData = collectDynamicGroupedValues('driver-vehicles-container', 'vehicle-entry', {
          type: 'vehicle-type', make: 'vehicle-make', model: 'vehicle-model', plate: 'vehicle-plate'
        });
        const certificationsData = collectDynamicGroupedValues('driver-certifications-container', 'certification-entry', {
          name: 'certification-name', licenseNumber: 'license-number', expirationDate: 'expiration-date'
        });
        const driverContactsData = collectSingleDynamicFieldValues('driver-contacts-container', 'driver-contact'); 
        const driverAddressesData = collectDynamicGroupedValues('driver-addresses-container', 'driver-address-entry', {
            street: 'driver-address-street', 
            city: 'driver-address-city', 
            state: 'driver-address-state', 
            zip: 'driver-address-zip', 
            country: 'driver-address-country'
        });

        const currentDriverData = {
          driverName, 
          driverPhoto: driverPhotoInfo,
          vehicles: vehiclesData,
          certifications: certificationsData,
          driverContacts: driverContactsData,
          driverAddresses: driverAddressesData
        };

        const existingDriverIndex = drivers.findIndex(driver => driver.driverName === currentDriverData.driverName);

        if (existingDriverIndex > -1) {
          drivers[existingDriverIndex] = currentDriverData;
          console.log("Driver Profile Updated:", currentDriverData);
        } else {
          drivers.push(currentDriverData);
          console.log("New Driver Profile Added:", currentDriverData);
        }
        console.log("Current Drivers Array:", drivers);

        // Clear form fields
        document.getElementById('driver-name-static').value = '';
        if (driverPhotoInput) driverPhotoInput.value = ''; // Clear file input

        // Using the global clearDynamicFields function
        clearDynamicFields('driver-vehicles-container', 'vehicle-entry', 'Vehicle', [
            {class:'vehicle-type'}, {class:'vehicle-make'}, {class:'vehicle-model'}, {class:'vehicle-plate'}
        ]);
        clearDynamicFields('driver-certifications-container', 'certification-entry', 'Certification/License', [
            {class:'certification-name'}, {class:'license-number'}, {class:'expiration-date'}
        ]);
        clearDynamicFields('driver-contacts-container', 'driver-contact-entry', 'Contact Number', { class: 'driver-contact', placeholder: 'Contact Number' });
        clearDynamicFields('driver-addresses-container', 'driver-address-entry', 'Address', [
            {class:'driver-address-street'}, {class:'driver-address-city'}, {class:'driver-address-state'}, {class:'driver-address-zip'}, {class:'driver-address-country'}
        ]);
      });
    } else {
      console.error('Driver profile form not found.');
    }
  }

  // Call the functions to attach event listeners
  handleCreateOrder();
  handleUpdateProfile();
  initMap(); // Initialize the map
  populateOrderNumber(); // Populate initial order number on load
  initMenuToggles(); // Initialize menu toggle functionality
});

// Function to initialize menu toggle buttons
function initMenuToggles() {
  const clientMenuToggleBtn = document.getElementById('client-menu-toggle-btn');
  const driverMenuToggleBtn = document.getElementById('driver-menu-toggle-btn');
  const clientMenuPanel = document.getElementById('client-menu-container');
  const driverMenuPanel = document.getElementById('driver-menu-container');
  const closeClientMenuBtn = document.getElementById('close-client-menu-btn');
  const closeDriverMenuBtn = document.getElementById('close-driver-menu-btn');

  if (!clientMenuToggleBtn || !driverMenuToggleBtn || !clientMenuPanel || !driverMenuPanel || !closeClientMenuBtn || !closeDriverMenuBtn) {
    console.error('One or more menu elements (toggle buttons, panels, or close buttons) not found. Ensure all IDs are correct.');
    return;
  }

  clientMenuToggleBtn.addEventListener('click', () => {
    const isClientMenuVisible = clientMenuPanel.style.display === 'block'; // Or check class if using classes
    
    // Toggle client menu
    clientMenuPanel.style.display = isClientMenuVisible ? 'none' : 'block';
    
    // If opening client menu, ensure driver menu is closed
    if (!isClientMenuVisible) { // i.e., if client menu was hidden and is now being shown
      driverMenuPanel.style.display = 'none';
    }
  });

  driverMenuToggleBtn.addEventListener('click', () => {
    const isDriverMenuVisible = driverMenuPanel.style.display === 'block';
    
    // Toggle driver menu
    driverMenuPanel.style.display = isDriverMenuVisible ? 'none' : 'block';
    
    // If opening driver menu, ensure client menu is closed
    if (!isDriverMenuVisible) { // i.e., if driver menu was hidden and is now being shown
      clientMenuPanel.style.display = 'none';
    }
  });

  // Optional: Close menus if user clicks outside of them on the map or app container
  // This is more advanced and might be added later if needed.
  // For example, document.getElementById('app-container').addEventListener('click', (e) => { ... });

  // Event listeners for the new close buttons
  closeClientMenuBtn.addEventListener('click', () => {
    if (clientMenuPanel) {
      clientMenuPanel.style.display = 'none';
    }
  });

  closeDriverMenuBtn.addEventListener('click', () => {
    if (driverMenuPanel) {
      driverMenuPanel.style.display = 'none';
    }
  });
}


// Function to initialize the Leaflet map
function initMap() {
  const mapPlaceholder = document.getElementById('map-placeholder');

  if (!mapPlaceholder) {
    console.error('Map placeholder element not found.');
    return;
  }

  // Check if map is already initialized
  if (leafletMap) { // Use the global variable for check
    console.warn('Map already initialized.');
    return;
  }

  try {
    leafletMap = L.map('map-placeholder').setView([51.505, -0.09], 13); // Assign to global variable

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap); // ensure it's added to the correct map instance

    L.marker([51.505, -0.09]).addTo(leafletMap) // ensure it's added to the correct map instance
      .bindPopup('A default marker at London.')
      .openPopup();
      
    console.log('Map initialized successfully.');
  } catch (error) {
    console.error('Error initializing Leaflet map:', error);
    mapPlaceholder.innerHTML = '<p style="color:red; text-align:center;">Error initializing map. See console for details.</p>';
  }
}

// End of initMenuToggles

// Function to plot a single order's pick-up location on the map
// Now correctly placed within DOMContentLoaded
function plotOrderOnMap(orderData) {
  if (!leafletMap) {
    console.error('plotOrderOnMap: Leaflet map instance not available.');
    return;
  }
  // cityCoordinates is accessible from the DCL scope

  let coordinates = null;
  const firstPickupCity = orderData.pickupCity; 

  if (firstPickupCity && cityCoordinates[firstPickupCity]) {
      coordinates = cityCoordinates[firstPickupCity];
  } else if (orderData.pickupAddresses && orderData.pickupAddresses.length > 0) {
      const firstAddress = orderData.pickupAddresses[0].toLowerCase();
      for (const city in cityCoordinates) {
          if (firstAddress.includes(city.toLowerCase())) {
              coordinates = cityCoordinates[city];
              console.log(`Plotter (fallback): Found city ${city} in address: ${orderData.pickupAddresses[0]}`);
              break;
          }
      }
  }

  if (coordinates) {
      const popupContent = `<b>Order:</b> ${orderData.orderNumber}<br>
                            <b>Client Ref:</b> ${orderData.clientRefNumber || 'N/A'}<br>
                            <b>Pick-up City:</b> ${firstPickupCity || '(city not specified)'}<br>
                            <b>Address 1:</b> ${orderData.pickupAddresses && orderData.pickupAddresses.length > 0 ? orderData.pickupAddresses[0] : 'N/A'}`;
      L.marker(coordinates).addTo(leafletMap).bindPopup(popupContent);
      console.log(`Plotted order ${orderData.orderNumber} for city: ${firstPickupCity || '(city derived from address)'}`);
  } else {
      const logCityInfo = firstPickupCity || (orderData.pickupAddresses && orderData.pickupAddresses.length > 0 ? orderData.pickupAddresses[0] : 'N/A');
      console.log(`Could not plot order ${orderData.orderNumber}. City/Address: ${logCityInfo}. Coordinates found: ${!!coordinates}, Map ready: ${!!leafletMap}`);
  }
}
// End of plotOrderOnMap function definition
