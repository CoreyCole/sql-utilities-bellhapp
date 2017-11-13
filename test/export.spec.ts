import * as mysql from 'mysql';

import { exportScripts } from '../src/export';

const RESTAURANT_NAME = 'Cedars';
const CONFIG = require('../src/config.json');
const CONNECTION = mysql.createConnection(CONFIG);

describe('json export', () => {
  it('should export restaurant location data given a restaurant name', async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    const restaurantLocation = await exportScripts.getRestaurantLocation(CONNECTION, RESTAURANT_NAME);
    expect(restaurantLocation).toBeDefined();
    expect(restaurantLocation.id).toBeDefined();
    expect(restaurantLocation.uid).toBeDefined();
    expect(restaurantLocation.name).toBeDefined();
    expect(restaurantLocation.menus).toBeDefined();
  });
});
