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
      <!-- Left Column: Order Summary -->
      <div class="checkout__left">
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
      </div>

      <!-- Right Column: Payment & Address -->
      <div class="checkout__right">
        <!-- Payment Method Section -->
        <div class="checkout__section">
        <h2 class="checkout__section-title">Payment Method</h2>
        <div class="payment-methods">
          <div
            v-for="method in paymentMethods"
            :key="method.id"
            class="payment-method"
            :class="{ 'payment-method--selected': selectedPaymentMethod === method.id }"
            @click="selectedPaymentMethod = method.id"
          >
            <div class="payment-method__icon">{{ method.icon }}</div>
            <div class="payment-method__info">
              <div class="payment-method__name">{{ method.name }}</div>
              <div class="payment-method__desc">{{ method.description }}</div>
            </div>
            <div class="payment-method__radio">
              <input
                type="radio"
                :id="method.id"
                :value="method.id"
                v-model="selectedPaymentMethod"
              />
            </div>
          </div>
        </div>

        <!-- Credit/Debit Card Form -->
        <div v-if="selectedPaymentMethod === 'credit' || selectedPaymentMethod === 'debit'" class="payment-form">
          <h3 class="payment-form__title">Card Information</h3>
          <div class="form-group">
            <label class="form-label" for="cardNumber">Card Number *</label>
            <input
              id="cardNumber"
              v-model="paymentForm.cardNumber"
              class="form-input"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              @input="formatCardNumber"
              required
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="expiryDate">Expiry Date *</label>
              <input
                id="expiryDate"
                v-model="paymentForm.expiryDate"
                class="form-input"
                placeholder="MM/YY"
                maxlength="5"
                @input="formatExpiryDate"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="cvv">CVV *</label>
              <input
                id="cvv"
                v-model="paymentForm.cvv"
                class="form-input"
                placeholder="123"
                type="password"
                maxlength="4"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="cardholderName">Cardholder Name *</label>
            <input
              id="cardholderName"
              v-model="paymentForm.cardholderName"
              class="form-input"
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        <!-- Alipay/WeChat Pay - No additional form needed, just confirmation -->
        <div v-if="selectedPaymentMethod === 'alipay' || selectedPaymentMethod === 'wechat'" class="payment-form">
          <div class="payment-qr-info">
            <div class="payment-qr-info__icon">{{ selectedPaymentMethod === 'alipay' ? '💳' : '💬' }}</div>
            <p class="payment-qr-info__text">
              You will be redirected to {{ selectedPaymentMethod === 'alipay' ? 'Alipay' : 'WeChat Pay' }} 
              payment page after placing the order.
            </p>
          </div>
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
            <div class="phone-row">
              <select
                id="country"
                v-model="addressForm.country"
                class="form-input phone-row__country"
                required
              >
                <option v-for="country in countries" :key="country.code" :value="country.code">
                  {{ country.name }}
                </option>
              </select>
              <div class="phone-row__code-static">
                {{ addressForm.phoneCode }}
              </div>
              <input
                id="phone"
                v-model="addressForm.phone"
                class="form-input phone-row__number"
                :placeholder="currentPhonePlaceholder"
                :maxlength="phoneMaxLength"
                @input="onPhoneInput"
                required
              />
            </div>
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
          <div class="form-group">
            <label class="form-label" for="state">State/Province *</label>
            <select
              id="state"
              v-model="addressForm.state"
              class="form-input"
              required
            >
              <option disabled value="">Select state/province</option>
              <option v-for="state in currentStates" :key="state" :value="state">
                {{ state }}
              </option>
            </select>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { createOrder } from '../services/orderService';
import { useAppStore } from '../store/appStore';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const loading = ref(false);
const submitting = ref(false);
const cartItems = ref([]);
const selectedPaymentMethod = ref('credit');

const paymentMethods = [
  {
    id: 'credit',
    name: 'Credit Card',
    description: 'Visa, Mastercard, American Express',
    icon: '💳'
  },
  {
    id: 'debit',
    name: 'Debit Card',
    description: 'Bank debit card',
    icon: '🏦'
  },
  {
    id: 'alipay',
    name: 'Alipay',
    description: '支付宝支付',
    icon: '💰'
  },
  {
    id: 'wechat',
    name: 'WeChat Pay',
    description: '微信支付',
    icon: '💬'
  }
];

const paymentForm = reactive({
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: ''
});

const countries = [
  {
    code: 'CN',
    name: 'China',
    phoneCode: '+86',
    cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen'],
    states: ['Beijing', 'Shanghai', 'Guangdong', 'Xinjiang']
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    phoneCode: '+852',
    cities: ['Hong Kong Island', 'Kowloon', 'New Territories'],
    states: ['Hong Kong']
  }
];

const addressForm = reactive({
  name: '',
  country: 'CN',
  phoneCode: '+86',
  phone: '',
  street: '',
  state: '',
  zipCode: '',
  notes: ''
});

const currentCountry = computed(() => {
  return countries.find(c => c.code === addressForm.country) || countries[0];
});

const currentStates = computed(() => currentCountry.value.states);

const currentPhonePlaceholder = computed(() => {
  return addressForm.phoneCode === '+86' ? '11 digits mobile number' : '8 digits mobile number';
});

const phoneMaxLength = computed(() => {
  return addressForm.phoneCode === '+86' ? 11 : 8;
});

// When country changes, force phoneCode and reset state to match
watch(
  () => addressForm.country,
  (newCode) => {
    const found = countries.find(c => c.code === newCode);
    addressForm.phoneCode = found ? found.phoneCode : '+86';
    addressForm.state = '';
    // also reset phone when switching region
    addressForm.phone = '';
  }
);

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
          country: defaultAddress.country || 'CN',
          phoneCode: defaultAddress.phoneCode || (defaultAddress.country === 'HK' ? '+852' : '+86'),
          phone: defaultAddress.phone,
          street: defaultAddress.street,
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

const formatCardNumber = (event) => {
  let value = event.target.value.replace(/\s/g, '');
  let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
  if (formattedValue.length <= 19) {
    paymentForm.cardNumber = formattedValue;
  }
};

const formatExpiryDate = (event) => {
  let value = event.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  paymentForm.expiryDate = value;
};

const onPhoneInput = (event) => {
  const numeric = event.target.value.replace(/\D/g, '').slice(0, phoneMaxLength.value);
  addressForm.phone = numeric;
};

const submitOrder = async () => {
  if (cartItems.value.length === 0) {
    window.alert('Your cart is empty');
    return;
  }

  // Basic phone validation based on country/phone code
  const numericPhone = addressForm.phone.replace(/\D/g, '');
  const phoneLen = numericPhone.length;
  if (addressForm.phoneCode === '+86' && phoneLen !== 11) {
    window.alert('For China (+86), phone number must be 11 digits.');
    return;
  }
  if (addressForm.phoneCode === '+852' && phoneLen !== 8) {
    window.alert('For Hong Kong (+852), phone number must be 8 digits.');
    return;
  }

  // Validate payment method
  if (selectedPaymentMethod.value === 'credit' || selectedPaymentMethod.value === 'debit') {
    if (!paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv || !paymentForm.cardholderName) {
      window.alert('Please fill in all card information');
      return;
    }
    // Basic validation
    if (paymentForm.cardNumber.replace(/\s/g, '').length < 13) {
      window.alert('Please enter a valid card number');
      return;
    }
    if (paymentForm.expiryDate.length !== 5) {
      window.alert('Please enter a valid expiry date (MM/YY)');
      return;
    }
    if (paymentForm.cvv.length < 3) {
      window.alert('Please enter a valid CVV');
      return;
    }
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
        country: addressForm.country,
        phoneCode: addressForm.phoneCode,
        phone: `${addressForm.phoneCode} ${numericPhone}`,
        street: addressForm.street,
        state: addressForm.state,
        zipCode: addressForm.zipCode,
        notes: addressForm.notes || undefined
      },
      paymentMethod: selectedPaymentMethod.value,
      paymentInfo: (selectedPaymentMethod.value === 'credit' || selectedPaymentMethod.value === 'debit') ? {
        cardNumber: paymentForm.cardNumber.replace(/\s/g, '').slice(-4), // Only store last 4 digits
        cardType: selectedPaymentMethod.value === 'credit' ? 'Credit Card' : 'Debit Card',
        cardholderName: paymentForm.cardholderName
      } : {
        method: selectedPaymentMethod.value === 'alipay' ? 'Alipay' : 'WeChat Pay'
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
    const paymentMethodName = paymentMethods.find(m => m.id === selectedPaymentMethod.value)?.name || 'Payment';
    window.alert(`Order placed successfully with ${paymentMethodName}! Order #: ${order.orderNumber || order.id}`);
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
  align-items: start;
}

.checkout__left {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.checkout__right {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

/* Payment Methods */
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-surface);
}

.payment-method:hover {
  border-color: var(--color-brand);
  background: rgba(43, 181, 192, 0.05);
}

.payment-method--selected {
  border-color: var(--color-brand);
  background: rgba(43, 181, 192, 0.1);
  box-shadow: 0 0 0 3px rgba(43, 181, 192, 0.1);
}

.payment-method__icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  border-radius: 8px;
}

.payment-method__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-method__name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 16px;
}

.payment-method__desc {
  font-size: 14px;
  color: var(--color-text-muted);
}

.payment-method__radio {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-method__radio input[type="radio"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-brand);
}

/* Payment Form */
.payment-form {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
}

.payment-form__title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.payment-qr-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: var(--color-background);
  border-radius: 12px;
  text-align: center;
}

.payment-qr-info__icon {
  font-size: 64px;
}

.payment-qr-info__text {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .checkout__content {
    grid-template-columns: 1fr;
  }

  .checkout__left,
  .checkout__right {
    gap: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .payment-method {
    padding: 12px;
  }

  .payment-method__icon {
    font-size: 24px;
    width: 40px;
    height: 40px;
  }
}
</style>

