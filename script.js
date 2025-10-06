// == GESTIONE PRODOTTI ==
let customProducts = [];
try {
  const saved = localStorage.getItem('pestcalc_custom_products');
  customProducts = Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : [];
} catch { customProducts = []; }

function saveCustomProducts() {
  localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
  displayCustomProducts();
  updateAllProductSelects();
}

function addCustomProduct() {
  const name = document.getElementById('new-product-name').value.trim();
  const type = document.getElementById('new-product-type').value;
  const concentration = parseFloat(document.getElementById('new-product-concentration').value);
  const dilution = parseFloat(document.getElementById('new-product-dilution').value);
  const price = parseFloat(document.getElementById('new-product-price').value);

  if(!name || isNaN(concentration) || isNaN(dilution) || isNaN(price)) {
    alert('Compila tutti i campi obbligatori!');
    return;
  }
  if(customProducts.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    alert('Questo prodotto esiste già!');
    return;
  }

  customProducts.push({ name, type, concentration, dilution, price });
  saveCustomProducts();

  alert('Prodotto aggiunto!');
  document.getElementById('new-product-name').value = '';
  document.getElementById('new-product-concentration').value = '';
  document.getElementById('new-product-dilution').value = '';
  document.getElementById('new-product-price').value = '';
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
      <small>${prod.type} - Conc: ${prod.concentration}% - Dil: ${prod.dilution}% - €${prod.price}/L</small>
      <button onclick="removeCustomProduct(${idx})" title="Rimuovi prodotto"><i class="fas fa-trash"></i></button>
    `;
    list.appendChild(el);
  });
}

function removeCustomProduct(idx) {
  if(confirm('Sicuro di voler eliminare questo prodotto?')) {
    customProducts.splice(idx, 1);
    saveCustomProducts();
    updateAllProductSelects();
  }
}

// == STORICO ==
let calculationHistory = [];
try {
  calculationHistory = JSON.parse(localStorage.getItem('pestcalc_history')) || [];
} catch { calculationHistory = []; }

function saveHistory() {
  localStorage.setItem('pestcalc_history', JSON.stringify(calculationHistory));
}

function addHistory(entry) {
  calculationHistory.unshift(entry);
  if (calculationHistory.length > 50) calculationHistory = calculationHistory.slice(0, 50);
  saveHistory();
  displayHistory();
}

function displayHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  list.innerHTML = '';
  if (calculationHistory.length === 0) {
    list.innerHTML = '<p class="no-history">Nessun calcolo salvato</p>';
    return;
  }
  calculationHistory.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `<strong>${item.type}</strong> | <span>${item.details}</span> <span class="history-date">${item.date}</span>`;
    list.appendChild(el);
  });
}

// == AGGIORNA SELECTS ==
function updateAllProductSelects() {
  updateDilutionProductSelect();
  updateSaturationProductSelect();
  updateFumigationProductSelect();
  updateCostProductSelect();
}

function updateDilutionProductSelect() {
  const select = document.getElementById('dilution-product');
  if (!select) return;
  select.innerHTML = '<option value="">Seleziona prodotto...</option>';
  customProducts.forEach((prod, idx) => {
    select.innerHTML += `<option value="${idx}">${prod.name}</option>`;
  });
}
function updateSaturationProductSelect() {
  const select = document.getElementById('saturation-product');
  if (!select) return;
  select.innerHTML = '<option value="">Seleziona prodotto...</option>';
  customProducts.forEach((prod, idx) => {
    select.innerHTML += `<option value="${idx}">${prod.name}</option>`;
  });
}
function updateFumigationProductSelect() {
  const select = document.getElementById('fumigant-product');
  if (!select) return;
  select.innerHTML = '<option value="">Seleziona prodotto...</option>';
  customProducts.forEach((prod, idx) => {
    select.innerHTML += `<option value="${idx}">${prod.name}</option>`;
  });
}
function updateCostProductSelect() {
  const select = document.getElementById('cost-product');
  if (!select) return;
  select.innerHTML = '<option value="">Seleziona prodotto...</option>';
  customProducts.forEach((prod, idx) => {
    select.innerHTML += `<option value="${idx}">${prod.name}</option>`;
  });
}

// == CALCOLI ==
function calculateDilution() {
  const prodIdx = document.getElementById('dilution-product').value;
  const dilutionPerc = parseFloat(document.getElementById('dilution-percentage').value);
  const solutionVol = parseFloat(document.getElementById('solution-volume').value);
  const unit = document.getElementById('volume-unit').value;
  if (prodIdx === '' || isNaN(dilutionPerc) || isNaN(solutionVol) || solutionVol <= 0) {
    document.getElementById('dilution-result').innerHTML = '<span style="color:red">Compila tutti i campi!</span>';
    return;
  }
  const prod = customProducts[prodIdx];
  let volumeL = unit === 'L' ? solutionVol : solutionVol / 1000;
  let result = dilutionPerc * volumeL * 10;
  const resultTxt = `Servono <b>${result.toFixed(2)} ml</b> di <b>${prod.name}</b> per ${solutionVol} ${unit} di soluzione al ${dilutionPerc}%`;
  document.getElementById('dilution-result').innerHTML = resultTxt;
  addHistory({ type: 'Diluizione', details: resultTxt, date: new Date().toLocaleString() });
}

function calculateSaturation() {
  const prodIdx = document.getElementById('saturation-product').value;
  const area = parseFloat(document.getElementById('room-area').value);
  const height = parseFloat(document.getElementById('room-height').value);
  const dose = parseFloat(document.getElementById('saturation-dose').value);
  if (prodIdx === '' || isNaN(area) || isNaN(height) || isNaN(dose)) {
    document.getElementById('saturation-result').innerHTML = '<span style="color:red">Compila tutti i campi!</span>';
    return;
  }
  const volume = area * height;
  const ml = volume * dose;
  const prod = customProducts[prodIdx];
  const resultTxt = `Servono <b>${ml.toFixed(1)} ml</b> di <b>${prod.name}</b> (${dose} ml/m³) per saturare un ambiente di ${area} m² x ${height} m = ${volume.toFixed(1)} m³`;
  document.getElementById('saturation-result').innerHTML = resultTxt;
  addHistory({ type: 'Saturazione', details: resultTxt, date: new Date().toLocaleString() });
}

function calculateFumigation() {
  const prodIdx = document.getElementById('fumigant-product').value;
  const volume = parseFloat(document.getElementById('fumigation-volume').value);
  const dose = parseFloat(document.getElementById('fumigation-dose').value);
  if (prodIdx === '' || isNaN(volume) || isNaN(dose)) {
    document.getElementById('fumigation-result').innerHTML = '<span style="color:red">Compila tutti i campi!</span>';
    return;
  }
  const grams = volume * dose;
  const prod = customProducts[prodIdx];
  const resultTxt = `Servono <b>${grams.toFixed(1)} g</b> di <b>${prod.name}</b> (${dose} g/m³) per ${volume} m³`;
  document.getElementById('fumigation-result').innerHTML = resultTxt;
  addHistory({ type: 'Fumigazione', details: resultTxt, date: new Date().toLocaleString() });
}

function calculateCost() {
  const prodIdx = document.getElementById('cost-product').value;
  const qty = parseFloat(document.getElementById('cost-quantity').value);
  const price = customProducts[prodIdx] ? customProducts[prodIdx].price : 0;
  const labor = parseFloat(document.getElementById('cost-labor').value);
  const time = parseFloat(document.getElementById('cost-time').value);
  if (prodIdx === '' || isNaN(qty) || isNaN(labor) || isNaN(time)) {
    document.getElementById('cost-result').innerHTML = '<span style="color:red">Compila tutti i campi!</span>';
    return;
  }
  const prodCost = (qty / 1000) * price;
  const total = prodCost + (labor * time);
  const resultTxt = `Costo materiale: <b>€${prodCost.toFixed(2)}</b> + manodopera: <b>€${(labor * time).toFixed(2)}</b> = <b>€${total.toFixed(2)}</b>`;
  document.getElementById('cost-result').innerHTML = resultTxt;
  addHistory({ type: 'Costo', details: resultTxt, date: new Date().toLocaleString() });
}

// == NAVIGAZIONE E RENDER SEZIONI ==
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('main-menu').innerHTML = `
    <button class="menu-btn" onclick="showCalculator('dilution')"><i class="fas fa-tint"></i> Calcolo Diluizione</button>
    <button class="menu-btn" onclick="showCalculator('saturation')"><i class="fas fa-home"></i> Saturazione Ambientale</button>
    <button class="menu-btn" onclick="showCalculator('fumigation')"><i class="fas fa-cloud"></i> Fumigazione</button>
    <button class="menu-btn" onclick="showProducts()"><i class="fas fa-flask"></i> Gestione Prodotti</button>
    <button class="menu-btn" onclick="showCalculator('cost')"><i class="fas fa-calculator"></i> Calcolo Costi</button>
    <button class="menu-btn" onclick="showHistory()"><i class="fas fa-history"></i> Storico Calcoli</button>
  `;

  // Diluizione
  document.getElementById('dilution-calc').innerHTML = `
    <div class="calc-header"><button class="back-btn" onclick="showMainMenu()"><i class="fas fa-arrow-left"></i> Indietro</button>
      <h2><i class="fas fa-tint"></i> Calcolo Diluizione</h2></div>
    <div class="compact-form">
      <div class="form-group">
        <label><i class="fas fa-flask"></i> Prodotto:</label>
        <select id="dilution-product"></select>
      </div>
      <div class="form-group">
        <label><i class="fas fa-percentage"></i> Diluizione (%):</label>
        <input type="number" id="dilution-percentage" step="0.01" min="0" max="100" placeholder="es. 0.75">
      </div>
      <div class="form-group">
        <label><i class="fas fa-fill-drip"></i> Volume soluzione:</label>
        <input type="number" id="solution-volume" step="0.1" min="0" placeholder="es. 5">
      </div>
      <div class="form-group">
        <label><i class="fas fa-ruler"></i> Unità:</label>
        <select id="volume-unit"><option value="L">Litri</option><option value="ml">Millilitri</option></select>
      </div>
      <button class="calculate-btn" onclick="calculateDilution()"><i class="fas fa-calculator"></i> Calcola Diluizione</button>
    </div>
    <div class="result" id="dilution-result"></div>
  `;

  // Saturazione
  document.getElementById('saturation-calc').innerHTML = `
    <div class="calc-header"><button class="back-btn" onclick="showMainMenu()"><i class="fas fa-arrow-left"></i> Indietro</button>
      <h2><i class="fas fa-home"></i> Saturazione Ambientale</h2></div>
    <div class="compact-form">
      <div class="form-group">
        <label><i class="fas fa-flask"></i> Prodotto:</label>
        <select id="saturation-product"></select>
      </div>
      <div class="form-group">
        <label><i class="fas fa-border-style"></i> Superficie (m²):</label>
        <input type="number" id="room-area" step="0.1" min="0" placeholder="es. 50">
      </div>
      <div class="form-group">
        <label><i class="fas fa-arrows-alt-v"></i> Altezza (m):</label>
        <input type="number" id="room-height" step="0.1" min="0" placeholder="es. 3">
      </div>
      <div class="form-group">
        <label><i class="fas fa-spray-can"></i> Dose (ml/m³):</label>
        <input type="number" id="saturation-dose" step="0.1" min="0" placeholder="es. 15">
      </div>
      <button class="calculate-btn" onclick="calculateSaturation()"><i class="fas fa-calculator"></i> Calcola Saturazione</button>
    </div>
    <div class="result" id="saturation-result"></div>
  `;

  // Fumigazione
  document.getElementById('fumigation-calc').innerHTML = `
    <div class="calc-header"><button class="back-btn" onclick="showMainMenu()"><i class="fas fa-arrow-left"></i> Indietro</button>
      <h2><i class="fas fa-cloud"></i> Fumigazione</h2></div>
    <div class="compact-form">
      <div class="form-group">
        <label><i class="fas fa-flask"></i> Fumigante:</label>
        <select id="fumigant-product"></select>
      </div>
      <div class="form-group">
        <label><i class="fas fa-cube"></i> Volume (m³):</label>
        <input type="number" id="fumigation-volume" step="0.1" min="0" placeholder="es. 100">
      </div>
      <div class="form-group">
        <label><i class="fas fa-cloud"></i> Dose (g/m³):</label>
        <input type="number" id="fumigation-dose" step="0.1" min="0" placeholder="es. 2">
      </div>
      <button class="calculate-btn" onclick="calculateFumigation()"><i class="fas fa-calculator"></i> Calcola Fumigazione</button>
    </div>
    <div class="result" id="fumigation-result"></div>
  `;

  // Gestione Prodotti
  document.getElementById('products-section').innerHTML = `
    <div class="calc-header"><button class="back-btn" onclick="showMainMenu()"><i class="fas fa-arrow-left"></i> Indietro</button>
      <h2><i class="fas fa-flask"></i> Gestione Prodotti</h2></div>
    <div class="product-form">
      <h3><i class="fas fa-plus-circle"></i> Aggiungi Nuovo Prodotto</h3>
      <input type="text" id="new-product-name" placeholder="Nome prodotto (es. Lambda-cialotrina 10%)">
      <select id="new-product-type">
        <option value="Insetticida">Insetticida</option>
        <option value="Rodenticida">Rodenticida</option>
        <option value="Fumigante">Fumigante</option>
        <option value="Disinfettante">Disinfettante</option>
        <option value="Altro">Altro</option>
      </select>
      <input type="number" id="new-product-concentration" step="0.1" min="0" max="100" placeholder="Concentrazione (%)">
      <input type="number" id="new-product-dilution" step="0.01" min="0" max="10" placeholder="Diluizione standard (%)">
      <input type="number" id="new-product-price" step="0.01" min="0" placeholder="Prezzo per litro/kg (€)">
      <button class="calculate-btn" onclick="addCustomProduct()"><i class="fas fa-plus"></i> Aggiungi Prodotto</button>
    </div>
    <div class="products-list">
      <h3><i class="fas fa-list"></i> Prodotti Salvati</h3>
      <div id="custom-products-list"></div>
    </div>
  `;

  // Calcolo Costi
  document.getElementById('cost-calc').innerHTML = `
    <div class="calc-header"><button class="back-btn" onclick="showMainMenu()"><i class="fas fa-arrow-left"></i> Indietro</button>
      <h2><i class="fas fa-calculator"></i> Calcolo Costi</h2></div>
    <div class="form-group">
      <label><i class="fas fa-flask"></i> Prodotto:</label>
      <select id="cost-product"></select>
    </div>
    <div class="form-group">
      <label><i class="fas fa-fill-drip"></i> Quantità prodotto (ml):</label>
      <input type="number" id="cost-quantity" step="0.1" min="0" placeholder="Inserito manualmente">
    </div>
    <div class="form-group">
      <label><i class="fas fa-user-clock"></i> Costo manodopera (€/ora):</label>
      <input type="number" id="cost-labor" step="0.01" min="0" value="35" placeholder="35">
    </div>
    <div class="form-group">
      <label><i class="fas fa-clock"></i> Tempo trattamento (ore):</label>
      <input type="number" id="cost-time" step="0.1" min="0" value="2" placeholder="2">
    </div>
    <button class="calculate-btn" onclick="calculateCost()"><i class="fas fa-calculator"></i> Calcola Costo</button>
    <div class="result" id="cost-result"></div>
  `;

  // Storico
  document.getElementById('history-section').innerHTML = `
    <div class="calc-header"><button class="back-btn" onclick="showMainMenu()"><i class="fas fa-arrow-left"></i> Indietro</button>
      <h2><i class="fas fa-history"></i> Storico Calcoli</h2></div>
    <div class="history-list" id="history-list"></div>
  `;

  displayCustomProducts();
  updateAllProductSelects();
  displayHistory();
});

// == NAVIGAZIONE ==
function showMainMenu() {
  hideAllSections();
  document.getElementById('main-menu').style.display = 'flex';
}
function showCalculator(type) {
  hideAllSections();
  document.getElementById(`${type}-calc`).style.display = 'block';
  updateAllProductSelects();
}
function showProducts() {
  hideAllSections();
  document.getElementById('products-section').style.display = 'block';
  displayCustomProducts();
  updateAllProductSelects();
}
function showHistory() {
  hideAllSections();
  document.getElementById('history-section').style.display = 'block';
  displayHistory();
}
function hideAllSections() {
  document.querySelectorAll('.calculator-section, .main-menu').forEach(s => s.style.display = 'none');
}
