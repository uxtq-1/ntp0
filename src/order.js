// Order number generation logic
let lastOrderDate = sessionStorage.getItem('lastOrderDate') || '';
let orderSequence = parseInt(sessionStorage.getItem('orderSequence')) || 1;

export function generateOrderNumber() {
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
  sessionStorage.setItem('lastOrderDate', lastOrderDate);
  sessionStorage.setItem('orderSequence', orderSequence.toString());

  return `${currentDate}-${hours}${minutes}${seconds}-${sequenceStr}`;
}

export function populateOrderNumber() {
  const orderNumberField = document.getElementById('order-number');
  if (orderNumberField) {
    orderNumberField.value = generateOrderNumber();
  } else {
    console.error('Error: Order number field not found.');
  }
}
