import http from 'http';
const req = http.get('http://localhost:3001/api/v1/', (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
