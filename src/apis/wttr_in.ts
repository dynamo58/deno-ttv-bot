import { WttrInResponse } from "./wttr_in.d.ts";
import { APICallResult } from "./_api.ts";

export async function get_weather_str(area_name: string): Promise<APICallResult<string>> {
	try {
		const r = await fetch(`https://wttr.in/${area_name}?format=j1`);
		const weather = (await r.json()) as WttrInResponse;

		let dir_str;
		const dir = parseInt(weather.current_condition[0].winddirDegree);
		if (dir < 22.5 || dir >= 337.5) dir_str = "⬆️";
		else if (dir < 67.5) dir_str = "↗️";
		else if (dir < 122.5) dir_str = "➡️";
		else if (dir < 157.5) dir_str = "↘️";
		else if (dir < 202.5) dir_str = "⬇️";
		else if (dir < 247.5) dir_str = "↙️";
		else if (dir < 292.5) dir_str = "⬅️";
		else if (dir < 337.5) dir_str = "↖️";

		const temp = "🌡️ " + weather.current_condition[0].temp_C + "° C";
		const humid = "🌫️ " + weather.current_condition[0].humidity + "%";
		const pressure = "🔽 " + weather.current_condition[0].pressure + " hPa";
		const precip = "💧 " + weather.current_condition[0].precipMM + " mm";
		const wind = dir + weather.current_condition[0].windspeedKmph + " km/h";

		let area = '';
		let country = '';

		try {
			area = weather.nearest_area[0].areaName[0].value;
			// deno-lint-ignore no-empty
		} catch { }
		try {
			country = weather.nearest_area[0].country[0].value;
			// deno-lint-ignore no-empty
		} catch { }

		return new APICallResult(200, `Weather in ${area}, ${country}: ${temp}, ${humid}, ${pressure}, ${precip}, ${dir_str} ${wind}`);
	} catch { return new APICallResult(500) }
}
