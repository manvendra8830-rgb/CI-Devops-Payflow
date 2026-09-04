/* =========================================
   PAYFLOW - ADVANCED JAVASCRIPT
========================================= */

"use strict";

/* =========================================
   APPLICATION STATE
========================================= */

const appState = {
  balance: 124580.5,
  received: 58420,
  sent: 32840,

  darkMode: false,
  cardFrozen: false,

  transactions: [],
};

/* =========================================
   DOM HELPERS
========================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);

/* =========================================
   PAGE NAVIGATION
========================================= */

const pages = $$(".page");
const navItems = $$(".nav-item");
const pageButtons = $$("[data-page]");

function showPage(pageId) {
  pages.forEach((page) => {
    page.classList.remove("active");
  });

  const target = document.getElementById(pageId);

  if (!target) return;

  target.classList.add("active");

  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  closeSidebar();
}

pageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;

    if (page) {
      showPage(page);
    }
  });
});

/* =========================================
   MOBILE SIDEBAR
========================================= */

const sidebar = $("#sidebar");
const menuBtn = $("#menuBtn");

menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

function closeSidebar() {
  sidebar.classList.remove("open");
}

/* =========================================
   TOAST SYSTEM
========================================= */

function showToast(message, type = "success") {
  const container = $("#toastContainer");

  const toast = document.createElement("div");

  toast.className = "toast";

  const icon = type === "error" ? "✕" : type === "warning" ? "!" : "✓";

  toast.innerHTML = `
        <strong>${icon}</strong>
        <span>${message}</span>
    `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

/* =========================================
   MODAL SYSTEM
========================================= */

const modalOverlay = $("#modalOverlay");
const modal = $("#modal");
const modalContent = $("#modalContent");
const modalClose = $("#modalClose");

function openModal(content) {
  modalContent.innerHTML = content;

  modalOverlay.classList.add("show");
}

function closeModal() {
  modalOverlay.classList.remove("show");
}

modalClose?.addEventListener("click", closeModal);

modalOverlay?.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

/* =========================================
   DARK MODE
========================================= */

const themeToggle = $("#themeToggle");
const darkModeSwitch = $("#darkModeSwitch");

function setDarkMode(enabled) {
  appState.darkMode = enabled;

  document.body.classList.toggle("dark", enabled);

  if (darkModeSwitch) {
    darkModeSwitch.checked = enabled;
  }

  localStorage.setItem("payflow-dark-mode", enabled);
}

const savedTheme = localStorage.getItem("payflow-dark-mode");

if (savedTheme === "true") {
  setDarkMode(true);
}

themeToggle?.addEventListener("click", () => {
  setDarkMode(!appState.darkMode);
});

darkModeSwitch?.addEventListener("change", (event) => {
  setDarkMode(event.target.checked);
});

/* =========================================
   BALANCE VISIBILITY
========================================= */

const balanceVisibility = $("#balanceVisibility");
const totalBalance = $("#totalBalance");

let balanceVisible = true;

balanceVisibility?.addEventListener("click", () => {
  balanceVisible = !balanceVisible;

  totalBalance.textContent = balanceVisible
    ? formatCurrency(appState.balance)
    : "₹ •••••••";
});

/* =========================================
   CURRENCY FORMATTER
========================================= */

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/* =========================================
   SEND MONEY
========================================= */

const paymentForm = $("#paymentForm");
const paymentAmount = $("#paymentAmount");
const receiverName = $("#receiverName");

$$(".amount-shortcuts button").forEach((button) => {
  button.addEventListener("click", () => {
    paymentAmount.value = button.dataset.amount;

    paymentAmount.focus();
  });
});

$$(".contact").forEach((contact) => {
  contact.addEventListener("click", () => {
    const name = contact.textContent.trim();

    receiverName.value = name;

    showToast(`${name} selected`);
  });
});

paymentForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const receiver = receiverName.value.trim();

  const amount = Number(paymentAmount.value);

  const note = $("#paymentNote").value.trim();

  if (!receiver) {
    showToast("Please enter receiver name.", "error");

    return;
  }

  if (!amount || amount <= 0) {
    showToast("Please enter a valid amount.", "error");

    return;
  }

  if (amount > appState.balance) {
    showToast("Insufficient balance.", "error");

    return;
  }

  showPaymentConfirmation(receiver, amount, note);
});

/* =========================================
   PAYMENT CONFIRMATION
========================================= */

function showPaymentConfirmation(receiver, amount, note) {
  openModal(`

        <div style="text-align:center">

            <div style="
                width:65px;
                height:65px;
                display:grid;
                place-items:center;
                margin:0 auto 15px;
                background:rgba(99,91,255,.1);
                color:#635bff;
                border-radius:50%;
                font-size:28px;
            ">
                ↗
            </div>

            <h2>Confirm Payment</h2>

            <p style="
                color:var(--muted);
                margin:8px 0 25px;
            ">
                Review your payment details.
            </p>

            <div style="
                background:var(--surface-2);
                padding:18px;
                border-radius:14px;
                text-align:left;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:12px;
                ">
                    <span>Recipient</span>
                    <strong>${escapeHTML(receiver)}</strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:12px;
                ">
                    <span>Amount</span>
                    <strong>${formatCurrency(amount)}</strong>
                </div>

                <div style="
                    display:flex;
                    justify-content:space-between;
                ">
                    <span>Note</span>
                    <strong>${escapeHTML(note || "—")}</strong>
                </div>

            </div>

            <button
                class="primary-btn full-width"
                id="confirmPayment"
                style="margin-top:20px"
            >
                Confirm & Pay
            </button>

        </div>

    `);

  $("#confirmPayment")?.addEventListener("click", () => {
    processPayment(receiver, amount, note);
  });
}

/* =========================================
   PROCESS PAYMENT
========================================= */

function processPayment(receiver, amount, note) {
  const button = $("#confirmPayment");

  button.disabled = true;

  button.textContent = "Processing Payment...";

  setTimeout(() => {
    appState.balance -= amount;
    appState.sent += amount;

    addTransaction({
      name: receiver,
      amount: amount,
      type: "sent",
      note: note,
      date: new Date(),
    });

    updateDashboard();

    closeModal();

    paymentForm.reset();

    showToast(`${formatCurrency(amount)} sent to ${receiver}`);

    showPage("transactions");
  }, 1300);
}

/* =========================================
   TRANSACTION STATE
========================================= */

function addTransaction(transaction) {
  appState.transactions.unshift(transaction);

  renderTransactions();
}

function renderTransactions() {
  const container = $("#allTransactions");

  if (!container) return;

  const dynamic = appState.transactions
    .map((transaction) => {
      const isReceived = transaction.type === "received";

      return `

                    <div
                        class="transaction"
                        data-type="${transaction.type}"
                        data-name="${escapeHTML(
                          transaction.name.toLowerCase(),
                        )}"
                    >

                        <div class="
                            transaction-icon
                            ${isReceived ? "received" : "sent"}
                        ">
                            ${escapeHTML(
                              transaction.name.charAt(0).toUpperCase(),
                            )}
                        </div>

                        <div class="transaction-info">

                            <strong>
                                ${escapeHTML(transaction.name)}
                            </strong>

                            <span>
                                Just now ·
                                ${isReceived ? "Received" : "Payment"}
                            </span>

                        </div>

                        <strong class="
                            amount
                            ${isReceived ? "positive" : "negative"}
                        ">
                            ${isReceived ? "+" : "-"}
                            ${formatCurrency(transaction.amount)}
                        </strong>

                    </div>
                `;
    })
    .join("");

  const existing = container.innerHTML;

  container.innerHTML = dynamic + existing;
}

/* =========================================
   DASHBOARD UPDATE
========================================= */

function updateDashboard() {
  if (totalBalance) {
    totalBalance.textContent = balanceVisible
      ? formatCurrency(appState.balance)
      : "₹ •••••••";
  }

  if ($("#receivedAmount")) {
    $("#receivedAmount").textContent = formatCurrency(appState.received);
  }

  if ($("#sentAmount")) {
    $("#sentAmount").textContent = formatCurrency(appState.sent);
  }
}

/* =========================================
   SEARCH TRANSACTIONS
========================================= */

const transactionSearch = $("#transactionSearch");

transactionSearch?.addEventListener("input", filterTransactions);

$("#transactionType")?.addEventListener("change", filterTransactions);

function filterTransactions() {
  const query = transactionSearch?.value.toLowerCase().trim() || "";

  const type = $("#transactionType")?.value || "all";

  $$("#allTransactions .transaction").forEach((transaction) => {
    const name = transaction.dataset.name?.toLowerCase() || "";

    const transactionType = transaction.dataset.type;

    const matchesSearch = name.includes(query);

    const matchesType = type === "all" || transactionType === type;

    transaction.style.display = matchesSearch && matchesType ? "flex" : "none";
  });
}

/* =========================================
   GLOBAL SEARCH
========================================= */

const globalSearch = $("#globalSearch");

globalSearch?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") {
    return;
  }

  const query = globalSearch.value.trim().toLowerCase();

  if (!query) return;

  showPage("transactions");

  if (transactionSearch) {
    transactionSearch.value = query;

    filterTransactions();
  }
});

/* =========================================
   REQUEST MONEY
========================================= */

$("#requestPaymentBtn")?.addEventListener("click", () => {
  const person = $("#requestPerson").value.trim();

  const amount = Number($("#requestAmount").value);

  if (!person) {
    showToast("Enter the person's name.", "error");

    return;
  }

  if (!amount || amount <= 0) {
    showToast("Enter a valid amount.", "error");

    return;
  }

  showToast(`Payment request of ${formatCurrency(amount)} created.`);
});

/* =========================================
   QR ACTIONS
========================================= */

$("#shareQr")?.addEventListener("click", async () => {
  const data = "PayFlow payment: @manvendra.pay";

  if (navigator.share) {
    try {
      await navigator.share({
        title: "PayFlow",
        text: data,
      });
    } catch {
      // User cancelled sharing.
    }
  } else {
    copyToClipboard(data);

    showToast("Payment information copied.");
  }
});

$("#downloadQr")?.addEventListener("click", () => {
  showToast("QR download prepared.");
});

/* =========================================
   ADD MONEY
========================================= */

$("#addMoneyBtn")?.addEventListener("click", () => {
  openModal(`

                <h2>Add Money</h2>

                <p style="
                    color:var(--muted);
                    margin:6px 0 20px;
                ">
                    Add money to your PayFlow balance.
                </p>

                <label>Amount</label>

                <div class="amount-input"
                    style="margin-top:8px">

                    <span>₹</span>

                    <input
                        type="number"
                        id="addAmount"
                        placeholder="0.00"
                    >

                </div>

                <button
                    class="primary-btn full-width"
                    id="confirmAddMoney"
                    style="margin-top:18px"
                >
                    Add Money
                </button>

            `);

  $("#confirmAddMoney")?.addEventListener("click", () => {
    const amount = Number($("#addAmount").value);

    if (!amount || amount <= 0) {
      showToast("Enter a valid amount.", "error");

      return;
    }

    appState.balance += amount;

    appState.received += amount;

    updateDashboard();

    closeModal();

    showToast(`${formatCurrency(amount)} added successfully.`);
  });
});

/* =========================================
   WITHDRAW
========================================= */

$("#withdrawBtn")?.addEventListener("click", () => {
  openModal(`

                <h2>Withdraw Money</h2>

                <p style="
                    color:var(--muted);
                    margin:6px 0 20px;
                ">
                    Transfer money to your bank account.
                </p>

                <label>Amount</label>

                <div class="amount-input"
                    style="margin-top:8px">

                    <span>₹</span>

                    <input
                        type="number"
                        id="withdrawAmount"
                        placeholder="0.00"
                    >

                </div>

                <button
                    class="primary-btn full-width"
                    id="confirmWithdraw"
                    style="margin-top:18px"
                >
                    Withdraw
                </button>

            `);

  $("#confirmWithdraw")?.addEventListener("click", () => {
    const amount = Number($("#withdrawAmount").value);

    if (!amount || amount <= 0) {
      showToast("Enter a valid amount.", "error");

      return;
    }

    if (amount > appState.balance) {
      showToast("Insufficient balance.", "error");

      return;
    }

    appState.balance -= amount;

    appState.sent += amount;

    updateDashboard();

    closeModal();

    showToast(`${formatCurrency(amount)} withdrawal initiated.`);
  });
});

/* =========================================
   SCAN QR
========================================= */

$("#scanBtn")?.addEventListener("click", () => {
  openModal(`

                <div style="text-align:center">

                    <div style="
                        width:180px;
                        height:180px;
                        margin:20px auto;
                        display:grid;
                        place-items:center;
                        background:
                            repeating-linear-gradient(
                                45deg,
                                var(--text) 0,
                                var(--text) 6px,
                                var(--surface) 6px,
                                var(--surface) 12px
                            );
                        border:12px solid white;
                    ">
                        <strong style="
                            background:white;
                            color:black;
                            padding:8px;
                        ">
                            SCAN
                        </strong>
                    </div>

                    <h2>Scan QR Code</h2>

                    <p style="
                        color:var(--muted);
                        margin-top:6px;
                    ">
                        Position the QR code inside the frame.
                    </p>

                </div>

            `);
});

/* =========================================
   CARD MANAGEMENT
========================================= */

$("#freezeCardBtn")?.addEventListener("click", (event) => {
  appState.cardFrozen = !appState.cardFrozen;

  event.target.textContent = appState.cardFrozen
    ? "✓ Unfreeze Card"
    : "❄ Freeze Card";

  showToast(
    appState.cardFrozen ? "Card frozen successfully." : "Card is active again.",
  );
});

$("#copyCardBtn")?.addEventListener("click", () => {
  copyToClipboard("4242424242424242");

  showToast("Card number copied.");
});

$("#addCardBtn")?.addEventListener("click", () => {
  openModal(`

                <h2>Add New Card</h2>

                <p style="
                    color:var(--muted);
                    margin:6px 0 20px;
                ">
                    Add a debit or credit card.
                </p>

                <label>Card Number</label>

                <input
                    id="newCardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxlength="19"
                    style="margin-top:7px"
                >

                <label>Card Holder</label>

                <input
                    placeholder="MANVENDRA SINGH"
                    style="margin-top:7px"
                >

                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:10px;
                ">

                    <div>

                        <label>Expiry</label>

                        <input
                            placeholder="MM/YY"
                            style="margin-top:7px"
                        >

                    </div>

                    <div>

                        <label>CVV</label>

                        <input
                            placeholder="•••"
                            style="margin-top:7px"
                        >

                    </div>

                </div>

                <button
                    class="primary-btn full-width"
                    id="saveCardBtn"
                    style="margin-top:20px"
                >
                    Add Card
                </button>

            `);

  $("#newCardNumber")?.addEventListener("input", (event) => {
    let value = event.target.value.replace(/\D/g, "").slice(0, 16);

    value = value.match(/.{1,4}/g)?.join(" ") || "";

    event.target.value = value;
  });

  $("#saveCardBtn")?.addEventListener("click", () => {
    closeModal();

    showToast("Card added successfully.");
  });
});

/* =========================================
   NOTIFICATIONS
========================================= */

$("#markAllRead")?.addEventListener("click", () => {
  $$(".notification").forEach((item) => {
    item.classList.remove("unread");
  });

  $(".notification-count")?.remove();

  showToast("All notifications marked as read.");
});

/* =========================================
   PROFILE
========================================= */

$("#editProfileBtn")?.addEventListener("click", () => {
  openModal(`

                <h2>Edit Profile</h2>

                <p style="
                    color:var(--muted);
                    margin:6px 0 20px;
                ">
                    Update your profile information.
                </p>

                <label>Name</label>

                <input
                    value="Manvendra Singh"
                    style="margin-top:7px"
                >

                <label>Email</label>

                <input
                    value="manvendra@example.com"
                    style="margin-top:7px"
                >

                <label>Phone</label>

                <input
                    value="+91 9876544589"
                    style="margin-top:7px"
                >

                <button
                    class="primary-btn full-width"
                    id="saveProfile"
                    style="margin-top:20px"
                >
                    Save Changes
                </button>

            `);

  $("#saveProfile")?.addEventListener("click", () => {
    closeModal();

    showToast("Profile updated successfully.");
  });
});

/* =========================================
   CHANGE PIN
========================================= */

$("#changePinBtn")?.addEventListener("click", () => {
  openModal(`

                <h2>Change Payment PIN</h2>

                <p style="
                    color:var(--muted);
                    margin:6px 0 20px;
                ">
                    Enter a new secure PIN.
                </p>

                <label>Current PIN</label>

                <input
                    type="password"
                    maxlength="6"
                    inputmode="numeric"
                    placeholder="••••••"
                    style="margin-top:7px"
                >

                <label>New PIN</label>

                <input
                    id="newPin"
                    type="password"
                    maxlength="6"
                    inputmode="numeric"
                    placeholder="••••••"
                    style="margin-top:7px"
                >

                <button
                    class="primary-btn full-width"
                    id="savePin"
                    style="margin-top:20px"
                >
                    Update PIN
                </button>

            `);

  $("#savePin")?.addEventListener("click", () => {
    const pin = $("#newPin").value;

    if (!/^\d{4,6}$/.test(pin)) {
      showToast("PIN must contain 4-6 digits.", "error");

      return;
    }

    closeModal();

    showToast("Payment PIN updated.");
  });
});

/* =========================================
   EXPORT TRANSACTIONS
========================================= */

$("#exportBtn")?.addEventListener("click", () => {
  const rows = [
    ["Transaction", "Type", "Amount"],
    ["Rahul Sharma", "Received", "8500"],
    ["Amazon", "Sent", "2450"],
    ["Freelance Payment", "Received", "15000"],
    ["Swiggy", "Sent", "680"],
  ];

  const csv = rows.map((row) => row.join(",")).join("\n");

  const blob = new Blob([csv], {
    type: "text/csv",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = "payflow-transactions.csv";

  link.click();

  URL.revokeObjectURL(url);

  showToast("Transactions exported.");
});

/* =========================================
   LOGOUT
========================================= */

$("#logoutBtn")?.addEventListener("click", () => {
  openModal(`

                <div style="text-align:center">

                    <div style="
                        font-size:45px;
                        margin-bottom:10px;
                    ">
                        ↪
                    </div>

                    <h2>Logout?</h2>

                    <p style="
                        color:var(--muted);
                        margin:8px 0 20px;
                    ">
                        Are you sure you want to logout?
                    </p>

                    <div style="
                        display:flex;
                        gap:10px;
                    ">

                        <button
                            class="secondary-btn"
                            style="flex:1"
                            id="cancelLogout"
                        >
                            Cancel
                        </button>

                        <button
                            class="primary-btn"
                            style="flex:1"
                            id="confirmLogout"
                        >
                            Logout
                        </button>

                    </div>

                </div>

            `);

  $("#cancelLogout")?.addEventListener("click", closeModal);

  $("#confirmLogout")?.addEventListener("click", () => {
    closeModal();

    showToast("Demo logout successful.");

    showPage("dashboard");
  });
});

/* =========================================
   CLIPBOARD
========================================= */

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();
  }
}

/* =========================================
   HTML ESCAPING
========================================= */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================
   KEYBOARD SHORTCUTS
========================================= */

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key.toLowerCase() === "k") {
    event.preventDefault();

    globalSearch?.focus();
  }

  if (event.key === "/" && document.activeElement.tagName !== "INPUT") {
    event.preventDefault();

    globalSearch?.focus();
  }
});

/* =========================================
   INITIALIZATION
========================================= */

function initializeApp() {
  updateDashboard();

  renderTransactions();

  console.log(
    "%cPayFlow initialized successfully 🚀",
    "color:#635bff;font-size:16px;font-weight:bold;",
  );
}

initializeApp();
