export namespace spTemplates {
  export function addMenu (end, isAvailable, name, rank, start, uid, rluid): string {
    return `      /** params: end, isAvailable, name, rank, start, uid, rluid */
      CALL restaurant.add_or_update_menu("${end}", ${isAvailable}, "${name}", ${rank}, "${start}", "${uid}", "${rluid}");`;
  }
  export function addSection (ageLimit, name, rank, uid, muid): string {
    return `      /** params: ageLimit, name, rank, uid, muid */
      CALL restaurant.add_or_update_section(${ageLimit}, "${name}", ${rank}, "${uid}", "${muid}");`;
  }
  export function addItem (description, isAvailable, name, price, rank, uid, suid): string {
    return `      /** params: description, isAvailable, name, price, rank, uid, suid */
      CALL restaurant.add_or_update_item("${description}", ${isAvailable}, "${name}", ${price}, ${rank}, "${uid}", "${suid}");`;
  }
  export function addOptionGroup (name, rank, type, uid, iuid): string {
    return `      /** params: name, rank, type, uid, iuid */
      CALL restaurant.add_or_update_option_group("${name}", ${rank}, "${type}", "${uid}", "${iuid}");`;
  }
  export function deleteOptionGroup (oguid): string {
    return `      CALL restaurant.delete_option_group("${oguid}");`;
  }
  export function addOptionGroupOption (isDefault, name, rank, uid, value, oguid): string {
    return `      /** params: isDefault, name, rank, uid, value, oguid */
      CALL restaurant.add_or_update_option_group_option(${isDefault}, "${name}", ${rank}, "${uid}", ${value}, "${oguid}");`;
  }
  export function deleteOptionGroupOption (ogouid): string {
    return `      CALL restaurant.delete_option_group_option("${ogouid}");`;
  }
}
