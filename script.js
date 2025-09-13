// Paste the URL you got from deploying your Google Apps Script here
const SCRIPT_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';

// Function to fetch all data from the spreadsheet
async function fetchData() {
    document.body.style.cursor = 'wait';
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    renderLists(data);
    document.body.style.cursor = 'default';
}

// Function to display ALL the data on the page
function renderLists(data) {
    const lists = {
        cases: document.getElementById('cases-list'),
        switches: document.getElementById('switches-list')
        // Add stabs and keycaps here later
    };

    // Clear all lists before rendering
    Object.values(lists).forEach(list => { if(list) list.innerHTML = ''; });

    // Render Cases
    if (data.cases && lists.cases) {
        data.cases.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.Name} (${item.Brand || 'N/A'})`;
            const deleteButton = createDeleteButton(item.CaseID, 'Cases');
            li.appendChild(deleteButton);
            lists.cases.appendChild(li);
        });
    }

    // Render Switches
    if (data.switches && lists.switches) {
        data.switches.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.Name} (${item.Brand || 'N/A'})`;
            const deleteButton = createDeleteButton(item.SwitchID, 'Switches');
            li.appendChild(deleteButton);
            lists.switches.appendChild(li);
        });
    }
}

// Helper function to create a delete button
function createDeleteButton(id, sheetName) {
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.className = 'delete-btn';
    button.dataset.id = id;
    button.dataset.sheet = sheetName;
    return button;
}


// Generic function to send data to the backend (for adding/deleting)
async function postData(action, payload) {
    document.body.style.cursor = 'wait';
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action, payload })
        });
        const result = await response.json();
        console.log(result);
        await fetchData(); // Refresh the data on the page after action
    } catch (error) {
        console.error('Error posting data:', error);
    } finally {
        document.body.style.cursor = 'default';
    }
}

// Event listener for the 'Add Case' form
document.getElementById('add-case-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
        sheetName: 'Cases',
        data: {
            Name: e.target.Name.value,
            Brand: e.target.Brand.value
        }
    };
    postData('addPart', payload);
    e.target.reset();
});

// Event listener for the 'Add Switch' form
document.getElementById('add-switch-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
        sheetName: 'Switches',
        data: {
            Name: e.target.Name.value,
            Brand: e.target.Brand.value
        }
    };
    postData('addPart', payload);
    e.target.reset();
});


// Event listener for all delete buttons (uses event delegation)
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const sheetName = e.target.dataset.sheet;

        if (confirm(`Are you sure you want to delete this item?`)) {
             const payload = { sheetName, id };
             postData('deletePart', payload);
        }
    }
});


// Initial fetch of data when the page loads
fetchData();