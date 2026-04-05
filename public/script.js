document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Sidebar Fragment
    await loadSidebar();

    // 2. Determine the current view from the data-view attribute
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
            const payload = {};
            
            for (const [key, value] of formData.entries()) {
                if (!value && value !== 0) continue;
                
                if (key.includes('.')) {
                    const [parent, child] = key.split('.');
                    if (!payload[parent]) payload[parent] = {};
                    payload[parent][child] = value;
                } else {
                    payload[key] = value;
                }
            }

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

    // Search Logic for Products
    const productSearchInput = document.getElementById('product-search');
    let searchTimeout;
    if (productSearchInput) {
        productSearchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadData('products', { search: query });
            }, 400); // Debounce
        });
    }

    // Variants Modal Logic
    const variantModal = document.getElementById('variants-modal-overlay');
    const closeVariantBtn = document.getElementById('close-variants-modal');
    const addVariantForm = document.getElementById('add-variant-form');

    if (closeVariantBtn) {
        closeVariantBtn.onclick = () => variantModal.style.display = 'none';
    }

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('manage-variants')) {
            const pid = e.target.dataset.id;
            document.getElementById('variant-parent-id').value = pid;
            variantModal.style.display = 'flex';
            loadVariants(pid);
        }

        // Delete Variant handled via event delegation
        if (e.target.classList.contains('delete-v')) {
            const vid = e.target.dataset.id;
            if (confirm('Are you sure you want to deactivate this variant?')) {
                const res = await fetch(`/api/v1/product-variants/${vid}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Variant Deactivated');
                    loadVariants(document.getElementById('variant-parent-id').value);
                }
            }
        }

        // Edit Variant (Placeholder logic - can be expanded to a dynamic form)
        if (e.target.classList.contains('edit-v')) {
            const vid = e.target.dataset.id;
            showToast('Editing feature is coming soon!', 'info');
        }
    });

    if (addVariantForm) {
        addVariantForm.onsubmit = async (e) => {
            e.preventDefault();
            const pid = document.getElementById('variant-parent-id').value;
            const attrName = document.getElementById('attr-name').value;
            
            // Generate SKU from single input
            const sku = `V-${pid.slice(-4).toUpperCase()}-${attrName.replace(/\s+/g, '-').toUpperCase()}`;
            
            const payload = {
                sku: sku,
                attributes: { "Property": attrName } // Store as single property
            };

            try {
                const res = await fetch(`/api/v1/product-variants/${pid}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    showToast('Variant Created');
                    addVariantForm.reset();
                    loadVariants(pid);
                } else {
                    const err = await res.json();
                    showToast(err.message, 'error');
                }
            } catch (err) {
                showToast('Failed to create variant', 'error');
            }
        };
    }

    async function loadVariants(pid) {
        const tbody = document.getElementById('variants-table-body');
        tbody.innerHTML = '<tr><td colspan="5" align="center">Loading...</td></tr>';
        
        try {
            const res = await fetch(`/api/v1/product-variants/product/${pid}`);
            const json = await res.json();
            const variants = json.data || [];
            
            let html = '';
            if (variants.length === 0) {
                html = '<tr><td colspan="3" align="center">No variants found.</td></tr>';
            } else {
                variants.forEach(v => {
                    const attrs = Object.entries(v.attributes || {}).map(([k,vl]) => `${k}: ${vl}`).join(', ');
                    html += `
                        <tr>
                            <td>
                                <div class="cell-main">${attrs || 'Default'}</div>
                                <div class="cell-sub">SKU: ${v.sku}</div>
                            </td>
                            <td><span class="badge badge-${v.status}">${v.status}</span></td>
                            <td style="text-align: right;">
                                <button class="icon-btn edit-v" data-id="${v._id}" title="Edit">✏️</button>
                                <button class="icon-btn delete-v" data-id="${v._id}" title="Delete" style="color: var(--error)">🗑️</button>
                            </td>
                        </tr>
                    `;
                });
            }
            tbody.innerHTML = html;
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="3" align="center" style="color:red">Error loading variants.</td></tr>';
        }
    }

    async function loadData(view, params = {}) {
        const tableBody = document.getElementById('table-body');
        
        switch (view) {
            case 'dashboard':
                await renderDashboard();
                break;
            case 'brands':
            case 'units':
            case 'suppliers':
            case 'products':
            case 'categories':
                if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><div class="loader">Loading...</div></td></tr>';
                const queryString = new URLSearchParams(params).toString();
                const data = await fetchWithQuery(view, queryString);
                renderTable(view, data.data || []);
                updateStats(view, data);
                break;
        }
    }

    async function fetchWithQuery(endpoint, query) {
        try {
            const url = query ? `/api/v1/${endpoint}?${query}` : `/api/v1/${endpoint}`;
            const res = await fetch(url);
            return await res.json();
        } catch (err) {
            console.error(err);
            return { data: [] };
        }
    }

    function updateStats(view, data) {
        const stats = data.pagination || {};
        const items = data.data || [];
        
        const total = document.getElementById('stat-total');
        const active = document.getElementById('stat-active');
        const draft = document.getElementById('stat-draft');
        
        if (total) total.textContent = stats.total ?? items.length;
        if (active) active.textContent = items.filter(i => i.status === 'active').length;
        if (draft) draft.textContent = items.filter(i => (i.status === 'draft' || i.status === 'inactive')).length;
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

    async function loadSidebar() {
        const sidebarTarget = document.getElementById('sidebar-target');
        if (!sidebarTarget) return;

        try {
            const response = await fetch('/fragments/sidebar.html');
            const html = await response.text();
            sidebarTarget.innerHTML = html;

            // Highlight Active Link
            const currentView = document.getElementById('view-container')?.dataset.view;
            if (currentView) {
                const activeLink = document.getElementById(`nav-${currentView}`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }

            // Sync User Info if Session Exists
            try {
                const userRes = await fetch('/api/v1/auth/me');
                if (userRes.ok) {
                    const userData = await userRes.json();
                    document.getElementById('sidebar-username').textContent = userData.data.username;
                    document.getElementById('sidebar-role').textContent = userData.data.role;
                    document.getElementById('sidebar-avatar').src = `https://ui-avatars.com/api/?name=${userData.data.username}&background=004f69&color=fff`;
                }
            } catch (e) {
                // Not logged in or endpoint not available, keep default
            }

        } catch (err) {
            console.error('Failed to load sidebar:', err);
        }
    }

    async function renderDashboard() {
        const [b, u, s, p, c] = await Promise.all([
            fetchData('brands'),
            fetchData('units'),
            fetchData('suppliers'),
            fetchData('products'),
            fetchData('categories')
        ]);

        viewContainer.innerHTML = `
            <div class="view-header">
                <div class="view-title">
                    <h1>Dashboard</h1>
                    <p>Standardized operational overview.</p>
                </div>
            </div>
            <div class="stats-row">
                <a href="/products" class="stat-card" style="text-decoration: none; display: block; border: 1px solid var(--outline-variant); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)'">
                    <p class="stat-label">Total SKUs</p>
                    <p class="stat-value">${p.pagination?.total || 0}</p>
                </a>
                <a href="/units.html" class="stat-card" style="text-decoration: none; display: block; border: 1px solid var(--outline-variant); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)'">
                    <p class="stat-label">Active Units</p>
                    <p class="stat-value">${u.pagination?.total || 0}</p>
                </a>
                <a href="/suppliers.html" class="stat-card" style="text-decoration: none; display: block; border: 1px solid var(--outline-variant); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)'">
                    <p class="stat-label">Vendors</p>
                    <p class="stat-value">${s.pagination?.total || 0}</p>
                </a>
                <a href="/categories.html" class="stat-card" style="text-decoration: none; display: block; border: 1px solid var(--outline-variant); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='none'; this.style.boxShadow='var(--shadow-sm)'">
                    <p class="stat-label">Categories</p>
                    <p class="stat-value">${c.pagination?.total || 0}</p>
                </a>
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
            const cols = type === 'products' ? 7 : 5;
            rows = `<tr><td colspan="${cols}" style="text-align: center; color: var(--text-muted); padding: 50px;">No records found. Click New to add one.</td></tr>`;
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
                } else if (type === 'categories') {
                    rows += `
                        <tr>
                            <td>
                                <div class="cell-main">${item.name}</div>
                                <div class="cell-sub">${item.slug}</div>
                            </td>
                            <td>${item.code}</td>
                            <td>${item.parent?.name || 'Top Level'}</td>
                            <td><span class="badge badge-${item.status}">${item.status}</span></td>
                            <td style="text-align: right;"><button class="icon-btn">•••</button></td>
                        </tr>
                    `;
                } else if (type === 'products') {
                    rows += `
                        <tr>
                            <td>
                                <div class="cell-main">${item.name}</div>
                                <div class="cell-sub">${item.uom?.name || 'Item'}</div>
                            </td>
                            <td>
                                <div class="cell-main">${item.sku}</div>
                                <div class="cell-sub">${item.barcode || 'No barcode'}</div>
                            </td>
                            <td>
                                <button class="btn btn-outline btn-sm manage-variants" data-id="${item._id}" style="padding: 4px 8px; font-size: 0.75rem;">Manage Variants</button>
                            </td>
                            <td>
                                <div class="cell-main">${item.category?.name || 'Uncategorized'}</div>
                                <div class="cell-sub">${item.brand?.name || 'No brand'}</div>
                            </td>
                            <td class="cell-main">$${(item.price?.sale || 0).toFixed(2)}</td>
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
