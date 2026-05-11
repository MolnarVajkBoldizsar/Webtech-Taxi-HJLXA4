document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    let neptun = urlParams.get('neptun');

    const modal = document.getElementById('neptun-modal');
    const modalInput = document.getElementById('modal-neptun-input');
    const modalBtn = document.getElementById('modal-submit-btn');
    const modalError = document.getElementById('modal-error');

    let allCars = []; 
    let API_URL = "";

    if (neptun) {
        modal.classList.add('hidden');
        initializeApp(neptun.toUpperCase());
    }

    modalBtn.onclick = () => {
        const val = modalInput.value.trim().toUpperCase();
        if (val.length < 3) {
            modalError.textContent = "Kérjük, adjon meg egy érvényes Neptun kódot!";
            modalError.classList.remove('hidden');
            return;
        }
        
        const newUrl = `${window.location.pathname}?neptun=${val}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        
        modal.classList.add('hidden');
        initializeApp(val);
    };

    function initializeApp(neptunCode) {
        neptun = neptunCode;
        API_URL = `https://iit-playground.arondev.hu/api/${neptun}/car`;
        document.getElementById('display-neptun').textContent = neptun;

        loadCars();
    }

    const showError = (msg) => {
        const div = document.getElementById('error-msg');
        div.textContent = msg;
        div.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => div.classList.add('hidden'), 5000);
    };

    async function loadCars() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("Hiba a szerverrel való kommunikációban.");
            allCars = await res.json();
            renderTable(allCars);
        } catch (e) {
            showError(e.message);
        }
    }

    function renderTable(cars) {
        const tbody = document.getElementById('cars-body');
        tbody.innerHTML = '';

        if (cars.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Nincsenek megjeleníthető járművek.</td></tr>';
            return;
        }

        cars.forEach(car => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${car.brand}</td>
                <td>${car.model}</td>
                <td>
                    <a href="details.html?neptun=${neptun}&id=${car.id}" class="btn primary" style="padding: 5px 10px; font-size: 0.8rem;">Szerkesztés</a>
                    <button class="btn delete-btn" data-id="${car.id}" style="background:#e74c3c; color:white; padding: 5px 10px; font-size: 0.8rem;">Törlés</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('create-form').onsubmit = async (e) => {
        e.preventDefault();

        const brand = document.getElementById('brand').value;
        const fuelUse = parseFloat(document.getElementById('fuelUse').value);
        const owner = document.getElementById('owner').value.trim();

        if (owner.length < 3 || !owner.includes(' ')) {
            showError("A tulajdonos neve legalább két tagból álljon (szóköz)! ");
            return;
        }

        const carData = {
            brand: brand,
            model: document.getElementById('model').value,
            owner: owner,
            fuelUse: fuelUse,
            electric: document.getElementById('electric').checked,
            dayOfCommission: document.getElementById('dayOfCommission').value,
            id: 0
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(carData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Mentési hiba történt.");
            
            e.target.reset();
            loadCars();
            alert("Autó sikeresen hozzáadva!");
        } catch (e) {
            showError(e.message);
        }
    };

    document.getElementById('cars-table').addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            
            if (!confirm("Biztosan törölni szeretné ezt a járművet?")) return;

            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    loadCars();
                } else {
                    const data = await res.json();
                    throw new Error(data.message || "Nem sikerült a törlés.");
                }
            } catch (error) {
                showError(error.message);
            }
        }
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredCars = allCars.filter(car => 
                car.brand.toLowerCase().includes(searchTerm) || 
                car.model.toLowerCase().includes(searchTerm)
            );
            renderTable(filteredCars);
        });
    }
});
