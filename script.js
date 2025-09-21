// -- Utility base per XSS --
function sanitizeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"'`]/g, (m) =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[m])
    );
}

// -- Dati locali --
let customProducts = [];
try {
    customProducts = JSON.parse(localStorage.getItem('pestcalc_custom_products')) || [];
    if (!Array.isArray(customProducts)) customProducts = [];
} catch { customProducts = []; }
let calculationHistory = JSON.parse(localStorage.getItem('pestcalc_history')) || [];
let lastCalculatedQuantity = 0;

// -- Navigazione semplificata --
function showSection(id) {
    document.querySelectorAll('.calculator-section, .main-menu').forEach(s => s.style.display = 'none');
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
    document.querySelector('.app-header').style.display = id === 'main-menu' ? 'block' : 'none';
}

// -- Select prodotti, automatico e universale --
function updateProductSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    let html = `<option value="">Manuale/Personalizzato</option>`;
    customProducts.forEach(p => html += `<option value="${p.id}">${sanitizeHtml(p.name)}</option>`);
    select.innerHTML = html;
}

// -- DILUIZIONE --
function calculateDilution() {
    const productId = document.getElementById('product-select').value;
    const percentage = parseFloat(document.getElementById('dilution-percentage').value);
    const volume = parseFloat(document.getElementById('solution-volume').value);
    const unit = document.getElementById('volume-unit').value;
    const btn = document.getElementById('dilution-calc-btn');

    if (!Number.isFinite(percentage) || percentage <= 0) return showToast('Inserisci una percentuale valida','error');
    if (!Number.isFinite(volume) || volume <= 0) return showToast('Inserisci un volume valido','error');

    let product = null, productName = 'Prodotto personalizzato', recDil = 10;
    if (productId) {
        product = customProducts.find(p => String(p.id) === String(productId));
        if (product) { productName = product.name; recDil = product.recommendedDilution || 10;}
    }
    const volumeL = unit === 'L' ? volume : volume / 1000;
    const concentrate = (percentage / 100) * volumeL * 1000;
    lastCalculatedQuantity = concentrate;

    document.getElementById('dilution-result').innerHTML = `
      <h3>Risultato Diluizione</h3>
      <div>Aggiungi <b>${concentrate.toFixed(1)} ml</b> di ${sanitizeHtml(productName)} a <b>${volume} ${unit}</b> di acqua</div>
      ${percentage > recDil ? '<div class="warning">Concentrazione superiore a quella raccomandata</div>' : ''}
    `;
    showToast('✅ Calcolo effettuato!','success');
    saveCalculation('Diluizione', {
        prodotto: productName,
        percentuale: percentage + '%',
        volume: volume + ' ' + unit,
        concentrato: concentrate.toFixed(1) + ' ml'
    });
}

// -- SATURAZIONE --
function calculateSaturation() {
    const area = parseFloat(document.getElementById('room-area').value);
    const height = parseFloat(document.getElementById('room-height').value);
    const productId = document.getElementById('saturation-product').value;
    const dosage = parseFloat(document.getElementById('manual-saturation-dose').value);
    const btn = document.getElementById('saturation-calc-btn');

    if (!Number.isFinite(area) || area <= 0 || !Number.isFinite(height) || height <= 0)
        return showToast('Inserisci superficie e altezza valide','error');
    let productName = 'Prodotto personalizzato', satDose = Number.isFinite(dosage) && dosage > 0 ? dosage : 15;
    if (productId) {
        const prod = customProducts.find(p => String(p.id) === String(productId));
        if (prod) { productName = prod.name; if (Number.isFinite(prod.saturationDose)) satDose = prod.saturationDose; }
    }
    if (!Number.isFinite(satDose) || satDose <= 0) return showToast('Inserisci dosaggio valido (ml/m³)','error');
    const volume = area * height;
    const minProduct = (volume * satDose).toFixed(1);

    document.getElementById('saturation-result').innerHTML = `
      <h3>Risultato Saturazione</h3>
      Volume: <b>${volume.toFixed(1)} m³</b><br>
      Quantità: <b>${minProduct} ml</b> di ${sanitizeHtml(productName)}<br>
      Dosaggio: <b>${satDose} ml/m³</b>
    `;
    showToast('✅ Calcolo effettuato!','success');
    saveCalculation('Saturazione', {
        ambiente: `${area} m² x ${height} m`,
        volume: `${volume.toFixed(1)} m³`,
        prodotto: productName,
        dosaggio: `${satDose} ml/m³`,
        quantità: `${minProduct} ml`
    });
}

// -- FUMIGAZIONE --
function calculateFumigation() {
    const type = document.getElementById('fumigation-type').value;
    let volume = 0;
    if (type === 'volume') {
        const area = parseFloat(document.getElementById('fum-area').value);
        const height = parseFloat(document.getElementById('fum-height').value);
        if (!Number.isFinite(area) || area <= 0 || !Number.isFinite(height) || height <= 0) return showToast('Superficie/altezza non valida','error');
        volume = area * height;
    } else {
        const weight = parseFloat(document.getElementById('product-weight').value);
        if (!Number.isFinite(weight) || weight <= 0) return showToast('Peso non valido','error');
        volume = weight * 1.5;
    }
    const productId = document.getElementById('fumigant').value;
    const dosage = parseFloat(document.getElementById('manual-fumigant-dose').value);
    const exposureTime = parseInt(document.getElementById('exposure-time').value) || 48;
    let productName = 'Prodotto personalizzato', fumDose = Number.isFinite(dosage) && dosage > 0 ? dosage : 2;
    if (productId) {
        const prod = customProducts.find(p => String(p.id) === String(productId));
        if (prod) { productName = prod.name; if (Number.isFinite(prod.fumigantDose)) fumDose = prod.fumigantDose; }
    }
    if (!Number.isFinite(fumDose) || fumDose <= 0) return showToast('Inserisci dosaggio valido (g/m³)','error');
    const total = (volume * fumDose).toFixed(1);

    document.getElementById('fumigation-result').innerHTML = `
      <h3>Risultato Fumigazione</h3>
      Volume: <b>${volume.toFixed(1)} m³</b><br>
      Quantità: <b>${total} g</b> di ${sanitizeHtml(productName)}<br>
      Dosaggio: <b>${fumDose} g/m³</b>, Esposizione: <b>${exposureTime} h</b>
    `;
    showToast('✅ Calcolo effettuato!','success');
    saveCalculation('Fumigazione', {
        volume: `${volume.toFixed(1)} m³`,
        fumigante: productName,
        dosaggio: `${fumDose} g/m³`,
        quantità: `${total} g`,
        esposizione: `${exposureTime} h`
    });
}

// -- GESTIONE PRODOTTI --
function addCustomProduct() {
    const name = document.getElementById('new-product-name').value.trim();
    if (!name) return showToast('Nome obbligatorio','error');
    const id = Date.now();
    const product = {
        id, name: sanitizeHtml(name),
        recommendedDilution: parseFloat(document.getElementById('new-product-dilution').value) || null,
        saturationDose: parseFloat(document.getElementById('new-product-saturation-dose').value) || null,
        fumigantDose: parseFloat(document.getElementById('new-product-fumigant-dose').value) || null,
        price: parseFloat(document.getElementById('new-product-price').value) || 0
    };
    customProducts.push(product);
    localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
    document.getElementById('new-product-name').value = '';
    document.getElementById('new-product-dilution').value = '';
    document.getElementById('new-product-saturation-dose').value = '';
    document.getElementById('new-product-fumigant-dose').value = '';
    document.getElementById('new-product-price').value = '';
    updateAllProductSelects();
    displayCustomProducts();
    showToast('Prodotto aggiunto','success');
}
function displayCustomProducts() {
    const c = document.getElementById('custom-products-list');
    if (!customProducts.length) return c.innerHTML = '<i>Nessun prodotto</i>';
    c.innerHTML = customProducts.map((p,i) => `
      <div>${sanitizeHtml(p.name)} 
        <button onclick="deleteCustomProduct(${i})">🗑️</button>
      </div>
    `).join('');
}
function deleteCustomProduct(idx){
    if (!confirm('Eliminare prodotto?')) return;
    customProducts.splice(idx,1);
    localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
    updateAllProductSelects(); displayCustomProducts();
}

// -- STORICO --
function saveCalculation(type, data) {
    calculationHistory.unshift({
        id: Date.now(),
        type, data,
        timestamp: new Date().toLocaleString('it-IT')
    });
    if (calculationHistory.length > 100) calculationHistory = calculationHistory.slice(0,100);
    localStorage.setItem('pestcalc_history', JSON.stringify(calculationHistory));
}
function displayHistory() {
    const h = document.getElementById('history-list');
    if (!calculationHistory.length) return h.innerHTML = '<i>Nessun calcolo salvato</i>';
    h.innerHTML = calculationHistory.map(calc => `
      <div>
        <b>${sanitizeHtml(calc.type)}</b> — ${sanitizeHtml(calc.timestamp)}<br>
        ${Object.entries(calc.data).map(([k,v])=>`${sanitizeHtml(k)}: ${sanitizeHtml(v)}`).join('<br>')}
      </div>
    `).join('<hr>');
}
function clearHistory() {
    if (!confirm('Svuotare lo storico?')) return;
    calculationHistory = [];
    localStorage.removeItem('pestcalc_history');
    displayHistory();
    showToast('Storico svuotato','success');
}

// -- UI, Notifiche, inizializzazione --
function showToast(msg, type='info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.setAttribute('role','alert');
    t.textContent = msg;
    Object.assign(t.style, {position:'fixed',top:'20px',right:'20px',background:'#333',color:'#fff',padding:'10px',borderRadius:'8px',zIndex:10000});
    document.body.appendChild(t); setTimeout(()=>{t.remove();},2200);
}

function updateAllProductSelects() {
    updateProductSelect('product-select');
    updateProductSelect('saturation-product');
    updateProductSelect('fumigant');
    updateProductSelect('cost-product');
}

document.addEventListener('DOMContentLoaded', function() {
    showSection('main-menu');
    updateAllProductSelects();
    displayCustomProducts();
    displayHistory();

    document.getElementById('room-area')?.addEventListener('input', e=>{
        const area = parseFloat(e.target.value), height = parseFloat(document.getElementById('room-height').value);
        document.getElementById('saturation-volume-display').textContent = (area>0&&height>0)?(area*height).toFixed(1)+' m³':'0 m³';
    });
    document.getElementById('room-height')?.addEventListener('input', e=>{
        const area = parseFloat(document.getElementById('room-area').value), height = parseFloat(e.target.value);
        document.getElementById('saturation-volume-display').textContent = (area>0&&height>0)?(area*height).toFixed(1)+' m³':'0 m³';
    });
    document.getElementById('fum-area')?.addEventListener('input',()=>{ /* volume live update */ });
    document.getElementById('fum-height')?.addEventListener('input',()=>{ /* volume live update */ });
    document.getElementById('product-weight')?.addEventListener('input',()=>{ /* volume live update */ });
});
