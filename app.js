document.addEventListener('DOMContentLoaded', () => {
  // --- Global Data Storage ---
  let orders = [];
  let drivers = [];
  let leafletMap = null;

  // Shared city coordinates for placeholder geocoding
  const cityCoordinates = {
    "New York": [40.7128, -74.0060],
    "Los Angeles": [34.0522, -118.2437],
    "Chicago": [41.8781, -87.6298],
    "Houston": [29.7604, -95.3698],
    "Phoenix": [33.4484, -112.0740],
    "Philadelphia": [39.9526, -75.1652],
    "London": [51.5074, -0.1278],
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
      orderSequence = 1;
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
  function addDynamicFieldEntry(containerId, entryClass, createEntryFieldsFn, removeButtonClassPrefix, sectionTitlePrefix) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found.`);
      return;
    }

    const entryNumber = container.querySelectorAll(`.${entryClass}`).length + 1;

    const entryDiv = document.createElement('div');
    entryDiv.classList.add(entryClass);

    if (sectionTitlePrefix) {
      const titleElement = document.createElement('h5');
      titleElement.textContent = `${sectionTitlePrefix} ${entryNumber}`;
      entryDiv.appendChild(titleElement);
    }

    const fieldsFragment = createEntryFieldsFn(entryNumber);
    entryDiv.appendChild(fieldsFragment);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.classList.add('remove-dynamic-field-btn', `${removeButtonClassPrefix}-btn`);
    entryDiv.appendChild(removeButton);
    container.appendChild(entryDiv);
  }

  function handleDynamicFieldRemove(event, entryClass, removeButtonClassPrefix, sectionTitlePrefix) {
    if (event.target.classList.contains(`${removeButtonClassPrefix}-btn`)) {
      const entryToRemove = event.target.closest(`.${entryClass}`);
      const container = entryToRemove?.parentElement;

      if (entryToRemove && container) {
        if (container.querySelectorAll(`.${entryClass}`).length === 1 && entryToRemove === container.firstElementChild) {
          const inputs = entryToRemove.querySelectorAll('input, textarea');
          inputs.forEach(input => input.value = '');
          if (sectionTitlePrefix && entryToRemove.querySelector('h5')) {
            entryToRemove.querySelector('h5').textContent = `${sectionTitlePrefix} 1`;
          }
        } else {
          entryToRemove.remove();
        }

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

  function setupDynamicFieldSectionListeners(addButtonId, containerId, entryClass, createEntryFieldsFn, removeButtonClassPrefix, sectionTitlePrefix) {
    const addButton = document.getElementById(addButtonId);
    if (addButton) {
      addButton.addEventListener('click', () => addDynamicFieldEntry(containerId, entryClass, createEntryFieldsFn, removeButtonClassPrefix, sectionTitlePrefix));
    } else {
      console.warn(`Add button ${addButtonId} not found.`);
    }

    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener('click', (event) => handleDynamicFieldRemove(event, entryClass, removeButtonClassPrefix, sectionTitlePrefix));
    } else {
      console.warn(`Container ${containerId} not found for event delegation.`);
    }
  }

  // --- Field Creation Functions ---
  function clearDynamicFields(containerId, entryClass, sectionTitlePrefix, fieldDefinitions) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`clearDynamicFields: Container ${containerId} not found.`);
      return;
    }

    const allEntries = container.querySelectorAll(`.${entryClass}`);
    allEntries.forEach((entry, index) => {
      if (index === 0) {
        if (Array.isArray(fieldDefinitions)) {
          fieldDefinitions.forEach(fieldDef => {
            const input = entry.querySelector(`.${fieldDef.class}`);
            if (input) input.value = '';
          });
        } else if (fieldDefinitions?.class) {
          const input = entry.querySelector(`.${fieldDefinitions.class}`);
          if (input) {
            input.value = '';
            if (fieldDefinitions.placeholder) {
              input.placeholder = `${fieldDefinitions.placeholder} 1`;
            }
          } else {
            console.warn(`clearDynamicFields: Initial field .${fieldDefinitions.class} not found in .${entryClass} within ${containerId}`);
          }
        }
        const titleElement = entry.querySelector('h5');
        if (titleElement && sectionTitlePrefix) {
          titleElement.textContent = `${sectionTitlePrefix} 1`;
        }
      } else {
        entry.remove();
      }
    });
  }

  function createSingleField(entryNumber, fieldClass, placeholderPrefix, fieldElementType = 'input', inputElementType = 'text') {
    const fragment = document.createDocumentFragment();
    let fieldElement = fieldElementType === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (fieldElementType !== 'textarea') fieldElement.type = inputElementType;
    fieldElement.classList.add(fieldClass);
    fieldElement.placeholder = `${placeholderPrefix} ${entryNumber}`;
    fragment.appendChild(fieldElement);
    return fragment;
  }

  function createItemEntryFields(entryNumber) {
    const fragment = document.createDocumentFragment();
    const descriptionTextarea = document.createElement('textarea');
    descriptionTextarea.classList.add('item-description');
    descriptionTextarea.placeholder = 'Item Description';
    fragment.appendChild(descriptionTextarea);

    const line1Div = document.createElement('div');
    line1Div.classList.add('item-details-line-1');

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.classList.add('item-qty');
    qtyInput.placeholder = 'Qty';
    qtyInput.min = '1';
    qtyInput.title = 'Quantity';
    line1Div.appendChild(qtyInput);

    const weightInput = document.createElement('input');
    weightInput.type = 'text';
    weightInput.classList.add('item-weight');
    weightInput.placeholder = 'Weight (e.g., 5kg)';
    weightInput.title = 'Weight';
    line1Div.appendChild(weightInput);
    fragment.appendChild(line1Div);

    const line2Div = document.createElement('div');
    line2Div.classList.add('item-details-line-2');

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
  setupDynamicFieldSectionListeners('add-pickup-address-btn', 'pickup-addresses-container', 'pickup-address-entry', 
    (n) => createSingleField(n, 'pickup-address', 'Pick-up Address', 'input', 'text'), 'remove-pickup-address', null);
  setupDynamicFieldSectionListeners('add-delivery-address-btn', 'delivery-addresses-container', 'delivery-address-entry',
    (n) => createSingleField(n, 'delivery-address', 'Delivery Address', 'input', 'text'), 'remove-delivery-address', null);
  setupDynamicFieldSectionListeners('add-pickup-contact-btn', 'pickup-contacts-container', 'pickup-contact-entry',
    (n) => createSingleField(n, 'pickup-contact', 'Pick-up Contact', 'input', 'tel'), 'remove-pickup-contact', null);
  setupDynamicFieldSectionListeners('add-delivery-contact-btn', 'delivery-contacts-container', 'delivery-contact-entry',
    (n) => createSingleField(n, 'delivery-contact', 'Delivery Contact', 'input', 'tel'), 'remove-delivery-contact', null);
  setupDynamicFieldSectionListeners('add-item-description-btn', 'item-descriptions-container', 'item-description-entry',
    createItemEntryFields, 'remove-item-description', 'Item');
  setupDynamicFieldSectionListeners('add-tracking-email-btn', 'tracking-emails-container', 'tracking-email-entry',
    (n) => createSingleField(n, 'tracking-email', 'Tracking Email', 'input', 'email'), 'remove-tracking-email', null);
  setupDynamicFieldSectionListeners('add-vehicle-btn', 'driver-vehicles-container', 'vehicle-entry', 
    createVehicleFields, 'remove-vehicle', 'Vehicle');
  setupDynamicFieldSectionListeners('add-certification-btn', 'driver-certifications-container', 'certification-entry', 
    createCertificationFields, 'remove-certification', 'Certification/License');
  setupDynamicFieldSectionListeners('add-driver-contact-btn', 'driver-contacts-container', 'driver-contact-entry',
    (n) => createSingleField(n, 'driver-contact', 'Contact Number', 'input', 'tel'), 'remove-driver-contact', 'Contact Number');
  setupDynamicFieldSectionListeners('add-driver-address-btn', 'driver-addresses-container', 'driver-address-entry',
    createDriverAddressFields, 'remove-driver-address', 'Address');

  // --- Handle Create Order ---
  function handleCreateOrder() {
    const clientOrderForm = document.getElementById('client-order-form');
    if (!clientOrderForm) {
      console.error('Client order form not found.');
      return;
    }

    function collectDynamicFieldValues(containerId, fieldClass) {
      const container = document.getElementById(containerId);
      if (!container) return [];
      const fields = container.querySelectorAll(`.${fieldClass}`);
      return Array.from(fields)
        .filter(field => field.value.trim() !== '')
        .map(field => field.value.trim());
    }

    clientOrderForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const orderNumber = document.getElementById('order-number')?.value || '';
      const pickupName = document.getElementById('pickup-name')?.value || '';
      const clientRefNumber = document.getElementById('client-ref-number')?.value || '';
      const pickupState = document.getElementById('pickup-state')?.value || '';
      const pickupZip = document.getElementById('pickup-zip')?.value || '';
      const pickupCountry = document.getElementById('pickup-country')?.value || '';
      const deliveryName = document.getElementById('delivery-name')?.value || '';
      const deliveryState = document.getElementById('delivery-state')?.value || '';
      const deliveryZip = document.getElementById('delivery-zip')?.value || '';
      const deliveryCountry = document.getElementById('delivery-country')?.value || '';
      const specialInstructions = document.getElementById('special-instructions')?.value || '';

      const pickupAddresses = collectDynamicFieldValues('pickup-addresses-container', 'pickup-address');
      const deliveryAddresses = collectDynamicFieldValues('delivery-addresses-container', 'delivery-address');
      const pickupContacts = collectDynamicFieldValues('pickup-contacts-container', 'pickup-contact');
      const deliveryContacts = collectDynamicFieldValues('delivery-contacts-container', 'delivery-contact');
      const trackingEmails = collectDynamicFieldValues('tracking-emails-container', 'tracking-email');

      const items = [];
      const itemEntries = document.querySelectorAll('#item-descriptions-container .item-description-entry');
      itemEntries.forEach(entry => {
        const description = entry.querySelector('.item-description')?.value.trim() || '';
        const quantity = entry.querySelector('.item-qty')?.value.trim() || '';
        const weight = entry.querySelector('.item-weight')?.value.trim() || '';
        const length = entry.querySelector('.item-length')?.value.trim() || '';
        const width = entry.querySelector('.item-width')?.value.trim() || '';
        const height = entry.querySelector('.item-height')?.value.trim() || '';

        if ([description, quantity, weight, length, width, height].some(val => val !== '')) {
          items.push({ description, quantity, weight, length, width, height });
        }
      });

      const firstPickupAddress = pickupAddresses[0] || '';
      let pickupCity = '';
      for (const city in cityCoordinates) {
        if (firstPickupAddress.toLowerCase().includes(city.toLowerCase())) {
          pickupCity = city;
          break;
        }
      }

      const newOrderData = {
        orderNumber,
        clientRefNumber,
        pickupName,
        pickupCity,
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
        items,
        specialInstructions
      };
      orders.push(newOrderData);
      console.log("New Order Added:", newOrderData);
      plotOrderOnMap(newOrderData);

      document.getElementById('client-ref-number')?.value = '';
      document.getElementById('pickup-name')?.value = '';
      document.getElementById('pickup-state')?.value = '';
      document.getElementById('pickup-zip')?.value = '';
      document.getElementById('pickup-country')?.value = '';
      document.getElementById('delivery-name')?.value = '';
      document.getElementById('delivery-state')?.value = '';
      document.getElementById('delivery-zip')?.value = '';
      document.getElementById('delivery-country')?.value = '';
      document.getElementById('special-instructions')?.value = '';

      clearDynamicFields('pickup-addresses-container', 'pickup-address-entry', null, { class: 'pickup-address', placeholder: 'Pick-up Address' });
      clearDynamicFields('delivery-addresses-container', 'delivery-address-entry', null, { class: 'delivery-address', placeholder: 'Delivery Address' });
      clearDynamicFields('pickup-contacts-container', 'pickup-contact-entry', null, { class: 'pickup-contact', placeholder: 'Pick-up Contact' });
      clearDynamicFields('delivery-contacts-container', 'delivery-contact-entry', null, { class: 'delivery-contact', placeholder: 'Delivery Contact' });
      clearDynamicFields('tracking-emails-container', 'tracking-email-entry', null, { class: 'tracking-email', placeholder: 'Tracking Email' });
      clearDynamicFields('item-descriptions-container', 'item-description-entry', 'Item', [
        { class: 'item-description' },
        { class: 'item-qty' },
        { class: 'item-weight' },
        { class: 'item-length' },
        { class: 'item-width' },
        { class: 'item-height' }
      ]);

      populateOrderNumber();
    });
  }

  // --- Handle Driver Profile Updates ---
  function handleUpdateProfile() {
    const driverProfileForm = document.getElementById('driver-profile-form');
    if (!driverProfileForm) {
      console.error('Driver profile form not found.');
      return;
    }

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
            entryData[keyInMap] = '';
          }
        }
        if (hasValue) allEntriesData.push(entryData);
      });
      return allEntriesData;
    }

    function collectSingleDynamicFieldValues(containerId, fieldClass) {
      const container = document.getElementById(containerId);
      if (!container) return [];
      const fields = container.querySelectorAll(`.${fieldClass}`);
      return Array.from(fields)
        .filter(field => field.value.trim() !== '')
        .map(field => field.value.trim());
    }

    driverProfileForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const driverName = document.getElementById('driver-name-static')?.value || '';
      const driverPhotoInput = document.getElementById('driver-photo');
      const driverPhotoInfo = driverPhotoInput?.files.length > 0 ? {
        name: driverPhotoInput.files[0].name,
        size: driverPhotoInput.files[0].size,
        type: driverPhotoInput.files[0].type
      } : null;

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

      document.getElementById('driver-name-static')?.value = '';
      if (driverPhotoInput) driverPhotoInput.value = '';

      clearDynamicFields('driver-vehicles-container', 'vehicle-entry', 'Vehicle', [
        { class: 'vehicle-type' }, { class: 'vehicle-make' }, { class: 'vehicle-model' }, { class: 'vehicle-plate' }
      ]);
      clearDynamicFields('driver-certifications-container', 'certification-entry', 'Certification/License', [
        { class: 'certification-name' }, { class: 'license-number' }, { class: 'expiration-date' }
      ]);
      clearDynamicFields('driver-contacts-container', 'driver-contact-entry', 'Contact Number', { class: 'driver-contact', placeholder: 'Contact Number' });
      clearDynamicFields('driver-addresses-container', 'driver-address-entry', 'Address', [
        { class: 'driver-address-street' }, { class: 'driver-address-city' }, { class: 'driver-address-state' },
        { class: 'driver-address-zip' }, { class: 'driver-address-country' }
      ]);
    });
  }

  // --- Initialize Menu Toggles ---
  function initMenuToggles() {
    const clientMenuToggleBtn = document.getElementById('client-menu-toggle-btn');
    const driverMenuToggleBtn = document.getElementById('driver-menu-toggle-btn');
    const clientMenuPanel = document.getElementById('client-menu-container');
    const driverMenuPanel = document.getElementById('driver-menu-container');
    const closeClientMenuBtn = document.getElementById('close-client-menu-btn');
    const closeDriverMenuBtn = document.getElementById('close-driver-menu-btn');

    if (!clientMenuToggleBtn || !driverMenuToggleBtn || !clientMenuPanel || !driverMenuPanel || !closeClientMenuBtn || !closeDriverMenuBtn) {
      console.error('One or more menu elements not found.');
      return;
    }

    clientMenuToggleBtn.addEventListener('click', () => {
      const isClientMenuVisible = clientMenuPanel.style.display === 'block';
      clientMenuPanel.style.display = isClientMenuVisible ? 'none' : 'block';
      if (!isClientMenuVisible) driverMenuPanel.style.display = 'none';
    });

    driverMenuToggleBtn.addEventListener('click', () => {
      const isDriverMenuVisible = driverMenuPanel.style.display === 'block';
      driverMenuPanel.style.display = isDriverMenuVisible ? 'none' : 'block';
      if (!isDriverMenuVisible) clientMenuPanel.style.display = 'none';
    });

    closeClientMenuBtn.addEventListener('click', () => {
      clientMenuPanel.style.display = 'none';
    });

    closeDriverMenuBtn.addEventListener('click', () => {
      driverMenuPanel.style.display = 'none';
    });
  }

  // --- Initialize Leaflet Map ---
  function initMap() {
    const mapPlaceholder = document.getElementById('map-placeholder');
    if (!mapPlaceholder) {
      console.error('Map placeholder element not found.');
      return;
    }

    if (leafletMap) {
      console.warn('Map already initialized.');
      return;
    }

    try {
      if (typeof L === 'undefined') {
        throw new Error('Leaflet library not loaded. Ensure Leaflet script is included.');
      }
      leafletMap = L.map('map-placeholder', {
        center: [51.505, -0.09],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      L.marker([51.505, -0.09]).addTo(leafletMap)
        .bindPopup('Default marker at London.')
        .openPopup();

      console.log('Map initialized successfully.');
    } catch (error) {
      console.error('Error initializing Leaflet map:', error);
      mapPlaceholder.innerHTML = '<p style="color:red; text-align:center;">Error initializing map. See console for details.</p>';
    }
  }

  // --- Plot Order on Map ---
  function plotOrderOnMap(orderData) {
    if (!leafletMap) {
      console.error('plotOrderOnMap: Leaflet map instance not available.');
      return;
    }

    let coordinates = null;
    const firstPickupCity = orderData.pickupCity;

    if (firstPickupCity && cityCoordinates[firstPickupCity]) {
      coordinates = cityCoordinates[firstPickupCity];
    } else if (orderData.pickupAddresses?.length > 0) {
      const firstAddress = orderData.pickupAddresses[0].toLowerCase();
      for (const city in cityCoordinates) {
        if (firstAddress.includes(city.toLowerCase())) {
          coordinates = cityCoordinates[city];
          console.log(`Plotter: Found city ${city} in address: ${orderData.pickupAddresses[0]}`);
          break;
        }
      }
    }

    if (coordinates) {
      const popupContent = `<b>Order:</b> ${orderData.orderNumber}<br>
                           <b>Client Ref:</b> ${orderData.clientRefNumber || 'N/A'}<br>
                           <b>Pick-up City:</b> ${firstPickupCity || '(city not specified)'}<br>
                           <b>Address 1:</b> ${orderData.pickupAddresses?.length > 0 ? orderData.pickupAddresses[0] : 'N/A'}`;
      L.marker(coordinates).addTo(leafletMap).bindPopup(popupContent);
      console.log(`Plotted order ${orderData.orderNumber} for city: ${firstPickupCity || '(city derived from address)'}`);
    } else {
      console.log(`Could not plot order ${orderData.orderNumber}. City/Address: ${firstPickupCity || orderData.pickupAddresses?.[0] || 'N/A'}.`);
    }
  }

  // --- Initialize App ---
  handleCreateOrder();
  handleUpdateProfile();
  initMap();
  populateOrderNumber();
  initMenuToggles();
});
