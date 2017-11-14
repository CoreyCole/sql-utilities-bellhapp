import * as mysql from 'mysql';

import { uploadImageScripts } from '../uploadImages';

const RESTAURANT_NAME = 'Cedars';
const IUID = '9f559133-6663-11e7-860e-01f959516b44';
const RLUID = 'ff3e796c-7c75-4e8d-a0fe-a851f19b7db2';
const CONFIG = require('../config.json');
const CONNECTION = mysql.createConnection(CONFIG);
const TEST_IMG_PATH = './src/test/images/test.jpg';
const TEST_IMG_UID = '99999999-6666-1111-8888-01f959516b44';

describe('upload images', () => {
  describe('search restaurant menu', () => {
    it('should return the items from a restaurant menu like the given name', async () => {
      const matches = await uploadImageScripts.searchRestaurantMenu(CONNECTION, RESTAURANT_NAME, 'tikka');
      expect(matches).toMatchSnapshot();
    });
  });
  describe('upload image', () => {
    const sqlStatements = uploadImageScripts.uploadAndGetSql(TEST_IMG_PATH, IUID, RLUID, TEST_IMG_UID, true);
    it('should return sql statements that match the snapshot', () => {
      expect(sqlStatements).toMatchSnapshot();
    });
    it('should return sql statements with the new image uid occuring twice', () => {
      const indexOfFirstUid = sqlStatements.indexOf(IUID);
      const indexOfLastUid = sqlStatements.lastIndexOf(IUID);
      expect(indexOfFirstUid).toBeGreaterThan(0);
      expect(indexOfLastUid).toBeGreaterThan(indexOfFirstUid); // there are two instances of the new image uid
    });
    it('should return sql statements with calls to add_image and update_item_thumbnail', () => {
      const sqlStatements = uploadImageScripts.uploadAndGetSql(TEST_IMG_PATH, IUID, RLUID, TEST_IMG_UID, true);
      expect(sqlStatements.indexOf('add_item_image')).toBeGreaterThan(0);
      expect(sqlStatements.indexOf('update_item_thumbnail')).toBeGreaterThan(0);
    });
  });
});
