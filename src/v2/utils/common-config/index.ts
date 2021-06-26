import dotenv from 'dotenv';

dotenv.config();

export const DATABASE_GATEWAY_ORIGIN = process.env.DATABASE_GATEWAY_ORIGIN || 'https://test.be.freecontest.net';
