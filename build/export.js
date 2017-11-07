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
const shelljs = require("shelljs");
const prettyJSONStringify = require("pretty-json-stringify");
const moment = require("moment");
const queries_1 = require("./queries");
// const config = require('./config.json')
// const connection = mysql.createConnection(config)
// const EXPORT_TIME = moment()
// const RESTAURANT_NAME = 'Cedars'
// const EXPORT_FILE_PATH = './exports/'
// const EXPORT_FILE_NAME = `${EXPORT_FILE_PATH}export-${EXPORT_TIME.format('YYYY-MM-DD-HH:mm:ss')}.json`
// shelljs.mkdir(EXPORT_FILE_PATH)
// shelljs.touch(EXPORT_FILE_NAME)
// console.log(`Exporting from database on ${EXPORT_TIME.format('MMMM Do YYYY, h:mm:ss a')} . . .`)
const rejectHandler = (err) => {
    console.error(err);
    throw err;
};
// getRestaurantLocation(RESTAURANT_NAME, EXPORT_TIME)
//   .then(restaurantLocation => exportJSON(restaurantLocation, EXPORT_FILE_NAME, EXPORT_TIME.format('MMMM Do YYYY, h:mm:ss a')))
//   .catch(rejectHandler)
var exportScripts;
(function (exportScripts) {
    /**
     * Queries all of the data for a restaurant location given a restaurantName
     * @param {mysql.Connection} connection
     * @param {string} restaurantName
     */
    function getRestaurantLocation(connection, restaurantName) {
        return __awaiter(this, void 0, void 0, function* () {
            const exportTime = moment().format('YYYY-MM-DD-HH:mm:ss');
            const restaurantLocationRow = yield queries_1.queries.getRestaurantLocation(connection, restaurantName).catch(rejectHandler);
            const restaurantLocation = Object.assign({ _exportDate: exportTime }, restaurantLocationRow);
            restaurantLocation.menus = {};
            const menuRows = yield queries_1.queries.getMenus(connection, restaurantLocation.id).catch(rejectHandler);
            for (const menuRow of menuRows) {
                restaurantLocation.menus[menuRow.uid] = Object.assign({}, menuRow);
                restaurantLocation.menus[menuRow.uid].sections = {};
                const sectionRows = yield queries_1.queries.getMenuSections(connection, menuRow.id).catch(rejectHandler);
                for (const sectionRow of sectionRows) {
                    restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid] = Object.assign({}, sectionRow);
                    restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items = {};
                    const itemRows = yield queries_1.queries.getMenuSectionItems(connection, sectionRow.id).catch(rejectHandler);
                    for (const itemRow of itemRows) {
                        restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid] = Object.assign({}, itemRow);
                        restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups = {};
                        const optionGroupRows = yield queries_1.queries.getItemOptionGroups(connection, itemRow.id).catch(rejectHandler);
                        if (optionGroupRows) {
                            for (const optionGroupRow of optionGroupRows) {
                                restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups[optionGroupRow.uid] = Object.assign({}, optionGroupRow);
                                restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups[optionGroupRow.uid].options = {};
                                const optionGroupOptionRows = yield queries_1.queries.getItemOptionGroupOptions(connection, optionGroupRow.id).catch(rejectHandler);
                                for (const optionGroupOptionRow of optionGroupOptionRows) {
                                    restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups[optionGroupRow.uid].options[optionGroupOptionRow.uid] = Object.assign({}, optionGroupOptionRow);
                                }
                            }
                        }
                    }
                }
            }
            return restaurantLocation;
        });
    }
    exportScripts.getRestaurantLocation = getRestaurantLocation;
    /**
     * Exports the provided json in "pretty" format to the passed file (appends export date onto file name)
     * @param {object} restaurantLocation
     * @param {string} exportFileName
     */
    function writeJsonToFile(restaurantLocation, exportPath) {
        shelljs.echo(prettyJSONStringify(restaurantLocation, {
            tab: '  ',
            spaceBeforeColon: ''
        })).toEnd(`${exportPath ? exportPath : '.'}/export-${restaurantLocation['_exportDate']}.json`);
    }
    exportScripts.writeJsonToFile = writeJsonToFile;
})(exportScripts = exports.exportScripts || (exports.exportScripts = {}));
