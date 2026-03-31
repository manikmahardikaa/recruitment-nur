import axios from "axios";

export async function getZoomAccessToken() {
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`;

  const response = await axios.post(
    tokenUrl,
    {},
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    }
  );

  return response.data.access_token;
}

export async function createZoomMeeting(topic: string, startTime: Date) {
  try {
    const accessToken = await getZoomAccessToken();

    const meetingData = {
      topic,
      type: 2,
      start_time: startTime.toISOString(),
      duration: 60,
      timezone: "Asia/Jakarta",
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        audio: "voip",
      },
    };

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.join_url;
  } catch {
    throw new Error("Gagal membuat Zoom meeting.");
  }
}
