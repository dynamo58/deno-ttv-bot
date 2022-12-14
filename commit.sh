echo -n "Commit message: "
read _message
echo "$_message"

sed -i '10s/.*/	return db_client.database("data").collection<T>(label)/' src/db/db.ts

git add .
git commit -m "$_message"

echo -n "Push also? [y/anything]"
read _pushprompt
if [ "$_pushprompt" == "y" ]
then
	git push origin main
fi

sed -i '10s/.*/	return db_client.database("testing").collection<T>(label)/' src/db/db.ts
