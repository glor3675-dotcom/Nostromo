const express = require('express');
const app = express();
const server = require('http').createServer(app);

app.get('/', (req, res) => {
  res.send('Call server is running!');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
