import { WttrInResponse } from "./wttr_in.d.ts";
import { APICallResult } from "./_api.ts";

interface IGetWeatherOutput {
	recognized_area: string,
	feels_like_c: number,
	sky_condition: string,
}

export async function get_weather(area: string): Promise<APICallResult<IGetWeatherOutput>> {
	try {
		const r = await fetch(`https://wttr.in/${area}?format=j1`);
		const json = (await r.json()) as WttrInResponse;

		return new APICallResult(200, {
			recognized_area: `${json.nearest_area[0].areaName[0].value}, ${json.nearest_area[0].country[0].value}`,
			feels_like_c: parseInt(json.current_condition[0].FeelsLikeC),
			sky_condition: json.current_condition[0].weatherDesc[0].value,
		});
	} catch { return new APICallResult(500) }
}
