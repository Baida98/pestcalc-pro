// Database prodotti
const products = {
    'permetrina-10': { name: 'Permetrina (conc. 10%)', concentration: 10, recommendedDilution: 0.75, price: 28.50 },
    'deltametrina-5': { name: 'Deltametrina (conc. 5%)', concentration: 5, recommendedDilution: 0.5, price: 32.00 },
    'cipermetrina-25': { name: 'Cipermetrina (conc. 25%)', concentration: 25, recommendedDilution: 0.3, price: 45.00 }
};

const fumigants = {
    'fosfina': { name: 'Fosfina', dosage: 2, minTime: 24, maxTime: 72, unit: 'g/m³' },
    'bromuro': { name: 'Bromuro di metile', dosage: 30, minTime: 12, maxTime: 24, unit: 'g/m³' }
};

// Prodotti personalizzati salvati localmente
let customProducts = JSON.parse(localStorage.getItem('pestcalc_custom_products')) || {};

// Storico calcoli
let calculationHistory = JSON.parse(localStorage.getItem('pestcalc_history')) || [];

// Timer per fumigazione
let fumigationTimer = null;
let timerStartTime = null;
let timerDuration = 0;

// Variabile per memorizzare l'ultima quantità calcolata
let lastCalculatedQuantity = 0;

// Navigazione
function showMainMenu() {
    hideAllSections();
    document.getElementById('main-menu').style.display = 'block';
    // Mostra header nel menu principale
    document.querySelector('.app-header').style.display = 'block';
}

function showCalculator(type) {
    hideAllSections();
    document.getElementById(type + '-calc').style.display = 'block';
    // Nascondi header nelle sezioni calcolatori
    document.querySelector('.app-header').style.display = 'none';

    if (type === 'dilution') {
        updateProductSelects();
    }
}

function showProducts() {
    hideAllSections();
    document.getElementById('products-section').style.display = 'block';
    // Nascondi header nella sezione prodotti
    document.querySelector('.app-header').style.display = 'none';
    displayCustomProducts();
}

function showHistory() {
    hideAllSections();
    document.getElementById('history-section').style.display = 'block';
    // Nascondi header nella sezione storico
    document.querySelector('.app-header').style.display = 'none';
    displayHistory();
}

function showCostCalculator() {
    hideAllSections();
    document.getElementById('cost-calc').style.display = 'block';
    // Nascondi header nella sezione costi
    document.querySelector('.app-header').style.display = 'none';
    updateCostProductSelect();
}

function hideAllSections() {
    const sections = document.querySelectorAll('.calculator-section, .main-menu');
    sections.forEach(section => section.style.display = 'none');
}

// Aggiornamento delle select con prodotti personalizzati
function updateProductSelects() {
    const selects = ['product-select', 'cost-product'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Salva il valore corrente
        const currentValue = select.value;

        // Ricostruisci le opzioni
        let html = '';

        if (selectId === 'cost-product') {
            html += '<option value="">Seleziona prodotto...</option>';
        }

        // Prodotti standard
        Object.entries(products).forEach(([key, product]) => {
            html += `<option value="${key}">${product.name}</option>`;
        });

        // Prodotti personalizzati
        Object.entries(customProducts).forEach(([key, product]) => {
            html += `<option value="${key}">${product.name}</option>`;
        });

        if (selectId === 'product-select') {
            html += '<option value="custom">Personalizzato</option>';
        }

        select.innerHTML = html;

        // Ripristina il valore se ancora valido
        if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
            select.value = currentValue;
        }
    });
}

function updateCostProductSelect() {
    updateProductSelects();
}

// Gestione prodotti personalizzati
function addCustomProduct() {
    const name = document.getElementById('new-product-name').value.trim();
    const concentration = parseFloat(document.getElementById('new-product-concentration').value);
    const dilution = parseFloat(document.getElementById('new-product-dilution').value);
    const price = parseFloat(document.getElementById('new-product-price').value);
    const addBtn = document.querySelector('.calculate-btn');

    // Validazione avanzata
    if (!name || name.length < 3) {
        showError(addBtn, 'Il nome deve essere di almeno 3 caratteri');
        return;
    }
    
    if (!concentration || concentration <= 0 || concentration > 100) {
        showError(addBtn, 'La concentrazione deve essere tra 0.1% e 100%');
        return;
    }
    
    if (!dilution || dilution <= 0 || dilution > 10) {
        showError(addBtn, 'La diluizione deve essere tra 0.01% e 10%');
        return;
    }

    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    customProducts[key] = {
        name: name,
        concentration: concentration,
        recommendedDilution: dilution,
        price: price || 0,
        custom: true
    };

    // Animazione loading
    addBtn.classList.add('loading');
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aggiungendo...';
    
    setTimeout(() => {
        localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));

        // Pulisci il form con animazione
        const inputs = ['new-product-name', 'new-product-concentration', 'new-product-dilution', 'new-product-price'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            input.style.transform = 'scale(0.95)';
            setTimeout(() => {
                input.value = '';
                input.style.transform = 'scale(1)';
            }, 100);
        });

        displayCustomProducts();
        updateProductSelects();

        // Ripristina pulsante e mostra successo
        addBtn.classList.remove('loading');
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Aggiungi Prodotto';
        showSuccess(addBtn, '✅ Prodotto aggiunto con successo!');
    }, 600);
}

function displayCustomProducts() {
    const container = document.getElementById('custom-products-list');

    if (Object.keys(customProducts).length === 0) {
        container.innerHTML = '<p class="no-history">Nessun prodotto personalizzato salvato</p>';
        return;
    }

    let html = '';
    Object.entries(customProducts).forEach(([key, product]) => {
        html += `
            <div class="product-item">
                <div class="product-info">
                    <h4><i class="fas fa-flask"></i> ${product.name}</h4>
                    <p><strong>Concentrazione:</strong> ${product.concentration}% | 
                       <strong>Diluizione raccomandata:</strong> ${product.recommendedDilution}%
                       ${product.price ? ` | <strong>Prezzo:</strong> €${product.price.toFixed(2)}/L` : ''}
                    </p>
                </div>
                <button class="delete-product-btn" onclick="deleteCustomProduct('${key}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function deleteCustomProduct(key) {
    if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
        delete customProducts[key];
        localStorage.setItem('pestcalc_custom_products', JSON.stringify(customProducts));
        displayCustomProducts();
        updateProductSelects();
    }
}

// Aggiornamento automatico percentuale diluizione
function updateDilutionPercentage() {
    const productKey = document.getElementById('product-select').value;
    const percentageInput = document.getElementById('dilution-percentage');

    if (productKey && productKey !== 'custom') {
        const product = products[productKey] || customProducts[productKey];
        if (product && product.recommendedDilution) {
            percentageInput.value = product.recommendedDilution;
        }
    }
}

// Funzioni per pulsanti percentuali rapide
function setPercentage(value) {
    document.getElementById('dilution-percentage').value = value;
}

// Funzione per impostare volume
function setVolume(value) {
    document.getElementById('solution-volume').value = value;
}

// Funzione per opzioni rapide diluizione
function quickDilution(product, percentage, volume, unit) {
    document.getElementById('product-select').value = product;
    document.getElementById('dilution-percentage').value = percentage;
    document.getElementById('solution-volume').value = volume;
    document.getElementById('volume-unit').value = unit;
    
    // Calcola automaticamente
    calculateDilution();
}

// Feedback visivi
function showSuccess(element, message) {
    element.classList.add('success');
    setTimeout(() => element.classList.remove('success'), 600);
    
    if (message) {
        showToast(message, 'success');
    }
}

function showError(element, message) {
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 600);
    
    if (message) {
        showToast(message, 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Aggiungi stili inline per il toast
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 20px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '600',
        fontSize: '0.9rem',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '250px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        background: type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' :
                   type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                   'linear-gradient(135deg, #3b82f6, #2563eb)'
    });
    
    document.body.appendChild(toast);
    
    // Animazione di entrata
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Rimozione automatica
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Calcolo Diluizione migliorato
function calculateDilution() {
    const productSelect = document.getElementById('product-select').value;
    const percentage = parseFloat(document.getElementById('dilution-percentage').value);
    const volume = parseFloat(document.getElementById('solution-volume').value);
    const unit = document.getElementById('volume-unit').value;
    const calcBtn = document.querySelector('.calculate-btn');

    if (!percentage || !volume) {
        showError(calcBtn, 'Inserisci tutti i valori richiesti');
        return;
    }

    if (percentage > 10) {
        showError(calcBtn, '⚠️ ATTENZIONE: Percentuale molto alta! Verifica la diluizione.');
        return;
    }

    // Animazione loading
    calcBtn.classList.add('loading');
    calcBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcolando...';

    setTimeout(() => {
        // Conversione volume in litri
        const volumeInLiters = unit === 'L' ? volume : volume / 1000;

        // Calcolo concentrato necessario
        const concentrateML = (percentage / 100) * volumeInLiters * 1000;
        lastCalculatedQuantity = concentrateML; // Salva per calcolo costi

    const product = products[productSelect] || customProducts[productSelect];
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

        // Scorri verso l'alto per mostrare il risultato fisso
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Ripristina pulsante e mostra successo
        calcBtn.classList.remove('loading');
        calcBtn.innerHTML = '<i class="fas fa-calculator"></i> Calcola Diluizione';
        showSuccess(calcBtn, '✅ Diluizione calcolata con successo!');

        // Salva nel storico
        saveCalculation('Diluizione', {
            product: productName,
            percentage: percentage + '%',
            volume: volume + ' ' + unit,
            concentrate: concentrateML.toFixed(1) + ' ml'
        });
    }, 800);
}

// Calcolo Saturazione Ambientale migliorato
function calculateSaturation() {
    const length = parseFloat(document.getElementById('room-length').value);
    const width = parseFloat(document.getElementById('room-width').value);
    const height = parseFloat(document.getElementById('room-height').value);
    const productType = document.getElementById('saturation-product').value;

    if (!length || !width || !height) {
        alert('Inserisci tutte le dimensioni');
        return;
    }

    const volume = length * width * height;

    let dosageRange, productName;
    switch(productType) {
        case 'aerosol':
            dosageRange = { min: 15, max: 20 };
            productName = 'Aerosol';
            break;
        case 'nebulizzabile':
            dosageRange = { min: 10, max: 15 };
            productName = 'Nebulizzabile';
            break;
        default:
            dosageRange = { min: 12, max: 18 };
            productName = 'Prodotto personalizzato';
    }

    const minProduct = (volume * dosageRange.min).toFixed(0);
    const maxProduct = (volume * dosageRange.max).toFixed(0);
    lastCalculatedQuantity = (volume * dosageRange.max); // Salva per calcolo costi

    const result = document.getElementById('saturation-result');
    result.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Risultato Saturazione Ambientale</h3>
        <p><strong><i class="fas fa-cube"></i> Volume ambiente:</strong> ${volume.toFixed(1)} m³</p>
        <p><strong><i class="fas fa-ruler-combined"></i> Dimensioni:</strong> ${length} × ${width} × ${height} m</p>
        <div class="highlight">
            Quantità prodotto necessaria: <strong>${minProduct} - ${maxProduct} ml</strong> di ${productName}
        </div>
        <p><strong><i class="fas fa-eyedropper"></i> Dosaggio:</strong> ${dosageRange.min}-${dosageRange.max} ml/m³</p>
        <div class="info">
            <strong><i class="fas fa-clipboard-list"></i> Procedura:</strong><br>
            1. Sigilla tutte le aperture<br>
            2. Rimuovi persone e animali<br>
            3. Applica il trattamento uniformemente<br>
            4. Ventila dopo 4-6 ore
        </div>
    `;
    result.classList.add('show');

    // Scorri verso l'alto per mostrare il risultato fisso
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Mostra checklist di sicurezza
    document.getElementById('safety-checklist').style.display = 'block';

    // Salva nel storico
    saveCalculation('Saturazione Ambientale', {
        dimensions: `${length} × ${width} × ${height} m`,
        volume: volume.toFixed(1) + ' m³',
        product: productName,
        quantity: `${minProduct} - ${maxProduct} ml`
    });
}

// Calcolo Fumigazione migliorato
function calculateFumigation() {
    const fumigationType = document.getElementById('fumigation-type').value;
    const fumigant = document.getElementById('fumigant').value;
    const exposureTime = parseInt(document.getElementById('exposure-time').value);

    let volume;
    if (fumigationType === 'volume') {
        const length = parseFloat(document.getElementById('fum-length').value);
        const width = parseFloat(document.getElementById('fum-width').value);
        const height = parseFloat(document.getElementById('fum-height').value);

        if (!length || !width || !height) {
            alert('Inserisci tutte le dimensioni');
            return;
        }
        volume = length * width * height;
    } else {
        const weight = parseFloat(document.getElementById('product-weight').value);
        if (!weight) {
            alert('Inserisci il peso della merce');
            return;
        }
        volume = weight * 1.5;
    }

    const fumigantData = fumigants[fumigant];
    const dosage = fumigantData ? fumigantData.dosage : 2;
    const fumigantName = fumigantData ? fumigantData.name : 'Fumigante personalizzato';

    const totalProduct = (volume * dosage).toFixed(0);

    if (exposureTime < 24 || exposureTime > 168) {
        alert('⚠️ Tempo di esposizione non standard (24-168 ore)');
    }

    const result = document.getElementById('fumigation-result');
    result.innerHTML = `
        <h3><i class="fas fa-check-circle"></i> Risultato Fumigazione</h3>
        <p><strong><i class="fas fa-cube"></i> Volume da trattare:</strong> ${volume.toFixed(1)} m³</p>
        <div class="highlight">
            Quantità ${fumigantName}: <strong>${totalProduct} g</strong>
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

    // Scorri verso l'alto per mostrare il risultato fisso
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Mostra timer
    const timerSection = document.getElementById('timer-section');
    timerSection.style.display = 'block';
    timerDuration = exposureTime * 3600;
    updateTimerDisplay(timerDuration);

    // Reset timer button
    const timerBtn = document.getElementById('timer-btn');
    timerBtn.innerHTML = '<i class="fas fa-play"></i> Avvia Timer';
    timerBtn.disabled = false;
    timerBtn.classList.remove('stop');

    // Salva nel storico
    saveCalculation('Fumigazione', {
        volume: volume.toFixed(1) + ' m³',
        fumigant: fumigantName,
        quantity: totalProduct + ' g',
        exposure: exposureTime + ' ore'
    });
}

function toggleFumigationInputs() {
    const type = document.getElementById('fumigation-type').value;
    const volumeInputs = document.getElementById('volume-inputs');
    const weightInputs = document.getElementById('weight-inputs');

    if (type === 'volume') {
        volumeInputs.style.display = 'grid';
        weightInputs.style.display = 'none';
    } else {
        volumeInputs.style.display = 'none';
        weightInputs.style.display = 'block';
    }
}

// Calcolo Costi
function calculateCost() {
    const productKey = document.getElementById('cost-product').value;
    const quantity = parseFloat(document.getElementById('cost-quantity').value) || lastCalculatedQuantity;
    const laborCost = parseFloat(document.getElementById('cost-labor').value) || 35;
    const timeHours = parseFloat(document.getElementById('cost-time').value) || 2;

    if (!productKey) {
        alert('Seleziona un prodotto');
        return;
    }

    if (!quantity) {
        alert('Inserisci la quantità di prodotto o esegui prima un calcolo');
        return;
    }

    const product = products[productKey] || customProducts[productKey];
    const productPrice = product.price || 0;

    // Calcoli
    const productCostPerML = productPrice / 1000; // Prezzo per ml
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

    // Scorri verso l'alto per mostrare il risultato fisso
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Aggiorna automaticamente il campo quantità
    document.getElementById('cost-quantity').value = quantity.toFixed(1);

    // Salva nel storico
    saveCalculation('Calcolo Costi', {
        product: product.name,
        quantity: quantity.toFixed(1) + ' ml',
        productCost: '€' + productCost.toFixed(2),
        laborCost: '€' + laborTotal.toFixed(2),
        totalCost: '€' + totalCost.toFixed(2)
    });
}

// Timer per fumigazione migliorato
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

// Gestione storico migliorata
function saveCalculation(type, data) {
    const calculation = {
        id: Date.now(),
        type: type,
        data: data,
        timestamp: new Date().toLocaleString('it-IT')
    };

    calculationHistory.unshift(calculation);
    if (calculationHistory.length > 100) {
        calculationHistory = calculationHistory.slice(0, 100);
    }

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

// Esportazione PDF dello storico
function exportHistory() {
    if (calculationHistory.length === 0) {
        alert('Nessun calcolo da esportare');
        return;
    }

    // Crea contenuto HTML per il PDF
    let htmlContent = `
        <html>
        <head>
            <title>PestCalc Pro - Storico Calcoli</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1e3c72; text-align: center; margin-bottom: 30px; }
                .calc-item { background: #f8f9fa; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #1e3c72; }
                .calc-item h3 { color: #1e3c72; margin-bottom: 10px; }
                .calc-item p { margin: 5px 0; }
                .timestamp { color: #666; font-style: italic; font-size: 0.9em; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <h1>PestCalc Pro - Storico Calcoli</h1>
    `;

    calculationHistory.forEach(calc => {
        htmlContent += `
            <div class="calc-item">
                <h3>${calc.type}</h3>
                ${Object.entries(calc.data).map(([key, value]) => 
                    `<p><strong>${key}:</strong> ${value}</p>`
                ).join('')}
                <p class="timestamp">Data: ${calc.timestamp}</p>
            </div>
        `;
    });

    htmlContent += `
            <div class="footer">
                Generato da PestCalc Pro il ${new Date().toLocaleString('it-IT')}
            </div>
        </body>
        </html>
    `;

    // Crea e scarica il file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pestcalc-storico-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Storico esportato con successo!');
}

// Richiedi permesso notifiche al caricamento
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    showMainMenu();
    updateProductSelects();

    // Aggiorna automaticamente percentuale quando cambia prodotto
    const productSelect = document.getElementById('product-select');
    if (productSelect) {
        productSelect.addEventListener('change', updateDilutionPercentage);
    }
});
