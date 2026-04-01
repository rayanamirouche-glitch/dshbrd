exports.handler = async function(event) {
  const cid = event.queryStringParameters.cid;
  if (!cid) return { statusCode: 400, body: "Missing cid" };
  
  const key = process.env.PLACES_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?cid=${cid}&fields=name,rating,user_ratings_total&key=${key}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
};
