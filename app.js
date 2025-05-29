// Basic app logic

document.addEventListener('DOMContentLoaded', () => {
  // Function to handle the creation of a new order
  function handleCreateOrder() {
    const clientOrderForm = document.getElementById('client-order-form');
    if (clientOrderForm) {
      clientOrderForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get values from the form fields
        const orderNumber = document.getElementById('order-number').value;
        const pickupName = document.getElementById('pickup-name').value;
        const pickupAddress = document.getElementById('pickup-address').value;
        const deliveryName = document.getElementById('delivery-name').value;
        const deliveryAddress = document.getElementById('delivery-address').value;
        const itemDescription = document.getElementById('item-description').value;

        // Log the values
        console.log("New Order:", {
          orderNumber,
          pickupName,
          pickupAddress,
          deliveryName,
          deliveryAddress,
          itemDescription
        });

        // Clear form fields (optional, but good practice)
        // document.getElementById('order-number').value = ''; // Order number is read-only, so don't clear
        document.getElementById('pickup-name').value = '';
        document.getElementById('pickup-address').value = '';
        document.getElementById('delivery-name').value = '';
        document.getElementById('delivery-address').value = '';
        document.getElementById('item-description').value = '';
      });
    } else {
      console.error('Client order form not found.');
    }
  }

  // Function to handle driver profile updates
  function handleUpdateProfile() {
    const driverProfileForm = document.getElementById('driver-profile-form');
    if (driverProfileForm) {
      driverProfileForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        // Get values from the form fields
        const driverName = document.getElementById('driver-name').value;
        const vehiclePlate = document.getElementById('vehicle-plate').value;

        // Log the values
        console.log("Driver Profile Update:", {
          driverName,
          vehiclePlate
        });

        // Clear form fields (optional, but good practice)
        document.getElementById('driver-name').value = '';
        document.getElementById('vehicle-plate').value = '';
      });
    } else {
      console.error('Driver profile form not found.');
    }
  }

  // Call the functions to attach event listeners
  handleCreateOrder();
  handleUpdateProfile();
});
