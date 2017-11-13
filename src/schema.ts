import * as sql from 'sql';
sql.setDialect('mysql');

export namespace schema {
  export const ITEM = sql.define({
    name: 'ITEM',
    schema: 'restaurant',
    columns: [
      'id',
      'uid',
      'rank',
      'name',
      'description',
      'price',
      'isAvailable',
      'menuSectionId',
      'thumbnailImageUrl'
    ]
  });
  export const OPTION_GROUP = sql.define({
    name: 'OPTION_GROUP',
    schema: 'restaurant',
    columns: [
      'id',
      'uid',
      'name',
      'rank',
      'itemId',
      'optionGroupTypeId'
    ]
  });
  export const OPTION_GROUP_TYPE = sql.define({
    name: 'OPTION_GROUP_TYPE',
    schema: 'restaurant',
    columns: [
      {
        name: 'id'
      },
      {
        name: 'name',
        property: 'type' // need to do this so it doesn't collide on optionGroup.name
      }
    ]
  });
  export const OPTION_GROUP_OPTION = sql.define({
    name: 'OPTION_GROUP_OPTION',
    schema: 'restaurant',
    columns: [
      'id',
      'uid',
      'name',
      'rank',
      'value',
      'isDefault',
      'optionGroupId'
    ]
  });
  export const MENU_SECTION = sql.define({
    name: 'MENU_SECTION',
    schema: 'restaurant',
    columns: [
      'id',
      'uid',
      'rank',
      'name',
      'ageLimit',
      'menuId'
    ]
  });
  export const MENU = sql.define({
    name: 'MENU',
    schema: 'restaurant',
    columns: [
      'id',
      'uid',
      'rank',
      'name',
      'isAvailable',
      'start',
      'end',
      'restaurantLocationId'
    ]
  });
  export const RESTAURANT_LOCATION = sql.define({
    name: 'RESTAURANT_LOCATION',
    schema: 'restaurant',
    columns: [
      'id',
      'uid',
      'locationId',
      'restaurantId',
      'posSystemId',
      'timezoneId'
    ]
  });
  export const RESTAURANT = sql.define({
    name: 'RESTAURANT',
    schema: 'restaurant',
    columns: [
      'id',
      'uid',
      'name',
      'description',
      'phone',
      'email',
      'website',
      'isActive'
    ]
  });
}
