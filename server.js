const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Carpeta donde guardas tus canciones
app.use('/music', express.static(path.join(__dirname, 'music')));

// Conexión a la base de datos
const db = new sqlite3.Database('./imer_music.db');

// ... (Aquí van tus otras rutas como app.post('/agregar') o app.get('/buscar'))

// --- 3. ENDPOINT DE ELIMINACIÓN (Aquí es donde pones el código) ---
app.delete('/eliminar/:id', (req, res) => {
    const id = req.params.id;

    // Opcional: Primero buscamos el nombre del archivo para borrarlo de la carpeta /music
    db.get("SELECT archivo FROM canciones WHERE id = ?", [id], (err, row) => {
        if (row) {
            const rutaArchivo = path.join(__dirname, 'music', row.archivo);
            if (fs.existsSync(rutaArchivo)) {
                fs.unlinkSync(rutaArchivo); // Borra el archivo físico
            }
        }

        // Ahora borramos el registro de la base de datos SQLite
        db.run("DELETE FROM canciones WHERE id = ?", [id], (err) => {
            if (err) {
                return res.status(500).json({ mensaje: "Error al borrar" });
            }
            res.json({ mensaje: "Canción eliminada permanentemente" });
        });
    });
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log("Servidor IMER Music corriendo en http://localhost:3000");
});