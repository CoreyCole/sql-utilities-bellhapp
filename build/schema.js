"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("sql");
sql.setDialect('mysql');
var schema;
(function (schema) {
    schema.ITEM = sql.define({
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
    schema.OPTION_GROUP = sql.define({
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
    schema.OPTION_GROUP_TYPE = sql.define({
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
    schema.OPTION_GROUP_OPTION = sql.define({
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
    schema.MENU_SECTION = sql.define({
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
    schema.MENU = sql.define({
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
    schema.RESTAURANT_LOCATION = sql.define({
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
    schema.RESTAURANT = sql.define({
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
})(schema = exports.schema || (exports.schema = {}));
