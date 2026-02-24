import { Err, Ok, Result } from "ts-results";
import { LanyardData, LanyardResponse } from "./types";
import axios from "axios";
import { config } from "../config";

const LANYARD_API = "https://api.lanyard.rest/v1/users";

export async function getLanyardData(): Promise<Result<LanyardData, string>> {
  try {
    const { data }: { data: LanyardResponse } = await axios.get(
      `${LANYARD_API}/${config.discordUserId}`,
    );

    if (data.data && data.success) return Ok(data.data);
    return Err(
      data.error?.message ??
        "no error message received, but lanyard api did not provide data / result === true",
    );
  } catch (e) {
    if (e instanceof Error) return Err(e.message);
    return Err("an unknown error has happened");
  }
}
