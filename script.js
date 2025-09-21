// ==================== DATABASE E VARIABILI GLOBALI ====================
let customProducts;
try {
    customProducts = JSON.parse(localStorage.getItem('pestcalc_custom_products')) || [];
    if (!Array.isArray(customProducts)) customProducts = [];
} catch (e) { customProducts = []; }

let calculationHistory = JSON.parse(localStorage.getItem('pestcalc_history')) || [];
let previousSection = null;
let fumigationTimer = null;
let timerStartTime = parseInt(localStorage.getItem('pestcalc_timerStartTime')) || null;
let timerDuration = parseInt(localStorage.getItem('pestcalc_timerDuration')) || 0;
let lastCalculatedQuantity = 0;

// ==================== NAVIGAZIONE SEZIONI ====================
function hideAllSections() {
    document.querySelectorAll('.calculator-section, .main-menu').forEach(sec => sec.style.display = 'none');
}

function showMainMenu() {
    hideAllSections();
    document.getElementById('main-menu').style.display = 'block';
    document.querySelector('.app-header').style.display = 'block';
    previousSection = null;
}

function showSection(section) {
    hideAllSections();
    document.getElementById(section).style.display = 'block';
    document.querySelector('.app-header').style.display = section === 'main-menu' ? 'block' : 'none';
    previousSection = section;
    updateAllSelects();
}

function returnToPreviousSection() {
    if (previousSection) showSection(previousSection);
    else showMainMenu();
}

// ==================== SELECTS ====================
function updateSelect(selectId, includeCustom = true, defaultOption = 'Seleziona...') {
    const select = document.getElementById(selectId);
    if (!select) return;
    let html = `<option value="">${defaultOption}</option>`;
    customProducts.forEach((p, idx) => html += `<option value="${idx}">${p.name}</option>`);
    if (includeCustom) html += `<option value="custom">Personalizzato</option>`;
    select.innerHTML = html;
}

function updateAllSelects() {
    ['product-select','saturation-product','fumigant','cost-product'].forEach(updateSelect);
}

// ==================== FUNZIONI SUPPORTO ====================
function showError(element, message) {
    const el = element || document.body;
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    el.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function showSuccess(element, message) {
    const el = element || document.body;
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    el.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ==================== GESTIONE PRODOTTI PERSONALIZZATI ====================
function addCustomProduct() {
    const name = document.getElementById('new-product-name').value.trim();
    const type = document.getElementById('new-product-type').value;
    const formulation = document.getElementById('new-product-formulation').value;
    const concentration = parseFloat(document.getElementById('new-product-concentration').value);
    const dilution = parseFloat(document.getElementById('new-product-dilution').value);
    const price = parseFloat(document.getElementById('new-product-price').value);
    const saturationDose = parseFloat(document.getElementById('new-product-saturation-dose').value);
    const fumigantDose = parseFloat(document.getElementById('new-product-fumigant-dose').value);
    const addBtn = document.querySelector('.calculate-btn');

    if (!name || name.length < 3) return showError(addBtn,'Il nome deve essere di almeno 3 caratteri');
    if (!concentration || concentration <=0 || concentration>100) return showError(addBtn,'La concentrazione deve essere tra 0.1% e 100%');
    if (!dilution || dilution <=0 || dilution>10) return showError(addBtn,'La diluizione deve essere tra 0.01% e 10%');
    if (price && price<=0) return showError(addBtn,'Il prezzo deve essere positivo');
    if (saturationDose && saturationDose<=0) return showError(addBtn,'Dosaggio saturazione positivo richiesto');
    if (fumigantDose && fumigantDose<=0) return showError(addBtn,'Dosaggio fumigante positivo richiesto');

    const newProduct = { id: Date.now(), name, type, formulation, concentration, recommendedDilution:dilution, price:price||0, saturationDose:saturationDose||null, fumigantDose:fumigantDose||null, custom:true };

    addBtn.classList.add('loading'); addBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Aggiungendo...';
    setTimeout(()=>{
        customProducts.push(newProduct);
        localStorage.setItem('pestcalc_custom_products',JSON.stringify(customProducts));
        ['new-product-name','new-product-concentration','new-product-dilution','new-product-price','new-product-saturation-dose','new-product-fumigant-dose'].forEach(id=>document.getElementById(id).value='');
        updateAllSelects();
        addBtn.classList.remove('loading'); addBtn.innerHTML='<i class="fas fa-plus"></i> Aggiungi Prodotto';
        showSuccess(addBtn,'✅ Prodotto aggiunto!');
    },600);
}

function deleteCustomProduct(idx) {
    if(confirm('Sei sicuro di eliminare questo prodotto?')){
        customProducts.splice(idx,1);
        localStorage.setItem('pestcalc_custom_products',JSON.stringify(customProducts));
        updateAllSelects();
    }
}

// ==================== CALCOLI ====================
// --- Diluizione ---
function calculateDilution() {
    const productIdx = document.getElementById('product-select').value;
    const percentage = parseFloat(document.getElementById('dilution-percentage').value);
    const volume = parseFloat(document.getElementById('solution-volume').value);
    const unit = document.getElementById('volume-unit').value;
    const calcBtn = document.querySelector('#dilution-calc .calculate-btn');
    if(!productIdx) return showError(calcBtn,'Seleziona un prodotto');
    if(!percentage||!volume) return showError(calcBtn,'Inserisci tutti i valori');
    if(percentage>10) showError(calcBtn,'⚠️ Percentuale molto alta!');

    calcBtn.classList.add('loading'); calcBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Calcolando...';
    setTimeout(()=>{
        const volumeLitri = unit==='L'?volume:volume/1000;
        const concentrateML = (percentage/100)*volumeLitri*1000;
        lastCalculatedQuantity = concentrateML;
        const product = customProducts[productIdx];
        const productName = product?product.name:'Prodotto personalizzato';
        const result = document.getElementById('dilution-result');
        result.innerHTML=`
            <h3><i class="fas fa-check-circle"></i> Risultato</h3>
            <div>Aggiungi <strong>${concentrateML.toFixed(1)} ml</strong> di ${productName} a <strong>${volume} ${unit}</strong> di acqua</div>
        `;
        calcBtn.classList.remove('loading'); calcBtn.innerHTML='<i class="fas fa-calculator"></i> Calcola Diluizione';
        saveCalculation('Diluizione',{product:productName,percentage:percentage+'%',volume:volume+' '+unit,concentrate:concentrateML.toFixed(1)+' ml'});
        showSuccess(calcBtn,'✅ Diluizione calcolata!');
    },500);
}

// --- Saturazione ---
function calculateSaturation() {
    const productIdx = document.getElementById('saturation-product').value;
    const area = parseFloat(document.getElementById('room-area').value);
    const height = parseFloat(document.getElementById('room-height').value);
    const calcBtn = document.querySelector('#saturation-calc .calculate-btn');
    if(!productIdx) return showError(calcBtn,'Seleziona prodotto');
    if(!area||!height) return showError(calcBtn,'Inserisci area e altezza');

    const product = customProducts[productIdx];
    const volume = area*height;
    const dose = product.saturationDose||0;
    const total = volume*dose;
    document.getElementById('saturation-result').textContent=`Volume stanza: ${volume.toFixed(1)} m³, Dosaggio totale: ${total.toFixed(1)} ml`;
    saveCalculation('Saturazione',{product:product.name,area, height, volume:volume.toFixed(1)+' m³',dose:total.toFixed(1)+' ml'});
    showSuccess(calcBtn,'✅ Saturazione calcolata!');
}

// --- Fumigazione ---
function calculateFumigation() {
    const fumIdx = document.getElementById('fumigant').value;
    const type = document.getElementById('fumigation-type').value;
    const area = parseFloat(document.getElementById('fum-area').value)||0;
    const height = parseFloat(document.getElementById('fum-height').value)||0;
    const weight = parseFloat(document.getElementById('product-weight').value)||0;
    const calcBtn = document.querySelector('#fumigation-calc .calculate-btn');
    if(!fumIdx) return showError(calcBtn,'Seleziona fumigante');

    const product = customProducts[fumIdx];
    let volume=0;
    if(type==='volume') volume=area*height;
    else volume=weight*1.5;

    const dose = product.fumigantDose||0;
    const total = volume*dose;
    document.getElementById('fumigation-result').textContent=`Volume calcolato: ${volume.toFixed(1)} m³, Dosaggio totale: ${total.toFixed(1)} ml`;
    saveCalculation('Fumigazione',{product:product.name,volume:volume.toFixed(1)+' m³',dose:total.toFixed(1)+' ml'});
    showSuccess(calcBtn,'✅ Fumigazione calcolata!');
}

// --- Calcolo costi ---
function calculateCost() {
    const productIdx = document.getElementById('cost-product').value;
    const quantity = parseFloat(document.getElementById('cost-quantity').value);
    const calcBtn = document.querySelector('#cost-calc .calculate-btn');
    if(!productIdx) return showError(calcBtn,'Seleziona prodotto');
    if(!quantity) return showError(calcBtn,'Inserisci quantità');

    const product = customProducts[productIdx];
    const price = product.price || 0;
    const totalCost = price*quantity;
    document.getElementById('cost-result').textContent=`Costo totale: €${totalCost.toFixed(2)}`;
    saveCalculation('Costo',{product:product.name,quantity,total:totalCost.toFixed(2)+'€'});
    showSuccess(calcBtn,'✅ Costo calcolato!');
}

// ==================== TIMER FUMIGAZIONE ====================
function startFumigationTimer(durationSec) {
    clearFumigationTimer();
    timerStartTime = Date.now();
    timerDuration = durationSec;
    localStorage.setItem('pestcalc_timerStartTime',timerStartTime);
    localStorage.setItem('pestcalc_timerDuration',timerDuration);

    fumigationTimer=setInterval(()=>{
        const elapsed = Math.floor((Date.now()-timerStartTime)/1000);
        const remaining = Math.max(0,timerDuration-elapsed);
        document.getElementById('fumigation-timer-display').textContent=formatTime(remaining);
        if(remaining<=0){
            clearFumigationTimer();
            showSuccess(null,'✅ Fumigazione completata!');
        }
    },1000);
}

function clearFumigationTimer(){
    if(fumigationTimer) clearInterval(fumigationTimer);
    fumigationTimer=null;
    localStorage.removeItem('pestcalc_timerStartTime');
    localStorage.removeItem('pestcalc_timerDuration');
    document.getElementById('fumigation-timer-display').textContent='00:00';
}

function formatTime(sec){
    const m=String(Math.floor(sec/60)).padStart(2,'0');
    const s=String(sec%60).padStart(2,'0');
    return `${m}:${s}`;
}

// ==================== STORICO ====================
function saveCalculation(type,details){
    calculationHistory.unshift({id:Date.now(),type,details,date:new Date().toLocaleString()});
    if(calculationHistory.length>100) calculationHistory.pop();
    localStorage.setItem('pestcalc_history',JSON.stringify(calculationHistory));
}

function displayHistory(){
    const container=document.getElementById('history-list');
    if(!container) return;
    container.innerHTML='';
    calculationHistory.forEach(calc=>{
        const el=document.createElement('div');
        el.className='history-item';
        el.innerHTML=`<div class="history-header"><strong>${calc.type}</strong> - ${calc.date}</div><div class="history-details">${JSON.stringify(calc.details)}</div>`;
        container.appendChild(el);
    });
}

// ==================== ESPORTAZIONE CSV ====================
function exportHistoryCSV(){
    if(!calculationHistory.length) return showError(null,'Nessun calcolo da esportare');
    let csv='Tipo,Data,Dettagli\n';
    calculationHistory.forEach(h=>{
        const details=JSON.stringify(h.details).replace(/,/g,';');
        csv+=`${h.type},${h.date},${details}\n`;
    });
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='pestcalc_history.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ==================== INIT ====================
window.addEventListener('load',()=>{
    updateAllSelects();
    if(timerStartTime && timerDuration){
        const elapsed=Math.floor((Date.now()-timerStartTime)/1000);
        const remaining=Math.max(0,timerDuration-elapsed);
        if(remaining>0) startFumigationTimer(remaining);
    }
});
