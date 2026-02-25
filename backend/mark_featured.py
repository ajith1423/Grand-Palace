from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['gpgt']

# Mark exactly 4 products as featured
products = list(db.products.find({}).limit(4))
for p in products:
    db.products.update_one({'_id': p['_id']}, {'$set': {'is_featured': True}})

print(f"Marked {len(products)} products as featured!")
