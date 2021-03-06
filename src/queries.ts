import * as Promise from 'bluebird';

const schema = require('./schema').schema;
const RESTAURANT = schema.RESTAURANT;
const RESTAURANT_LOCATION = schema.RESTAURANT_LOCATION;
const MENU = schema.MENU;
const MENU_SECTION = schema.MENU_SECTION;
const ITEM = schema.ITEM;
const OPTION_GROUP = schema.OPTION_GROUP;
const OPTION_GROUP_OPTION = schema.OPTION_GROUP_OPTION;
const OPTION_GROUP_TYPE = schema.OPTION_GROUP_TYPE;

export namespace queries {
  export function getRestaurantLocation (connection, restaurantName) {
    const query = RESTAURANT_LOCATION.select(
        RESTAURANT_LOCATION.id, RESTAURANT_LOCATION.uid, RESTAURANT.restaurantName, RESTAURANT.description, RESTAURANT.phone, RESTAURANT.email, RESTAURANT.website)
      .from(RESTAURANT_LOCATION
        .join(RESTAURANT).on(RESTAURANT.id.equals(RESTAURANT_LOCATION.restaurantId)))
      .where(RESTAURANT.restaurantName.equals(restaurantName))
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, rows) => {
        if (err) reject(err);
        if (!rows || rows.length === 0) reject(`ERROR: Restaurant not found with name: ${restaurantName}`);
        resolve(rows[0]);
      });
    });
  }
  export function getMenus (connection, rlid) {
    const query = MENU.select(
        MENU.id, MENU.uid, MENU.rank, MENU.menuName, MENU.isAvailable, MENU.start, MENU.end)
      .from(MENU)
      .where(MENU.restaurantLocationId.equals(rlid))
      .order(MENU.rank)
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, rows) => {
        if (err) reject(err);
        if (!rows || rows.length === 0) reject(`ERROR: No menus found for restaurant location with id: ${rlid}`);
        resolve(rows);
      });
    });
  }
  export function getMenuSections (connection, mid) {
    const query = MENU_SECTION.select(
        MENU_SECTION.id, MENU_SECTION.uid, MENU_SECTION.rank, MENU_SECTION.sectionName, MENU_SECTION.ageLimit)
      .from(MENU_SECTION)
      .where(MENU_SECTION.menuId.equals(mid))
      .order(MENU_SECTION.rank)
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, rows) => {
        if (err) reject(err);
        if (!rows || rows.length === 0) reject(`ERROR: No menu sections found for menu with id: ${mid}`);
        resolve(rows);
      });
    });
  }
  export function getMenuSectionItems (connection, msid) {
    const query = ITEM.select(
        ITEM.id, ITEM.uid, ITEM.rank, ITEM.itemName, ITEM.description, ITEM.price, ITEM.isAvailable)
      .from(ITEM)
      .where(ITEM.menuSectionId.equals(msid))
      .order(ITEM.rank)
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, rows) => {
        if (err) reject(err);
        if (!rows || rows.length === 0) reject(`ERROR: No items found for menu section with id: ${msid}`);
        resolve(rows);
      });
    });
  }
  export function getItemOptionGroups (connection, iid) {
    const query = OPTION_GROUP.select(
        OPTION_GROUP.id, OPTION_GROUP.uid, OPTION_GROUP.optionGroupName, OPTION_GROUP.rank, OPTION_GROUP_TYPE.type)
      .from(OPTION_GROUP
        .join(OPTION_GROUP_TYPE).on(OPTION_GROUP_TYPE.id.equals(OPTION_GROUP.optionGroupTypeId)))
      .where(OPTION_GROUP.itemId.equals(iid))
      .order(OPTION_GROUP.rank)
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
  export function getItemOptionGroupOptions (connection, ogid) {
    const query = OPTION_GROUP_OPTION.select(
        OPTION_GROUP_OPTION.id, OPTION_GROUP_OPTION.uid, OPTION_GROUP_OPTION.optionGroupOptionName, OPTION_GROUP_OPTION.rank, OPTION_GROUP_OPTION.value, OPTION_GROUP_OPTION.isDefault)
      .from(OPTION_GROUP_OPTION)
      .where(OPTION_GROUP_OPTION.optionGroupId.equals(ogid))
      .order(OPTION_GROUP_OPTION.rank)
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, rows) => {
        if (err) reject(err);
        if (!rows || rows.length === 0) reject(`ERROR: No option group options found for option group with id: ${ogid}`);
        resolve(rows);
      });
    });
  }
  export function getItemMatches (connection, restaurantName, searchName) {
    const query = ITEM.select(
        ITEM.uid, ITEM.itemName, ITEM.price, ITEM.thumbnailImageUrl, MENU_SECTION.sectionName, MENU.menuName)
      .from(ITEM
        .join(MENU_SECTION).on(MENU_SECTION.id.equals(ITEM.menuSectionId))
        .join(MENU).on(MENU.id.equals(MENU_SECTION.menuId))
        .join(RESTAURANT_LOCATION).on(RESTAURANT_LOCATION.id.equals(MENU.restaurantLocationId))
        .join(RESTAURANT).on(RESTAURANT.id.equals(RESTAURANT_LOCATION.restaurantId)))
      .where(ITEM.itemName.like(`%${searchName}%`)
        .and(RESTAURANT.restaurantName.equals(restaurantName)))
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, rows) => {
        if (err) reject(err);
        if (!rows || rows.length === 0) reject(`ERROR: Nothing found in ${restaurantName} that matches ${searchName}`);
        resolve(rows);
      });
    });
  }
  export function getRluid (connection, restaurantName) {
    const query = RESTAURANT_LOCATION.select(RESTAURANT_LOCATION.uid)
      .from(RESTAURANT_LOCATION
        .join(RESTAURANT).on(RESTAURANT.id.equals(RESTAURANT_LOCATION.restaurantId)))
      .where(RESTAURANT.restaurantName.equals(restaurantName))
      .toQuery();
    return new Promise((resolve, reject) => {
      connection.query(query.text, query.values, (err, row) => {
        if (err) reject(err);
        if (!row || row.length === 0) reject(`ERROR: No restaurant found with name ${restaurantName}`);
        resolve(row);
      });
    });
  }
}
