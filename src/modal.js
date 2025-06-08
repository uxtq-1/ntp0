// Modal UI and dragging logic
let activeModal = null;
let offsetX = 0;
let offsetY = 0;

export function initMenuToggles() {
  const clientMenuToggleBtn = document.getElementById('vertical-client-toggle');
  const driverMenuToggleBtn = document.getElementById('vertical-driver-toggle');
  const clientMenuContainer = document.getElementById('client-menu-container');
  const driverMenuContainer = document.getElementById('driver-menu-container');
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
      modalContentElement.style.transform = '';
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

  closeClientMenuBtn.addEventListener('click', hideClientMenu);
  closeDriverMenuBtn.addEventListener('click', hideDriverMenu);

  if (clientMenuContainer) {
    clientMenuContainer.addEventListener('click', function(event) {
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

export function onDragStart(event) {
  const header = event.target.closest('.modal-header');
  if (!header) return;

  activeModal = header.closest('.menu-modal-content');
  if (!activeModal) return;

  event.preventDefault();
  activeModal.style.transform = 'none';

  offsetX = event.clientX - activeModal.getBoundingClientRect().left;
  offsetY = event.clientY - activeModal.getBoundingClientRect().top;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', onDragEnd);
  activeModal.classList.add('modal-dragging');
}

export function onDrag(event) {
  if (!activeModal) return;

  let newLeft = event.clientX - offsetX;
  let newTop = event.clientY - offsetY;

  const header = activeModal.querySelector('.modal-header');
  if (header) {
    newLeft = Math.max(-activeModal.offsetWidth + header.offsetWidth, Math.min(newLeft, window.innerWidth - header.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - header.offsetHeight));
  }

  activeModal.style.left = newLeft + 'px';
  activeModal.style.top = newTop + 'px';
}

export function onDragEnd() {
  if (!activeModal) return;

  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', onDragEnd);
  activeModal.classList.remove('modal-dragging');
  activeModal = null;
}

export function initDraggableModals() {
  const modalHeaders = document.querySelectorAll('.modal-header');
  modalHeaders.forEach(header => {
    header.addEventListener('mousedown', onDragStart);
  });
}
