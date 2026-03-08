// Cart Page JavaScript

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('superstarCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    renderCartPage();
    updateCartCount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('superstarCart', JSON.stringify(cart));
}

// Render cart page
function renderCartPage() {
    const container = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const itemCount = document.getElementById('cartItemCount');
    
    if (!cart || cart.length === 0) {
        container.innerHTML = '';
        emptyCart.style.display = 'block';
        clearCartBtn.style.display = 'none';
        itemCount.textContent = '0 items in your cart';
        updateTotals();
        return;
    }
    
    emptyCart.style.display = 'none';
    clearCartBtn.style.display = 'block';
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    itemCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'} in your cart`;
    
    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item-card" style="animation-delay: ${index * 0.1}s">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                 onerror="this.src='${DEFAULT_IMAGE}'">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)} per unit</div>
                <div class="cart-item-controls">
                    <div class="quantity-control-group">
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, -1)">−</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
                        Remove
                    </button>
                </div>
            </div>
            <div class="cart-item-total">
                ₹${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');
    
    updateTotals();
}

// Update totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `₹${subtotal.toFixed(2)}`;
}

// Update cart item quantity
function updateCartItemQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            removeFromCart(productId);
            return;
        }
        
        saveCart();
        renderCartPage();
        updateCartCount();
    }
}

// Remove item from cart
function removeFromCart(productId) {
    const index = cart.findIndex(i => i.id === productId);
    
    if (index !== -1) {
        // Add removal animation
        const itemCard = document.querySelector(`.cart-item-card:nth-child(${index + 1})`);
        if (itemCard) {
            itemCard.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                cart.splice(index, 1);
                saveCart();
                renderCartPage();
                updateCartCount();
            }, 300);
        } else {
            cart.splice(index, 1);
            saveCart();
            renderCartPage();
            updateCartCount();
        }
    }
}

// Clear entire cart
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        renderCartPage();
        updateCartCount();
    }
}

// Send to WhatsApp
function sendToWhatsApp() {
    if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Get customer information
    const customerName = document.getElementById('customerName').value.trim();
    const customerNumber = document.getElementById('customerNumber').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();

    // Clear previous errors
    document.getElementById('nameError').textContent = '';
    document.getElementById('numberError').textContent = '';
    document.getElementById('addressError').textContent = '';

    // Validate mandatory fields
    let hasError = false;

    if (!customerName) {
        document.getElementById('nameError').textContent = 'Name is required';
        hasError = true;
    }

    if (!customerNumber) {
        document.getElementById('numberError').textContent = 'Phone number is required';
        hasError = true;
    } else if (!/^[0-9]{10}$/.test(customerNumber)) {
        document.getElementById('numberError').textContent = 'Please enter a valid 10-digit phone number';
        hasError = true;
    }

    if (!customerAddress) {
        document.getElementById('addressError').textContent = 'Address is required';
        hasError = true;
    }

    if (hasError) {
        // Scroll to first error
        const firstError = document.querySelector('.error-message:not(:empty)');
        if (firstError) {
            firstError.closest('.form-group').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Build WhatsApp message
    // Build WhatsApp message (Enhanced UI-friendly format)
// Build WhatsApp message (UI-friendly format)
let msg = " *New Order - Super Star Agencies*%0A%0A";

// Divider
msg += "━━━━━━━━━━━━━━━━━━━━━%0A";

// Customer Details
msg += "*Customer Details:*%0A";
msg += `Name: ${encodeURIComponent(customerName)}%0A`;
msg += ` Mobile: ${encodeURIComponent(customerNumber)}%0A`;
msg += ` Address: ${encodeURIComponent(customerAddress)}%0A%0A`;

// Divider
msg += "━━━━━━━━━━━━━━━━━━━━━%0A";
msg += "*Order Details:*%0A%0A";

// Order Items
let total = 0;

cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    msg += `${index + 1}. *${encodeURIComponent(item.name)}*%0A`;
    msg += `   Qty: ${item.quantity} × ₹${item.price} = ₹${itemTotal.toFixed(2)}%0A%0A`;
});

// Divider
msg += "━━━━━━━━━━━━━━━━━━━━━%0A";
msg += `*Total Amount: ₹${total.toFixed(2)}*%0A%0A`;

// Footer
msg += "Please confirm this order.%0A";
msg += "Thank you for ordering! ";

// Open WhatsApp with pre-filled message
    window.open(`https://wa.me/918007835556?text=${msg}`, "_blank");
}

// Update cart count in navbar
function updateCartCount() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById("cartCount");
    
    if (cartCountElement) {
        const currentCount = parseInt(cartCountElement.innerText) || 0;
        if (currentCount !== totalQuantity) {
            cartCountElement.innerText = totalQuantity;
            cartCountElement.classList.add('cart-count-animation');
            setTimeout(() => {
                cartCountElement.classList.remove('cart-count-animation');
            }, 300);
        }
    }
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize cart page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    // Clear errors when user starts typing
    document.getElementById('customerName')?.addEventListener('input', function() {
        document.getElementById('nameError').textContent = '';
    });
    document.getElementById('customerNumber')?.addEventListener('input', function() {
        document.getElementById('numberError').textContent = '';
    });
    document.getElementById('customerAddress')?.addEventListener('input', function() {
        document.getElementById('addressError').textContent = '';
    });
});

