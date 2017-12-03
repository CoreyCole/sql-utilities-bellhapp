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
    const exportTime = moment().format('YYYY-MM-DD-HH-mm-ss');
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
  export function writeJsonToFile (restaurantLocation, exportPath) {
    shelljs.echo(prettyJSONStringify(restaurantLocation, {
      tab: '  ',
      spaceBeforeColon: ''
    })).toEnd(`${exportPath}/export-${restaurantLocation['_exportDate']}.json`);
  }
  /**
   * Returns a markdown string representing the passed restaurant location
   * @param restaurantLocation the json representation of the restaurant location
   */
  export function convertJsonToMarkdown (restaurantLocation): string {
    let markdown: string[] = [];
    markdown.push(`<h1 style='margin:0;'>${restaurantLocation.restaurantName} Menu</h1>`);
    for (const menuUid in restaurantLocation.menus) {
      const menu = restaurantLocation.menus[menuUid];
      markdown.push(`<h2 style='margin:0;margin-top:16px;margin-bottom:-32px;'>${menu.menuName}</h2>`);
      for (const sectionUid in menu.sections) {
        const section = menu.sections[sectionUid];
        markdown.push(`<h3 style='margin:0;margin-top:16px;margin-bottom:-16px;'>${section.sectionName}</h3>`);
        for (const itemUid in section.items) {
          const item = section.items[itemUid];
          markdown.push(`$${(item.price / 100).toFixed(2)} - ${item.itemName}`);
          for (const optionGroupUid in item.optionGroups) {
            const optionGroup = item.optionGroups[optionGroupUid];
            markdown.push(`* ${optionGroup.type} - ${optionGroup.optionGroupName}`);
            for (const optionUid in optionGroup.options) {
              const option = optionGroup.options[optionUid];
              markdown.push(`  * $${(option.value / 100).toFixed(2)} - ${option.optionGroupOptionName}`);
            }
            markdown.push('\n');
          }
        }
      }
    }
    return markdown.join('\n');
  }
}
