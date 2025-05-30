document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Global state
  const orders = [];
  const drivers = [];
  let leafletMapInstance = null;

  // Coordinates for placeholder city geocoding
  const cityCoordinates = {
    "New York": [40.7128, -74.006],
    "Los Angeles": [34.0522, -118.2437],
    "Chicago": [41.8781, -87.6298],
    "Houston": [29.7604, -95.3698],
    "Phoenix": [33.4484, -112.074],
    "Philadelphia": [39.9526, -75.1652],
    "London": [51.5074, -0.1278],
  };

  // --- Generate order number with date + seq ---
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
    const seqStr = String(orderSequence).padStart(3, '0');
    orderSequence++;
    return `${currentDate}-${hours}${minutes}${seconds}-${seqStr}`;
  }

  function populateOrderNumber() {
    const field = document.getElementById('order-number');
    if (field) field.value = generateOrderNumber();
  }

  // --- Dynamic Field Helpers ---
  function createInput(type, className, placeholder, name, pattern=null, required=false, maxlength=null) {
    const input = document.createElement('input');
    input.type = type;
    input.className = className;
    if (placeholder) input.placeholder = placeholder;
    if (name) input.name = name;
    if (pattern) input.pattern = pattern;
    if (required) input.required = true;
    if (maxlength) input.maxLength = maxlength;
    input.autocomplete = 'off';
    return input;
  }

  function createTextarea(className, placeholder, name, maxlength=null) {
    const textarea = document.createElement('textarea');
    textarea.className = className;
    if (placeholder) textarea.placeholder = placeholder;
    if (name) textarea.name = name;
    if (maxlength) textarea.maxLength = maxlength;
    textarea.autocomplete = 'off';
    textarea.rows = 3;
    return textarea;
  }

  function addDynamicField(containerId, classEntry, createFieldsFn, btnId, btnAriaLabel) {
    const container = document.getElementById(containerId);
    const addBtn = document.getElementById(btnId);
    if (!container || !addBtn) return;

    addBtn.setAttribute('aria-label', btnAriaLabel);
    addBtn.addEventListener('click', () => {
      const entriesCount = container.querySelectorAll(`.${classEntry}`).length + 1;
      const entryDiv = document.createElement('div');
      entryDiv.classList.add(classEntry);

      const heading = document.createElement('h5');
      heading.textContent = `${btnAriaLabel.replace(/Add Another /, '')} ${entriesCount}`;
      entryDiv.appendChild(heading);

      const fieldsFragment = createFieldsFn(entriesCount);
      entryDiv.appendChild(fieldsFragment);

      // Remove Button
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.classList.add('remove-dynamic-field-btn');
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        if (container.querySelectorAll(`.${classEntry}`).length > 1) {
          entryDiv.remove();
          // Re-number remaining
          const remaining = container.querySelectorAll(`.${classEntry}`);
          remaining.forEach((el, i) => {
            const h = el.querySelector('h5');
            if (h) h.textContent = `${btnAriaLabel.replace(/Add Another /, '')} ${i + 1}`;
          });
        } else {
          // Clear inputs if only one left
          entryDiv.querySelectorAll('input,textarea').forEach(input => input.value = '');
        }
      });

      entryDiv.appendChild(removeBtn);
      container.appendChild(entryDiv);
    });
  }

  // Field Creators (examples, similar pattern for each dynamic group)
  function createPickupAddressFields(entryNum) {
    return createInput('text', 'pickup-address', `Pick-up Address ${entryNum}`, `pickup-address-${entryNum}`, null, true, 200);
  }
  function createDeliveryAddressFields(entryNum) {
    return createInput('text', 'delivery-address', `Delivery Address ${entryNum}`, `delivery-address-${entryNum}`, null, false, 200);
  }
  function createPickupContactFields(entryNum) {
    return createInput('tel', 'pickup-contact', `Pick-up Contact ${entryNum}`, `pickup-contact-${entryNum}`, '[\\d\\s+\\-()]+', false, 20);
  }
  function createDeliveryContactFields(entryNum) {
    return createInput('tel', 'delivery-contact', `Delivery Contact ${entryNum}`, `delivery-contact-${entryNum}`, '[\\d\\s+\\-()]+', false, 20);
  }
  function createTrackingEmailFields(entryNum) {
    return createInput('email', 'tracking-email', `Tracking Email ${entryNum}`, `tracking-email-${entryNum}`, null, false, 100);
  }
  function createItemDescriptionFields(entryNum) {
    const fragment = document.createDocumentFragment();

    const desc = createTextarea('item-description', 'Item Description', `item-description-${entryNum}`, 500);
    fragment.appendChild(desc);

    const line1 = document.createElement('div');
    line1.classList.add('item-details-line-1');
    const qty = createInput('number', 'item-qty', 'Qty', `item-qty-${entryNum}`, null, false);
    qty.min = '1';
    line1.appendChild(qty);
    line1.appendChild(createInput('text', 'item-weight', 'Weight (e.g., 5kg)', `item-weight-${entryNum}`, null, false, 20));
    fragment.appendChild(line1);

    const line2 = document.createElement('div');
    line2.classList.add('item-details-line-2');
    line2.appendChild(document.createElement('label')).textContent = 'Dimensions (LxWxH):';
    line2.appendChild(createInput('text', 'item-length', 'L', `item-length-${entryNum}`, null, false, 10));
    line2.appendChild(createInput('text', 'item-width', 'W', `item-width-${entryNum}`, null, false, 10));
    line2.appendChild(createInput('text', 'item-height', 'H', `item-height-${entryNum}`, null, false, 10));
    fragment.appendChild(line2);

    return fragment;
  }

  // Repeat for driver vehicles, certifications, contacts, addresses...

  // Setup all dynamic fields
  addDynamicField('pickup-addresses-container', 'pickup-address-entry', createPickupAddressFields, 'add-pickup-address-btn', 'Add Another Pick-up Address');
  addDynamicField('delivery-addresses-container', 'delivery-address-entry', createDeliveryAddressFields, 'add-delivery-address-btn', 'Add Another Delivery Address');
  addDynamicField('pickup-contacts-container', 'pickup-contact-entry', createPickupContactFields, 'add-pickup-contact-btn', 'Add Another Pick-up Contact');
  addDynamicField('delivery-contacts-container', 'delivery-contact-entry', createDeliveryContactFields, 'add-delivery-contact-btn', 'Add Another Delivery Contact');
  addDynamicField('tracking-emails-container', 'tracking-email-entry', createTrackingEmailFields, 'add-tracking-email-btn', 'Add Another Email');
  addDynamicField('item-descriptions-container', 'item-description-entry', createItemDescriptionFields, 'add-item-description-btn', 'Add Another Item');

  // Implement similar functions and addDynamicField calls for:
  // driver vehicles, certifications, contacts, addresses...

  // Form validation & submission handlers with CSP safe practices and no inline JS

  function initMenuToggle(buttonId, panelId) {
    const btn = document.getElementById(buttonId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
      const isVisible = !panel.hasAttribute('hidden');
      if (isVisible) {
        panel.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        panel.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    // Close button inside panel
    const closeBtn = panel.querySelector('.close-menu-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        panel.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  // Init toggles
  initMenuToggle('client-menu-toggle-btn', 'client-menu-container');
  initMenuToggle('driver-menu-toggle-btn', 'driver-menu-container');

  // Initialize Leaflet map
  function initMap() {
    const mapPlaceholder = document.getElementById('map-placeholder');
    if (!mapPlaceholder) {
      console.error('Map placeholder not found');
      return;
    }
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded');
      return;
    }
    if (leafletMapInstance) {
      console.warn('Map already initialized');
      return;
    }
    leafletMapInstance = L.map('map-placeholder', {
      center: [51.505, -0.09],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(leafletMapInstance);

    L.marker([51.505, -0.09])
      .addTo(leafletMapInstance)
      .bindPopup('Default marker at London.')
      .openPopup();
  }

  initMap();
  populateOrderNumber();

  // More robust form submission with validations, XSS prevention, and data sanitation would be next.
});
