#!/usr/bin/env node
import * as program from 'commander'
import * as mysql from 'mysql'

import { exportScripts } from './export'
import { importScripts } from './import'

const config = require('../src/config.json')

program
  .arguments('<command>')
  .option('-r, --restaurantName <restaurantName>', 'The name of the restaurant to export')
  .option('-e, --exportPath [exportPath]', 'Optional export location, defaults to ./build/exports')
  .option('-o, --oldJson <oldJson>', 'The originally exported json file')
  .option('-n, --newJson <newJson>', 'The edited json file')
  .option('-i, --importPath [importPath]', 'Optional import location, defaults to ./build/imports')
  .action(async (command, options) => {
    switch (command) {
      case 'export': {
        if (!options.restaurantName) failAndOutputHelp('No restaurant name given!')
        const connection = mysql.createConnection(config)
        exportScripts.getRestaurantLocation(connection, options.restaurantName)
          .then(rlJson => {
            exportScripts.writeJsonToFile(rlJson, options.exportPath ? options.exportPath : './build/exports')
            process.exit()
          })
          .catch(err => failAndOutputHelp(`Failed to query database: ${err}`))
        break
      }
      case 'import': {
        if (!options.oldJson) failAndOutputHelp('No old json file name given!')
        if (!options.newJson) failAndOutputHelp('No new json file name given!')
        const oldJson = require(`../${options.oldJson}`)
        const newJson = require(`../${options.newJson}`)
        const diff = importScripts.getDiff(oldJson, newJson)
        const sqlStatements = importScripts.parseDiff(newJson, diff)
        importScripts.writeSqlToFile(sqlStatements, options.importPath ? options.importPath : './build/imports')
        break
      }
      default: failAndOutputHelp('No command given!')
    }
  })
  .parse(process.argv)

function failAndOutputHelp(msg) {
  console.error(msg)
  program.outputHelp()
  process.exit(1)
}