document.addEventListener('DOMContentLoaded', () => {
    // Determine the current view from the data-view attribute
    const viewContainer = document.getElementById('view-container');
    if (!viewContainer) return;
    
    const currentView = viewContainer.dataset.view;

    const modalOverlay = document.getElementById('modal-overlay');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const createForm = document.getElementById('create-form');

    // General Modal logic (if UI has modal)
    if (openModalBtn && modalOverlay) {
        openModalBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'flex';
        });
    }

    if (closeModalBtn && modalOverlay) {
        closeModalBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-form')) {
                modalOverlay.style.display = 'none';
            }
        });
    }

    // Form Submit Handler
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(createForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                const res = await fetch(`/api/v1/${currentView}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await res.json();
                if (res.ok) {
                    showToast(`${currentView} created successfully!`);
                    modalOverlay.style.display = 'none';
                    createForm.reset();
                    loadData(currentView); // Refresh Current View
                } else {
                    showToast(result.message || 'Creation failed', 'error');
                }
            } catch (err) {
                showToast('Network error', 'error');
            }
        });
    }

    // Initial Data Load
    loadData(currentView);

    async function loadData(view) {
        const tableBody = document.getElementById('table-body');
        
        switch (view) {
            case 'dashboard':
                await renderDashboard();
                break;
            case 'brands':
            case 'units':
            case 'suppliers':
                if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><div class="loader">Loading...</div></td></tr>';
                const data = await fetchData(view);
                renderTable(view, data.data || []);
                break;
        }
    }

    async function fetchData(endpoint) {
        try {
            const res = await fetch(`/api/v1/${endpoint}`);
            return await res.json();
        } catch (err) {
            console.error(err);
            return { data: [] };
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    async function renderDashboard() {
        const [b, u, s] = await Promise.all([
            fetchData('brands'),
            fetchData('units'),
            fetchData('suppliers')
        ]);

        viewContainer.innerHTML = `
            <div class="view-header">
                <div class="view-title">
                    <h1>Dashboard</h1>
                    <p>Standardized operational overview.</p>
                </div>
            </div>
            <div class="stats-row">
                <div class="stat-card">
                    <p class="stat-label">Total Brands</p>
                    <p class="stat-value">${b.pagination?.total || 0}</p>
                </div>
                <div class="stat-card">
                    <p class="stat-label">Active Units</p>
                    <p class="stat-value">${u.pagination?.total || 0}</p>
                </div>
                <div class="stat-card">
                    <p class="stat-label">Vendors</p>
                    <p class="stat-value">${s.pagination?.total || 0}</p>
                </div>
                <div class="stat-card">
                    <p class="stat-label">Reliability</p>
                    <p class="stat-value">98.4%</p>
                </div>
            </div>
            <div class="data-table-container">
                <div style="padding: 40px; text-align: center; color: var(--text-muted);">
                    <h3>Performance Overview</h3>
                    <p>Select a category from the sidebar to manage specific data.</p>
                </div>
            </div>
        `;
    }

    function renderTable(type, items) {
        const tableBody = document.getElementById('table-body');
        if (!tableBody) return;

        let rows = '';
        
        if (items.length === 0) {
            rows = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 50px;">No records found. Click New to add one.</td></tr>`;
        } else {
            items.forEach(item => {
                if (type === 'brands') {
                    rows += `
                        <tr>
                            <td>
                                <div class="cell-main">${item.name}</div>
                                <div class="cell-sub">${item.slug}</div>
                            </td>
                            <td>${item.code}</td>
                            <td>${item.countryOfOrigin || 'N/A'}</td>
                            <td><span class="badge badge-${item.status}">${item.status}</span></td>
                            <td style="text-align: right;"><button class="icon-btn">•••</button></td>
                        </tr>
                    `;
                } else if (type === 'units') {
                    rows += `
                        <tr>
                            <td>
                                <div class="cell-main">${item.name}</div>
                                <div class="cell-sub">${item.symbol || ''}</div>
                            </td>
                            <td>${item.code}</td>
                            <td>Precision: ${item.precision}</td>
                            <td><span class="badge badge-${item.status}">${item.status}</span></td>
                            <td style="text-align: right;"><button class="icon-btn">•••</button></td>
                        </tr>
                    `;
                } else if (type === 'suppliers') {
                    rows += `
                        <tr>
                            <td>
                                <div class="cell-main">${item.name}</div>
                                <div class="cell-sub">${item.contactName || 'No contact'}</div>
                            </td>
                            <td>${item.code}</td>
                            <td>${item.phone || item.email || 'N/A'}</td>
                            <td><span class="badge badge-${item.status}">${item.status}</span></td>
                            <td style="text-align: right;"><button class="icon-btn">•••</button></td>
                        </tr>
                    `;
                }
            });
        }
        tableBody.innerHTML = rows;
    }
});
