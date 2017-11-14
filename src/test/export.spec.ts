import * as mysql from 'mysql';

import { exportScripts } from '../export';

const RESTAURANT_NAME = 'Cedars';
const CONFIG = require('../config.json');
const CONNECTION = mysql.createConnection(CONFIG);

describe('json export', () => {
  // WARNING: this takes super long to run, run `npm run test-watch`
  //          so that this only gets tested once if you're not changing
  //          related files
  it('should export restaurant location data given a restaurant name', async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
    const restaurantLocation = await exportScripts.getRestaurantLocation(CONNECTION, RESTAURANT_NAME);
    expect(restaurantLocation).toBeDefined();
    expect(restaurantLocation.id).toBeDefined();
    expect(restaurantLocation.uid).toBeDefined();
    expect(restaurantLocation.restaurantName).toBeDefined();
    expect(restaurantLocation.menus).toBeDefined();
  });
});
