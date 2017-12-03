#!/usr/bin/env node
import * as program from 'commander';
import * as mysql from 'mysql';
import * as prettyJSONStringify from 'pretty-json-stringify';
import * as uuid from 'uuid';
import * as shell from 'shelljs';
import * as markdownpdf from 'markdown-pdf';
import * as path from 'path';

import { exportScripts } from './export';
import { importScripts } from './import';
import { uploadImageScripts } from './uploadImages';

const config = require('../src/config.json');

program
  .arguments('<command>')
  .option('-r, --restaurantName <restaurantName>', 'The name of the restaurant')
  // for exporting
  .option('-e, --exportPath [exportPath]', 'Optional export location, defaults to ./build/exports')
  .option('-p, --pdfJson <pdfJson>', 'Path to exported json file to convert into a pdf')
  // for importing
  .option('-o, --oldJson <oldJson>', 'The originally exported json file')
  .option('-n, --newJson <newJson>', 'The edited json file')
  .option('-O, --sqlOutImportPath [sqlOutImportPath]', 'Optional import location, defaults to ./build/imports')
  // for search
  .option('-s, --searchName <searchName>', 'The partial name of what you want to search for in the menu for the given restaurant')
  // for uploading images
  .option('-R, --restaurantUid <restaurantUid>', 'The restaurant location uid for the image upload')
  .option('-I, --itemUid <itemUid>', 'The uid of the item you want to upload an image for')
  .option('-i, --imagePath <imagePath>', 'The path to the image you want to upload')
  .option('-d, --dryRun [dryRun]', 'Optional flag to run upload without actually uploading to s3 (for testing)')
  .action(async (command, options) => {
    switch (command) {
      case '': {
        failAndOutputHelp('No command given!');
        break;
      }
      case 'export': {
        if (!options.restaurantName) failAndOutputHelp('No restaurant name given!');
        console.log(`Querying entire ${options.restaurantName} menu . . .`);
        const connection = mysql.createConnection(config);
        const defaultExportPath = './build/exports';
        const exportPath = options.exportPath ? options.exportPath : defaultExportPath;
        if (exportPath === defaultExportPath) shell.mkdir('-p', defaultExportPath);
        exportScripts.getRestaurantLocation(connection, options.restaurantName)
          .then(rlJson => {
            exportScripts.writeJsonToFile(rlJson, exportPath);
            process.exit();
          })
          .catch(err => failAndOutputHelp(`Failed to query database: ${err}`));
        break;
      }
      case 'pdf': {
        if (!options.pdfJson) failAndOutputHelp('No export json file given!');
        const defaultExportPath = './build/exports';
        const exportPath = options.exportPath ? options.exportPath : defaultExportPath;
        if (exportPath === defaultExportPath) shell.mkdir('-p', defaultExportPath);
        const restaurantLocation = require(`../${options.pdfJson}`);
        const pdfExportName = `${path.basename(options.pdfJson, 'json')}pdf`;
        console.log(`Converting json file ${options.pdfJson} to PDF ${pdfExportName} . . .`);
        const markdown = exportScripts.convertJsonToMarkdown(restaurantLocation);
        markdownpdf().from.string(markdown).to(`${exportPath}/${pdfExportName}`, () => {
          console.log(`Finished exporting PDF to ${exportPath}/${pdfExportName} !`);
        });
        break;
      }
      case 'import': {
        if (!options.oldJson) failAndOutputHelp('No old json file name given!');
        if (!options.newJson) failAndOutputHelp('No new json file name given!');
        const oldJson = require(`../${options.oldJson}`);
        const newJson = require(`../${options.newJson}`);
        const diff = importScripts.getDiff(oldJson, newJson);
        const defaultImportPath = './build/imports';
        const importPath = options.exportPath ? options.exportPath : defaultImportPath;
        if (importPath === defaultImportPath) shell.mkdir('-p', defaultImportPath);
        const sqlStatements = importScripts.parseDiff(newJson, diff);
        importScripts.writeSqlToFile(sqlStatements, options.importPath ? options.importPath : './build/imports');
        break;
      }
      case 'search': {
        if (!options.restaurantName) failAndOutputHelp('No restaurant name given!');
        if (!options.searchName) failAndOutputHelp('No search name given!');
        const connection = mysql.createConnection(config);
        uploadImageScripts.searchRestaurantMenu(connection, options.restaurantName, options.searchName)
          .then(matches => {
            console.log(prettyJSONStringify(matches));
            process.exit();
          })
          .catch(err => failAndOutputHelp(`Failed to query database: ${err}`));
        break;
      }
      case 'uploadImage': {
        if (!options.restaurantUid) failAndOutputHelp('No restaurant uid given!');
        if (!options.itemUid) failAndOutputHelp('No item uid given!');
        if (!options.imagePath) failAndOutputHelp('No image path given!');
        const newImageUid = uuid();
        console.log(`uploading image with uid ${newImageUid} . . .`);
        console.log(
          uploadImageScripts.uploadAndGetSql(
            options.imagePath, options.itemUid, options.restaurantUid, newImageUid, options.dryRun
          )
        );
        break;
      }
      default: failAndOutputHelp(`Command ${command} not understood!`);
    }
  })
  .parse(process.argv);

function failAndOutputHelp (msg) {
  console.error(msg);
  program.outputHelp();
  process.exit(1);
}
