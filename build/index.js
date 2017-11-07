#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const mysql = require("mysql");
const export_1 = require("./export");
const import_1 = require("./import");
const config = require('../src/config.json');
program
    .arguments('<command>')
    .option('-r, --restaurantName <restaurantName>', 'The name of the restaurant to export')
    .option('-e, --exportPath [exportPath]', 'Optional export location, defaults to ./build/exports')
    .option('-o, --oldJson <oldJson>', 'The originally exported json file')
    .option('-n, --newJson <newJson>', 'The edited json file')
    .option('-i, --importPath [importPath]', 'Optional import location, defaults to ./build/imports')
    .action((command, options) => __awaiter(this, void 0, void 0, function* () {
    switch (command) {
        case 'export': {
            if (!options.restaurantName)
                failAndOutputHelp('No restaurant name given!');
            const connection = mysql.createConnection(config);
            export_1.exportScripts.getRestaurantLocation(connection, options.restaurantName)
                .then(rlJson => {
                export_1.exportScripts.writeJsonToFile(rlJson, options.exportPath ? options.exportPath : './build/exports');
                process.exit();
            })
                .catch(err => failAndOutputHelp(`Failed to query database: ${err}`));
            break;
        }
        case 'import': {
            if (!options.oldJson)
                failAndOutputHelp('No old json file name given!');
            if (!options.newJson)
                failAndOutputHelp('No new json file name given!');
            const oldJson = require(`../${options.oldJson}`);
            const newJson = require(`../${options.newJson}`);
            const diff = import_1.importScripts.getDiff(oldJson, newJson);
            const sqlStatements = import_1.importScripts.parseDiff(newJson, diff);
            import_1.importScripts.writeSqlToFile(sqlStatements, options.importPath ? options.importPath : './build/imports');
            break;
        }
        default: failAndOutputHelp('No command given!');
    }
}))
    .parse(process.argv);
function failAndOutputHelp(msg) {
    console.error(msg);
    program.outputHelp();
    process.exit(1);
}
