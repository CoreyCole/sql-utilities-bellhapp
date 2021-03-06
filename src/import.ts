import * as jsonDiff from 'json-diff';
const shelljs = require('shelljs');
const moment = require('moment');
const uuid = require('uuid');

import { spTemplates } from './spTemplates';
import {
  RestaurantLocation,
  MenuObject
} from './models';

export namespace importScripts {
  /**
   * Returns the structural JSON diff of the menus from the past restaurant and the new json object from
   * the passed json objects.
   * @param {string} jsonObjOld
   * @param {string} jsonObjNew
   * @return { object }
   */
  export function getDiff (jsonObjOld: RestaurantLocation, jsonObjNew: RestaurantLocation): object {
    return jsonDiff.diff(jsonObjOld.menus, jsonObjNew.menus);
  }
  /**
   * Parses the passed menuDiff and returns an ordered array of strings to be written to a SQL file and imported into the database.
   * @param {object} newJsonObj
   * @param {object} menuDiff
   * @return {string} SQL file string
   */
  export function parseDiff (newJsonObj: RestaurantLocation, menuDiff: any): string[] {
    const rluid = newJsonObj.uid;
    let sqlStatements: string[] = [];
    for (const menuUid in menuDiff) {
      const menu = newJsonObj.menus[getSafeUid(menuUid)];
      const printMenu = menu && menu.menuName ? menu.menuName : 'New menu name';
      sqlStatements = sqlStatements.concat(
        [`/** Diff menu: ${printMenu} */`],
        outputSQL(newJsonObj, menuDiff, 'menus', [menuUid, rluid])
      );
      const sectionDiff = menuDiff[menuUid].sections;
      for (const sectionUid in sectionDiff) {
        const section = menu ? menu.sections[getSafeUid(sectionUid)] : null;
        const printSection = section && section.sectionName ? section.sectionName : 'New section name';
        sqlStatements = sqlStatements.concat(
          [`/** Diff section: ${printMenu} > ${printSection} */`],
          outputSQL(newJsonObj, sectionDiff, 'sections', [sectionUid, menuUid, rluid])
        );
        const itemDiff = sectionDiff[sectionUid].items;
        for (const itemUid in itemDiff) {
          const item = section ? section.items[getSafeUid(itemUid)] : null;
          const printItem = item && item.itemName ? item.itemName : 'New item name';
          sqlStatements = sqlStatements.concat(
            [`/** Diff item: ${printMenu} > ${printSection} > ${printItem} */`],
            outputSQL(newJsonObj, itemDiff, 'items', [itemUid, sectionUid, menuUid, rluid])
          );
          const optionGroupDiff = itemDiff[itemUid].optionGroups;
          for (const optionGroupUid in optionGroupDiff) {
            const optionGroup = item ? item.optionGroups[getSafeUid(optionGroupUid)] : null;
            const printOptionGroup = optionGroup && optionGroup.optionGroupName ? optionGroup.optionGroupName : 'New optionGroup name';
            sqlStatements = sqlStatements.concat(
              [`/** Diff optionGroup: ${printMenu} > ${printSection} > ${printItem} > ${printOptionGroup} */`],
              outputSQL(newJsonObj, optionGroupDiff, 'optionGroups', [optionGroupUid, itemUid, sectionUid, menuUid, rluid])
            );
            const optionDiff = optionGroupDiff[optionGroupUid].options;
            for (const optionUid in optionDiff) {
              const option = optionGroup ? optionGroup.options[getSafeUid(optionUid)] : null;
              const printOption = option && option.optionGroupOptionName ? option.optionGroupOptionName : 'New option';
              sqlStatements = sqlStatements.concat(
                [`/** Diff option: ${printMenu} > ${printSection} > ${printItem} > ${printOptionGroup} > ${printOption} */`],
                outputSQL(newJsonObj, optionDiff, 'options', [optionUid, optionGroupUid, itemUid, sectionUid, menuUid, rluid])
              );
            }
          }
        }
      }
    }
    return sqlStatements;
  }
  /**
   * Writes the passed sqlString to the given exportFilePath
   * @param {string} sqlString
   * @param {string} exportFilePath
   */
  export function writeSqlToFile (sqlStatements: string[], exportFilePath: string) {
    const date = moment();
    const timestamp = `/** Json Diff SQL written on ${date.format('MMMM Do YYYY, h:mm:ss a')} */`;
    shelljs.echo(`${timestamp}\n${sqlStatements.join('\n')}`).toEnd(`${exportFilePath}/import-${date.format('YYYY-MM-DD-HH:mm:ss')}.sql`);
  }

  /**
   * PRIVATE FUNCTIONS BELOW
   */

  /**
   * Outputs a stored procedure based on information from json-diff
   * @param {object} newJsonObj
   * @param {object} jsonDiff
   * @param {string} objectType
   * @param {array} uidStack
   */
  function outputSQL (newJsonObj, jsonDiff, objectType, uidStack): string[] {
    const uid = uidStack[0];
    const parentUid = uidStack[1];
    const printTypeTmp = objectType.substring(0, objectType.length - 1);
    const printType = printTypeTmp === 'option' ? 'optionGroupOption' : printTypeTmp;
    let statements: string[] = [];
    if (isNewChild(uid)) {
      statements = [`/** Create new ${printType} */`]
        .concat(
          outputCreate(jsonDiff[uid], objectType, parentUid)
        );
    } else if (isDeletedChild(uid)) {
      if (objectType !== 'optionGroups' && objectType !== 'options') {
        throw new Error(`ERROR: Cannot delete objects of type ${objectType}! Try updating it's isAvailable flag instead`);
      }
      statements = [`/** Delete ${printType}: ${jsonDiff[uid][printType + 'Name']} */`]
          .concat(
            outputDelete(jsonDiff, objectType, uid)
          );
    } else {
      const obj = jsonDiff[uid];
      const diffKeys = getDifferences(obj, objectType);
      if (diffKeys.length > 0) {
        const newMenuObj = getNewObj(newJsonObj, uidStack);
        statements = [`/** Update ${printType}: ${newMenuObj[printType + 'Name']} */`]
          .concat(
            outputUpdate(newMenuObj, objectType)
          );
      }
    }
    return statements;
  }

  /**
   * Outputs a stored procedure that creates a new record in the database with a generated uuid.
   * @param {object} jsonDiff
   * @param {string} objectType
   * @param {string} parentUid
   */
  function outputCreate (jsonDiff, objectType, parentUid): string[] {
    const obj = jsonDiff.slice(0); // shallow copy
    let statements: string[] = [];
    for (const newChildObj of obj) { // obj is an array
      const newChildCopy = { ...newChildObj };
      const uid = uuid();
      newChildCopy.uid = uid;
      newChildCopy.__parent = parentUid;

      const childType = mapToChildType(objectType);
      statements.push(outputStoredProcedure(newChildCopy, objectType));
      // recursion where base case is childType === null (optionGroupOptions have no child)
      if (childType && newChildCopy[childType] && newChildCopy[childType]['uuid()']) {
        statements = statements.concat(outputCreate(newChildCopy[childType]['uuid()'], childType, uid));
      }
    }
    return statements;
  }

  /**
   * Outputs a stored procedure that updates an existing record in the database.
   * Updates are more simple than create and delete because there is no need for recursion.
   * @param {MenuObject} newMenuObj
   * @param {string} objectType
   */
  function outputUpdate (newMenuObj, objectType): string {
    return outputStoredProcedure(newMenuObj, objectType);
  }

  /**
   * Outputs a stored procedure that deletes an optionGroup (and all its child options)
   * or deletes a single option.
   * @param {object} jsonDiff
   * @param {string} objectType can only be 'optionGroups' or 'options'
   * @param {string} key
   */
  function outputDelete (jsonDiff, objectType, key): string[] {
    const obj = { ...jsonDiff[key] }; // shallow copy
    const safeUid = getSafeUid(key); // strip __deleted from uid
    const statements: string[] = [];
    if (objectType === 'optionGroups') {
      if (obj.options) {
        for (const optionUid in obj.options) {
          statements.push(outputStoredProcedure({ uid: optionUid }, 'options', true));
        }
      }
      statements.push(outputStoredProcedure({ uid: safeUid }, objectType, true));
    } else if (objectType === 'options') {
      statements.push(outputStoredProcedure({ uid: safeUid }, 'options', true));
    }
    return statements;
  }

  /**
   * Outputs a stored procedure to the provided file path. SP based on the passed type and delete flag.
   * @param {object} obj
   * @param {string} objectType
   * @param {boolean} (optional) spDelete
   */
  function outputStoredProcedure (obj, objectType, spDelete?: boolean): string {
    switch (objectType) {
      case 'menus': {
        return spTemplates.addMenu(obj.end, obj.isAvailable, obj.menuName, obj.rank, obj.start, obj.uid, obj.__parent);
      }
      case 'sections': {
        return spTemplates.addSection(obj.ageLimit, obj.sectionName, obj.rank, obj.uid, obj.__parent);
      }
      case 'items': {
        return spTemplates.addItem(obj.description, obj.isAvailable, obj.itemName, obj.price, obj.rank, obj.uid, obj.__parent);
      }
      case 'optionGroups': {
        return spDelete ? spTemplates.deleteOptionGroup(obj.uid) :
          spTemplates.addOptionGroup(obj.optionGroupName, obj.rank, obj.type, obj.uid, obj.__parent);
      }
      case 'options': {
        return spDelete ? spTemplates.deleteOptionGroupOption(obj.uid) :
          spTemplates.addOptionGroupOption(obj.isDefault, obj.optionGroupOptionName, obj.rank, obj.uid, obj.value, obj.__parent);
      }
      default: throw new Error(`objectType: ${objectType} not recognized`);
    }
  }

  /**
   * Crawls the newJsonObj using a stack of uids
   * @param {object} newJsonObj
   * @param {array} uidStack
   */
  function getNewObj (newJsonObj, uidStack): MenuObject {
    let currType: string | null = 'menus';
    let currParent = uidStack.pop();
    let currUid = currParent;
    let currObj = { ...newJsonObj }; // shallow copy
    while (uidStack.length > 0 && currType !== null) {
      currParent = currUid;
      currUid = uidStack.pop();
      currObj = { ...currObj[currType][currUid] }; // shallow copy each iteration
      currType = mapToChildType(currType);
    }
    if (currType) delete currObj[currType];
    currObj.__parent = currParent;
    return currObj;
  }

  /**
   * Returns a list of the child keys that are diff'd (excluding the passed parameter)
   * @param {object} obj
   * @param {string} exclude the child key to ignore (i.e. items for section)
   */
  function getDifferences (obj, exclude): string[] {
    const diffedChildren: string[] = [];
    for (const child in obj) {
      if (isDiffChild(child, obj, exclude)) diffedChildren.push(child);
    }
    return diffedChildren;
  }

  /**
   * Returns true if child is diff'd
   * @param {string} key
   * @param {object} obj
   * @param {string} exclude
   */
  function isDiffChild (key, obj, exclude): boolean {
    const child = obj[key];
    return key !== exclude && typeof child === 'object' && child.hasOwnProperty('__new') && child.hasOwnProperty('__old');
  }

  /**
   * Returns true if key is flagged as added by json-diff
   * @param {string} key
   */
  function isNewChild (key): boolean {
    return key.endsWith('__added');
  }

  /**
   * Returns true if key is flagged as deleted by json-diff
   * @param {string} key
   */
  function isDeletedChild (key): boolean {
    return key.endsWith('__deleted');
  }

  function getSafeUid (key: string): string {
    if (isNewChild(key)) {
      return key.replace(/__added/g, '');
    } else if (isDeletedChild(key)) {
      return key.replace(/__deleted/g, '');
    } else {
      return key;
    }
  }

  /**
   * Returns the corresponding child type to the passed parent type
   * Returns null if no children (options or invalid)
   * @param {string} parent
   */
  function mapToChildType (parent: string): string | null {
    switch (parent) {
      case 'menus': return 'sections';
      case 'sections': return 'items';
      case 'items': return 'optionGroups';
      case 'optionGroups': return 'options';
      default: return null;
    }
  }

}
