async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@agency.com',
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    console.log('API RESPONSE STATUS:', res.status);
    console.log('API RESPONSE DATA:', data);
  } catch (err: any) {
    console.error('FETCH ERROR:', err);
  }
}

test();
