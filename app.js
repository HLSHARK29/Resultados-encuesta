/**
 * APP: Dashboard - Análisis de Encuestas
 * Ajustes: Implementación de Firebase Firestore para persistencia de datos.
 * PARTE 1 DE 2
 */

// --- 1. CONFIGURACIÓN DE FIREBASE (IMPORTACIONES) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDhGeyuwMCXhJ3vnOBq2fAHrVOR-ikuJ0Y",
    authDomain: "encuesta-dc51b.firebaseapp.com",
    projectId: "encuesta-dc51b",
    storageBucket: "encuesta-dc51b.firebasestorage.app",
    messagingSenderId: "617380151220",
    appId: "1:617380151220:web:13265f507c0f935bb23ce1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. ESTADO GLOBAL Y EVENTOS ---
document.getElementById('masterExcel').addEventListener('change', handleMasterFile);

let dataState = {
    participacion: [],
    respuestasConsolidadas: [],
    totalInvalidados: 0,
    conteoProblemas: { "Sí": 0, "No": 0 },
    comentariosProblemas: [],
    metricasValor: {
        impacto: {}, 
        valor: {}, 
        continuidad: { "Sí": 0, "No": 0 },
        comentariosContinuidad: []
    },
    metricasFinanciamiento: {
        conteo: {},
        sugerencias: []
    },
    metricasServicio: {
        conteo: { "Servicio Actual": 0, "Empresa Privada": 0, "Otro / Sugerencias": 0 },
        comentarios: []
    },
    comentariosMejora: [],
    metricasRepresentantes: {
        conoce: {},
        funcion: {},
        satisfaccion: {},
        atencion: {}
    },
    metricasPorteros: {
        satisfaccionLaboral: {},
        sueldoAdecuado: {},
        herramientasApoyo: {},
        comentariosMejora: [],
        turnosHorarios: {},
        tratoReconocimiento: {},
        mejorasCaseta: [],
        experienciaGeneral: []
    }
};

// --- 3. FUNCIONES DE PERSISTENCIA (FIREBASE) ---

async function publicarResultados() {
    try {
        // Guardamos el objeto dataState completo en la colección "resultados"
        await setDoc(doc(db, "resultados", "encuesta_actual"), dataState);
        alert("✅ ¡Éxito! Los resultados ahora son públicos para todos los usuarios.");
    } catch (error) {
        console.error("Error al publicar:", error);
        alert("❌ Error al subir los datos a Firebase.");
    }
}

async function cargarResultadosDesdeNube() {
    try {
        const docRef = doc(db, "resultados", "encuesta_actual");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            dataState = docSnap.data();
            console.log("Datos recuperados de Firebase");
            
            // --- AQUÍ ESTÁ EL CAMBIO ---
            if (typeof actualizarUI === "function") { 
                actualizarUI(); 
            }
            // ---------------------------

            document.getElementById('waitingMessage').classList.add('hidden');
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }
}

// Intentar cargar datos automáticamente al entrar a la web
window.addEventListener('DOMContentLoaded', cargarResultadosDesdeNube);

const MAPEO_FINANCIAMIENTO = {
    "Aportando un poco más al mes para destinarlo a los proyectos de mejora.": "Aportación mensual",
    "Con aportaciones independientes cada vez que se proponga un proyecto específico.": "Aportación por proyecto",
    "No realizar aportaciones adicionales; mantener la cuota mensual actual sin cambios.": "Mantener cuota actual",
    "Otra / sugerencia": "Otra / Sugerencia"
};

Chart.register(ChartDataLabels);

// --- 4. LÓGICA MODO ADMINISTRADOR ---
let esAdmin = false;
const secretLogo = document.getElementById('secretLogo');
const passwordModal = document.getElementById('passwordModal');
const adminPass = document.getElementById('adminPass');
const btnEntrar = document.getElementById('btnEntrar');
const btnCerrar = document.getElementById('btnCerrar');
const adminStickyBar = document.getElementById('adminStickyBar');
const uploadSection = document.getElementById('uploadSection');
const waitingMessage = document.getElementById('waitingMessage');

const idsIA = ['txtAnalisisIA_1', 'txtAnalisisIA_2', 'txtAnalisisIA_3', 'txtAnalisisIA_4', 'txtAnalisisIA_5', 'txtAnalisisIA_6', 'txtAnalisisIA_7', 'txtAnalisisIA_8'];

function validarAcceso() {
    if (adminPass.value === "Admin2026") {
        activarModoAdmin();
        passwordModal.classList.add('hidden');
    } else { alert("Contraseña incorrecta."); }
}

btnEntrar.addEventListener('click', validarAcceso);
adminPass.addEventListener('keypress', (e) => { if (e.key === 'Enter') validarAcceso(); });

secretLogo.addEventListener('click', () => {
    if (!esAdmin) {
        passwordModal.classList.remove('hidden');
        adminPass.value = '';
        adminPass.focus();
    } else { salirModoAdmin(); }
});

btnCerrar.addEventListener('click', () => passwordModal.classList.add('hidden'));

function activarModoAdmin() {
    esAdmin = true;
    adminStickyBar.classList.remove('hidden');
    uploadSection.classList.remove('hidden');
    waitingMessage.classList.add('hidden');
    document.querySelectorAll('.btn-copy-prompt').forEach(btn => btn.classList.remove('hidden'));
    
    idsIA.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.removeAttribute('readonly');
            el.style.border = "1px dashed #00acc1";
            el.style.background = "#fff";
        }
    });
}
document.getElementById('btnPublicar').addEventListener('click', publicarResultados);

function salirModoAdmin() {
    esAdmin = false;
    adminStickyBar.classList.add('hidden');
    uploadSection.classList.add('hidden');
    document.querySelectorAll('.btn-copy-prompt').forEach(btn => btn.classList.add('hidden'));
    
    idsIA.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.setAttribute('readonly', true);
            el.style.border = "1px dashed transparent";
            el.style.background = "transparent";
        }
    });
}

// --- PROCESAMIENTO DE EXCEL ---
async function handleMasterFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    
    const hojaDuplicados = XLSX.utils.sheet_to_json(workbook.Sheets["Duplicados"] || {});
    const hojaNoContrib = XLSX.utils.sheet_to_json(workbook.Sheets["No Contribuyentes"] || {});
    dataState.totalInvalidados = hojaDuplicados.length + hojaNoContrib.length;

    const hojaUniverso = XLSX.utils.sheet_to_json(workbook.Sheets["Contribuyentes"] || {});
    const universoPlazas = {};
    hojaUniverso.forEach(f => {
        const plaza = f["Plaza"] || f["Privada"] || f["PRIVADA"];
        if (plaza) universoPlazas[plaza] = (universoPlazas[plaza] || 0) + 1;
    });

    const rawResidentes = XLSX.utils.sheet_to_json(workbook.Sheets["Respuestas Residentes"] || {});
    const rawPorteros = XLSX.utils.sheet_to_json(workbook.Sheets["Respuestas Porteros"] || {});

    dataState.respuestasConsolidadas = [
        ...rawResidentes.map(f => consolidarFila(f, 'residente')),
        ...rawPorteros.map(f => consolidarFila(f, 'portero'))
    ];

    dataState.participacion = Object.keys(universoPlazas).map(plaza => {
        const respondieron = dataState.respuestasConsolidadas.filter(r => r.plaza === plaza).length;
        const total = universoPlazas[plaza];
        return { plaza, total, respondieron };
    });

    // Reset de métricas
    let siCountProb = 0, noCountProb = 0, siCountCont = 0, noCountCont = 0;
    dataState.comentariosProblemas = [];
    dataState.metricasValor.comentariosContinuidad = [];
    dataState.metricasValor.impacto = {};
    dataState.metricasValor.valor = {};
    dataState.metricasFinanciamiento.conteo = {};
    dataState.metricasFinanciamiento.sugerencias = [];
    dataState.metricasServicio.conteo = { "Servicio Actual": 0, "Empresa Privada": 0, "Otro / Sugerencias": 0 };
    dataState.metricasServicio.comentarios = [];
    dataState.comentariosMejora = [];
    dataState.metricasRepresentantes = { conoce: {}, funcion: {}, satisfaccion: {}, atencion: {} };
    
    // Reset Porteros Completo
    dataState.metricasPorteros = { 
        satisfaccionLaboral: {}, sueldoAdecuado: {}, herramientasApoyo: {}, comentariosMejora: [],
        turnosHorarios: {}, tratoReconocimiento: {}, mejorasCaseta: [], experienciaGeneral: []
    };

    dataState.respuestasConsolidadas.forEach(r => {
        // Lógica Residentes (Problemas, Valor, Continuidad...)
        const respProb = String(r.problemaCaseta || '').trim().toLowerCase();
        if (respProb.startsWith('s') || respProb === 'sí' || respProb === 'si') {
            siCountProb++;
            if (r.comentarios && r.comentarios.length > 2) dataState.comentariosProblemas.push({ plaza: r.plaza, texto: r.comentarios });
        } else if (respProb !== "") { noCountProb++; }

        if (r.impacto) dataState.metricasValor.impacto[r.impacto] = (dataState.metricasValor.impacto[r.impacto] || 0) + 1;
        if (r.valor) dataState.metricasValor.valor[r.valor] = (dataState.metricasValor.valor[r.valor] || 0) + 1;
        
        const respCont = String(r.continuidad || '').trim().toLowerCase();
        if (respCont.startsWith('s') || respCont === 'sí' || respCont === 'si') {
            siCountCont++;
            if (r.comentarios && r.comentarios.length > 2) dataState.metricasValor.comentariosContinuidad.push({ plaza: r.plaza, texto: r.comentarios });
        } else if (respCont !== "") { noCountCont++; }

        if (r.finanPreferencia) {
            const labelCorta = MAPEO_FINANCIAMIENTO[r.finanPreferencia] || "Otra / Sugerencia";
            dataState.metricasFinanciamiento.conteo[labelCorta] = (dataState.metricasFinanciamiento.conteo[labelCorta] || 0) + 1;
        }
        if (r.finanSugerencia && r.finanSugerencia.length > 2) dataState.metricasFinanciamiento.sugerencias.push({ plaza: r.plaza, texto: r.finanSugerencia });

        const respServ = String(r.preferenciaServicio || '').toLowerCase();
        if (respServ.includes('conforme') || respServ.includes('actual')) dataState.metricasServicio.conteo["Servicio Actual"]++;
        else if (respServ.includes('privada') || respServ.includes('empresa')) dataState.metricasServicio.conteo["Empresa Privada"]++;
        else if (respServ !== "null" && respServ !== "" && respServ !== "undefined") dataState.metricasServicio.conteo["Otro / Sugerencias"]++;
        
        if (r.comentariosPreferencia && String(r.comentariosPreferencia).length > 2) dataState.metricasServicio.comentarios.push({ plaza: r.plaza, texto: r.comentariosPreferencia });
        if (r.mejoraAspectos && r.mejoraAspectos.length > 2) dataState.comentariosMejora.push({ plaza: r.plaza, texto: r.mejoraAspectos });

        // Representantes
        if (r.repConoce) dataState.metricasRepresentantes.conoce[r.repConoce] = (dataState.metricasRepresentantes.conoce[r.repConoce] || 0) + 1;
        if (r.repFuncion) dataState.metricasRepresentantes.funcion[r.repFuncion] = (dataState.metricasRepresentantes.funcion[r.repFuncion] || 0) + 1;
        if (r.repSatisfaccion) dataState.metricasRepresentantes.satisfaccion[r.repSatisfaccion] = (dataState.metricasRepresentantes.satisfaccion[r.repSatisfaccion] || 0) + 1;
        if (r.repAtencion) dataState.metricasRepresentantes.atencion[r.repAtencion] = (dataState.metricasRepresentantes.atencion[r.repAtencion] || 0) + 1;

        // Porteros (Bloque 8 y Bloque 10)
        if (r.tipo === 'portero') {
            if (r.satisLaboral) dataState.metricasPorteros.satisfaccionLaboral[r.satisLaboral] = (dataState.metricasPorteros.satisfaccionLaboral[r.satisLaboral] || 0) + 1;
            if (r.sueldoAdecuado) dataState.metricasPorteros.sueldoAdecuado[r.sueldoAdecuado] = (dataState.metricasPorteros.sueldoAdecuado[r.sueldoAdecuado] || 0) + 1;
            if (r.herramientas) dataState.metricasPorteros.herramientasApoyo[r.herramientas] = (dataState.metricasPorteros.herramientasApoyo[r.herramientas] || 0) + 1;
            if (r.mejoraPortero && r.mejoraPortero.length > 2) dataState.metricasPorteros.comentariosMejora.push({ plaza: r.plaza, texto: r.mejoraPortero });
            
            // Datos nuevos Bloque 10
            if (r.turnos) dataState.metricasPorteros.turnosHorarios[r.turnos] = (dataState.metricasPorteros.turnosHorarios[r.turnos] || 0) + 1;
            if (r.trato) dataState.metricasPorteros.tratoReconocimiento[r.trato] = (dataState.metricasPorteros.tratoReconocimiento[r.trato] || 0) + 1;
            if (r.mejorasCaseta && r.mejorasCaseta.length > 2) dataState.metricasPorteros.mejorasCaseta.push({ plaza: r.plaza, texto: r.mejorasCaseta });
            if (r.expPortero && r.expPortero.length > 2) dataState.metricasPorteros.experienciaGeneral.push({ plaza: r.plaza, texto: r.expPortero });
        }
    });

    dataState.conteoProblemas = { "Sí": siCountProb, "No": noCountProb };
    dataState.metricasValor.continuidad = { "Sí": siCountCont, "No": noCountCont };

    actualizarUI();
}
/**
 * PARTE 2 DE 2
 * Orden de renderizado: Participación -> Residentes -> Representantes -> PORTEROS (Bloque 8 y 10).
 */

function consolidarFila(f, tipo) {
    function buscarValor(fila, palabrasClave) {
        const cabeceras = Object.keys(fila);
        for (let p of palabrasClave) {
            const col = cabeceras.find(c => c.toLowerCase().includes(p.toLowerCase()));
            if (col && fila[col] !== "" && fila[col] !== undefined) return fila[col];
        }
        return null;
    }
    return {
        tipo,
        plaza: buscarValor(f, ["Privada", "Plaza", "PRIVADA"]) || "Sin Plaza",
        satisfaccion: Number(buscarValor(f, ["satisfacción general"]) || 0),
        comentarios: buscarValor(f, ["comentario sobre inconformidades", "comentario", "sugerencia"]) || "",
        problemaCaseta: buscarValor(f, ["problema", "inconformidad", "funcionamiento de la caseta"]) || "No",
        impacto: buscarValor(f, ["impacto", "percepción", "imagen del fraccionamiento"]),
        valor: buscarValor(f, ["vale la pena", "costo", "servicio que recibes"]),
        continuidad: buscarValor(f, ["dejado de participar", "pensado en hacerlo"]),
        finanPreferencia: buscarValor(f, ["preferirías que se financiaran"]),
        finanSugerencia: buscarValor(f, ["sugieres que se financien"]),
        preferenciaServicio: buscarValor(f, ["conforme con el servicio", "seguridad privada", "empresa de seguridad"]),
        comentariosPreferencia: buscarValor(f, ["Anota tus sugerencias", "por qué", "justificación"]),
        mejoraAspectos: buscarValor(f, ["mejorar", "aspectos que deberían mejorarse"]),
        // Bloque 7: Representantes
        repConoce: buscarValor(f, ["Conoces quién o quiénes son el o los representantes"]),
        repFuncion: buscarValor(f, ["Sabes cuál es la función principal que cumplen"]),
        repSatisfaccion: buscarValor(f, ["tan satisfecho estás con el desempeño del o los representantes"]),
        repAtencion: buscarValor(f, ["Consideras que el representante atiende adecuadamente"]),
        // Bloque 8: Porteros
        satisLaboral: buscarValor(f, ["satisfecho estás con tu trabajo en la caseta"]),
        sueldoAdecuado: buscarValor(f, ["sueldo que recibes es adecuado"]),
        herramientas: buscarValor(f, ["Cuentas con todo lo necesario", "equipo, instalaciones, apoyo"]),
        mejoraPortero: buscarValor(f, ["¿Qué te falta o podría mejorar?", "comentarios del personal"]),
        // NUEVO Bloque 10: Experiencia y Entorno
        turnos: buscarValor(f, ["¿Qué tan manejables te parecen los turnos y horarios actuales?"]),
        trato: buscarValor(f, ["¿Cómo percibes el trato y reconocimiento que recibes"]),
        mejorasCaseta: buscarValor(f, ["¿Qué cambios o mejoras propondrías para facilitar tu trabajo en la caseta?"]),
        expPortero: buscarValor(f, ["¿Quieres agregar algún comentario sobre tu experiencia como portero?"])
    };
}

function actualizarUI() {
    document.getElementById('dashboard').classList.remove('hidden');
    waitingMessage.classList.add('hidden');
    document.getElementById('txtTotal').textContent = dataState.respuestasConsolidadas.length;
    document.getElementById('txtInvalidados').textContent = dataState.totalInvalidados;
    
    if (dataState.respuestasConsolidadas.length > 0) {
        const sumaSat = dataState.respuestasConsolidadas.reduce((acc, curr) => acc + curr.satisfaccion, 0);
        document.getElementById('txtSentimiento').textContent = (sumaSat / dataState.respuestasConsolidadas.length).toFixed(1) + " / 5";
    }

    // Listados (Residentes y Representantes)
    document.getElementById('comentariosProblemas').innerHTML = dataState.comentariosProblemas.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin comentarios.</p>`;
    document.getElementById('comentariosContinuidad').innerHTML = dataState.metricasValor.comentariosContinuidad.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin comentarios.</p>`;
    document.getElementById('comentariosFinanciamiento').innerHTML = dataState.metricasFinanciamiento.sugerencias.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin sugerencias.</p>`;
    document.getElementById('comentariosPreferencia').innerHTML = dataState.metricasServicio.comentarios.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin comentarios.</p>`;
    document.getElementById('comentariosMejora').innerHTML = dataState.comentariosMejora.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin sugerencias de mejora.</p>`;
    
    // Bloque 8: Porteros
    const containerPorteros = document.getElementById('comentariosPorteros');
    if (containerPorteros) {
        containerPorteros.innerHTML = dataState.metricasPorteros.comentariosMejora.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin comentarios del personal.</p>`;
    }

    // NUEVOS Listados Bloque 10
    const containerMejorasCaseta = document.getElementById('comentariosMejorasCaseta');
    if(containerMejorasCaseta) {
        containerMejorasCaseta.innerHTML = dataState.metricasPorteros.mejorasCaseta.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin propuestas.</p>`;
    }
    const containerExpPortero = document.getElementById('comentariosExperienciaPortero');
    if(containerExpPortero) {
        containerExpPortero.innerHTML = dataState.metricasPorteros.experienciaGeneral.map(c => `<p class="opinion-item"><strong>${c.plaza}:</strong> ${c.texto}</p>`).join('') || `<p class="placeholder">Sin comentarios adicionales.</p>`;
    }

    // --- NUEVO: CARGAR TEXTOS DE ANÁLISIS IA GUARDADOS ---
    if (dataState.analisisIA) {
        Object.keys(dataState.analisisIA).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = dataState.analisisIA[id];
            }
        });
    }
    // ----------------------------------------------------

    generarAnalisisAutomatico();
    renderCharts();
}

function generarAnalisisAutomatico() {
    const txt4 = document.getElementById('txtAnalisisIA_4');
    if (txt4 && (!esAdmin || txt4.value.trim() === "")) {
        const actual = dataState.metricasServicio.conteo["Servicio Actual"] || 0;
        const privada = dataState.metricasServicio.conteo["Empresa Privada"] || 0;
        txt4.value = actual > privada ? "Preferencia: Servicio Actual." : (privada > actual ? "Preferencia: Seguridad Privada." : "Empate técnico.");
    }
}

function renderCharts() {
    if (window.activeCharts) { window.activeCharts.forEach(c => c.destroy()); }
    window.activeCharts = [];

    const opt = { responsive: true, maintainAspectRatio: false, plugins: { datalabels: { color: '#fff', font: { weight: 'bold' } } } };

    const draw = (id, type, labels, data, colors) => {
        const canvas = document.getElementById(id);
        if(!canvas) return;
        window.activeCharts.push(new Chart(canvas.getContext('2d'), { 
            type, 
            data: { labels, datasets: [{ data, backgroundColor: colors }] }, 
            options: opt 
        }));
    };

    // 1. Participación (Corregido con formato: % (Actual/Total))
    const ctxPart = document.getElementById('chartParticipacion')?.getContext('2d');
    if(ctxPart) {
        window.activeCharts.push(new Chart(ctxPart, {
            type: 'doughnut',
            data: {
                labels: dataState.participacion.map(p => p.plaza),
                datasets: [{ 
                    data: dataState.participacion.map(p => p.respondieron), 
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] 
                }]
            },
            options: { 
                ...opt, 
                plugins: { 
                    ...opt.plugins, 
                    datalabels: { 
                        ...opt.plugins.datalabels, 
                        formatter: (value, ctx) => {
                            // Buscamos los datos de la plaza actual usando el índice
                            const p = dataState.participacion[ctx.dataIndex];
                            
                            // Si por algo no hay datos, ponemos 0
                            if (!p || p.total === 0) return '0%';
                            
                            // Calculamos el porcentaje
                            const percentage = ((p.respondieron / p.total) * 100).toFixed(0);
                            
                            // Devolvemos el texto con el formato: 92% (23/25)
                            return `${percentage}% (${p.respondieron}/${p.total})`;
                        }
                    }
                }
            }
        }));
    }

    // 2. Gráficos Residentes y Representantes
    draw('chartProblemasCaseta', 'pie', ['Sí', 'No'], [dataState.conteoProblemas["Sí"], dataState.conteoProblemas["No"]], ['#ef5350', '#66bb6a']);
    draw('chartImpacto', 'bar', Object.keys(dataState.metricasValor.impacto).sort(), Object.values(dataState.metricasValor.impacto), '#42a5f5');
    draw('chartValor', 'bar', Object.keys(dataState.metricasValor.valor).sort(), Object.values(dataState.metricasValor.valor), '#673ab7');
    draw('chartContinuidad', 'pie', ['Sí', 'No'], [dataState.metricasValor.continuidad["Sí"], dataState.metricasValor.continuidad["No"]], ['#ba68c8', '#4db6ac']);
    draw('chartFinanciamiento', 'pie', Object.keys(dataState.metricasFinanciamiento.conteo), Object.values(dataState.metricasFinanciamiento.conteo), ['#4CAF50', '#2196F3', '#F44336']);
    draw('chartPreferenciaServicio', 'pie', Object.keys(dataState.metricasServicio.conteo), Object.values(dataState.metricasServicio.conteo), ['#009688', '#ff7043', '#9e9e9e']);
    
    const colRep = ['#546e7a', '#78909c', '#90a4ae', '#b0bec5', '#cfd8dc'];
    draw('chartConoceRep', 'pie', Object.keys(dataState.metricasRepresentantes.conoce), Object.values(dataState.metricasRepresentantes.conoce), colRep);
    draw('chartFuncionRep', 'pie', Object.keys(dataState.metricasRepresentantes.funcion), Object.values(dataState.metricasRepresentantes.funcion), colRep);
    draw('chartSatisfaccionRep', 'bar', Object.keys(dataState.metricasRepresentantes.satisfaccion).sort(), Object.values(dataState.metricasRepresentantes.satisfaccion), '#546e7a');
    draw('chartAtencionRep', 'pie', Object.keys(dataState.metricasRepresentantes.atencion), Object.values(dataState.metricasRepresentantes.atencion), colRep);

    // 3. Gráficos Porteros (Bloque 8 y Bloque 10)
    const colP = ['#fb8c00', '#ffa726', '#ffb74d', '#ffcc80', '#ffe0b2'];
    draw('chartSatisLaboralPortero', 'bar', Object.keys(dataState.metricasPorteros.satisfaccionLaboral).sort(), Object.values(dataState.metricasPorteros.satisfaccionLaboral), '#fb8c00');
    draw('chartSueldoPortero', 'pie', Object.keys(dataState.metricasPorteros.sueldoAdecuado), Object.values(dataState.metricasPorteros.sueldoAdecuado), colP);
    draw('chartHerramientasPortero', 'doughnut', Object.keys(dataState.metricasPorteros.herramientasApoyo), Object.values(dataState.metricasPorteros.herramientasApoyo), ['#4db6ac', '#f06292', '#9575cd']);
    
    // Gráficos Nuevos (Bloque 10)
    const colCian = ['#00acc1', '#26c6da', '#4dd0e1', '#80deea', '#b2ebf2'];
    draw('chartTurnosPortero', 'bar', Object.keys(dataState.metricasPorteros.turnosHorarios).sort(), Object.values(dataState.metricasPorteros.turnosHorarios), '#00acc1');
    draw('chartTratoPortero', 'pie', Object.keys(dataState.metricasPorteros.tratoReconocimiento), Object.values(dataState.metricasPorteros.tratoReconocimiento), colCian);
}

function copiarPromptAnalisis(bloque) {
    let titulo = "", raw = [], esListado = false;
    if (bloque === 1) { titulo = "Problemas Caseta"; raw = dataState.comentariosProblemas; }
    else if (bloque === 2) { titulo = "Valor/Continuidad"; raw = dataState.metricasValor.comentariosContinuidad; }
    else if (bloque === 3) { titulo = "Financiamiento"; raw = dataState.metricasFinanciamiento.sugerencias; }
    else if (bloque === 4) { titulo = "Servicio"; raw = dataState.metricasServicio.comentarios; }
    else if (bloque === 5) { titulo = "Mejoras Residentes"; raw = dataState.comentariosMejora; esListado = true; }
    else if (bloque === 6) { titulo = "Necesidades Porteros"; raw = dataState.metricasPorteros.comentariosMejora; esListado = true; }
    else if (bloque === 7) { titulo = "Mejoras Caseta (Entorno)"; raw = dataState.metricasPorteros.mejorasCaseta; esListado = true; }
    else if (bloque === 8) { titulo = "Experiencia General Porteros"; raw = dataState.metricasPorteros.experienciaGeneral; }

    if (!raw.length) return alert("Sin datos.");
    const lista = raw.map(c => `- [${c.plaza}]: ${c.texto}`).join('\n');
    const prompt = `Analista experto. TEMA: ${titulo}.\nOBJETIVO: ${esListado ? "Lista 5 bullets" : "Párrafo 5 líneas"}.\nDATOS:\n${lista}`;
    navigator.clipboard.writeText(prompt).then(() => alert("Prompt copiado."));
}