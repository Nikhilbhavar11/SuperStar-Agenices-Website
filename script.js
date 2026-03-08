function normalize(str) {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

const API_BASE = "https://superstaragencies.in/backend";
const CATEGORY_IMAGE_BASE = "https://superstaragencies.in/backend/uploads/categories";
const DEFAULT_IMAGE = `${CATEGORY_IMAGE_BASE}/default-superstar.png`;

let products = [];
let cart = [];
let currentFilter = "";
let currentSort = ""; // Track current sort option

// Load cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('superstarCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('superstarCart', JSON.stringify(cart));
}

// Initialize cart on page load
loadCartFromStorage();

/* LOAD PRODUCTS */
async function loadProductsFromAPI() {
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        const json = await res.json();

        products = json.data.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            image: `${CATEGORY_IMAGE_BASE}/${p.category}.png`
        }));

        document.getElementById("statProducts").innerText = products.length;
        document.getElementById("statBrands").innerText =
            new Set(products.map(p => normalize(p.category))).size;
        document.getElementById("statCategories").innerText =
            new Set(products.map(p => normalize(p.category))).size;
        renderCategoryButtons(products);
        renderProducts();
        updateCartCount();

    } catch (e) {
        console.error(e);
        document.getElementById("brandsContainer").innerHTML =
            "<p class='no-products'>Unable to load products</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadProductsFromAPI);

/* FILTER */
function filterByCategory(category) {
    currentFilter = category === "All Products" ? "" : category;

    document.querySelectorAll(".category").forEach(btn => {
        const btnText = btn.textContent.trim();
        const isActive = normalize(btnText) === normalize(category);
        btn.classList.toggle("active", isActive);
    });

    applyFilters();
}

function searchProducts() {
    applyFilters();
}

function applyFilters() {
    const term = document.getElementById("searchInput").value;

    // First apply filtering
    let filtered = products.filter(p => {
        let matchCategory = true;
        if (currentFilter) {
            const normalizedProductCategory = normalize(p.category);
            const normalizedFilter = normalize(currentFilter);
            
            // Exact match first
            matchCategory = normalizedProductCategory === normalizedFilter;
            
            // If no exact match, only apply flexible matching for CHHEDA/CHHEDAS specifically
            // This prevents other categories from incorrectly matching
            if (!matchCategory) {
                const filterBase = normalizedFilter.replace(/s$/, ''); // Remove trailing 's'
                const productBase = normalizedProductCategory.replace(/s$/, ''); // Remove trailing 's'
                
                // Only allow flexible matching if both are CHHEDA-related
                const isChhedaFilter = filterBase === 'chheda' || normalizedFilter === 'chheda' || normalizedFilter === 'chhedas';
                const isChhedaProduct = productBase === 'chheda' || normalizedProductCategory === 'chheda' || normalizedProductCategory === 'chhedas';
                
                // Match if both are CHHEDA-related and base words are the same
                if (isChhedaFilter && isChhedaProduct && filterBase === productBase && filterBase.length > 0) {
                    matchCategory = true;
                }
            }
        }
        const matchSearch = !term || normalize(p.name).includes(normalize(term));
        return matchCategory && matchSearch;
    });
    
    // Then apply sorting to the filtered results
    filtered = sortProducts(filtered, currentSort);

    renderFilteredProducts(filtered);
}

/* RENDER */
function renderProducts() {
    renderFilteredProducts(products);
}

function renderFilteredProducts(list) {
    const container = document.getElementById("brandsContainer");
    container.innerHTML = "";

    if (!list.length) {
        container.innerHTML = "<p class='no-products'>No products found</p>";
        return;
    }

    const grouped = {};
    list.forEach(p => {
        grouped[p.category] = grouped[p.category] || [];
        grouped[p.category].push(p);
    });

    Object.keys(grouped).forEach(category => {
        const section = document.createElement("div");
        section.className = "brand-section";

        section.innerHTML = `
            <h3 class="brand-title">${category}</h3>
            <div class="products-grid">
                ${grouped[category].map(p => `
                    <div class="product-card">
                        <img src="${p.image}" class="product-image"
                             onerror="this.src='${DEFAULT_IMAGE}'">
                        <h3>${p.name}</h3>
                        <p class="product-price">₹${p.price.toFixed(2)}</p>
                        <div class="quantity-input-wrapper">
                            <button class="quantity-btn-decrease" onclick="decreaseQuantity(${p.id})" type="button" disabled style="opacity: 0.5; cursor: not-allowed;">−</button>
                            <input type="number" min="1" value="1" id="qty-${p.id}" onchange="validateQuantity(${p.id}); updateQuantityButtons(${p.id});">
                            <button class="quantity-btn-increase" onclick="increaseQuantity(${p.id})" type="button">+</button>
                        </div>
                        <button class="add-to-cart" onclick="addToCart(${p.id})">
                            Add to Cart
                        </button>
                    </div>
                `).join("")}
            </div>
        `;
        container.appendChild(section);
    });
}

/* QUANTITY CONTROLS */
function decreaseQuantity(id) {
    const input = document.getElementById(`qty-${id}`);
    const currentValue = parseInt(input.value) || 1;
    if (currentValue > 1) {
        input.value = currentValue - 1;
        validateQuantity(id);
        updateQuantityButtons(id);
    }
}

function increaseQuantity(id) {
    const input = document.getElementById(`qty-${id}`);
    const currentValue = parseInt(input.value) || 1;
    input.value = currentValue + 1;
    validateQuantity(id);
    updateQuantityButtons(id);
}

function updateQuantityButtons(id) {
    const input = document.getElementById(`qty-${id}`);
    const value = parseInt(input.value) || 1;
    const decreaseBtn = input.previousElementSibling;
    if (decreaseBtn && decreaseBtn.classList.contains('quantity-btn-decrease')) {
        if (value <= 1) {
            decreaseBtn.disabled = true;
            decreaseBtn.style.opacity = '0.5';
            decreaseBtn.style.cursor = 'not-allowed';
        } else {
            decreaseBtn.disabled = false;
            decreaseBtn.style.opacity = '1';
            decreaseBtn.style.cursor = 'pointer';
        }
    }
}

function validateQuantity(id) {
    const input = document.getElementById(`qty-${id}`);
    let value = parseInt(input.value) || 1;
    if (value < 1) {
        value = 1;
    }
    input.value = value;
}

/* CART */
function addToCart(id) {
    const qty = Number(document.getElementById(`qty-${id}`).value) || 1;
    const product = products.find(p => p.id === id);

    if (!product) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ ...product, quantity: qty });
    }

    saveCartToStorage();
    updateCartCount();   // ✅ THIS WAS MISSING
    
    // Add micro-interaction for the add-to-cart button
    const addToCartButton = document.querySelector(`button[onclick="addToCart(${id})"]`);
    if (addToCartButton) {
        addToCartButton.classList.add('added-to-cart');
        
        // Remove the class after animation completes
        setTimeout(() => {
            addToCartButton.classList.remove('added-to-cart');
        }, 300);
    }
    
    // Show notification
    showNotification(`${product.name} added to cart!`);
}


// Enhanced cart counter with animation and safety checks
function updateCartCount() {
    // Calculate total quantity with safety checks
    let totalQuantity = 0;
    for (const item of cart) {
        const quantity = parseInt(item.quantity) || 0;
        if (!isNaN(quantity) && quantity > 0) {
            totalQuantity += quantity;
        }
    }
    
    // Ensure totalQuantity is a valid number
    if (isNaN(totalQuantity) || totalQuantity < 0) {
        totalQuantity = 0;
    }
    
    const cartCountElement = document.getElementById("cartCount");
    
    // Only update if the value actually changed
    if (cartCountElement) {
        const currentCount = parseInt(cartCountElement.innerText) || 0;
        if (currentCount !== totalQuantity) {
            cartCountElement.innerText = totalQuantity;
        
            // Add animation class
            cartCountElement.classList.add('cart-count-animation');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                cartCountElement.classList.remove('cart-count-animation');
            }, 300);
        }
    }
}

/* CART NAVIGATION */
function openCart() {
    window.location.href = 'cart.html';
}

function sortProducts(productsList, sortOption) {
    // Create a copy to avoid mutating the original array
    const sortedProducts = [...productsList];
    
    switch(sortOption) {
        case 'name-asc':
            return sortedProducts.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));
        case 'price-asc':
            return sortedProducts.sort((a, b) => a.price - b.price);
        case 'price-desc':
            return sortedProducts.sort((a, b) => b.price - a.price);
        default:
            return sortedProducts; // Return as is if no sort option
    }
}

// Function to handle sort change
function handleSortChange(sortOption) {
    currentSort = sortOption;
    
    // Update active state for sort buttons
    document.querySelectorAll('.sort-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortOption);
    });
    
    applyFilters(); // Re-apply filters with new sort
}

function renderCart() {
    const items = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");

    if (!cart.length) {
        items.innerHTML = "<p>Your cart is empty</p>";
        totalEl.innerText = "0.00";
        return;
    }

    let total = 0;
    items.innerHTML = cart.map(i => {
        const itemTotal = i.price * i.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${i.name}</div>
                    <div class="cart-item-price">₹${i.price.toFixed(2)} × ${i.quantity}</div>
                </div>
                <div class="cart-item-total">₹${itemTotal.toFixed(2)}</div>
                <div class="cart-item-controls">
                    <button onclick="updateCartItemQuantity(${i.id}, -1)" class="quantity-btn">-</button>
                    <span class="quantity-display">${i.quantity}</span>
                    <button onclick="updateCartItemQuantity(${i.id}, 1)" class="quantity-btn">+</button>
                    <button onclick="removeFromCart(${i.id})" class="remove-btn">✕</button>
                </div>
            </div>
        `;
    }).join("");

    totalEl.innerText = total.toFixed(2);
}

// Update cart item quantity
function updateCartItemQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    
    if (item) {
        const newQuantity = item.quantity + change;
        
        // Ensure quantity is valid
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            // If quantity would be 0 or less, remove the item
            removeFromCart(productId);
            return;
        }
        
        saveCartToStorage();
        updateCartCount();
        // Only render cart if we're on the cart page
        if (typeof renderCartPage === 'function') {
            renderCartPage();
        } else if (typeof renderCart === 'function') {
            renderCart();
        }
    }
}

// Remove item from cart
function removeFromCart(productId) {
    const index = cart.findIndex(i => i.id === productId);
    
    if (index !== -1) {
        cart.splice(index, 1);
        saveCartToStorage();
        updateCartCount();
        // Only render cart if we're on the cart page
        if (typeof renderCartPage === 'function') {
            renderCartPage();
        } else if (typeof renderCart === 'function') {
            renderCart();
        }
        showNotification('Item removed from cart');
    }
}

// Show notification function
function showNotification(message) {
    // Get cart icon position to position notification near it
    const cartElement = document.querySelector('.nav-cart');
    if (!cartElement) return;
    
    const cartRect = cartElement.getBoundingClientRect();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Position near cart icon
    notification.style.position = 'fixed';
    notification.style.top = `${cartRect.bottom + 10}px`;
    notification.style.right = `${window.innerWidth - cartRect.right}px`;
    notification.style.maxWidth = '250px';
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/* WHATSAPP CHECKOUT */
function sendToWhatsApp() {
    if (!cart.length) {
        showNotification('Your cart is empty!');
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
    let msg = "*Superstar Agency Order*%0A%0A";
    
    // Customer Information
    msg += "-------------------------------%0A";
    msg += "*Customer Details*%0A";
    msg += "-------------------------------%0A";
    msg += `Name    : ${encodeURIComponent(customerName)}%0A`;
    msg += `Phone   : ${encodeURIComponent(customerNumber)}%0A`;
    msg += `Address : ${encodeURIComponent(customerAddress)}%0A%0A`;

    msg += "-------------------------------%0A";
    msg += "*Order Items*%0A";
    msg += "-------------------------------%0A";
    msg += "No  Product Name            Qty   Amount%0A";
    msg += "-----------------------------------------%0A";
    
    // Order Items
    msg += "*Order Items:*%0A";
    cart.forEach(i => {
        msg += `${encodeURIComponent(i.name)} × ${i.quantity} = ₹${(i.price * i.quantity).toFixed(2)}%0A`;
    });

    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    msg += `%0A*Total: ₹${total.toFixed(2)}*%0A%0APlease confirm the order.`;

    window.open(`https://wa.me/918007835556?text=${msg}`, "_blank");
}

/* SCROLL TO PRODUCTS */
function scrollToProducts() {
    document.getElementById("productsSection").scrollIntoView({ behavior: "smooth" });
}
function renderCategoryButtons(products) {
    const tabsContainer = document.getElementById("categoryTabs");
    tabsContainer.innerHTML = "";

    // Extract unique categories (normalized but preserve original)
    const categoryMap = new Map();

    products.forEach(p => {
        const key = normalize(p.category);
        if (!categoryMap.has(key)) {
            categoryMap.set(key, p.category);
        }
    });

    // Always add "All Products" first
    const allBtn = document.createElement("button");
    allBtn.className = "category active";
    allBtn.innerText = "All Products";
    allBtn.onclick = () => filterByCategory("All Products");
    tabsContainer.appendChild(allBtn);

    // Add backend categories
    categoryMap.forEach(category => {
        const btn = document.createElement("button");
        btn.className = "category";
        btn.innerText = category;
        btn.onclick = () => filterByCategory(category);
        tabsContainer.appendChild(btn);
    });
}
