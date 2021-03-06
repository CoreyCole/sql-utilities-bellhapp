# Bellhapp SQL Utilities
The purpose of this repository is to make it easier to do CRUD operations on the bellhapp database.
#### Features:
- Exporting JSON representation of the database for 1 restaurant location
- Importing JSON by outputting a file of SQL statements
  - This uses a diff of two JSON files to output SQL statements only for changes made
- Create/Update menus, sections, items, optionGroups, optionGroupOptions
- Delete optionGroups, optionGroupOptions

#### Setup:
- clone the repository
- run `npm install` or `yarn` in the cloned dir to install dependencies
- add `src/config.json` for database credentials
- run `npm run compile` to build from source
- run `npm install -g` to add command `bh-sql` to your global node commands

## Usage
**Make sure to run commands from root of repo so file paths work**
```
  Usage: bh-sql <command> [options]

  Command:
    search
    uploadImage
    export
    import

  Options:
    -r, --restaurantName <restaurantName>      The name of the restaurant
    -e, --exportPath [exportPath]              Optional export location, defaults to ./build/exports
    -o, --oldJson <oldJson>                    The originally exported json file
    -n, --newJson <newJson>                    The edited json file
    -O, --sqlOutImportPath [sqlOutImportPath]  Optional import location, defaults to ./build/imports
    -s, --searchName <searchName>              The partial name of what you want to search for in the menu for the given restaurant
    -R, --restaurantUid <restaurantUid>        The restaurant location uid for the image upload
    -I, --itemUid <itemUid>                    The uid of the item you want to upload an image for
    -i, --imagePath <imagePath>                The path to the image you want to upload
    -d, --dryRun [dryRun]                      Optional flag to run upload without actually uploading to s3 (for testing)
    -h, --help                                 output usage information
```

## Examples
### Uploading images to S3
#### Search restaurant menu for items by name (get uid)
This is output everything from Cedars menu that has a name like `"tikka"`
```
bh-sql search --restaurantName Cedars --searchName tikka
```

#### Process and upload image to S3 using itemUid from search
This will process and upload an image to S3 and output the commands required to attach that image to the item in the database
```
bh-sql uploadImage --restaurantUid <restaurantUid> --itemUid <itemUid> --imagePath <pathToImage>
```

### Exporting from database to JSON
This will output a JSON file to `build/exports/` with the current state of the menu for restaurant `"Cedars"`
```shell
bh-sql export --restaurantName Cedars
```

### Printing export to PDF
This will convert an exported json file to a markdown pdf in `build/exports`
```shell
bh-sql pdf --pdfJson ./build/exports/export-2017-11-02-00-28-54.json
```

### Importing to database from JSON
This will compare oldJson to newJson and output a SQL file to `build/imports/` based on the differences between them.
**Make sure to keep a copy of the original export so the import script can do a diff.**
```shell
bh-sql import --oldJson ./build/exports/export-2017-11-02-00-28-54.json --newJson ./build/exports/export-changes.json
```

Full steps:
```shell
# generate a fresh export from the database
bh-sql export -r Cedars

# make an exact copy of that new export
cp build/exports/<new-exported-file>.json exports/export-changes.json

# make your changes to exports/export-changes.json
# check your diff using json-diff (npm install -g json-diff)
json-diff build/exports/<new-exported-file>.json exports/export-changes.json

# then run the import script
bh-sql import -o ./build/exports/export-2017-11-02-00-28-54.json -n ./build/exports/export-changes.json
```

#### `jsonFileNew` Format
##### Creating
To create a new `menu`, `section`, `item`, `optionGroup` or `optionGroupOption`, add to the json as an array under a `'uuid()'` key.
All of the children of this new object must also have `'uuid()'` keyed arrays for child objects to be created. (i.e. new item => new options)
The `'uuid()'` object must always be an array in order to support creating multiple sibling objects at once. (See optionGroupOptions section in example below)
```diff
   menus: {
     e5bd5cdb-5c58-40ec-8f96-f1f158687e7c: {
       sections: {
         1dbfeab4-57cc-415c-9049-9c7efefe6012: {
           items: {
+            uuid(): [
+              {
+                uid: "uuid()"
+                rank: 0
+                name: "Hummus"
+                description: "The original Middle Eastern dip of garbanzo beans, tahini sauce and a special dressing. Served with pita bread."
+                price: 450
+                isAvailable: 1
+                optionGroups: {
+                  uuid(): [
+                    {
+                      uid: "uuid()"
+                      name: "Sides"
+                      rank: 10
+                      type: "OPTION_ADD"
+                      options: {
+                        uuid(): [
+                          {
+                            uid: "uuid()"
+                            name: "Chai"
+                            rank: 0
+                            value: 295
+                            isDefault: 0
+                          }
+                          {
+                            uid: "uuid()"
+                            name: "Mango Lassi"
+                            rank: 1
+                            value: 395
+                            isDefault: 0
+                          }
+                        ]
+                      }
+                    }
+                  ]
+                }
+              }
+            ]
           }
         }
       }
     }
   }
```

##### Updating
To update an existing object, simply change the fields.
**NOTE: this does not work if a new child object needs to be created. See `Creating` section.**
```diff
   menus: {
     e5bd5cdb-5c58-40ec-8f96-f1f158687e7c: {
       sections: {
         1dbfeab4-57cc-415c-9049-9c7efefe6012: {
           items: {
             9f559132-6663-11e7-860e-01f959516b44: {
               optionGroups: {
                 4a656751-bc55-4482-a596-b6a72122690f: {
                   options: {
                     61836104-1df2-4ad5-83a2-16151f147df7: {
-                      name: "Paneer"
+                      name: "Paneer (Farmer Cheese)"
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
   }
```

##### Deleting
To remove an `optionGroup` or `optionGroupOption` from the database, simply remove it from the JSON.
**If you want to remove a menu or item, update its `isAvailable` flag to 0**
**Sections cannot be deleted and do not have an `isAvailable` flag**
```diff
   menus: {
     e5bd5cdb-5c58-40ec-8f96-f1f158687e7c: {
       sections: {
         1dbfeab4-57cc-415c-9049-9c7efefe6012: {
           items: {
             9f559130-6663-11e7-860e-01f959516b44: {
               optionGroups: {
                 c8fdd022-8131-11e7-af18-28cfe91e4031: {
                   options: {
-                    d59d2b10-8148-11e7-abcf-06681ea214cf: {
-                      id: 1476
-                      uid: "d59d2b10-8148-11e7-abcf-06681ea214cf"
-                      name: "Mango Lassi"
-                      rank: 1
-                      value: 395
-                      isDefault: 0
-                    }
                   }
                 }
               }
             }
           }
         }
       }
     }
   }
```
