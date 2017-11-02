const jsonDiff = require('json-diff')
const shelljs = require('shelljs')
const moment = require('moment')
const util = require('util')
const uuid = require('uuid')

const spTemplates = require('./spTemplates').templates

if (process.argv.length === 2) throw 'ERROR: Forgot filename arguments'
if (process.argv.length !== 4) throw 'ERROR: Invalid arguments'

const jsonFileOldPath = process.argv[2]
const jsonFileNewPath = process.argv[3]
const jsonFileOld = require(`../${jsonFileOldPath}`)
const jsonFileNew = require(`../${jsonFileNewPath}`)

const IMPORT_TIME = moment()
const RESTAURANT_NAME = 'Cedars'
const IMPORT_FILE_PATH = './sql-out/'
const IMPORT_FILE_NAME = `${IMPORT_FILE_PATH}import-${IMPORT_TIME.format('YYYY-MM-DD-HH:mm:ss')}.sql`
shelljs.mkdir(IMPORT_FILE_PATH)
shelljs.touch(IMPORT_FILE_NAME)
shelljs.echo(`/** Generated using diff from ${jsonFileOldPath} => ${jsonFileNewPath} */\n`).toEnd(IMPORT_FILE_NAME)

const rluid = jsonFileNew.uid
const menuDiff = jsonDiff.diff(jsonFileOld.menus, jsonFileNew.menus)
// console.log(util.inspect(menuDiff, false, null))
parseDiff(jsonFileNew, menuDiff, IMPORT_FILE_NAME)

/**
 * Parses the diff returned by json-diff to outputs database changes as stored procedures
 * into the passed file.
 * @param {object} newJsonObj 
 * @param {object} menuDiff 
 * @param {string} filePath 
 */
function parseDiff (newJsonObj, menuDiff, filePath) {
  for (menuUid in menuDiff) {
    outputSQL(newJsonObj, menuDiff, 'menus', [menuUid, rluid], 'sections', filePath)
    const sectionDiff = menuDiff[menuUid].sections
    for (sectionUid in sectionDiff) {
      outputSQL(newJsonObj, sectionDiff, 'sections', [sectionUid, menuUid, rluid], 'items', filePath)
      const itemDiff = sectionDiff[sectionUid].items
      for (itemUid in itemDiff) {
        outputSQL(newJsonObj, itemDiff, 'items', [itemUid, sectionUid, menuUid, rluid], 'optionGroups', filePath)
        const optionGroupDiff = itemDiff[itemUid].optionGroups
        for (optionGroupUid in optionGroupDiff) {
          outputSQL(newJsonObj, optionGroupDiff, 'optionGroups', [optionGroupUid, itemUid, sectionUid, menuUid, rluid], 'options', filePath)
          const optionsDiff = optionGroupDiff[optionGroupUid].options
          for (optionUid in optionsDiff) {
            outputSQL(newJsonObj, optionsDiff, 'options', [optionUid, optionGroupUid, itemUid, sectionUid, menuUid, rluid], null, filePath)
          }
        }
      }
    }
  }
}

/**
 * Outputs a stored procedure based on information from json-diff
 * @param {object} newJsonObj 
 * @param {object} jsonDiff 
 * @param {string} objectType 
 * @param {array} uidStack 
 * @param {string} exclude 
 * @param {string} filePath 
 */
function outputSQL (newJsonObj, jsonDiff, objectType, uidStack, exclude, filePath) {
  const uid = uidStack[0]
  const parentUid = uidStack[1]
  const printType = objectType.substring(0, objectType.length - 1)
  if (isNewChild(uid)) {
    shelljs.echo(`/** Create new ${printType}: ${jsonDiff[uid].name} */\n`).toEnd(filePath)
    outputCreate(jsonDiff, objectType, uid, parentUid, filePath)
  } else if (isDeletedChild(uid)) {
    if (objectType !== 'optionGroups' && objectType !== 'options')
      throw `ERROR: Cannot delete objects of type ${objectType}! Try updating it's isAvailable flag instead`
    shelljs.echo(`/** Delete ${printType}: ${jsonDiff[uid].name} */\n`).toEnd(filePath)
    outputDelete(jsonDiff, objectType, uid, filePath)
  } else {
    const obj = jsonDiff[uid]
    const diffKeys = getDiff(obj, objectType)
    if (diffKeys.length > 0) outputUpdate(newJsonObj, objectType, uidStack, filePath)
  }
}

/**
 * Outputs a stored procedure that creates a new record in the database with a generated uuid.
 * @param {object} jsonDiff 
 * @param {string} objectType 
 * @param {string} key 
 * @param {string} parentUid 
 * @param {string} filePath 
 */
function outputCreate (jsonDiff, objectType, key, parentUid, filePath) {
  const obj = { ...jsonDiff[key] } // shallow copy
  if (obj) { // check if child was defined, else stop recursion here
    for (const newChildObj of obj) { // obj is an array
      const jsonDiffCopy = { ...jsonDiff }
      const uid = uuid()
      newChildObj.uid = uid
      jsonDiffCopy[uid] = { ...newChildObj }
      jsonDiffCopy[uid].__parent = parentUid

      const childType = mapToChildType(objectType)
      if (childType) delete jsonDiffCopy[uid][childType]
      outputStoredProcedure(jsonDiffCopy[uid], objectType, filePath, true)
      // recursion where base case is childType === null (optionGroupOptions have no child)
      if (childType) outputCreate(newChildObj[childType], childType, 'uuid()', uid, filePath)
    }
  }
}

/**
 * Outputs a stored procedure that updates an existing record in the database.
 * Updates are more simple than create and delete because there is no need for recursion.
 * @param {object} newJsonObj 
 * @param {string} objectType 
 * @param {array} uidStack 
 * @param {string} filePath 
 */
function outputUpdate (newJsonObj, objectType, uidStack, filePath) {
  const newObj = getNewObj(newJsonObj, uidStack)
  const printType = objectType.substring(0, objectType.length - 1)
  shelljs.echo(`/** Update ${printType}: ${newObj.name} */\n`).toEnd(filePath)
  outputStoredProcedure(newObj, objectType, filePath)
}

/**
 * Outputs a stored procedure that deletes an optionGroup (and all its child options)
 * or deletes a single option.
 * @param {object} jsonDiff 
 * @param {string} objectType can only be 'optionGroups' or 'options'
 * @param {string} key 
 * @param {string} filePath 
 */
function outputDelete (jsonDiff, objectType, key, filePath) {
  const obj = { ...jsonDiff[key] } // shallow copy
  if (obj) {
    for (const deletedChildUid in obj) { // obj is an object
      const childType = mapToChildType(objectType)
      // recursion where base case is childType === null (optionGroupOptions have no child)
      if (childType) outputDelete(obj[childType], objectType, deletedChildUid, filePath)
    }
    // output the stored procedure after recursion so deleted in reverse order
    const safeUid = key.replace(/__deleted/g, '');
    outputStoredProcedure({ uid: safeUid }, objectType, filePath, true)
  }
}

/**
 * Outputs a stored procedure to the provided file path. SP based on the passed type and delete flag.
 * @param {object} obj 
 * @param {string} objectType 
 * @param {string} filePath 
 * @param {boolean} (optional) spDelete 
 */
function outputStoredProcedure (obj, objectType, filePath, spDelete) {
  let spText;
  switch (objectType) {
    case 'menus': {
      spText = spTemplates.addMenu(obj.end, obj.isAvailable, obj.name, obj.rank, obj.start, obj.uid, obj.__parent)
      break
    }
    case 'sections': {
      spText = spTemplates.addSection(obj.ageLimit, obj.name, obj.rank, obj.uid, obj.__parent)
      break
    }
    case 'items': {
      spText = spTemplates.addItem(obj.description, obj.isAvailable, obj.name, obj.price, obj.rank, obj.uid, obj.__parent)
      break
    }
    case 'optionGroups': {
      spText = spDelete ? spTemplates.deleteOptionGroup(obj.uid) :
        spTemplates.addOptionGroup(obj.name, obj.rank, obj.type, obj.uid, obj.__parent)
      break
    }
    case 'options': {
      spText = spDelete ? spTemplates.deleteOptionGroupOption(obj.uid) :
        spTemplates.addOptionGroupOption(obj.isDefault, obj.name, obj.rank, obj.uid, obj.value, obj.__parent)
      break
    }
    default: throw `objectType: ${objectType} not recognized`
  }
  shelljs.echo(spText).toEnd(filePath)
}

/**
 * Crawls the newJsonObj using a stack of uids
 * @param {object} newJsonObj 
 * @param {array} uidStack 
 */
function getNewObj (newJsonObj, uidStack) {
  let currType = 'menus'
  let currUid = uidStack.pop() // rluid is always first
  let currObj = { ...newJsonObj } // shallow copy
  while (uidStack.length > 0) {
    currUid = uidStack.pop()
    currObj = { ...currObj[currType][currUid] } // shallow copy each iteration
    currType = mapToChildType(currType)
  }
  if (currType) delete currObj[currType]
  currObj.__parent = currUid
  return currObj
}

/**
 * Returns a list of the child keys that are diff'd (excluding the passed parameter)
 * @param {object} obj 
 * @param {string} exclude the child key to ignore (i.e. items for section)
 */
function getDiff (obj, exclude) {
  const diffedChildren = []
  for (child in obj) {
    if (isDiffChild(child, obj, exclude)) diffedChildren.push(child)
  }
  return diffedChildren
}

/**
 * Returns true if child is diff'd
 * @param {string} key 
 * @param {object} obj 
 * @param {string} exclude 
 */
function isDiffChild (key, obj, exclude) {
  const child = obj[key]
  return key !== exclude && typeof child === 'object' && child.hasOwnProperty('__new') && child.hasOwnProperty('__old')
}

/**
 * Returns true if key is flagged as added by json-diff
 * @param {string} key 
 */
function isNewChild (key) {
  return key.endsWith('__added')
}

/**
 * Returns true if key is flagged as deleted by json-diff
 * @param {string} key 
 */
function isDeletedChild (key) {
  return key.endsWith('__deleted')
}

/**
 * Returns the corresponding child type to the passed parent type
 * Returns null if no children (options or invalid)
 * @param {string} parent 
 */
function mapToChildType(parent) {
  switch (parent) {
    case 'menus': return 'sections'
    case 'sections': return 'items'
    case 'items': return 'optionGroups'
    case 'optionGroups': return 'options'
    default: return null
  }
}
