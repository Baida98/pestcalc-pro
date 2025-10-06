// == Gestione Prodotti Personalizzati ==
let customProducts = [];
try {
  const saved = localStorage.getItem('pestcalc_custom_products');
  customProducts = Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : [];
} catch { customProducts = []; }

function saveCustomProducts() {
  localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
  displayCustomProducts();
}

function addCustomProduct() {
  const name = document.getElementById('new-product-name').value.trim();
  const type = document.getElementById('new-product-type').value;
  const formulation = document.getElementById('new-product-formulation').value;
  const concentration = parseFloat(document.getElementById('new-product-concentration').value);
  const dilution = parseFloat(document.getElementById('new-product-dilution').value);
  const price = parseFloat(document.getElementById('new-product-price').value);
  const saturationDose = parseFloat(document.getElementById('new-product-saturation-dose').value);
  const fumigantDose = parseFloat(document.getElementById('new-product-fumigant-dose').value);

  // Validazione campi obbligatori
  if(!name || isNaN(concentration) || isNaN(dilution) || isNaN(price)) {
    alert('Compila almeno nome, concentrazione, diluizione e prezzo!');
    return;
  }
  if(customProducts.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    alert('Questo prodotto esiste già!');
    return;
  }

  customProducts.push({ name, type, formulation, concentration, dilution, price, saturationDose, fumigantDose });
  saveCustomProducts();

  // Feedback e reset campi
  alert('Prodotto aggiunto con successo!');
  document.getElementById('new-product-name').value = '';
  document.getElementById('new-product-concentration').value = '';
  document.getElementById('new-product-dilution').value = '';
  document.getElementById('new-product-price').value = '';
  document.getElementById('new-product-saturation-dose').value = '';
  document.getElementById('new-product-fumigant-dose').value = '';
}

function displayCustomProducts() {
  const list = document.getElementById('custom-products-list');
  if (!list) return;
  list.innerHTML = '';
  if (customProducts.length === 0) {
    list.innerHTML = '<p>Nessun prodotto salvato.</p>';
    return;
  }
  customProducts.forEach((prod, idx) => {
    const el = document.createElement('div');
    el.className = 'product-item';
    el.innerHTML = `
      <strong>${prod.name}</strong> 
      <small>${prod.type}, ${prod.formulation} - Conc: ${prod.concentration}%</small>
      <button onclick="removeCustomProduct(${idx})" title="Rimuovi prodotto"><i class="fas fa-trash"></i></button>
    `;
    list.appendChild(el);
  });
}

function removeCustomProduct(idx) {
  if(confirm('Sicuro di voler eliminare questo prodotto?')) {
    customProducts.splice(idx, 1);
    saveCustomProducts();
  }
}

// == Inizializzazione e Menu ==
window.addEventListener('DOMContentLoaded', () => {
  displayCustomProducts();
  // ... setup menu e altre sezioni come già presente (showMainMenu, showCalculator ecc)
  // ... popola menu principale dinamicamente qui
  document.getElementById('main-menu').innerHTML = `
    <button class="menu-btn" onclick="showCalculator('dilution')"><i class="fas fa-tint"></i> Calcolo Diluizione</button>
    <button class="menu-btn" onclick="showCalculator('saturation')"><i class="fas fa-home"></i> Saturazione Ambientale</button>
    <button class="menu-btn" onclick="showCalculator('fumigation')"><i class="fas fa-cloud"></i> Fumigazione</button>
    <button class="menu-btn" onclick="showProducts()"><i class="fas fa-flask"></i> Gestione Prodotti</button>
    <button class="menu-btn" onclick="showHistory()"><i class="fas fa-history"></i> Storico Calcoli</button>
    <button class="menu-btn" onclick="showCalculator('cost')"><i class="fas fa-calculator"></i> Calcolo Costi</button>
  `;
});
// ... Il resto delle funzioni di calcolo, storico ecc. come già esistenti, ma assicurati di chiamare sempre displayCustomProducts() quando serve aggiornare la lista.
