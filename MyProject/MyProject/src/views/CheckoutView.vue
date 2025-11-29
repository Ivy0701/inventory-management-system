<template>
  <div class="checkout">
    <div class="checkout__header">
      <h1>Checkout</h1>
      <p>Review your order and provide shipping address</p>
    </div>

    <div v-if="loading" class="checkout__loading">
      <p>Processing...</p>
    </div>

    <div v-else class="checkout__content">
      <!-- Order Summary -->
      <div class="checkout__section">
        <h2 class="checkout__section-title">Order Summary</h2>
        <div class="order-summary">
          <div v-for="item in cartItems" :key="item.cartId" class="order-summary__item">
            <div class="order-summary__item-info">
              <div class="order-summary__item-icon">{{ item.icon }}</div>
              <div class="order-summary__item-details">
                <span class="order-summary__item-name">{{ item.name }}</span>
                <span class="order-summary__item-spec">
                  {{ item.color }} / Size {{ item.size }} × {{ item.quantity }}
                </span>
              </div>
            </div>
            <span class="order-summary__item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
        <div class="order-summary__total">
          <span>Total:</span>
          <span class="order-summary__total-amount">${{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Shipping Address Form -->
      <div class="checkout__section">
        <h2 class="checkout__section-title">Shipping Address</h2>
        <form class="checkout__form" @submit.prevent="submitOrder">
          <div class="form-group">
            <label class="form-label" for="name">Full Name *</label>
            <input
              id="name"
              v-model="addressForm.name"
              class="form-input"
              placeholder="Enter full name"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="phone">Phone Number *</label>
            <input
              id="phone"
              v-model="addressForm.phone"
              class="form-input"
              placeholder="Enter phone number"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="street">Street Address *</label>
            <input
              id="street"
              v-model="addressForm.street"
              class="form-input"
              placeholder="Enter street address"
              required
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="city">City *</label>
              <input
                id="city"
                v-model="addressForm.city"
                class="form-input"
                placeholder="Enter city"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="state">State/Province *</label>
              <input
                id="state"
                v-model="addressForm.state"
                class="form-input"
                placeholder="Enter state"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="zipCode">Zip/Postal Code *</label>
            <input
              id="zipCode"
              v-model="addressForm.zipCode"
              class="form-input"
              placeholder="Enter zip code"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="notes">Delivery Notes (Optional)</label>
            <textarea
              id="notes"
              v-model="addressForm.notes"
              class="form-input"
              placeholder="Any special instructions for delivery"
              rows="3"
            ></textarea>
          </div>
          <div class="checkout__actions">
            <button type="button" class="btn-secondary" @click="goBack">Back to Cart</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Place Order' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createOrder } from '../services/orderService';
import { useAppStore } from '../store/appStore';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const loading = ref(false);
const submitting = ref(false);
const cartItems = ref([]);

const addressForm = reactive({
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  notes: ''
});

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

onMounted(() => {
  // Check if user is authenticated
  if (!appStore.auth.isAuthenticated) {
    window.alert('Please login before placing order');
    router.push('/customer/login');
    return;
  }

  // Get cart items from route params or localStorage
  if (route.params.cartItems) {
    try {
      cartItems.value = JSON.parse(decodeURIComponent(route.params.cartItems));
    } catch (e) {
      console.error('Failed to parse cart items:', e);
      cartItems.value = [];
    }
  } else {
    // Try to get from localStorage as fallback
    const stored = localStorage.getItem('checkout-cart');
    if (stored) {
      cartItems.value = JSON.parse(stored);
    }
  }

  // If no cart items, redirect back to shop
  if (cartItems.value.length === 0) {
    router.push('/customer/shop');
    return;
  }

  // Load default address if available
  loadDefaultAddress();
});

const loadDefaultAddress = () => {
  const stored = localStorage.getItem('customer-addresses');
  if (stored) {
    try {
      const addresses = JSON.parse(stored);
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        Object.assign(addressForm, {
          name: defaultAddress.name,
          phone: defaultAddress.phone,
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipCode: defaultAddress.zipCode,
          notes: defaultAddress.notes || ''
        });
      }
    } catch (e) {
      console.error('Failed to load default address:', e);
    }
  }
};

const goBack = () => {
  router.push('/customer/shop');
};

const submitOrder = async () => {
  if (cartItems.value.length === 0) {
    window.alert('Your cart is empty');
    return;
  }

  submitting.value = true;
  try {
    // Prepare order data
    const orderData = {
      items: cartItems.value.map(item => ({
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size
      })),
      shippingAddress: {
        name: addressForm.name,
        phone: addressForm.phone,
        street: addressForm.street,
        city: addressForm.city,
        state: addressForm.state,
        zipCode: addressForm.zipCode,
        notes: addressForm.notes || undefined
      },
      subtotal: totalAmount.value,
      totalAmount: totalAmount.value,
      remark: addressForm.notes || undefined
    };

    // Create order via API
    const order = await createOrder(orderData);

    // Clear cart from localStorage
    localStorage.removeItem('checkout-cart');

    // Show success message and redirect to orders page
    window.alert(`Order placed successfully! Order #: ${order.orderNumber || order.id}`);
    router.push('/customer/orders');
  } catch (error) {
    window.alert('Failed to place order: ' + (error.message || 'Unknown error'));
    console.error('Order creation error:', error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.checkout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.checkout__header {
  text-align: center;
  margin-bottom: 16px;
}

.checkout__header h1 {
  margin: 0;
  font-size: 28px;
  color: var(--color-text);
}

.checkout__header p {
  margin: 8px 0 0;
  color: var(--color-text-muted);
}

.checkout__loading {
  text-align: center;
  padding: 48px;
  color: var(--color-text-muted);
}

.checkout__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.checkout__section {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-soft);
}

.checkout__section-title {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.order-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.order-summary__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
}

.order-summary__item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.order-summary__item-icon {
  font-size: 32px;
}

.order-summary__item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-summary__item-name {
  font-weight: 500;
  color: var(--color-text);
}

.order-summary__item-spec {
  font-size: 14px;
  color: var(--color-text-muted);
}

.order-summary__item-price {
  font-weight: 600;
  color: var(--color-brand);
  font-size: 16px;
}

.order-summary__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 2px solid #e5e7eb;
  font-size: 18px;
  font-weight: 600;
}

.order-summary__total-amount {
  color: var(--color-brand);
  font-size: 24px;
}

.checkout__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: var(--color-text);
  font-size: 14px;
}

.form-input {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-brand);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.checkout__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.checkout__actions .btn-primary,
.checkout__actions .btn-secondary {
  flex: 1;
}

.checkout__actions .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .checkout__content {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

