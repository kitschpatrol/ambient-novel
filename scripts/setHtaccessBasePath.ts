import { config } from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables from .env file
config();

const generateHtaccess = async () => {
	const htaccessPath = path.join(process.cwd(), './build/.htaccess');

	try {
		const data = await fs.readFile(htaccessPath, 'utf8');
		const result = data.replace(/{__BASE_PATH__}/g, process.env.BASE_PATH ?? '');
		await fs.writeFile(htaccessPath, result, 'utf8');
		console.log('.htaccess file has been populated with the BASE_PATH from the .env.');
	} catch (err) {
		console.error('Error:', err);
	}
};

generateHtaccess();
