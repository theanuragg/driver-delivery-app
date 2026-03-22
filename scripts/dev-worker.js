const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/notifications', (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('❌ Error: Received empty request body. Ensure Content-Type is application/json and data is correctly formatted.');
    return res.status(400).json({ success: false, message: 'Empty request body' });
  }

  const { title, body, driverId, data } = req.body;
  
  console.log('\n--- 🔔 SIMULATED FCM NOTIFICATION ---');
  console.log(`To Driver: ${driverId}`);
  console.log(`Title: ${title}`);
  console.log(`Body: ${body}`);
  console.log('Extra Data:', data);
  console.log('-------------------------------------\n');

  res.status(200).json({ success: true, message: 'Notification logged successfully' });
});

app.listen(port, () => {
  console.log(`🚀 Dev Notification Worker running at http://localhost:${port}`);
});
