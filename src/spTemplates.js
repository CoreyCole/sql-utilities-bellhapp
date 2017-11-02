const sql = require('sql')
Object.defineProperty(exports, "__esModule", { value: true });

var templates;
(function (templates) {
  templates.addMenu = function (end, isAvailable, name, rank, start, uid, rluid) {
    return `CALL restaurant.add_or_update_menu(
  '${end}', ${isAvailable}, '${name}', ${rank}, '${start}', '${uid}', '${rluid}' 
);\n`
  }
  templates.addSection = function (ageLimit, name, rank, uid, muid) {
    return `CALL restaurant.add_or_update_section(
  ${ageLimit}, '${name}', ${rank}, '${uid}', '${muid}'
);\n`
  }
  templates.addItem = function (description, isAvailable, name, price, rank, uid, suid) {
    return `CALL restaurant.add_or_update_item(
  '${description}', ${isAvailable}, '${name}', ${price}, ${rank}, '${uid}', '${suid}'
);\n`
  }
  templates.addOptionGroup = function (name, rank, type, uid, iuid) {
    return `CALL restaurant.add_or_update_option_group(
  '${name}', ${rank}, '${type}', '${uid}', '${iuid}'
);\n`
  }
  templates.deleteOptionGroup = function (oguid) {
    return `CALL restaurant.delete_option_group('${oguid}');\n`
  }
  templates.addOptionGroupOption = function (isDefault, name, rank, uid, value, oguid) {
    return `CALL restaurant.add_or_update_option_group_option(
  ${isDefault}, '${name}', ${rank}, '${uid}', ${value}, '${oguid}'
);\n`
  }
  templates.deleteOptionGroupOption = function (ogouid) {
    return `CALL restaurant.delete_option_group_option('${ogouid})');\n`
  }
})(templates = exports.templates || (exports.templates = {}));
