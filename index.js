export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const headers = {
      'Access-Control-Allow-Origin': 'https://baserow.io',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers,
      });
    }

    try {
      if (path === '/api/matters' && method === 'GET') {
        const result = await fetchBaserowData(env.BASEROW_TABLE_ID, env.BASEROW_TOKEN);
        return jsonResponse(result, headers);
      }

      if (path === '/api/matters-overview' && method === 'GET') {
        const result = await fetchBaserowData(env.BASEROW_TABLE_ID, env.BASEROW_TOKEN);
        const inProgress = result.filter(matter => {
          const status = matter.Status?.value || matter.Status;
          return status === 'In Progress';
        });
        return jsonResponse(inProgress, headers);
      }

      const matchMatter = path.match(/^\/api\/matter\/(\d+)$/);
      if (matchMatter && method === 'GET') {
        const id = matchMatter[1];
        const url = `https://api.baserow.io/api/database/rows/table/${env.BASEROW_TABLE_ID}/${id}/?user_field_names=true`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Token ${env.BASEROW_TOKEN}`
          }
        });
        const data = await res.json();
        return jsonResponse(data, headers);
      }

      const matchHistory = path.match(/^\/api\/matter\/(\d+)\/history$/);
      if (matchHistory && method === 'GET') {
        const id = matchHistory[1];
        const url = `https://api.baserow.io/api/database/rows/table/${env.HISTORY_TABLE_ID}/?user_field_names=true&filter__Matter__link_row_contains=${id}`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Token ${env.BASEROW_TOKEN}`
          }
        });
        const data = await res.json();
        return jsonResponse(data, headers);
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function fetchBaserowData(tableId, token) {
  const url = `https://api.baserow.io/api/database/rows/table/${tableId}/?user_field_names=true`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`
    }
  });
  const data = await res.json();
  return data.results;
}

function jsonResponse(data, headers) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}
