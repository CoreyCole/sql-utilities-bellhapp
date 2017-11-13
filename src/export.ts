import * as shelljs from 'shelljs';
import * as prettyJSONStringify from 'pretty-json-stringify';
import * as moment from 'moment';

import { queries } from './queries';

const rejectHandler = (err) => {
  console.error(err);
  throw err;
};

export namespace exportScripts {
  /**
   * Queries all of the data for a restaurant location given a restaurantName
   * @param {mysql.Connection} connection
   * @param {string} restaurantName
   */
  export async function getRestaurantLocation (connection, restaurantName) {
    const exportTime = moment().format('YYYY-MM-DD-HH:mm:ss');
    const restaurantLocationRow = await queries.getRestaurantLocation(connection, restaurantName).catch(rejectHandler);
    const restaurantLocation = { _exportDate: exportTime, ...restaurantLocationRow };
    restaurantLocation.menus = {};
    const menuRows = await queries.getMenus(connection, restaurantLocation.id).catch(rejectHandler);
    for (const menuRow of menuRows) {
      restaurantLocation.menus[menuRow.uid] = { ...menuRow };
      restaurantLocation.menus[menuRow.uid].sections = {};
      const sectionRows = await queries.getMenuSections(connection, menuRow.id).catch(rejectHandler);
      for (const sectionRow of sectionRows) {
        restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid] = { ...sectionRow };
        restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items = {};
        const itemRows = await queries.getMenuSectionItems(connection, sectionRow.id).catch(rejectHandler);
        for (const itemRow of itemRows) {
          restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid] = { ...itemRow };
          restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups = {};
          const optionGroupRows = await queries.getItemOptionGroups(connection, itemRow.id).catch(rejectHandler);
          if (optionGroupRows) {
            for (const optionGroupRow of optionGroupRows) {
              restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups[optionGroupRow.uid] = { ...optionGroupRow };
              restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups[optionGroupRow.uid].options = {};
              const optionGroupOptionRows = await queries.getItemOptionGroupOptions(connection, optionGroupRow.id).catch(rejectHandler);
              for (const optionGroupOptionRow of optionGroupOptionRows) {
                restaurantLocation.menus[menuRow.uid].sections[sectionRow.uid].items[itemRow.uid].optionGroups[optionGroupRow.uid].options[optionGroupOptionRow.uid] = { ...optionGroupOptionRow };
              }
            }
          }
        }
      }
    }
    return restaurantLocation;
  }
  /**
   * Exports the provided json in "pretty" format to the passed file (appends export date onto file name)
   * @param {object} restaurantLocation
   * @param {string} exportFileName
   */
  export function writeJsonToFile (restaurantLocation, exportPath?) {
    shelljs.echo(prettyJSONStringify(restaurantLocation, {
      tab: '  ',
      spaceBeforeColon: ''
    })).toEnd(`${exportPath ? exportPath : '.'}/export-${restaurantLocation['_exportDate']}.json`);
  }
}
