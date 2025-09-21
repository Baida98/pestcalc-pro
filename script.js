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
let timerPersistKey = 'pestcalc_fumigation_timer';

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
    if (type === 'dilution') updateProductSelect('product-select', 'Seleziona un prodotto');
    if (type === 'saturation') updateProductSelect('saturation-product');
    if (type === 'fumigation') updateProductSelect('fumigant');
    if (type === 'cost') updateProductSelect('cost-product', 'Seleziona prodotto...');
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
        updateAllProductSelects();
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

function showCostCalculator() {
    hideAllSections();
    document.getElementById('cost-calc').style.display = 'block';
    document.querySelector('.app-header').style.display = 'none';
    updateProductSelect('cost-product', 'Seleziona prodotto...');
}

function hideAllSections() {
    const sections = document.querySelectorAll('.calculator-section, .main-menu');
    sections.forEach(section => section.style.display = 'none');
}

// SELECTS: aggiorna tutte le select con i prodotti personalizzati
function updateProductSelect(selectId, firstOptionLabel) {
    const select = document.getElementById(selectId);
    if (!select) return;
    let html = firstOptionLabel ? `<option value="">${firstOptionLabel}</option>` : '';
    customProducts.forEach(product => {
        html += `<option value="${product.id}">${sanitizeHtml(product.name)}</option>`;
    });
    html += `<option value="custom">Personalizzato</option>`;
    select.innerHTML = html;
}

function updateAllProductSelects() {
    updateProductSelect('product-select', 'Seleziona un prodotto');
    updateProductSelect('saturation-product');
    updateProductSelect('fumigant');
    updateProductSelect('cost-product', 'Seleziona prodotto...');
}

// FUNZIONI DI SUPPORTO PER I NUOVI CAMPI PRODOTTI
function setDilution(value) {
    const el = document.getElementById('new-product-dilution');
    if (el) el.value = value;
}
function setSaturationDose(value) {
    const el = document.getElementById('new-product-saturation-dose');
    if (el) el.value = value;
}
function setFumigantDose(value) {
    const el = document.getElementById('new-product-fumigant-dose');
    if (el) el.value = value;
}
function setHeight(value) {
    const el = document.getElementById('fum-height');
    if (el) el.value = value;
    calculateFumigationVolume();
}
function setExposure(value) {
    const el = document.getElementById('exposure-time');
    if (el) el.value = value;
}

// CALCOLO VOLUME PER SATURAZIONE
function calculateSaturationVolume() {
    const area = parseFloat(document.getElementById('room-area')?.value) || 0;
    const height = parseFloat(document.getElementById('room-height')?.value) || 0;
    const display = document.getElementById('saturation-volume-display');
    if (!display) return 0;
    if (Number.isFinite(area) && Number.isFinite(height) && area > 0 && height > 0) {
        const volume = area * height;
        display.textContent = volume.toFixed(1) + ' m³';
        return volume;
    }
    display.textContent = '0 m³';
    return 0;
}

// CALCOLO VOLUME PER FUMIGAZIONE
function calculateFumigationVolume() {
    const type = document.getElementById('fumigation-type')?.value;
    let volume = 0;
    if (type === 'volume') {
        const area = parseFloat(document.getElementById('fum-area')?.value) || 0;
        const height = parseFloat(document.getElementById('fum-height')?.value) || 0;
        if (Number.isFinite(area) && Number.isFinite(height) && area > 0 && height > 0) {
            volume = area * height;
        }
    } else if (type === 'weight') {
        const weight = parseFloat(document.getElementById('product-weight')?.value) || 0;
        if (Number.isFinite(weight) && weight > 0) {
            volume = weight * 1.5; // 1 tonnellata = 1.5 m³
        }
    }
    const display = document.getElementById('fumigation-volume-display');
    if (display) display.textContent = volume.toFixed(1) + ' m³';
    return volume;
}

// GESTIONE PRODOTTI PERSONALIZZATI (MIGLIORATA)
function addCustomProduct() {
    const name = document.getElementById('new-product-name').value.trim();
    const type = document.getElementById('new-product-type').value;
    const formulation = document.getElementById('new-product-formulation').value;
    const concentration = parseFloat(document.getElementById('new-product-concentration').value);
    const dilution = parseFloat(document.getElementById('new-product-dilution').value);
    const price = parseFloat(document.getElementById('new-product-price').value);
    const saturationDose = parseFloat(document.getElementById('new-product-saturation-dose').value);
    const fumigantDose = parseFloat(document.getElementById('new-product-fumigant-dose').value);
    const addBtn = document.getElementById('add-product-btn') || document.querySelector('.calculate-btn');

    // Validazione avanzata
    if (!name || name.length < 3) return showError(addBtn, 'Il nome deve essere di almeno 3 caratteri');
    if (!Number.isFinite(concentration) || concentration <= 0 || concentration > 100) 
        return showError(addBtn, 'La concentrazione deve essere tra 0.1% e 100%');
    if (!Number.isFinite(dilution) || dilution <= 0 || dilution > 10) 
        return showError(addBtn, 'La diluizione deve essere tra 0.01% e 10%');
    if (price && (!Number.isFinite(price) || price <= 0)) 
        return showError(addBtn, 'Il prezzo deve essere un valore positivo');
    if (saturationDose && (!Number.isFinite(saturationDose) || saturationDose <= 0)) 
        return showError(addBtn, 'Il dosaggio per saturazione deve essere positivo');
    if (fumigantDose && (!Number.isFinite(fumigantDose) || fumigantDose <= 0)) 
        return showError(addBtn, 'Il dosaggio per fumigazione deve essere positivo');

    // Creazione nuovo prodotto
    const newProduct = {
        id: Date.now(),
        name: sanitizeHtml(name),
        type,
        formulation,
        concentration,
        recommendedDilution: dilution,
        price: price || 0,
        saturationDose: saturationDose || null,
        fumigantDose: fumigantDose || null,
        custom: true
    };

    // Animazione e salvataggio
    addBtn.classList.add('loading');
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aggiungendo...';

    setTimeout(() => {
        customProducts.push(newProduct);
        localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
        // Reset form
        ['new-product-name','new-product-concentration','new-product-dilution','new-product-price','new-product-saturation-dose','new-product-fumigant-dose'].forEach(id => {
            let el = document.getElementById(id); if (el) el.value = '';
        });
        // Aggiornamento UI
        displayCustomProducts();
        updateAllProductSelects();
        addBtn.classList.remove('loading');
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Aggiungi Prodotto';
        showSuccess(addBtn, '✅ Prodotto aggiunto con successo!');
    }, 600);
}

// CALCOLO DILUIZIONE
function setPercentage(value) { 
    const el = document.getElementById('dilution-percentage');
    if (el) el.value = value;
}
function setVolume(value) { 
    const el = document.getElementById('solution-volume');
    if (el) el.value = value;
}

function calculateDilution() {
    const productId = document.getElementById('product-select').value;
    const percentage = parseFloat(document.getElementById('dilution-percentage').value);
    const volume = parseFloat(document.getElementById('solution-volume').value);
    const unit = document.getElementById('volume-unit').value;
    const calcBtn = document.getElementById('dilution-calc-btn') || document.querySelector('#dilution-calc .calculate-btn');

    if (!productId || productId === 'custom') return showError(calcBtn, 'Seleziona un prodotto');
    if (!Number.isFinite(percentage) || !Number.isFinite(volume)) return showError(calcBtn, 'Inserisci tutti i valori');
    if (percentage > 10) return showError(calcBtn, '⚠️ Percentuale molto alta! Verifica la diluizione.');

    calcBtn.classList.add('loading');
    calcBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcolando...';

    setTimeout(() => {
        const volumeInLiters = unit === 'L' ? volume : volume / 1000;
        const concentrateML = (percentage / 100) * volumeInLiters * 1000;
        lastCalculatedQuantity = concentrateML;
        const product = customProducts.find(p => p.id == productId);
        const productName = product ? product.name : 'Prodotto personalizzato';
        const result = document.getElementById('dilution-result');
        result.innerHTML = `
            <h3><i class="fas fa-check-circle"></i> Risultato Diluizione</h3>
            <div class="highlight">
                Aggiungi <strong>${concentrateML.toFixed(1)} ml</strong> di ${sanitizeHtml(productName)} 
                a <strong>${volume} ${unit}</strong> di acqua
            </div>
            <p><strong><i class="fas fa-percentage"></i> Concentrazione finale:</strong> ${percentage}%</p>
            <p><strong><i class="fas fa-fill-drip"></i> Volume totale soluzione:</strong> ${volume} ${unit}</p>
            ${product && percentage > product.recommendedDilution ? 
                '<div class="warning"><strong><i class="fas fa-exclamation-triangle"></i> Attenzione:</strong> Concentrazione superiore a quella raccomandata</div>' : ''}
            <div class="info" role="alert">
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

// CALCOLO SATURAZIONE (OTTIMIZZATO)
function quickSaturation(area, height, productType) {
    setInputValue('room-area', area);
    setInputValue('room-height', height);
    calculateSaturationVolume();
    calculateSaturation();
}

function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function calculateSaturation() {
    const volume = calculateSaturationVolume();
    if (volume <= 0) return showError(document.getElementById('saturation-calc-btn') || document.querySelector('.calculate-btn'), 'Inserisci superficie e altezza valide');
    const productId = document.getElementById('saturation-product').value;
    if (!productId || productId === 'custom') return showError(document.getElementById('saturation-calc-btn') || document.querySelector('.calculate-btn'), 'Seleziona un prodotto');
    const product = customProducts.find(p => p.id == productId);
    if (!product) return showError(document.getElementById('saturation-calc-btn') || document.querySelector('.calculate-btn'), 'Prodotto non valido');
    const dosage = product.saturationDose || 15;
    const minProduct = (volume * dosage).toFixed(0);

    // Risultato con messaggi contestuali
    const result = document.getElementById('saturation-result');
    result.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Risultato Saturazione</h3>
        <p><strong><i class="fas fa-cube"></i> Volume ambiente:</strong> ${volume.toFixed(1)} m³</p>
        <div class="highlight">
            Quantità prodotto necessaria: <strong>${minProduct} ml</strong> di ${sanitizeHtml(product.name)}
        </div>
        <p><strong><i class="fas fa-eyedropper"></i> Dosaggio:</strong> ${dosage} ml/m³</p>
        ${dosage > 20 ? 
            `<div class="warning">
                <strong><i class="fas fa-exclamation-triangle"></i> Attenzione:</strong> 
                Dosaggio elevato! Verificare la sicurezza per l'ambiente e le superfici.
            </div>` : ''}
        <div class="info" role="alert">
            <strong><i class="fas fa-clipboard-list"></i> Procedura consigliata:</strong>
            <ol>
                <li>Sigillare porte e finestre</li>
                <li>Proteggere alimenti e superfici sensibili</li>
                <li>Applicare uniformemente in tutta l'area</li>
                <li>Non rientrare per almeno 4 ore</li>
                <li>Ventilare accuratamente prima di rioccupare</li>
            </ol>
        </div>
    `;
    result.classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveCalculation('Saturazione Ambientale', {
        Ambiente: `${document.getElementById('room-area').value} m² × ${document.getElementById('room-height').value} m`,
        Volume: `${volume.toFixed(1)} m³`,
        Prodotto: product.name,
        Dosaggio: `${dosage} ml/m³`,
        Quantità: `${minProduct} ml`
    });
}

// CALCOLO FUMIGAZIONE (OTTIMIZZATO)
function calculateFumigation() {
    const volume = calculateFumigationVolume();
    if (volume <= 0) return showError(document.getElementById('fumigation-calc-btn') || document.querySelector('.calculate-btn'), 'Volume non valido');
    const fumigantId = document.getElementById('fumigant').value;
    if (!fumigantId || fumigantId === 'custom') return showError(document.getElementById('fumigation-calc-btn') || document.querySelector('.calculate-btn'), 'Seleziona un fumigante');
    const exposureTime = parseInt(document.getElementById('exposure-time').value) || 48;
    const product = customProducts.find(p => p.id == fumigantId);
    if (!product) return showError(document.getElementById('fumigation-calc-btn') || document.querySelector('.calculate-btn'), 'Fumigante non valido');
    const dosage = product.fumigantDose || 2;
    const totalProduct = (volume * dosage).toFixed(0);

    // Risultato con avvertenze specifiche
    const result = document.getElementById('fumigation-result');
    result.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Risultato Fumigazione</h3>
        <p><strong><i class="fas fa-cube"></i> Volume da trattare:</strong> ${volume.toFixed(1)} m³</p>
        <div class="highlight">
            Quantità ${sanitizeHtml(product.name)}: <strong>${totalProduct} g</strong>
        </div>
        <p><strong><i class="fas fa-weight"></i> Dosaggio:</strong> ${dosage} g/m³</p>
        <p><strong><i class="fas fa-stopwatch"></i> Tempo esposizione:</strong> ${exposureTime} ore</p>
        <div class="warning" role="alert">
            <strong><i class="fas fa-skull-crossbones"></i> PERICOLO ALTA TOSSICITÀ:</strong>
            <ul>
                <li>Prodotto estremamente tossico per inalazione</li>
                <li>Rischio di esplosione in ambienti confinati</li>
                <li>Richiede certificazione specifica per l'uso</li>
                <li>Obbligatorio rilevatore di gas e piano di emergenza</li>
            </ul>
        </div>
        <div class="info" role="alert">
            <strong><i class="fas fa-clipboard-check"></i> Procedura di sicurezza:</strong>
            <ol>
                <li>Verificare la perfetta sigillatura dell'area</li>
                <li>Indossare autorespiratore certificato</li>
                <li>Posizionare cartelli di pericolo fumigazione</li>
                <li>Monitorare costantemente la concentrazione di gas</li>
                <li>Ventilare completamente prima di rientrare</li>
                <li>Verificare residui con apposito rilevatore</li>
            </ol>
        </div>
    `;
    result.classList.add('show');
    document.getElementById('timer-section').style.display = 'block';
    timerDuration = exposureTime * 3600;
    saveTimerPersistence(timerDuration);
    updateTimerDisplay(timerDuration);

    saveCalculation('Fumigazione', {
        Volume: `${volume.toFixed(1)} m³`,
        Fumigante: product.name,
        Dosaggio: `${dosage} g/m³`,
        Quantità: `${totalProduct} g`,
        Esposizione: `${exposureTime} ore`
    });
}

// TOGGLE FUMIGATION INPUTS
function toggleFumigationInputs() {
    const type = document.getElementById('fumigation-type').value;
    document.getElementById('volume-inputs').style.display = type === 'volume' ? 'block' : 'none';
    document.getElementById('weight-inputs').style.display = type === 'weight' ? 'block' : 'none';
    calculateFumigationVolume();
}

// CALCOLO COSTI
function calculateCost() {
    const productId = document.getElementById('cost-product').value;
    const quantity = parseFloat(document.getElementById('cost-quantity').value) || lastCalculatedQuantity;
    const laborCost = parseFloat(document.getElementById('cost-labor').value) || 35;
    const timeHours = parseFloat(document.getElementById('cost-time').value) || 2;
    if (!productId || productId === 'custom') return alert('Seleziona un prodotto');
    if (!Number.isFinite(quantity) || quantity <= 0) return alert('Inserisci la quantità di prodotto o esegui prima un calcolo');
    const product = customProducts.find(p => p.id == productId);
    if (!product) return showError(document.getElementById('cost-calc-btn') || document.querySelector('.calculate-btn'), 'Prodotto non valido');
    const productPrice = product.price || 0;
    const productCostPerML = productPrice / 1000;
    const productCost = quantity * productCostPerML;
    const laborTotal = laborCost * timeHours;
    const totalCost = productCost + laborTotal;
    const result = document.getElementById('cost-result');
    result.innerHTML = `
        <h3><i class="fas fa-euro-sign"></i> Risultato Calcolo Costi</h3>
        <p><strong><i class="fas fa-flask"></i> Prodotto:</strong> ${sanitizeHtml(product.name)}</p>
        <p><strong><i class="fas fa-tint"></i> Quantità:</strong> ${quantity.toFixed(1)} ml</p>
        <div class="highlight">
            <strong>Costo totale stimato: €${totalCost.toFixed(2)}</strong>
        </div>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong><i class="fas fa-flask"></i> Costo prodotto:</strong> €${productCost.toFixed(2)}</p>
            <p><strong><i class="fas fa-user-clock"></i> Costo manodopera:</strong> €${laborTotal.toFixed(2)} (${timeHours}h × €${laborCost}/h)</p>
        </div>
        <div class="info" role="alert">
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
function saveTimerPersistence(duration) {
    localStorage.setItem(timerPersistKey, JSON.stringify({
        start: Date.now(),
        duration
    }));
}
function loadTimerPersistence() {
    try {
        const data = JSON.parse(localStorage.getItem(timerPersistKey));
        if (data && data.start && data.duration) {
            const elapsed = Math.floor((Date.now() - data.start) / 1000);
            const remaining = Math.max(0, data.duration - elapsed);
            if (remaining > 0) {
                timerDuration = remaining;
                updateTimerDisplay(remaining);
                return true;
            }
        }
    } catch {}
    return false;
}
function clearTimerPersistence() {
    localStorage.removeItem(timerPersistKey);
}

function toggleTimer() {
    const timerBtn = document.getElementById('timer-btn');
    if (fumigationTimer === null) {
        timerStartTime = Date.now();
        fumigationTimer = setInterval(updateTimer, 1000);
        timerBtn.innerHTML = '<i class="fas fa-stop"></i> Ferma Timer';
        timerBtn.classList.add('stop');
        saveTimerPersistence(timerDuration);
        if ('Notification' in window && Notification.permission === 'granted') {
            setTimeout(() => {
                new Notification('PestCalc Pro - Fumigazione', {
                    body: 'Tempo di esposizione completato. Procedere con ventilazione.',
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦠</text></svg>'
                });
            }, timerDuration * 1000);
        }
    } else {
        clearInterval(fumigationTimer);
        fumigationTimer = null;
        timerBtn.innerHTML = '<i class="fas fa-play"></i> Avvia Timer';
        timerBtn.classList.remove('stop');
        clearTimerPersistence();
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
        clearTimerPersistence();
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
                <h4><i class="${typeIcon}"></i> ${sanitizeHtml(calc.type)}</h4>
                ${Object.entries(calc.data).map(([key, value]) => 
                    `<p><strong>${sanitizeHtml(key)}:</strong> ${sanitizeHtml(value)}</p>`
                ).join('')}
                <p class="timestamp"><i class="fas fa-clock"></i> ${sanitizeHtml(calc.timestamp)}</p>
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
                <h4><i class="${typeIcon}"></i> ${sanitizeHtml(calc.type)}</h4>
                ${Object.entries(calc.data).map(([key, value]) => 
                    `<p><strong>${sanitizeHtml(key)}:</strong> ${sanitizeHtml(value)}</p>`
                ).join('')}
                <p class="timestamp"><i class="fas fa-clock"></i> ${sanitizeHtml(calc.timestamp)}</p>
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
    // Implementa qui export PDF: ad es. usando jsPDF o html2pdf.js
    showToast('Storico esportato in PDF!', 'success');
}

// VISUALIZZAZIONE PRODOTTI (MIGLIORATA)
function displayCustomProducts() {
    const container = document.getElementById('custom-products-list');
    if (!customProducts.length) {
        container.innerHTML = '<p class="no-history">Nessun prodotto personalizzato salvato</p>';
        return;
    }
    // Icone per tipologia prodotto
    const typeIcons = {
        'insetticida': 'fas fa-bug',
        'rodenticida': 'fas fa-rat',
        'fumigante': 'fas fa-smog',
        'disinfettante': 'fas fa-virus-slash',
        'altro': 'fas fa-flask'
    };
    // Etichette per formulazione
    const formulationLabels = {
        'liquido': 'Liquido',
        'polvere': 'Polvere',
        'granulare': 'Granulare',
        'aerosol': 'Aerosol',
        'gel': 'Gel'
    };
    let html = '';
    customProducts.forEach((product, idx) => {
        html += `
            <div class="product-item">
                <div class="product-info">
                    <h4><i class="${typeIcons[product.type] || 'fas fa-flask'}"></i> ${sanitizeHtml(product.name)}</h4>
                    <p>
                        <strong>Tipo:</strong> ${sanitizeHtml(product.type)} | 
                        <strong>Formulazione:</strong> ${sanitizeHtml(formulationLabels[product.formulation] || product.formulation)} |
                        <strong>Conc.:</strong> ${sanitizeHtml(product.concentration)}%
                    </p>
                    <p>
                        <strong>Diluizione:</strong> ${sanitizeHtml(product.recommendedDilution)}% |
                        <strong>Prezzo:</strong> €${Number(product.price).toFixed(2)}
                    </p>
                    ${product.saturationDose ? 
                        `<p><strong>Saturazione:</strong> ${sanitizeHtml(product.saturationDose)} ml/m³</p>` : ''}
                    ${product.fumigantDose ? 
                        `<p><strong>Fumigazione:</strong> ${sanitizeHtml(product.fumigantDose)} g/m³</p>` : ''}
                </div>
                <button class="delete-product-btn" aria-label="Elimina prodotto" onclick="deleteCustomProduct(${idx})">
                    <i class="fas fa-trash"></i> Elimina
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
        updateAllProductSelects();
    }
}

// FEEDBACK VISIVI
function showSuccess(element, message) {
    if (!element) return;
    element.classList.add('success');
    setTimeout(() => element.classList.remove('success'), 600);
    if (message) showToast(message, 'success');
}

function showError(element, message) {
    if (!element) return;
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 600);
    if (message) showToast(message, 'error');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${sanitizeHtml(message)}</span>
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

// Sicurezza XSS
function sanitizeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"'`]/g, function (m) {
        return ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;'
        })[m];
    });
}

// NOTIFICHE
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// INIZIALIZZAZIONE MIGLIORATA
document.addEventListener('DOMContentLoaded', function() {
    showMainMenu();
    updateAllProductSelects();
    // Event listeners per calcoli in tempo reale
    ['room-area','room-height'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateSaturationVolume);
    });
    ['fum-area','fum-height','product-weight'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', calculateFumigationVolume);
    });
    const fumType = document.getElementById('fumigation-type');
    if (fumType) fumType.addEventListener('change', toggleFumigationInputs);

    // Ripristina eventuale timer fumigazione in corso
    loadTimerPersistence();
});
