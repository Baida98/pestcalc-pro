// Database prodotti personalizzati come array
let customProducts;
try {
  customProducts = JSON.parse(localStorage.getItem('pestcalc_custom_products')) || [];
  if (!Array.isArray(customProducts)) customProducts = [];
} catch (e) {
  customProducts = [];
}
let calculationHistory = JSON.parse(localStorage.getItem('pestcalc_history')) || [];
let previousSection = null;

let fumigationTimer = null;
let timerStartTime = null;
let timerDuration = 0;
let lastCalculatedQuantity = 0;

// NAVIGAZIONE E SEZIONI
function showMainMenu() {
    hideAllSections();
    document.getElementById('main-menu').style.display = 'block';
    document.querySelector('.app-header').style.display = 'block';
    previousSection = null;
}

function showCalculator(type) {
    hideAllSections();
    document.getElementById(type + '-calc').style.display = 'block';
    document.querySelector('.app-header').style.display = 'none';
    if (type === 'dilution') updateProductSelects();
    if (type === 'saturation') updateSaturationProductSelect();
    if (type === 'fumigation') updateFumigantSelect();
    if (type === 'cost') updateCostProductSelect();
    previousSection = type + '-calc';
}

function showProducts(returnToPrevious) {
    hideAllSections();
    document.getElementById('products-section').style.display = 'block';
    document.querySelector('.app-header').style.display = 'none';
    displayCustomProducts();
    previousSection = returnToPrevious || null;
}

function returnToPreviousSection() {
    hideAllSections();
    if (previousSection) {
        document.getElementById(previousSection).style.display = 'block';
        document.querySelector('.app-header').style.display = 'none';
        updateProductSelects();
        updateSaturationProductSelect();
        updateFumigantSelect();
        updateCostProductSelect();
    } else {
        showMainMenu();
    }
}

function showHistory() {
    hideAllSections();
    document.getElementById('history-section').style.display = 'block';
    document.querySelector('.app-header').style.display = 'none';
    displayHistory();
}

function hideAllSections() {
    const sections = document.querySelectorAll('.calculator-section, .main-menu');
    sections.forEach(section => section.style.display = 'none');
}

// SELECTS: aggiorna tutte le select con i prodotti personalizzati
function updateProductSelects() {
    const select = document.getElementById('product-select');
    if (!select) return;
    let html = '';
    customProducts.forEach((product, idx) => {
        html += `<option value="${idx}">${product.name}</option>`;
    });
    html += `<option value="custom">Personalizzato</option>`;
    select.innerHTML = html;
}
function updateSaturationProductSelect() {
    const select = document.getElementById('saturation-product');
    if (!select) return;
    let html = '';
    customProducts.forEach((product, idx) => {
        html += `<option value="${idx}">${product.name}</option>`;
    });
    html += `<option value="custom">Personalizzato</option>`;
    select.innerHTML = html;
}
function updateFumigantSelect() {
    const select = document.getElementById('fumigant');
    if (!select) return;
    let html = '';
    customProducts.forEach((product, idx) => {
        html += `<option value="${idx}">${product.name}</option>`;
    });
    html += `<option value="custom">Personalizzato</option>`;
    select.innerHTML = html;
}
function updateCostProductSelect() {
    const select = document.getElementById('cost-product');
    if (!select) return;
    let html = '';
    customProducts.forEach((product, idx) => {
        html += `<option value="${idx}">${product.name}</option>`;
    });
    html += `<option value="custom">Personalizzato</option>`;
    select.innerHTML = html;
}

// GESTIONE INPUT METRI QUADRI / DIMENSIONI
function toggleDimensionInputs(section) {
    if (section === 'saturation') {
        const area = document.getElementById('room-area').value;
        document.getElementById('saturation-dimensions').style.display = area ? 'none' : 'grid';
    }
    if (section === 'fumigation') {
        const area = document.getElementById('fum-area').value;
        document.getElementById('volume-inputs').style.display = area ? 'none' : 'grid';
    }
}
function clearAreaInput(section) {
    if (section === 'saturation') document.getElementById('room-area').value = '';
    if (section === 'fumigation') document.getElementById('fum-area').value = '';
    toggleDimensionInputs(section);
}

// GESTIONE PRODOTTI PERSONALIZZATI
function addCustomProduct() {
    const name = document.getElementById('new-product-name').value.trim();
    const concentration = parseFloat(document.getElementById('new-product-concentration').value);
    const dilution = parseFloat(document.getElementById('new-product-dilution').value);
    const price = parseFloat(document.getElementById('new-product-price').value);
    const saturationDose = parseFloat(document.getElementById('new-product-saturation-dose').value);
    const fumigantDose = parseFloat(document.getElementById('new-product-fumigant-dose').value);
    const addBtn = document.querySelector('.calculate-btn');

    if (!name || name.length < 3) return showError(addBtn, 'Il nome deve essere di almeno 3 caratteri');
    if (!concentration || concentration <= 0 || concentration > 100) return showError(addBtn, 'Concentrazione 0.1%-100%');
    if (!dilution || dilution <= 0 || dilution > 10) return showError(addBtn, 'Diluizione 0.01%-10%');
    // saturationDose e fumigantDose opzionali
    if (saturationDose && saturationDose <= 0) return showError(addBtn, 'Il dosaggio saturazione deve essere positivo');
    if (fumigantDose && fumigantDose <= 0) return showError(addBtn, 'Il dosaggio fumigazione deve essere positivo');

    customProducts.push({
        name,
        concentration,
        recommendedDilution: dilution,
        price: price || 0,
        saturationDose: saturationDose || null,
        fumigantDose: fumigantDose || null,
        custom: true
    });

    addBtn.classList.add('loading');
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aggiungendo...';
    setTimeout(() => {
        localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
        ['new-product-name', 'new-product-concentration', 'new-product-dilution', 'new-product-price', 'new-product-saturation-dose', 'new-product-fumigant-dose']
            .forEach(id => { const inp = document.getElementById(id); inp.value = ''; });
        displayCustomProducts();
        updateProductSelects();
        updateSaturationProductSelect();
        updateFumigantSelect();
        updateCostProductSelect();
        addBtn.classList.remove('loading');
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Aggiungi Prodotto';
        showSuccess(addBtn, '✅ Prodotto aggiunto!');
        setTimeout(returnToPreviousSection, 800);
    }, 600);
}

function displayCustomProducts() {
    const container = document.getElementById('custom-products-list');
    if (customProducts.length === 0) {
        container.innerHTML = '<p class="no-history">Nessun prodotto personalizzato salvato</p>';
        return;
    }
    let html = '';
    customProducts.forEach((product, idx) => {
        html += `
            <div class="product-item">
                <div class="product-info">
                    <h4><i class="fas fa-flask"></i> ${product.name}</h4>
                    <p>
                        <strong>Conc.:</strong> ${product.concentration}% |
                        <strong>Diluiz. raccom.:</strong> ${product.recommendedDilution}% 
                        ${product.price ? `| <strong>Prezzo:</strong> €${product.price.toFixed(2)}/L` : ''}
                        ${product.saturationDose ? `| <strong>Saturazione:</strong> ${product.saturationDose} ml/m³` : ''}
                        ${product.fumigantDose ? `| <strong>Fumigazione:</strong> ${product.fumigantDose} g/m³` : ''}
                    </p>
                </div>
                <button class="delete-product-btn" onclick="deleteCustomProduct(${idx})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function deleteCustomProduct(idx) {
    if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
        customProducts.splice(idx, 1);
        localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
        displayCustomProducts();
        updateProductSelects();
        updateSaturationProductSelect();
        updateFumigantSelect();
        updateCostProductSelect();
    }
}

// DILUIZIONE
function setPercentage(value) { document.getElementById('dilution-percentage').value = value; }
function setVolume(value) { document.getElementById('solution-volume').value = value; }

function calculateDilution() {
    const productIdx = document.getElementById('product-select').value;
    const percentage = parseFloat(document.getElementById('dilution-percentage').value);
    const volume = parseFloat(document.getElementById('solution-volume').value);
    const unit = document.getElementById('volume-unit').value;
    const calcBtn = document.querySelector('#dilution-calc .calculate-btn');

    if ((productIdx === "" && productIdx !== "custom") || !percentage || !volume)
        return showError(calcBtn, 'Seleziona prodotto e inserisci tutti i valori');
    if (percentage > 10)
        return showError(calcBtn, '⚠️ Percentuale molto alta! Verifica la diluizione.');

    calcBtn.classList.add('loading');
    calcBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcolando...';

    setTimeout(() => {
        const volumeInLiters = unit === 'L' ? volume : volume / 1000;
        const concentrateML = (percentage / 100) * volumeInLiters * 1000;
        lastCalculatedQuantity = concentrateML;
        const product = customProducts[productIdx];
        const productName = product ? product.name : 'Prodotto personalizzato';
        const result = document.getElementById('dilution-result');
        result.innerHTML = `
            <h3><i class="fas fa-check-circle"></i> Risultato Diluizione</h3>
            <div class="highlight">
                Aggiungi <strong>${concentrateML.toFixed(1)} ml</strong> di ${productName} 
                a <strong>${volume} ${unit}</strong> di acqua
            </div>
            <p><strong><i class="fas fa-percentage"></i> Concentrazione finale:</strong> ${percentage}%</p>
            <p><strong><i class="fas fa-fill-drip"></i> Volume totale soluzione:</strong> ${volume} ${unit}</p>
            ${product && percentage > product.recommendedDilution ? 
                '<div class="warning"><strong><i class="fas fa-exclamation-triangle"></i> Attenzione:</strong> Concentrazione superiore a quella raccomandata</div>' : ''}
            <div class="info">
                <strong><i class="fas fa-info-circle"></i> Istruzioni:</strong><br>
                1. Riempi il contenitore con l'acqua<br>
                2. Aggiungi lentamente il concentrato<br>
                3. Mescola accuratamente<br>
                4. Indossa sempre DPI adeguati
            </div>
        `;
        result.classList.add('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        calcBtn.classList.remove('loading');
        calcBtn.innerHTML = '<i class="fas fa-calculator"></i> Calcola Diluizione';
        showSuccess(calcBtn, '✅ Diluizione calcolata!');
        saveCalculation('Diluizione', {
            product: productName,
            percentage: percentage + '%',
            volume: volume + ' ' + unit,
            concentrate: concentrateML.toFixed(1) + ' ml'
        });
    }, 800);
}

// SATURAZIONE AMBIENTALE
function quickSaturation(length, width, height, product, area) {
    document.getElementById('room-area').value = area;
    document.getElementById('room-height').value = height;
    toggleDimensionInputs('saturation');
    document.getElementById('saturation-product').value = product;
    calculateSaturation();
}

function calculateSaturation() {
    const area = parseFloat(document.getElementById('room-area').value);
    const height = parseFloat(document.getElementById('room-height').value);
    const length = parseFloat(document.getElementById('room-length').value);
    const width = parseFloat(document.getElementById('room-width').value);
    const productIdx = document.getElementById('saturation-product').value;
    const calcBtn = document.querySelector('#saturation-calc .calculate-btn');

    let volume;
    if (area && height) {
        volume = area * height;
    } else if (length && width && height) {
        volume = length * width * height;
    } else {
        return showError(calcBtn, 'Inserisci tutte le dimensioni o la superficie');
    }

    const product = customProducts[productIdx];
    if (!product) return showError(calcBtn, 'Seleziona prodotto personalizzato');
    const dosage = product.saturationDose || 15;
    const minProduct = (volume * dosage).toFixed(0);

    lastCalculatedQuantity = volume * dosage;
    const result = document.getElementById('saturation-result');
    result.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Risultato Saturazione Ambientale</h3>
        <p><strong><i class="fas fa-cube"></i> Volume ambiente:</strong> ${volume.toFixed(1)} m³</p>
        <div class="highlight">
            Quantità prodotto necessaria: <strong>${minProduct} ml</strong> di ${product.name}
        </div>
        <p><strong><i class="fas fa-eyedropper"></i> Dosaggio:</strong> ${dosage} ml/m³</p>
        <div class="info">
            <strong><i class="fas fa-clipboard-list"></i> Procedura:</strong><br>
            1. Sigilla tutte le aperture<br>
            2. Rimuovi persone e animali<br>
            3. Applica il trattamento uniformemente<br>
            4. Ventila dopo 4-6 ore
        </div>
    `;
    result.classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('safety-checklist').style.display = 'block';
    saveCalculation('Saturazione Ambientale', {
        volume: volume.toFixed(1) + ' m³',
        product: product.name,
        quantity: `${minProduct} ml`
    });
}

// FUMIGAZIONE
function calculateFumigation() {
    const type = document.getElementById('fumigation-type').value;
    const area = parseFloat(document.getElementById('fum-area').value);
    const height = parseFloat(document.getElementById('fum-height').value);
    const length = parseFloat(document.getElementById('fum-length').value);
    const width = parseFloat(document.getElementById('fum-width').value);
    const weight = parseFloat(document.getElementById('product-weight').value);
    const fumigantIdx = document.getElementById('fumigant').value;
    const exposureTime = parseInt(document.getElementById('exposure-time').value);
    const calcBtn = document.querySelector('#fumigation-calc .calculate-btn');

    let volume;
    if (type === 'volume') {
        if (area && height) {
            volume = area * height;
        } else if (length && width && height) {
            volume = length * width * height;
        } else {
            return showError(calcBtn, 'Inserisci tutte le dimensioni o la superficie');
        }
    } else {
        if (!weight) return showError(calcBtn, 'Inserisci il peso della merce');
        volume = weight * 1.5;
    }

    const product = customProducts[fumigantIdx];
    if (!product) return showError(calcBtn, 'Seleziona prodotto personalizzato');
    const dosage = product.fumigantDose || 2;
    const totalProduct = (volume * dosage).toFixed(0);

    lastCalculatedQuantity = volume * dosage;
    if (exposureTime < 24 || exposureTime > 168) showToast('⚠️ Tempo di esposizione non standard (24-168 ore)', 'warning');
    const result = document.getElementById('fumigation-result');
    result.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Risultato Fumigazione</h3>
        <p><strong><i class="fas fa-cube"></i> Volume da trattare:</strong> ${volume.toFixed(1)} m³</p>
        <div class="highlight">
            Quantità ${product.name}: <strong>${totalProduct} g</strong>
        </div>
        <p><strong><i class="fas fa-weight"></i> Dosaggio:</strong> ${dosage} g/m³</p>
        <p><strong><i class="fas fa-stopwatch"></i> Tempo esposizione:</strong> ${exposureTime} ore</p>
        <div class="warning">
            <strong><i class="fas fa-skull-crossbones"></i> PERICOLO:</strong><br>
            • Prodotto estremamente tossico<br>
            • Solo per operatori autorizzati<br>
            • Sigillare completamente l'area<br>
            • Ventilare accuratamente al termine
        </div>
        <div class="info">
            <strong><i class="fas fa-clipboard-check"></i> Procedura:</strong><br>
            1. Verificare sigillatura completa<br>
            2. Indossare autorespiratore<br>
            3. Distribuire uniformemente il prodotto<br>
            4. Segnalare l'area trattata<br>
            5. Monitorare concentrazione residua
        </div>
    `;
    result.classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const timerSection = document.getElementById('timer-section');
    timerSection.style.display = 'block';
    timerDuration = exposureTime * 3600;
    updateTimerDisplay(timerDuration);
    const timerBtn = document.getElementById('timer-btn');
    timerBtn.innerHTML = '<i class="fas fa-play"></i> Avvia Timer';
    timerBtn.disabled = false;
    timerBtn.classList.remove('stop');
    saveCalculation('Fumigazione', {
        volume: volume.toFixed(1) + ' m³',
        fumigant: product.name,
        quantity: totalProduct + ' g',
        exposure: exposureTime + ' ore'
    });
}

function toggleFumigationInputs() {
    const type = document.getElementById('fumigation-type').value;
    document.getElementById('volume-inputs').style.display = type === 'volume' ? 'grid' : 'none';
    document.getElementById('weight-inputs').style.display = type === 'weight' ? 'block' : 'none';
}

// COSTI
function calculateCost() {
    const productIdx = document.getElementById('cost-product').value;
    const quantity = parseFloat(document.getElementById('cost-quantity').value) || lastCalculatedQuantity;
    const laborCost = parseFloat(document.getElementById('cost-labor').value) || 35;
    const timeHours = parseFloat(document.getElementById('cost-time').value) || 2;
    if ((productIdx === "" && productIdx !== "custom")) return alert('Seleziona un prodotto');
    if (!quantity) return alert('Inserisci la quantità di prodotto o esegui prima un calcolo');
    const product = customProducts[productIdx];
    const productPrice = product.price || 0;
    const productCostPerML = productPrice / 1000;
    const productCost = quantity * productCostPerML;
    const laborTotal = laborCost * timeHours;
    const totalCost = productCost + laborTotal;
    const result = document.getElementById('cost-result');
    result.innerHTML = `
        <h3><i class="fas fa-euro-sign"></i> Risultato Calcolo Costi</h3>
        <p><strong><i class="fas fa-flask"></i> Prodotto:</strong> ${product.name}</p>
        <p><strong><i class="fas fa-tint"></i> Quantità:</strong> ${quantity.toFixed(1)} ml</p>
        <div class="highlight">
            <strong>Costo totale stimato: €${totalCost.toFixed(2)}</strong>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong><i class="fas fa-flask"></i> Costo prodotto:</strong> €${productCost.toFixed(2)}</p>
            <p><strong><i class="fas fa-user-clock"></i> Costo manodopera:</strong> €${laborTotal.toFixed(2)} (${timeHours}h × €${laborCost}/h)</p>
        </div>
        <div class="info">
            <strong><i class="fas fa-info-circle"></i> Note:</strong><br>
            • I costi sono puramente indicativi<br>
            • Non includono trasferte e materiali aggiuntivi<br>
            • Adeguare in base al tipo di intervento
        </div>
    `;
    result.classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('cost-quantity').value = quantity.toFixed(1);
    saveCalculation('Calcolo Costi', {
        product: product.name,
        quantity: quantity.toFixed(1) + ' ml',
        productCost: '€' + productCost.toFixed(2),
        laborCost: '€' + laborTotal.toFixed(2),
        totalCost: '€' + totalCost.toFixed(2)
    });
}

// TIMER FUMIGAZIONE
function toggleTimer() {
    const timerBtn = document.getElementById('timer-btn');
    if (fumigationTimer === null) {
        timerStartTime = Date.now();
        fumigationTimer = setInterval(updateTimer, 1000);
        timerBtn.innerHTML = '<i class="fas fa-stop"></i> Ferma Timer';
        timerBtn.classList.add('stop');
        if ('Notification' in window && Notification.permission === 'granted') {
            setTimeout(() => {
                new Notification('PestCalc Pro - Fumigazione', {
                    body: 'Tempo di esposizione completato. Procedere con ventilazione.',
                    icon: '/favicon.ico'
                });
            }, timerDuration * 1000);
        }
    } else {
        clearInterval(fumigationTimer);
        fumigationTimer = null;
        timerBtn.innerHTML = '<i class="fas fa-play"></i> Avvia Timer';
        timerBtn.classList.remove('stop');
    }
}
function updateTimer() {
    const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
    const remaining = Math.max(0, timerDuration - elapsed);
    updateTimerDisplay(remaining);
    if (remaining === 0) {
        clearInterval(fumigationTimer);
        fumigationTimer = null;
        const timerBtn = document.getElementById('timer-btn');
        timerBtn.innerHTML = '<i class="fas fa-check"></i> Timer Completato';
        timerBtn.disabled = true;
        alert('⏰ Tempo di esposizione completato!\nProcedere con la ventilazione dell\'area.');
    }
}
function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('timer-display').textContent = display;
}

// STORICO
function saveCalculation(type, data) {
    calculationHistory.unshift({
        id: Date.now(),
        type,
        data,
        timestamp: new Date().toLocaleString('it-IT')
    });
    if (calculationHistory.length > 100) calculationHistory = calculationHistory.slice(0, 100);
    localStorage.setItem('pestcalc_history', JSON.stringify(calculationHistory));
}

function displayHistory() {
    const historyList = document.getElementById('history-list');
    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">Nessun calcolo salvato</p>';
        return;
    }
    let html = '';
    calculationHistory.forEach(calc => {
        const typeIcon = getTypeIcon(calc.type);
        html += `
            <div class="history-item" onclick="showCalculationDetails(${calc.id})">
                <h4><i class="${typeIcon}"></i> ${calc.type}</h4>
                ${Object.entries(calc.data).map(([key, value]) => 
                    `<p><strong>${key}:</strong> ${value}</p>`
                ).join('')}
                <p class="timestamp"><i class="fas fa-clock"></i> ${calc.timestamp}</p>
            </div>
        `;
    });
    historyList.innerHTML = html;
}
function getTypeIcon(type) {
    const icons = {
        'Diluizione': 'fas fa-tint',
        'Saturazione Ambientale': 'fas fa-home',
        'Fumigazione': 'fas fa-cloud',
        'Calcolo Costi': 'fas fa-euro-sign'
    };
    return icons[type] || 'fas fa-calculator';
}
function filterHistory() {
    const searchTerm = document.getElementById('search-history').value.toLowerCase();
    const filteredHistory = calculationHistory.filter(calc => 
        calc.type.toLowerCase().includes(searchTerm) ||
        JSON.stringify(calc.data).toLowerCase().includes(searchTerm)
    );
    const historyList = document.getElementById('history-list');
    if (filteredHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">Nessun risultato trovato</p>';
        return;
    }
    let html = '';
    filteredHistory.forEach(calc => {
        const typeIcon = getTypeIcon(calc.type);
        html += `
            <div class="history-item" onclick="showCalculationDetails(${calc.id})">
                <h4><i class="${typeIcon}"></i> ${calc.type}</h4>
                ${Object.entries(calc.data).map(([key, value]) => 
                    `<p><strong>${key}:</strong> ${value}</p>`
                ).join('')}
                <p class="timestamp"><i class="fas fa-clock"></i> ${calc.timestamp}</p>
            </div>
        `;
    });
    historyList.innerHTML = html;
}
function clearHistory() {
    if (confirm('Sei sicuro di voler cancellare tutto lo storico?')) {
        calculationHistory = [];
        localStorage.removeItem('pestcalc_history');
        displayHistory();
        showToast('Storico cancellato', 'success');
    }
}
function showCalculationDetails(id) {
    const calc = calculationHistory.find(c => c.id === id);
    if (calc) {
        const details = Object.entries(calc.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        alert(`Dettagli ${calc.type}\n\n${details}\n\nData: ${calc.timestamp}`);
    }
}
function exportHistory() {
    if (calculationHistory.length === 0) {
        alert('Nessun calcolo da esportare');
        return;
    }
    let htmlContent = `
        <div style="font-family: Arial, sans-serif; margin: 20px;">
            <h1 style="color: #1e3c72; text-align: center; margin-bottom: 30px;">PestCalc Pro - Storico Calcoli</h1>
            ${calculationHistory.map(calc => `
                <div style="background: #f8f9fa; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #1e3c72;">
                    <h3 style="color: #1e3c72;">${calc.type}</h3>
                    ${Object.entries(calc.data).map(([key, value]) => 
                        `<p><strong>${key}:</strong> ${value}</p>`
                    ).join('')}
                    <p style="color: #666; font-style: italic; font-size: 0.9em;">Data: ${calc.timestamp}</p>
                </div>
            `).join('')}
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
                Generato da PestCalc Pro il ${new Date().toLocaleString('it-IT')}
            </div>
        </div>
    `;
    html2pdf().from(htmlContent).set({
        margin: 10,
        filename: `pestcalc-storico-${new Date().toISOString().split('T')[0]}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    }).save();
    showToast('Storico esportato in PDF!', 'success');
}

// FEEDBACK VISIVI
function showSuccess(element, message) {
    element.classList.add('success');
    setTimeout(() => element.classList.remove('success'), 600);
    if (message) showToast(message, 'success');
}
function showError(element, message) {
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 600);
    if (message) showToast(message, 'error');
}
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    Object.assign(toast.style, {
        position: 'fixed', top: '20px', right: '20px', padding: '16px 20px', borderRadius: '12px', color: 'white',
        fontWeight: '600', fontSize: '0.9rem', zIndex: '10000', display: 'flex', alignItems: 'center', gap: '10px',
        minWidth: '250px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        background: type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                   type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                   'linear-gradient(135deg, #3b82f6, #2563eb)'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// NOTIFICHE
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', function() {
    showMainMenu();
    updateProductSelects();
    updateSaturationProductSelect();
    updateFumigantSelect();
    updateCostProductSelect();
    // Aggiorna percentuale e selezioni dinamicamente se necessario
    const productSelect = document.getElementById('product-select');
    if (productSelect) productSelect.addEventListener('change', updateProductSelects);
});
