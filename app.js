#!/usr/bin/env node
var express = require('express');
var app = express();

// Server port
app.set('port', process.env.PORT || 3000);

module.exports = app;