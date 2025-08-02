// Funzioni di conversione unità di misura
const unitConverter = {
  volume: {
    ml: { L: 0.001, factor: 1 },
    L: { ml: 1000, factor: 1 }
  },
  area: {
    mq: { sqft: 10.7639, factor: 1 },
    sqft: { mq: 0.092903, factor: 1 }
  },
  volumeFumo: {
    mc: { cuft: 35.3147, factor: 1 },
    cuft: { mc: 0.0283168, factor: 1 }
  }
};

// Funzione di validazione generica
function validateInput(value, min, max, name) {
  if (isNaN(value) || value === '') {
    return { valid: false, message: `Inserire un valore valido per ${name}` };
  }
  if (value < min) {
    return { valid: false, message: `${name} non può essere inferiore a ${min}` };
  }
  if (max && value > max) {
    return { valid: false, message: `${name} non può superare ${max}` };
  }
  return { valid: true };
}

// Calcolo diluizione migliorato
function calcolaDiluizione() {
  const output = document.getElementById('output-diluizione');
  output.className = 'output';
  
  const concentrazione = parseFloat(document.getElementById('concentrazione').value);
  const volume = parseFloat(document.getElementById('volume').value);
  const volumeUnit = document.getElementById('volume-unit').value;
  
  // Validazione
  const validConc = validateInput(concentrazione, 0.1, 100, 'la concentrazione');
  if (!validConc.valid) {
    output.textContent = validConc.message;
    output.classList.add('error');
    return;
  }
  
  const validVolume = validateInput(volume, 10, 10000, 'il volume');
  if (!validVolume.valid) {
    output.textContent = validVolume.message;
    output.classList.add('error');
    return;
  }
  
  // Conversione unità se necessario
  const volumeInMl = volume * (volumeUnit === 'L' ? 1000 : 1);
  
  // Calcolo
  const mlPrincipioAttivo = (concentrazione / 100) * volumeInMl;
  const mlSolvente = volumeInMl - mlPrincipioAttivo;
  
  // Risultato formattato
  let result = `🔹 ${mlPrincipioAttivo.toFixed(1)} ml di principio attivo (${concentrazione}%)`;
  result += `\n🔹 ${mlSolvente.toFixed(1)} ml di solvente`;
  result += `\n🔹 Totale: ${volumeInMl.toFixed(1)} ml di soluzione`;
  
  if (volumeInMl >= 1000) {
    result += ` (${(volumeInMl/1000).toFixed(2)} L)`;
  }
  
  output.textContent = result;
  output.classList.add('success');
}

// Calcolo saturazione migliorato
function calcolaSaturazione() {
  const output = document.getElementById('output-saturazione');
  output.className = 'output';
  
  const mq = parseFloat(document.getElementById('mq').value);
  const dose = parseFloat(document.getElementById('dose').value);
  const areaUnit = document.getElementById('area-unit').value;
  const doseUnit = document.getElementById('dose-unit').value;
  
  // Validazione
  const validArea = validateInput(mq, 1, 10000, 'la superficie');
  if (!validArea.valid) {
    output.textContent = validArea.message;
    output.classList.add('error');
    return;
  }
  
  const validDose = validateInput(dose, 1, 1000, 'la dose');
  if (!validDose.valid) {
    output.textContent = validDose.message;
    output.classList.add('error');
    return;
  }
  
  // Conversione unità
  const mqConvertiti = mq * unitConverter.area[areaUnit].factor;
  const doseInMl = dose * (doseUnit === 'L' ? 1000 : 1);
  
  // Calcolo
  const mlTotali = mqConvertiti * doseInMl;
  
  // Risultato formattato
  let result = `🔹 Superficie: ${mqConvertiti.toFixed(1)} m²`;
  result += `\n🔹 Dose: ${doseInMl.toFixed(1)} ml/m²`;
  result += `\n🔹 Totale soluzione: ${mlTotali.toFixed(1)} ml`;
  
  if (mlTotali >= 1000) {
    result += ` (${(mlTotali/1000).toFixed(2)} L)`;
  }
  
  output.textContent = result;
  output.classList.add('success');
}

// Calcolo fumigazione migliorato
function calcolaFumigazione() {
  const output = document.getElementById('output-fumigazione');
  output.className = 'output';
  
  const mc = parseFloat(document.getElementById('mc').value);
  const doseFumo = parseFloat(document.getElementById('dose-fumo').value);
  const volumeUnit = document.getElementById('volume-unit-fumo').value;
  const doseUnit = document.getElementById('dose-unit-fumo').value;
  
  // Validazione
  const validVolume = validateInput(mc, 1, 10000, 'il volume');
  if (!validVolume.valid) {
    output.textContent = validVolume.message;
    output.classList.add('error');
    return;
  }
  
  const validDose = validateInput(doseFumo, 1, 500, 'la dose');
  if (!validDose.valid) {
    output.textContent = validDose.message;
    output.classList.add('error');
    return;
  }
  
  // Conversione unità
  const mcConvertiti = mc * unitConverter.volumeFumo[volumeUnit].factor;
  const doseInMl = doseFumo * (doseUnit === 'L' ? 1000 : 1);
  
  // Calcolo
  const mlTotali = mcConvertiti * doseInMl;
  
  // Risultato formattato
  let result = `🔹 Volume: ${mcConvertiti.toFixed(1)} m³`;
  result += `\n🔹 Dose: ${doseInMl.toFixed(1)} ml/m³`;
  result += `\n🔹 Quantità fumigante: ${mlTotali.toFixed(1)} ml`;
  
  if (mlTotali >= 1000) {
    result += ` (${(mlTotali/1000).toFixed(2)} L)`;
  }
  
  output.textContent = result;
  output.classList.add('success');
}

// Calcolo costi completo
function calcolaCosti() {
  const output = document.getElementById('output-costi');
  output.className = 'output';
  
  const prezzo = parseFloat(document.getElementById('prezzo').value);
  const mlusati = parseFloat(document.getElementById('mlusati').value);
  const costoUnit = document.getElementById('costo-unit').value;
  const manodopera = parseFloat(document.getElementById('manodopera').value) || 0;
  const tempo = parseFloat(document.getElementById('tempo').value) || 0;
  
  // Validazione
  const validPrezzo = validateInput(prezzo, 0.01, 1000, 'il prezzo');
  if (!validPrezzo.valid) {
    output.textContent = validPrezzo.message;
    output.classList.add('error');
    return;
  }
  
  const validMl = validateInput(mlusati, 1, 100000, 'la quantità usata');
  if (!validMl.valid) {
    output.textContent = validMl.message;
    output.classList.add('error');
    return;
  }
  
  // Conversione unità
  const mlConvertiti = mlusati * (costoUnit === 'L' ? 1000 : 1);
  
  // Calcoli
  const costoProdotto = (prezzo / 1000) * mlConvertiti;
  const costoManodopera = manodopera * tempo;
  const costoTotale = costoProdotto + costoManodopera;
  
  // Risultato formattato
  let result = `🔹 Costo prodotto: €${costoProdotto.toFixed(2)}`;
  
  if (manodopera > 0 && tempo > 0) {
    result += `\n🔹 Manodopera (${tempo}h × €${manodopera}/h): €${costoManodopera.toFixed(2)}`;
    result += `\n🔹 Costo totale: €${costoTotale.toFixed(2)}`;
  }
  
  output.textContent = result;
  output.classList.add('success');
}

// Caricamento valori salvati
function loadSavedValues() {
  document.querySelectorAll('input[type="number"], select').forEach(el => {
    const savedValue = localStorage.getItem(`pestcalc_${el.id}`);
    if (savedValue !== null) {
      el.value = savedValue;
    }
  });
}

// Salvataggio valori
function setupAutoSave() {
  document.querySelectorAll('input[type="number"], select').forEach(el => {
    el.addEventListener('change', function() {
      localStorage.setItem(`pestcalc_${this.id}`, this.value);
    });
  });
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  loadSavedValues();
  setupAutoSave();
  
  // Calcoli automatici quando tutti i campi sono compilati
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
      const section = this.closest('section');
      if (section) {
        const inputs = section.querySelectorAll('input[type="number"]');
        const allFilled = Array.from(inputs).every(i => i.value && !isNaN(i.value));
        if (allFilled) {
          const button = section.querySelector('button');
          if (button) button.click();
        }
      }
    });
  });
});
