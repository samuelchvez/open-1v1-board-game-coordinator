#!/usr/bin/env node
var express = require('express');
var app = express();

// Server port
app.set('port', 4000);

module.exports = app;