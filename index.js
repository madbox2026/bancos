const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

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

  const data = [{ Nombre: nombre, Correo: correo, Telefono: telefono }];
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Formulario');
  const filename = 'formulario.xlsx';
  XLSX.writeFile(workbook, filename);

  let transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_API_KEY
    }
  });

  try {
    await transporter.sendMail({
      from: `"Formulario Banamx" <${process.env.EMAIL_USER}>`,
      to: 'madbox2026@gmail.com',
      subject: 'Nueva venta',
      text: 'Adjunto los datos del formulario.',
      attachments: [{ filename: filename, path: `./${filename}` }]
    });

    fs.unlinkSync(filename);
    res.send('Correo enviado correctamente.');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).send('Error al enviar el correo.');
  }
});

// Ruta GET raíz opcional
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

