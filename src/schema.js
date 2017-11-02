const sql = require('sql')
Object.defineProperty(exports, "__esModule", { value: true });

var schema;
(function (schema) {
  schema.ITEM = sql.define({
    name: 'ITEM',
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
  })
  schema.OPTION_GROUP = sql.define({
    name: 'OPTION_GROUP',
    columns: [
      'id',
      'uid',
      'name',
      'rank',
      'itemId',
      'optionGroupTypeId'
    ]
  })
  schema.OPTION_GROUP_TYPE = sql.define({
    name: 'OPTION_GROUP_TYPE',
    columns: [
      {
        name: 'id'
      },
      {
        name: 'name',
        property: 'type' // need to do this so it doesn't collide on optionGroup.name
      }
    ]
  })
  schema.OPTION_GROUP_OPTION = sql.define({
    name: 'OPTION_GROUP_OPTION',
    columns: [
      'id',
      'uid',
      'name',
      'rank',
      'value',
      'isDefault',
      'optionGroupId'
    ]
  })
  schema.MENU_SECTION = sql.define({
    name: 'MENU_SECTION',
    columns: [
      'id',
      'uid',
      'rank',
      'name',
      'ageLimit',
      'menuId'
    ]
  })
  schema.MENU = sql.define({
    name: 'MENU',
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
  })
  schema.RESTAURANT_LOCATION = sql.define({
    name: 'RESTAURANT_LOCATION',
    columns: [
      'id',
      'uid',
      'locationId',
      'restaurantId',
      'posSystemId',
      'timezoneId'
    ]
  })
  schema.RESTAURANT = sql.define({
    name: 'RESTAURANT',
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
  })
})(schema = exports.schema || (exports.schema = {}));
