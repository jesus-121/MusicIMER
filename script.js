let archivoCapturado = null;

// 1. NAVEGACIÓN ENTRE VISTAS
async function loadView(file, btn) {
    const main = document.getElementById('mainContent');
    if (!main) return;
    try {
        const response = await fetch(file);
        main.innerHTML = await response.text();

        document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        // Inicializar lógica según la pestaña cargada
        if (file === 'gestion.html') {
            setupDragAndDrop();
            document.getElementById('saveBtn').onclick = subirCancion;
        }
        if (file === 'buscador.html') filterSongs(); 
        if (file === 'reproductor.html') actualizarVistaReproductor();
    } catch (e) { console.error("Error cargando vista:", e); }
}

// 2. BUSCADOR DINÁMICO (Consulta SQLite)
async function filterSongs() {
    const q = document.getElementById('searchInput')?.value || '';
    const contenedor = document.getElementById('results');
    if (!contenedor) return;

    try {
        const res = await fetch(`http://localhost:3000/buscar?q=${q}`);
        const canciones = await res.json();

        contenedor.innerHTML = canciones.map(s => `
            <div class="card" style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; cursor: pointer; padding: 12px 20px;" 
                 onclick="reproducir('${s.titulo}', '${s.artista}', '${s.archivo}')">
                <div style="width: 40px; height: 40px; background: var(--gradient-main); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">🎶</div>
                <div style="flex: 1; text-align: left;">
                    <strong style="display: block; font-size: 14px; color: var(--text-main);">${s.titulo}</strong>
                    <small style="color: var(--text-muted); font-size: 12px;">${s.artista}</small>
                </div>
                <div style="color: var(--primary); font-size: 11px; font-weight: 800;">PLAY</div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

// 3. REPRODUCCIÓN Y CONTROLES (Pausa, Volumen, Progreso)
function reproducir(titulo, artista, archivo) {
    const audio = document.getElementById('mainAudio');
    const miniTitle = document.getElementById('miniTitle');
    const btnPlayPause = document.getElementById('playPauseBtn');

    audio.src = `http://localhost:3000/music/${archivo}`;
    audio.play();

    if (miniTitle) miniTitle.innerText = `${titulo} - ${artista}`;
    if (btnPlayPause) btnPlayPause.innerText = "⏸";

    localStorage.setItem('p_title', titulo);
    localStorage.setItem('p_artist', artista);
}

function iniciarControlesAudio() {
    const audio = document.getElementById('mainAudio');
    const btnPlayPause = document.getElementById('playPauseBtn');
    const volControl = document.getElementById('volumeControl');
    const progressFill = document.getElementById('progressFill');

    // Botón Pausa / Reproducir
    btnPlayPause.onclick = () => {
        if (audio.src === "") return;
        if (audio.paused) {
            audio.play();
            btnPlayPause.innerText = "⏸";
        } else {
            audio.pause();
            btnPlayPause.innerText = "▶";
        }
    };

    // Control de Volumen
    volControl.oninput = (e) => {
        audio.volume = e.target.value;
    };

    // Barra de progreso automática
    audio.ontimeupdate = () => {
        if (audio.duration && progressFill) {
            const porcentaje = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = porcentaje + "%";
        }
    };
}

// 4. GESTIÓN (Subida de archivos)
function setupDragAndDrop() {
    const dz = document.getElementById('dropZone');
    if (!dz) return;
    dz.ondragover = (e) => { e.preventDefault(); dz.style.background = "var(--primary-light)"; };
    dz.ondragleave = () => dz.style.background = "transparent";
    dz.ondrop = (e) => {
        e.preventDefault();
        archivoCapturado = e.dataTransfer.files[0];
        if (archivoCapturado?.type === "audio/mpeg") {
            document.getElementById('addTitle').value = archivoCapturado.name.replace('.mp3', '');
            document.getElementById('dropZoneText').innerText = `✅ ${archivoCapturado.name}`;
        }
    };
}

async function subirCancion() {
    if (!archivoCapturado) return alert("Arrastra un archivo");
    const fd = new FormData();
    fd.append('audioFile', archivoCapturado);
    fd.append('titulo', document.getElementById('addTitle').value);
    fd.append('artista', document.getElementById('addArtist').value);
    await fetch('http://localhost:3000/agregar', { method: 'POST', body: fd });
    loadView('gestion.html', document.querySelectorAll('.nav-link')[3]);
}

function actualizarVistaReproductor() {
    setTimeout(() => {
        if (document.getElementById('pTitle')) {
            document.getElementById('pTitle').innerText = localStorage.getItem('p_title') || "Sin reproducir";
            document.getElementById('pArtist').innerText = localStorage.getItem('p_artist') || "Selecciona en el buscador";
        }
    }, 50);
}

// ARRANQUE GLOBAL
window.onload = () => {
    loadView('inicio.html', document.querySelector('.nav-link'));
    iniciarControlesAudio();
};