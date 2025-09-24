const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir archivos HTML desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta POST para recibir datos del formulario y enviar correo
app.post('/enviar-formulario', async (req, res) => {
  console.log('❗ Llega POST /enviar-formulario');
  console.log(req.body); // verás los datos del formulario
  const { nombre, correo, telefono } = req.body;

  // Crear archivo Excel temporal con los datos
  const data = [{ Nombre: nombre, Correo: correo, Telefono: telefono }];
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Formulario');
  const filename = 'formulario.xlsx';
  XLSX.writeFile(workbook, filename);

  try {
    // Leer archivo en base64 (necesario para enviar por Brevo API)
    const fileContent = fs.readFileSync(filename).toString("base64");

    // Enviar correo usando la API de Brevo
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.BREVO_USER },
        to: [{ email: "madbox2026@gmail.com" }],
        subject: "Nueva venta",
        textContent: `Se recibió un nuevo formulario:\n\nNombre: ${nombre}\nCorreo: ${correo}\nTeléfono: ${telefono}`,
        attachment: [
          {
            content: fileContent,
            name: filename
          }
        ]
      },
      {
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json"
        }
      }
    );

    console.log("✅ Correo enviado correctamente:", response.data);
    fs.unlinkSync(filename); // borrar archivo temporal
    res.send("Correo enviado correctamente.");
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error.response?.data || error.message);
    res.status(500).send("Error al enviar el correo.");
  }
});

// Ruta GET raíz opcional
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
