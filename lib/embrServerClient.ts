export type EmbrServerResponse = {
  ok: boolean;
  source?: string;
  message?: string;
  embrRead?: {
    domain: string;
    skill: string;
    priority: string;
    voice: string;
    nextMove: string;
  };
  response?: string;
  error?: string;
};

export async function callEmbrServerRespond(
  message: string
): Promise<EmbrServerResponse | null> {
  const baseUrl = process.env.EMBR_SERVER_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const res = await fetch(`${baseUrl}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || `Embr Server failed with ${res.status}`,
      };
    }

    return data;
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown Embr Server connection error",
    };
  }
}
