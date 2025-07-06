const fs = require('fs');
const path = require('path');

const distDir = './dist/core';
const files = fs.readdirSync(distDir);

files.forEach(file => {
    if (file.endsWith('.d.ts')) {
        const filePath = path.join(distDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const newContent = `/// <reference path="../globals.d.ts" />\n${content}`;
        fs.writeFileSync(filePath, newContent);
    }
});