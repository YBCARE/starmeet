import { generateOAuthLogo } from './generate-oauth-logo.mjs';

console.log((await generateOAuthLogo()).report);
