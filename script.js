
const API = {
    elara: {
        products: "https://ayeshafida.pythonanywhere.com/api/elara/products/",
        categories: "https://ayeshafida.pythonanywhere.com/api/elara/categories/",
        featured: "https://ayeshafida.pythonanywhere.com/api/elara/featured/",
        single: id => `https://ayeshafida.pythonanywhere.com/api/elara/products/${id}/`
    },

    timeora: {
        products: "https://ayeshafida.pythonanywhere.com/api/timeora/watches/",
        categories: "https://ayeshafida.pythonanywhere.com/api/timeora/categories/",
        featured: "https://ayeshafida.pythonanywhere.com/api/timeora/featured/",
        single: id => `https://ayeshafida.pythonanywhere.com/api/timeora/watches/${id}/`
    }
};

let elaraProducts = [];
let timeoraProducts = [];

let cart = JSON.parse(localStorage.getItem("maisonCart")) || [];

let activeCategories = {
    elara: "all",
    timeora: "all"
};

let searchTerm = "";

// API DATA FETCH

async function fetchData(url) {

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("API request failed: " + response.status);
    }

    return await response.json();
}


// GET PRODUCTS

async function loadProducts() {

    try {

        const [elara, timeora] = await Promise.all([
            fetchData(API.elara.products),
            fetchData(API.timeora.products)
        ]);

        elaraProducts = Array.isArray(elara) ? elara : (elara.products || []);
        timeoraProducts = Array.isArray(timeora) ? timeora : (timeora.watches || []);

        displayProducts("elara");
        displayProducts("timeora");

    } catch (error) {

        console.error("Product API Error:", error);

        document.getElementById("elara-products-grid").innerHTML =
            "<p>ÉLARA products could not load. Check API connection.</p>";

        document.getElementById("timeora-products-grid").innerHTML =
            "<p>TIMEORA products could not load. Check API connection.</p>";
    }

}


// GET CATEGORIES

async function loadCategories(brand) {

    try {

        const data = await fetchData(API[brand].categories);

        let categories = Array.isArray(data)
            ? data
            : (data.categories || []);

        const container = document.getElementById(
            brand + "-categories"
        );

        container.innerHTML = `
            <button class="category-chip active"
                onclick="filterCategory('${brand}', 'all')">
                All
            </button>
        `;

        categories.forEach(category => {

            let name = typeof category === "object"
                ? category.name
                : category;

            container.innerHTML += `
                <button class="category-chip"
                    onclick="filterCategory('${brand}', '${String(name).replace(/'/g, "\\'")}')">
                    ${name}
                </button>
            `;

        });

    } catch (error) {

        console.error(brand + " category error:", error);

    }

}


// DISPLAY PRODUCTS

function displayProducts(brand) {

    let products = brand === "elara"
        ? elaraProducts
        : timeoraProducts;

    let container = document.getElementById(
        brand + "-products-grid"
    );

    let filtered = products.filter(product => {

        let matchesCategory =
            activeCategories[brand] === "all" ||
            String(
                typeof product.category === "object"
                    ? product.category.name
                    : product.category
            ).toLowerCase() === activeCategories[brand].toLowerCase();

        let matchesSearch =
            String(product.name || "").toLowerCase()
                .includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;

    });

    if (!filtered.length) {

        container.innerHTML = "<p>No products found.</p>";
        return;

    }

    container.innerHTML = filtered.map(product => {

        let image = product.image ||
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700";

        let category = typeof product.category === "object"
            ? product.category.name
            : product.category;

        return `

            <div class="product-card">

                <div class="product-image">

                    <img src="${image}"
                         alt="${product.name}"
                         onerror="this.src='https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700'">

                    <span class="product-badge">
                        ${brand === "elara" ? "ÉLARA" : "TIMEORA"}
                    </span>

                    <button class="quick-add"
                        onclick="addToCart('${brand}', ${product.id})">
                        ADD TO BAG +
                    </button>

                </div>

                <div class="product-info">

                    <p class="product-meta">
                        ${category || ""}
                    </p>

                    <h3 class="product-name">
                        ${product.name || "Product"}
                    </h3>

                    <p class="product-price">
                        Rs. ${Number(product.price || 0).toLocaleString("en-PK")}
                    </p>

                    <button class="category-chip"
                        onclick="showProduct('${brand}', ${product.id})">
                        VIEW DETAILS
                    </button>

                </div>

            </div>

        `;

    }).join("");

}


// FILTER CATEGORY

function filterCategory(brand, category) {

    activeCategories[brand] = category;

    displayProducts(brand);

    let buttons = document.querySelectorAll(
        `#${brand}-categories button`
    );

    buttons.forEach(button => {

        button.classList.toggle(
            "active",
            button.textContent.trim().toLowerCase() === category.toLowerCase()
        );

    });

}


// SEARCH

function toggleSearch() {

    document.getElementById("search-box")
        .classList.toggle("active");

}


function searchProducts() {

    searchTerm = document.getElementById("search-input").value;

    displayProducts("elara");
    displayProducts("timeora");

}


// SINGLE PRODUCT API

async function showProduct(brand, id) {

    const modal = document.getElementById("product-modal");

    const content = document.getElementById("modal-content");

    modal.classList.add("active");

    content.innerHTML = "<p>Loading product details...</p>";

    try {

        const product = await fetchData(API[brand].single(id));

        const item = product.product || product.watch || product;

        content.innerHTML = `

            <button onclick="closeProduct()"
                style="float:right;border:0;background:none;font-size:25px">
                ×
            </button>

            <img src="${item.image || ""}"
                 style="width:100%;max-height:300px;object-fit:contain">

            <h2>${item.name || "Product"}</h2>

            <p>${item.description || "No description available."}</p>

            <h3>Rs. ${Number(item.price || 0).toLocaleString("en-PK")}</h3>

            <button class="primary-btn"
                onclick="addToCart('${brand}', ${item.id});closeProduct()">
                ADD TO BAG
            </button>

        `;

    } catch (error) {

        console.error(error);

        content.innerHTML = "<p>Unable to load product details.</p>";

    }

}


function closeProduct() {

    document.getElementById("product-modal")
        .classList.remove("active");

}


// ADD TO CART

function addToCart(brand, id) {

    let products = brand === "elara"
        ? elaraProducts
        : timeoraProducts;

    let product = products.find(item => item.id == id);

    if (!product) return;

    let existing = cart.find(
        item => item.id == id && item.brand === brand
    );

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            ...product,
            brand: brand,
            quantity: 1
        });

    }

    saveCart();

    alert("Product added to your bag!");

}


// SAVE CART

function saveCart() {

    localStorage.setItem(
        "maisonCart",
        JSON.stringify(cart)
    );

    displayCart();

}


// DISPLAY CART

function displayCart() {

    let container = document.getElementById("cart-items");

    let total = 0;

    let count = 0;

    container.innerHTML = "";

    cart.forEach((item, index) => {

        let price = Number(item.price || 0);

        total += price * item.quantity;

        count += item.quantity;

        container.innerHTML += `

            <div class="cart-item">

                <img src="${item.image || ""}" alt="${item.name}">

                <div>

                    <h4>${item.name}</h4>

                    <p>Rs. ${price.toLocaleString("en-PK")}</p>

                    <p>Quantity: ${item.quantity}</p>

                    <button onclick="changeQuantity(${index}, -1)">−</button>

                    <button onclick="changeQuantity(${index}, 1)">+</button>

                    <button onclick="removeItem(${index})">Remove</button>

                </div>

            </div>

        `;

    });

    if (cart.length === 0) {

        container.innerHTML = "<p>Your shopping bag is empty.</p>";

    }

    document.getElementById("cart-count").textContent = count;

    document.getElementById("cart-total").textContent =
        total.toLocaleString("en-PK");

}


// QUANTITY

function changeQuantity(index, amount) {

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }

    saveCart();

}


// REMOVE ITEM

function removeItem(index) {

    cart.splice(index, 1);

    saveCart();

}


// OPEN CART

function toggleCart() {

    document.getElementById("cart-panel")
        .classList.toggle("active");

}


// INITIALIZE WEBSITE

async function initializeWebsite() {

    displayCart();

    await Promise.all([

        loadProducts(),

        loadCategories("elara"),

        loadCategories("timeora")

    ]);

}

initializeWebsite();
