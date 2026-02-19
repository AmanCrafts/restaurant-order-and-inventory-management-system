import { defineConfig } from '@prisma/internals';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export default defineConfig({
    datasource: {
        db: {
            provider: 'postgresql',
            url: process.env.DATABASE_URL,
        },
    },
});
