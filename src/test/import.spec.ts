import * as deepcopy from 'deepcopy';

import { importScripts } from '../import';
import { RestaurantLocation } from '../models';
import { spTemplates } from '../spTemplates';

const JSON_FILE = './exports/export-simple.json';
const MENU_UID = 'e5bd5cdb-5c58-40ec-8f96-f1f158687e7c';
const SECTION_UID = '1dbfeab4-57cc-415c-9049-9c7efefe6012';
const ITEM_UID = '9f559130-6663-11e7-860e-01f959516b44';
const OPTION_GROUP_UID = 'c8fdd022-8131-11e7-af18-28cfe91e4031';
const OPTION_UID = 'd599d95a-8148-11e7-abcf-06681ea214cf';

const jsonObj = require(JSON_FILE) as RestaurantLocation;

describe('json import', () => {
  it('should output nothing if there is no diff', () => {
    const diff = importScripts.getDiff(jsonObj, jsonObj);
    expect(diff).toBeUndefined();
  });
  describe('create', () => {
    it('should create a new menu', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus['uuid()'] = createNew('menu', 1);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 1);
    });
    it('should create many menus', () => {
      const HOW_MANY = 5;
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus['uuid()'] = createNew('menu', HOW_MANY);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', HOW_MANY);
    });
    it('should create a new section', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections['uuid()'] = createNew('section', 1);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', 1);
    });
    it('should create many sections', () => {
      const HOW_MANY = 5;
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections['uuid()'] = createNew('section', HOW_MANY);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', HOW_MANY);
    });
    it('should create a new item', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items['uuid()'] = createNew('item', 1);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addItem', 1);
    });
    it('should create many items', () => {
      const HOW_MANY = 5;
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items['uuid()'] = createNew('item', HOW_MANY);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addItem', HOW_MANY);
    });
    it('should create a new optionGroup', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups['uuid()'] = createNew('optionGroup', 1);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroup', 1);
    });
    it('should create many optionGroups', () => {
      const HOW_MANY = 5;
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups['uuid()'] = createNew('optionGroup', HOW_MANY);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroup', HOW_MANY);
    });
    it('should create a new option', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups[OPTION_GROUP_UID].options['uuid()'] = createNew('option', 1);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroupOption', 1);
    });
    it('should create many options', () => {
      const HOW_MANY = 5;
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups[OPTION_GROUP_UID].options['uuid()'] = createNew('option', HOW_MANY);
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroupOption', HOW_MANY);
    });
    it('should create nested MenuObjects', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus['uuid()'] = [{
        sections: {
          'uuid()': [{
            items: {
              'uuid()': [{
                optionGroups: {
                  'uuid()': [{
                    options: {
                      'uuid()': [{}]
                    }
                  }]
                }
              }]
            }
          }]
        }
      }];
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 1);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', 1);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addItem', 1);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroup', 1);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroupOption', 1);
    });
    it('should create complex nested MenuObjects', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus['uuid()'] = [{
        sections: {
          'uuid()': [{
            items: {
              'uuid()': [{
                optionGroups: {
                  'uuid()': [{
                    options: {
                      'uuid()': [{}]
                    }
                  }]
                }
              }]
            }
          }]
        }
      },
      {
        sections: {
          'uuid()': [{
            items: {
              'uuid()': [{
                optionGroups: {
                  'uuid()': [{
                    options: {
                      'uuid()': [{}]
                    }
                  }]
                }
              }]
            }
          },
          {
            items: {
              'uuid()': [{
                optionGroups: {
                  'uuid()': [{
                    options: {
                      'uuid()': [{}]
                    }
                  }]
                }
              },
              {
                optionGroups: {
                  'uuid()': [{
                    options: {
                      'uuid()': [{}]
                    }
                  },
                  {
                    options: {
                      'uuid()': [{}, {}]
                    }
                  }]
                }
              }]
            }
          }]
        }
      }];
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 2);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', 3);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addItem', 4);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroup', 5);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroupOption', 6);
    });
  });
  describe('update', () => {
    it('should update menu', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].menuName = 'new name';
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 1);
    });
    it('should update section', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].sectionName = 'new name';
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', 1);
    });
    it('should update item', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].itemName = 'new name';
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addItem', 1);
    });
    it('should update optionGroup', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups[OPTION_GROUP_UID].optionGroupName = 'new name';
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addItem', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroup', 1);
    });
    it('should update option', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups[OPTION_GROUP_UID].options[OPTION_UID].optionGroupOptionName = 'new name';
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addMenu', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addSection', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addItem', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroup', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'addOptionGroupOption', 1);
    });
  });
  describe('delete', () => {
    it('should not allow deleting a menu', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      delete jsonObjCopy.menus[MENU_UID];
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      let err;
      let sqlOut;
      try {
        sqlOut = importScripts.parseDiff(jsonObjCopy, diff);
      } catch (e) {
        err = e;
      }
      expect(sqlOut).toBeUndefined();
      expect(err).toBeDefined();
      expect(err).toMatchSnapshot();
    });
    it('should not allow deleting a section', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      delete jsonObjCopy.menus[MENU_UID].sections[SECTION_UID];
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      let err;
      let sqlOut;
      try {
        sqlOut = importScripts.parseDiff(jsonObjCopy, diff);
      } catch (e) {
        err = e;
      }
      expect(sqlOut).toBeUndefined();
      expect(err).toBeDefined();
      expect(err).toMatchSnapshot();
    });
    it('should not allow deleting an item', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      delete jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID];
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      let err;
      let sqlOut;
      try {
        sqlOut = importScripts.parseDiff(jsonObjCopy, diff);
      } catch (e) {
        err = e;
      }
      expect(sqlOut).toBeUndefined();
      expect(err).toBeDefined();
      expect(err).toMatchSnapshot();
    });
    it('should delete an optionGroup', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      delete jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups[OPTION_GROUP_UID];
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'deleteOptionGroup', 1);
    });
    it('should delete an option', () => {
      const jsonObjCopy = deepcopy(jsonObj);
      delete jsonObjCopy.menus[MENU_UID].sections[SECTION_UID].items[ITEM_UID].optionGroups[OPTION_GROUP_UID].options[OPTION_UID];
      const diff = importScripts.getDiff(jsonObj, jsonObjCopy);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'deleteOptionGroup', 0);
      expectSpCallsFromDiff(diff, jsonObjCopy, 'deleteOptionGroupOption', 1);
    });
  });
});
/**
 * Parses the passed diff and pies on the number of sp calls made
 * @param diff
 * @param jsonObjCopy
 * @param spCounts
 */
function expectSpCallsFromDiff (diff, jsonObjCopy, spName, numCalls) {
  const spSpy = jest.spyOn(spTemplates, spName);
  const sqlOut = importScripts.parseDiff(jsonObjCopy, diff);
  expect(spSpy).toHaveBeenCalledTimes(numCalls);
  expect(sqlOut).toBeDefined();
  expect(sqlOut.length).toMatchSnapshot();
  spSpy.mockRestore();
}
/**
 * Creates n new MenuObjects of the passed type
 * @param type
 * @param n
 */
function createNew (type: string, n: number): any[] {
  switch (type) {
    case 'menu': return createNewMenus(n);
    case 'section': return createNewSections(n);
    case 'item': return createNewItems(n);
    case 'optionGroup': return createNewOptionGroups(n);
    case 'option': return createNewOptions(n);
    default: throw new Error(`MenuObject type: ${type} not recognized`);
  }
}
/**
 * Creates n new menus and returns the array
 * @param n
 */
function createNewMenus (n: number): any[] {
  const menuProto = {
    uid: 'uuid()',
    name: 'test menu',
    isAvailable: 1,
    start: null,
    end: null
  };
  return createArr(n, menuProto);
}
/**
 * Create n new section and returns the array
 * @param n
 */
function createNewSections (n: number) {
  const sectionProto = {
    uid: 'uuid()',
    name: 'test section',
    isAvailable: 1,
    start: null,
    end: null
  };
  return createArr(n, sectionProto);
}
/**
 * Creates n new items and returns the array
 * @param n
 */
function createNewItems (n: number) {
  const itemProto = {
    uid: 'uuid()',
    name: 'test item',
    isAvailable: 1,
    start: null,
    end: null
  };
  return createArr(n, itemProto);
}
/**
 * Creates n new optionGroups and returns the array
 * @param n
 */
function createNewOptionGroups (n: number) {
  const optionGroupProto = {
    uid: 'uuid()',
    name: 'test option group',
    isAvailable: 1,
    start: null,
    end: null
  };
  return createArr(n, optionGroupProto);
}
/**
 * Create n new options and returns the array
 * @param n
 */
function createNewOptions (n: number) {
  const optionProto = {
    uid: 'uuid()',
    name: 'test option',
    isAvailable: 1,
    start: null,
    end: null
  };
  return createArr(n, optionProto);
}
/**
 * Uses the passed object prototype to create an array of n objects
 * Increments their rank and name
 * @param n
 * @param objProto
 */
function createArr (n: number, objProto: any): any[] {
  let arr: any[] = [];
  for (let i = 0; i < n; i++) {
    const objCopy = { ...objProto };
    objCopy.rank = i;
    objCopy.name = `${objCopy.name} ${i}`;
    arr.push(objCopy);
  }
  return arr;
}
