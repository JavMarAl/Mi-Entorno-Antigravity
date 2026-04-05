/**
 * MetaAnalysis Pro — Data Entry Module
 * 
 * Manages the interactive data table: adding/removing rows,
 * CSV import, paste data, column configuration per analysis type,
 * and data validation.
 */

const DataEntry = (() => {
    // Column definitions per analysis type
    const COLUMNS = {
        continuous: [
            { key: 'study', label: 'Estudio', type: 'text', placeholder: 'Autor Año', class: 'input-study' },
            { key: 'mean_exp', label: 'Media Exp', type: 'number', placeholder: '0.00' },
            { key: 'sd_exp', label: 'DE Exp', type: 'number', placeholder: '0.00' },
            { key: 'n_exp', label: 'N Exp', type: 'number', placeholder: '0', step: '1' },
            { key: 'mean_ctrl', label: 'Media Ctrl', type: 'number', placeholder: '0.00' },
            { key: 'sd_ctrl', label: 'DE Ctrl', type: 'number', placeholder: '0.00' },
            { key: 'n_ctrl', label: 'N Ctrl', type: 'number', placeholder: '0', step: '1' },
            { key: 'subgroup', label: 'Subgrupo (Opcional)', type: 'text', placeholder: 'Ej. Tratamiento' }
        ],
        binary: [
            { key: 'study', label: 'Estudio', type: 'text', placeholder: 'Autor Año', class: 'input-study' },
            { key: 'events_exp', label: 'Eventos Exp', type: 'number', placeholder: '0', step: '1' },
            { key: 'n_exp', label: 'N Exp', type: 'number', placeholder: '0', step: '1' },
            { key: 'events_ctrl', label: 'Eventos Ctrl', type: 'number', placeholder: '0', step: '1' },
            { key: 'n_ctrl', label: 'N Ctrl', type: 'number', placeholder: '0', step: '1' },
            { key: 'subgroup', label: 'Subgrupo (Opcional)', type: 'text', placeholder: 'Ej. Dosis' }
        ],
        correlation: [
            { key: 'study', label: 'Estudio', type: 'text', placeholder: 'Autor Año', class: 'input-study' },
            { key: 'r', label: 'r (Pearson)', type: 'number', placeholder: '0.00', step: '0.01' },
            { key: 'n', label: 'N', type: 'number', placeholder: '0', step: '1' },
            { key: 'subgroup', label: 'Subgrupo (Opcional)', type: 'text', placeholder: 'Ej. Demográfico' }
        ],
        precalc: [
            { key: 'study', label: 'Estudio', type: 'text', placeholder: 'Autor Año', class: 'input-study' },
            { key: 'es', label: 'Efecto (ES)', type: 'number', placeholder: '0.00' },
            { key: 'se', label: 'Error Estándar', type: 'number', placeholder: '0.00' },
            { key: 'subgroup', label: 'Moderador (Opcional)', type: 'text', placeholder: 'Ej. Grupo o Dosis' }
        ]
    };

    const EFFECT_MEASURES = {
        continuous: [
            { value: 'SMD', label: 'SMD (Hedges\' g)' },
            { value: 'MD', label: 'MD (Diferencia de Medias)' }
        ],
        binary: [
            { value: 'OR', label: 'OR (Odds Ratio)' },
            { value: 'RR', label: 'RR (Risk Ratio)' }
        ],
        correlation: [
            { value: 'ZCOR', label: 'Fisher\'s z (→ r)' }
        ],
        precalc: [
            { value: 'ES', label: 'Efecto Genérico' }
        ]
    };

    // Example datasets
    const EXAMPLES = {
        continuous: [
            { study: 'López 2019', mean_exp: 12.5, sd_exp: 3.2, n_exp: 45, mean_ctrl: 10.1, sd_ctrl: 3.5, n_ctrl: 42, subgroup: 'Europa' },
            { study: 'Chen 2020', mean_exp: 15.8, sd_exp: 4.1, n_exp: 62, mean_ctrl: 13.2, sd_ctrl: 3.8, n_ctrl: 58, subgroup: 'Asia' },
            { study: 'Müller 2021', mean_exp: 8.3, sd_exp: 2.7, n_exp: 38, mean_ctrl: 7.9, sd_ctrl: 2.9, n_ctrl: 35, subgroup: 'Europa' },
            { study: 'Patel 2018', mean_exp: 22.1, sd_exp: 5.6, n_exp: 89, mean_ctrl: 18.4, sd_ctrl: 5.2, n_ctrl: 85, subgroup: 'América' },
            { study: 'Johansson 2022', mean_exp: 9.7, sd_exp: 2.1, n_exp: 31, mean_ctrl: 8.5, sd_ctrl: 2.3, n_ctrl: 28, subgroup: 'Europa' },
            { study: 'García 2020', mean_exp: 14.2, sd_exp: 3.9, n_exp: 55, mean_ctrl: 11.8, sd_ctrl: 4.1, n_ctrl: 52, subgroup: 'Europa' },
            { study: 'Kim 2021', mean_exp: 11.6, sd_exp: 3.4, n_exp: 73, mean_ctrl: 10.9, sd_ctrl: 3.6, n_ctrl: 70, subgroup: 'Asia' },
            { study: 'Thompson 2019', mean_exp: 19.3, sd_exp: 4.8, n_exp: 48, mean_ctrl: 15.7, sd_ctrl: 4.5, n_ctrl: 45, subgroup: 'América' },
            { study: 'Nakamura 2020', mean_exp: 7.2, sd_exp: 1.9, n_exp: 36, mean_ctrl: 6.8, sd_ctrl: 2.0, n_ctrl: 33, subgroup: 'Asia' },
            { study: 'Fernández 2021', mean_exp: 16.5, sd_exp: 4.3, n_exp: 67, mean_ctrl: 14.1, sd_ctrl: 4.0, n_ctrl: 64, subgroup: 'Europa' },
            { study: 'Anderson 2019', mean_exp: 13.8, sd_exp: 3.7, n_exp: 52, mean_ctrl: 12.3, sd_ctrl: 3.5, n_ctrl: 49, subgroup: 'América' },
            { study: 'Dubois 2022', mean_exp: 10.4, sd_exp: 2.8, n_exp: 41, mean_ctrl: 8.7, sd_ctrl: 3.0, n_ctrl: 38, subgroup: 'Europa' }
        ],
        binary: [
            { study: 'López 2019', events_exp: 15, n_exp: 45, events_ctrl: 8, n_ctrl: 42, subgroup: '10' },
            { study: 'Chen 2020', events_exp: 22, n_exp: 62, events_ctrl: 14, n_ctrl: 58, subgroup: '20' },
            { study: 'Müller 2021', events_exp: 10, n_exp: 38, events_ctrl: 9, n_ctrl: 35, subgroup: '15' },
            { study: 'Patel 2018', events_exp: 35, n_exp: 89, events_ctrl: 22, n_ctrl: 85, subgroup: '50' },
            { study: 'García 2020', events_exp: 18, n_exp: 55, events_ctrl: 11, n_ctrl: 52, subgroup: '25' }
        ],
        correlation: [
            { study: 'López 2019', r: 0.42, n: 87, subgroup: '24' },
            { study: 'Chen 2020', r: 0.38, n: 120, subgroup: '65' },
            { study: 'Müller 2021', r: 0.55, n: 73, subgroup: '28' },
            { study: 'Patel 2018', r: 0.31, n: 174, subgroup: '72' },
            { study: 'García 2020', r: 0.47, n: 107, subgroup: '35' }
        ],
        precalc: [
            { study: 'López 2019', es: 0.45, se: 0.12, subgroup: '1' },
            { study: 'Chen 2020', es: 0.62, se: 0.15, subgroup: '2' },
            { study: 'Müller 2021', es: 0.28, se: 0.18, subgroup: '3' },
            { study: 'Patel 2018', es: 0.51, se: 0.09, subgroup: '4' },
            { study: 'García 2020', es: 0.38, se: 0.14, subgroup: '5' }
        ]
    };

    let currentType = 'continuous';

    function getColumns(type) {
        return COLUMNS[type || currentType];
    }

    function getEffectMeasures(type) {
        return EFFECT_MEASURES[type || currentType];
    }

    function setType(type) {
        currentType = type;
    }

    function getType() {
        return currentType;
    }

    /**
     * Render the table headers
     */
    function renderHeaders(thead, type) {
        const cols = COLUMNS[type];
        thead.innerHTML = '';
        const tr = document.createElement('tr');

        // Row number
        const thNum = document.createElement('th');
        thNum.textContent = '#';
        thNum.style.width = '40px';
        thNum.style.textAlign = 'center';
        tr.appendChild(thNum);

        for (const col of cols) {
            const th = document.createElement('th');
            th.textContent = col.label;
            tr.appendChild(th);
        }

        // Actions column
        const thAct = document.createElement('th');
        thAct.style.width = '40px';
        tr.appendChild(thAct);

        thead.appendChild(tr);
    }

    /**
     * Create a single row
     */
    function createRow(tbody, data = {}, index = 0) {
        const cols = COLUMNS[currentType];
        const tr = document.createElement('tr');
        tr.dataset.index = index;

        // Row number
        const tdNum = document.createElement('td');
        tdNum.className = 'row-number';
        tdNum.textContent = index + 1;
        tr.appendChild(tdNum);

        // Data cells
        for (const col of cols) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = col.type === 'number' ? 'number' : 'text';
            input.name = col.key;
            input.placeholder = col.placeholder || '';
            if (col.step) input.step = col.step;
            if (col.class) input.className = col.class;
            if (data[col.key] !== undefined && data[col.key] !== null) {
                input.value = data[col.key];
            }
            input.addEventListener('input', () => updateQuickStats());
            td.appendChild(input);
            tr.appendChild(td);
        }

        // Delete button
        const tdAct = document.createElement('td');
        tdAct.className = 'cell-action';
        const btnDel = document.createElement('button');
        btnDel.className = 'btn-delete-row';
        btnDel.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        btnDel.title = 'Eliminar estudio';
        btnDel.addEventListener('click', () => {
            tr.remove();
            renumberRows(tbody);
            updateQuickStats();
        });
        tdAct.appendChild(btnDel);
        tr.appendChild(tdAct);

        tbody.appendChild(tr);
        return tr;
    }

    function renumberRows(tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, i) => {
            row.dataset.index = i;
            row.querySelector('.row-number').textContent = i + 1;
        });
    }

    /**
     * Get all study data from the table
     */
    function getStudies(tbody) {
        const rows = tbody.querySelectorAll('tr');
        const cols = COLUMNS[currentType];
        const studies = [];

        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const study = {};
            let hasData = false;

            inputs.forEach((input, i) => {
                const col = cols[i];
                if (col.type === 'number') {
                    const val = parseFloat(input.value);
                    study[col.key] = isNaN(val) ? null : val;
                    if (!isNaN(val)) hasData = true;
                } else {
                    study[col.key] = input.value.trim();
                    if (input.value.trim()) hasData = true;
                }
            });

            if (hasData) studies.push(study);
        });

        return studies;
    }

    /**
     * Validate study data
     */
    function validate(studies, type) {
        const errors = [];
        const cols = COLUMNS[type];

        if (studies.length < 2) {
            errors.push('Se necesitan al menos 2 estudios para un metaanálisis');
            return errors;
        }

        studies.forEach((study, i) => {
            const name = study.study || `Estudio ${i + 1}`;
            const numCols = cols.filter(c => c.type === 'number');

            for (const col of numCols) {
                if (study[col.key] === null || study[col.key] === undefined) {
                    errors.push(`${name}: falta ${col.label}`);
                }
            }

            // Type-specific validations
            if (type === 'continuous') {
                if (study.sd_exp !== null && study.sd_exp <= 0) errors.push(`${name}: DE Exp debe ser > 0`);
                if (study.sd_ctrl !== null && study.sd_ctrl <= 0) errors.push(`${name}: DE Ctrl debe ser > 0`);
                if (study.n_exp !== null && study.n_exp < 2) errors.push(`${name}: N Exp debe ser ≥ 2`);
                if (study.n_ctrl !== null && study.n_ctrl < 2) errors.push(`${name}: N Ctrl debe ser ≥ 2`);
            }
            if (type === 'binary') {
                if (study.events_exp > study.n_exp) errors.push(`${name}: Eventos Exp > N Exp`);
                if (study.events_ctrl > study.n_ctrl) errors.push(`${name}: Eventos Ctrl > N Ctrl`);
            }
            if (type === 'correlation') {
                if (study.r !== null && (study.r < -1 || study.r > 1)) errors.push(`${name}: r debe estar entre -1 y 1`);
                if (study.n !== null && study.n < 4) errors.push(`${name}: N debe ser ≥ 4`);
            }
        });

        return errors;
    }

    /**
     * Update sidebar quick stats
     */
    function updateQuickStats() {
        const tbody = document.getElementById('table-body');
        if (!tbody) return;
        const studies = getStudies(tbody);
        const k = studies.length;

        let totalN = 0;
        if (currentType === 'continuous' || currentType === 'binary') {
            totalN = studies.reduce((s, st) => s + (st.n_exp || 0) + (st.n_ctrl || 0), 0);
        } else if (currentType === 'correlation') {
            totalN = studies.reduce((s, st) => s + (st.n || 0), 0);
        } else {
            totalN = k; // precalc has no N
        }

        const typeLabels = {
            continuous: 'Continuo', binary: 'Binario',
            correlation: 'Correlación', precalc: 'Pre-calculado'
        };

        document.getElementById('stat-k').textContent = k;
        document.getElementById('stat-n').textContent = totalN.toLocaleString();
        document.getElementById('stat-type').textContent = typeLabels[currentType] || currentType;
    }

    /**
     * Parse CSV/TSV text into study objects
     */
    function parseCSV(text, hasHeader = true) {
        const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return [];

        // Detect separator
        const sep = lines[0].includes('\t') ? '\t' : ',';
        const rows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^["']|["']$/g, '')));

        const cols = COLUMNS[currentType];
        let dataRows = rows;

        if (hasHeader) {
            dataRows = rows.slice(1);
        }

        return dataRows.map(row => {
            const study = {};
            cols.forEach((col, i) => {
                if (i < row.length) {
                    if (col.type === 'number') {
                        const val = parseFloat(row[i]);
                        study[col.key] = isNaN(val) ? null : val;
                    } else {
                        study[col.key] = row[i];
                    }
                }
            });
            return study;
        });
    }

    /**
     * Load data into table
     */
    function loadData(tbody, studies) {
        tbody.innerHTML = '';
        studies.forEach((study, i) => createRow(tbody, study, i));
        updateQuickStats();
    }

    /**
     * Export data as CSV string
     */
    function toCSV(studies) {
        const cols = COLUMNS[currentType];
        const header = cols.map(c => c.label).join(',');
        const rows = studies.map(s => cols.map(c => s[c.key] ?? '').join(','));
        return [header, ...rows].join('\n');
    }

    function getExampleData(type) {
        return EXAMPLES[type] || EXAMPLES.continuous;
    }

    return {
        COLUMNS,
        getColumns,
        getEffectMeasures,
        setType,
        getType,
        renderHeaders,
        createRow,
        renumberRows,
        getStudies,
        validate,
        updateQuickStats,
        parseCSV,
        loadData,
        toCSV,
        getExampleData
    };
})();
