import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Config } from "./lib.ts";
import { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";


const PORT = (() => {
	const p = Deno.env.get("PORT");
	if (p) {
		return parseInt(p);
	}

	return 3000;
})()
// Deno.env.set("IS_LOCAL_DEVELOPMENT", "1");
// Deno.env.set("PORT", PORT.toString());

const listen_local = () => {
	const router = new Router();
	router.get("/", (ctx) => {
		ctx.response.body = "Hello :)";
	});

	// router.post("/notification", async (ctx) => {
	// 	console.log(ctx.request.body);

	// 	const body = ctx.request.body();

	// 	if (body.type === "json") {

	// 		console.log(await body.value);
	// 		console.log("Sucessfully established EventSub webhooks");
	// 	}


	// 	// if (ctx.request.body.event) {
	// 	// console.log(req)
	// 	// }
	// });

	const app = new Application();
	app.use(router.routes());
	app.use(router.allowedMethods());

	app.listen({ port: PORT });
}


async function main(): Promise<void> {
	const bot = new Config(
		Deno.env.get("TWITCH_LOGIN")!,
		Deno.env.get("TWITCH_OAUTH")!,
		Deno.env.get("TWITCH_CLIENT_ID")!,
		Deno.env.get("TWITCH_CLIENT_SECRET")!,
		"GIGACHAD\ ",
	);
	bot.disregard_users([
		"lovcen", "Fossabot", "Nightbot", "Snusbot",
		"StreamElements", "SchnozeBot", "ThePositiveBot",
		"KattahBot", "AnotherTTVViewer", "Streamlabs", "moobot"
	]);
	await bot.join_channels(["gkey", "pepega00000"]);
	await bot.run();
}

try {
	listen_local();
	await main();
} catch (e) {
	console.error(e);
}
