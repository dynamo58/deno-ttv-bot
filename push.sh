echo -n "Commit message: "
read _message
echo "$_message"

sed -i '10s/.*/	return db_client.database("data").collection<T>(label)/' src/db/db.ts

git add .
git push origin main
git commit -m "$_message"

sed -i '10s/.*/	return db_client.database("testing").collection<T>(label)/' src/db/db.ts
