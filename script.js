// Paste the URL you got from deploying your Google Apps Script here
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQeGjDYRoKBU8xVKBxI2TBYTbf0fh7gsiWV6A0sJtumReyhkq40UrWY04Ek4Wkcro/exec';
let inventoryData = {}; // Store fetched data globally to help with lookups

// --- DATA FETCHING AND RENDERING ---

async function fetchData() {
    document.body.style.cursor = 'wait';
    try {
        const response = await fetch(SCRIPT_URL);
        inventoryData = await response.json();
        renderAll();
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Could not fetch data. Check the console for errors.');
    } finally {
        document.body.style.cursor = 'default';
    }
}

function renderAll() {
    // Render inventory lists
    renderList('cases', 'CaseID', item => `<strong>${item.Name}</strong><span>Brand: ${item.Brand || 'N/A'} | Color: ${item.Color || 'N/A'}</span><span>Notes: ${item.Notes || ''}</span>`);
    renderList('switches', 'SwitchID', item => `<strong>${item.Name}</strong><span>Brand: ${item.Brand || 'N/A'} | Type: ${item.Type || 'N/A'} | Qty: ${item.Quantity || 'N/A'}</span><span>Notes: ${item.Notes || ''}</span>`);
    renderList('stabs', 'StabID', item => `<strong>${item.Name}</strong><span>Brand: ${item.Brand || 'N/A'} | Color: ${item.Color || 'N/A'} | Size: ${item.KitSize || 'N/A'}</span><span>Notes: ${item.Notes || ''}</span>`);
    renderList('keycaps', 'KeycapID', item => `<strong>${item.Name}</strong><span>Brand: ${item.Brand || 'N/A'} | Profile: ${item.Profile || 'N/A'} | Material: ${item.Material || 'N/A'}</span><span>Notes: ${item.Notes || ''}</span>`);
    
    // Render dropdowns for the build form
    populateSelect('select[name="CaseID"]', inventoryData.cases, 'CaseID', 'Name');
    populateSelect('select[name="SwitchID"]', inventoryData.switches, 'SwitchID', 'Name');
    populateSelect('select[name="StabID"]', inventoryData.stabs, 'StabID', 'Name');
    populateSelect('select[name="KeycapID"]', inventoryData.keycaps, 'KeycapID', 'Name');

    // Render the final keyboard builds
    renderKeyboards();
}

function renderList(category, idKey, templateFn) {
    const listElement = document.getElementById(`${category}-list`);
    if (!listElement) return;
    listElement.innerHTML = ''; // Clear previous items

    if (inventoryData[category]) {
        inventoryData[category].forEach(item => {
            const li = document.createElement('li');
            const details = document.createElement('div');
            details.className = 'item-details';
            details.innerHTML = templateFn(item);
            
            li.appendChild(details);
            li.appendChild(createDeleteButton(item[idKey], category.charAt(0).toUpperCase() + category.slice(1)));
            listElement.appendChild(li);
        });
    }
}

function populateSelect(selector, data, valueKey, textKey) {
    const select = document.querySelector(selector);
    if (!select) return;
    // Reset the dropdown
    select.innerHTML = `<option value="">Select ${selector.split('"')[1].replace('ID','')}...</option>`; 
    if (!data) return;

    // First, count how many times each name appears
    const nameCounts = data.reduce((acc, item) => {
        const name = item[textKey];
        if (name) { // Ensure name is not null or undefined
            acc[name] = (acc[name] || 0) + 1;
        }
        return acc;
    }, {});

    // Now, create the options with the new logic
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];

        let displayText = item[textKey];
        // If the item's name appears more than once AND it has a non-empty "Color" property...
        if (nameCounts[displayText] > 1 && item.Color) {
            displayText += ` (${item.Color})`;
        }
        
        option.textContent = displayText;
        select.appendChild(option);
    });
}

function renderKeyboards() {
    const list = document.getElementById('keyboards-list');
    if (!list) return;
    list.innerHTML = '';

    if (inventoryData.keyboards) {
        inventoryData.keyboards.forEach(build => {
            // Find the names of the parts using their IDs
            const caseName = findPartById(inventoryData.cases, 'CaseID', build.CaseID)?.Name || 'Unknown Case';
            const switchName = findPartById(inventoryData.switches, 'SwitchID', build.SwitchID)?.Name || 'Unknown Switches';
            const stabName = findPartById(inventoryData.stabs, 'StabID', build.StabID)?.Name || 'Unknown Stabs';
            const keycapName = findPartById(inventoryData.keycaps, 'KeycapID', build.KeycapID)?.Name || 'Unknown Keycaps';

            const li = document.createElement('li');
            const details = document.createElement('div');
            details.className = 'item-details';
            details.innerHTML = `
                <strong>${build.BuildName}</strong>
                <span><strong>Case:</strong> ${caseName}</span>
                <span><strong>Switches:</strong> ${switchName}</span>
                <span><strong>Stabs:</strong> ${stabName}</span>
                <span><strong>Keycaps:</strong> ${keycapName}</span>
            `;

            li.appendChild(details);
            li.appendChild(createDeleteButton(build.KeyboardID, 'Keyboards'));
            list.appendChild(li);
        });
    }
}

// --- UTILITY AND HELPER FUNCTIONS ---

function findPartById(partsArray, idKey, id) {
    if (!partsArray) return null;
    return partsArray.find(part => part[idKey] == id);
}

function createDeleteButton(id, sheetName) {
    const button = document.createElement('button');
    button.textContent = '✕';
    button.className = 'delete-btn';
    button.dataset.id = id;
    button.dataset.sheet = sheetName;
    return button;
}

async function postData(action, payload) {
    document.body.style.cursor = 'wait';
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action, payload })
        });
        await response.json(); // Wait for the backend to finish
        await fetchData(); // Refresh all data
    } catch (error) {
        console.error('Error posting data:', error);
    } finally {
        document.body.style.cursor = 'default';
    }
}

// --- EVENT LISTENERS ---

function setupFormListener(formId, sheetName) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            postData('addPart', { sheetName, data });
            e.target.reset();
        });
    }
}

document.getElementById('create-keyboard-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    postData('createKeyboard', payload);
    e.target.reset();
});

document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('delete-btn')) {
        const { id, sheet } = e.target.dataset;
        if (confirm(`Are you sure you want to delete this item from ${sheet}?`)) {
             postData('deletePart', { sheetName: sheet, id });
        }
    }
});

// Initial Load
setupFormListener('add-case-form', 'Cases');
setupFormListener('add-switch-form', 'Switches');
setupFormListener('add-stab-form', 'Stabs');
setupFormListener('add-keycap-form', 'Keycaps');
fetchData();