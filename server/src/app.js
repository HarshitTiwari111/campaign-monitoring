const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serves public/tracking.js - the landing-page snippet that reports visits
// back to /api/tracking/visit. Public and unauthenticated by design.
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
