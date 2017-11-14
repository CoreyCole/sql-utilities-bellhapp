import * as path from 'path';
import * as shell from 'shelljs';

import { queries } from './queries';
import { spTemplates } from './spTemplates';

const S3_URL = 'https://s3-us-west-2.amazonaws.com/bellhapp-restaurant-images';

export namespace uploadImageScripts {
  export async function searchRestaurantMenu (connection, restaurantName: string, searchName: string) {
    const itemMatches = await queries.getItemMatches(connection, restaurantName, searchName);
    const rluid = await queries.getRluid(connection, restaurantName)
      .map(row => row.uid).reduce(uid => uid);
    return {
      searchName: searchName,
      rluid: rluid,
      itemMatches: itemMatches.map(row => `${row.uid} : ${row.itemName} : ${row.price} : ${row.thumbnailImageUrl} : ${row.sectionName} (section) : ${row.menuName} (menu)`)
    };
  }
  export function uploadAndGetSql (imagePath: string, itemUid: any, rluid: string, newImageUid, dryRun?: boolean) {
    compressToThumb(imagePath, newImageUid);
    if (!dryRun) uploadToS3(imagePath, rluid, newImageUid);
    return `${spTemplates.addItemImage(itemUid, newImageUid)}
      ${spTemplates.updateItemThumbnail(itemUid, `${S3_URL}/${rluid}/thumbnails/${newImageUid}.jpg`)}`;
  }
  function compressToThumb (imagePath: string, newImageUid) {
    const dirname = path.dirname(imagePath);
    shell.exec(`convert -define jpeg:size=200x200 '${imagePath}' -thumbnail 100x100^ -gravity center -extent 100x100 '${dirname}/${newImageUid}-thumb.jpg'`);
    shell.exec(`convert -strip -interlace Plane -gaussian-blur 0.05 -quality 85% '${dirname}/${newImageUid}-thumb.jpg' '${dirname}/${newImageUid}-compressed-thumb.jpg'`);
  }
  function uploadToS3 (imagePath: string, rluid: string, newImageUid: string) {
    const dirname = path.dirname(imagePath);
    const thumbnailName = `${newImageUid}-compressed-thumb.jpg`;
    shell.exec(`aws s3 cp ${imagePath} s3://bellhapp-restaurant-images/${rluid}/${newImageUid}.jpg --acl public-read`);
    shell.exec(`aws s3 cp ${dirname}/${thumbnailName} s3://bellhapp-restaurant-images/${rluid}/thumbnails/${newImageUid}.jpg --acl public-read`);
  }
}
