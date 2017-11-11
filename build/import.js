"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonDiff = require("json-diff");
const shelljs = require('shelljs');
const moment = require('moment');
const uuid = require('uuid');
const spTemplates_1 = require("./spTemplates");
var importScripts;
(function (importScripts) {
    /**
     * Returns the structural JSON diff of the menus from the past restaurant and the new json object from
     * the passed json objects.
     * @param {string} jsonObjOld
     * @param {string} jsonObjNew
     * @return { object }
     */
    function getDiff(jsonObjOld, jsonObjNew) {
        return jsonDiff.diff(jsonObjOld.menus, jsonObjNew.menus);
    }
    importScripts.getDiff = getDiff;
    /**
     * Parses the passed menuDiff and returns an ordered array of strings to be written to a SQL file and imported into the database.
     * @param {object} newJsonObj
     * @param {object} menuDiff
     * @return {string} SQL file string
     */
    function parseDiff(newJsonObj, menuDiff) {
        const rluid = newJsonObj.uid;
        let sqlStatements = [];
        for (const menuUid in menuDiff) {
            const menu = newJsonObj.menus[getSafeUid(menuUid)];
            const printMenu = menu ? menu.name : 'New menu name';
            sqlStatements = sqlStatements.concat([`/** Diff menu: ${printMenu} */`], outputSQL(newJsonObj, menuDiff, 'menus', [menuUid, rluid]));
            const sectionDiff = menuDiff[menuUid].sections;
            for (const sectionUid in sectionDiff) {
                const section = menu ? menu.sections[getSafeUid(sectionUid)] : null;
                const printSection = section ? section.name : 'New section name';
                sqlStatements = sqlStatements.concat([`/** Diff section: ${printMenu} > ${printSection} */`], outputSQL(newJsonObj, sectionDiff, 'sections', [sectionUid, menuUid, rluid]));
                const itemDiff = sectionDiff[sectionUid].items;
                for (const itemUid in itemDiff) {
                    const item = section ? section.items[getSafeUid(itemUid)] : null;
                    const printItem = item ? item.name : 'New item name';
                    sqlStatements = sqlStatements.concat([`/** Diff item: ${printMenu} > ${printSection} > ${printItem} */`], outputSQL(newJsonObj, itemDiff, 'items', [itemUid, sectionUid, menuUid, rluid]));
                    const optionGroupDiff = itemDiff[itemUid].optionGroups;
                    for (const optionGroupUid in optionGroupDiff) {
                        const optionGroup = item ? item.optionGroups[getSafeUid(optionGroupUid)] : null;
                        const printOptionGroup = optionGroup ? optionGroup.name : 'New optionGroup name';
                        sqlStatements = sqlStatements.concat([`/** Diff optionGroup: ${printMenu} > ${printSection} > ${printItem} > ${printOptionGroup} */`], outputSQL(newJsonObj, optionGroupDiff, 'optionGroups', [optionGroupUid, itemUid, sectionUid, menuUid, rluid]));
                        const optionDiff = optionGroupDiff[optionGroupUid].options;
                        for (const optionUid in optionDiff) {
                            const option = optionGroup ? optionGroup.options[getSafeUid(optionUid)] : null;
                            const printOption = option ? option.name : 'New option';
                            sqlStatements = sqlStatements.concat([`/** Diff option: ${printMenu} > ${printSection} > ${printItem} > ${printOptionGroup} > ${printOption} */`], outputSQL(newJsonObj, optionDiff, 'options', [optionUid, optionGroupUid, itemUid, sectionUid, menuUid, rluid]));
                        }
                    }
                }
            }
        }
        return sqlStatements;
    }
    importScripts.parseDiff = parseDiff;
    /**
     * Writes the passed sqlString to the given exportFilePath
     * @param {string} sqlString
     * @param {string} exportFilePath
     */
    function writeSqlToFile(sqlStatements, exportFilePath) {
        const date = moment();
        const timestamp = `/** Json Diff SQL written on ${date.format('MMMM Do YYYY, h:mm:ss a')} */`;
        shelljs.echo(`${timestamp}\n${sqlStatements.join('\n')}`).toEnd(`${exportFilePath}/import-${date.format('YYYY-MM-DD-HH:mm:ss')}.sql`);
    }
    importScripts.writeSqlToFile = writeSqlToFile;
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
    function outputSQL(newJsonObj, jsonDiff, objectType, uidStack) {
        const uid = uidStack[0];
        const parentUid = uidStack[1];
        const printType = objectType.substring(0, objectType.length - 1);
        let statements = [];
        if (isNewChild(uid)) {
            statements = [`/** Create new ${printType}${jsonDiff[uid].name ? ': ' + jsonDiff[uid].name : ''} */`]
                .concat(outputCreate(jsonDiff[uid], objectType, parentUid));
        }
        else if (isDeletedChild(uid)) {
            if (objectType !== 'optionGroups' && objectType !== 'options')
                throw `ERROR: Cannot delete objects of type ${objectType}! Try updating it's isAvailable flag instead`;
            statements = [`/** Delete ${printType}: ${jsonDiff[uid].name} */`]
                .concat(outputDelete(jsonDiff, objectType, uid));
        }
        else {
            const obj = jsonDiff[uid];
            const diffKeys = getDifferences(obj, objectType);
            if (diffKeys.length > 0) {
                const newMenuObj = getNewObj(newJsonObj, uidStack);
                const printType = objectType.substring(0, objectType.length - 1);
                statements = [`/** Update ${printType}: ${newMenuObj.name} */`]
                    .concat(outputUpdate(newMenuObj, objectType));
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
    function outputCreate(jsonDiff, objectType, parentUid) {
        const obj = jsonDiff.slice(0); // shallow copy
        let statements = [];
        for (const newChildObj of obj) {
            const newChildCopy = Object.assign({}, newChildObj);
            const uid = uuid();
            newChildCopy.uid = uid;
            newChildCopy.__parent = parentUid;
            const childType = mapToChildType(objectType);
            statements.push(outputStoredProcedure(newChildCopy, objectType));
            // recursion where base case is childType === null (optionGroupOptions have no child)
            if (childType && newChildCopy[childType] && newChildCopy[childType]['uuid()'])
                statements = statements.concat(outputCreate(newChildCopy[childType]['uuid()'], childType, uid));
        }
        return statements;
    }
    /**
     * Outputs a stored procedure that updates an existing record in the database.
     * Updates are more simple than create and delete because there is no need for recursion.
     * @param {MenuObject} newMenuObj
     * @param {string} objectType
     */
    function outputUpdate(newMenuObj, objectType) {
        return outputStoredProcedure(newMenuObj, objectType);
    }
    /**
     * Outputs a stored procedure that deletes an optionGroup (and all its child options)
     * or deletes a single option.
     * @param {object} jsonDiff
     * @param {string} objectType can only be 'optionGroups' or 'options'
     * @param {string} key
     */
    function outputDelete(jsonDiff, objectType, key) {
        const obj = Object.assign({}, jsonDiff[key]); // shallow copy
        const safeUid = getSafeUid(key); // strip __deleted from uid
        const statements = [];
        if (objectType === 'optionGroups') {
            if (obj.options) {
                for (const optionUid in obj.options) {
                    statements.push(outputStoredProcedure({ uid: optionUid }, 'options', true));
                }
            }
            statements.push(outputStoredProcedure({ uid: safeUid }, objectType, true));
        }
        else if (objectType === 'options') {
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
    function outputStoredProcedure(obj, objectType, spDelete) {
        switch (objectType) {
            case 'menus': {
                return spTemplates_1.spTemplates.addMenu(obj.end, obj.isAvailable, obj.name, obj.rank, obj.start, obj.uid, obj.__parent);
            }
            case 'sections': {
                return spTemplates_1.spTemplates.addSection(obj.ageLimit, obj.name, obj.rank, obj.uid, obj.__parent);
            }
            case 'items': {
                return spTemplates_1.spTemplates.addItem(obj.description, obj.isAvailable, obj.name, obj.price, obj.rank, obj.uid, obj.__parent);
            }
            case 'optionGroups': {
                return spDelete ? spTemplates_1.spTemplates.deleteOptionGroup(obj.uid) :
                    spTemplates_1.spTemplates.addOptionGroup(obj.name, obj.rank, obj.type, obj.uid, obj.__parent);
            }
            case 'options': {
                return spDelete ? spTemplates_1.spTemplates.deleteOptionGroupOption(obj.uid) :
                    spTemplates_1.spTemplates.addOptionGroupOption(obj.isDefault, obj.name, obj.rank, obj.uid, obj.value, obj.__parent);
            }
            default: throw `objectType: ${objectType} not recognized`;
        }
    }
    /**
     * Crawls the newJsonObj using a stack of uids
     * @param {object} newJsonObj
     * @param {array} uidStack
     */
    function getNewObj(newJsonObj, uidStack) {
        let currType = 'menus';
        let currParent = uidStack.pop();
        let currUid = currParent;
        let currObj = Object.assign({}, newJsonObj); // shallow copy
        while (uidStack.length > 0 && currType !== null) {
            currParent = currUid;
            currUid = uidStack.pop();
            currObj = Object.assign({}, currObj[currType][currUid]); // shallow copy each iteration
            currType = mapToChildType(currType);
        }
        if (currType)
            delete currObj[currType];
        currObj.__parent = currParent;
        return currObj;
    }
    /**
     * Returns a list of the child keys that are diff'd (excluding the passed parameter)
     * @param {object} obj
     * @param {string} exclude the child key to ignore (i.e. items for section)
     */
    function getDifferences(obj, exclude) {
        const diffedChildren = [];
        for (const child in obj) {
            if (isDiffChild(child, obj, exclude))
                diffedChildren.push(child);
        }
        return diffedChildren;
    }
    /**
     * Returns true if child is diff'd
     * @param {string} key
     * @param {object} obj
     * @param {string} exclude
     */
    function isDiffChild(key, obj, exclude) {
        const child = obj[key];
        return key !== exclude && typeof child === 'object' && child.hasOwnProperty('__new') && child.hasOwnProperty('__old');
    }
    /**
     * Returns true if key is flagged as added by json-diff
     * @param {string} key
     */
    function isNewChild(key) {
        return key.endsWith('__added');
    }
    /**
     * Returns true if key is flagged as deleted by json-diff
     * @param {string} key
     */
    function isDeletedChild(key) {
        return key.endsWith('__deleted');
    }
    function getSafeUid(key) {
        if (isNewChild(key)) {
            return key.replace(/__added/g, '');
        }
        else if (isDeletedChild(key)) {
            return key.replace(/__deleted/g, '');
        }
        else {
            return key;
        }
    }
    /**
     * Returns the corresponding child type to the passed parent type
     * Returns null if no children (options or invalid)
     * @param {string} parent
     */
    function mapToChildType(parent) {
        switch (parent) {
            case 'menus': return 'sections';
            case 'sections': return 'items';
            case 'items': return 'optionGroups';
            case 'optionGroups': return 'options';
            default: return null;
        }
    }
})(importScripts = exports.importScripts || (exports.importScripts = {}));