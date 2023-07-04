import worker from '../src/index';

describe('Correios API', () => {
	test('GET / :: 404', async () => {
		const req = new Request('https://example.com', { method: 'GET' });
		const result = await worker.fetch(req);
		expect(result.status).toBe(404);

		const body = await result.json();
		expect(body).toEqual({ status: 404, message: 'Not found' });
	});

	test('GET /api/v1/addresses/:cep :: 200', async () => {
		const req = new Request('https://example.com/api/v1/addresses/74323-270', { method: 'GET' });
		const result = await worker.fetch(req);
		expect(result.status).toBe(200);

		const body = await result.json();
		const expected = {
			cep: '74323-270',
			city: 'Goiânia',
			location: 'Rua dos Inconfidentes Mineiros',
			neighborhood: 'Vila Mauá',
			state: 'GO',
		};
		expect(body).toEqual(expected);
	});

	test('GET /api/v1/addresses/:cep :: 200 :: children', async () => {
		const req = new Request('https://example.com/api/v1/addresses/74691-550', { method: 'GET' });
		const result = await worker.fetch(req);
		expect(result.status).toBe(200);

		const { cep, children } = await result.json();
		expect(cep).toEqual('74691-550');
		expect(children.length).toEqual(6);
	});
});
