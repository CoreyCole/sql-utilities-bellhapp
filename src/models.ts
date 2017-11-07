/**
 * Generic type for an object at any level of a menu
 */
export interface MenuObject {
  uid: string;
  name: string;
  __parent?: string;
}

export interface RestaurantLocation {
  uid: string;
  name: string;
  menus: Map<string, Menu>
}

export interface Menu {
  uid: string;
  name: string;
  sections: Map<string, Section>
}

export interface Section {
  uid: string;
  name: string;
  items: Map<string, Item>
}

export interface Item {
  uid: string;
  name: string;
  description: string;
  optionsGroups: Map<string, OptionGroup>
}

export interface OptionGroup {
  uid: string;
  name: string;
  type: string;
  options: Map<string, Option>
}

export interface Option {
  uid: string;
  name: string;
}