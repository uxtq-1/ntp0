// Basic app logic

document.addEventListener('DOMContentLoaded', () => {

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

    // Helper to clear/reset dynamic fields
    function clearDynamicFields(containerId, fieldClass, entryClass, placeholderPrefix) {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Remove dynamically added entries (those with entryClass)
      const dynamicEntries = container.querySelectorAll(`.${entryClass}`);
      dynamicEntries.forEach(entry => entry.remove());

      // Clear the first (initial) field and reset its placeholder
      const initialField = container.querySelector(`.${fieldClass}`); // Should target the one in the initial div
      if (initialField) {
        initialField.value = '';
        initialField.placeholder = `${placeholderPrefix} 1`;
      }
    }

    if (clientOrderForm) {
      clientOrderForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get values from static form fields
        const orderNumber = document.getElementById('order-number').value; // Assuming it might be populated by JS later
        const pickupName = document.getElementById('pickup-name').value;
        const deliveryName = document.getElementById('delivery-name').value;

        // Collect values from dynamic fields
        const pickupAddresses = collectDynamicFieldValues('pickup-addresses-container', 'pickup-address');
        const deliveryAddresses = collectDynamicFieldValues('delivery-addresses-container', 'delivery-address');
        const pickupContacts = collectDynamicFieldValues('pickup-contacts-container', 'pickup-contact');
        const deliveryContacts = collectDynamicFieldValues('delivery-contacts-container', 'delivery-contact');
        const itemDescriptions = collectDynamicFieldValues('item-descriptions-container', 'item-description');
        
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
        clearDynamicFields('pickup-addresses-container', 'pickup-address', 'pickup-address-entry', 'Pick-up Address');
        clearDynamicFields('delivery-addresses-container', 'delivery-address', 'delivery-address-entry', 'Delivery Address');
        clearDynamicFields('pickup-contacts-container', 'pickup-contact', 'pickup-contact-entry', 'Pick-up Contact');
        clearDynamicFields('delivery-contacts-container', 'delivery-contact', 'delivery-contact-entry', 'Delivery Contact');
        clearDynamicFields('item-descriptions-container', 'item-description', 'item-description-entry', 'Item Description');

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
    
    // Reusing collectDynamicFieldValues for single field dynamic entries (like driver contacts)
    // (This function is already defined within handleCreateOrder's scope, ideally it should be global or passed)
    // For now, let's assume it's accessible or redefine it if necessary.
    // To avoid issues, let's make a local version for single fields here too.
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


    // Helper to clear/reset dynamic grouped fields
    function clearDynamicGroupedFields(containerId, entryClass, sectionTitlePrefix) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const dynamicEntries = container.querySelectorAll(`.${entryClass}`);
      dynamicEntries.forEach((entry, index) => {
        if (index === 0) { // This is the initial entry
          const inputs = entry.querySelectorAll('input, textarea');
          inputs.forEach(input => input.value = '');
          if (sectionTitlePrefix && entry.querySelector('h5')) {
            entry.querySelector('h5').textContent = `${sectionTitlePrefix} 1`;
          }
        } else { // These are dynamically added entries
          entry.remove();
        }
      });
       // If the first entry was the only one and had no .entryClass (not the case with current HTML but good to be robust)
      if (dynamicEntries.length === 0) {
        const firstEntryLikeDiv = container.firstElementChild; // This might be the div.vehicle-entry
        if (firstEntryLikeDiv && firstEntryLikeDiv.matches(`.${entryClass}`)){ // Check if it's an entryClass div
            const inputs = firstEntryLikeDiv.querySelectorAll('input, textarea');
            inputs.forEach(input => input.value = '');
             if (sectionTitlePrefix && firstEntryLikeDiv.querySelector('h5')) {
                firstEntryLikeDiv.querySelector('h5').textContent = `${sectionTitlePrefix} 1`;
            }
        }
      }
    }
    // Simplified clear for single field dynamic entries
     function clearSingleDynamicFields(containerId, fieldClass, entryClass, placeholderPrefix) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const dynamicEntries = container.querySelectorAll(`.${entryClass}`); // Assuming entryClass for wrapper div
        dynamicEntries.forEach((entry, index) => {
            if (index > 0) entry.remove(); // Remove added ones
        });
        const initialField = container.querySelector(`.${entryClass} .${fieldClass}, div > .${fieldClass}`); // More robust selector for initial field
        if (initialField) {
            initialField.value = '';
            if(placeholderPrefix) initialField.placeholder = `${placeholderPrefix} 1`;
            // If there's an H5 for the single entry too
            const titleElement = initialField.closest(`.${entryClass}`)?.querySelector('h5');
            if(titleElement && placeholderPrefix) titleElement.textContent = `${placeholderPrefix} 1`;
        }
    }


    if (driverProfileForm) {
      driverProfileForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const driverName = document.getElementById('driver-name-static').value;

        const vehicles = collectDynamicGroupedValues('driver-vehicles-container', 'vehicle-entry', {
          type: 'vehicle-type', make: 'vehicle-make', model: 'vehicle-model', plate: 'vehicle-plate'
        });
        const certifications = collectDynamicGroupedValues('driver-certifications-container', 'certification-entry', {
          name: 'certification-name', licenseNumber: 'license-number', expirationDate: 'expiration-date'
        });
        const driverContacts = collectSingleDynamicFieldValues('driver-contacts-container', 'driver-contact');

        console.log("Driver Profile Update:", {
          driverName,
          vehicles,
          certifications,
          driverContacts
        });

        // Clear form fields
        document.getElementById('driver-name-static').value = '';
        clearDynamicGroupedFields('driver-vehicles-container', 'vehicle-entry', 'Vehicle');
        clearDynamicGroupedFields('driver-certifications-container', 'certification-entry', 'Certification/License');
        clearSingleDynamicFields('driver-contacts-container', 'driver-contact', 'driver-contact-entry', 'Contact Number');
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
  if (mapPlaceholder._leaflet_id) {
    console.warn('Map already initialized.');
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
    console.error('Error initializing Leaflet map:', error);
    mapPlaceholder.innerHTML = '<p style="color:red; text-align:center;">Error initializing map. See console for details.</p>';
  }
}
