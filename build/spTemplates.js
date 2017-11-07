"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var spTemplates;
(function (spTemplates) {
    function addMenu(end, isAvailable, name, rank, start, uid, rluid) {
        return `/** params: end, isAvailable, name, rank, start, uid, rluid */
      CALL restaurant.add_or_update_menu("${end}", ${isAvailable}, "${name}", ${rank}, "${start}", "${uid}", "${rluid}");`;
    }
    spTemplates.addMenu = addMenu;
    function addSection(ageLimit, name, rank, uid, muid) {
        return `/** params: ageLimit, name, rank, uid, muid */
      CALL restaurant.add_or_update_section(${ageLimit}, "${name}", ${rank}, "${uid}", "${muid}");`;
    }
    spTemplates.addSection = addSection;
    function addItem(description, isAvailable, name, price, rank, uid, suid) {
        return `/** params: description, isAvailable, name, price, rank, uid, suid */
      CALL restaurant.add_or_update_item("${description}", ${isAvailable}, "${name}", ${price}, ${rank}, "${uid}", "${suid}");`;
    }
    spTemplates.addItem = addItem;
    function addOptionGroup(name, rank, type, uid, iuid) {
        return `/** params: name, rank, type, uid, iuid */
      CALL restaurant.add_or_update_option_group("${name}", ${rank}, "${type}", "${uid}", "${iuid}");`;
    }
    spTemplates.addOptionGroup = addOptionGroup;
    function deleteOptionGroup(oguid) {
        return `CALL restaurant.delete_option_group("${oguid}");`;
    }
    spTemplates.deleteOptionGroup = deleteOptionGroup;
    function addOptionGroupOption(isDefault, name, rank, uid, value, oguid) {
        return `/** params: isDefault, name, rank, uid, value, oguid */
      CALL restaurant.add_or_update_option_group_option(${isDefault}, "${name}", ${rank}, "${uid}", ${value}, "${oguid}");`;
    }
    spTemplates.addOptionGroupOption = addOptionGroupOption;
    function deleteOptionGroupOption(ogouid) {
        return `CALL restaurant.delete_option_group_option("${ogouid}");`;
    }
    spTemplates.deleteOptionGroupOption = deleteOptionGroupOption;
})(spTemplates = exports.spTemplates || (exports.spTemplates = {}));
