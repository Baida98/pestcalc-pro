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
  // Menu principale dinamico
  document.getElementById('main-menu').innerHTML = `
    <button class="menu-btn" onclick="showCalculator('dilution')"><i class="fas fa-tint"></i> Calcolo Diluizione</button>
    <button class="menu-btn" onclick="showCalculator('saturation')"><i class="fas fa-home"></i> Saturazione Ambientale</button>
    <button class="menu-btn" onclick="showCalculator('fumigation')"><i class="fas fa-cloud"></i> Fumigazione</button>
    <button class="menu-btn" onclick="showProducts()"><i class="fas fa-flask"></i> Gestione Prodotti</button>
    <button class="menu-btn" onclick="showHistory()"><i class="fas fa-history"></i> Storico Calcoli</button>
    <button class="menu-btn" onclick="showCalculator('cost')"><i class="fas fa-calculator"></i> Calcolo Costi</button>
  `;

  // Sezione Gestione Prodotti
  document.getElementById('products-section').innerHTML = `
    <div class="calc-header">
      <button class="back-btn" onclick="showMainMenu()"><i class="fas fa-arrow-left"></i> Indietro</button>
      <h2><i class="fas fa-flask"></i> Gestione Prodotti</h2>
    </div>
    <div class="product-form">
      <h3><i class="fas fa-plus-circle"></i> Aggiungi Nuovo Prodotto</h3>
      <input type="text" id="new-product-name" placeholder="Nome prodotto (es. Lambda-cialotrina 10%)">
      <select id="new-product-type">
        <option value="insetticida">Insetticida</option>
        <option value="rodenticida">Rodenticida</option>
        <option value="fumigante">Fumigante</option>
        <option value="disinfettante">Disinfettante</option>
        <option value="altro">Altro</option>
      </select>
      <select id="new-product-formulation">
        <option value="liquido">Liquido</option>
        <option value="polvere">Polvere</option>
        <option value="granulare">Granulare</option>
        <option value="aerosol">Aerosol</option>
        <option value="gel">Gel</option>
      </select>
      <input type="number" id="new-product-concentration" step="0.1" min="0" max="100" placeholder="Concentrazione (%)">
      <input type="number" id="new-product-dilution" step="0.01" min="0" max="10" placeholder="Diluizione standard (%)">
      <input type="number" id="new-product-price" step="0.01" min="0" placeholder="Prezzo per litro/kg (€)">
      <input type="number" id="new-product-saturation-dose" step="0.1" min="0" placeholder="Dosaggio saturazione (ml/m³)">
      <input type="number" id="new-product-fumigant-dose" step="0.1" min="0" placeholder="Dosaggio fumigazione (g/m³)">
      <button class="calculate-btn" onclick="addCustomProduct()"><i class="fas fa-plus"></i> Aggiungi Prodotto</button>
    </div>
    <div class="products-list">
      <h3><i class="fas fa-list"></i> Prodotti Salvati</h3>
      <div id="custom-products-list"></div>
    </div>
  `;
  displayCustomProducts();
});

// == Navigazione Base ==
function showMainMenu() {
  hideAllSections();
  document.getElementById('main-menu').style.display = 'flex';
}
function showCalculator(type) {
  hideAllSections();
  document.getElementById(`${type}-calc`).style.display = 'block';
}
function showProducts() {
  hideAllSections();
  document.getElementById('products-section').style.display = 'block';
  displayCustomProducts();
}
function showHistory() {
  hideAllSections();
  document.getElementById('history-section').style.display = 'block';
}
function hideAllSections() {
  document.querySelectorAll('.calculator-section, .main-menu').forEach(s => s.style.display = 'none');
}

// (Qui puoi integrare le tue funzioni di calcolo, storico, PDF, ecc.)
