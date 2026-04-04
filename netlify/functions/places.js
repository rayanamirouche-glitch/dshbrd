exports.handler = async function (event, context) {
  const API_KEY = process.env.PLACES_API_KEY;
  const { place_id } = event.queryStringParameters || {};

  if (!place_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing place_id" }),
    };
  }

  const fields = "name,rating,user_ratings_total,business_status,photos,url,formatted_address";

  // Utilise toujours place_id direct — plus fiable que la conversion CID
  const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=${fields}&key=${API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status !== "OK") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: data.status, result: null }),
      };
    }

    const r = data.result;
    const photo_ref = r.photos?.[0]?.photo_reference || null;
    const photo_url = photo_ref
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo_ref}&key=${API_KEY}`
      : null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        name: r.name,
        rating: r.rating || null,
        reviews: r.user_ratings_total || 0,
        status: r.business_status || "UNKNOWN",
        address: r.formatted_address || "",
        maps_url: r.url || "",
        photo_url,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
