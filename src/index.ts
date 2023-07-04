import { Router } from 'itty-router';

const notFoundError = () =>
	new Response(JSON.stringify({ message: 'Not found', status: 404 }), {
		status: 404,
		headers: { 'Content-Type': 'application/json' },
	});

const internalServerError = (message: String, error: Error) =>
	new Response(
		JSON.stringify({
			message,
			detail: error.stack,
			status: 503,
		}),
		{ status: 503, headers: { 'Content-Type': 'application/json' } }
	);

interface Dado {
	uf: String;
	localidade: String;
	logradouroDNEC: String;
	bairro: String;
	cep: String;
}

interface ConsultaResponse {
	erro: boolean;
	mensagem: string;
	total: number;
	dados: Array<Dado>;
}

interface Address {
	cep: string;
	state?: string;
	city?: string;
	neighborhood?: string;
	location?: string;
	children?: Array<Address>;
}

const router = Router();

router.get('/api/v1/addresses/:cep', async ({ params }) => {
	const cep = params.cep.replaceAll('-', '');

	const init: RequestInit = {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			cep: cep,
		}),
	};

	// console.info(`Fetching CEP ${cep}`);
	const url = new URL('https://buscacepinter.correios.com.br/app/consulta/html/consulta-detalhes-cep.php');
	const response = await fetch(url, init)
		.then((res) => res.json())
		.then((raw) => {
			const resp = raw as ConsultaResponse;

			if (resp.dados.length == 0) {
				return Promise.reject(notFoundError());
			}

			const address: Address = { cep: cep };
			if (resp.dados.length == 1) {
				address.cep = resp.dados[0].cep as string;
				address.state = resp.dados[0].uf as string;
				address.city = resp.dados[0].localidade as string;
				address.neighborhood = resp.dados[0].bairro as string;
				address.location = resp.dados[0].logradouroDNEC as string;
			}

			if (resp.dados.length > 1) {
				address.children = resp.dados.map((item) => {
					return {
						cep: item.cep,
						state: item.uf as string,
						city: item.localidade as string,
						neighborhood: item.bairro as string,
						location: item.logradouroDNEC as string,
					} as Address;
				});
			}

			const init: ResponseInit = {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			};

			return new Response(JSON.stringify(address), init);
		})
		.catch((err) => {
			return Promise.reject(internalServerError(`Unable to fetch CEP ${cep}`, err));
		});

	return response;
});

router.all('*', notFoundError);

export default {
	fetch: router.handle,
};
